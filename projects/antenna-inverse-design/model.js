/* Antenna inverse-design demo model.
   - Stand-in "EM simulator": analytic stub-loaded line (NOT an EM solver; HFSS is the real one).
   - LHS sampler with the constraints from LHS.py.
   - MLP surrogate (4-32-64-32-K, ReLU) trained with Adam, as in surrogateModel.py.
   - Inverse guess: Adam on the surrogate (as in inverse_model.py).
   - Refinement: simulated-annealing on the stand-in (in the spirit of anneal.py / dual_annealing). */
(function (root) {
  "use strict";
  // design vector x = [stub_x, tlx, stub_y, pos] in mm (names as in LHS.py)
  var NAMES = ["stub_x", "tlx", "stub_y", "pos"];
  var LB = [0.1, 0.1, 0.1, 0.1], UB = [2.8, 3.5, 3.5, 3.5];
  var FREQS = []; for (var f = 20; f <= 40.0001; f += 0.25) FREQS.push(Math.round(f * 100) / 100); // GHz, assumed band
  var NF = FREQS.length;
  var SUB = []; for (var i = 0; i < NF; i += 7) SUB.push(i);   // 12 surrogate outputs (subsampled curve)
  var C0 = 299.792458;   // mm per ns
  var EPS_R = 3.3, H = 0.5, F0 = 28, Q = 2, RL = 35;           // substrate, height (mm), load resonance, Q, R

  function constraintsOK(x) {
    return 2 * x[0] + x[1] >= 0.4 && 2 * x[0] + x[1] <= 3.5 && x[2] + x[3] >= 0.1 && x[2] + x[3] <= 3.9;
  }
  function snap(x) { return x.map(function (v) { return Math.round(v * 10) / 10; }); }
  function clampX(x) { return x.map(function (v, k) { return Math.min(UB[k], Math.max(LB[k], v)); }); }

  // microstrip characteristic impedance (Hammerstad-Jensen), w, h in mm
  function z0Microstrip(w) {
    var u = w / H;
    var ee = (EPS_R + 1) / 2 + (EPS_R - 1) / 2 / Math.sqrt(1 + 12 / u);
    var z = u <= 1 ? 60 / Math.sqrt(ee) * Math.log(8 / u + u / 4)
                   : 120 * Math.PI / (Math.sqrt(ee) * (u + 1.393 + 0.667 * Math.log(u + 1.444)));
    return { z: z, ee: ee };
  }

  // Analytic stand-in: reflection at the feed of a load through a line of length pos and an open stub of length stub_y
  function simulate(x) {
    var sx = x[0], tlx = x[1], sy = x[2], pos = x[3];
    var line = z0Microstrip(tlx), stub = z0Microstrip(Math.max(0.1, sx));
    var out = new Array(NF);
    for (var k = 0; k < NF; k++) {
      var fg = FREQS[k];
      // load: series resonance around F0, reactance grows away from it
      var X = Q * RL * (fg / F0 - F0 / fg);
      var ZL = { re: RL, im: X };
      var beta = 2 * Math.PI * fg * Math.sqrt(line.ee) / C0;     // rad/mm
      var t = Math.tan(beta * pos);
      // Z at distance pos from the load: Z0 (ZL + j Z0 t) / (Z0 + j ZL t)
      var z0 = line.z;
      var nume = { re: ZL.re, im: ZL.im + z0 * t }, den = { re: z0 - ZL.im * t, im: ZL.re * t };
      var zd = cdiv({ re: z0 * nume.re, im: z0 * nume.im }, { re: den.re, im: den.im });
      // open stub admittance j tan(beta_s l)
      var bs = 2 * Math.PI * fg * Math.sqrt(stub.ee) / C0;
      var ys = { re: 0, im: Math.tan(bs * sy) / stub.z };
      var yd = cdiv({ re: 1, im: 0 }, zd);
      var yin = { re: yd.re + ys.re, im: yd.im + ys.im };
      var zin = cdiv({ re: 1, im: 0 }, yin);
      // reflection against the 50 ohm reference
      var num = { re: zin.re - 50, im: zin.im }, dd = { re: zin.re + 50, im: zin.im };
      var g = cdiv(num, dd);
      var mag = Math.sqrt(g.re * g.re + g.im * g.im);
      out[k] = 20 * Math.log10(Math.max(mag, 1e-6));
    }
    return out;
  }
  function cdiv(a, b) { var d = b.re * b.re + b.im * b.im || 1e-30; return { re: (a.re * b.re + a.im * b.im) / d, im: (a.im * b.re - a.re * b.im) / d }; }

  // Target: viewer-chosen dip at fT (GHz) with depth dT (dB, positive), baseline -2 dB
  function targetCurve(fT, dT) {
    var bw = 1.4, out = new Array(NF);
    for (var k = 0; k < NF; k++) {
      var d = FREQS[k] - fT;
      out[k] = -2 - (dT - 2) * (bw * bw) / (d * d + bw * bw);
    }
    return out;
  }
  function rmse(a, b) { var s = 0; for (var k = 0; k < NF; k++) s += (a[k] - b[k]) * (a[k] - b[k]); return Math.sqrt(s / NF); }

  // ---- seeded RNG ----
  function rng(seed) { var s = seed >>> 0; return function () { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }

  // ---- Latin hypercube with constraints (LHS.py) ----
  function lhs(n, rand) {
    var cols = [];
    for (var d = 0; d < 4; d++) {
      var perm = []; for (var i = 0; i < n; i++) perm.push(i);
      for (i = n - 1; i > 0; i--) { var j = Math.floor(rand() * (i + 1)); var t = perm[i]; perm[i] = perm[j]; perm[j] = t; }
      cols.push(perm.map(function (p) { return (p + rand()) / n; }));
    }
    var pts = [];
    for (i = 0; i < n; i++) {
      var x = [0, 0, 0, 0];
      for (d = 0; d < 4; d++) x[d] = LB[d] + cols[d][i] * (UB[d] - LB[d]);
      pts.push(x);
    }
    var ok = pts.filter(constraintsOK).map(snap).filter(constraintsOK);
    // unique at 0.1 mm
    var seen = {}, out = [];
    ok.forEach(function (p) { var k = p.join(","); if (!seen[k]) { seen[k] = 1; out.push(p); } });
    return out;
  }

  // ---- MLP surrogate ----
  function Mlp(sizes, rand) {
    this.sizes = sizes; this.W = []; this.b = [];
    for (var l = 0; l < sizes.length - 1; l++) {
      var fin = sizes[l], fout = sizes[l + 1], w = new Float64Array(fin * fout), bb = new Float64Array(fout);
      var sc = Math.sqrt(2 / fin);
      for (var k = 0; k < w.length; k++) w[k] = (rand() * 2 - 1) * sc;
      this.W.push(w); this.b.push(bb);
    }
  }
  Mlp.prototype.forward = function (x, cache) {
    var a = x, L = this.W.length;
    if (cache) cache.push(a);
    for (var l = 0; l < L; l++) {
      var fin = this.sizes[l], fout = this.sizes[l + 1], w = this.W[l], b = this.b[l], z = new Float64Array(fout);
      for (var o = 0; o < fout; o++) {
        var s = b[o];
        for (var i = 0; i < fin; i++) s += w[o * fin + i] * a[i];
        z[o] = (l < L - 1) ? Math.max(0, s) : s;
      }
      a = z;
      if (cache) cache.push(a);
    }
    return a;
  };
  // Full-batch Adam on MSE, inputs normalised to [0,1], outputs scaled by 1/30 dB
  Mlp.prototype.train = function (X, Y, epochs, lr, onEpoch) {
    var L = this.W.length, m = [], v = [], i, l;
    for (l = 0; l < L; l++) { m.push([new Float64Array(this.W[l].length), new Float64Array(this.b[l].length)]); v.push([new Float64Array(this.W[l].length), new Float64Array(this.b[l].length)]); }
    var N = X.length, b1 = 0.9, b2 = 0.999, eps = 1e-8, step = 0, lossHist = [];
    for (var ep = 0; ep < epochs; ep++) {
      var gW = this.W.map(function (w) { return new Float64Array(w.length); });
      var gB = this.b.map(function (b) { return new Float64Array(b.length); });
      var loss = 0;
      for (var n = 0; n < N; n++) {
        var cache = [];
        var out = this.forward(X[n], cache);
        var delta = new Float64Array(out.length);
        for (var o = 0; o < out.length; o++) { var e = out[o] - Y[n][o]; loss += e * e; delta[o] = 2 * e / (N * out.length); }
        for (l = L - 1; l >= 0; l--) {
          var a = cache[l], fin = this.sizes[l], fout = this.sizes[l + 1], w = this.W[l];
          var dprev = new Float64Array(fin);
          for (o = 0; o < fout; o++) {
            gB[l][o] += delta[o];
            for (i = 0; i < fin; i++) { gW[l][o * fin + i] += delta[o] * a[i]; dprev[i] += delta[o] * w[o * fin + i]; }
          }
          if (l > 0) for (i = 0; i < fin; i++) if (cache[l][i] <= 0) dprev[i] = 0;   // ReLU gate on the layer input
          delta = dprev;
        }
      }
      step++;
      for (l = 0; l < L; l++) {
        for (i = 0; i < this.W[l].length; i++) {
          var g = gW[l][i]; m[l][0][i] = b1 * m[l][0][i] + (1 - b1) * g; v[l][0][i] = b2 * v[l][0][i] + (1 - b2) * g * g;
          this.W[l][i] -= lr * (m[l][0][i] / (1 - Math.pow(b1, step))) / (Math.sqrt(v[l][0][i] / (1 - Math.pow(b2, step))) + eps);
        }
        for (i = 0; i < this.b[l].length; i++) {
          g = gB[l][i]; m[l][1][i] = b1 * m[l][1][i] + (1 - b1) * g; v[l][1][i] = b2 * v[l][1][i] + (1 - b2) * g * g;
          this.b[l][i] -= lr * (m[l][1][i] / (1 - Math.pow(b1, step))) / (Math.sqrt(v[l][1][i] / (1 - Math.pow(b2, step))) + eps);
        }
      }
      lossHist.push(loss / (N * this.sizes[L]));
      if (onEpoch) onEpoch(ep, loss / (N * this.sizes[L]));
    }
    return lossHist;
  };

  // Resumable full-batch Adam trainer (same loss as Mlp.train), so the UI can animate training
  Mlp.prototype.trainer = function (X, Y, lr) {
    var net = this, L = this.W.length, N = X.length, O = this.sizes[L];
    var m = [], v = [], l, i;
    for (l = 0; l < L; l++) { m.push([new Float64Array(this.W[l].length), new Float64Array(this.b[l].length)]); v.push([new Float64Array(this.W[l].length), new Float64Array(this.b[l].length)]); }
    var b1 = 0.9, b2 = 0.999, eps = 1e-8, step = 0;
    return {
      epoch: function () {
        var gW = net.W.map(function (w) { return new Float64Array(w.length); });
        var gB = net.b.map(function (b) { return new Float64Array(b.length); });
        var loss = 0, n, o;
        for (n = 0; n < N; n++) {
          var cache = [];
          var out = net.forward(X[n], cache);
          var delta = new Float64Array(O);
          for (o = 0; o < O; o++) { var e = out[o] - Y[n][o]; loss += e * e; delta[o] = 2 * e / (N * O); }
          for (l = L - 1; l >= 0; l--) {
            var a = cache[l], fin = net.sizes[l], fout = net.sizes[l + 1], w = net.W[l];
            var dprev = new Float64Array(fin);
            for (o = 0; o < fout; o++) {
              gB[l][o] += delta[o];
              for (i = 0; i < fin; i++) { gW[l][o * fin + i] += delta[o] * a[i]; dprev[i] += delta[o] * w[o * fin + i]; }
            }
            if (l > 0) for (i = 0; i < fin; i++) if (cache[l][i] <= 0) dprev[i] = 0;
            delta = dprev;
          }
        }
        step++;
        for (l = 0; l < L; l++) {
          for (i = 0; i < net.W[l].length; i++) {
            var g = gW[l][i]; m[l][0][i] = b1 * m[l][0][i] + (1 - b1) * g; v[l][0][i] = b2 * v[l][0][i] + (1 - b2) * g * g;
            net.W[l][i] -= lr * (m[l][0][i] / (1 - Math.pow(b1, step))) / (Math.sqrt(v[l][0][i] / (1 - Math.pow(b2, step))) + eps);
          }
          for (i = 0; i < net.b[l].length; i++) {
            g = gB[l][i]; m[l][1][i] = b1 * m[l][1][i] + (1 - b1) * g; v[l][1][i] = b2 * v[l][1][i] + (1 - b2) * g * g;
            net.b[l][i] -= lr * (m[l][1][i] / (1 - Math.pow(b1, step))) / (Math.sqrt(v[l][1][i] / (1 - Math.pow(b2, step))) + eps);
          }
        }
        return loss / (N * O);
      }
    };
  };

  function norm(x) { return x.map(function (v, k) { return (v - LB[k]) / (UB[k] - LB[k]); }); }
  function curveSub(c) { return SUB.map(function (k) { return c[k]; }); }

  // surrogate predicts S11 at 12 frequencies (dB/30) from the normalised design
  function Surrogate(samples, rand, epochs) {
    this.net = new Mlp([4, 32, 64, 32, SUB.length], rand);
    this.samples = samples;
    this.X = samples.map(function (s) { return norm(s.x); });
    this.Y = samples.map(function (s) { return curveSub(s.curve).map(function (v) { return v / 30; }); });
    this.epochs = epochs;
  }
  Surrogate.prototype.predict = function (x) {
    return this.net.forward(norm(x)).map(function (v) { return v * 30; });
  };

  // Inverse guess: Adam over the design, gradient by central differences on the surrogate, with a
  // penalty for leaving the box or the LHS constraints (inverse_model.py uses Adam on the same idea)
  function inverseGuess(sur, targetSub, x0, steps, lr, onStep) {
    var x = x0.slice(), m = [0, 0, 0, 0], v = [0, 0, 0, 0], b1 = 0.9, b2 = 0.999, eps = 1e-8;
    function loss(p) {
      var pr = sur.predict(p), s = 0;
      for (var k = 0; k < SUB.length; k++) s += (pr[k] - targetSub[k]) * (pr[k] - targetSub[k]);
      var viol = 0;
      for (var d = 0; d < 4; d++) { viol += Math.max(0, LB[d] - p[d]) + Math.max(0, p[d] - UB[d]); }
      return s / SUB.length + 50 * viol * viol;
    }
    var h = 1e-3;
    for (var t = 1; t <= steps; t++) {
      var g = [];
      for (var d2 = 0; d2 < 4; d2++) {
        var xp = x.slice(), xm = x.slice(); xp[d2] += h; xm[d2] -= h;
        g.push((loss(xp) - loss(xm)) / (2 * h));
      }
      for (var k2 = 0; k2 < 4; k2++) {
        m[k2] = b1 * m[k2] + (1 - b1) * g[k2]; v[k2] = b2 * v[k2] + (1 - b2) * g[k2] * g[k2];
        x[k2] -= lr * (m[k2] / (1 - Math.pow(b1, t))) / (Math.sqrt(v[k2] / (1 - Math.pow(b2, t))) + eps) * (UB[k2] - LB[k2]) * 0.05;
      }
      x = clampX(x);
      if (onStep) onStep(t, x.slice(), loss(x));
    }
    return x;
  }

  // Refinement: annealing on the stand-in simulator. Visiting step proportional to temperature,
  // Metropolis acceptance, geometric cooling, and reheating after stalls (anneal.py uses dual_annealing).
  function Annealer(target, x0, seed) {
    this.rand = rng(seed || 3);
    this.target = target;
    this.cur = snap(clampX(x0));
    if (!constraintsOK(this.cur)) this.cur = repair(this.cur);
    this.curF = rmse(simulate(this.cur), target);
    this.best = this.cur.slice(); this.bestF = this.curF;
    this.T = 1.5; this.iter = 0; this.stall = 0;
  }
  function repair(x) {
    // nudge tlx (then stub_x) until the LHS constraints hold
    var y = x.slice();
    for (var k = 0; k < 40 && !constraintsOK(y); k++) {
      if (2 * y[0] + y[1] < 0.4) y[1] = Math.min(UB[1], y[1] + 0.1);
      else if (2 * y[0] + y[1] > 3.5) y[1] = Math.max(LB[1], y[1] - 0.1);
      if (y[2] + y[3] < 0.1) y[3] = Math.min(UB[3], y[3] + 0.1);
      if (y[2] + y[3] > 3.9) y[3] = Math.max(LB[3], y[3] - 0.1);
    }
    return snap(y);
  }
  Annealer.prototype.step = function () {
    this.iter++;
    var scale = Math.max(0.05, Math.min(1, this.T / 1.5));
    var cand = this.cur.map(function (v, k) {
      // heavy-tailed visiting: Cauchy-like jumps, occasionally large
      var u = this.rand() - 0.5, c = Math.tan(Math.PI * u);
      return v + c * scale * (UB[k] - LB[k]) * 0.12;
    }, this);
    cand = snap(clampX(cand));
    if (!constraintsOK(cand)) cand = repair(cand);
    var f = rmse(simulate(cand), this.target);
    var accept = f < this.curF || this.rand() < Math.exp(-(f - this.curF) / Math.max(this.T, 1e-3));
    if (accept) { this.cur = cand; this.curF = f; }
    if (f < this.bestF - 1e-9) { this.bestF = f; this.best = cand.slice(); this.stall = 0; }
    else this.stall++;
    this.T *= 0.985;
    if (this.stall > 40) { this.T = 1.2; this.stall = 0; this.cur = this.best.slice(); this.curF = this.bestF; } // reheat from best
    return { x: cand, f: f, accepted: accept, best: this.best.slice(), bestF: this.bestF, T: this.T, iter: this.iter };
  };

  var API = {
    NAMES: NAMES, LB: LB, UB: UB, FREQS: FREQS, NF: NF, SUB: SUB,
    simulate: simulate, targetCurve: targetCurve, rmse: rmse, constraintsOK: constraintsOK, snap: snap, clampX: clampX,
    rng: rng, lhs: lhs, Mlp: Mlp, Surrogate: Surrogate, inverseGuess: inverseGuess, Annealer: Annealer, repair: repair,
    z0Microstrip: z0Microstrip
  };
  if (typeof module !== "undefined" && module.exports) module.exports = API;
  else root.AntennaModel = API;
})(typeof self !== "undefined" ? self : this);

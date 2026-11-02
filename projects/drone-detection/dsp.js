/* Drone DSP: GCC-PHAT, SRP-PHAT and delay-and-sum scan, FastICA, Kalman smoothing.
   Pure functions, no DOM. Shared by the in-browser demo and checked with node. */
(function (root) {
  "use strict";
  var C = 343; // speed of sound, m/s (SimulatedScenario.py / constants.py)

  // ---------- radix-2 FFT (in place) ----------
  function fft(re, im, inv) {
    var n = re.length, i, j, k, len, ang, wr, wi, ur, ui, vr, vi, tr, ti;
    for (i = 1, j = 0; i < n; i++) {
      var bit = n >> 1;
      for (; j & bit; bit >>= 1) j ^= bit;
      j ^= bit;
      if (i < j) {
        tr = re[i]; re[i] = re[j]; re[j] = tr;
        ti = im[i]; im[i] = im[j]; im[j] = ti;
      }
    }
    for (len = 2; len <= n; len <<= 1) {
      ang = 2 * Math.PI / len * (inv ? 1 : -1);
      var half = len >> 1;
      for (i = 0; i < n; i += len) {
        for (k = 0; k < half; k++) {
          wr = Math.cos(ang * k); wi = Math.sin(ang * k);
          var a = i + k, b = a + half;
          vr = re[b] * wr - im[b] * wi;
          vi = re[b] * wi + im[b] * wr;
          ur = re[a]; ui = im[a];
          re[a] = ur + vr; im[a] = ui + vi;
          re[b] = ur - vr; im[b] = ui - vi;
        }
      }
    }
    if (inv) for (i = 0; i < n; i++) { re[i] /= n; im[i] /= n; }
  }

  // ---------- GCC-PHAT ----------
  // Returns {lags: Float64Array(2*maxLag+1), tau: fractional lag (samples)}.
  // Convention: lag k > 0 means x is a delayed copy of y by k samples
  // (x[n] ~ y[n-k]). Peak is parabolically interpolated.
  function gccPhat(x, y, maxLag) {
    var N = x.length, nfft = 1;
    while (nfft < 2 * N) nfft <<= 1;
    var xr = new Float64Array(nfft), xi = new Float64Array(nfft);
    var yr = new Float64Array(nfft), yi = new Float64Array(nfft);
    for (var i = 0; i < N; i++) { xr[i] = x[i]; yr[i] = y[i]; }
    fft(xr, xi, false); fft(yr, yi, false);
    for (i = 0; i < nfft; i++) {
      // X * conj(Y), PHAT weighting
      var gr = xr[i] * yr[i] + xi[i] * yi[i];
      var gi = xi[i] * yr[i] - xr[i] * yi[i];
      var m = Math.sqrt(gr * gr + gi * gi) + 1e-12;
      xr[i] = gr / m; xi[i] = gi / m;
    }
    fft(xr, xi, true);
    var lags = new Float64Array(2 * maxLag + 1);
    for (var k = -maxLag; k <= maxLag; k++) {
      lags[k + maxLag] = xr[(k + nfft) % nfft];
    }
    // integer peak then parabolic refinement
    var best = 0, bv = -Infinity;
    for (k = 0; k <= 2 * maxLag; k++) if (lags[k] > bv) { bv = lags[k]; best = k; }
    var tau = best - maxLag;
    if (best > 0 && best < 2 * maxLag) {
      var a = lags[best - 1], b = lags[best], c = lags[best + 1];
      var den = a - 2 * b + c;
      if (Math.abs(den) > 1e-12) tau += 0.5 * (a - c) / den;
    }
    return { lags: lags, tau: tau, peak: bv };
  }

  // value of a lag-correlation array at fractional lag (linear interp)
  function sampleLag(arr, maxLag, tau) {
    var t = tau + maxLag;
    if (t <= 0) return arr[0];
    if (t >= arr.length - 1) return arr[arr.length - 1];
    var i0 = Math.floor(t), f = t - i0;
    return arr[i0] * (1 - f) + arr[i0 + 1] * f;
  }

  // ---------- geometry ----------
  // Far-field arrival offset (seconds) of a plane wave from azimuth thetaDeg, per mic.
  // A wave from direction u reaches mics closer to the source earlier: d_m = -(p_m . u)/c.
  function farFieldOffsets(micPos, thetaDeg) {
    var th = thetaDeg * Math.PI / 180, ux = Math.cos(th), uy = Math.sin(th);
    var out = new Float64Array(micPos.length);
    for (var m = 0; m < micPos.length; m++) out[m] = -(micPos[m][0] * ux + micPos[m][1] * uy) / C;
    return out;
  }

  // ---------- SRP-PHAT direction scan ----------
  // Sum of GCC-PHAT values at the lags each pair would have for direction theta.
  // gcc: array of {i, j, lags}, maxLag in samples. Returns {scan (per deg), best}.
  function srpScan(pairs, micPos, fs, maxLag, stepDeg) {
    stepDeg = stepDeg || 1;
    var n = Math.round(360 / stepDeg), scan = new Float64Array(n);
    for (var a = 0; a < n; a++) {
      var off = farFieldOffsets(micPos, a * stepDeg);
      var s = 0;
      for (var p = 0; p < pairs.length; p++) {
        var pr = pairs[p];
        // lag of mic i relative to mic j, in samples
        var tauS = (off[pr.i] - off[pr.j]) * fs;
        s += sampleLag(pr.lags, maxLag, tauS);
      }
      scan[a] = s;
    }
    var best = 0;
    for (a = 1; a < n; a++) if (scan[a] > scan[best]) best = a;
    return { scan: scan, best: best * stepDeg, bestValue: scan[best] };
  }

  // ---------- filters ----------
  // zero-phase band-pass by FFT mask (applied once per analysis window, commutes with shifts)
  function bandpassFFT(x, fs, lo, hi) {
    var N = x.length, nfft = 1;
    while (nfft < N) nfft <<= 1;
    var re = new Float64Array(nfft), im = new Float64Array(nfft);
    for (var i = 0; i < N; i++) re[i] = x[i];
    fft(re, im, false);
    for (var k = 0; k < nfft; k++) {
      var f = (k <= nfft / 2 ? k : nfft - k) * fs / nfft;
      if (f < lo || f > hi) { re[k] = 0; im[k] = 0; }
    }
    fft(re, im, true);
    return re.subarray(0, N);
  }

  // ---------- delay-and-sum energy scan (SimulatedScenario.delay_and_sum_beamforming) ----------
  // chans: array of filtered mic signals. Integer compensation, mean, then 1-D Kalman.
  function dasEnergy(chans, micPos, fs, thetaDeg, Q, R) {
    var M = chans.length, N = chans[0].length;
    var off = farFieldOffsets(micPos, thetaDeg);
    var mn = Infinity;
    for (var m = 0; m < M; m++) if (off[m] < mn) mn = off[m];
    var out = new Float64Array(N);
    for (m = 0; m < M; m++) {
      var d = Math.round((off[m] - mn) * fs); // positive = mic hears it later; compensate by advancing
      var src = chans[m];
      for (var n = 0; n < N; n++) {
        var idx = n + d;
        if (idx < N) out[n] += src[idx] / M;
      }
    }
    var energy = kalmanEnergy(out, Q, R);
    return energy;
  }

  // Steered output power (mean square of the delay-and-sum output). Same alignment as dasEnergy.
  function dasPower(chans, micPos, fs, thetaDeg) {
    var M = chans.length, N = chans[0].length;
    var off = farFieldOffsets(micPos, thetaDeg);
    var mn = Infinity, m, n;
    for (m = 0; m < M; m++) if (off[m] < mn) mn = off[m];
    var out = new Float64Array(N);
    for (m = 0; m < M; m++) {
      var d = Math.round((off[m] - mn) * fs), src = chans[m];
      for (n = 0; n + d < N; n++) out[n] += src[n + d] / M;
    }
    var p = 0;
    for (n = 0; n < N; n++) p += out[n] * out[n];
    return p / N;
  }

  // 1-D Kalman smoothing (SimulatedScenario.kalman_filter), returns sum of squared smoothed output
  function kalmanEnergy(z, Q, R) {
    var xhat = z[0], P = 1.0, e = 0;
    e += xhat * xhat;
    for (var k = 1; k < z.length; k++) {
      var xm = xhat, Pm = P + Q;
      var K = Pm / (Pm + R);
      xhat = xm + K * (z[k] - xm);
      P = (1 - K) * Pm;
      e += xhat * xhat;
    }
    return e;
  }

  // ---------- FastICA (symmetric, tanh / logcosh) ----------
  // X: array of M channels (length N). Returns {S: nComp arrays, W, A}
  function jacobiEig(A) {
    var n = A.length, a = [], v = [], i, j, k;
    for (i = 0; i < n; i++) { a.push(Float64Array.from(A[i])); v.push(new Float64Array(n)); v[i][i] = 1; }
    for (var sweep = 0; sweep < 60; sweep++) {
      var off = 0;
      for (i = 0; i < n; i++) for (j = i + 1; j < n; j++) off += a[i][j] * a[i][j];
      if (off < 1e-20) break;
      for (var p = 0; p < n; p++) for (var q = p + 1; q < n; q++) {
        if (Math.abs(a[p][q]) < 1e-30) continue;
        var theta = (a[q][q] - a[p][p]) / (2 * a[p][q]);
        var t = (theta >= 0 ? 1 : -1) / (Math.abs(theta) + Math.sqrt(theta * theta + 1));
        var c = 1 / Math.sqrt(t * t + 1), s = t * c;
        for (k = 0; k < n; k++) {
          var akp = a[k][p], akq = a[k][q];
          a[k][p] = c * akp - s * akq; a[k][q] = s * akp + c * akq;
        }
        for (k = 0; k < n; k++) {
          var apk = a[p][k], aqk = a[q][k];
          a[p][k] = c * apk - s * aqk; a[q][k] = s * apk + c * aqk;
        }
        for (k = 0; k < n; k++) {
          var vkp = v[k][p], vkq = v[k][q];
          v[k][p] = c * vkp - s * vkq; v[k][q] = s * vkp + c * vkq;
        }
      }
    }
    var vals = [], idx = [];
    for (i = 0; i < n; i++) { vals.push(a[i][i]); idx.push(i); }
    idx.sort(function (x, y) { return vals[y] - vals[x]; });
    return { values: idx.map(function (i) { return vals[i]; }), vectors: idx.map(function (i) { return v.map(function (row) { return row[i]; }); }) };
    // vectors[k] is eigenvector k (column of v)
  }

  function fastICA(X, nComp, opts) {
    opts = opts || {};
    var maxIter = opts.maxIter || 200, tol = opts.tol || 1e-6;
    var M = X.length, N = X[0].length, i, j, k;
    // center
    var mean = new Float64Array(M), Xc = [];
    for (i = 0; i < M; i++) { var s = 0; for (j = 0; j < N; j++) s += X[i][j]; mean[i] = s / N; }
    for (i = 0; i < M; i++) { var row = new Float64Array(N); for (j = 0; j < N; j++) row[j] = X[i][j] - mean[i]; Xc.push(row); }
    // covariance and whitening
    var Cov = [];
    for (i = 0; i < M; i++) { Cov.push(new Float64Array(M)); }
    for (i = 0; i < M; i++) for (k = i; k < M; k++) {
      var acc = 0; for (j = 0; j < N; j++) acc += Xc[i][j] * Xc[k][j];
      Cov[i][k] = Cov[k][i] = acc / N;
    }
    var eig = jacobiEig(Cov);
    var Wh = []; // whitening rows: (1/sqrt(l)) e^T
    for (k = 0; k < nComp; k++) {
      var l = Math.max(eig.values[k], 1e-12), ev = eig.vectors[k], row2 = new Float64Array(M);
      for (i = 0; i < M; i++) row2[i] = ev[i] / Math.sqrt(l);
      Wh.push(row2);
    }
    var Z = [];
    for (k = 0; k < nComp; k++) {
      var z = new Float64Array(N);
      for (j = 0; j < N; j++) { var sum = 0; for (i = 0; i < M; i++) sum += Wh[k][i] * Xc[i][j]; z[j] = sum; }
      Z.push(z);
    }
    // symmetric FastICA with g = tanh
    var W = [];
    for (i = 0; i < nComp; i++) { var wr = new Float64Array(nComp); for (j = 0; j < nComp; j++) wr[j] = (i === j ? 1 : 0) + 0.01 * Math.sin(7 * i + 3 * j + 1); W.push(wr); }
    W = symDecorrelate(W);
    for (var it = 0; it < maxIter; it++) {
      var Wold = W.map(function (r) { return Float64Array.from(r); });
      var Wn = [];
      for (i = 0; i < nComp; i++) {
        var nr = new Float64Array(nComp), gp = 0;
        for (j = 0; j < N; j++) {
          var u = 0;
          for (k = 0; k < nComp; k++) u += W[i][k] * Z[k][j];
          var g = Math.tanh(u);
          gp += 1 - g * g;
          for (k = 0; k < nComp; k++) nr[k] += Z[k][j] * g;
        }
        for (k = 0; k < nComp; k++) nr[k] = nr[k] / N - (gp / N) * W[i][k];
        Wn.push(nr);
      }
      W = symDecorrelate(Wn);
      var lim = 0;
      for (i = 0; i < nComp; i++) {
        var d = 0; for (k = 0; k < nComp; k++) d += W[i][k] * Wold[i][k];
        lim = Math.max(lim, Math.abs(Math.abs(d) - 1));
      }
      if (lim < tol) break;
    }
    // sources S = W * Z
    var S = [];
    for (i = 0; i < nComp; i++) {
      var sv = new Float64Array(N);
      for (j = 0; j < N; j++) { var t2 = 0; for (k = 0; k < nComp; k++) t2 += W[i][k] * Z[k][j]; sv[j] = t2; }
      S.push(sv);
    }
    return { S: S, W: W, Wh: Wh };
  }

  // W <- (W W^T)^(-1/2) W, computed with 2x2/nxn Jacobi
  function symDecorrelate(W) {
    var n = W.length, WWt = [], i, j, k;
    for (i = 0; i < n; i++) { WWt.push(new Float64Array(n)); }
    for (i = 0; i < n; i++) for (j = 0; j < n; j++) { var s = 0; for (k = 0; k < W[0].length; k++) s += W[i][k] * W[j][k]; WWt[i][j] = s; }
    var eg = jacobiEig(WWt), out = [];
    // (WWt)^(-1/2) = V diag(1/sqrt(l)) V^T
    var Inv = [];
    for (i = 0; i < n; i++) Inv.push(new Float64Array(n));
    for (k = 0; k < n; k++) {
      var l = Math.max(eg.values[k], 1e-12), v = eg.vectors[k], f = 1 / Math.sqrt(l);
      for (i = 0; i < n; i++) for (j = 0; j < n; j++) Inv[i][j] += f * v[i] * v[j];
    }
    for (i = 0; i < n; i++) {
      var r = new Float64Array(W[0].length);
      for (k = 0; k < n; k++) for (j = 0; j < W[0].length; j++) r[j] += Inv[i][k] * W[k][j];
      out.push(r);
    }
    return out;
  }

  var API = {
    C: C, fft: fft, gccPhat: gccPhat, sampleLag: sampleLag, farFieldOffsets: farFieldOffsets,
    srpScan: srpScan, bandpassFFT: bandpassFFT, dasEnergy: dasEnergy, dasPower: dasPower, kalmanEnergy: kalmanEnergy,
    fastICA: fastICA, jacobiEig: jacobiEig
  };
  if (typeof module !== "undefined" && module.exports) module.exports = API;
  else root.DroneDSP = API;
})(typeof self !== "undefined" ? self : this);

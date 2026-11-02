/* Live drone-detection demo: 4-mic capture -> GCC-PHAT -> SRP direction -> steered energy
   detector -> FastICA separation. Runs on a synthetic scene (see scene.js). */
(function () {
  "use strict";
  var D = window.DroneDSP, S = window.DroneScene;
  var canvas = document.getElementById("c");
  var ctx = canvas.getContext("2d");

  // ---- scene setup (mirrors Simulator/helper.py and SimulatedScenario.py choices) ----
  var FS = 12000;            // demo rate; drone tones (1-5 kHz) sit below the 6 kHz Nyquist
  var W = 2048;              // analysis window, 170 ms (SimulatedScenario uses 1 s frames at 33 kHz)
  var MAXLAG = 12;           // +/-1 ms, larger than the array's 0.58 ms max delay
  var MICS = [[0.1, 0], [0, 0.1], [-0.1, 0], [0, -0.1]];   // 4 mics, 10 cm radius
  var NOISE_HOME = [-9, -4];
  var BAND = [800, 1700];    // detector band from SimulatedScenario.bandpass_filter
  var ANALYSE_EVERY = 0.12;  // seconds of scene time between analyses
  var ORBIT = { w: 0.12, c: 14, a: 8, wr: 0.11 };

  var state = {
    t: 0, sample: 0, paused: false, manual: false, drone: [0, 0], noise: NOISE_HOME.slice(),
    trail: [], est: null, res: null, speed: 1, dragging: null, ready: false
  };
  var droneOrbit = function (t) {
    var phi = ORBIT.w * t + 0.5, r = ORBIT.c + ORBIT.a * Math.sin(ORBIT.wr * t);
    return [r * Math.cos(phi), r * Math.sin(phi)];
  };
  var scene = new S.Scene({
    fs: FS, mics: MICS, noisePos: state.noise, seed: 11, noiseGain: 0.3, droneGain: 1,
    dronePos: function (t) { return state.manual ? state.drone : droneOrbit(t); }
  });
  // Buffers: last W samples per mic
  var buf = MICS.map(function () { return new Float64Array(W); });
  var nextAnalysis = 0;

  // ---- calibration: Youden's J on synthetic trials, as in SimulatedScenario.plotDiagnosticDiagrams ----
  var thr = 1, calib = { tpr: 0, fpr: 0 };
  function calibrate() {
    var calRand = S.rng(99), pos = [], neg = [], k, i;
    var calScene = new S.Scene({ fs: FS, mics: MICS, noisePos: NOISE_HOME, seed: 5, noiseGain: 0.3,
      dronePos: function () { return calPos; } });
    var calPos = [0, 0];
    var sc2 = calScene;
    var trials = 30;
    for (k = 0; k < trials; k++) {
      var present = k % 2 === 0, ang = calRand() * 2 * Math.PI, rr = 5 + 20 * calRand();
      calPos = [rr * Math.cos(ang), rr * Math.sin(ang)];
      var X = sc2.render(calRand() * 100, W, { drone: present });
      var B = X.map(function (x) { return D.bandpassFFT(x, FS, BAND[0], BAND[1]); });
      var best = 0;
      for (i = 0; i < 360; i += 2) best = Math.max(best, D.dasPower(B, MICS, FS, i));
      (present ? pos : neg).push(best);
    }
    // Youden J over candidate thresholds
    var cands = pos.concat(neg).sort(function (a, b) { return a - b; }), bestJ = -2, bestT = cands[0];
    cands.forEach(function (c) {
      var tp = pos.filter(function (v) { return v > c; }).length / pos.length;
      var fp = neg.filter(function (v) { return v > c; }).length / neg.length;
      if (tp - fp > bestJ) { bestJ = tp - fp; bestT = c; calib = { tpr: tp, fpr: fp }; }
    });
    thr = bestT;
  }

  // ---- reference level at 1 m, for the range estimate (Source.py: level falls 20 log10 d) ----
  var refPow = 1;
  function calibrateRange() {
    var ref = new S.Scene({ fs: FS, mics: [[0, 0]], noisePos: [0, 0], noiseGain: 0, sensor: 0,
      dronePos: function () { return [1, 0]; } });
    var X = ref.render(0, 4096, { noise: false, noSensor: true })[0];
    var B = D.bandpassFFT(X, FS, BAND[0], BAND[1]), p = 0;
    for (var i = 0; i < B.length; i++) p += B[i] * B[i];
    refPow = p / B.length;
  }

  // ---- analysis ----
  var trueDrone = null;
  function analyse() {
    var X = buf;
    var B = X.map(function (x) { return D.bandpassFFT(x, FS, BAND[0], BAND[1]); });
    // GCC-PHAT on broadband mic signals, all 6 pairs
    var pairs = [], i, j;
    for (i = 0; i < 4; i++) for (j = i + 1; j < 4; j++) {
      var g = D.gccPhat(X[i], X[j], MAXLAG);
      pairs.push({ i: i, j: j, lags: g.lags, tau: g.tau });
    }
    var srp = D.srpScan(pairs, MICS, FS, MAXLAG, 1);
    // steered energy scan in the detector band
    var dasScan = new Float64Array(360), eMax = -1, eArg = 0;
    for (var a = 0; a < 360; a++) {
      var e = D.dasPower(B, MICS, FS, a);
      dasScan[a] = e;
      if (e > eMax) { eMax = e; eArg = a; }
    }
    var margin = 10 * Math.log10(Math.max(eMax, 1e-30) / thr);   // dB above threshold
    var conf = 1 / (1 + Math.exp(-margin / 8));           // display logistic, 50% at the threshold
    var detected = eMax > thr;
    // range from level: power in band falls as 1/d^2 (amplitude 1/d, Source.py)
    var pw = 0;
    for (var m = 0; m < 4; m++) for (var n = 0; n < W; n++) pw += B[m][n] * B[m][n];
    pw /= (4 * W);
    var rangeEst = Math.min(60, Math.sqrt(refPow / Math.max(pw, 1e-12)));
    // ICA on the four raw channels (ICA.py: FastICA on mic channels, 2 components here)
    var ica = D.fastICA(X, 2, { maxIter: 150 });
    // ground truth for the diagnostic readout only
    var truthD = scene.render(state.t - W / FS, W, { noise: false, noSensor: true })[0];
    var truthN = scene.render(state.t - W / FS, W, { drone: false, noSensor: true })[0];
    var icaCorr = ica.S.map(function (s) {
      return [Math.abs(corr(s, truthD)), Math.abs(corr(s, truthN))];
    });
    var dIdx = icaCorr[0][0] >= icaCorr[1][0] ? 0 : 1;
    var nIdx = 1 - dIdx;
    var doa = srp.best;
    var truthAng = state.manual ? angOf(state.drone) : angOf(droneOrbit(state.t));
    var truthR = Math.hypot(state.manual ? state.drone[0] : droneOrbit(state.t)[0], state.manual ? state.drone[1] : droneOrbit(state.t)[1]);
    state.res = {
      pairs: pairs.map(function (p) { return { i: p.i, j: p.j, tau: p.tau / FS * 1e6 }; }),
      srp: srp.scan, doa: doa, dasScan: dasScan, eMax: eMax, eArg: eArg, thr: thr,
      conf: conf, detected: detected, range: rangeEst,
      truthAng: truthAng, truthR: truthR,
      ica: ica.S, icaCorr: icaCorr, dIdx: dIdx, nIdx: nIdx
    };
    // smoothed position estimate (exponential smoothing on the unit vector)
    var ex = Math.cos(doa * Math.PI / 180) * rangeEst, ey = Math.sin(doa * Math.PI / 180) * rangeEst;
    if (!state.est) state.est = [ex, ey];
    else state.est = [state.est[0] * 0.6 + ex * 0.4, state.est[1] * 0.6 + ey * 0.4];
    state.trail.push({ x: state.est[0], y: state.est[1], det: detected });
    if (state.trail.length > 70) state.trail.shift();
  }
  function angOf(p) { var a = Math.atan2(p[1], p[0]) * 180 / Math.PI; return (a + 360) % 360; }
  function corr(a, b) {
    var n = a.length, ma = 0, mb = 0, i;
    for (i = 0; i < n; i++) { ma += a[i]; mb += b[i]; }
    ma /= n; mb /= n;
    var s = 0, na = 0, nb = 0;
    for (i = 0; i < n; i++) { var x = a[i] - ma, y = b[i] - mb; s += x * y; na += x * x; nb += y * y; }
    return s / Math.sqrt(na * nb + 1e-30);
  }

  // ---- stepping the scene forward ----
  function advance(dt) {
    var k = Math.round(dt * FS);
    if (k <= 0) return;
    scene.noisePos = state.noise;
    var t0 = state.sample / FS;
    var block = scene.render(t0, k);
    for (var m = 0; m < 4; m++) {
      buf[m].copyWithin(0, k);
      buf[m].set(block[m], W - k);
    }
    state.sample += k;
    state.t = state.sample / FS;
  }

  // ---- layout ----
  var dpr = 1, CW = 640, CH = 400;
  function resize() {
    CW = Math.max(200, canvas.clientWidth || window.innerWidth); CH = Math.max(160, canvas.clientHeight || window.innerHeight);
    dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.round(CW * dpr); canvas.height = Math.round(CH * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  function layout() {
    var head = CH < 220 ? 16 : 22, foot = CH < 220 ? 14 : 18, pad = Math.max(4, Math.min(CW, CH) * 0.012);
    var top = head, body = CH - head - foot;
    var L = {};
    if (CW >= CH * 1.05) {
      var mw = CW * 0.54;
      L.map = { x: pad, y: top + pad, w: mw - pad * 1.5, h: body - pad * 2 };
      var rx = mw + pad * 0.5, rw = CW - rx - pad;
      L.conf = { x: rx, y: top + pad, w: rw, h: Math.max(40, Math.min(48, body * 0.17)) };
      var eh = Math.max(50, body * 0.3);
      L.energy = { x: rx, y: L.conf.y + L.conf.h + pad, w: rw, h: eh };
      var wy = L.energy.y + eh + pad;
      L.waves = { x: rx, y: wy, w: rw, h: top + body - pad - wy };
    } else {
      var mh = body * 0.5;
      L.map = { x: pad, y: top + pad, w: CW - pad * 2, h: mh - pad * 1.5 };
      var y2 = top + mh;
      L.conf = { x: pad, y: y2, w: CW - pad * 2, h: Math.max(40, Math.min(46, body * 0.12)) };
      L.energy = { x: pad, y: y2 + L.conf.h + pad * 0.5, w: CW - pad * 2, h: Math.max(40, body * 0.14) };
      var wy2 = L.energy.y + L.energy.h + pad * 0.5;
      L.waves = { x: pad, y: wy2, w: CW - pad * 2, h: top + body - pad - wy2 };
    }
    L.head = { x: 0, y: 0, w: CW, h: head };
    L.foot = { x: 0, y: CH - foot, w: CW, h: foot };
    return L;
  }

  function fontPx(L) { return Math.max(9, Math.min(13, Math.min(CW, CH) / 34)); }

  // map: world meters to px
  var MAP_RANGE = 26;
  function toPx(r, x, y) {
    var s = Math.min(r.w, r.h) / (2 * MAP_RANGE);
    return [r.x + r.w / 2 + x * s, r.y + r.h / 2 - y * s, s];
  }
  function fromPx(r, px, py) {
    var s = Math.min(r.w, r.h) / (2 * MAP_RANGE);
    return [(px - (r.x + r.w / 2)) / s, -(py - (r.y + r.h / 2)) / s];
  }

  function drawMap(r, f) {
    var R = r;
    ctx.save();
    ctx.beginPath(); ctx.rect(R.x, R.y, R.w, R.h); ctx.clip();
    ctx.fillStyle = "#0c1118"; ctx.fillRect(R.x, R.y, R.w, R.h);
    // range rings
    ctx.strokeStyle = "#1d2a38"; ctx.lineWidth = 1; ctx.fillStyle = "#4d6073";
    ctx.font = f + "px 'IBM Plex Mono', monospace";
    [5, 10, 20].forEach(function (m) {
      var c = toPx(R, 0, 0), rad = m * c[2];
      ctx.beginPath(); ctx.arc(c[0], c[1], rad, 0, Math.PI * 2); ctx.stroke();
      ctx.fillText(m + "m", c[0] + rad * 0.72 + 2, c[1] - rad * 0.72 - 2);
    });
    // axes
    var o = toPx(R, 0, 0);
    ctx.beginPath(); ctx.moveTo(R.x, o[1]); ctx.lineTo(R.x + R.w, o[1]); ctx.moveTo(o[0], R.y); ctx.lineTo(o[0], R.y + R.h); ctx.stroke();
    // steering-scan ring: SRP peak direction
    var res = state.res;
    if (res) {
      var ang = res.doa * Math.PI / 180, far = MAP_RANGE * 1.2;
      var p1 = toPx(R, Math.cos(ang) * far, Math.sin(ang) * far);
      ctx.strokeStyle = res.detected ? "rgba(88,225,255,0.45)" : "rgba(255,93,93,0.35)";
      ctx.setLineDash([4, 4]);
      ctx.beginPath(); ctx.moveTo(o[0], o[1]); ctx.lineTo(p1[0], p1[1]); ctx.stroke();
      ctx.setLineDash([]);
    }
    // trail
    state.trail.forEach(function (p, i) {
      var q = toPx(R, p.x, p.y), a = (i + 1) / state.trail.length;
      ctx.fillStyle = "rgba(88,225,255," + (0.08 + 0.5 * a).toFixed(3) + ")";
      ctx.beginPath(); ctx.arc(q[0], q[1], 1.6, 0, Math.PI * 2); ctx.fill();
    });
    // noise source
    var nq = toPx(R, state.noise[0], state.noise[1]);
    ctx.strokeStyle = "#ff5d5d"; ctx.lineWidth = 2;
    var s = 4.5 * dpr * 0.5 + 3;
    ctx.beginPath(); ctx.moveTo(nq[0] - s, nq[1] - s); ctx.lineTo(nq[0] + s, nq[1] + s);
    ctx.moveTo(nq[0] + s, nq[1] - s); ctx.lineTo(nq[0] - s, nq[1] + s); ctx.stroke();
    ctx.fillStyle = "#ff8a8a"; ctx.fillText(CW < 400 ? "noise" : "noise (not a drone)", nq[0] + 7, nq[1] + 4);
    // true drone
    var dp = state.manual ? state.drone : droneOrbit(state.t);
    var dq = toPx(R, dp[0], dp[1]);
    ctx.fillStyle = "#a6ff5c";
    ctx.beginPath(); ctx.arc(dq[0], dq[1], 5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#a6ff5c";
    var flip = dq[0] > R.x + R.w - 80;
    ctx.textAlign = flip ? "right" : "left";
    ctx.fillText("drone (true)", dq[0] + (flip ? -8 : 8), dq[1] + 4);
    ctx.textAlign = "left";
    // estimate
    if (state.est) {
      var eq = toPx(R, state.est[0], state.est[1]);
      ctx.strokeStyle = res && res.detected ? "#58e1ff" : "#6b7a8c"; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(eq[0], eq[1], 8, 0, Math.PI * 2); ctx.stroke();
    }
    // array
    var arr = MICS.map(function (m) { return toPx(R, m[0] * 1.5, m[1] * 1.5); });
    ctx.fillStyle = "#ffb547";
    arr.forEach(function (q, i) { ctx.beginPath(); ctx.arc(q[0], q[1], 3, 0, Math.PI * 2); ctx.fill(); });
    ctx.fillText("array 10 cm", o[0] + 6, o[1] + 12);
    ctx.restore();
    // label
    ctx.fillStyle = "#6b7a8c"; ctx.font = f + "px 'IBM Plex Mono', monospace";
    ctx.fillText("MAP  m", R.x + 4, R.y + f + 2);
  }

  function drawConf(r, f) {
    var res = state.res, F = "'IBM Plex Mono', monospace";
    var c = res ? res.conf : 0;
    ctx.font = f + "px " + F; ctx.fillStyle = "#6b7a8c";
    var narrowC = r.w < 230;
    ctx.textAlign = "left"; ctx.fillText(narrowC ? "CONFIDENCE" : "DRONE CONFIDENCE", r.x, r.y + f);
    ctx.textAlign = "right"; ctx.fillStyle = res && res.detected ? "#58e1ff" : "#d4f2dd";
    ctx.font = (f + 1) + "px " + F;
    ctx.fillText(res ? Math.round(c * 100) + "%  " + (res.detected ? "DRONE" : "no drone") : "warming up", r.x + r.w, r.y + f);
    ctx.textAlign = "left";
    var by = r.y + f * 1.5, bh = Math.max(8, Math.min(14, f * 0.9));
    ctx.fillStyle = "#11171f"; ctx.fillRect(r.x, by, r.w, bh);
    ctx.fillStyle = res && res.detected ? "#58e1ff" : "#3c4a5a";
    ctx.fillRect(r.x, by, r.w * c, bh);
    ctx.strokeStyle = "#26313f"; ctx.strokeRect(r.x + 0.5, by + 0.5, r.w - 1, bh - 1);
    ctx.fillStyle = "#ffb547"; ctx.fillRect(r.x + r.w * 0.5 - 1, by - 2, 2, bh + 4);
    ctx.fillStyle = "#6b7a8c"; ctx.font = (f - 1) + "px " + F;
    if (!narrowC) ctx.fillText("margin " + (res ? (10 * Math.log10(Math.max(res.eMax, 1e-30) / res.thr)).toFixed(1) : "-") + " dB vs threshold (tick = 50%)", r.x, by + bh + f * 1.1);
  }

  function drawEnergy(r, f) {
    var res = state.res;
    ctx.fillStyle = "#6b7a8c"; ctx.font = f + "px 'IBM Plex Mono', monospace";
    ctx.fillText("ENERGY vs DIRECTION", r.x, r.y + f);
    var x0 = r.x + 2, y0 = r.y + f * 1.6, w = r.w - 4, h = r.h - f * 2.2;
    ctx.fillStyle = "#0c1118"; ctx.fillRect(x0, y0, w, h);
    if (!res) return;
    var top = Math.max(res.eMax, res.thr) * 1.1;
    var yOf = function (v) { return y0 + h - Math.min(1, v / top) * h; };
    // threshold line
    ctx.strokeStyle = "#ffb547"; ctx.setLineDash([3, 3]);
    ctx.beginPath(); ctx.moveTo(x0, yOf(res.thr)); ctx.lineTo(x0 + w, yOf(res.thr)); ctx.stroke();
    ctx.setLineDash([]);
    ctx.strokeStyle = "#58e1ff"; ctx.lineWidth = 1.5; ctx.beginPath();
    for (var a = 0; a < 360; a++) {
      var px = x0 + w * a / 359, py = yOf(res.dasScan[a]);
      if (a === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.stroke(); ctx.lineWidth = 1;
    // true direction tick
    var tx = x0 + w * res.truthAng / 359;
    ctx.strokeStyle = "rgba(166,255,92,0.7)"; ctx.beginPath(); ctx.moveTo(tx, y0); ctx.lineTo(tx, y0 + h); ctx.stroke();
    var ex = x0 + w * res.eArg / 359;
    ctx.fillStyle = "#58e1ff"; ctx.beginPath(); ctx.arc(ex, yOf(res.eMax), 3, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#6b7a8c"; ctx.font = (f - 1) + "px 'IBM Plex Mono', monospace";
    ctx.fillText("0°", x0 + 2, y0 + h - 2); ctx.fillText("180°", x0 + w / 2 - 12, y0 + h - 2); ctx.fillText("360°", x0 + w - 28, y0 + h - 2);
  }

  function drawWaves(r, f) {
    ctx.fillStyle = "#6b7a8c"; ctx.font = f + "px 'IBM Plex Mono', monospace";
    var rowsN = 6, rowH = r.h / rowsN, N = 420;
    var names = ["mic 1", "mic 2", "mic 3", "mic 4", "ICA drone", "ICA noise"];
    var lab = 0; names.forEach(function (n) { lab = Math.max(lab, ctx.measureText(n).width); }); lab += 6;
    var res = state.res;
    for (var row = 0; row < rowsN; row++) {
      var y = r.y + row * rowH, mid = y + rowH / 2;
      var data = row < 4 ? buf[row].subarray(W - N) : (res ? res.ica[row === 4 ? res.dIdx : res.nIdx].subarray(W - N) : null);
      ctx.fillStyle = row < 4 ? "#6b7a8c" : (row === 4 ? "#a6ff5c" : "#ff8a8a");
      ctx.fillText(names[row], r.x, mid + f * 0.35);
      if (!data) continue;
      var peak = 1e-9, i;
      for (i = 0; i < data.length; i++) peak = Math.max(peak, Math.abs(data[i]));
      var gx = r.x + lab, gw = r.w - lab, amp = rowH * 0.42;
      ctx.strokeStyle = row < 4 ? "#58e1ff" : (row === 4 ? "#a6ff5c" : "#ff8a8a");
      ctx.globalAlpha = row < 4 ? 0.8 : 1;
      ctx.beginPath();
      for (i = 0; i < data.length; i++) {
        var px = gx + gw * i / (data.length - 1), py = mid - amp * data[i] / peak;
        if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
      ctx.stroke(); ctx.globalAlpha = 1;
      ctx.strokeStyle = "#1d2a38"; ctx.beginPath(); ctx.moveTo(gx, mid); ctx.lineTo(gx + gw, mid); ctx.stroke();
    }
  }

  function drawHead(r, f) {
    var res = state.res;
    var wide = CW >= 520;
    ctx.fillStyle = "#ffb547"; ctx.font = (f + 1) + "px 'IBM Plex Mono', monospace";
    ctx.fillText(wide ? "DRONE LOCALISATION" : "DRONE", 6, r.y + r.h * 0.7);
    ctx.fillStyle = "#d4f2dd";
    var t = wide ? "t " + state.t.toFixed(1) + "s" : "";
    if (res) {
      t += (wide ? "   " : "") + "DOA " + res.doa.toFixed(0) + "° (" + res.truthAng.toFixed(0) + "°)";
      t += wide ? "   range " + res.range.toFixed(1) + " m (" + res.truthR.toFixed(1) + ")" : "  r " + res.range.toFixed(0) + "m";
    }
    ctx.textAlign = "right"; ctx.fillText(t, r.w - 6, r.y + r.h * 0.7); ctx.textAlign = "left";
  }

  function drawFoot(r, f) {
    ctx.fillStyle = "#6b7a8c"; ctx.font = f + "px 'IBM Plex Mono', monospace";
    var s = state.paused ? "PAUSED" : (state.manual ? "drone parked" : "drone on orbit");
    var txt = s + (CW < 480 ? "" : "  ·  " + state.calibText);
    if (res) txt += "  ·  ICA r=" + res.icaCorr[res.dIdx][0].toFixed(2);
    ctx.fillText(txt, 6, r.y + r.h * 0.72);
  }
  var res = null; // (rebound per frame in draw)

  function draw() {
    var L = layout();
    res = state.res;
    ctx.clearRect(0, 0, CW, CH);
    ctx.fillStyle = "#070a0e"; ctx.fillRect(0, 0, CW, CH);
    var f = fontPx(L);
    drawHead(L.head, f);
    drawMap(L.map, f);
    drawConf(L.conf, f);
    drawEnergy(L.energy, f);
    drawWaves(L.waves, f);
    drawFoot(L.foot, f);
    state.L = L;
  }

  // ---- pointer ----
  function localXY(ev) {
    var r = canvas.getBoundingClientRect();
    var p = ev.touches ? ev.touches[0] || ev.changedTouches[0] : ev;
    return [p.clientX - r.left, p.clientY - r.top];
  }
  function hitMarker(x, y) {
    var L = state.L; if (!L) return null;
    var dp = state.manual ? state.drone : droneOrbit(state.t);
    var dq = toPx(L.map, dp[0], dp[1]), nq = toPx(L.map, state.noise[0], state.noise[1]);
    if (Math.hypot(x - nq[0], y - nq[1]) < 16) return "noise";
    if (Math.hypot(x - dq[0], y - dq[1]) < 16) return "drone";
    return null;
  }
  function inMap(x, y) {
    var r = state.L && state.L.map;
    return r && x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;
  }
  function clampWorld(p) { return [Math.max(-MAP_RANGE, Math.min(MAP_RANGE, p[0])), Math.max(-MAP_RANGE, Math.min(MAP_RANGE, p[1]))]; }
  function onDown(ev) {
    var p = localXY(ev), x = p[0], y = p[1];
    if (!inMap(x, y)) return;
    var h = hitMarker(x, y);
    if (h) state.dragging = h;
    else {
      // tap on empty map parks the drone there
      var w = clampWorld(fromPx(state.L.map, x, y));
      if (Math.hypot(w[0], w[1]) < 1.5) return;
      state.drone = w; state.manual = true; state.trail.length = 0; state.est = null;
    }
    ev.preventDefault();
  }
  function onMove(ev) {
    if (!state.dragging) return;
    var p = localXY(ev), w = clampWorld(fromPx(state.L.map, p[0], p[1]));
    if (state.dragging === "drone") { state.drone = w; state.manual = true; }
    else state.noise = w;
    ev.preventDefault();
  }
  function onUp() { state.dragging = null; }
  canvas.addEventListener("mousedown", onDown);
  window.addEventListener("mousemove", onMove);
  window.addEventListener("mouseup", onUp);
  canvas.addEventListener("touchstart", onDown, { passive: false });
  canvas.addEventListener("touchmove", onMove, { passive: false });
  canvas.addEventListener("touchend", onUp);
  window.addEventListener("keydown", function (e) {
    if (e.code === "Space") { state.paused = !state.paused; e.preventDefault(); }
    if (e.key === "r" || e.key === "R") { state.manual = false; state.trail.length = 0; state.est = null; }
  });
  window.addEventListener("resize", resize);
  if (window.ResizeObserver) new ResizeObserver(resize).observe(canvas);

  // ---- main loop ----
  var last = performance.now();
  function frame(now) {
    var dt = Math.min(0.1, (now - last) / 1000) * state.speed;
    last = now;
    if (!state.paused && state.ready) {
      advance(dt);
      if (state.t >= nextAnalysis) { analyse(); nextAnalysis = state.t + ANALYSE_EVERY; }
    }
    draw();
    requestAnimationFrame(frame);
  }

  // ---- start ----
  resize();
  calibrate();
  calibrateRange();
  // prime the buffers with one window so the first frame is populated
  state.sample = 0;
  advance(W / FS);
  analyse();
  nextAnalysis = state.t + ANALYSE_EVERY;
  state.ready = true;
  state.calibText = "calibrated: TPR " + calib.tpr.toFixed(2) + " FPR " + calib.fpr.toFixed(2);
  requestAnimationFrame(function (n) { last = n; frame(n); });
})();

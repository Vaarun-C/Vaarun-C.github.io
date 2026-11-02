/* Antenna inverse-design demo: LHS sampling -> MLP surrogate -> inverse guess -> annealing refinement.
   Runs on an analytic stand-in for the EM solver (model.js). Labels in the UI say so. */
(function () {
  "use strict";
  var M = window.AntennaModel;
  var canvas = document.getElementById("c"), ctx = canvas.getContext("2d");
  var MONO = "'IBM Plex Mono', monospace";
  var CW = 640, CH = 400, dpr = 1;

  var LHS_N = 120, TRAIN_EPOCHS = 400, ANNEAL_MAX = 420, ITER_PER_SEC = 14;
  var state = {
    phase: "lhs", phaseT: 0, samples: [], target: { f: 26, d: 24 }, dragging: false,
    sur: null, trainer: null, lossHist: [], errHist: [], run: 1,
    x: null, xFrom: null, xTween: 1, an: null, bestX: null, bestF: Infinity, iter: 0, holdUntil: 0,
    simCurve: null, paused: false, acc: 0, guessLoss: 0, lhsPts: null, lhsI: 0
  };
  var pointsRef = null;

  // ---- phases ----
  function startRun(fromLHSIndex) {
    var x0 = state.startX ? state.startX.slice() : [1.5, 1.75, 1.75, 1.75];
    var tgt = M.targetCurve(state.target.f, state.target.d);
    var tSub = M.SUB.map(function (k) { return tgt[k]; });
    var surr = state.sur;
    // multi-start inverse: run the surrogate inverse from four starting points and keep the guess
    // whose stand-in response is closest to the target
    var starts = [x0, state.lhsPts[5], state.lhsPts[40 + (state.run % 40)], state.lhsPts[90]], snapped = null;
    state.guessLoss = Infinity;
    starts.forEach(function (st) {
      var xi = M.inverseGuess(surr, tSub, st, 300, 0.02);
      var sn = M.repair(M.snap(M.clampX(xi)));
      var l = M.rmse(M.simulate(sn), tgt);
      if (l < state.guessLoss) { state.guessLoss = l; snapped = sn; }
    });
    state.xFrom = state.x ? state.x.slice() : x0.slice();
    state.xTween = 0;
    state.x = snapped;
    state.an = new M.Annealer(tgt, snapped, 17 + state.run * 31);
    state.errHist = [{ it: 0, e: state.an.curF }];
    state.iter = 0; state.bestF = state.an.bestF; state.bestX = state.an.best.slice();
    state.phase = "anneal"; state.phaseT = 0;
  }

  function targetChanged() {
    state.startX = null;
    state.run = state.run + 1;
    state.phase = "inverse"; state.phaseT = 0;
  }

  function stepPhases(dt) {
    var p = state.phase;
    if (p === "lhs") {
      if (!state.lhsPts) {
        state.lhsPts = M.lhs(3000, M.rng(4)).slice(0, LHS_N);
        state.lhsI = 0;
      }
      var k = Math.max(1, Math.round(dt * 60));
      for (var i = 0; i < k && state.lhsI < state.lhsPts.length; i++, state.lhsI++) {
        var x = state.lhsPts[state.lhsI];
        state.samples.push({ x: x, curve: M.simulate(x) });
      }
      if (state.lhsI >= state.lhsPts.length) {
        var rand = M.rng(9);
        state.sur = new M.Surrogate(state.samples, rand, TRAIN_EPOCHS);
        state.trainer = state.sur.net.trainer(state.sur.X, state.sur.Y, 0.01);
        state.lossHist = [];
        state.phase = "train"; state.phaseT = 0;
      }
    } else if (p === "train") {
      for (var e = 0; e < 8 && state.lossHist.length < TRAIN_EPOCHS; e++) state.lossHist.push(state.trainer.epoch());
      if (state.lossHist.length >= TRAIN_EPOCHS) { state.phase = "inverse"; state.phaseT = 0; }
    } else if (p === "inverse") {
      if (state.phaseT > 0.25) startRun();
    } else if (p === "anneal") {
      state.acc += dt * ITER_PER_SEC;
      while (state.acc >= 1 && state.phase === "anneal") {
        state.acc -= 1;
        var r = state.an.step();
        state.iter = r.iter;
        state.x = r.best.slice();
        state.bestF = r.bestF; state.bestX = r.best.slice();
        state.simCurve = M.simulate(r.x);
        if (r.iter % 2 === 0 || r.iter < 40) state.errHist.push({ it: r.iter, e: r.bestF });
        if (r.iter >= ANNEAL_MAX) {
          state.phase = "hold"; state.phaseT = 0; state.holdUntil = 5;
        }
      }
    } else if (p === "hold") {
      if (state.phaseT > state.holdUntil) {
        // next run: fresh surrogate guess from a different LHS sample, same target
        state.run++;
        state.startX = state.lhsPts[(state.run * 37) % state.lhsPts.length].slice();
        state.errHist = [];
        state.phase = "inverse"; state.phaseT = 0;
      }
    }
    state.phaseT += dt;
    if (state.xTween < 1) state.xTween = Math.min(1, state.xTween + dt / 0.8);
    if (state.phase === "anneal" && !state.simCurve) state.simCurve = M.simulate(state.an.cur);
  }

  // ---- layout ----
  function resize() {
    CW = Math.max(200, canvas.clientWidth || window.innerWidth);
    CH = Math.max(180, canvas.clientHeight || window.innerHeight);
    dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.round(CW * dpr); canvas.height = Math.round(CH * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  function layout() {
    var head = CH < 220 ? 18 : 24, foot = CH < 220 ? 14 : 18, pad = Math.max(4, Math.min(CW, CH) * 0.012);
    var body = CH - head - foot, top = head, L = {};
    if (CW >= CH * 1.05) {
      var lw = CW * 0.4;
      L.geo = { x: pad, y: top + pad, w: lw - pad * 1.5, h: body * 0.62 - pad };
      L.params = { x: pad, y: top + pad + L.geo.h + pad, w: lw - pad * 1.5, h: body - L.geo.h - pad * 2 };
      var rx = lw + pad * 0.5, rw = CW - rx - pad;
      L.s11 = { x: rx, y: top + pad, w: rw, h: body * 0.56 - pad };
      L.conv = { x: rx, y: L.s11.y + L.s11.h + pad * 1.5, w: rw, h: top + body - (L.s11.y + L.s11.h + pad * 1.5) - pad };
    } else {
      L.geo = { x: pad, y: top + pad, w: CW - pad * 2, h: body * 0.36 };
      L.s11 = { x: pad, y: L.geo.y + L.geo.h + pad, w: CW - pad * 2, h: body * 0.34 };
      L.params = { x: pad, y: L.s11.y + L.s11.h + pad * 0.5, w: CW - pad * 2, h: body * 0.12 };
      L.conv = { x: pad, y: L.params.y + L.params.h + pad * 0.5, w: CW - pad * 2, h: top + body - (L.params.y + L.params.h + pad * 0.5) - pad };
    }
    L.head = { x: 0, y: 0, w: CW, h: head };
    L.foot = { x: 0, y: CH - foot, w: CW, h: foot };
    return L;
  }

  // ---- S11 plot mapping ----
  var YMAX = 0, YMIN = -40;
  function s11ToPx(r, f, db) {
    var x = r.x + 34 + (r.w - 40) * (f - 20) / 20;
    var y = r.y + 14 + (r.h - 34) * (db - YMAX) / (YMIN - YMAX);
    return [x, y];
  }
  function pxToS11(r, px, py) {
    var f = 20 + (px - (r.x + 34)) / (r.w - 40) * 20;
    var db = YMAX + (py - (r.y + 14)) / (r.h - 34) * (YMIN - YMAX);
    return { f: Math.max(20, Math.min(40, f)), d: Math.max(6, Math.min(40, -db)) };
  }

  // ---- drawing helpers ----
  function txt(s, x, y, size, color, align) {
    ctx.font = size + "px " + MONO; ctx.fillStyle = color; ctx.textAlign = align || "left"; ctx.fillText(s, x, y);
  }

  function drawGeo(r, f) {
    ctx.save(); ctx.beginPath(); ctx.rect(r.x, r.y, r.w, r.h); ctx.clip();
    ctx.fillStyle = "#0c1118"; ctx.fillRect(r.x, r.y, r.w, r.h);
    var x = state.x || [1.5, 1.75, 1.75, 1.75];
    if (state.xFrom && state.xTween < 1) {
      var t = state.xTween * state.xTween * (3 - 2 * state.xTween);
      x = x.map(function (v, k) { return state.xFrom[k] + (v - state.xFrom[k]) * t; });
    }
    // schematic: 12 mm wide window, mm -> px
    var mmW = 12, s = (r.w - 30) / mmW, ox = r.x + 14, cy = r.y + r.h * 0.56;
    var tlx = x[1], stx = x[0], sty = x[2], pos = x[3];
    var traceL = 9.0, traceY = cy;
    // substrate
    ctx.fillStyle = "#15301f"; ctx.fillRect(ox, cy - 2.2 * s * 1.1, mmW * s, 4.4 * s * 1.1);
    ctx.strokeStyle = "#2c5a3b"; ctx.strokeRect(ox + 0.5, cy - 2.2 * s * 1.1 + 0.5, mmW * s - 1, 4.4 * s * 1.1 - 1);
    // feed trace (tlx wide)
    var tw = Math.max(1, tlx * s * 0.6);
    ctx.fillStyle = "#b87333";
    ctx.fillRect(ox + 0.5 * s, traceY - tw / 2, traceL * s, tw);
    // load (antenna) at the right end
    var loadX = ox + (0.5 + traceL) * s;
    ctx.fillStyle = "#58e1ff"; ctx.fillRect(loadX, traceY - 1.6 * s, 1.6 * s, 3.2 * s);
    // open stub at distance pos from the load, length stub_y, width stub_x
    var sxPos = loadX - pos * s;
    var sw = Math.max(1.5, stx * s * 0.8), sl = sty * s;
    ctx.fillStyle = "#ffb547";
    ctx.fillRect(sxPos - sw / 2, traceY - tw / 2 - sl, sw, sl);
    // vias (decorative, ground side)
    ctx.fillStyle = "#6b7a8c";
    for (var i = 0; i < 4; i++) { ctx.beginPath(); ctx.arc(ox + (1.5 + i * 2.4) * s, cy + 1.6 * s, 1.6, 0, Math.PI * 2); ctx.fill(); }
    // labels
    txt("port", ox + 0.5 * s, traceY + tw / 2 + 13, f - 1, "#6b7a8c");
    txt("load", loadX - 2, traceY - 1.6 * s - 5, f - 1, "#58e1ff", "right");
    ctx.restore();
    txt("schematic: stub at pos from load", r.x + 6, r.y + r.h - 6, f - 1, "#4d6073");
  }

  function drawParams(r, f) {
    var x = state.x || [1.5, 1.75, 1.75, 1.75];
    var rowH = r.h / 4;
    for (var k = 0; k < 4; k++) {
      var y = r.y + k * rowH + rowH * 0.5;
      txt(M.NAMES[k], r.x, y + f * 0.35, f, "#6b7a8c");
      var bx = r.x + r.w * 0.27, bw = r.w * 0.5, bh = Math.max(4, rowH * 0.3);
      ctx.fillStyle = "#11171f"; ctx.fillRect(bx, y - bh / 2, bw, bh);
      var frac = (x[k] - M.LB[k]) / (M.UB[k] - M.LB[k]);
      ctx.fillStyle = "#58e1ff"; ctx.fillRect(bx, y - bh / 2, bw * frac, bh);
      txt(x[k].toFixed(2) + " mm", r.x + r.w, y + f * 0.35, f, "#d4f2dd", "right");
    }
  }

  function drawS11(r, f) {
    var tgt = M.targetCurve(state.target.f, state.target.d);
    ctx.fillStyle = "#0c1118"; ctx.fillRect(r.x, r.y, r.w, r.h);
    ctx.strokeStyle = "#1d2a38"; ctx.lineWidth = 1;
    [0, -10, -20, -30, -40].forEach(function (d) {
      var p0 = s11ToPx(r, 20, d), p1 = s11ToPx(r, 40, d);
      ctx.beginPath(); ctx.moveTo(p0[0], p0[1]); ctx.lineTo(p1[0], p1[1]); ctx.stroke();
      txt(d + "", r.x + 30, p0[1] + f * 0.35, f - 1, "#4d6073", "right");
    });
    [20, 25, 30, 35, 40].forEach(function (g) {
      var p0 = s11ToPx(r, g, 0);
      txt(g + "", p0[0], r.y + r.h - 4, f - 1, "#4d6073", "center");
    });
    ctx.save(); ctx.beginPath(); ctx.rect(r.x + 32, r.y, r.w - 34, r.h); ctx.clip();
    // target (dashed amber)
    ctx.setLineDash([5, 4]); ctx.strokeStyle = "#ffb547"; ctx.lineWidth = 2; ctx.beginPath();
    M.FREQS.forEach(function (fq, k) { var p = s11ToPx(r, fq, tgt[k]); if (k === 0) ctx.moveTo(p[0], p[1]); else ctx.lineTo(p[0], p[1]); });
    ctx.stroke(); ctx.setLineDash([]);
    // current simulated curve
    var best = state.x ? M.simulate(state.x) : null;
    if (best) {
      ctx.strokeStyle = "#58e1ff"; ctx.lineWidth = 2; ctx.beginPath();
      M.FREQS.forEach(function (fq, k) { var p = s11ToPx(r, fq, best[k]); if (k === 0) ctx.moveTo(p[0], p[1]); else ctx.lineTo(p[0], p[1]); });
      ctx.stroke();
    }
    ctx.restore();
    // target handle
    var h = s11ToPx(r, state.target.f, -state.target.d);
    ctx.fillStyle = "#ffb547"; ctx.beginPath(); ctx.arc(h[0], h[1], 5, 0, Math.PI * 2); ctx.fill();
    txt("target", h[0] + 8, h[1] - 6, f - 1, "#ffb547");
    // legend
    var lx = r.x + 36, ly = r.y + 12, wide = r.w > 260;
    ctx.fillStyle = "#ffb547"; ctx.fillRect(lx, ly - 5, 12, 2); txt("target", lx + 16, ly, f - 1, "#d4f2dd");
    if (wide) {
      ctx.fillStyle = "#58e1ff"; ctx.fillRect(lx + 72, ly - 5, 12, 2); txt("best design (stand-in sim)", lx + 88, ly, f - 1, "#d4f2dd");
      txt("RMSE " + (state.bestF < Infinity ? state.bestF.toFixed(2) : "-") + " dB", r.x + r.w - 6, r.y + 12, f - 1, "#58e1ff", "right");
    } else {
      ctx.fillStyle = "#58e1ff"; ctx.fillRect(lx + 72, ly - 5, 12, 2); txt("best", lx + 88, ly, f - 1, "#d4f2dd");
    }
  }

  function drawConv(r, f) {
    var hasLoss = state.phase === "lhs" || state.phase === "train";
    var pad = { l: 34, r: 8, t: 22, b: 16 };
    var x0 = r.x + pad.l, y0 = r.y + pad.t, w = r.w - pad.l - pad.r, h = r.h - pad.t - pad.b;
    ctx.fillStyle = "#0c1118"; ctx.fillRect(r.x, r.y, r.w, r.h);
    // stage tags
    var stages = r.w > 260 ? ["1 LHS", "2 surrogate", "3 inverse", "4 anneal"] : ["1", "2", "3", "4"];
    var idx = { lhs: 0, train: 1, inverse: 2, anneal: 3, hold: 3 }[state.phase];
    var tx = r.x + 6;
    stages.forEach(function (s, i) {
      var on = i === idx, done = i < idx;
      ctx.font = (f - 1) + "px " + MONO;
      var wdt = ctx.measureText(s).width + 10;
      ctx.fillStyle = on ? "#ffb547" : (done ? "#26313f" : "#11171f");
      ctx.fillRect(tx, r.y + 4, wdt, f + 4);
      txt(s, tx + 5, r.y + 4 + f, f - 1, on ? "#070a0e" : (done ? "#a6ff5c" : "#4d6073"));
      tx += wdt + 5;
    });
    var series = [], label = "", ymin = 0, ymax = 1, xlab = "";
    if (hasLoss) {
      label = "surrogate loss (log)";
      series = state.lossHist.map(function (v, i) { return [i, Math.log10(Math.max(v, 1e-6))]; });
      ymin = -3.5; ymax = -1; xlab = TRAIN_EPOCHS + " epochs";
    } else {
      label = "best RMSE, dB (log)";
      series = state.errHist.map(function (p) { return [p.it, Math.log10(Math.max(p.e, 0.01))]; });
      ymin = -2; ymax = 1.4; xlab = ANNEAL_MAX + " iters";
    }
    if (r.h > 70) txt(label, r.x + 6, r.y + r.h - 4, f - 1, "#6b7a8c");
    ctx.strokeStyle = "#1d2a38";
    [ymin, (ymin + ymax) / 2, ymax].forEach(function (v) {
      var yy = y0 + h - (v - ymin) / (ymax - ymin) * h;
      ctx.beginPath(); ctx.moveTo(x0, yy); ctx.lineTo(x0 + w, yy); ctx.stroke();
      txt(Math.pow(10, v).toPrecision(2), x0 - 4, yy + f * 0.35, f - 1, "#4d6073", "right");
    });
    if (series.length > 1) {
      var maxX = hasLoss ? TRAIN_EPOCHS : ANNEAL_MAX;
      ctx.strokeStyle = hasLoss ? "#a6ff5c" : "#58e1ff"; ctx.lineWidth = 1.8; ctx.beginPath();
      series.forEach(function (p, i) {
        var px = x0 + w * Math.min(1, p[0] / maxX), py = y0 + h - Math.max(0, Math.min(1, (p[1] - ymin) / (ymax - ymin))) * h;
        if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      });
      ctx.stroke(); ctx.lineWidth = 1;
    }
    txt(xlab, x0 + w, y0 + h + 12, f - 1, "#4d6073", "right");
  }

  function drawHead(r, f) {
    var wide = CW >= 520;
    txt(wide ? "ANTENNA INVERSE DESIGN" : "ANTENNA", 6, r.y + r.h * 0.72, f + 1, "#ffb547");
    var s = "run " + state.run + "  ";
    if (state.phase === "lhs") s += "LHS " + state.lhsI + "/" + LHS_N + " sims";
    else if (state.phase === "train") s += "training surrogate " + state.lossHist.length + "/" + TRAIN_EPOCHS;
    else if (state.phase === "inverse") s += "inverse guess";
    else s += "iter " + state.iter + "  RMSE " + (state.bestF < Infinity ? state.bestF.toFixed(2) : "-") + " dB" + (state.phase === "hold" ? "  converged" : "");
    txt(s, r.w - 6, r.y + r.h * 0.72, f, "#d4f2dd", "right");
  }

  function drawFoot(r, f) {
    var s = state.paused ? "PAUSED · space resumes" : "drag the dip or tap the plot";
    txt(s + "  ·  R reruns search  ·  stand-in model, not HFSS", 6, r.y + r.h * 0.72, f - 1, "#6b7a8c");
  }

  function draw() {
    var L = layout();
    ctx.clearRect(0, 0, CW, CH);
    ctx.fillStyle = "#070a0e"; ctx.fillRect(0, 0, CW, CH);
    var f = Math.max(9, Math.min(12, Math.min(CW, CH) / 34));
    drawHead(L.head, f);
    drawGeo(L.geo, f);
    drawParams(L.params, f);
    drawS11(L.s11, f);
    drawConv(L.conv, f);
    drawFoot(L.foot, f);
    state.L = L;
  }

  // ---- pointer: drag the target dip ----
  function localXY(ev) {
    var r = canvas.getBoundingClientRect();
    var p = ev.touches ? (ev.touches[0] || ev.changedTouches[0]) : ev;
    return [p.clientX - r.left, p.clientY - r.top];
  }
  function inRect(r, x, y) { return r && x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h; }
  function setTargetFromPx(x, y) {
    var r = state.L.s11, v = pxToS11(r, x, y);
    state.target = { f: Math.round(v.f * 4) / 4, d: Math.round(v.d) };
  }
  var targetDirty = false;
  function onDown(ev) {
    var p = localXY(ev);
    if (!inRect(state.L && state.L.s11, p[0], p[1])) return;
    state.dragging = true; setTargetFromPx(p[0], p[1]); targetDirty = true;
    ev.preventDefault();
  }
  function onMove(ev) {
    if (!state.dragging) return;
    var p = localXY(ev);
    setTargetFromPx(p[0], p[1]); targetDirty = true;
    ev.preventDefault();
  }
  function onUp() {
    if (state.dragging && targetDirty) { targetChanged(); targetDirty = false; }
    state.dragging = false;
  }
  canvas.addEventListener("mousedown", onDown);
  window.addEventListener("mousemove", onMove);
  window.addEventListener("mouseup", onUp);
  canvas.addEventListener("touchstart", onDown, { passive: false });
  canvas.addEventListener("touchmove", onMove, { passive: false });
  canvas.addEventListener("touchend", onUp);
  window.addEventListener("keydown", function (e) {
    if (e.code === "Space") { state.paused = !state.paused; e.preventDefault(); }
    if (e.key === "r" || e.key === "R") { state.startX = state.lhsPts ? state.lhsPts[(state.run * 53) % state.lhsPts.length].slice() : null; state.run++; state.phase = "inverse"; state.phaseT = 0; }
  });
  window.addEventListener("resize", resize);
  if (window.ResizeObserver) new ResizeObserver(resize).observe(canvas);

  // ---- loop ----
  var last = 0;
  function frame(now) {
    var dt = Math.min(0.1, (now - last) / 1000 || 0);
    last = now;
    if (!state.paused) stepPhases(dt);
    draw();
    requestAnimationFrame(frame);
  }
  resize();
  requestAnimationFrame(function (n) { last = n; frame(n); });
})();

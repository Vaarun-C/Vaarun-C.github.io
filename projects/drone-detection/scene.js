(function (root) {
  "use strict";
  var C = 343;
  // Top drone tones from Simulator/helper.py generate_drone_signal, with amplitudes = counts / max(counts)
  var FREQS = [1151.52, 1030.30, 1393.94, 1515.15, 1272.73, 3333.33, 2969.70, 3090.91, 3454.55, 3939.39,
               3212.12, 2848.48, 5030.30, 2606.06, 2484.85, 1636.36, 3818.18, 3696.97, 1757.58, 1878.79];
  var COUNTS = [540, 149, 137, 95, 91, 58, 49, 49, 44, 37, 34, 34, 32, 30, 29, 29, 24, 21, 21, 20];
  var PHASES = FREQS.map(function (f, i) { return (i * 2.399963) % (2 * Math.PI); });
  var AMP = COUNTS.map(function (c) { return c / 540; });

  function drone(t) {
    var s = 0;
    for (var k = 0; k < FREQS.length; k++) s += AMP[k] * Math.sin(2 * Math.PI * FREQS[k] * t + PHASES[k]);
    return s / 3.5; // roughly unit peak
  }
  // Impulsive noise source: mains hum plus decaying clicks (generate_noise in helper.py)
  function noiseSrc(t, clicks) {
    var s = 0.25 * Math.sin(2 * Math.PI * 60 * t);
    // last click at or before t (binary search), then walk back over the ~20 ms that can still ring
    var lo = 0, hi = clicks.length - 1, idx = -1;
    while (lo <= hi) { var mid = (lo + hi) >> 1; if (clicks[mid] <= t) { idx = mid; lo = mid + 1; } else hi = mid - 1; }
    for (var i = idx; i >= 0; i--) {
      var dt = t - clicks[i];
      if (dt >= 0.02) break;
      s += 0.9 * Math.exp(-dt / 0.003) * Math.sin(2 * Math.PI * 1200 * dt);
    }
    return s;
  }

  // Deterministic PRNG so the demo is reproducible
  function rng(seed) {
    var s = seed >>> 0;
    return function () { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
  }
  function gauss(r) { var u = r() || 1e-9, v = r(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); }

  // Scene: drone position(t) [m], noise position, mic positions [m]
  function Scene(opts) {
    this.fs = opts.fs || 12000;
    this.mics = opts.mics;
    this.noisePos = opts.noisePos;
    this.dronePos = opts.dronePos; // function t -> [x,y]
    this.noiseGain = opts.noiseGain == null ? 1 : opts.noiseGain;
    this.droneGain = opts.droneGain == null ? 1 : opts.droneGain;
    this.sensor = opts.sensor == null ? 0.01 : opts.sensor;
    this.rand = rng(opts.seed || 7);
    this.clicks = [];
    var t = 0;
    while (t < 2000) { t += 0.15 + 0.35 * this.rand(); this.clicks.push(t); }
  }
  // Mic signals for samples [t0, t0+n/fs): returns array of Float64Array (one per mic)
  Scene.prototype.render = function (t0, n, opts) {
    opts = opts || {};
    var M = this.mics.length, out = [], m, i, fs = this.fs;
    var doDrone = opts.drone !== false, doNoise = opts.noise !== false;
    for (m = 0; m < M; m++) out.push(new Float64Array(n));
    var nclk = this.clicks;
    for (i = 0; i < n; i++) {
      var t = t0 + i / fs;
      var dp = doDrone ? this.dronePos(t) : null;
      for (m = 0; m < M; m++) {
        var mp = this.mics[m], v = 0;
        if (dp) {
          var r = Math.hypot(dp[0] - mp[0], dp[1] - mp[1]);
          var te = t - r / C;
          v += this.droneGain * drone(te) / Math.max(r, 0.5);
        }
        if (doNoise) {
          var np = this.noisePos;
          var rn = Math.hypot(np[0] - mp[0], np[1] - mp[1]);
          var tn = t - rn / C;
          v += this.noiseGain * noiseSrc(tn, nclk) / Math.max(rn, 0.5);
        }
        out[m][i] = v + (opts.noSensor ? 0 : this.sensor * gauss(this.rand));
      }
    }
    return out;
  };
  var API = { Scene: Scene, FREQS: FREQS, drone: drone, noiseSrc: noiseSrc, rng: rng, C: C };
  if (typeof module !== "undefined" && module.exports) module.exports = API;
  else root.DroneScene = API;
})(typeof self !== "undefined" ? self : this);

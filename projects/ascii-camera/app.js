// ASCII Camera: port of ASCII-Camera/ASCII.py (OpenCV + colour ANSI output) to canvas.
// Same ramp, same luminance mapping: pixel_hash[v] = ramp[floor(v / 255 * (len - 1))].
(() => {
  "use strict";

  // Exact ramp from the Python raw string (note the literal backslash and quote).
  const PIXEL_MAP = "$@B%8&WM#*oahkbdpqwmZO0QLCJUYXzcvunxrjft/|()1{}[]?-_+~<>i!lI;:,\\\"^`'. ";
  const RAMP = PIXEL_MAP.length;
  const PIXEL_HASH = new Array(256);
  for (let v = 0; v < 256; v++) PIXEL_HASH[v] = PIXEL_MAP[Math.floor((v / 255) * (RAMP - 1))];

  const $ = (id) => document.getElementById(id);
  const term = $("term"), canvas = $("out"), ctx = canvas.getContext("2d");
  const video = $("cam"), camBtn = $("camBtn"), colorBtn = $("colorBtn");
  const densityIn = $("density"), contrastIn = $("contrast");
  const msg = $("msg"), modeEl = $("mode");
  const off = document.createElement("canvas");
  const octx = off.getContext("2d", { willReadFrequently: true });

  let W = 1, H = 1, dpr = 1;
  let mode = "demo";            // "demo" | "camera"
  let stream = null;
  let useColor = true;
  let torusT = 0;
  let lastT = performance.now();

  const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

  function resize() {
    const r = term.getBoundingClientRect();
    W = Math.max(1, Math.floor(r.width));
    H = Math.max(1, Math.floor(r.height - 4));
    dpr = window.devicePixelRatio || 1;
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    canvas.style.width = W + "px";
    canvas.style.height = H + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  // Generated fallback: a spinning torus (donut.c maths), written into an RGBA grid
  // of cols x rows samples, so it goes through the same ASCII pipeline as the camera.
  function torusFrame(cols, rows, data, t) {
    const A = t * 0.9, B = t * 0.5;
    const cA = Math.cos(A), sA = Math.sin(A), cB = Math.cos(B), sB = Math.sin(B);
    const R1 = 1, R2 = 2, K2 = 5;
    const K1 = cols * K2 * 3 / (8 * (R1 + R2)) * 0.7;
    const zbuf = new Float32Array(cols * rows);
    const lum = new Float32Array(cols * rows);
    for (let i = 0; i < cols * rows; i++) { data[i * 4] = 255; data[i * 4 + 1] = 255; data[i * 4 + 2] = 255; data[i * 4 + 3] = 255; }

    for (let th = 0; th < Math.PI * 2; th += 0.07) {
      const ct = Math.cos(th), st = Math.sin(th);
      for (let ph = 0; ph < Math.PI * 2; ph += 0.02) {
        const cp = Math.cos(ph), sp = Math.sin(ph);
        const cx = R2 + R1 * ct;
        const cy = R1 * st;
        const x = cx * (cB * cp + sA * sB * sp) - cy * cA * sB;
        const y = cx * (sB * cp - sA * cB * sp) + cy * cA * cB;
        const z = K2 + cA * cx * sp + cy * sA;
        const ooz = 1 / z;
        const xp = Math.floor(cols / 2 + K1 * ooz * x);
        const yp = Math.floor(rows / 2 - K1 * ooz * y);
        const L = cp * ct * sB - cA * ct * sp - sA * st + cB * (cA * st - ct * sA * sp);
        if (L <= 0 || xp < 0 || xp >= cols || yp < 0 || yp >= rows) continue;
        const idx = yp * cols + xp;
        if (ooz > zbuf[idx]) { zbuf[idx] = ooz; lum[idx] = L; }
      }
    }
    // Lit surfaces come out light, shadowed ones dark. White background maps to blank cells.
    for (let i = 0; i < cols * rows; i++) {
      if (zbuf[i] === 0) continue;
      const g = Math.round(70 + 165 * clamp(lum[i], 0, 1));
      data[i * 4] = g;
      data[i * 4 + 1] = Math.round(g * 0.86);
      data[i * 4 + 2] = Math.round(g * 0.7);
    }
  }

  function sampleCamera(cols, rows, data) {
    off.width = cols;
    off.height = rows;
    const vw = video.videoWidth, vh = video.videoHeight;
    // Centre-crop the camera frame to the grid's aspect, like a cover fit.
    const scale = Math.max(cols / vw, rows / vh);
    const sw = cols / scale, sh = rows / scale;
    const sx = (vw - sw) / 2, sy = (vh - sh) / 2;
    octx.drawImage(video, sx, sy, sw, sh, 0, 0, cols, rows);
    data.set(octx.getImageData(0, 0, cols, rows).data);
  }

  function render(now) {
    const dt = Math.min(0.05, (now - lastT) / 1000);
    lastT = now;
    torusT += dt;

    const cols = +densityIn.value;
    const cellW = W / cols;
    const cellH = cellW * 2;                // terminal cells are about twice as tall as wide
    const rows = Math.max(4, Math.floor(H / cellH));
    const cw = W / cols, ch = H / rows;

    const data = new Uint8ClampedArray(cols * rows * 4);
    const useCam = mode === "camera" && video.readyState >= 2 && video.videoWidth > 0;
    if (useCam) sampleCamera(cols, rows, data);
    else torusFrame(cols, rows, data, torusT);

    const contrast = +contrastIn.value;
    ctx.fillStyle = "#f2eee2";
    ctx.fillRect(0, 0, W, H);

    const fs = Math.min(cw / 0.55, ch * 0.92);
    ctx.font = `${fs}px ui-monospace, Menlo, Consolas, "Courier New", monospace`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const i = (y * cols + x) * 4;
        const r = data[i], g0 = data[i + 1], b = data[i + 2];
        // Rec.601 luma, as cv2.COLOR_BGR2GRAY.
        let gray = Math.round(0.299 * r + 0.587 * g0 + 0.114 * b);
        // Contrast around mid-grey.
        gray = clamp(Math.round((gray - 128) * contrast + 128), 0, 255);
        const chr = PIXEL_HASH[gray];
        if (chr === " ") continue;
        ctx.fillStyle = useColor ? `rgb(${r},${g0},${b})` : "#1b1a17";
        ctx.fillText(chr, x * cw + cw / 2, y * ch + ch / 2);
      }
    }

    modeEl.textContent = (useCam ? "CAMERA" : "DEMO") + ` ${cols}x${rows}`;
    requestAnimationFrame(render);
  }

  function setMsg(text) { msg.textContent = text; }

  function stopCamera() {
    if (stream) stream.getTracks().forEach((t) => t.stop());
    stream = null;
    video.srcObject = null;
    mode = "demo";
    camBtn.textContent = "TURN ON CAMERA";
    camBtn.setAttribute("aria-pressed", "false");
  }

  async function startCamera() {
    camBtn.disabled = true;
    camBtn.textContent = "ASKING...";
    try {
      if (!window.isSecureContext || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw Object.assign(new Error("unsupported"), { name: "Unsupported" });
      }
      stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: "user" },
        audio: false,
      });
      video.srcObject = stream;
      await video.play();
      mode = "camera";
      camBtn.textContent = "TURN OFF CAMERA";
      camBtn.setAttribute("aria-pressed", "true");
      setMsg("Live camera. Frames are converted to characters on this device and are not uploaded.");
    } catch (err) {
      if (stream) stream.getTracks().forEach((t) => t.stop());
      stream = null;
      mode = "demo";
      camBtn.textContent = "TURN ON CAMERA";
      camBtn.setAttribute("aria-pressed", "false");
      const why = err && err.name === "NotAllowedError" ? "permission denied"
        : err && err.name === "NotFoundError" ? "no camera found"
        : err && err.name === "Unsupported" ? "camera not available in this context"
        : "camera unavailable";
      setMsg(`${why}. Showing the generated torus through the same ASCII pipeline instead.`);
    } finally {
      camBtn.disabled = false;
    }
  }

  camBtn.addEventListener("click", () => {
    if (stream) { stopCamera(); setMsg("Generated demo running. Press TURN ON CAMERA to use your webcam."); }
    else startCamera();
  });

  colorBtn.addEventListener("click", () => {
    useColor = !useColor;
    colorBtn.setAttribute("aria-pressed", String(useColor));
  });

  densityIn.addEventListener("input", () => { $("densOut").textContent = densityIn.value; });
  contrastIn.addEventListener("input", () => { $("contOut").textContent = (+contrastIn.value).toFixed(2); });

  new ResizeObserver(resize).observe(term);
  resize();
  requestAnimationFrame((t) => { lastT = t; render(t); });
  window.addEventListener("pagehide", () => { if (stream) stream.getTracks().forEach((t) => t.stop()); });
})();

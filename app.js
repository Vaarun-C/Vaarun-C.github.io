// In Charted Waters. Renders each section of the chart from window.SECTIONS (built by build-manifest.mjs),
// runs the demos ("Set sail"), and keeps the margin index in step with the scroll.

document.documentElement.classList.add("js");
const list = document.getElementById("list");
const tpl = document.getElementById("tpl");
const announce = document.getElementById("announce");
const sections = window.SECTIONS || [];

// Each section is a figure on Plate I: its creature, its numeral and its caption.
const FIGS = {
  ai: { no: "I", art: "whale", w: 1536, h: 1024, cap: "Fig. I. — <i>Balaena</i>, the great working whale" },
  ml: { no: "II", art: "jelly", w: 1024, h: 1536, cap: "Fig. II. — <i>Medusa</i>, all nerve and no brain" },
  creative: { no: "III", art: "serpent", w: 1536, h: 1024, cap: "Fig. III. — <i>Serpens</i>: here be dragons", title: "Creative" },
};
const ICON = (id) => `<svg aria-hidden="true"><use href="#i-${id}"/></svg>`;

function say(msg) {
  announce.textContent = "";
  requestAnimationFrame(() => { announce.textContent = msg; });
}

/* ---------- demos: at most two under sail at once ---------- */

const MAX_LIVE = 2;
const BOOT_TIMEOUT = 15000;
const live = [];

function setState(v, state, text) {
  v.dataset.state = state;
  v._deck.querySelector(".state").textContent = text;
}

function anchor(v, reason) {
  const frame = v.querySelector("iframe");
  const hadFocus = v.contains(document.activeElement) || document.activeElement === frame;
  if (frame) frame.remove();
  if (v.dataset.aspect) v.querySelector(".screen").style.aspectRatio = "";
  clearTimeout(v._timer);
  const sail = v.querySelector(".sail");
  sail.hidden = false;
  v._deck.querySelector(".off").hidden = true;
  v.querySelector(".msg").hidden = true;
  const i = live.indexOf(v);
  if (i >= 0) live.splice(i, 1);

  const title = v.dataset.title;
  const hint = v._hint;
  setState(v, "off", "At anchor");
  if (reason === "evicted") {
    hint.hidden = false;
    hint.textContent = "Anchored to keep the page quick. Two run at a time.";
    say(`${title} stopped to keep the page fast. Two demos run at a time.`);
  } else {
    hint.hidden = true;
    if (reason === "user") say(`${title} stopped.`);
  }
  // Keep keyboard users where they were instead of dropping them at the top of the page.
  if (hadFocus || reason === "user") sail.focus({ preventScroll: true });
}

function sail(v, url) {
  const screen = v.querySelector(".screen");
  let frame = screen.querySelector("iframe");
  if (!frame) {
    frame = document.createElement("iframe");
    frame.src = url;
    frame.title = v.dataset.title;
    frame.allow = "fullscreen; autoplay; gamepad; camera";
    setState(v, "booting", "Setting sail…");
    frame.addEventListener("load", () => {
      clearTimeout(v._timer);
      setState(v, "live", "Under sail");
      frame.focus();
    }, { once: true });
    v._timer = setTimeout(() => {
      if (v.dataset.state !== "booting") return;
      setState(v, "failed", "Lost at sea");
      const msg = v.querySelector(".msg");
      msg.hidden = false;
      msg.innerHTML = `This one didn't start here. <a href="" target="_blank" rel="noopener">Open it in a new tab</a>`;
      msg.querySelector("a").href = url;
      say(`${v.dataset.title} didn't start. A link to open it in a new tab is in its frame.`);
    }, BOOT_TIMEOUT);
    screen.appendChild(frame);
    if (v.dataset.aspect) screen.style.aspectRatio = v.dataset.aspect;
  }
  v.querySelector(".sail").hidden = true;
  v._deck.querySelector(".off").hidden = false;
  v._hint.hidden = true;
  frame.focus();

  const i = live.indexOf(v);
  if (i >= 0) live.splice(i, 1);
  live.push(v);
  while (live.length > MAX_LIVE) anchor(live[0], "evicted");
}

// Dark interfaces turn to black under a sepia wash; print them as ink on paper instead.
function inkStill(img) {
  const read = () => {
    try {
      const c = document.createElement("canvas");
      c.width = 24; c.height = 15;
      const g = c.getContext("2d", { willReadFrequently: true });
      g.drawImage(img, 0, 0, 24, 15);
      const d = g.getImageData(0, 0, 24, 15).data;
      let sum = 0;
      for (let i = 0; i < d.length; i += 4) sum += 0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2];
      if (sum / (d.length / 4) < 95) img.classList.add("dark");
    } catch { /* cross-origin or not decoded: leave the sepia wash */ }
  };
  if (img.complete && img.naturalWidth) read(); else img.addEventListener("load", read, { once: true });
}

function repoLink(el, p) {
  const repo = el.querySelector(".repo");
  if (p.repo) { repo.href = p.repo; repo.setAttribute("aria-label", `View source for ${p.title}`); return; }
  // No public repo: say why instead of showing a dead link.
  const note = document.createElement("p");
  note.className = "repo note";
  note.textContent = p.context === "Production work"
    ? "Client code stays private. This demo is a replica on made-up data."
    : "Source isn't public for this one.";
  repo.replaceWith(note);
}

function specimen(p, fig, n) {
  const el = tpl.content.firstElementChild.cloneNode(true);
  el.id = p.slug;
  const v = el.querySelector(".vessel");
  v._deck = el.querySelector(".deck");
  v._hint = el.querySelector(".hint");
  v.dataset.title = p.title;
  const screen = el.querySelector(".screen");
  // The Creative cabinet keeps one frame shape; a square game takes its own shape once it runs.
  if (p.aspect) { if (fig.no === "III") v.dataset.aspect = p.aspect; else screen.style.aspectRatio = p.aspect; }
  if (p.preview) {
    const img = document.createElement("img");
    img.className = "still";
    img.src = p.preview;
    img.alt = "";
    img.loading = "lazy";
    img.decoding = "async";
    screen.prepend(img);
    inkStill(img);
  }

  el.querySelector("h3 .no").textContent = `${fig.no}.${n}`;
  el.querySelector("h3 .name").textContent = p.title;
  if (p.context) el.querySelector(".ctext2").textContent = p.context; else el.querySelector(".ctx").remove();
  el.querySelector(".tag").textContent = p.tagline;
  el.querySelector(".ctext").textContent = p.controls || "";
  el.querySelector(".desc").textContent = p.description;

  const label = (sel, text) => { const b = el.querySelector(sel); b.setAttribute("aria-label", text); b.title = text; };
  label(".sail", `Set sail: run ${p.title}`);
  label(".off", `Drop anchor: stop ${p.title}`);
  label(".reload", `Restart ${p.title}`);
  label(".full", `Fullscreen ${p.title}`);
  label(".pop", `Open ${p.title} in a new tab`);
  el.querySelector(".pop").href = p.url;

  const hl = el.querySelector(".hl");
  for (const h of (p.highlights || []).slice(0, 2)) {
    const li = document.createElement("li");
    li.textContent = h;
    hl.appendChild(li);
  }
  if (!hl.children.length) hl.remove();
  const cargo = el.querySelector(".cargo");
  if (p.tech && p.tech.length) cargo.textContent = p.tech.join(" · "); else cargo.remove();
  repoLink(el, p);

  el.querySelector(".sail").addEventListener("click", () => sail(v, p.url));
  el.querySelector(".off").addEventListener("click", () => anchor(v, "user"));
  el.querySelector(".reload").addEventListener("click", () => { anchor(v); sail(v, p.url); });
  el.querySelector(".full").addEventListener("click", () => {
    if (v.dataset.state === "off") sail(v, p.url);
    (screen.requestFullscreen || screen.webkitRequestFullscreen)?.call(screen);
  });
  return el;
}

let total = 0;
for (const s of sections) {
  if (!s.projects.length) continue;
  const fig = FIGS[s.id] || { no: "", art: "", cap: "" };
  const sec = document.createElement("section");
  sec.className = `region z-${s.id}`;
  sec.id = s.id;
  sec.setAttribute("aria-labelledby", `${s.id}-title`);
  sec.innerHTML =
    `<header class="region-head"><figure class="creature"><img src="assets/art/${fig.art}.webp" alt="" width="${fig.w}" height="${fig.h}" loading="lazy">`
    + `<figcaption>${fig.cap}</figcaption></figure>`
    + `<div><h2 id="${s.id}-title"><b>${fig.no}.</b> </h2><p></p></div></header>`
    + `<div class="cabinet"></div>`;
  sec.querySelector("h2").append(fig.title || s.title);
  sec.querySelector(".region-head p").textContent = s.blurb;
  const cab = sec.querySelector(".cabinet");
  s.projects.forEach((p, i) => cab.appendChild(specimen(p, fig, i + 1)));
  list.appendChild(sec);
  total += s.projects.length;
}
document.getElementById("count").textContent = `${total} live projects`;
document.querySelectorAll(".count").forEach((el) => { el.textContent = total; });

// The sea behind the chart: small engravings scattered down the page under the text,
// each drawn at a size that suits the animal. A fixed pseudo-random walk keeps the layout the same on every visit.
const SEA = [
  ["seahorse", 70, 1024, 1536], ["crab", 150, 1024, 1024], ["turtle", 260, 1536, 1024], ["starfish", 120, 1024, 1024],
  ["angler", 200, 1536, 1024], ["shoal", 320, 1536, 1024], ["scallop", 100, 1024, 1024], ["cuttlefish", 210, 1536, 1024],
  ["octopus", 170, 1024, 1024], ["lobster", 210, 1536, 1024], ["conch", 110, 1024, 1024], ["nautilus", 150, 1024, 1024],
];
const seaLayer = document.createElement("div");
seaLayer.className = "sea";
seaLayer.setAttribute("aria-hidden", "true");
document.body.prepend(seaLayer);
function fillSea() {
  seaLayer.replaceChildren();
  const top = opener.offsetTop + opener.offsetHeight;          // Plate I stays clean
  const bottom = document.documentElement.scrollHeight - 120;
  const W = document.documentElement.clientWidth;
  const small = W < 780 ? 0.6 : W < 1100 ? 0.8 : 1;
  let seed = 7;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  let y = top + 60, i = 0;
  while (y < bottom) {
    const [name, w0, iw, ih] = SEA[i % SEA.length];
    const w = Math.round(w0 * small), h = Math.round(w * ih / iw);
    // alternate sides, wander across the width
    const band = i % 2 ? [0.52, 0.9] : [0.08, 0.46];
    const x = Math.round(W * (band[0] + rnd() * (band[1] - band[0])) - w / 2);
    const img = document.createElement("img");
    img.src = `assets/art/${name}.webp`;
    img.alt = ""; img.width = iw; img.height = ih;
    img.loading = "lazy"; img.decoding = "async";
    img.style.cssText = `left:${Math.max(12, Math.min(W - w - 12, x))}px;top:${Math.round(y)}px;width:${w}px;rotate:${Math.round(rnd() * 24 - 12)}deg${rnd() < 0.5 ? ";scale:-1 1" : ""}`;
    seaLayer.append(img);
    y += h * 0.5 + 260 + rnd() * 220;
    i += 1;
  }
  seaLayer.style.height = `${document.documentElement.scrollHeight}px`;
}
let seaTimer = 0;
const refillSea = () => { clearTimeout(seaTimer); seaTimer = setTimeout(fillSea, 150); };
addEventListener("load", fillSea);
addEventListener("resize", refillSea);
requestAnimationFrame(fillSea);

// Descriptions fold away on phones and in the Creative cabinet; open beside the big plates.
const narrow = matchMedia("(max-width: 780px)");
const fold = () => document.querySelectorAll(".extra").forEach((d) => {
  d.open = !narrow.matches && !d.closest(".z-creative");
});
fold();
narrow.addEventListener("change", fold);

/* ---------- margin index and region creatures ---------- */

const index = document.getElementById("index");
const marks = [...index.querySelectorAll("a:not(.top)")];
const targets = marks.map((a) => document.querySelector(a.getAttribute("href")));
const opener = document.getElementById("plate");

function onScroll() {
  const line = innerHeight * 0.4;
  let cur = -1;
  targets.forEach((t, i) => { if (t && t.getBoundingClientRect().top <= line) cur = i; });
  marks.forEach((a, i) => { if (i === cur) a.setAttribute("aria-current", "true"); else a.removeAttribute("aria-current"); });
  const b = opener.getBoundingClientRect().bottom;
  index.classList.toggle("home", b > innerHeight * 0.45);
  index.classList.toggle("away", b < 0);
}
let ticking = false;
addEventListener("scroll", () => { if (!ticking) { ticking = true; requestAnimationFrame(() => { ticking = false; onScroll(); }); } }, { passive: true });
onScroll();

const seen = new IntersectionObserver((entries) => {
  for (const e of entries) if (e.isIntersecting) { e.target.classList.add("seen"); seen.unobserve(e.target); }
}, { threshold: 0.35 });
document.querySelectorAll(".region-head").forEach((h) => seen.observe(h));

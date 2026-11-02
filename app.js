// Renders sections and projects from window.SECTIONS (built by build-manifest.mjs).
// Windows stay powered off until BOOT is pressed, so the demos don't all run at once.

const list = document.getElementById("list");
const nav = document.getElementById("secnav");
const tpl = document.getElementById("tpl");
const sections = window.SECTIONS || [];

// At most MAX_LIVE windows run at once; booting another powers off the oldest.
const MAX_LIVE = 2;
const live = [];

function powerOff(win) {
  const frame = win.querySelector("iframe");
  if (frame) frame.remove();
  win.querySelector(".power").hidden = false;
  win.classList.remove("live");
}

function boot(win, url) {
  const screen = win.querySelector(".screen");
  let frame = screen.querySelector("iframe");
  if (!frame) {
    frame = document.createElement("iframe");
    frame.src = url;
    frame.title = win.querySelector(".wtitle").textContent;
    frame.allow = "fullscreen; autoplay; gamepad; camera";
    screen.appendChild(frame);
  }
  screen.querySelector(".power").hidden = true;
  win.classList.add("live");
  frame.addEventListener("load", () => frame.focus(), { once: true });
  frame.focus();

  const i = live.indexOf(win);
  if (i >= 0) live.splice(i, 1);
  live.push(win);
  while (live.length > MAX_LIVE) powerOff(live.shift());
}

function card(p) {
  const el = tpl.content.firstElementChild.cloneNode(true);
  el.id = p.slug;
  const win = el.querySelector(".win");
  if (p.aspect) el.querySelector(".screen").style.aspectRatio = p.aspect;

  el.querySelector(".wtitle").textContent = `${p.slug}.exe`;
  const kind = el.querySelector(".kind");
  if (p.context) kind.textContent = "◆ " + p.context.toUpperCase(); else kind.remove();
  el.querySelector("h2").textContent = p.title;
  el.querySelector(".tag").textContent = p.tagline;
  el.querySelector(".desc").textContent = p.description;
  el.querySelector(".controls").textContent = p.controls || "";
  el.querySelector(".pw-hint").textContent = p.tagline;
  el.querySelector(".pop").href = p.url;

  const hl = el.querySelector(".hl");
  for (const h of p.highlights || []) {
    const li = document.createElement("li");
    li.textContent = h;
    hl.appendChild(li);
  }
  if (!hl.children.length) hl.remove();

  for (const t of p.tech || []) {
    const li = document.createElement("li");
    li.textContent = t;
    el.querySelector(".tech").appendChild(li);
  }
  const repo = el.querySelector(".repo");
  if (p.repo) repo.href = p.repo;
  else { repo.removeAttribute("href"); repo.textContent = "private repo"; repo.classList.add("private"); }

  el.querySelector(".power").addEventListener("click", () => boot(win, p.url));
  el.querySelector(".reload").addEventListener("click", () => { powerOff(win); boot(win, p.url); });
  el.querySelector(".full").addEventListener("click", () => {
    boot(win, p.url);
    const screen = win.querySelector(".screen");
    (screen.requestFullscreen || screen.webkitRequestFullscreen)?.call(screen);
  });
  return el;
}

let total = 0;
sections.forEach((s, i) => {
  if (!s.projects.length) return;
  const num = String(i + 1).padStart(2, "0");

  const sec = document.createElement("section");
  sec.className = `section sec-${s.id}`;
  sec.id = s.id;
  sec.innerHTML = `<header class="sechead"><p class="secnum">${num}</p><h2></h2><p class="blurb"></p></header><div class="grid"></div>`;
  sec.querySelector("h2").textContent = s.title;
  sec.querySelector(".blurb").textContent = s.blurb;
  const grid = sec.querySelector(".grid");
  for (const p of s.projects) grid.appendChild(card(p));
  list.appendChild(sec);
  total += s.projects.length;

  const a = document.createElement("a");
  a.href = "#" + s.id;
  a.className = "chip";
  a.textContent = `${num} ${s.title.toUpperCase()}`;
  nav.appendChild(a);
});
document.getElementById("count").textContent = `${total} live projects`;
{
  const a = document.createElement("a");
  a.href = "#experience"; a.className = "chip"; a.textContent = "04 EXPERIENCE";
  nav.appendChild(a);
}

// highlight the section in view
const chips = [...nav.children];
const io = new IntersectionObserver((entries) => {
  for (const e of entries) if (e.isIntersecting) {
    chips.forEach((c) => c.classList.toggle("on", c.hash === "#" + e.target.id));
  }
}, { rootMargin: "-40% 0px -55% 0px" });
document.querySelectorAll(".section, .xp").forEach((s) => io.observe(s));

// boot text
const bootLines = [
  "VARUN-BIOS v2.6  (c) 2026",
  "memory check ........ OK",
  `loading ${total} projects ... OK`,
];
const bootEl = document.getElementById("boot");
const text = bootLines.join("\n");
if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
  bootEl.textContent = text;
} else {
  let n = 0;
  const tick = () => { bootEl.textContent = text.slice(0, ++n); if (n < text.length) setTimeout(tick, 14); };
  tick();
}

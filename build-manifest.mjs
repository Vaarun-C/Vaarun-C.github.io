// Collects projects/*/meta.json into projects.js (so the site also works from file://).
// Run: node build-manifest.mjs
import { readFileSync, writeFileSync, existsSync } from "node:fs";

// Sections and display order. Slugs without a meta.json are skipped.
const SECTIONS = [
  {
    id: "ai", title: "AI Systems",
    blurb: "Agents, retrieval and LLM products, several of them in production. Demos use made-up data.",
    slugs: ["modal-agents", "athena", "nl2sql", "slack-bots", "planner-ai", "visual-search"],
  },
  {
    id: "ml", title: "ML & Research",
    blurb: "Models and algorithms built from scratch: neuroevolution, signal processing, inverse design.",
    slugs: ["drone-detection", "antenna-inverse-design", "neat-cars", "phase-shifter-correction", "wide-ball-detection", "pagerank"],
  },
  {
    id: "creative", title: "Creative Projects",
    blurb: "Games, simulations and toys I build for fun. All of them are playable.",
    slugs: [
      "pacman", "pixelgame", "dungeon-crawler", "ki-bot", "chess", "wave-function-collapse", "falling-sand",
      "collatz", "satisfying-visualizations", "ascii-camera", "puzzle-solvers", "tom-riddle-diary",
    ],
  },
];

const out = [];
for (const s of SECTIONS) {
  const projects = [];
  for (const slug of s.slugs) {
    const file = `projects/${slug}/meta.json`;
    if (!existsSync(file)) { console.warn("missing", file); continue; }
    const meta = JSON.parse(readFileSync(file, "utf8"));
    projects.push({ slug, url: meta.url || `projects/${slug}/index.html`, ...meta, section: s.id });
  }
  out.push({ id: s.id, title: s.title, blurb: s.blurb, projects });
}
writeFileSync("projects.js", "window.SECTIONS = " + JSON.stringify(out, null, 2) + ";\n");
console.log(out.map((s) => `${s.id}: ${s.projects.length}`).join(", "));

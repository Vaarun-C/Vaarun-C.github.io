// Collects projects/*/meta.json into projects.js (so the site also works from file://).
// Run: node build-manifest.mjs
import { readFileSync, writeFileSync, existsSync } from "node:fs";

// Sections and display order. Slugs without a meta.json are skipped.
const SECTIONS = [
  {
    id: "ai", title: "AI Systems",
    blurb: "Agents, retrieval and LLM products. The first three run in production; their demos are replicas on made-up data.",
    slugs: ["nl2sql", "planner-ai", "visual-search", "slack-bots", "athena", "modal-agents"],
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
      "collatz", "satisfying-visualizations", "ascii-camera", "puzzle-solvers",
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
    // A real capture of the running demo, shown unlit until the visitor switches the lights on.
    const preview = existsSync(`projects/${slug}/preview.jpg`) ? `projects/${slug}/preview.jpg` : null;
    projects.push({ slug, url: meta.url || `projects/${slug}/index.html`, preview, ...meta, section: s.id });
  }
  out.push({ id: s.id, title: s.title, blurb: s.blurb, projects });
}
writeFileSync("projects.js", "window.SECTIONS = " + JSON.stringify(out, null, 2) + ";\n");
console.log(out.map((s) => `${s.id}: ${s.projects.length}`).join(", "));

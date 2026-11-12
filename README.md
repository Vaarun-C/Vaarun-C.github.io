# portfolio

Varun's projects, each running live in its own window.

Static site, no build step. Every project lives in `projects/<slug>/` with:

- `index.html`: the live demo, loaded into an iframe when the visitor presses BOOT
- `meta.json`: title, tagline, description, tech, kind (`game|sim|ml|tool|web`), repo, controls, and optional `url` (external demo) and `aspect` (window shape, for example `"1 / 1"`)

After adding or editing a `meta.json`, rebuild the list:

```
node build-manifest.mjs   # writes projects.js; the display order is ORDER in that file
```

Run locally:

```
python3 -m http.server 8731 --bind 127.0.0.1
```

Work projects use made-up demo data only. This site is public.

## Look

The site is an antique sea chart and bestiary ("Plate I"). Each section has an engraved creature:
whale (AI Systems), jellyfish (ML & Research), sea serpent (Creative), dolphins (Logbook), and a kraken at the edge of the map (contact). Small creatures (crab, seahorse, turtle and others) sit faintly in the background behind the text.
`Set sail` runs a demo in its frame; two run at a time, `Drop anchor` stops one.

## Art

`assets/art/*.webp` are engravings generated with OpenAI gpt-image-2.6 through the Batch API, then cut out
onto a transparent ground. Originals, prompts and the scripts live in `.impeccable/art-raw/` (see `PROVENANCE.md`).
To regenerate: put `OPENAIKEY=...` in `.env`, then run `python3 .impeccable/art-raw/imgbatch.py submit`,
`status`, and `fetch`, and convert with `inkify.py` (needs Pillow).

Never publish `.env`, `.impeccable/` or `graphify-out/`: deploy only `index.html`, `style.css`, `app.js`,
`projects.js`, `Resume.pdf`, `assets/` and `projects/`.

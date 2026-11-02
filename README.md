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

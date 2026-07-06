# Khubaib Nazeer — Portfolio

Personal portfolio site for Khubaib Nazeer, CS undergrad at FAST NUCES Lahore.
Plain HTML/CSS/JS — no build step, no framework.

**Live:** https://khubaib7-del.github.io/Khubaib-Nazeer-Protfolio/

## Stack

- Vanilla HTML/CSS/JS (ES modules)
- [GSAP](https://gsap.com/) + ScrollTrigger for scroll-driven animation
- [Lenis](https://github.com/darkroomengineering/lenis) for smooth scroll
- [Three.js](https://threejs.org/) for the hero 3D room scene
- Canvas 2D for the pixel-art finale

## Running locally

No build step — serve the folder with any static file server:

```bash
python -m http.server 8000
```

Then open `http://localhost:8000`.

## Structure

```
index.html
css/style.css        — all styles
js/                   — main.js + one module per interactive feature
assets/videos/        — project demo clips (compressed before committing — see .gitignore)
assets/certificates/  — certificate images, auto-discovered — see below
content/              — draft bio/project copy, not read at runtime
```

## Adding a certificate

No code edits needed. Drop the image into `assets/certificates/` named the
next number in sequence (`1.jpg`, `2.jpg`, ... — jpg/jpeg/png/webp all work).
`js/certificates.js` probes for those files at load and builds the cards from
whatever it finds, so numbering must stay contiguous from 1 (no gaps).

Optionally add a same-numbered `.json` file for a verify link and custom alt
text, e.g. `2.json`:

```json
{ "alt": "Certificate title — Issuer", "verifyUrl": "https://..." }
```

Both fields are optional — without `verifyUrl` the card just has no "Verify
Certificate" overlay link; without the file at all it falls back to a generic
"Certificate N" alt text.

## Deploying

Pushed to `main` → served via GitHub Pages from the repo root.

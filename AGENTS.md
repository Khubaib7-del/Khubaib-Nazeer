# Agent Guide — Khubaib Nazeer Portfolio

This file tells AI coding agents how to safely add content to this portfolio site.
**Do NOT refactor, restyle, or restructure existing code.** Only touch the specific
sections described below.

---

## 1. Adding a Skill Chip

**File:** `index.html` — inside `<div class="skills-board" id="skills-board">`

### With a devicon SVG (preferred)
```html
<div class="skill-chip"><span class="skill-chip-icon"><img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/ICON_NAME/ICON_NAME-original.svg" alt=""></span><span>Display Name</span></div>
```
Browse icons at: https://devicon.dev

### With a custom image (when devicon doesn't have it)
Place the image in `assets/` and reference it:
```html
<div class="skill-chip"><span class="skill-chip-icon"><img src="assets/my-logo.png" alt=""></span><span>Display Name</span></div>
```

### With a text fallback (no icon available)
```html
<div class="skill-chip"><span class="skill-chip-icon skill-chip-icon-text">TXT</span><span>Display Name</span></div>
```

### Commented-out skills (to learn later)
There is a commented block `<!-- Uncomment as you learn these: ... -->` at the
end of the skills board. To activate one, move the chip **above** the comment
opening `<!--` and remove nothing else.

---

## 2. Adding a Project Card

**File:** `index.html` — inside `<div class="h-track" id="collection-track">`

### Card template
Insert a new `<article>` before the `project-card-link` ("More on GitHub") card.
Update the `project-num` to the next number and bump the "More on GitHub" card's
number by one.

```html
<article class="project-card">
  <p class="project-prompt">$ open project-slug</p>
  <div class="project-num">NN</div>
  <h3>Project Name</h3>
  <p class="project-tag">Tech · Stack · Here</p>
  <p class="project-desc">One-sentence description of what the project does.</p>
  <ul class="project-meta">
    <li><span>Stack</span><span>Tech, Stack, Here</span></li>
    <li><span>Status</span><span>STATUS</span></li>
  </ul>
  <div class="project-card-links">
    <button class="btn btn-outline magnetic btn-watch project-watch" data-src="assets/videos/PROJECT-web.mp4" data-title="Project Name">Watch Demo ▶</button>
    <a href="LIVE_URL" target="_blank" rel="noopener" class="project-link">Live ↗</a>
    <a href="GITHUB_URL" target="_blank" rel="noopener" class="project-link">GitHub ↗</a>
  </div>
</article>
```

### Status values
Use one of these based on deployment:
- `Deployed on Vercel` — app is live on Vercel
- `Docs on Vercel` — docs/guide site on Vercel
- `Live on GitHub Pages` — deployed via GitHub Pages
- `Source on GitHub` — not deployed, code only

### Omit the "Live ↗" link if status is "Source on GitHub".

### Checklist after adding a card
1. Renumber all subsequent `project-num` values (including "More on GitHub")
2. Update the heading in `.h-section-head h2`: e.g. "Eight shipped." → "Nine shipped."
3. Update stat `data-target` for "Self-driven Projects Built" in the `#stats` section
4. Update stat `data-target` for "Public Repos on GitHub" if it's a new repo
5. Update the repo count text in the "More on GitHub" card's `project-tag`
6. Create a content markdown file: `content/projects/NN-project-slug.md`

### Content markdown template (`content/projects/NN-project-slug.md`)
```markdown
# Project: Project Name

- Name: Project Name
- Pitch: One-line description
- Stack: Tech, Stack, Here
- Video: assets/videos/project-slug-web.mp4
- GitHub: https://github.com/Khubaib7-del/repo-name
- Status: wired into site
```

### Video files
- Place the raw video in `assets/videos/` as `project-slug.mp4`
- Compress to web version (target under 5 MB):
  ```
  ffmpeg -i project-slug.mp4 -vcodec libx264 -crf 28 -preset slow -vf "scale=1280:-2" -an project-slug-web.mp4
  ```
- The card references the `-web.mp4` version
- Delete the raw original after compression — only `-web.mp4` files are committed
- `.gitignore` already excludes `*.mp4` and allows `*-web.mp4`

---

## 3. Adding a Certificate

**No code edits needed.** The certificates section is fully dynamic.

### Steps
1. Drop the certificate image into `assets/certificates/` named as the next
   number in sequence: `1.jpg`, `2.jpg`, `3.png`, etc.
   - Supported formats: jpg, jpeg, png, webp
   - Numbering must be contiguous from 1 (no gaps)

2. Create a same-numbered `.json` file for metadata:

```json
{
  "alt": "Certificate Title — Issuer, via Platform",
  "verifyUrl": "https://example.com/verify/CERT_ID"
}
```

Both fields are optional:
- Without `verifyUrl`: no "Verify Certificate" overlay link
- Without the `.json` file entirely: falls back to "Certificate N" alt text

### Example
```
assets/certificates/2.jpg        ← the certificate image
assets/certificates/2.json       ← { "alt": "...", "verifyUrl": "..." }
```

`js/certificates.js` auto-discovers images at load time — no HTML or JS changes needed.

---

## Things NOT to touch

- **CSS** (`css/style.css`) — do not modify styles
- **JavaScript** (`js/`) — do not modify any JS files
- **Animations** — GSAP, ScrollTrigger, Lenis, canvas scenes — leave them alone
- **Layout/structure** — do not change section order, nav, footer, or loader
- **Hero section** — do not modify
- **Meta tags / SEO** — do not modify unless explicitly asked

## Git conventions

- Commit the owner (Khubaib Nazeer) as sole author — no co-author tags
- Keep commit messages short and descriptive
- Push to `main` branch

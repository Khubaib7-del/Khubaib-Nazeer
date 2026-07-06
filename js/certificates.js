// Auto-discovers certificate images from assets/certificates/ so adding a new
// certificate is just "drop the file in, name it the next number" — no HTML
// or JS edits needed. There's no server/build step on this static site, so
// there's no directory listing to ask for; instead this probes for
// 1.<ext>, 2.<ext>, 3.<ext>... in order and stops at the first number that
// doesn't exist (numbering must stay contiguous from 1, no gaps).
//
// Optional metadata per certificate: a same-numbered .json file next to the
// image (e.g. 2.json) with { "alt": "...", "verifyUrl": "..." }. Both fields
// are optional — without a verifyUrl the card just skips the "Verify
// Certificate" overlay link; without the file at all it falls back to a
// generic alt text.

const EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp'];
const MAX_CERTS = 30; // sane upper bound so a numbering typo can't loop forever

function imageExists(src) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(true);
    img.onerror = () => resolve(false);
    img.src = src;
  });
}

async function findCertImage(n) {
  for (const ext of EXTENSIONS) {
    const src = `assets/certificates/${n}.${ext}`;
    if (await imageExists(src)) return src;
  }
  return null;
}

async function loadCertMeta(n) {
  try {
    const res = await fetch(`assets/certificates/${n}.json`, { cache: 'no-store' });
    if (!res.ok) return {};
    return await res.json();
  } catch {
    return {};
  }
}

function buildCard(src, meta, n) {
  const article = document.createElement('article');
  article.className = 'cert-card';

  const inner = document.createElement('div');
  inner.className = 'cert-card-inner';

  const glow = document.createElement('div');
  glow.className = 'cert-card-glow';

  const frame = document.createElement('div');
  frame.className = 'cert-card-frame';

  const img = document.createElement('img');
  img.src = src;
  img.alt = meta.alt || meta.title || `Certificate ${n}`;
  img.loading = 'lazy';

  const shine = document.createElement('div');
  shine.className = 'cert-card-shine';

  frame.append(img, shine);

  if (meta.verifyUrl) {
    const overlay = document.createElement('div');
    overlay.className = 'cert-card-overlay';
    const link = document.createElement('a');
    link.href = meta.verifyUrl;
    link.target = '_blank';
    link.rel = 'noopener';
    link.className = 'cert-card-verify';
    link.textContent = 'Verify Certificate ↗';
    overlay.appendChild(link);
    frame.appendChild(overlay);
  }

  inner.append(glow, frame);
  article.appendChild(inner);
  return article;
}

// Populates #cert-stack and returns the number of certificates found. Hides
// the whole section if none exist, instead of showing an empty heading.
export async function buildCertificateCards() {
  const section = document.getElementById('certificates');
  const stack = document.getElementById('cert-stack');
  if (!section || !stack) return 0;

  const found = [];
  for (let n = 1; n <= MAX_CERTS; n++) {
    const src = await findCertImage(n);
    if (!src) break;
    found.push({ n, src });
  }

  if (!found.length) {
    section.style.display = 'none';
    return 0;
  }

  stack.innerHTML = '';
  for (const { n, src } of found) {
    const meta = await loadCertMeta(n);
    stack.appendChild(buildCard(src, meta, n));
  }

  return found.length;
}

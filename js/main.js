import { initRoomScene } from './room-scene.js';
import { initPixelArt } from './pixel-art.js';
import { applySmokeText } from './smoke-text.js';
import { applyGradientWipe, applyScatterBounce, applyStampIn, applyWordSlideIn } from './text-effects.js';
import { initCourseRing } from './course-ring.js';
import { initSkillsPuzzle } from './skills-puzzle.js';
import { buildCertificateCards } from './certificates.js';

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Belt-and-suspenders for the "always reload from the top" requirement — the
// inline <head> script handles a normal reload, this covers a bfcache restore
// (browser back/forward), which fires pageshow instead of a fresh page load.
window.addEventListener('pageshow', () => window.scrollTo(0, 0));

gsap.registerPlugin(ScrollTrigger);

// Start the loader animation immediately — it's self-contained (own GSAP
// timeline + interval), so it doesn't need to wait on anything below.
runLoader();

// Certificates are discovered from assets/certificates/ at runtime (see
// certificates.js) rather than hardcoded in this file, so the DOM has to be
// populated before any ScrollTrigger below measures the page. Top-level
// await in a module pauses the rest of this file until it resolves, which
// also keeps the pin-ordering rule below intact without reshuffling code.
await buildCertificateCards();

// Real bug found via testing (confirmed with direct ScrollTrigger.start
// inspection): every trigger positioned after #collection was being created
// BEFORE setupHorizontalScroll() ever ran, so they measured the document
// *without* the pinned section's scroll-spacer in the DOM yet — off by
// exactly getMax() (track.scrollWidth - innerWidth) for every trigger below
// it. ScrollTrigger.refresh() does NOT fix an already-created trigger's
// stale start position (verified — calling it repeatedly never corrected
// it; only killing and recreating the trigger did), so the real fix is
// ordering: create the pin first, before anything below it gets measured.
setupHorizontalScroll('#collection', '#collection-track', '#collection-progress');
// Same ordering logic: cert deck pin creates a spacer that shifts everything
// below it — must be called before stories/legacy triggers measure positions.
setupCertStack();

// Belt-and-suspenders for any *other* future layout shift (lazy images,
// font swap, more content added later) — refresh on any body resize.
// This does NOT fix the pin-ordering issue above (see comment), it's a
// separate, narrower safety net for legitimately async changes.
let refreshTimer;
new ResizeObserver(() => {
  clearTimeout(refreshTimer);
  refreshTimer = setTimeout(() => ScrollTrigger.refresh(), 150);
}).observe(document.body);

document.fonts.ready.then(() => ScrollTrigger.refresh());

/* ---------- Custom cursor: ember dot + lagging ring, expands over interactive elements ---------- */
if (!reducedMotion && window.matchMedia('(pointer: fine)').matches) {
  const dot = document.getElementById('cursor-dot');
  const ring = document.getElementById('cursor-ring');
  document.body.classList.add('has-custom-cursor');
  gsap.set([dot, ring], { xPercent: -50, yPercent: -50 });

  const ringX = gsap.quickTo(ring, 'x', { duration: 0.4, ease: 'power3' });
  const ringY = gsap.quickTo(ring, 'y', { duration: 0.4, ease: 'power3' });
  window.addEventListener('mousemove', (e) => {
    gsap.set(dot, { x: e.clientX, y: e.clientY });
    ringX(e.clientX);
    ringY(e.clientY);
  });

  document.querySelectorAll('a, button, .skill-chip, .cert-card-frame').forEach((el) => {
    el.addEventListener('mouseenter', () => ring.classList.add('is-active'));
    el.addEventListener('mouseleave', () => ring.classList.remove('is-active'));
  });
}

// Adopt the CSS-painted translateY(110%) into GSAP's own yPercent tracking
// so the later yPercent:0 tween actually has something to animate from.
gsap.set('.reveal-line', { yPercent: 110 });

/* ---------- Section boundaries: a drawn line marking the shift into each section ---------- */
['#philosophy', '#education', '#skills', '#collection', '#certificates', '#stories', '#legacy'].forEach((sel) => {
  const section = document.querySelector(sel);
  if (!section) return;
  const boundary = document.createElement('div');
  boundary.className = 'section-boundary';
  boundary.innerHTML = '<span></span>';
  section.prepend(boundary);
  gsap.to(boundary.querySelector('span'), {
    scaleX: 1,
    ease: 'none',
    scrollTrigger: { trigger: section, start: 'top 95%', end: 'top 55%', scrub: 0.5 },
  });
});

/* ---------- Lenis smooth scroll ---------- */
const lenis = new Lenis({
  duration: 1.35,
  easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
  smoothWheel: true,
  wheelMultiplier: 1,
  touchMultiplier: 1.6,
  syncTouch: false,
});
lenis.on('scroll', ScrollTrigger.update);
gsap.ticker.add((time) => lenis.raf(time * 1000));
gsap.ticker.lagSmoothing(0);
ScrollTrigger.config({ ignoreMobileResize: true });

/* ---------- Loader ---------- */
function runLoader() {
  const loader = document.getElementById('loader');
  const mark = document.querySelector('.loader-mark');
  const iconL = document.querySelector('.loader-icon-l');
  const iconR = document.querySelector('.loader-icon-r');
  const fill = document.getElementById('loader-progress');
  const pct = document.getElementById('loader-pct');

  // Logo-style entrance: the bracket icon starts merged in the middle (its
  // two halves overlapping, as if "</>" were collapsed into one point) then
  // springs apart into place, and the name sweeps in from dim to full color
  // right after — instead of the name just sitting there static while only
  // the bar moves.
  const chars = [...mark.textContent].map((ch) => {
    const span = document.createElement('span');
    span.className = 'loader-char';
    span.textContent = ch;
    return span;
  });
  mark.innerHTML = '';
  chars.forEach((c) => mark.appendChild(c));

  gsap
    .timeline()
    .fromTo(iconL, { x: 10, opacity: 0 }, { x: 0, opacity: 1, duration: 0.5, ease: 'power3.out' })
    .fromTo(iconR, { x: -10, opacity: 0 }, { x: 0, opacity: 1, duration: 0.5, ease: 'power3.out' }, '<')
    .fromTo(
      chars,
      { opacity: 0, y: 10, scale: 0.85, color: '#9d9890' },
      { opacity: 1, y: 0, scale: 1, color: '#f3f0e9', duration: 0.45, stagger: 0.035, ease: 'power2.out' },
      '-=0.15'
    );

  let p = 0;
  const tick = setInterval(() => {
    p += Math.random() * 16;
    if (p >= 92) {
      clearInterval(tick);
      // Finish the last stretch as one deliberate tween to exactly 100 instead
      // of however far the last random increment happened to land — reads as
      // an intentional finish rather than a jumpy final step.
      const proxy = { v: p };
      gsap.to(proxy, {
        v: 100,
        duration: 0.5,
        ease: 'power2.out',
        onUpdate() {
          fill.style.width = proxy.v + '%';
          pct.textContent = Math.floor(proxy.v) + '%';
        },
        onComplete: () => {
          gsap.to(loader, {
            opacity: 0,
            scale: 1.04,
            duration: 0.7,
            ease: 'power2.inOut',
            onComplete: () => {
              loader.style.display = 'none';
              playHeroIntro();
            },
          });
        },
      });
      return;
    }
    fill.style.width = p + '%';
    pct.textContent = Math.floor(p) + '%';
  }, 140);
}

function playHeroIntro() {
  gsap.to('.reveal-line', {
    yPercent: 0,
    duration: 1,
    ease: 'power4.out',
    stagger: 0.1,
  });
  gsap.to('.hero .reveal-up', {
    y: 0,
    opacity: 1,
    duration: 0.9,
    ease: 'power3.out',
    stagger: 0.12,
    delay: 0.3,
  });
}

/* ---------- Top scroll progress bar ---------- */
gsap.to('#scroll-progress-fill', {
  scaleX: 1,
  ease: 'none',
  scrollTrigger: {
    trigger: document.body,
    start: 'top top',
    end: 'bottom bottom',
    scrub: 0.3,
  },
});

/* ---------- Nav: hide on scroll down, shrink, mobile burger ---------- */
const nav = document.getElementById('nav');
let lastY = 0;
lenis.on('scroll', ({ scroll }) => {
  nav.classList.toggle('nav-scrolled', scroll > 40);
  if (scroll > lastY && scroll > 200) nav.classList.add('nav-hidden');
  else nav.classList.remove('nav-hidden');
  lastY = scroll;
});

const burger = document.getElementById('nav-burger');
const navMobile = document.getElementById('nav-mobile');
burger.addEventListener('click', () => {
  burger.classList.toggle('open');
  navMobile.classList.toggle('open');
});
navMobile.querySelectorAll('a').forEach((a) =>
  a.addEventListener('click', () => {
    burger.classList.remove('open');
    navMobile.classList.remove('open');
  })
);

/* ---------- Project video lightbox — builds exactly one media element fresh
   per click (instead of toggling visibility on two pre-existing elements,
   which was rendering both at once) so there's never a stray empty box. ---------- */
const videoModal = document.getElementById('video-modal');
const videoBody = document.getElementById('video-modal-body');
const videoFallback = document.getElementById('video-modal-fallback');
const videoTitle = document.getElementById('video-modal-title');
const videoClose = document.getElementById('video-modal-close');

function closeVideoModal() {
  videoModal.classList.remove('open');
  videoBody.innerHTML = '';
  document.body.style.overflow = '';
}
document.querySelectorAll('.project-watch').forEach((btn) => {
  btn.addEventListener('click', () => {
    videoTitle.textContent = btn.dataset.title || '';
    videoBody.innerHTML = '';
    if (btn.dataset.embed === 'linkedin') {
      const iframe = document.createElement('iframe');
      iframe.src = btn.dataset.src;
      iframe.allowFullscreen = true;
      iframe.title = 'Embedded post';
      videoBody.appendChild(iframe);
      videoFallback.href = btn.dataset.fallback;
      videoFallback.style.display = 'inline-block';
    } else {
      const video = document.createElement('video');
      video.controls = true;
      video.src = btn.dataset.src;
      videoBody.appendChild(video);
      video.play().catch(() => {});
      videoFallback.style.display = 'none';
    }
    videoModal.classList.add('open');
    document.body.style.overflow = 'hidden';
  });
});
videoClose.addEventListener('click', closeVideoModal);
videoModal.addEventListener('click', (e) => {
  if (e.target === videoModal) closeVideoModal();
});
window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && videoModal.classList.contains('open')) closeVideoModal();
});

/* ---------- Magnetic buttons ---------- */
if (!reducedMotion) {
  document.querySelectorAll('.magnetic').forEach((btn) => {
    const move = gsap.quickTo(btn, 'x', { duration: 0.35, ease: 'power3' });
    const movey = gsap.quickTo(btn, 'y', { duration: 0.35, ease: 'power3' });
    btn.addEventListener('mousemove', (e) => {
      const r = btn.getBoundingClientRect();
      move((e.clientX - r.left - r.width / 2) * 0.35);
      movey((e.clientY - r.top - r.height / 2) * 0.35);
    });
    btn.addEventListener('mouseleave', () => {
      move(0);
      movey(0);
    });
  });
}

/* ---------- Generic reveal-up elements outside hero ---------- */
gsap.utils.toArray('.reveal-up').forEach((el) => {
  if (el.closest('.hero')) return; // hero handled by intro timeline
  gsap.fromTo(
    el,
    { y: 32, opacity: 0 },
    {
      y: 0,
      opacity: 1,
      duration: 0.8,
      ease: 'power3.out',
      scrollTrigger: { trigger: el, start: 'top 85%' },
    }
  );
});

/* ---------- Heading reveals: deliberately different techniques per section ---------- */
applySmokeText('.split-text'); // Philosophy: full smoke in-then-out, the section's signature effect
applySmokeText('.legacy-text h2', { dissolveOut: false }); // finale stays calm
// Certificates: eyebrow slides in first, then h2 words flow L→R
applyWordSlideIn('.certificates-head .eyebrow', { stagger: 0.07, duration: 0.45, x: -22, start: 'top 88%' });
applyWordSlideIn('.certificates-head h2', { stagger: 0.1, duration: 0.65, x: -32, start: 'top 82%' });
applyGradientWipe('.education h2'); // ember color sweep
applyScatterBounce('.skills h2', { spread: 90, ease: 'bounce.out', minDuration: 0.4, maxDuration: 0.7, cascade: 0.35, jitter: 0.1 }); // tight, snappy bounce — ties to the puzzle below it
gsap.utils.toArray('.h-section-head h2').forEach((el) => {
  gsap.fromTo(
    el,
    { clipPath: 'inset(0 100% 0 0)' },
    { clipPath: 'inset(0 0% 0 0)', ease: 'none', scrollTrigger: { trigger: el, start: 'top 85%', end: 'top 50%', scrub: true } }
  );
}); // Projects: curtain-wipe mask
applyScatterBounce('.stories h2', { spread: 170, ease: 'elastic.out(1, 0.5)', minDuration: 0.55, maxDuration: 0.95, cascade: 0.55, jitter: 0.15 }); // wide, loose elastic wobble

gsap.to('.philosophy-bg', {
  backgroundPosition: '100% 50%',
  ease: 'none',
  scrollTrigger: { trigger: '.philosophy', start: 'top bottom', end: 'bottom top', scrub: 0.6 },
});

/* ---------- Room hero scene, driven by scroll ---------- */
const canvas = document.getElementById('terminal-canvas');
const roomScene = initRoomScene(canvas);
gsap.ticker.add(roomScene.render);

ScrollTrigger.create({
  trigger: '#hero',
  start: 'top top',
  end: 'bottom top',
  scrub: 0.4,
  onUpdate: (self) => roomScene.setScrollProgress(self.progress),
});

/* ---------- Education: rotating coursework ring + badge ---------- */
initCourseRing(
  document.getElementById('course-ring-wrap'),
  document.getElementById('course-ring'),
  gsap.utils.toArray('.course-card')
);
const eduBadge = document.querySelector('#education-badge .education-badge-ring');
if (eduBadge) gsap.to(eduBadge, { rotationY: '+=360', duration: 5, ease: 'none', repeat: -1 });

/* ---------- Skills: rotating tile puzzle ---------- */
initSkillsPuzzle({
  stage: document.getElementById('skills-stage'),
  board: document.getElementById('skills-board'),
  flankLeft: document.getElementById('skills-flank-left'),
  flankRight: document.getElementById('skills-flank-right'),
  chips: gsap.utils.toArray('.skill-chip'),
  reducedMotion,
});

/* ---------- 3D tilt on project cards (follows cursor) ---------- */
if (!reducedMotion) {
  document.querySelectorAll('.project-card').forEach((card) => {
    const rotX = gsap.quickTo(card, 'rotationX', { duration: 0.4, ease: 'power3' });
    const rotY = gsap.quickTo(card, 'rotationY', { duration: 0.4, ease: 'power3' });
    const lift = gsap.quickTo(card, 'y', { duration: 0.4, ease: 'power3' });
    card.addEventListener('mousemove', (e) => {
      const r = card.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5;
      const py = (e.clientY - r.top) / r.height - 0.5;
      rotX(py * -10);
      rotY(px * 10);
      lift(-6);
    });
    card.addEventListener('mouseleave', () => {
      rotX(0);
      rotY(0);
      lift(0);
    });
  });
}

/* ---------- Currently Exploring: section glow + alternating card entrance ---------- */
ScrollTrigger.create({ trigger: '.stories', start: 'top 75%', toggleClass: 'in-view' });
gsap.utils.toArray('.interest-card').forEach((card, i) => {
  const fromX = i % 2 === 0 ? -36 : 36;
  gsap.fromTo(
    card,
    { opacity: 0, x: fromX, rotate: i % 2 === 0 ? -3 : 3 },
    {
      opacity: 1,
      x: 0,
      rotate: 0,
      duration: 0.8,
      delay: i * 0.08,
      ease: 'power3.out',
      scrollTrigger: { trigger: card, start: 'top 88%' },
    }
  );
});

/* ---------- Certificate cards: cursor tilt + shine, lightbox ---------- */
/* Entrance + deck animation handled by setupCertStack() above */

if (!reducedMotion) {
  document.querySelectorAll('.cert-card-inner').forEach((inner) => {
    const rotX = gsap.quickTo(inner, 'rotationX', { duration: 0.4, ease: 'power3' });
    const rotY = gsap.quickTo(inner, 'rotationY', { duration: 0.4, ease: 'power3' });
    const shine = inner.querySelector('.cert-card-shine');
    inner.addEventListener('mousemove', (e) => {
      const r = inner.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width;
      const py = (e.clientY - r.top) / r.height;
      rotX((py - 0.5) * -14);
      rotY((px - 0.5) * 14);
      if (shine) shine.style.background = `radial-gradient(circle at ${px * 100}% ${py * 100}%, rgba(255,255,255,0.35), transparent 55%)`;
    });
    inner.addEventListener('mouseleave', () => {
      rotX(0);
      rotY(0);
      if (shine) shine.style.background = 'transparent';
    });
  });
}

const certModal = document.getElementById('cert-modal');
const certModalImg = document.getElementById('cert-modal-img');
const certModalClose = document.getElementById('cert-modal-close');
function closeCertModal() {
  certModal.classList.remove('open');
  certModalImg.removeAttribute('src');
  document.body.style.overflow = '';
}
// Click anywhere on the card frame (but not the verify link) opens the lightbox.
document.querySelectorAll('.cert-card-frame').forEach((frame) => {
  frame.addEventListener('click', (e) => {
    if (e.target.closest('.cert-card-verify')) return;
    const img = frame.querySelector('img');
    if (!img) return;
    certModalImg.src = img.src;
    certModalImg.alt = img.alt;
    certModal.classList.add('open');
    document.body.style.overflow = 'hidden';
  });
});
certModalClose.addEventListener('click', closeCertModal);
certModal.addEventListener('click', (e) => {
  if (e.target === certModal) closeCertModal();
});
window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && certModal.classList.contains('open')) closeCertModal();
});

/* ---------- Certificate deck: build-from-bottom stacking scroll ----------
   Cards rise from below one by one. Each new arrival becomes the main card
   (y = 0, front of stack). Previous cards are pushed UPWARD and peek as
   horizontal strips above the main card — like a fanned deck held from below.
   Total scroll ≈ 2.2 viewports; full stack is visible after ~1.5 viewports.
-------------------------------------------------------------------------- */
function setupCertStack() {
  const wrapper = document.getElementById('cert-stack');
  const countEl = document.getElementById('cert-stack-count');
  if (!wrapper) return;

  const cards = [...wrapper.querySelectorAll('.cert-card')];
  if (!cards.length) return;

  const section = document.querySelector('#certificates');

  wrapper.classList.add('cert-stack--active');
  section.classList.add('cert-section--stacked');

  const N     = cards.length;
  if (countEl) countEl.textContent = `1 / ${N}`; // HTML ships a "1 / 1" placeholder — correct it before any scroll happens
  const cardH = cards[0].offsetHeight;

  const Y_PEEK = 62;   // px each older card peeks above the main card
  const SC     = 0.07; // scale reduction per depth level above

  // Push wrapper down so the peek zone above it doesn't overlap the heading.
  const peekAbove = (N - 1) * Y_PEEK;
  wrapper.style.height    = cardH + 'px';
  wrapper.style.marginTop = peekAbove + 'px';

  // Compute start position: cards begin just below the section's bottom edge.
  // The section uses overflow:clip, so anything below the section boundary
  // is invisible. Cards rise from there — the full travel is visible as they
  // emerge from the section bottom, and the black background shows below them
  // throughout the animation.
  const sR   = section.getBoundingClientRect();
  const wR   = wrapper.getBoundingClientRect();
  const wtis = wR.top - sR.top;                 // wrapper top inside section (px from section top)
  const startY = window.innerHeight - wtis + 8; // 8px below section bottom → immediately clipped

  // z-index: card[i+1] renders in front of card[i].
  // The LAST card (i = N-1) has highest z-index → it is always the main card.
  cards.forEach((card, i) => {
    gsap.set(card, {
      xPercent:        -50,
      y:               startY,
      scale:           1,
      opacity:         1,   // no fade — viewport clipping hides cards while off-screen
      zIndex:          i + 1,
      transformOrigin: 'center top', // top-anchored so peek strip stays exactly Y_PEEK tall
    });
  });

  const cardDur    = 0.85;
  const stagger    = 0.2;
  const holdTime   = 0.6;   // extra hold after last card lands
  const totalDur   = (N - 1) * stagger + cardDur + holdTime;
  // Scale with card count instead of a fixed 2.2 viewports — a fixed distance
  // meant one certificate finished landing almost immediately, then held the
  // pin through a long stretch of scroll with nothing happening on screen.
  const totalScroll = Math.round(window.innerHeight * (0.7 + 0.55 * N));

  const tl = gsap.timeline({
    scrollTrigger: {
      trigger:    section,
      pin:        true,
      pinSpacing: true,
      scrub:      1,
      start:      'top top',
      end:        `+=${totalScroll}`,
      onUpdate(self) {
        if (!countEl) return;
        const elapsed = self.progress * totalDur;
        let landed = 0;
        for (let i = 0; i < N; i++) {
          if (elapsed >= i * stagger + cardDur * 0.85) landed = i + 1;
        }
        countEl.textContent = `${Math.min(landed, N)} / ${N}`;
      },
    },
  });

  cards.forEach((card, i) => {
    // New card rises from below and becomes the main card at y = 0.
    tl.to(card, {
      y:        0,
      scale:    1,
      duration: cardDur,
      ease:     'power3.out',
    }, i * stagger);

    // All previously landed cards shift one step upward.
    for (let j = 0; j < i; j++) {
      const depth = i - j;
      tl.to(cards[j], {
        y:        -(depth * Y_PEEK),
        scale:    1 - depth * SC,
        duration: cardDur,
        ease:     'power2.out',
      }, i * stagger);
    }
  });
}

/* ---------- Horizontal scroll sections ---------- */
function setupHorizontalScroll(sectionSel, trackSel, progressSel) {
  const section = document.querySelector(sectionSel);
  const pin = section.querySelector('.h-pin');
  const track = document.querySelector(trackSel);
  const progress = document.querySelector(progressSel);
  const getMax = () => track.scrollWidth - window.innerWidth;

  // Pin the .h-pin box itself, not the whole section — pinning the section
  // (which also contains .h-section-head above it) made the head eat into
  // the pinned 100vh box, pushing card bottoms below the visible viewport.
  const cardEls = gsap.utils.toArray(track.children);
  gsap.set(cardEls, { opacity: 0, y: 36, scale: 0.94 });

  // Active-card spotlight: once the intro stagger is done, whichever card is
  // nearest the viewport center scales up + brightens while its neighbors dim —
  // gives the cards their own continuous motion through the scroll-through,
  // not just a single shared entrance plus the track sliding underneath them.
  let introDone = false;
  const cardScale = cardEls.map((el) => gsap.quickTo(el, 'scale', { duration: 0.3, ease: 'power2' }));
  const cardOpacity = cardEls.map((el) => gsap.quickTo(el, 'opacity', { duration: 0.3, ease: 'power2' }));

  gsap.to(track, {
    x: () => -getMax(),
    ease: 'none',
    scrollTrigger: {
      trigger: pin,
      start: 'top top',
      end: () => '+=' + getMax(),
      scrub: 0.5,
      pin: true,
      anticipatePin: 1,
      invalidateOnRefresh: true,
      onUpdate: (self) => {
        if (progress) progress.style.transform = `scaleX(${self.progress})`;
        if (!introDone) return;
        const centerX = window.innerWidth / 2;
        cardEls.forEach((el, i) => {
          const r = el.getBoundingClientRect();
          const dist = Math.min(Math.abs(r.left + r.width / 2 - centerX) / (window.innerWidth / 2), 1);
          cardScale[i](1 + (1 - dist) * 0.06);
          cardOpacity[i](0.6 + (1 - dist) * 0.4);
        });
      },
    },
  });

  ScrollTrigger.create({
    trigger: pin,
    start: 'top 85%',
    once: true,
    onEnter: () =>
      gsap.to(cardEls, {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: 0.7,
        ease: 'power3.out',
        stagger: 0.08,
        onComplete: () => { introDone = true; },
      }),
  });
}
// Called near the top of this file, before any trigger positioned after
// #collection gets created — see the comment there for why.

/* ---------- Stat counters, paired with a gauge bar that fills in lockstep ---------- */
gsap.utils.toArray('.stat-num').forEach((el) => {
  const target = parseFloat(el.dataset.target);
  const suffix = el.dataset.suffix || '';
  const plain = el.hasAttribute('data-plain'); // skip thousands-separator, e.g. for a year like 2024
  const gauge = el.parentElement.querySelector('.stat-gauge span');
  ScrollTrigger.create({
    trigger: el,
    start: 'top 85%',
    once: true,
    onEnter: () => {
      const proxy = { v: 0 };
      gsap.to(proxy, {
        v: target,
        duration: 1.6,
        ease: 'power2.out',
        onUpdate() {
          const n = Math.floor(proxy.v);
          el.textContent = (plain ? n : n.toLocaleString()) + suffix;
          if (gauge) gauge.style.transform = `scaleX(${proxy.v / target})`;
        },
      });
    },
  });
});

/* ---------- Small blinking pixel-art accent icons beneath the finale ---------- */
(function buildPixelAccents() {
  const host = document.getElementById('pixel-accents');
  if (!host) return;
  const _ = '';
  const O = 'var(--ember)', A = 'var(--ember-soft)', Y = '#f3c969', S = 'var(--sage)', B = '#8fb8ff';

  const spark = [
    [_, _, _, O, O, _, _, _],
    [_, _, O, A, A, O, _, _],
    [_, O, A, Y, Y, A, O, _],
    [O, A, Y, Y, Y, Y, A, O],
    [O, A, Y, Y, Y, Y, A, O],
    [_, O, A, Y, Y, A, O, _],
    [_, _, O, A, A, O, _, _],
    [_, _, _, O, O, _, _, _],
  ];
  const star = [
    [_, _, _, S, _, _, _, _],
    [_, _, _, S, _, _, _, _],
    [S, S, S, S, S, S, S, _],
    [_, S, S, S, S, S, _, _],
    [_, _, S, S, S, _, _, _],
    [_, S, S, _, S, S, _, _],
    [S, S, _, _, _, S, S, _],
    [_, _, _, _, _, _, _, _],
  ];
  const flag = [
    [B, B, B, B, B, _, _, _],
    [B, _, _, _, B, _, _, _],
    [B, _, B, _, B, _, _, _],
    [B, _, _, _, B, _, _, _],
    [B, B, B, B, B, _, _, _],
    [_, _, _, B, _, _, _, _],
    [_, _, _, B, _, _, _, _],
    [_, _, B, B, B, _, _, _],
  ];

  function build(data, size, gap) {
    const grid = document.createElement('div');
    grid.className = 'p-art';
    grid.style.gridTemplateColumns = `repeat(${data[0].length}, ${size}px)`;
    grid.style.gridTemplateRows = `repeat(${data.length}, ${size}px)`;
    grid.style.gap = gap + 'px';
    data.forEach((row) =>
      row.forEach((c) => {
        const s = document.createElement('span');
        s.style.width = size + 'px';
        s.style.height = size + 'px';
        s.style.background = c || 'transparent';
        if (c && !reducedMotion) {
          s.style.animation = `pixelBlink ${1.6 + Math.random() * 2}s ease ${Math.random() * 2}s infinite`;
        }
        grid.appendChild(s);
      })
    );
    return grid;
  }

  host.appendChild(build(spark, 6, 2));
  host.appendChild(build(star, 6, 2));
  host.appendChild(build(flag, 6, 2));
})();

/* ---------- Pixel art finale ---------- */
const pixelCanvas = document.getElementById('pixel-canvas');
const pixelArt = initPixelArt(pixelCanvas);
ScrollTrigger.create({
  trigger: '#legacy',
  start: 'top bottom',
  end: 'bottom top',
  onEnter: () => pixelArt.start(),
  onEnterBack: () => pixelArt.start(),
  onLeave: () => pixelArt.stop(),
  onLeaveBack: () => pixelArt.stop(),
});

/* ---------- Kick off ---------- */
window.addEventListener('load', () => ScrollTrigger.refresh());

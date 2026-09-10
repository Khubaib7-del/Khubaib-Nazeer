import { setupProjectGallery } from './project-gallery.js?v=30';
import { setupCertificateGallery } from './certificate-gallery.js?v=30';
import { buildCertificateCards } from './certificates.js?v=30';
import { runCinematicIntro } from './intro-sequence.js?v=30';
import { applySmokeText } from './smoke-text.js?v=30';
import { applyGradientWipe, applyScatterBounce, applyStampIn, applyWordSlideIn } from './text-effects.js?v=30';
import { initSkillsPuzzle } from './skills-puzzle.js?v=30';

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Belt-and-suspenders for the "always reload from the top" requirement — the
// inline <head> script handles a normal reload, this covers a bfcache restore
// (browser back/forward), which fires pageshow instead of a fresh page load.
window.addEventListener('pageshow', () => requestAnimationFrame(() => window.scrollTo(0, 0)));

gsap.registerPlugin(ScrollTrigger);

// Start the independent opening before discovering below-the-fold media.
const heroSceneReady = import('./workspace-scene.js').then(({ initWorkspaceScene }) => {
  const scene = initWorkspaceScene(document.getElementById('terminal-canvas'));
  gsap.ticker.add(scene.render);
  return scene;
}).catch(() => {
  document.getElementById('hero').classList.add('hero--fallback');
  return null;
});
runCinematicIntro({ sceneReady: heroSceneReady });

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
setupCertificateGallery({ section: document.getElementById('certificates'), stack: document.getElementById('cert-stack'), reducedMotion });
// Same ordering logic: cert deck pin creates a spacer that shifts everything
// below it — must be called before stories/legacy triggers measure positions.
// One continuous camera path, measured after the existing pinned galleries.
heroSceneReady.then(scene => {
  if (!scene) return;
  const sections = ['hero','skills','collection','certificates','contact'].map(id=>document.getElementById(id)).filter(Boolean);
  let stops=[];
  const measure=()=>{
    stops=sections.map(el=>{
      const anchor=el.parentElement.classList.contains('pin-spacer')?el.parentElement:el;
      return anchor.getBoundingClientRect().top+window.scrollY;
    });
    stops[0]=0;
  };
  measure();
  const atmosphere=document.getElementById('scene-shade');
  ScrollTrigger.create({
    trigger: document.body, start: 'top top', end: 'bottom bottom',
    onRefresh: measure,
    onUpdate: self=>{
      const y=self.scroll();
      let index=0;
      while(index<stops.length-2&&y>=stops[index+1])index++;
      const fraction=Math.max(0,Math.min(1,(y-stops[index])/Math.max(1,stops[index+1]-stops[index])));
      scene.setChapter((index+fraction) * 9 / (sections.length-1));
      const departure=Math.max(0,Math.min(1,y/(window.innerHeight*.85)));
      // The room remains present; a soft continuous veil keeps later text readable.
      atmosphere.style.opacity=String(departure*.76);
    },
  });
});

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

/* ---------- Lenis smooth scroll ---------- */
const lenis = new Lenis({
  duration: 1.15,
  easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
  smoothWheel: true,
  wheelMultiplier: 0.88,
  touchMultiplier: 1.25,
  syncTouch: false,
});
lenis.on('scroll', ScrollTrigger.update);
gsap.ticker.add((time) => lenis.raf(time * 1000));
gsap.ticker.lagSmoothing(500, 33);
ScrollTrigger.config({ ignoreMobileResize: true });

// Give every internal link the same eased travel, including destinations
// below the pinned project gallery where native hash jumps can mismeasure.
document.querySelectorAll('a[href^="#"]').forEach((link) => {
  link.addEventListener('click', (event) => {
    const target = document.querySelector(link.getAttribute('href'));
    if (!target) return;
    event.preventDefault();
    lenis.scrollTo(target, {
      duration: reducedMotion ? 0 : 1.05,
      onComplete: () => history.replaceState(null, '', link.getAttribute('href')),
    });
  });
});
window.addEventListener('portfolio:navigate-scroll', ({ detail }) => {
  lenis.scrollTo(detail.top, { duration: reducedMotion ? 0 : 0.85 });
});

/* ---------- Nav: hide on scroll down, shrink, mobile burger ---------- */
const nav = document.getElementById('nav');
let lastY = 0;
let directionTravel = 0;
let lastDirection = 0;
lenis.on('scroll', ({ scroll }) => {
  nav.classList.toggle('nav-scrolled', scroll > 40);
  const delta = scroll - lastY;
  // Ignore the sub-pixel correction Lenis makes as an eased movement settles;
  // otherwise that tiny reversal can reveal the nav after a downward journey.
  if (Math.abs(delta) < 1) {
    lastY = scroll;
    return;
  }
  const direction = Math.sign(delta);
  if (direction && direction !== lastDirection) directionTravel = 0;
  directionTravel += Math.abs(delta);
  lastDirection = direction || lastDirection;

  if (scroll < 90 || direction < 0 && directionTravel > 24) nav.classList.remove('nav-hidden');
  if (scroll > 180 && direction > 0 && directionTravel > 24 && !nav.classList.contains('nav-menu-open')) {
    nav.classList.add('nav-hidden');
  }
  lastY = scroll;
});

const burger = document.getElementById('nav-burger');
const navMobile = document.getElementById('nav-mobile');
burger.addEventListener('click', () => {
  burger.classList.toggle('open');
  navMobile.classList.toggle('open');
  nav.classList.toggle('nav-menu-open', navMobile.classList.contains('open'));
  nav.classList.remove('nav-hidden');
  burger.setAttribute('aria-expanded', String(navMobile.classList.contains('open')));
});
navMobile.querySelectorAll('a').forEach((a) =>
  a.addEventListener('click', () => {
    burger.classList.remove('open');
    navMobile.classList.remove('open');
    nav.classList.remove('nav-menu-open');
    burger.setAttribute('aria-expanded', 'false');
  })
);

// The centre capsule doubles as a quiet location marker while the page moves.
document.querySelectorAll('.nav-links a').forEach((link) => {
  const target = document.querySelector(link.getAttribute('href'));
  if (!target) return;
  ScrollTrigger.create({
    trigger: target,
    start: 'top 52%',
    end: 'bottom 52%',
    onToggle: ({ isActive }) => {
      link.classList.toggle('is-active', isActive);
      if (isActive) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    },
  });
});

/* ---------- Project video lightbox — builds exactly one media element fresh
   per click (instead of toggling visibility on two pre-existing elements,
   which was rendering both at once) so there's never a stray empty box. ---------- */
const videoModal = document.getElementById('video-modal');
const videoBody = document.getElementById('video-modal-body');
const videoFallback = document.getElementById('video-modal-fallback');
const videoTitle = document.getElementById('video-modal-title');
const videoClose = document.getElementById('video-modal-close');
let videoOpener = null;

function closeVideoModal() {
  const returnTarget = videoOpener?.closest('.project-card')?.querySelector('.project-toggle') || videoOpener;
  videoModal.classList.remove('open');
  videoModal.setAttribute('aria-hidden', 'true');
  videoBody.innerHTML = '';
  document.body.style.overflow = '';
  lenis.start();
  requestAnimationFrame(() => returnTarget?.focus({ preventScroll: true }));
}
document.querySelectorAll('.project-watch').forEach((btn) => {
  btn.addEventListener('click', () => {
    videoOpener = btn;
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
      video.playsInline = true;
      video.preload = 'metadata';
      video.src = btn.dataset.src;
      videoBody.appendChild(video);
      video.play().catch(() => {});
      videoFallback.style.display = 'none';
    }
    videoModal.classList.add('open');
    videoModal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    lenis.stop();
    videoClose.focus({ preventScroll: true });
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
// Certificates: eyebrow slides in first, then h2 words flow L→R
applyWordSlideIn('.certificates-head .eyebrow', { stagger: 0.07, duration: 0.45, x: -22, start: 'top 88%' });
applyWordSlideIn('.certificates-head h2', { stagger: 0.1, duration: 0.65, x: -32, start: 'top 82%' });
gsap.utils.toArray('.h-section-head h2').forEach((el) => {
  gsap.fromTo(
    el,
    { clipPath: 'inset(0 100% 0 0)' },
    { clipPath: 'inset(0 0% 0 0)', ease: 'none', scrollTrigger: { trigger: el, start: 'top 85%', end: 'top 50%', scrub: true } }
  );
}); // Projects: curtain-wipe mask

/* ---------- Skills: rotating tile puzzle ---------- */
initSkillsPuzzle({
  stage: document.getElementById('skills-stage'),
  board: document.getElementById('skills-board'),
  flankLeft: document.getElementById('skills-flank-left'),
  flankRight: document.getElementById('skills-flank-right'),
  chips: gsap.utils.toArray('.skill-chip'),
  reducedMotion,
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
let certOpener = null;
function closeCertModal() {
  const returnTarget = certOpener;
  certModal.classList.remove('open');
  certModal.setAttribute('aria-hidden', 'true');
  certModalImg.removeAttribute('src');
  document.body.style.overflow = '';
  lenis.start();
  requestAnimationFrame(() => returnTarget?.focus({ preventScroll: true }));
}
// Click anywhere on the card frame (but not the verify link) opens the lightbox.
document.querySelectorAll('.cert-card-frame').forEach((frame) => {
  frame.addEventListener('click', (e) => {
    if (e.target.closest('.cert-card-verify')) return;
    const img = frame.querySelector('img');
    if (!img) return;
    certOpener = frame;
    certModalImg.src = img.src;
    certModalImg.alt = img.alt;
    certModal.classList.add('open');
    certModal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    lenis.stop();
    certModalClose.focus({ preventScroll: true });
  });
  frame.addEventListener('keydown', (e) => {
    if ((e.key === 'Enter' || e.key === ' ') && !e.target.closest('.cert-card-verify')) {
      e.preventDefault();
      frame.click();
    }
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
function setupHorizontalScroll() {
  setupProjectGallery({ reducedMotion });
}
// Called near the top of this file, before any trigger positioned after
// #collection gets created — see the comment there for why.

/* ---------- Kick off ---------- */
window.addEventListener('load', () => ScrollTrigger.refresh());

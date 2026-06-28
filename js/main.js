import { initRoomScene } from './room-scene.js';
import { initPixelArt } from './pixel-art.js';
import { applySmokeText } from './smoke-text.js';
import { initCourseRing } from './course-ring.js';
import { initSkillsPuzzle } from './skills-puzzle.js';

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

gsap.registerPlugin(ScrollTrigger);

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
  const fill = document.getElementById('loader-progress');
  const pct = document.getElementById('loader-pct');
  let p = 0;
  const tick = setInterval(() => {
    p += Math.random() * 18;
    if (p >= 100) {
      p = 100;
      clearInterval(tick);
      gsap.to(loader, {
        opacity: 0,
        duration: 0.6,
        delay: 0.2,
        onComplete: () => {
          loader.style.display = 'none';
          playHeroIntro();
        },
      });
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

/* ---------- Philosophy: smoke-dissolve text reveal ---------- */
applySmokeText('.split-text');
applySmokeText(
  '.education h2, .skills h2, .h-section-head h2, .certificates-head h2, .stories h2, .legacy-text h2',
  { dissolveOut: false }
);

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

/* ---------- Certificate cards: presented entrance, cursor tilt + shine, lightbox ---------- */
gsap.utils.toArray('.cert-card').forEach((card, i) => {
  gsap.fromTo(
    card,
    { opacity: 0, y: 50, rotationX: -70, transformPerspective: 800 },
    {
      opacity: 1,
      y: 0,
      rotationX: 0,
      duration: 0.9,
      delay: i * 0.1,
      ease: 'power3.out',
      scrollTrigger: { trigger: card, start: 'top 85%' },
    }
  );
});

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
document.querySelectorAll('.cert-card-frame img').forEach((img) => {
  img.addEventListener('click', () => {
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
      }),
  });
}
setupHorizontalScroll('#collection', '#collection-track', '#collection-progress');

/* ---------- Stat counters ---------- */
gsap.utils.toArray('.stat-num').forEach((el) => {
  const target = parseFloat(el.dataset.target);
  const suffix = el.dataset.suffix || '';
  const plain = el.hasAttribute('data-plain'); // skip thousands-separator, e.g. for a year like 2024
  ScrollTrigger.create({
    trigger: el,
    start: 'top 85%',
    once: true,
    onEnter: () => {
      gsap.to(el, {
        innerText: target,
        duration: 1.6,
        ease: 'power2.out',
        snap: { innerText: 1 },
        onUpdate() {
          const n = Math.floor(el.innerText);
          el.textContent = (plain ? n : n.toLocaleString()) + suffix;
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
runLoader();
window.addEventListener('load', () => ScrollTrigger.refresh());

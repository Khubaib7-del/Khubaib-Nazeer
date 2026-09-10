// The opening and hero share one scene and one timeline, including their overlap.
export function runCinematicIntro({ sceneReady = Promise.resolve(null) } = {}) {
  const loader = document.getElementById('loader');
  const skip = document.getElementById('intro-skip');
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const content = [...document.querySelectorAll('#nav, #nav-mobile, #smooth-wrapper')];
  const progress = { value: 0 };
  let scene, timeline, finished = false;
  const fallback = setTimeout(() => finish(true), 3400);
  const revealElements = '.reveal-line, .hero .reveal-up, .nav';

  function finish(immediate = false) {
    if (finished) return;
    finished = true;
    clearTimeout(fallback);
    if (immediate) timeline?.kill();
    progress.value = 1; scene?.setIntroProgress(1);
    const restoreFocus = loader.contains(document.activeElement);
    loader.hidden = true;
    content.forEach(el => el.inert = false);
    document.documentElement.classList.remove('intro-running');
    gsap.set('.reveal-line', { opacity: 1, yPercent: 0, clearProps: 'filter,visibility' });
    gsap.set('.hero .reveal-up', { opacity: 1, y: 0, clearProps: 'filter,visibility' });
    // Clear GSAP's inline y transform so CSS can move the floating nav offscreen.
    gsap.set('.nav', { opacity: 1, clearProps: 'transform,filter,visibility' });
    skip.removeEventListener('click', skipIntro);
    document.removeEventListener('keydown', onKey);
    motion.removeEventListener('change', onMotion);
    if (restoreFocus) document.querySelector('.hero-cta a')?.focus({ preventScroll: true });
  }
  function skipIntro() { finish(true); }
  function onKey(event) { if (event.key === 'Escape') finish(true); }
  function onMotion() { if (motion.matches) finish(true); }

  content.forEach(el => el.inert = true);
  document.documentElement.classList.add('intro-running');
  gsap.set('.reveal-line', { yPercent: 115 });
  gsap.set('.hero .reveal-up, .nav', { opacity: 0 });
  skip.addEventListener('click', skipIntro);
  document.addEventListener('keydown', onKey);
  motion.addEventListener('change', onMotion);
  sceneReady.then(value => {
    scene = value;
    scene?.setIntroProgress(progress.value);
  }).catch(() => {});

  if (motion.matches) { finish(true); return; }
  // Start immediately. Three.js joins at the current timeline progress when
  // ready, so loading the renderer can never delay or freeze the opening.
  queueMicrotask(() => {
    if (finished) return;
    timeline = gsap.timeline({ onComplete: () => finish() });
    timeline
      // Act I: the name owns the frame before any page copy appears.
      .fromTo('.intro-name-line span', { yPercent: 112, filter: 'blur(10px)' }, { yPercent: 0, filter: 'blur(0px)', duration: .82, stagger: .1, ease: 'power4.out' }, .08)
      // Act II: the room develops behind the title, then the title clears it.
      .to('.intro-veil', { opacity: 0, duration: 1.2, ease: 'sine.inOut' }, .9)
      .to('.intro-aura', { opacity: 0, duration: 1.1 }, .9)
      .to(progress, { value: 1, duration: 1.45, ease: 'power3.inOut', onUpdate: () => scene?.setIntroProgress(progress.value) }, 1.0)
      .to('.intro-name-line span', { yPercent: -116, filter: 'blur(7px)', duration: .65, stagger: .055, ease: 'power3.inOut' }, 1.43)
      // Act III: hero copy follows the name and lands into the same camera move.
      .to('.reveal-line', { yPercent: 0, duration: .88, stagger: .09, ease: 'power4.out' }, 1.72)
      .to('.hero .reveal-up', { y: 0, opacity: 1, duration: .62, stagger: .07, ease: 'power3.out' }, 1.94)
      .to('.nav', { opacity: 1, duration: .62, stagger: .05 }, 2.08);
  });
}

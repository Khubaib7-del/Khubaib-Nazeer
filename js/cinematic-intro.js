// One timeline owns the opening and its handoff to the readable hero.
export function runCinematicIntro() {
  const loader = document.getElementById('loader');
  const skip = document.getElementById('intro-skip');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const content = [...document.querySelectorAll('#nav, #nav-mobile, #smooth-wrapper')];
  let finished = false;
  let timeline;
  const fallback = window.setTimeout(() => finish(true), 6500);

  function finish(immediate = false) {
    if (finished) return;
    finished = true;
    clearTimeout(fallback);
    timeline?.kill();
    const restoreFocus = loader.contains(document.activeElement);
    loader.hidden = true;
    content.forEach(el => el.inert = false);
    document.documentElement.classList.remove('intro-running');
    skip.removeEventListener('click', skipIntro);
    document.removeEventListener('keydown', onKey);
    const hero = gsap.timeline();
    if (immediate || reduced) {
      gsap.set('.reveal-line, .hero .reveal-up', { y: 0, yPercent: 0, opacity: 1, clearProps: 'filter' });
      gsap.set('#terminal-canvas, .scroll-cue, .nav', { clearProps: 'opacity,visibility,transform,filter' });
    } else {
      hero.fromTo('#terminal-canvas', { opacity: 0, scale: 1.065 }, { opacity: 1, scale: 1, duration: 1.5, ease: 'power3.out', clearProps: 'transform' }, 0)
        .fromTo('.reveal-line', { yPercent: 110, rotation: 3 }, { yPercent: 0, rotation: 0, duration: 1.15, stagger: 0.13, ease: 'power4.out' }, 0.05)
        .to('.hero .reveal-up', { y: 0, opacity: 1, duration: 0.8, stagger: 0.1, ease: 'power3.out' }, 0.4)
        .fromTo('.nav', { opacity: 0 }, { opacity: 1, duration: 0.6, clearProps: 'opacity' }, 0.35)
        .fromTo('.scroll-cue', { opacity: 0 }, { opacity: 1, duration: 0.6 }, 1.1);
    }
    if (restoreFocus) document.querySelector('.hero-cta a')?.focus({ preventScroll: true });
  }
  function skipIntro() { finish(true); }
  function onKey(event) { if (event.key === 'Escape') finish(true); }

  content.forEach(el => el.inert = true);
  document.documentElement.classList.add('intro-running');
  gsap.set('.reveal-line', { yPercent: 110 });
  skip.addEventListener('click', skipIntro);
  document.addEventListener('keydown', onKey);

  if (reduced) {
    finish(true);
    return;
  }

  timeline = gsap.timeline({ onComplete: () => finish() });
  timeline
    .fromTo('.intro-rule', { scaleX: 0 }, { scaleX: 1, duration: 0.8, ease: 'expo.inOut' }, 0)
    .fromTo('.intro-eyebrow, .intro-bottom', { opacity: 0 }, { opacity: 1, duration: 0.5 }, 0.2)
    .fromTo('.intro-aura', { opacity: 0, scale: 0.6, rotation: -25 }, { opacity: 0.8, scale: 1, rotation: 12, duration: 2.6, ease: 'power2.out' }, 0.15)
    .fromTo('.intro-word span', { yPercent: 115, rotation: 8 }, { yPercent: 0, rotation: 0, duration: 1.2, stagger: 0.045, ease: 'power4.out' }, 0.55)
    .fromTo('.intro-byline', { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.65 }, 1.05)
    .to('.intro-rule', { scaleX: 0.16, duration: 0.8, ease: 'power3.inOut' }, 1.45)
    .to('.intro-aura', { xPercent: 18, scale: 1.18, duration: 1.4, ease: 'sine.inOut' }, 1.6)
    .to('.intro-word, .intro-byline, .intro-eyebrow, .intro-rule', { y: -28, opacity: 0, duration: 0.55, stagger: 0.035, ease: 'power3.in' }, 2.45)
    .to(loader, { clipPath: 'inset(0 0 100% 0)', duration: 0.85, ease: 'expo.inOut' }, 2.8);
}

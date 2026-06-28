// A small grab-bag of heading-reveal techniques, deliberately different from
// each other (and from smoke-text.js) so not every section reads with the
// same treatment.

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Ember color sweep: a duplicate of the text, clipped, wipes left-to-right on scroll.
export function applyGradientWipe(selector) {
  document.querySelectorAll(selector).forEach((el) => {
    if (reducedMotion) return;
    const text = el.textContent;
    el.classList.add('gradient-wipe');
    el.innerHTML = `<span class="gw-base">${text}</span><span class="gw-fill" aria-hidden="true">${text}</span>`;
    gsap.fromTo(
      el.querySelector('.gw-fill'),
      { clipPath: 'inset(0 100% 0 0)' },
      {
        clipPath: 'inset(0 0% 0 0)',
        ease: 'none',
        scrollTrigger: { trigger: el, start: 'top 85%', end: 'top 45%', scrub: true },
      }
    );
  });
}

// Per-character scatter-in: each letter starts from its own random direction,
// distance, delay and duration, then lands with a bounce/elastic settle — reads
// as letters individually flying/dropping in at different paces, not a uniform
// left-to-right stagger. Fires once on scroll-in (the randomness doesn't make
// sense scrubbed back and forth).
export function applyScatterBounce(selector, opts = {}) {
  if (reducedMotion) return;
  const {
    spread = 110,
    minDuration = 0.5,
    maxDuration = 1.0,
    maxDelay = 0.45,
    ease = 'bounce.out',
  } = opts;

  document.querySelectorAll(selector).forEach((el) => {
    const text = el.textContent;
    el.innerHTML = '';
    el.classList.add('scatter-bounce');
    const chars = [];
    [...text].forEach((ch) => {
      if (ch === ' ') {
        // A lone space inside its own inline-block gets collapsed to zero
        // width by normal whitespace rules — append it as plain text instead
        // of wrapping it, it doesn't need to be individually animated anyway.
        el.appendChild(document.createTextNode(' '));
        return;
      }
      const span = document.createElement('span');
      span.className = 'scatter-char';
      span.textContent = ch;
      el.appendChild(span);
      chars.push(span);
    });

    // Base delay climbs with letter index (so the reveal has a visible left-to-right
    // current you can follow, and scales with text length instead of always finishing
    // in under a second) with random jitter layered on top for the "different pace" feel.
    const seeds = chars.map((_, i) => {
      const angle = Math.random() * Math.PI * 2;
      const dist = spread * (0.5 + Math.random() * 0.5);
      return {
        x: Math.cos(angle) * dist,
        y: Math.sin(angle) * dist,
        rot: (Math.random() - 0.5) * 60,
        duration: minDuration + Math.random() * (maxDuration - minDuration),
        delay: i * 0.045 + Math.random() * maxDelay,
      };
    });

    const tl = gsap.timeline({ scrollTrigger: { trigger: el, start: 'top 70%', once: true } });
    chars.forEach((c, i) => {
      const s = seeds[i];
      tl.fromTo(
        c,
        { x: s.x, y: s.y, rotate: s.rot, opacity: 0 },
        { x: 0, y: 0, rotate: 0, opacity: 1, duration: s.duration, ease },
        s.delay
      );
    });
  });
}

// Rubber-stamp impact: scales/rotates down from oversized into place with an
// overshoot bounce, like a stamp hitting paper — used for the Certificates
// heading specifically, where that metaphor actually fits.
export function applyStampIn(selector) {
  document.querySelectorAll(selector).forEach((el) => {
    if (reducedMotion) return;
    ScrollTrigger.create({
      trigger: el,
      start: 'top 75%',
      once: true,
      onEnter: () => {
        gsap.fromTo(
          el,
          { scale: 2.4, opacity: 0, rotate: -10 },
          { scale: 1, opacity: 1, rotate: 0, duration: 0.7, ease: 'back.out(2.6)' }
        );
      },
    });
  });
}

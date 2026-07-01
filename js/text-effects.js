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
    minDuration = 0.45,
    maxDuration = 0.75,
    cascade = 0.45, // total time span over which letters START — bounded, NOT multiplied by letter count
    jitter = 0.12,
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

    // Base delay climbs with letter index, normalized by total letter count so
    // the reveal has a visible left-to-right current WITHOUT the total runtime
    // growing with text length — a 5-letter and a 40-letter heading both finish
    // within roughly the same window. Small random jitter on top for the
    // "different pace" feel without long-tail outliers.
    const seeds = chars.map((_, i) => {
      const angle = Math.random() * Math.PI * 2;
      const dist = spread * (0.5 + Math.random() * 0.5);
      const progress = chars.length > 1 ? i / (chars.length - 1) : 0;
      return {
        x: Math.cos(angle) * dist,
        y: Math.sin(angle) * dist,
        rot: (Math.random() - 0.5) * 60,
        duration: minDuration + Math.random() * (maxDuration - minDuration),
        delay: progress * cascade + Math.random() * jitter,
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

// Per-word slide-in from left: each word starts faded + offset left, then
// settles into its natural position with a left-to-right stagger.
export function applyWordSlideIn(selector, opts = {}) {
  if (reducedMotion) return;
  const {
    stagger  = 0.09,
    duration = 0.6,
    x        = -30,
    ease     = 'power2.out',
    start    = 'top 82%',
  } = opts;

  document.querySelectorAll(selector).forEach((el) => {
    el.innerHTML = el.textContent
      .trim()
      .split(/\s+/)
      .map(w => `<span class="wsi" style="display:inline-block">${w}</span>`)
      .join(' ');

    const words = [...el.querySelectorAll('.wsi')];
    gsap.set(words, { opacity: 0, x });

    ScrollTrigger.create({
      trigger: el,
      start,
      once: true,
      onEnter() {
        gsap.to(words, { opacity: 1, x: 0, duration, ease, stagger });
      },
    });
  });
}

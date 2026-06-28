// A small grab-bag of heading-reveal techniques, deliberately different from
// each other (and from smoke-text.js) so not every section reads with the
// same blur-dissolve treatment.

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

// Per-character flip-up, no blur — a sharper, more mechanical reveal.
export function applyCharFlip(selector) {
  document.querySelectorAll(selector).forEach((el) => {
    if (reducedMotion) return;
    const text = el.textContent;
    el.innerHTML = '';
    el.classList.add('char-flip');
    const chars = [...text].map((ch) => {
      const span = document.createElement('span');
      span.className = 'flip-char';
      span.textContent = ch === ' ' ? ' ' : ch;
      el.appendChild(span);
      return span;
    });
    gsap.fromTo(
      chars,
      { yPercent: 100, rotationX: -90, opacity: 0 },
      {
        yPercent: 0,
        rotationX: 0,
        opacity: 1,
        stagger: 0.025,
        ease: 'power3.out',
        scrollTrigger: { trigger: el, start: 'top 85%', end: 'top 55%', scrub: true },
      }
    );
  });
}

// Terminal-style scramble-then-settle, fired once on scroll-in (not scrubbed —
// the decode effect reads as a one-shot event, not something to scrub back and forth).
export function applyScrambleText(selector) {
  if (reducedMotion) return;
  const glyphs = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%&_';
  document.querySelectorAll(selector).forEach((el) => {
    const original = el.textContent;
    ScrollTrigger.create({
      trigger: el,
      start: 'top 85%',
      once: true,
      onEnter: () => {
        const totalFrames = 26;
        const revealAt = original
          .split('')
          .map((_, i) => Math.floor((i / original.length) * totalFrames * 0.55) + Math.floor(totalFrames * 0.45));
        let frame = 0;
        const id = setInterval(() => {
          frame++;
          el.textContent = original
            .split('')
            .map((ch, i) => (ch === ' ' || frame >= revealAt[i] ? ch : glyphs[Math.floor(Math.random() * glyphs.length)]))
            .join('');
          if (frame >= totalFrames) {
            clearInterval(id);
            el.textContent = original;
          }
        }, 32);
      },
    });
  });
}

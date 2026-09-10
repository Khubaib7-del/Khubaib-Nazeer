const ICONS = [
  'material-symbols/code-blocks-outline',
  'mdi/math-integral',
  'hugeicons/cube',
  'mdi/logic-gate-and',
  'mdi/axis-arrow',
  'mdi/cpu-64-bit',
  'mdi/graph-outline',
  'mdi/matrix',
  'mdi/state-machine',
  'mdi/linux',
  'mdi/database-outline',
  'mdi/brain',
  'mdi/sitemap-outline',
  'mdi/chart-bell-curve-cumulative',
];

export function initCourseRing(wrap, ring, cards) {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const status = document.getElementById('course-map-status');
  const accents = ['#1769e0','#7657e8','#008bb5','#a93e82','#246dd8','#d04472','#178a74','#6750c5','#138ea0','#668c21','#166fbd','#8948aa','#3b61dd','#bd3d72'];

  cards.forEach((card, index) => {
    const shortName = card.querySelector('strong').textContent;
    const fullName = card.querySelector('small').textContent;
    const iconUrl = `https://api.iconify.design/${ICONS[index]}.svg?color=${encodeURIComponent(accents[index])}`;
    card.dataset.courseIndex = String(index + 1).padStart(2, '0');
    card.style.setProperty('--wave-delay', `${-(index * .23).toFixed(2)}s`);
    card.style.setProperty('--course-glow', index < 7 ? '#8fd8ff24' : '#e2aeca24');
    card.tabIndex = 0;
    card.setAttribute('role', 'button');
    card.setAttribute('aria-label', `${shortName}: ${fullName}`);
    card.innerHTML = `<div class="course-float"><span class="course-symbol"><img src="${iconUrl}" alt="" loading="lazy"></span><strong>${shortName}</strong><small>${fullName}</small></div>`;

    const activate = () => {
      cards.forEach((item, itemIndex) => {
        item.classList.toggle('is-current', itemIndex === index);
        item.classList.toggle('is-muted', itemIndex !== index);
      });
      status.textContent = `${fullName.toUpperCase()} / MODULE ${card.dataset.courseIndex}`;
    };
    const release = () => {
      cards.forEach(item => item.classList.remove('is-current', 'is-muted'));
      status.textContent = 'TWO LIVING WAVES / HOVER TO EXPLORE';
    };
    card.addEventListener('pointerenter', event => { if (event.pointerType === 'mouse') activate(); });
    card.addEventListener('pointerleave', () => { if (!card.matches(':focus')) release(); });
    card.addEventListener('focus', activate);
    card.addEventListener('blur', release);
    card.addEventListener('keydown', event => { if (event.key === 'Escape') card.blur(); });
  });

  const makeRow = (rowCards, position) => {
    const row = document.createElement('div');
    row.className = `course-wave-row course-wave-row--${position}`;
    const marquee = document.createElement('div');
    marquee.className = 'course-wave-marquee';
    const set = document.createElement('div');
    set.className = 'course-wave-set';
    rowCards.forEach(card => set.appendChild(card));
    const clone = set.cloneNode(true);
    clone.classList.add('course-wave-clone');
    clone.setAttribute('aria-hidden', 'true');
    clone.querySelectorAll('.course-card').forEach(card => {
      card.removeAttribute('tabindex');
      card.removeAttribute('role');
    });
    marquee.append(set, clone);
    row.appendChild(marquee);
    ring.appendChild(row);
  };
  makeRow(cards.slice(0, 7), 'top');
  makeRow(cards.slice(7), 'bottom');

  status.textContent = 'TWO LIVING WAVES / HOVER TO EXPLORE';
  if (reduced) {
    gsap.set(cards, { opacity: 1 });
    return;
  }

  gsap.from(cards, {
    opacity: 0,
    duration: .55,
    stagger: { each: .055, from: 'edges' },
    ease: 'power2.out',
    immediateRender: false,
    scrollTrigger: { trigger: wrap, start: 'top 84%', once: true },
  });
}

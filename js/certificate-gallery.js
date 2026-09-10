export function setupCertificateGallery({ section, stack, reducedMotion }) {
  const cards = [...stack.querySelectorAll('.cert-card')];
  if (!cards.length) return;
  const viewport = section.querySelector('.cert-viewport');
  const count = section.querySelector('#cert-stack-count');
  const indexLabel = section.querySelector('#cert-inspector-index');
  const issuer = section.querySelector('#cert-inspector-issuer');
  const title = section.querySelector('#cert-inspector-title');
  const date = section.querySelector('#cert-inspector-date');
  const prev = section.querySelector('#cert-prev');
  const next = section.querySelector('#cert-next');
  const filmstrip = section.querySelector('#cert-filmstrip');
  let active = 0, startX = null, changing = false;

  const buttons = cards.map((card, i) => {
    const button = document.createElement('button');
    const image = card.querySelector('img');
    button.type = 'button';
    button.className = 'cert-film-button';
    button.setAttribute('aria-label', `Show ${card.dataset.title}`);
    button.innerHTML = `<span>${String(i + 1).padStart(2, '0')}</span><img src="${image.src}" alt="">`;
    button.addEventListener('click', () => show(i, i >= active ? 1 : -1));
    filmstrip.appendChild(button);
    return button;
  });

  cards.forEach((card, i) => {
    gsap.set(card, { autoAlpha: i === 0 ? 1 : 0, xPercent: i === 0 ? 0 : 16, rotationY: i === 0 ? 0 : 7, zIndex: i === 0 ? 2 : 1 });
    card.inert = i !== 0;
    card.setAttribute('aria-hidden', String(i !== 0));
  });

  function updateInfo() {
    const card = cards[active];
    indexLabel.textContent = `CERTIFICATE / ${String(active + 1).padStart(2, '0')}`;
    issuer.textContent = card.dataset.issuer;
    title.textContent = card.dataset.title;
    date.textContent = card.dataset.date;
    count.textContent = `${String(active + 1).padStart(2, '0')} / ${String(cards.length).padStart(2, '0')}`;
    buttons.forEach((button, i) => {
      button.classList.toggle('is-active', i === active);
      if (i === active) button.setAttribute('aria-current', 'true'); else button.removeAttribute('aria-current');
    });
  }

  function show(nextIndex, direction = 1) {
    nextIndex = (nextIndex + cards.length) % cards.length;
    if (nextIndex === active || changing) return;
    changing = true;
    const outgoing = cards[active], incoming = cards[nextIndex];
    outgoing.inert = true;
    outgoing.setAttribute('aria-hidden', 'true');
    incoming.inert = false;
    incoming.setAttribute('aria-hidden', 'false');
    gsap.killTweensOf([outgoing, incoming]);
    if (reducedMotion) {
      gsap.set(outgoing, { autoAlpha: 0, zIndex: 1 });
      gsap.set(incoming, { autoAlpha: 1, xPercent: 0, rotationY: 0, zIndex: 2 });
      active = nextIndex; changing = false; updateInfo();
      return;
    }
    gsap.set(incoming, { autoAlpha: 0, xPercent: direction * 18, rotationY: direction * 8, zIndex: 2 });
    const timeline = gsap.timeline({ onComplete: () => { changing = false; } });
    timeline.to(outgoing, { autoAlpha: 0, xPercent: direction * -14, rotationY: direction * -7, duration: .45, ease: 'power3.inOut' }, 0)
      .to(incoming, { autoAlpha: 1, xPercent: 0, rotationY: 0, duration: .62, ease: 'power3.out' }, .12);
    active = nextIndex;
    updateInfo();
  }

  prev.addEventListener('click', () => show(active - 1, -1));
  next.addEventListener('click', () => show(active + 1, 1));
  section.addEventListener('keydown', event => {
    if (event.key === 'ArrowLeft') { event.preventDefault(); show(active - 1, -1); }
    if (event.key === 'ArrowRight') { event.preventDefault(); show(active + 1, 1); }
  });
  viewport.addEventListener('pointerdown', event => { if (event.pointerType !== 'mouse') startX = event.clientX; });
  viewport.addEventListener('pointerup', event => {
    if (startX === null) return;
    const distance = event.clientX - startX;
    if (Math.abs(distance) > 45) show(active + (distance < 0 ? 1 : -1), distance < 0 ? 1 : -1);
    startX = null;
  });
  updateInfo();
}

const SKILL_INFO = {
  C: ['SYSTEMS', 'Precise foundations for memory, data structures, and low-level problem solving.'],
  'C++': ['SYSTEMS', 'Object-oriented and performance-minded programs, from coursework to interactive simulations.'],
  Python: ['AI + AUTOMATION', 'My main language for computer vision, machine learning experiments, and fast prototypes.'],
  JavaScript: ['INTERACTIVE WEB', 'Motion, interfaces, visualizers, and browser experiences that respond in real time.'],
  SQL: ['DATA', 'Queries and relational thinking for reliable application data.'],
  Assembly: ['LOW LEVEL', 'A closer look at registers, memory, instructions, and what software asks of hardware.'],
  HTML5: ['INTERFACES', 'Semantic structure that keeps ambitious visual work usable and understandable.'],
  CSS3: ['INTERFACES', 'Responsive systems, dimensional surfaces, typography, and the motion between states.'],
  Tailwind: ['INTERFACES', 'Fast, consistent UI composition through constrained utility systems.'],
  Bootstrap: ['INTERFACES', 'Practical responsive foundations for rapidly shaping application screens.'],
  'Node.js': ['BACKEND', 'JavaScript beyond the browser for APIs, tooling, and application services.'],
  Git: ['WORKFLOW', 'Small, traceable changes and a recoverable history while ideas evolve.'],
  GitHub: ['WORKFLOW', 'Repository collaboration, project presentation, and shipping work in public.'],
  'VS Code': ['TOOLING', 'The everyday workspace where code, debugging, terminals, and extensions meet.'],
  PyCharm: ['TOOLING', 'A focused Python environment for larger experiments and structured debugging.'],
  PostgreSQL: ['DATA', 'Relational storage for full-stack projects that need structure and dependable queries.'],
  'Express.js': ['BACKEND', 'Lean HTTP services and APIs connecting interfaces to application logic.'],
  MongoDB: ['DATA', 'Flexible document storage for projects whose data changes shape quickly.'],
  Mongoose: ['BACKEND', 'Schema and validation around MongoDB data inside Node applications.'],
  'MongoDB Atlas': ['CLOUD DATA', 'Hosted document databases for deployed prototypes and connected applications.'],
  Postman: ['API TOOLING', 'Testing request flows and debugging APIs before the interface depends on them.'],
};

export function initSkillsPuzzle({ stage, flankLeft, flankRight, board, chips, reducedMotion }) {
  const phaseStatus = document.getElementById('skill-phase-status');
  const detail = {
    index: document.getElementById('skill-detail-index'),
    icon: document.getElementById('skill-detail-icon'),
    category: document.getElementById('skill-detail-category'),
    name: document.getElementById('skill-detail-name'),
    copy: document.getElementById('skill-detail-copy'),
  };
  let selected = null, phase = 0, phaseCall = null, phaseBusy = false, inView = false;
  const duration = reducedMotion ? 0 : .55;
  const revealTargets = [flankLeft, board, flankRight].filter(Boolean);

  chips.forEach((chip, index) => {
    const name = chip.lastElementChild.textContent.trim();
    chip.dataset.skill = name;
    chip.dataset.index = String(index + 1).padStart(2, '0');
    chip.style.order = index;
    chip.tabIndex = 0;
    chip.setAttribute('role', 'button');
    chip.setAttribute('aria-label', `${name}: ${SKILL_INFO[name]?.[0] || 'tool'}`);
  });

  const columns = () => getComputedStyle(board).gridTemplateColumns.split(' ').length;
  const ordered = () => [...chips].sort((a, b) => Number(a.style.order) - Number(b.style.order));

  function clearPhase() {
    chips.forEach(chip => chip.classList.remove('is-phase', 'is-bloom', 'is-neighbor'));
    if (!selected) gsap.to(chips, { x: 0, y: 0, z: 0, scale: 1, rotationX: 0, rotationY: 0, opacity: 1, duration, ease: 'power3.out', overwrite: true });
    phaseBusy = false;
  }

  function swapTiles(a, b) {
    const before = new Map([[a, a.getBoundingClientRect()], [b, b.getBoundingClientRect()]]);
    const orderA = a.style.order;
    a.style.order = b.style.order;
    b.style.order = orderA;
    [a, b].forEach(tile => {
      const old = before.get(tile), next = tile.getBoundingClientRect();
      gsap.fromTo(tile, { x: old.left - next.left, y: old.top - next.top }, { x: 0, y: 0, duration: .85, ease: 'expo.inOut', overwrite: true });
    });
  }

  function runPhase() {
    if (selected || phaseBusy || document.hidden) return schedulePhase();
    phaseBusy = true;
    phase = (phase % 9) + 1;
    const cols = columns(), list = ordered();
    const maxStart = Math.max(0, list.length - cols - 2);
    const start = (phase * 3 + Math.floor(Math.random() * Math.max(1, cols))) % Math.max(1, maxStart + 1);
    const cluster = [list[start], list[start + 1], list[start + cols], list[start + cols + 1]].filter(Boolean);
    cluster.forEach((chip, i) => chip.classList.add('is-phase', ...(i === phase % cluster.length ? ['is-bloom'] : [])));
    if (phaseStatus) phaseStatus.textContent = `PHASE ${String(phase).padStart(2, '0')} / MERGE`;
    gsap.to(cluster, { scale: i => cluster[i].classList.contains('is-bloom') ? 1.1 : 1.025, z: i => cluster[i].classList.contains('is-bloom') ? 28 : 10, duration: .7, ease: 'power3.inOut', stagger: .05, overwrite: true });
    gsap.delayedCall(1.15, () => {
      clearPhase();
      if (!selected && cluster.length > 1) swapTiles(cluster[0], cluster[1]);
      if (phaseStatus) phaseStatus.textContent = `PHASE ${String(phase).padStart(2, '0')} / FLOW`;
    });
    schedulePhase();
  }

  function schedulePhase() {
    phaseCall?.kill();
    if (!reducedMotion && inView) phaseCall = gsap.delayedCall(2.1 + Math.random() * 1.2, runPhase);
  }

  function updateDetail(chip) {
    const name = chip.dataset.skill, info = SKILL_INFO[name] || ['TOOL', 'A practical part of the toolkit behind my projects.'];
    gsap.killTweensOf(flankRight);
    gsap.to(flankRight, { opacity: 0, y: 8, duration: reducedMotion ? 0 : .15, onComplete: () => {
      if (selected !== chip) return;
      detail.index.textContent = `ACTIVE TILE / ${chip.dataset.index}`;
      detail.category.textContent = info[0];
      detail.name.textContent = name;
      detail.copy.textContent = info[1];
      const img = chip.querySelector('img');
      detail.icon.innerHTML = img ? `<img src="${img.src}" alt="">` : chip.querySelector('.skill-chip-icon').textContent;
      gsap.to(flankRight, { opacity: 1, y: 0, duration: reducedMotion ? 0 : .35, ease: 'power2.out' });
    }});
  }

  function select(chip) {
    if (selected === chip) return;
    selected = chip;
    phaseCall?.kill();
    clearPhase();
    const chosen = chip.getBoundingClientRect();
    const cx = chosen.left + chosen.width / 2, cy = chosen.top + chosen.height / 2;
    chips.forEach(tile => {
      const rect = tile.getBoundingClientRect();
      const dx = rect.left + rect.width / 2 - cx, dy = rect.top + rect.height / 2 - cy;
      const distance = Math.hypot(dx / Math.max(rect.width, 1), dy / Math.max(rect.height, 1));
      const neighbor = tile !== chip && distance < 1.7;
      tile.classList.toggle('is-selected', tile === chip);
      tile.classList.toggle('is-neighbor', neighbor);
      const push = neighbor ? Math.max(3, 10 - distance * 3) : 0;
      gsap.to(tile, {
        x: tile === chip ? 0 : Math.sign(dx) * push,
        y: tile === chip ? -7 : Math.sign(dy) * push,
        z: tile === chip ? 46 : neighbor ? 8 : 0,
        scale: tile === chip ? 1.12 : neighbor ? .98 : .94,
        rotationX: tile === chip ? -5 : 0,
        rotationY: tile === chip ? 4 : 0,
        opacity: tile === chip || neighbor ? 1 : .58,
        duration,
        ease: 'power3.out',
        overwrite: true,
      });
    });
    updateDetail(chip);
  }

  function release() {
    if (!selected) return;
    selected = null;
    chips.forEach(chip => chip.classList.remove('is-selected', 'is-neighbor'));
    gsap.killTweensOf(flankRight);
    gsap.set(flankRight, { opacity: 1, y: 0 });
    gsap.to(chips, { x: 0, y: 0, z: 0, scale: 1, rotationX: 0, rotationY: 0, opacity: 1, duration, ease: 'power3.out', overwrite: true });
    detail.index.textContent = 'SELECT A TILE';
    detail.category.textContent = 'A LIVING TOOLKIT';
    detail.name.textContent = 'My toolkit';
    detail.copy.textContent = 'Select a skill to see how I use it.';
    detail.icon.textContent = '↗';
    if (phaseStatus) phaseStatus.textContent = `PHASE ${String(Math.max(phase, 1)).padStart(2, '0')} / FLOW`;
    schedulePhase();
  }

  chips.forEach(chip => {
    chip.addEventListener('pointerenter', event => {
      const focusedTile = document.activeElement?.closest?.('.skill-chip');
      if (focusedTile && focusedTile !== chip) return;
      if (event.pointerType === 'mouse' && matchMedia('(hover:hover)').matches) select(chip);
    });
    chip.addEventListener('pointerleave', () => { if (selected === chip && !chip.matches(':focus')) release(); });
    chip.addEventListener('focus', () => select(chip));
    chip.addEventListener('blur', () => queueMicrotask(() => { if (!board.contains(document.activeElement)) release(); }));
    chip.addEventListener('click', () => { select(chip); chip.focus({ preventScroll: true }); });
    chip.addEventListener('keydown', event => { if (event.key === 'Escape') { release(); chip.blur(); } });
  });
  stage.addEventListener('pointerdown', event => { if (selected && !event.target.closest('.skill-chip')) release(); });

  if (!reducedMotion) {
    board.addEventListener('pointermove', event => {
      if (event.pointerType !== 'mouse') return;
      const r = board.getBoundingClientRect();
      gsap.to(board, { rotationX: ((event.clientY-r.top)/r.height-.5)*-2.4, rotationY: ((event.clientX-r.left)/r.width-.5)*3.2, duration: .7, ease: 'power3.out', overwrite: 'auto' });
    });
    board.addEventListener('pointerleave', () => gsap.to(board, { rotationX: 0, rotationY: 0, duration: .8, ease: 'power3.out' }));
  }

  ScrollTrigger.create({
    trigger: stage, start: 'top bottom', end: 'bottom top',
    onEnter: () => { inView = true; schedulePhase(); },
    onEnterBack: () => { inView = true; schedulePhase(); },
    onLeave: () => { inView = false; phaseCall?.kill(); release(); clearPhase(); },
    onLeaveBack: () => { inView = false; phaseCall?.kill(); release(); clearPhase(); },
  });
  if (reducedMotion) {
    gsap.set([...revealTargets, ...chips], { opacity: 1, y: 0, z: 0, scale: 1 });
  } else {
    gsap.fromTo(revealTargets, { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: .9, stagger: .12, ease: 'power3.out', scrollTrigger: { trigger: stage, start: 'top 78%' } });
    gsap.fromTo(chips, { opacity: 0, scale: .82, z: -30 }, { opacity: 1, scale: 1, z: 0, duration: .65, stagger: { each: .025, from: 'random' }, ease: 'back.out(1.5)', scrollTrigger: { trigger: stage, start: 'top 78%', once: true }, onComplete: schedulePhase });
  }
}

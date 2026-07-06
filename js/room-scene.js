import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js';

const CODE_LINES = [
  '> whoami',
  'khubaib_nazeer',
  '> ls skills/',
  'c c++ python js sql asm',
  '> echo $DRIVEN_BY',
  'curiosity, not deadlines',
  '> status --watch',
  'still compiling...',
];

function makeScreenTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 192;
  const ctx = canvas.getContext('2d');
  const texture = new THREE.CanvasTexture(canvas);

  let lineIndex = 0, charIndex = 0, frame = 0, pause = 0;
  let displayed = [];

  function draw() {
    ctx.fillStyle = '#0b0905';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.font = '13px "Courier New", monospace';
    ctx.textBaseline = 'top';

    displayed.forEach((line, i) => {
      ctx.fillStyle = line.startsWith('>') ? '#ff8a4d' : '#ffcf94';
      ctx.fillText(line, 10, 10 + i * 17);
    });

    const current = CODE_LINES[lineIndex].slice(0, charIndex);
    ctx.fillStyle = CODE_LINES[lineIndex].startsWith('>') ? '#ff8a4d' : '#ffcf94';
    const y = 10 + displayed.length * 17;
    ctx.fillText(current, 10, y);

    if (Math.floor(frame / 18) % 2 === 0) {
      const w = ctx.measureText(current).width;
      ctx.fillStyle = '#ff8a4d';
      ctx.fillRect(10 + w + 2, y + 1, 7, 13);
    }
    texture.needsUpdate = true;
  }

  function tick() {
    frame++;
    if (pause > 0) {
      pause--;
    } else if (frame % 3 === 0) {
      charIndex++;
      if (charIndex > CODE_LINES[lineIndex].length) {
        displayed.push(CODE_LINES[lineIndex]);
        if (displayed.length > 9) displayed.shift();
        lineIndex = (lineIndex + 1) % CODE_LINES.length;
        charIndex = 0;
        pause = 26;
      }
    }
    draw();
  }

  draw();
  return { texture, tick };
}

function makeSkyTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');
  const grad = ctx.createLinearGradient(0, 0, 0, 64);
  grad.addColorStop(0, '#2a2540');
  grad.addColorStop(0.55, '#5a3a4a');
  grad.addColorStop(1, '#d97a3f');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 64, 64);
  ctx.fillStyle = '#ffe9c2';
  ctx.beginPath();
  ctx.arc(46, 16, 6, 0, Math.PI * 2);
  ctx.fill();
  return new THREE.CanvasTexture(canvas);
}

function makePaintingTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#1c1a1e';
  ctx.fillRect(0, 0, 64, 64);
  ctx.fillStyle = '#15131a';
  ctx.fillRect(4, 4, 56, 56);
  ctx.fillStyle = '#ff8a4d';
  ctx.font = 'bold 30px "Courier New", monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('{;}', 32, 35);
  ctx.fillStyle = '#1c1a1e';
  ctx.fillRect(0, 0, 64, 4);
  ctx.fillRect(0, 60, 64, 4);
  ctx.fillRect(0, 0, 4, 64);
  ctx.fillRect(60, 0, 4, 64);
  return new THREE.CanvasTexture(canvas);
}

function flatMat(color, extra) {
  return new THREE.MeshStandardMaterial({ color, flatShading: true, roughness: 0.85, metalness: 0.05, ...extra });
}

function buildRoomShell() {
  const group = new THREE.Group();
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(7, 5), flatMat(0x4a3526));
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -2.2;
  group.add(floor);

  const backWall = new THREE.Mesh(new THREE.PlaneGeometry(7, 4.2), flatMat(0x2c3b45));
  backWall.position.set(0, -0.1, -1.9);
  group.add(backWall);

  const sideWall = new THREE.Mesh(new THREE.PlaneGeometry(5, 4.2), flatMat(0x24323b));
  sideWall.rotation.y = Math.PI / 2;
  sideWall.position.set(-3.2, -0.1, 0);
  group.add(sideWall);

  return group;
}

function buildWindow() {
  const group = new THREE.Group();
  const frame = new THREE.Mesh(new THREE.BoxGeometry(1.5, 1.5, 0.08), flatMat(0x1c1410));
  group.add(frame);
  const glass = new THREE.Mesh(new THREE.PlaneGeometry(1.32, 1.32), new THREE.MeshBasicMaterial({ map: makeSkyTexture() }));
  glass.position.z = 0.05;
  group.add(glass);
  const mullionV = new THREE.Mesh(new THREE.BoxGeometry(0.06, 1.4, 0.1), flatMat(0x1c1410));
  mullionV.position.z = 0.06;
  group.add(mullionV);
  const mullionH = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.06, 0.1), flatMat(0x1c1410));
  mullionH.position.z = 0.06;
  group.add(mullionH);

  const curtainMat = flatMat(0x6b2230);
  const curtainL = new THREE.Mesh(new THREE.BoxGeometry(0.26, 1.7, 0.12), curtainMat);
  curtainL.position.set(-0.95, -0.05, 0.18);
  group.add(curtainL);
  const curtainR = curtainL.clone();
  curtainR.position.x = 0.95;
  group.add(curtainR);
  const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 2.2, 8), flatMat(0x3a2a1c));
  rod.rotation.z = Math.PI / 2;
  rod.position.y = 0.85;
  group.add(rod);

  return group;
}

function buildBookshelf() {
  const group = new THREE.Group();
  const caseMat = flatMat(0x3a2a1c);
  const shelfCase = new THREE.Mesh(new THREE.BoxGeometry(0.9, 1.9, 0.5), caseMat);
  group.add(shelfCase);

  const colors = [0xff8a4d, 0x3b6cff, 0xe8d27a, 0x6b2230, 0x4a8a6a, 0xd9d3c5];
  let shelfY = -0.7;
  for (let row = 0; row < 3; row++) {
    let x = -0.36;
    const bookCount = 4 + (row % 2);
    for (let i = 0; i < bookCount; i++) {
      const w = 0.1 + Math.random() * 0.05;
      const h = 0.45 + Math.random() * 0.2;
      const book = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.36), flatMat(colors[(row + i) % colors.length]));
      book.position.set(x, shelfY + h / 2, 0.02);
      group.add(book);
      x += w + 0.02;
    }
    shelfY += 0.62;
  }
  return group;
}

function buildPainting() {
  const group = new THREE.Group();
  const frame = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.9, 0.06), flatMat(0x1c1410));
  group.add(frame);
  const art = new THREE.Mesh(new THREE.PlaneGeometry(0.78, 0.78), new THREE.MeshBasicMaterial({ map: makePaintingTexture() }));
  art.position.z = 0.04;
  group.add(art);
  return group;
}

function buildDesk() {
  const group = new THREE.Group();
  const top = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.08, 0.9), flatMat(0x5a3f2a));
  top.position.y = 0;
  group.add(top);
  const legMat = flatMat(0x2a1d12);
  [[-0.9, -0.38], [0.9, -0.38], [-0.9, 0.38], [0.9, 0.38]].forEach(([x, z]) => {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.95, 0.08), legMat);
    leg.position.set(x, -0.5, z);
    group.add(leg);
  });
  return group;
}

function buildMonitor(screenTex) {
  const group = new THREE.Group();
  const bezel = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.7, 0.55), flatMat(0xd6d2c4));
  group.add(bezel);
  const screen = new THREE.Mesh(
    new THREE.PlaneGeometry(0.68, 0.5),
    new THREE.MeshStandardMaterial({ map: screenTex, emissive: 0xffffff, emissiveMap: screenTex, emissiveIntensity: 1.1, flatShading: true })
  );
  screen.position.z = 0.28;
  group.add(screen);
  const neck = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.22, 0.12), flatMat(0xc9c4b4));
  neck.position.y = -0.46;
  group.add(neck);
  const base = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.05, 0.3), flatMat(0xc9c4b4));
  base.position.y = -0.58;
  group.add(base);
  return group;
}

function buildKeyboard() {
  const group = new THREE.Group();
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.04, 0.2), flatMat(0xd6d2c4));
  group.add(body);
  const keys = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.015, 0.14), flatMat(0xb8b3a0));
  keys.position.y = 0.025;
  group.add(keys);
  return group;
}

function buildChair() {
  const group = new THREE.Group();
  const seatMat = flatMat(0x2c2024);
  const seat = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.08, 0.5), seatMat);
  group.add(seat);
  const back = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.65, 0.08), seatMat);
  back.position.set(0, 0.4, -0.24);
  group.add(back);
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.55, 8), flatMat(0x3a3338));
  pole.position.y = -0.32;
  group.add(pole);
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.04, 12), flatMat(0x3a3338));
  base.position.y = -0.6;
  group.add(base);
  return group;
}

function buildBoy() {
  const group = new THREE.Group();
  const skin = flatMat(0xd9a878);
  const hair = flatMat(0x2a1d16);
  const shirt = flatMat(0x3f8a78);

  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.5, 0.28), shirt);
  torso.position.y = 0.27;
  group.add(torso);

  const head = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.28, 0.26), skin);
  head.position.y = 0.66;
  group.add(head);

  const hairCap = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.14, 0.28), hair);
  hairCap.position.y = 0.78;
  group.add(hairCap);

  // single tilted segment per arm, angled forward-down from shoulder toward the keyboard
  // (negative local Z = toward the desk, since the desk sits at a smaller world Z than the boy)
  [-1, 1].forEach((side) => {
    const arm = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.42, 0.1), skin);
    arm.position.set(side * 0.24, 0.26, -0.16);
    arm.rotation.x = 1.15;
    group.add(arm);
  });

  const legMat = flatMat(0x2a3a52);
  [-0.12, 0.12].forEach((x) => {
    const thigh = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.14, 0.4), legMat);
    thigh.position.set(x, 0.02, 0.12);
    group.add(thigh);
  });

  return group;
}

function buildLamp() {
  const group = new THREE.Group();
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 0.04, 10), flatMat(0x2a2024));
  group.add(base);
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.5, 8), flatMat(0x3a3338));
  pole.position.y = 0.27;
  group.add(pole);
  const shade = new THREE.Mesh(
    new THREE.ConeGeometry(0.14, 0.18, 12, 1, true),
    new THREE.MeshStandardMaterial({ color: 0xffcf94, emissive: 0xff8a4d, emissiveIntensity: 0.6, flatShading: true, side: THREE.DoubleSide })
  );
  shade.position.y = 0.56;
  group.add(shade);
  return group;
}

export function initRoomScene(canvas) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(32, window.innerWidth / window.innerHeight, 0.1, 100);
  camera.position.set(0, 0.6, 9);

  scene.add(new THREE.AmbientLight(0x50506a, 1.1));
  const key = new THREE.DirectionalLight(0xfff2e0, 1.6);
  key.position.set(4, 5, 6);
  scene.add(key);
  const rimOrange = new THREE.PointLight(0xff8a4d, 6, 14);
  rimOrange.position.set(-1, 0.6, 2.5);
  scene.add(rimOrange);
  const rimBlue = new THREE.PointLight(0x3b6cff, 2.5, 16);
  rimBlue.position.set(3, 2, -3);
  scene.add(rimBlue);

  const roomGroup = new THREE.Group();

  roomGroup.add(buildRoomShell());

  const win = buildWindow();
  win.position.set(-1.6, 0.4, -1.85);
  roomGroup.add(win);

  const shelf = buildBookshelf();
  shelf.position.set(-2.95, -1.25, -0.6);
  shelf.rotation.y = Math.PI / 2;
  roomGroup.add(shelf);

  const painting = buildPainting();
  painting.position.set(1.6, 0.5, -1.86);
  roomGroup.add(painting);

  const lamp = buildLamp();
  lamp.position.set(1.3, -1.26, 0.15);
  roomGroup.add(lamp);

  const desk = buildDesk();
  desk.position.set(0.5, -1.3, 0.4);
  roomGroup.add(desk);

  const screen = makeScreenTexture();
  const monitor = buildMonitor(screen.texture);
  monitor.position.set(0.5, -0.55, 0.15);
  roomGroup.add(monitor);

  const keyboard = buildKeyboard();
  keyboard.position.set(0.5, -1.23, 0.55);
  roomGroup.add(keyboard);

  const chair = buildChair();
  chair.position.set(0.5, -1.55, 1.3);
  roomGroup.add(chair);

  const boy = buildBoy();
  boy.position.set(0.5, -1.57, 1.05);
  roomGroup.add(boy);

  roomGroup.position.x = 2.1;
  roomGroup.rotation.y = -0.55;
  scene.add(roomGroup);

  const baseRotY = -0.55;
  let scrollT = 0;
  let baseCameraZ = 9;
  let baseGroupX = 2.1;
  let baseGroupY = 0;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function setScrollProgress(p) {
    scrollT = Math.max(0, Math.min(1, p));
  }

  function computeResponsive() {
    const aspect = window.innerWidth / window.innerHeight;
    if (aspect < 0.6) {
      // Worst of all four tiers, confirmed on an actual phone viewport
      // (375x812): the bookshelf (left) AND the painting (right) both
      // projected outside the frame at once — the room's flat baseCameraZ
      // here was tuned for a taller phone-ish aspect than the range this
      // tier actually covers all the way down to. Same continuous fix.
      baseCameraZ = Math.max(13.5, 9.2 / aspect - 0.75);
      baseGroupX = 0;
      baseGroupY = -1.85; // push the room down so it sits below the hero copy, not behind it
    } else if (aspect < 0.85) {
      baseCameraZ = Math.max(12.5, 10.75 / aspect - 0.75);
      baseGroupX = 0.4;
      baseGroupY = -1.6;
    } else if (aspect < 1.3) {
      // Same clipping issue as the tier below, confirmed the same way
      // (aspect ~0.85-1, e.g. a 1000x1050 window: painting projected well
      // past the right edge). Same fix — scale with aspect, floor at the
      // original constant.
      baseCameraZ = Math.max(10.5, 15.5 / aspect - 0.75);
      baseGroupX = 1.6;
      baseGroupY = 0;
    } else {
      // A flat baseCameraZ=9 was only tuned for genuinely wide screens
      // (~16:9, aspect ~1.8+) — verified via camera-space projection that at
      // common 16:10-ish laptop widths lower in this same tier (aspect
      // ~1.3-1.6, e.g. 1440x900, 1280x800), the wall painting's projected
      // screen X exceeds innerWidth, i.e. it's genuinely clipped off the
      // right edge, not just visually tight. Scale distance continuously
      // with aspect instead of one constant so it stays in frame throughout;
      // clamp to the validated 9 as a floor so wide screens don't change.
      baseCameraZ = Math.max(9, 17.6 / aspect - 0.75);
      baseGroupX = 2.1;
      baseGroupY = 0;
    }
  }
  computeResponsive();

  function onResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    computeResponsive();
  }
  window.addEventListener('resize', onResize);

  const clock = new THREE.Clock();
  let frameSkip = 0;
  function render() {
    const t = clock.getElapsedTime();
    frameSkip++;
    if (frameSkip % 2 === 0) screen.tick();

    const idle = reducedMotion ? 0 : Math.sin(t * 0.25) * 0.03;
    roomGroup.rotation.y = baseRotY + scrollT * 0.5 + idle;
    roomGroup.position.x = baseGroupX;
    roomGroup.position.y = baseGroupY + Math.sin(t * 0.4) * (reducedMotion ? 0 : 0.025);
    camera.position.z = baseCameraZ - scrollT * 1.4;

    renderer.render(scene, camera);
  }

  return { render, setScrollProgress };
}

import * as THREE from './vendor/three-0.160.0.module.js';

// A broad, folded band with a softbox environment. No external models or textures.
function foldedBand() {
  const positions = [], uvs = [], indices = [];
  const segments = 256, across = 16;
  for (let i = 0; i <= segments; i++) {
    const t = i / segments * Math.PI * 2;
    for (let j = 0; j <= across; j++) {
      const v = (j / across - 0.5) * 0.86;
      const radius = 1.45 + 0.15 * Math.sin(t * 3) + v * Math.cos(t + 0.3);
      positions.push(radius * Math.cos(t), radius * Math.sin(t) * 1.13,
        0.30 * Math.sin(t * 2) + v * Math.sin(t + 0.3));
      uvs.push(i / segments, j / across);
      if (i < segments && j < across) {
        const a = i * (across + 1) + j, b = a + across + 1;
        indices.push(a, b, a + 1, b, b + 1, a + 1);
      }
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

function environment(renderer) {
  const canvas = document.createElement('canvas');
  canvas.width = 1024; canvas.height = 512;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#14141e'; ctx.fillRect(0, 0, 1024, 512);
  // Long studio reflection cards produce broad metal highlights, not neon outlines.
  for (const [x, y, w, h, color] of [[100, 10, 160, 390, '#ffffff'], [620, 90, 100, 360, '#d6e8ff'], [350, 180, 85, 300, '#dca5c4'], [820, 20, 90, 300, '#9a8fff']]) {
    const gradient = ctx.createLinearGradient(x, 0, x + w, 0);
    gradient.addColorStop(0, '#14141e'); gradient.addColorStop(0.3, color);
    gradient.addColorStop(0.7, color); gradient.addColorStop(1, '#14141e');
    ctx.fillStyle = gradient; ctx.fillRect(x, y, w, h);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.mapping = THREE.EquirectangularReflectionMapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  const pmrem = new THREE.PMREMGenerator(renderer);
  const target = pmrem.fromEquirectangular(texture);
  texture.dispose(); pmrem.dispose();
  return target;
}

export function initMetallicHero(canvas) {
  const hero = document.getElementById('hero');
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'low-power' });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.35;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 50);
  camera.position.z = 8.8;
  const env = environment(renderer);
  scene.environment = env.texture;

  const background = new THREE.Scene();
  const backgroundCamera = new THREE.Camera();
  const uniforms = { uTime: { value: 0 }, uAspect: { value: 1 }, uPointer: { value: new THREE.Vector2() } };
  const field = new THREE.ShaderMaterial({
    depthTest: false, depthWrite: false,
    uniforms,
    vertexShader: 'varying vec2 vUv; void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}',
    fragmentShader: `
      varying vec2 vUv; uniform float uTime; uniform float uAspect; uniform vec2 uPointer;
      float pool(vec2 p, vec2 c, float radius) {vec2 d=p-c;d.x*=uAspect;return exp(-dot(d,d)/radius);}
      void main(){
        vec2 p=vUv; float t=uTime*.13;
        p+=.018*vec2(sin(p.y*7.+t),cos(p.x*6.-t));
        vec2 drift=uPointer*.018;
        vec3 color=vec3(.028,.030,.046);
        color+=vec3(.15,.09,.31)*pool(p,vec2(.69+.06*sin(t),.42)+drift,.13);
        color+=vec3(.08,.18,.24)*pool(p,vec2(.86,.64+.1*cos(t*.7))+drift,.07);
        color+=vec3(.25,.10,.14)*pool(p,vec2(.58+.1*cos(t*.5),.24),.08);
        color+=vec3(.16,.095,.065)*pool(p,vec2(.16,.02),.04);
        float grain=fract(sin(dot(gl_FragCoord.xy,vec2(12.9898,78.233)))*43758.5453);
        color+=(grain-.5)*.012;
        gl_FragColor=vec4(color,1.);
      }`,
  });
  background.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), field));

  const sculpture = new THREE.Group();
  const geometry = foldedBand();
  const metal = new THREE.MeshPhysicalMaterial({ color: 0xd1d3df, metalness: 1, roughness: 0.23, clearcoat: 0.45, clearcoatRoughness: 0.25, side: THREE.DoubleSide, envMapIntensity: 2 });
  sculpture.add(new THREE.Mesh(geometry, metal));
  // Fine rounded rims give the sheet physical thickness and sharp glancing highlights.
  const pos = geometry.getAttribute('position');
  const rimMaterial = new THREE.MeshStandardMaterial({ color: 0xc3c8dd, metalness: 1, roughness: 0.15, envMapIntensity: 2 });
  for (const edge of [0, 16]) {
    const points = [];
    for (let i = 0; i < 256; i++) points.push(new THREE.Vector3().fromBufferAttribute(pos, i * 17 + edge));
    const curve = new THREE.CatmullRomCurve3(points, true);
    sculpture.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 256, 0.018, 6, true), rimMaterial));
  }
  scene.add(sculpture);
  const key = new THREE.DirectionalLight(0xdbe9ff, 3);
  key.position.set(-3, 4, 5); scene.add(key);
  const rim = new THREE.DirectionalLight(0xb7a2ff, 1.7);
  rim.position.set(4, -2, 2); scene.add(rim);

  let width = 0, height = 0, intro = 0, scroll = 0, visible = true, dirty = true, last = 0;
  const pointer = new THREE.Vector2(), eased = new THREE.Vector2();
  function resize() {
    const bounds = hero.getBoundingClientRect();
    width = bounds.width; height = bounds.height;
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, width < 700 ? 1.4 : 1.7));
    renderer.setSize(width, height, false);
    camera.aspect = width / height; camera.updateProjectionMatrix();
    uniforms.uAspect.value = camera.aspect; dirty = true;
  }
  const resizeObserver = new ResizeObserver(resize); resizeObserver.observe(hero);
  const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; dirty = true; });
  observer.observe(hero);
  const onMove = event => {
    if (event.pointerType === 'touch' || motion.matches) return;
    const rect = hero.getBoundingClientRect();
    pointer.set((event.clientX - rect.left) / rect.width * 2 - 1, (event.clientY - rect.top) / rect.height * 2 - 1);
    dirty = true;
  };
  const onLeave = () => pointer.set(0, 0);
  hero.addEventListener('pointermove', onMove); hero.addEventListener('pointerleave', onLeave);
  const onMotion = () => { dirty = true; pointer.set(0, 0); };
  motion.addEventListener('change', onMotion);
  let contextLost = false;
  canvas.addEventListener('webglcontextlost', event => { event.preventDefault(); contextLost = true; canvas.style.opacity = '0'; });
  canvas.addEventListener('webglcontextrestored', () => { contextLost = false; dirty = true; canvas.style.opacity = '1'; });
  resize();

  function render(time = 0) {
    if (contextLost || document.hidden || !visible || (motion.matches && !dirty)) return;
    // Cap small-screen rendering to 30 fps; large screens follow GSAP's ticker.
    if (width < 700 && time - last < 1 / 30 && !dirty) return;
    last = time;
    const t = motion.matches ? 0 : time;
    eased.lerp(pointer, 0.065);
    uniforms.uTime.value = t; uniforms.uPointer.value.copy(eased);
    const worldH = 2 * Math.tan(THREE.MathUtils.degToRad(35 / 2)) * camera.position.z;
    const worldW = worldH * camera.aspect;
    const narrow = width < 800;
    const finalX = narrow ? worldW * .03 : worldW * .23;
    const finalY = narrow ? -worldH * .27 : worldH * .015;
    const size = narrow ? Math.min(worldW * .245, worldH * .105) : Math.min(worldW * .105, worldH * .21);
    sculpture.scale.setScalar(size * (.74 + intro * .26));
    sculpture.position.set(finalX * intro, finalY * intro + Math.sin(t*.5)*.035, 0);
    sculpture.rotation.set(.18 + eased.y*.08, -.35 + (1-intro)*.85 + eased.x*.16 + Math.sin(t*.22)*.12, -.40 + scroll*.15);
    renderer.autoClear = true; renderer.render(background, backgroundCamera);
    renderer.autoClear = false; renderer.clearDepth(); renderer.render(scene, camera);
    dirty = false;
  }
  render();
  return {
    render,
    setIntroProgress(value) { intro = value; dirty = true; },
    setScrollProgress(value) { scroll = value; dirty = true; },
    dispose() {
      resizeObserver.disconnect(); observer.disconnect();
      hero.removeEventListener('pointermove', onMove); hero.removeEventListener('pointerleave', onLeave);
      motion.removeEventListener('change', onMotion);
      scene.traverse(object => { object.geometry?.dispose(); });
      metal.dispose(); rimMaterial.dispose(); field.dispose(); env.dispose(); renderer.dispose();
    },
  };
}

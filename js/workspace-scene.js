import * as THREE from './vendor/three-0.160.0.module.js';

// A single persistent workspace, shared by the opening and every page chapter.
const TAU = Math.PI * 2;
const cache = new Map();
function rounded(w, h, d, radius = .055) {
  const key = [w,h,d,radius].join('/');
  if (cache.has(key)) return cache.get(key);
  const r = Math.min(radius, w/3, h/3, d/3), x = -w/2, y = -h/2;
  const shape = new THREE.Shape();
  shape.moveTo(x+r,y); shape.lineTo(x+w-r,y); shape.quadraticCurveTo(x+w,y,x+w,y+r);
  shape.lineTo(x+w,y+h-r); shape.quadraticCurveTo(x+w,y+h,x+w-r,y+h);
  shape.lineTo(x+r,y+h); shape.quadraticCurveTo(x,y+h,x,y+h-r);
  shape.lineTo(x,y+r); shape.quadraticCurveTo(x,y,x+r,y);
  const geometry = new THREE.ExtrudeGeometry(shape,{depth:d-r,bevelEnabled:true,bevelThickness:r/2,bevelSize:r/2,bevelSegments:3,steps:1,curveSegments:8});
  geometry.translate(0,0,-(d-r)/2); cache.set(key,geometry); return geometry;
}
function material(color, roughness = .55, metalness = 0) {
  return new THREE.MeshStandardMaterial({ color, roughness, metalness });
}
function box(parent, size, position, mat, radius) {
  const mesh = new THREE.Mesh(rounded(...size,radius),mat);
  mesh.position.set(...position); mesh.castShadow = true; mesh.receiveShadow = true; parent.add(mesh); return mesh;
}
function ellipsoid(parent, size, position, mat) {
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(1,24,16),mat);
  mesh.scale.set(...size); mesh.position.set(...position); mesh.castShadow = true; parent.add(mesh); return mesh;
}
function rod(parent, start, end, radius, mat) {
  const a = new THREE.Vector3(...start), b = new THREE.Vector3(...end);
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius,radius,b.distanceTo(a),12),mat);
  mesh.position.copy(a).add(b).multiplyScalar(.5);
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),b.sub(a).normalize());
  mesh.castShadow = true; parent.add(mesh); return mesh;
}
function studioEnvironment(renderer) {
  const canvas = document.createElement('canvas'); canvas.width=512; canvas.height=256;
  const c=canvas.getContext('2d'); c.fillStyle='#303440'; c.fillRect(0,0,512,256);
  c.fillStyle='#e7e2de'; c.fillRect(35,20,100,140); c.fillStyle='#9198c4'; c.fillRect(310,35,65,155);
  c.fillStyle='#e7bba0'; c.fillRect(220,90,40,100);
  const texture=new THREE.CanvasTexture(canvas); texture.colorSpace=THREE.SRGBColorSpace;
  texture.mapping=THREE.EquirectangularReflectionMapping;
  const pmrem=new THREE.PMREMGenerator(renderer), target=pmrem.fromEquirectangular(texture);
  pmrem.dispose(); texture.dispose(); return target;
}
function woodTexture() {
  const canvas=document.createElement('canvas'); canvas.width=512; canvas.height=256;
  const c=canvas.getContext('2d'); c.fillStyle='#665044'; c.fillRect(0,0,512,256);
  for(let i=0;i<160;i++) {
    c.strokeStyle=i%3?'#72594a':'#49372f'; c.globalAlpha=.25;
    c.beginPath(); const y=i*1.7;
    c.moveTo(0,y); c.bezierCurveTo(160,y+Math.sin(i)*8,330,y-4,512,y+2); c.stroke();
  }
  const texture=new THREE.CanvasTexture(canvas); texture.colorSpace=THREE.SRGBColorSpace; return texture;
}
function terminal() {
  const canvas=document.createElement('canvas'); canvas.width=768; canvas.height=480;
  const c=canvas.getContext('2d'), texture=new THREE.CanvasTexture(canvas);
  texture.colorSpace=THREE.SRGBColorSpace;
  const lines=['> I am a developer.','> building interactive worlds','> Python · C++ · JavaScript','> curiosity leads. code follows.'];
  let lastStep=-1;
  function update(time, reduced) {
    const step=reduced?999:Math.floor(time*12);
    if(step===lastStep) return; lastStep=step;
    c.fillStyle='#101923'; c.fillRect(0,0,768,480);
    c.fillStyle='#293640'; c.fillRect(0,0,768,44);
    ['#ee927e','#e6c685','#91bfa8'].forEach((color,i)=>{c.fillStyle=color;c.beginPath();c.arc(23+i*22,22,6,0,TAU);c.fill();});
    c.fillStyle='#a7b1c1'; c.font='18px monospace'; c.fillText('khubaib / workspace',280,29);
    c.fillStyle='#eef1ef'; c.font='bold 55px monospace'; c.fillText('KHUBAIB',40,125); c.fillText('NAZEER',40,185);
    c.font='25px monospace';
    const cycle=lines.reduce((n,s)=>n+s.length+12,0), phase=step%cycle;
    let remaining=reduced?cycle:phase;
    lines.forEach((line,i)=>{
      const count=Math.max(0,Math.min(line.length,remaining));
      c.fillStyle=i===0?'#96d7d0':'#a8b6ca'; c.fillText(line.slice(0,count),40,257+i*48);
      if(!reduced && remaining>=0 && remaining<line.length+12 && step%12<7) c.fillRect(42+c.measureText(line.slice(0,count)).width,237+i*48,12,25);
      remaining-=line.length+12;
    });
    texture.needsUpdate=true;
  }
  update(0,true); return {texture,update};
}

function buildWorkspace(scene) {
  const room=new THREE.Group(); scene.add(room);
  const chrome=material(0xb4bdc8,.27,.85), darkMetal=material(0x303845,.38,.65);
  const wall=material(0x394354,.92), trim=material(0x727e90,.45,.35);
  const deskMat=material(0xffffff,.6); deskMat.map=woodTexture();
  const floor=material(0x444453,.9), cloth=material(0x343a50,.98);
  box(room,[6.3,.20,4.5],[0,-.14,0],darkMetal,.09);
  box(room,[6.15,.08,4.35],[0,-.015,0],floor,.03);
  // An open-front diorama: deliberate wall thickness, skirting, and floor contact.
  box(room,[6.15,3.7,.12],[0,1.81,-2.16],wall,.04);
  box(room,[.12,3.7,4.35],[-3.07,1.81,0],wall,.04);
  box(room,[6.02,.10,.05],[0,.07,-2.06],trim,.012);
  box(room,[.05,.10,4.15],[-2.97,.07,0],trim,.012);
  box(room,[3.8,.025,2.4],[.45,.055,.55],cloth,.009);

  // Dusk through the window, with a recessed metal frame and a deep sill.
  const sky=new THREE.ShaderMaterial({uniforms:{uPhase:{value:0}},vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:`varying vec2 vUv;uniform float uPhase;void main(){vec3 top=mix(vec3(.18,.22,.44),vec3(.10,.28,.36),uPhase);vec3 color=mix(vec3(.78,.40,.31),top,smoothstep(0.,.9,vUv.y));float sun=1.-smoothstep(.08,.085,length(vUv-vec2(.72,.38)));color=mix(color,vec3(1.,.8,.57),sun);gl_FragColor=vec4(color,1.);}`});
  box(room,[2.05,2.05,.13],[-1.18,2.32,-2.04],darkMetal,.06);
  const windowPane=new THREE.Mesh(new THREE.PlaneGeometry(1.85,1.85),sky);windowPane.position.set(-1.18,2.32,-1.96);room.add(windowPane);
  box(room,[.035,1.87,.06],[-1.18,2.32,-1.91],trim,.008);
  box(room,[1.87,.035,.06],[-1.18,2.12,-1.91],trim,.008);
  box(room,[2.25,.09,.36],[-1.18,1.28,-1.9],chrome,.025);
  // Low skyline silhouettes sit within the window frame.
  const skyline=material(0x30384a,1);
  for(let i=0;i<9;i++) {const h=.12+(i*7%5)*.065;box(room,[.18,h,.01],[-2.0+i*.205,1.40+h/2,-1.945],skyline,.002);}

  // Open bookshelf, individual shelves, spines, and an understated plant.
  const shelfWood=material(0x5a4540,.65);
  for(const x of [-2.74,-1.87]) box(room,[.065,1.24,.55],[x,.67,-.60],shelfWood,.015);
  for(const y of [.11,.64,1.25]) box(room,[.94,.06,.55],[-2.30,y,-.60],shelfWood,.015);
  const colors=[0xb57c66,0x7b899f,0xcbbda1,0x606c85,0x97a998];
  for(let row=0;row<2;row++) for(let i=0;i<5;i++) {
    const h=.33+(i%3)*.045,x=-2.64+i*.14,y=.16+row*.54+h/2;
    const cover=material(colors[(i+row)%5],.8);box(room,[.105,h,.33],[x,y,-.51],cover,.01);
    box(room,[.06,.012,.006],[x,y+h*.25,-.338],trim,.001);
  }
  const pot=material(0xc2aaa0,.85), leaf=material(0x617e72,.8);
  const p=new THREE.Mesh(new THREE.CylinderGeometry(.16,.12,.23,24),pot);p.position.set(-2.34,1.41,-.6);p.castShadow=true;room.add(p);
  for(let i=0;i<7;i++) {const a=i*2.4;const l=ellipsoid(room,[.055,.22,.085],[-2.34+Math.cos(a)*.14,1.70+(i%2)*.06,-.6+Math.sin(a)*.13],leaf);l.rotation.z=Math.cos(a)*.45;}

  // Wide timber desk with brushed-aluminum frame.
  box(room,[2.8,.12,1.25],[.55,1.25,-.69],deskMat,.05);
  for(const x of [-.64,1.75]) for(const z of [-1.15,-.21]) box(room,[.075,1.16,.075],[x,.63,z],darkMetal,.018);
  rod(room,[-.64,.42,-1.15],[1.75,.42,-1.15],.025,chrome);
  const screen=terminal();
  box(room,[1.82,1.15,.13],[.38,2.02,-1.00],darkMetal,.07);
  const display=new THREE.Mesh(new THREE.PlaneGeometry(1.69,1.055),new THREE.MeshBasicMaterial({map:screen.texture,toneMapped:false}));
  display.position.set(.38,2.02,-.926);room.add(display);
  box(room,[.075,.36,.075],[.38,1.53,-1.02],chrome,.018);
  box(room,[.60,.035,.32],[.38,1.335,-.99],chrome,.015);
  ellipsoid(room,[.017,.017,.005],[1.12,1.48,-.923],new THREE.MeshBasicMaterial({color:0x9ed3cf}));
  // An actual keyboard key grid, wrist rest, mouse, and coffee cup.
  box(room,[.90,.045,.32],[.35,1.345,-.30],chrome,.016);
  for(let row=0;row<4;row++) for(let col=0;col<12;col++) box(room,[.055,.015,.047],[-.04+col*.071,1.378,-.408+row*.069],darkMetal,.004);
  box(room,[.36,.015,.045],[.35,1.38,-.15],trim,.004);
  ellipsoid(room,[.10,.04,.15],[1.06,1.37,-.32],chrome);
  const mug=new THREE.Mesh(new THREE.CylinderGeometry(.10,.09,.19,24),material(0xd4d0c7,.32));mug.position.set(-.46,1.40,-.85);mug.castShadow=true;room.add(mug);
  const coffee=new THREE.Mesh(new THREE.CircleGeometry(.087,24),material(0x32231f,.8));coffee.rotation.x=-Math.PI/2;coffee.position.set(-.46,1.50,-.85);room.add(coffee);
  const handle=new THREE.Mesh(new THREE.TorusGeometry(.07,.018,8,20),mug.material);handle.position.set(-.58,1.41,-.85);room.add(handle);

  // Articulated desk lamp; one warm pool of light grounds the desktop.
  box(room,[.28,.035,.25],[1.54,1.335,-.91],darkMetal,.015);
  rod(room,[1.54,1.35,-.91],[1.69,1.89,-.92],.023,chrome);
  rod(room,[1.69,1.89,-.92],[1.36,2.20,-.82],.023,chrome);
  const shade=new THREE.Mesh(new THREE.ConeGeometry(.19,.22,32,1,true),darkMetal);shade.position.set(1.34,2.15,-.82);room.add(shade);
  const bulb=new THREE.Mesh(new THREE.SphereGeometry(.052,16,12),new THREE.MeshBasicMaterial({color:0xffd8a2}));bulb.position.set(1.34,2.07,-.82);room.add(bulb);
  const lamp=new THREE.PointLight(0xffbe89,3.4,3.5,2);lamp.position.copy(bulb.position);room.add(lamp);

  // Ergonomic chair, five legs and casters. The developer faces the monitor (-Z).
  const upholstery=material(0x454b5b,.88), trousers=material(0x333b4c,.9), hoodie=material(0x64798b,.88), skin=material(0xc89e85,.7), hair=material(0x292626,.95);
  box(room,[.72,.14,.68],[.42,.88,.66],upholstery,.065);
  const back=box(room,[.69,.84,.13],[.42,1.35,1.02],upholstery,.06);back.rotation.x=-.10;
  box(room,[.48,.19,.11],[.42,1.93,1.03],upholstery,.04);
  rod(room,[.42,.2,.66],[.42,.83,.66],.055,chrome);
  for(let i=0;i<5;i++) {const a=i*TAU/5,x=.42+Math.cos(a)*.43,z=.66+Math.sin(a)*.43;rod(room,[.42,.17,.66],[x,.13,z],.03,chrome);ellipsoid(room,[.065,.065,.042],[x,.075,z],darkMetal);}
  for(const side of [-1,1]) {rod(room,[.42+side*.35,.84,.68],[.42+side*.35,1.17,.65],.026,chrome);box(room,[.09,.055,.37],[.42+side*.35,1.20,.52],upholstery,.02);}
  const body=new THREE.Group();room.add(body);
  ellipsoid(body,[.28,.38,.22],[.42,1.43,.60],hoodie);
  ellipsoid(body,[.19,.13,.13],[.42,1.74,.75],hoodie);
  rod(body,[.42,1.68,.56],[.42,1.87,.54],.105,skin);
  ellipsoid(body,[.225,.28,.225],[.42,2.04,.51],skin);
  const hairMesh=new THREE.Mesh(new THREE.SphereGeometry(.236,28,20,0,TAU,0,1.82),hair);hairMesh.scale.y=1.13;hairMesh.position.set(.42,2.10,.53);hairMesh.castShadow=true;body.add(hairMesh);
  ellipsoid(body,[.062,.075,.07],[.42,2.015,.295],skin);
  for(const x of [.19,.65]) ellipsoid(body,[.044,.067,.045],[x,2.04,.52],skin);
  const hands=[];
  for(const side of [-1,1]) {
    const sx=.42+side*.23,ex=.42+side*.34,hx=.35+side*.18;
    rod(body,[sx,1.65,.56],[ex,1.36,.34],.105,hoodie);
    ellipsoid(body,[.105,.10,.10],[ex,1.36,.34],hoodie);
    rod(body,[ex,1.36,.34],[hx,1.41,-.17],.067,skin);
    const hand=ellipsoid(body,[.075,.037,.095],[hx,1.408,-.21],skin);hands.push(hand);
    rod(body,[.42+side*.13,.96,.56],[.42+side*.17,.85,-.06],.115,trousers);
    rod(body,[.42+side*.17,.85,-.06],[.42+side*.17,.23,-.15],.088,trousers);
    ellipsoid(body,[.11,.09,.21],[.42+side*.17,.15,-.24],darkMetal);
  }
  // Quiet personal artwork on the wall, away from the readable terminal.
  box(room,[1.02,.83,.06],[1.75,2.92,-2.05],chrome,.025);
  box(room,[.90,.71,.02],[1.75,2.92,-2.0],material(0x222b3b,.9),.01);
  const artMat=material(0xc9a98b,.55,.35);
  for(let i=0;i<4;i++) box(room,[.09,.17+i*.10,.02],[1.46+i*.19,2.87,-1.976],artMat,.008);
  return {room,screen,hands,body,sky,lamp};
}

export function initWorkspaceScene(canvas) {
  const renderer=new THREE.WebGLRenderer({canvas,alpha:true,antialias:true,powerPreference:'low-power'});
  renderer.outputColorSpace=THREE.SRGBColorSpace; renderer.toneMapping=THREE.ACESFilmicToneMapping; renderer.toneMappingExposure=1.25;
  renderer.shadowMap.enabled=true; renderer.shadowMap.type=THREE.PCFSoftShadowMap;
  const scene=new THREE.Scene(), camera=new THREE.OrthographicCamera(-8,8,5,-5,.1,80);
  const env=studioEnvironment(renderer);scene.environment=env.texture;
  scene.add(new THREE.HemisphereLight(0xbdcbe1,0x655344,2.0));
  const key=new THREE.DirectionalLight(0xffe7cc,3);key.position.set(2,7,5);key.castShadow=true;
  key.shadow.mapSize.set(1024,1024);Object.assign(key.shadow.camera,{left:-5,right:5,top:5,bottom:-5,near:1,far:18});key.shadow.normalBias=.035;key.shadow.bias=-.0002;scene.add(key);
  const blue=new THREE.DirectionalLight(0x929eff,1.7);blue.position.set(-5,3,-2);scene.add(blue);
  const workspace=buildWorkspace(scene);
  const motion=matchMedia('(prefers-reduced-motion: reduce)');
  const pointer=new THREE.Vector2(), eased=new THREE.Vector2();
  let intro=0, chapter=0, width=1,height=1,dirty=true,last=0,lost=false;
  // Camera poses move through the same room, rather than replacing scenes at seams.
  const poses=[
    [6,4.7,8], [5,4.9,8.5], [3.7,4.2,9], [2.3,3.6,9],
    [1.4,3.2,8.5], [3,4.4,9], [4.3,4.0,8], [5.7,4.8,8], [2.2,3.25,6.5], [6,4.7,8],
  ];
  function resize() {
    width=innerWidth;height=innerHeight;
    renderer.setPixelRatio(Math.min(devicePixelRatio||1,width<800?1.3:1.6));renderer.setSize(width,height,false);dirty=true;
  }
  addEventListener('resize',resize);resize();
  const onMove=event=>{if(event.pointerType!=='touch'&&!motion.matches)pointer.set(event.clientX/width*2-1,event.clientY/height*2-1);};
  document.addEventListener('pointermove',onMove,{passive:true});
  const onMotion=()=>{dirty=true;pointer.set(0,0);};motion.addEventListener('change',onMotion);
  canvas.addEventListener('webglcontextlost',event=>{event.preventDefault();lost=true;canvas.style.opacity=0;});
  canvas.addEventListener('webglcontextrestored',()=>{lost=false;dirty=true;canvas.style.opacity=1;});
  function render(time=0) {
    if(document.hidden||lost||(motion.matches&&!dirty))return;
    if(width<800&&time-last<1/30&&!dirty)return;last=time;
    const t=motion.matches?0:time;eased.lerp(pointer,.045);
    const i=Math.min(poses.length-2,Math.floor(chapter)), f=THREE.MathUtils.smoothstep(chapter-i,0,1);
    const a=poses[i],b=poses[i+1],aspect=width/height,narrow=width<800;
    const h=narrow?Math.max(14,7.2/(aspect*.9)):Math.max(7.5,7.8/(aspect*.49));
    camera.left=-h*aspect/2;camera.right=h*aspect/2;camera.top=h/2;camera.bottom=-h/2;
    camera.setViewOffset(width,height,-width*(narrow?0:.23)*intro,-height*(narrow?.26:0)*intro,width,height);
    camera.position.set(THREE.MathUtils.lerp(a[0],b[0],f)+eased.x*.25,THREE.MathUtils.lerp(a[1],b[1],f)+eased.y*.12,THREE.MathUtils.lerp(a[2],b[2],f));
    camera.lookAt(0,1.5,0);camera.updateProjectionMatrix();
    workspace.screen.update(t,motion.matches);
    workspace.hands.forEach((hand,index)=>hand.position.y=1.408+(motion.matches?0:Math.sin(t*8+index*2)*.008));
    workspace.body.rotation.x=motion.matches?0:Math.sin(t*.7)*.003;
    workspace.sky.uniforms.uPhase.value=(Math.sin(chapter*.55)+1)*.5;
    blue.color.setHSL(.64-chapter*.006,.42,.7);
    renderer.render(scene,camera);dirty=false;
  }
  render();
  return {
    render,
    setIntroProgress(p){intro=p;dirty=true;},
    setChapter(p){chapter=motion.matches?0:Math.max(0,Math.min(poses.length-1,p));dirty=true;},
    dispose(){document.removeEventListener('pointermove',onMove);removeEventListener('resize',resize);motion.removeEventListener('change',onMotion);scene.traverse(o=>{o.geometry?.dispose();if(o.material&&!Array.isArray(o.material))o.material.dispose();});env.dispose();renderer.dispose();},
  };
}

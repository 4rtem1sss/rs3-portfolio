// Opening scene. World units are metres; the student faces -Z from a bedroom study desk.
// Scroll is the only timeline: stopping or reversing scroll stops or reverses the story.
import * as T from 'three';
import { sampleOpeningCamera } from './opening-motion.mjs';
import { openingState } from './opening-sequence.mjs';
import { bedroomLayout } from './bedroom-layout.mjs';

const section = document.querySelector('#pitwall');
const frame = section.querySelector('.pw-frame');
const reduce = matchMedia('(prefers-reduced-motion: reduce)');
const clamp = T.MathUtils.clamp;
const beat = (p, a, b) => T.MathUtils.smoothstep(p, a, b);

function start() {
  const renderer = new T.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'low-power' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
  renderer.outputColorSpace = T.SRGBColorSpace;
  renderer.toneMapping = T.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.25;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = T.PCFSoftShadowMap;
  renderer.domElement.className = 'pw-canvas';
  renderer.domElement.setAttribute('aria-hidden', 'true');
  const scene = new T.Scene();
  scene.background = new T.Color('#08101c');
  scene.fog = new T.Fog('#08101c', 8, 24);
  const camera = new T.PerspectiveCamera(56, 1, .025, 130);
  const standard = (color, roughness = .65, metalness = 0) => new T.MeshStandardMaterial({ color, roughness, metalness });
  const carbon = standard('#17212b', .5, .2);
  const metal = standard('#65717b', .34, .6);
  const rubber = standard('#0a1017', .85);
  const deskMat = standard('#6a4329', .76, .02);
  const woodDark = standard('#3c281e', .82);
  const wallMat = standard('#26313b', .94);
  const bedding = standard('#243c55', .92);
  const fabric = standard('#384757', 1);
  const white = standard('#cbdce2');
  const yellow = standard('#ffd24a');
  const red = standard('#de2943');
  const box = (parent, w, h, d, x, y, z, mat) => {
    const mesh = new T.Mesh(new T.BoxGeometry(w, h, d), mat);
    mesh.position.set(x, y, z); mesh.castShadow = true; mesh.receiveShadow = true;
    parent.add(mesh); return mesh;
  };
  const cylinder = (parent, r, height, x, y, z, mat, segments = 24) => {
    const mesh = new T.Mesh(new T.CylinderGeometry(r, r, height, segments), mat);
    mesh.position.set(x, y, z); mesh.castShadow = true; parent.add(mesh); return mesh;
  };
  const texture = (paint, w = 1024, h = 640) => {
    const canvas = document.createElement('canvas'); canvas.width = w; canvas.height = h;
    const ctx = canvas.getContext('2d'); paint(ctx, w, h);
    const map = new T.CanvasTexture(canvas); map.colorSpace = T.SRGBColorSpace;
    map.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
    return { map, ctx, w, h };
  };
  const flat = map => new T.MeshBasicMaterial({ map, toneMapped: false });
  const panel = (parent, w, h, x, y, z, map) => {
    const mesh = new T.Mesh(new T.PlaneGeometry(w, h), flat(map));
    mesh.position.set(x, y, z); parent.add(mesh); return mesh;
  };

  scene.add(new T.HemisphereLight('#668db7', '#16100d', .72));
  const moon = new T.DirectionalLight('#8bbcff', 1.25);
  moon.position.set(-4, 7, -2); moon.castShadow = true;
  moon.shadow.mapSize.set(1024, 1024);
  Object.assign(moon.shadow.camera, { left: -6, right: 6, top: 5, bottom: -5, near: .5, far: 28 });
  moon.shadow.bias = -.0003; scene.add(moon);
  const lampGlow = new T.PointLight('#ffb85c', 8.2, 5.3, 2);
  lampGlow.position.set(-1.67, 1.32, -.02); lampGlow.castShadow = true; scene.add(lampGlow);
  const screenGlow = new T.PointLight('#65c5ff', 1.9, 4, 2);
  screenGlow.position.set(0, 1.25, -.3); scene.add(screenGlow);

  // A compact bedroom at night: the place where questions become experiments.
  box(scene, 9, .12, 7, 0, -.62, -1.15, standard('#33261e', .92));
  box(scene, 9, 4.2, .12, 0, 1.38, -4.18, wallMat);
  box(scene, .12, 4.2, 7, -4.44, 1.38, -1.15, standard('#202b35', .95));

  // Moonlit window, with city lights and curtains framing it.
  const night = texture((ctx, w, h) => {
    const sky = ctx.createLinearGradient(0, 0, 0, h);
    sky.addColorStop(0, '#06101e'); sky.addColorStop(1, '#173c60');
    ctx.fillStyle = sky; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#c7def3'; ctx.beginPath(); ctx.arc(w * .76, h * .22, 34, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#0a1826';
    for (let i = 0; i < 18; i++) {
      const x = i * 63 - 20, bh = 55 + (i * 37) % 160;
      ctx.fillRect(x, h - bh, 50, bh);
      ctx.fillStyle = i % 3 ? '#f0c46b' : '#87c9ee';
      for (let y = h - bh + 20; y < h - 12; y += 28) if ((i + y) % 4) ctx.fillRect(x + 12, y, 5, 8);
      ctx.fillStyle = '#0a1826';
    }
  }, 960, 560);
  panel(scene, 2.38, 1.38, -1.75, 2.05, -4.105, night.map);
  box(scene, 2.58, .08, .08, -1.75, 2.78, -4.04, woodDark);
  box(scene, 2.58, .08, .08, -1.75, 1.32, -4.04, woodDark);
  box(scene, .08, 1.54, .08, -3.04, 2.05, -4.04, woodDark);
  box(scene, .08, 1.54, .08, -.46, 2.05, -4.04, woodDark);
  box(scene, .055, 1.38, .08, -1.75, 2.05, -4.03, woodDark);
  for (const x of [-3.38, -.12]) {
    const curtain = box(scene, .58, 1.92, .12, x, 2.05, -3.93, fabric);
    curtain.rotation.z = x < -1 ? -.06 : .06;
  }

  // The edge of the bed makes the workstation unmistakably personal.
  box(scene, 2.35, .28, 2.6, -2.92, -.34, -1.78, woodDark);
  box(scene, 2.25, .24, 2.5, -2.92, -.13, -1.78, standard('#d4d0c6', .98));
  box(scene, 2.28, .09, 1.65, -2.92, .035, -2.12, bedding);
  box(scene, .74, .16, .45, -3.46, .08, -2.94, standard('#b8c0c7', 1));

  // Wall shelves carry books, parts and one small F1 model as a quiet personal clue.
  for (const y of [1.72, 2.55]) box(scene, 2.2, .08, .38, 2.26, y, -3.83, woodDark);
  for (let i = 0; i < 6; i++) box(scene, .14 + (i % 2) * .04, .42 - (i % 3) * .04, .25, 1.45 + i * .22, 1.97, -3.73, standard(['#b94c45', '#3e6f8d', '#d2a34c'][i % 3], .8));
  box(scene, .75, .06, .2, 2.55, 2.63, -3.67, red);
  for (const x of [2.29, 2.79]) cylinder(scene, .09, .055, x, 2.58, -3.58, rubber, 16).rotation.x = Math.PI / 2;
  box(scene, .28, .045, .16, 2.55, 2.7, -3.67, carbon);
  box(scene, .12, .035, .45, 2.55, 2.73, -3.67, yellow);
  const matrix = new T.Matrix4();

  // A wooden desk with physical depth, monitor stands and an angled side screen.
  box(scene, 4.6, .075, 1.85, 0, .74, -.3, deskMat);
  box(scene, 4.6, .025, .035, 0, .775, .63, metal);
  for (const x of [-2.05, 2.05]) box(scene, .065, .75, 1.6, x, .33, -.3, carbon);
  const screens = [];
  function drawScreen(ctx, w, h, type, p) {
    ctx.fillStyle = '#07141f'; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#ffd24a'; ctx.font = 'bold 28px monospace'; ctx.fillText(type, 40, 54);
    ctx.fillStyle = '#91b7ce'; ctx.font = '17px monospace'; ctx.fillText('R. SAWEK / WORKBENCH', 40, 88);
    ctx.strokeStyle = '#234051'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(40, 110); ctx.lineTo(w - 40, 110); ctx.stroke();
    if (type === 'QUESTIONS') {
      const rows = ['01   WHY DOES IT WORK?', '02   HOW DO THE PARTS CONNECT?', '03   WHAT IF I TRY THIS?', '04   WHAT DID I MISS?', '05   TRY AGAIN.'];
      ctx.font = '27px monospace';
      rows.forEach((row, i) => {
        if (i === 4) { ctx.fillStyle = '#233c4b'; ctx.fillRect(28, 132 + i * 72, w - 56, 54); }
        ctx.fillStyle = i === 4 ? '#ffd24a' : '#d6e4ed'; ctx.fillText(row, 40, 172 + i * 72);
      });
    } else if (type === 'SYSTEM VIEW') {
      ctx.fillStyle = '#eefaff'; ctx.font = 'bold 48px monospace'; ctx.fillText('PARTS  →  SYSTEM', 40, 205);
      for (let i = 0; i < 6; i++) { ctx.beginPath(); ctx.moveTo(40, 285 + i * 43); ctx.lineTo(w - 40, 285 + i * 43); ctx.stroke(); }
      for (const [color, offset] of [['#9ad7f2', 0], ['#ffd24a', 85]]) {
        ctx.strokeStyle = color; ctx.lineWidth = 3; ctx.beginPath();
        for (let x = 0; x < w - 80; x += 3) {
          const wave = Math.sin(x / 56 + p * 22) * 38 + Math.sin(x / 21 + p * 9) * 12;
          const y = 330 + offset + wave; x ? ctx.lineTo(40 + x, y) : ctx.moveTo(40, y);
        }
        ctx.stroke();
      }
      ctx.fillStyle = '#a6c4d5'; ctx.font = '21px monospace'; ctx.fillText('OBSERVE  /  CONNECT  /  TEST', 40, 580);
    } else {
      const rows = ['> observe', '> take it apart', '> test an idea', '> learn from the miss', '> rebuild_'];
      ctx.font = '30px monospace';
      rows.forEach((row, i) => { ctx.fillStyle = i === 4 ? '#ffd24a' : '#d6e4ed'; ctx.fillText(row, 55, 185 + i * 82); });
    }
  }
  function monitor(type, x, z, angle, width) {
    const group = new T.Group(); group.position.set(x, 0, z); group.rotation.y = angle; scene.add(group);
    box(group, .34, .025, .24, 0, .79, .03, carbon);
    box(group, .055, .2, .055, 0, .89, -.025, metal);
    box(group, width, width * .625, .055, 0, 1.22, 0, carbon);
    const tex = texture((ctx, w, h) => drawScreen(ctx, w, h, type, 0), 960, 600);
    panel(group, width - .035, width * .625 - .035, 0, 1.22, .03, tex.map);
    screens.push({ ...tex, type });
  }
  bedroomLayout.monitors.forEach(({ type, x, z, angle, width }) => monitor(type, x, z, angle, width));

  // Keyboard and loose cables establish scale from the seated viewpoint.
  box(scene, .75, .023, .25, -.32, .79, -.22, rubber);
  const keys = new T.InstancedMesh(new T.BoxGeometry(.037, .013, .031), standard('#536471'), 65);
  for (let r = 0; r < 5; r++) for (let c = 0; c < 13; c++) {
    matrix.makeTranslation(-.64 + c * .051, .808, -.305 + r * .041); keys.setMatrixAt(r * 13 + c, matrix);
  }
  scene.add(keys);
  function cable(points, radius = .008, material = rubber) {
    const curve = new T.CatmullRomCurve3(points.map(p => new T.Vector3(...p)));
    const mesh = new T.Mesh(new T.TubeGeometry(curve, 28, radius, 8, false), material); scene.add(mesh); return mesh;
  }
  cable([[-1.34, .8, .2], [-1.62, .8, .38], [-1.78, .8, -.18], [-.94, .8, -.72]]);
  cable([[1.18, .8, -.23], [1.42, .8, -.03], [1.25, .8, .35], [.93, .8, .43]], .006, metal);
  // Headset lying flat beside the keyboard.
  const band = new T.Mesh(new T.TorusGeometry(.19, .021, 8, 36, Math.PI), carbon);
  band.rotation.x = -Math.PI / 2; band.position.set(-1.35, .825, .28); scene.add(band);
  for (const x of [-1.54, -1.16]) box(scene, .09, .07, .13, x, .82, .28, rubber);
  cable([[-1.16, .83, .28], [-1.08, .8, .38], [-.96, .79, .38]], .009, metal);
  // Ceramic cup with visible coffee surface and a real handle.
  cylinder(scene, .076, .15, 1.65, .86, -.13, white);
  cylinder(scene, .066, .003, 1.65, .937, -.13, standard('#291b17'));
  const handle = new T.Mesh(new T.TorusGeometry(.046, .012, 8, 24), white);
  handle.position.set(1.735, .87, -.13); scene.add(handle);

  // A warm desk lamp pools light over an unfinished teardown.
  cylinder(scene, .14, .035, -1.83, .805, -.1, metal);
  const lampStem = cylinder(scene, .018, .74, -1.83, 1.12, -.1, metal, 14);
  lampStem.rotation.z = -.18;
  const lampShade = new T.Mesh(new T.ConeGeometry(.19, .28, 28, 1, true), standard('#c68a42', .5, .15));
  lampShade.position.set(-1.7, 1.43, -.1); lampShade.rotation.z = -.52; scene.add(lampShade);
  cylinder(scene, .07, .025, -1.63, 1.36, -.1, new T.MeshBasicMaterial({ color: '#ffd28c' }));

  // Slightly messy, but purposeful: a device mid-repair, tools, notes and stacked books.
  box(scene, .48, .025, .34, -1.38, .795, .2, carbon);
  box(scene, .37, .018, .25, -1.38, .819, .2, standard('#295a46', .66, .05));
  for (let i = 0; i < 7; i++) {
    const x = -1.53 + (i % 4) * .1, z = .12 + Math.floor(i / 4) * .12;
    box(scene, .045, .025 + (i % 2) * .025, .04, x, .845, z, i % 3 ? metal : yellow);
  }
  const deviceCover = box(scene, .48, .025, .34, -1.7, .81, .42, standard('#24313b'));
  deviceCover.rotation.y = -.24;
  const driverShaft = cylinder(scene, .009, .38, -1.02, .825, .43, metal, 12);
  driverShaft.rotation.z = Math.PI / 2; driverShaft.rotation.y = -.18;
  const driverHandle = cylinder(scene, .028, .18, -.83, .825, .39, red, 16);
  driverHandle.rotation.z = Math.PI / 2; driverHandle.rotation.y = -.18;
  for (let i = 0; i < 3; i++) {
    const book = box(scene, .56 - i * .05, .055, .32, 1.55 + i * .03, .805 + i * .06, -.38, standard(['#b64c45', '#315f7a', '#c69a4b'][i], .86));
    book.rotation.y = (i - 1) * .055;
  }
  for (const [x, z, color, angle] of [[.05, .43, '#e8c85a', -.08], [.27, .48, '#d98b6e', .12], [.38, .35, '#7bb8ae', -.16]]) {
    const note = box(scene, .18, .005, .14, x, .79, z, standard(color, .94)); note.rotation.y = angle;
  }

  // Notebook cover pivots about a physical spine. Canvas labels remain sharp on approach.
  const notebook = new T.Group(); notebook.position.set(.77, .795, .24); notebook.rotation.y = -.12; scene.add(notebook);
  box(notebook, .59, .034, .43, 0, 0, 0, white);
  const paperTex = texture((ctx, w, h) => {
    ctx.fillStyle = '#0f2b47'; ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = '#28455e'; ctx.lineWidth = 1;
    for (let x = 0; x < w; x += 32) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke(); }
    for (let y = 0; y < h; y += 32) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }
    ctx.fillStyle = '#ffd24a'; ctx.font = '24px monospace'; ctx.fillText('P.01 / R. SAWEK', 68, 90);
    ctx.fillStyle = '#ffffff'; ctx.font = 'bold 62px sans-serif'; ctx.fillText('A little', 68, 240); ctx.fillText('curiosity.', 68, 315);
    ctx.fillStyle = '#a7bdcd'; ctx.font = '24px monospace'; ctx.fillText('IDEAS • SYSTEMS • EXPERIMENTS', 68, 510);
  });
  const paper = panel(notebook, .58, .42, 0, .019, 0, paperTex.map); paper.rotation.x = -Math.PI / 2;
  const hinge = new T.Group(); hinge.position.set(-.3, .025, 0); notebook.add(hinge);
  box(hinge, .61, .014, .45, .305, 0, 0, carbon);
  const coverTex = texture((ctx, w, h) => {
    ctx.fillStyle = '#17242e'; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#e32a43'; ctx.fillRect(w - 85, 0, 17, h);
    ctx.fillStyle = '#edf3f6'; ctx.font = 'bold 47px monospace'; ctx.fillText('ENGINEERING', 65, 280); ctx.fillText('NOTEBOOK', 65, 340);
    ctx.fillStyle = '#e32a43'; ctx.font = 'italic bold 80px sans-serif'; ctx.fillText('#RS3', 620, 115);
    ctx.fillStyle = '#a7bdcd'; ctx.font = '25px monospace'; ctx.fillText('VOL. 01 / R. SAWEK', 65, 530);
  });
  const cover = panel(hinge, .6, .44, .305, .008, 0, coverTex.map); cover.rotation.x = -Math.PI / 2;
  const pen = cylinder(scene, .007, .32, 1.19, .79, .26, yellow, 12); pen.rotation.x = Math.PI / 2; pen.rotation.z = -.12;

  const target = new T.Vector3();
  let width = 0, height = 0, lastP = -1, failed = false, shared = null;
  function renderAt(p) {
    if (failed || document.hidden || !document.documentElement.classList.contains('film') || reduce.matches) return;
    const rect = section.getBoundingClientRect();
    if (rect.bottom <= 0 || rect.top >= innerHeight) return;
    const w = frame.clientWidth, h = frame.clientHeight;
    if (!w || !h) return;
    if (w !== width || h !== height) {
      width = w; height = h; renderer.setSize(w, h); camera.aspect = w / h;
      camera.fov = 56 + 16 * (1 - beat(camera.aspect, .7, 1.25)); camera.updateProjectionMatrix();
    }
    sampleOpeningCamera(p, camera.position, target);
    // Portrait framing keeps the workbench readable before the notebook close-up.
    {
      const glance = (1 - beat(camera.aspect, .7, 1.25)) * (1 - beat(p, .32, .77));
      camera.position.x += 1.3 * glance;
      camera.position.y += .12 * glance;
      camera.position.z += .82 * glance;
      target.x += 2 * glance;
      target.y -= .3 * glance;
    }
    camera.lookAt(target);
    const state = openingState(p);
    hinge.rotation.z = Math.PI * .93 * state.notebookOpen;
    if (Math.abs(p - lastP) > .003 || lastP < 0) {
      screens.forEach(screen => {
        drawScreen(screen.ctx, screen.w, screen.h, screen.type, p);
        screen.map.needsUpdate = true;
      });
      lastP = p;
    }
    frame.style.opacity = String(1 - state.pageFade);
    renderer.render(scene, camera);
    if (!section.classList.contains('has-3d')) section.classList.add('has-3d');
  }
  frame.prepend(renderer.domElement);
  // Hide the 2D fallback only after WebGL rendered successfully.
  const initial = section.getBoundingClientRect();
  renderAt(clamp(-initial.top / Math.max(1, initial.height - innerHeight), 0, 1));
  renderer.domElement.addEventListener('webglcontextlost', event => {
    event.preventDefault(); failed = true; section.classList.remove('has-3d'); renderer.domElement.hidden = true;
    dispatchEvent(new Event('portfolio:opening-sync'));
  });
  // The page's scroll loop drives each frame (same value as the captions); paint in that same frame.
  addEventListener('portfolio:opening-frame', event => {
    shared = event.detail.progress;
    if (event.detail.reducedMotion) section.classList.remove('has-3d');
    if (event.detail.active !== false) renderAt(shared);
  });
  new ResizeObserver(() => dispatchEvent(new Event('portfolio:opening-sync'))).observe(frame);
  dispatchEvent(new Event('portfolio:opening-sync'));
}

try { start(); } catch (error) {
  // Preserve the existing opening if WebGL is unavailable.
  frame.querySelector('.pw-canvas')?.remove();
  section.classList.remove('has-3d');
  console.warn('3D opening unavailable; using the illustrated opening.', error);
}

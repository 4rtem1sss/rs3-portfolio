// Opening scene: a real-scale bedroom study desk at night (metres; floor y = 0, back wall z = -0.46).
// Scroll is the only timeline: stopping or reversing scroll stops or reverses the story.
import * as T from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { sampleOpeningCamera } from './opening-motion.mjs';
import { openingState } from './opening-sequence.mjs';
import { bedroomLayout } from './bedroom-layout.mjs';

const section = document.querySelector('#pitwall');
const frame = section.querySelector('.pw-frame');
const reduce = matchMedia('(prefers-reduced-motion: reduce)');
const clamp = T.MathUtils.clamp;
const beat = (p, a, b) => T.MathUtils.smoothstep(p, a, b);
const MONO = '"Cascadia Code", Consolas, "SFMono-Regular", Menlo, monospace';
const SANS = 'Bahnschrift, "Segoe UI", "Helvetica Neue", Arial, sans-serif';
const HAND = '"Segoe Print", "Bradley Hand", "Comic Sans MS", cursive';

function start() {
  const renderer = new T.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
  renderer.outputColorSpace = T.SRGBColorSpace;
  renderer.toneMapping = T.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = T.PCFSoftShadowMap;
  renderer.domElement.className = 'pw-canvas';
  renderer.domElement.setAttribute('aria-hidden', 'true');

  const scene = new T.Scene();
  scene.background = new T.Color('#050a12');
  scene.fog = new T.Fog('#050a12', 3.2, 8);
  const pmrem = new T.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), .04).texture;
  scene.environmentIntensity = .1;
  const camera = new T.PerspectiveCamera(50, 1, .01, 40);

  // ---------- helpers ----------
  let seed = 11;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const mat = (color, roughness = .7, metalness = 0, extra = {}) => new T.MeshStandardMaterial({ color, roughness, metalness, ...extra });
  const shade = mesh => { mesh.castShadow = true; mesh.receiveShadow = true; return mesh; };
  const place = (parent, geometry, material, x, y, z) => {
    const mesh = shade(new T.Mesh(geometry, material)); mesh.position.set(x, y, z); parent.add(mesh); return mesh;
  };
  const rbox = (parent, w, h, d, x, y, z, material, r = .004) =>
    place(parent, new RoundedBoxGeometry(w, h, d, 3, Math.min(r, w / 2.01, h / 2.01, d / 2.01)), material, x, y, z);
  const cyl = (parent, r, h, x, y, z, material, seg = 24, r2 = r) =>
    place(parent, new T.CylinderGeometry(r, r2, h, seg), material, x, y, z);
  const rod = (parent, a, b, r, material) => {
    const A = new T.Vector3(...a), B = new T.Vector3(...b);
    const mesh = place(parent, new T.CylinderGeometry(r, r, A.distanceTo(B), 12), material, 0, 0, 0);
    mesh.position.copy(A).add(B).multiplyScalar(.5);
    mesh.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), B.sub(A).normalize());
    return mesh;
  };
  const cable = (points, r, material, closed = false) => {
    const curve = new T.CatmullRomCurve3(points.map(p => new T.Vector3(...p)), closed);
    return place(scene, new T.TubeGeometry(curve, Math.max(24, points.length * 10), r, 8, closed), material, 0, 0, 0);
  };
  const canvasTexture = (w, h, paint, srgb = true) => {
    const canvas = document.createElement('canvas'); canvas.width = w; canvas.height = h;
    const ctx = canvas.getContext('2d'); paint(ctx, w, h);
    const map = new T.CanvasTexture(canvas);
    if (srgb) map.colorSpace = T.SRGBColorSpace;
    map.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
    return { map, ctx, w, h };
  };
  const flat = (map, tint = '#ffffff') => new T.MeshBasicMaterial({ map, color: tint, toneMapped: false });
  const plane = (parent, w, h, material, x, y, z) => {
    const mesh = new T.Mesh(new T.PlaneGeometry(w, h), material); mesh.position.set(x, y, z); parent.add(mesh); return mesh;
  };
  const glowMap = canvasTexture(128, 128, (ctx, w) => {
    const g = ctx.createRadialGradient(w / 2, w / 2, 0, w / 2, w / 2, w / 2);
    g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(.25, 'rgba(255,255,255,.45)'); g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, w);
  }).map;
  const glow = (color, size, x, y, z, opacity = 1) => {
    const sprite = new T.Sprite(new T.SpriteMaterial({ map: glowMap, color, blending: T.AdditiveBlending, depthWrite: false, transparent: true, opacity, toneMapped: false }));
    sprite.scale.setScalar(size); sprite.position.set(x, y, z); scene.add(sprite); return sprite;
  };

  // ---------- materials ----------
  const woodMap = canvasTexture(1024, 512, (ctx, w, h) => {
    ctx.fillStyle = '#6b4a31'; ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 260; i++) {
      const y = rnd() * h, a = .04 + rnd() * .09;
      ctx.strokeStyle = rnd() > .5 ? `rgba(40,22,10,${a})` : `rgba(160,112,70,${a * .7})`;
      ctx.lineWidth = .6 + rnd() * 2.2; ctx.beginPath();
      for (let x = 0; x <= w; x += 32) ctx.lineTo(x, y + Math.sin(x / 140 + i) * 5 + Math.sin(x / 37 + i * 2) * 1.2);
      ctx.stroke();
    }
  }).map;
  woodMap.wrapS = woodMap.wrapT = T.RepeatWrapping;
  const floorMap = canvasTexture(1024, 1024, (ctx, w, h) => {
    for (let r = 0; r < 8; r++) for (let c = 0; c < 3; c++) {
      const l = 17 + rnd() * 6;
      ctx.fillStyle = `hsl(24 30% ${l}%)`; ctx.fillRect(c * w / 3 + (r % 2) * 60, r * h / 8, w / 3, h / 8);
      ctx.strokeStyle = '#0d0805'; ctx.lineWidth = 3; ctx.strokeRect(c * w / 3 + (r % 2) * 60, r * h / 8, w / 3, h / 8);
    }
  }).map;
  floorMap.wrapS = floorMap.wrapT = T.RepeatWrapping; floorMap.repeat.set(3, 3);

  const M = {
    desk: mat('#ffffff', .62, 0, { map: woodMap }),
    darkWood: mat('#3a281c', .8),
    wall: mat('#1c2835', .96),
    wallSide: mat('#17212c', .96),
    floor: mat('#ffffff', .85, 0, { map: floorMap }),
    black: mat('#15191f', .55, .1),
    plastic: mat('#23292f', .5),
    white: mat('#e7ebee', .38),
    metal: mat('#9aa5ae', .3, .85),
    steel: mat('#c7ced4', .22, .95),
    gold: mat('#d9aa3c', .28, .9),
    rubber: mat('#0d1014', .9),
    pcb: mat('#1f5b40', .45, .1),
    chip: mat('#111417', .4, .2),
    fabric: mat('#243446', 1),
    sheet: mat('#c3c8ce', .95),
    blanket: mat('#28496a', .95),
    yellow: mat('#ffd24a', .5),
    red: mat('#d9303f', .45),
    cableBlack: mat('#0f1216', .6),
  };

  // ---------- lighting ----------
  scene.add(new T.HemisphereLight('#4b6f9e', '#140d08', .42));
  const moon = new T.DirectionalLight('#8fb2f0', 1.1);
  moon.position.set(-3, 4.1, -1.9); moon.target.position.set(-.4, .75, 0);
  moon.castShadow = true; moon.shadow.mapSize.set(2048, 2048);
  Object.assign(moon.shadow.camera, { left: -2.2, right: 2.2, top: 2.2, bottom: -2.2, near: .5, far: 9 });
  moon.shadow.bias = -.0004; moon.shadow.normalBias = .02;
  scene.add(moon, moon.target);

  // ---------- room ----------
  const floor = new T.Mesh(new T.PlaneGeometry(7, 5), M.floor);
  floor.rotation.x = -Math.PI / 2; floor.position.set(.2, 0, 1); floor.receiveShadow = true; scene.add(floor);
  // Back wall is built around the window opening, so moonlight only enters through the glass.
  const { window: win } = bedroomLayout.anchors;
  const hole = { x0: win.x - .55, x1: win.x + .55, y0: win.y - .46, y1: win.y + .46 };
  for (const [x0, x1, y0, y1] of [[-3.3, hole.x0, 0, 2.8], [hole.x1, 3.7, 0, 2.8], [hole.x0, hole.x1, 0, hole.y0], [hole.x0, hole.x1, hole.y1, 2.8]]) {
    const wall = shade(new T.Mesh(new T.PlaneGeometry(x1 - x0, y1 - y0), M.wall));
    wall.position.set((x0 + x1) / 2, (y0 + y1) / 2, -.46); scene.add(wall);
  }
  const left = new T.Mesh(new T.PlaneGeometry(5, 2.8), M.wallSide);
  left.rotation.y = Math.PI / 2; left.position.set(-2.15, 1.4, 1.5); left.receiveShadow = true; scene.add(left);
  rbox(scene, 7, .08, .015, .2, .04, -.45, M.darkWood, .003);

  // Window: the city outside at night, curtains half drawn.
  const nightTex = canvasTexture(1024, 800, (ctx, w, h) => {
    const sky = ctx.createLinearGradient(0, 0, 0, h);
    sky.addColorStop(0, '#040b18'); sky.addColorStop(.6, '#0d2240'); sky.addColorStop(1, '#274a6e');
    ctx.fillStyle = sky; ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 90; i++) { ctx.fillStyle = `rgba(220,235,255,${.2 + rnd() * .6})`; ctx.fillRect(rnd() * w, rnd() * h * .5, 1.6, 1.6); }
    const moonGlow = ctx.createRadialGradient(w * .74, h * .2, 0, w * .74, h * .2, 110);
    moonGlow.addColorStop(0, 'rgba(220,235,255,.5)'); moonGlow.addColorStop(1, 'rgba(220,235,255,0)');
    ctx.fillStyle = moonGlow; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#e4eefb'; ctx.beginPath(); ctx.arc(w * .74, h * .2, 26, 0, Math.PI * 2); ctx.fill();
    for (const [layer, base, lit] of [[0, '#10233a', .25], [1, '#081523', .5]]) {
      let x = -20;
      while (x < w) {
        const bw = 40 + rnd() * 90, bh = (layer ? 90 : 170) + rnd() * (layer ? 180 : 160);
        ctx.fillStyle = base; ctx.fillRect(x, h - bh, bw, bh);
        for (let wy = h - bh + 14; wy < h - 10; wy += 18) for (let wx = x + 8; wx < x + bw - 10; wx += 14) {
          if (rnd() < lit * .22) { ctx.fillStyle = rnd() > .3 ? 'rgba(255,196,110,.7)' : 'rgba(150,210,255,.6)'; ctx.fillRect(wx, wy, 5, 7); }
        }
        x += bw + (layer ? 4 : 10);
      }
    }
  });
  plane(scene, 1.1, .92, flat(nightTex.map, '#c9d6e6'), win.x, win.y, -.5);
  const frameMat = mat('#8e979e', .55);
  for (const [w, h, x, y] of [[1.2, .06, 0, .49], [1.2, .06, 0, -.49], [.06, 1.04, -.57, 0], [.06, 1.04, .57, 0], [.035, .92, 0, 0]]) {
    rbox(scene, w, h, .05, win.x + x, win.y + y, -.43, frameMat, .008);
  }
  rbox(scene, 1.22, .025, .09, win.x, win.y - .52, -.415, frameMat, .006);
  const curtainGeo = new T.PlaneGeometry(.42, 1.35, 48, 1);
  const pos = curtainGeo.attributes.position;
  for (let i = 0; i < pos.count; i++) pos.setZ(i, Math.sin(pos.getX(i) * 46) * .018 + Math.sin(pos.getX(i) * 13) * .01);
  curtainGeo.computeVertexNormals();
  for (const x of [win.x - .7, win.x + .7]) {
    const curtain = shade(new T.Mesh(curtainGeo, new T.MeshStandardMaterial({ color: '#2f4257', roughness: 1, side: T.DoubleSide })));
    curtain.position.set(x, win.y + .02, -.38); scene.add(curtain);
  }
  rod(scene, [win.x - .95, win.y + .7, -.37], [win.x + .95, win.y + .7, -.37], .01, M.metal);
  glow('#8fb8ff', 1.8, win.x, win.y, -.3, .12);

  // Wall shelf: books, a medal, and a small F1 model as a quiet personal clue.
  const shelf = bedroomLayout.anchors.shelf;
  rbox(scene, .82, .022, .19, shelf.x, shelf.y, -.36, M.darkWood, .004);
  for (const dx of [-.3, .3]) rbox(scene, .02, .09, .12, shelf.x + dx, shelf.y - .05, -.4, M.black, .003);
  let bx = shelf.x - .38;
  for (let i = 0; i < 9; i++) {
    const w = .018 + rnd() * .02, h = .16 + rnd() * .08;
    const book = rbox(scene, w, h, .14, bx + w / 2, shelf.y + .011 + h / 2, -.37, mat(['#8c3b37', '#2f5873', '#b98f45', '#39464f', '#6f7d5a', '#c9c1ae'][i % 6], .85), .002);
    if (i === 8) { book.rotation.z = -.28; book.position.x += .03; book.position.y -= .01; }
    bx += w + .002;
  }
  const f1 = new T.Group(); f1.position.set(shelf.x + .2, shelf.y + .022, -.34); f1.rotation.y = -.5; f1.scale.setScalar(.9); scene.add(f1);
  rbox(f1, .16, .014, .036, 0, 0, 0, mat('#16233a', .35, .3), .006);
  rbox(f1, .05, .01, .02, .09, -.001, 0, M.red, .004);
  rbox(f1, .014, .004, .07, .115, -.005, 0, M.red, .002);
  rbox(f1, .014, .018, .058, -.085, .012, 0, mat('#16233a', .35, .3), .003);
  rbox(f1, .012, .004, .062, -.085, .022, 0, M.yellow, .002);
  for (const [x, z] of [[.075, .03], [.075, -.03], [-.06, .032], [-.06, -.032]]) {
    const wheel = cyl(f1, .012, .012, x, .004, z, M.rubber, 18); wheel.rotation.x = Math.PI / 2;
  }
  rod(scene, [shelf.x - .12, shelf.y - .011, -.27], [shelf.x - .1, shelf.y - .1, -.27], .004, M.red);
  rod(scene, [shelf.x - .08, shelf.y - .011, -.27], [shelf.x - .1, shelf.y - .1, -.27], .004, mat('#2d5e8c', .8));
  const medal = cyl(scene, .024, .005, shelf.x - .1, shelf.y - .125, -.268, M.gold, 28); medal.rotation.x = Math.PI / 2;

  // Poster over the bed: a circuit study, drawn like the site's blueprints.
  const posterTex = canvasTexture(500, 700, (ctx, w, h) => {
    ctx.fillStyle = '#0f2b47'; ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = 'rgba(255,255,255,.08)';
    for (let x = 0; x < w; x += 25) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke(); }
    for (let y = 0; y < h; y += 25) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }
    ctx.strokeStyle = '#ffd24a'; ctx.lineWidth = 9; ctx.lineJoin = 'round'; ctx.beginPath();
    [[120, 520], [120, 300], [180, 220], [300, 240], [340, 160], [400, 200], [380, 420], [300, 470], [250, 560], [140, 580]].forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y));
    ctx.closePath(); ctx.stroke();
    ctx.fillStyle = '#ffffff'; ctx.font = `600 34px ${SANS}`; ctx.fillText('CIRCUIT STUDY', 40, 70);
    ctx.fillStyle = '#e0313b'; ctx.font = `italic 800 40px ${SANS}`; ctx.fillText('#RS3', 350, 660);
  });
  rbox(scene, .44, .6, .015, 1.45, 1.55, -.45, M.black, .004);
  plane(scene, .41, .57, mat('#ffffff', .6, 0, { map: posterTex.map }), 1.45, 1.55, -.44);

  // Bed along the right wall.
  rbox(scene, 1.05, .9, .05, 1.95, .45, -.42, M.darkWood, .01);
  rbox(scene, 1.05, .28, 2, 1.95, .14, .56, M.darkWood, .01);
  rbox(scene, 1, .2, 1.94, 1.95, .38, .56, M.sheet, .05);
  const blanket = rbox(scene, 1.06, .06, 1.35, 1.95, .5, .86, M.blanket, .03); blanket.rotation.z = .015;
  rbox(scene, .5, .11, .3, 1.8, .53, -.2, mat('#d6d9de', .95), .05).rotation.y = .08;

  // Chair pushed back, a silhouette at the left of the frame.
  const chair = new T.Group(); chair.position.set(-1.12, 0, .78); chair.rotation.y = .7; scene.add(chair);
  for (let i = 0; i < 5; i++) {
    const leg = rbox(chair, .3, .025, .04, 0, .06, 0, M.black, .01);
    leg.rotation.y = i * Math.PI * 2 / 5; leg.position.set(Math.cos(i * 1.2566) * .14, .06, -Math.sin(i * 1.2566) * .14);
  }
  cyl(chair, .022, .38, 0, .27, 0, M.metal, 16);
  rbox(chair, .48, .08, .47, 0, .49, 0, M.fabric, .03);
  const chairBack = rbox(chair, .46, .58, .07, 0, .86, -.24, M.fabric, .03); chairBack.rotation.x = -.1;

  // ---------- desk ----------
  const desk = bedroomLayout.desk;
  rbox(scene, desk.width, .03, desk.depth, desk.x, desk.y - .015, desk.z, M.desk, .006);
  for (const [x, z] of [[-.8, -.41], [-.8, .24]]) rbox(scene, .04, desk.y - .03, .04, x, (desk.y - .03) / 2, z, M.black, .006);
  rbox(scene, .42, desk.y - .03, .62, .6, (desk.y - .03) / 2, -.1, M.darkWood, .008);
  for (const y of [.2, .45, .62]) rbox(scene, .12, .014, .015, .6, y, .215, M.metal, .005);
  const deskTop = desk.y;

  // Main monitor + side laptop. Screens repaint with scroll.
  const screens = [];
  function drawScreen(screen, p) {
    const { ctx, w, h, type } = screen;
    ctx.fillStyle = '#061220'; ctx.fillRect(0, 0, w, h);
    if (type === 'SYSTEM VIEW') {
      ctx.fillStyle = '#0b1e32'; ctx.fillRect(0, 0, w, 70);
      ctx.fillStyle = '#ffd24a'; ctx.font = `600 28px ${MONO}`; ctx.fillText('SYSTEM VIEW', 40, 46);
      ctx.fillStyle = '#7f9bb3'; ctx.font = `22px ${MONO}`; ctx.fillText('how separate parts become one', 290, 46);
      const nodes = [['SENSOR', 170, 250], ['DEVICE', 420, 450], ['NETWORK', 650, 250], ['SERVER', 880, 450], ['PEOPLE', 1110, 250]];
      const lit = clamp((p - .3) / .32, 0, 1) * (nodes.length - 1);
      ctx.lineWidth = 5;
      for (let i = 0; i < nodes.length - 1; i++) {
        const [, x1, y1] = nodes[i], [, x2, y2] = nodes[i + 1], f = clamp(lit - i, 0, 1);
        ctx.strokeStyle = '#1d3a55'; ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
        if (f > 0) {
          ctx.strokeStyle = '#ffd24a'; ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x1 + (x2 - x1) * f, y1 + (y2 - y1) * f); ctx.stroke();
          if (f < 1) { ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(x1 + (x2 - x1) * f, y1 + (y2 - y1) * f, 9, 0, 7); ctx.fill(); }
        }
      }
      nodes.forEach(([label, x, y], i) => {
        const on = lit >= i;
        ctx.fillStyle = on ? '#ffd24a' : '#0b1e32'; ctx.strokeStyle = on ? '#ffd24a' : '#2c4b68'; ctx.lineWidth = 4;
        ctx.beginPath(); ctx.arc(x, y, 58, 0, 7); ctx.fill(); ctx.stroke();
        ctx.fillStyle = on ? '#0f2b47' : '#7f9bb3'; ctx.font = `600 20px ${MONO}`; ctx.textAlign = 'center'; ctx.fillText(label, x, y + 7); ctx.textAlign = 'left';
      });
      ctx.fillStyle = '#e6eef4'; ctx.font = `600 54px ${SANS}`; ctx.fillText(lit >= nodes.length - 1 ? 'one working system.' : 'parts', 40, 650);
    } else {
      ctx.fillStyle = '#0b1e32'; ctx.fillRect(0, 0, w, 56);
      ['#e0313b', '#ffd24a', '#2fbf71'].forEach((c, i) => { ctx.fillStyle = c; ctx.beginPath(); ctx.arc(36 + i * 30, 28, 9, 0, 7); ctx.fill(); });
      ctx.fillStyle = '#7f9bb3'; ctx.font = `22px ${MONO}`; ctx.fillText('build.log', 140, 36);
      const rows = [['> observe', .2], ['> take it apart', .3], ['> test an idea', .42], ['> learn from the miss', .54], ['> rebuild', .66]];
      ctx.font = `30px ${MONO}`;
      rows.forEach(([row, at], i) => {
        if (p < at && i) return;
        ctx.fillStyle = i === rows.length - 1 ? '#ffd24a' : '#d6e4ed'; ctx.fillText(row, 44, 130 + i * 70);
      });
      const shown = rows.filter(([, at], i) => !i || p >= at), last = shown[shown.length - 1][0];
      if (Math.floor(p * 90) % 2 === 0) { ctx.fillStyle = '#ffd24a'; ctx.fillRect(44 + ctx.measureText(last).width + 8, 106 + (shown.length - 1) * 70, 16, 30); }
    }
    screen.map.needsUpdate = true;
  }
  function addScreen(parent, w, h, type, pxW, pxH, z, y = 0) {
    const tex = canvasTexture(pxW, pxH, () => {});
    const screen = { ...tex, type };
    plane(parent, w, h, flat(tex.map, '#e8f1ff'), 0, y, z);
    screens.push(screen); return screen;
  }
  const [mainSpec, sideSpec] = bedroomLayout.monitors;
  const monitor = new T.Group(); monitor.position.set(mainSpec.x, deskTop, mainSpec.z); scene.add(monitor);
  rbox(monitor, .24, .012, .17, 0, .006, .02, M.plastic, .005);
  rbox(monitor, .045, .26, .022, 0, .15, -.03, M.plastic, .006);
  const head = new T.Group(); head.position.set(0, .33, 0); head.rotation.x = -.04; monitor.add(head);
  rbox(head, .63, .37, .028, 0, 0, 0, M.black, .006);
  addScreen(head, .612, .344, 'SYSTEM VIEW', 1280, 720, .0145);
  const screenLight = new T.SpotLight('#8cc8ff', .9, 2.5, 1.25, 1, 2);
  screenLight.position.set(mainSpec.x, deskTop + .33, mainSpec.z + .04); screenLight.target.position.set(mainSpec.x, deskTop, .6); scene.add(screenLight, screenLight.target);
  // Sticky notes left on the bezel: the questions that drive the work.
  const noteTex = (text, bg) => canvasTexture(128, 128, (ctx, w, h) => {
    ctx.fillStyle = bg; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = 'rgba(0,0,0,.08)'; ctx.fillRect(0, 0, w, 18);
    ctx.fillStyle = '#1b2a3a'; ctx.font = `28px ${HAND}`; ctx.textAlign = 'center'; ctx.fillText(text, w / 2, h / 2 + 14);
  }).map;
  [['why?', '#ffd24a', .27, -.15, .12], ['how?', '#f29e8e', .215, -.162, -.1]].forEach(([text, bg, x, y, r]) => {
    const note = plane(head, .055, .055, mat('#ffffff', .9, 0, { map: noteTex(text, bg) }), x, y, .0155 + (text === 'how?' ? .0006 : 0));
    note.rotation.z = r;
  });

  const laptop = new T.Group(); laptop.position.set(sideSpec.x, deskTop, sideSpec.z); laptop.rotation.y = sideSpec.angle; scene.add(laptop);
  rbox(laptop, .31, .012, .215, 0, .006, 0, mat('#8e979f', .35, .7), .006);
  plane(laptop, .27, .1, mat('#15191f', .6), 0, .0125, .02).rotation.x = -Math.PI / 2;
  const lid = new T.Group(); lid.position.set(0, .012, -.105); lid.rotation.x = -.28; laptop.add(lid);
  rbox(lid, .31, .205, .008, 0, .1025, 0, mat('#8e979f', .35, .7), .004);
  addScreen(lid, .29, .18, 'BUILD LOG', 960, 600, .0045, .1025);
  const laptopLight = new T.SpotLight('#9ad7f2', .12, 1.5, 1.2, 1, 2);
  laptop.add(laptopLight, laptopLight.target); laptopLight.position.set(0, .12, -.07); laptopLight.target.position.set(0, -.1, .5);

  // Keyboard, mouse and desk mat establish scale.
  rbox(scene, .68, .003, .3, -.04, deskTop + .0015, .1, mat('#1a2330', .95), .01);
  const kb = new T.Group(); kb.position.set(-.08, deskTop + .003, .1); kb.rotation.y = .02; scene.add(kb);
  rbox(kb, .44, .018, .135, 0, .009, 0, M.plastic, .006);
  const keys = new T.InstancedMesh(new RoundedBoxGeometry(.0268, .009, .0215, 2, .003), mat('#ffffff', .55), 70);
  const m4 = new T.Matrix4(), keyColor = new T.Color();
  for (let r = 0; r < 5; r++) for (let c = 0; c < 14; c++) {
    const i = r * 14 + c;
    m4.makeTranslation(-.198 + c * .0305, .02, -.049 + r * .0245); keys.setMatrixAt(i, m4);
    const accent = (r === 0 && c === 0) || (r === 2 && c === 13);
    keys.setColorAt(i, keyColor.set(accent ? '#ffd24a' : r === 4 && c > 3 && c < 10 ? '#3a434d' : '#39424c'));
  }
  keys.castShadow = true; kb.add(keys);
  const mouse = place(scene, new T.SphereGeometry(.03, 24, 16), M.plastic, .2, deskTop + .012, .12);
  mouse.scale.set(.95, .5, 1.6);

  // Desk lamp on a stack of books, pooling warm light over the teardown.
  const lamp = bedroomLayout.anchors.lamp;
  [['#7d3a35', .26, -.06], ['#2f5873', .24, .05], ['#c3a05a', .22, -.02]].forEach(([c, w, r], i) => {
    rbox(scene, w, .038, .18, lamp.x, deskTop + .019 + i * .039, lamp.z, mat(c, .85), .004).rotation.y = r;
  });
  const lampBase = [lamp.x, deskTop + .117 + .01, lamp.z];
  cyl(scene, .06, .02, lampBase[0], lampBase[1], lampBase[2], M.black, 32);
  const elbow = [lamp.x + .05, lampBase[1] + .3, lamp.z + .02];
  const headPos = [lamp.x + .16, lampBase[1] + .26, lamp.z + .24];
  rod(scene, lampBase, elbow, .006, M.black);
  rod(scene, elbow, headPos, .006, M.black);
  place(scene, new T.SphereGeometry(.011, 16, 12), M.black, ...elbow);
  const shadeMesh = place(scene, new T.ConeGeometry(.06, .09, 32, 1, true), new T.MeshStandardMaterial({ color: '#1f252c', roughness: .45, metalness: .3, side: T.DoubleSide }), ...headPos);
  const teardownPoint = new T.Vector3(-.5, deskTop, .05);
  shadeMesh.lookAt(teardownPoint); shadeMesh.rotateX(-Math.PI / 2);
  const bulbPos = new T.Vector3(...headPos).lerp(teardownPoint, .07);
  place(scene, new T.SphereGeometry(.018, 16, 12), new T.MeshBasicMaterial({ color: '#fff0d0', toneMapped: false }), bulbPos.x, bulbPos.y, bulbPos.z).castShadow = false;
  glow('#ffc47a', .32, bulbPos.x, bulbPos.y - .01, bulbPos.z, .6);
  const lampLight = new T.SpotLight('#ffbf73', .5, 3, .95, .75, 2);
  lampLight.position.copy(bulbPos); lampLight.target.position.copy(teardownPoint);
  lampLight.castShadow = true; lampLight.shadow.mapSize.set(1024, 1024); lampLight.shadow.bias = -.0006; lampLight.shadow.normalBias = .01;
  lampLight.shadow.camera.near = .05; scene.add(lampLight, lampLight.target);
  const bounce = new T.PointLight('#ff9d52', .08, 2.2, 2); bounce.position.set(-.45, deskTop + .12, .2); scene.add(bounce);
  cable([[lamp.x - .05, lampBase[1] - .01, lamp.z - .05], [lamp.x - .12, deskTop + .12, lamp.z - .1], [lamp.x - .2, deskTop + .005, -.42], [lamp.x - .26, deskTop - .2, -.44]], .0035, M.cableBlack);

  // The teardown: an opened device, its lid, screws and a screwdriver.
  const dev = new T.Group(); dev.position.set(-.5, deskTop, .03); dev.rotation.y = .12; scene.add(dev);
  const shell = mat('#dfe3e6', .45);
  rbox(dev, .21, .005, .15, 0, .0025, 0, shell, .002);
  for (const [w, d, x, z] of [[.21, .006, 0, .072], [.21, .006, 0, -.072], [.006, .15, .102, 0], [.006, .15, -.102, 0]]) rbox(dev, w, .026, d, x, .013, z, shell, .002);
  const pcbTex = canvasTexture(512, 360, (ctx, w, h) => {
    ctx.fillStyle = '#1d5a3f'; ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = 'rgba(160,220,170,.35)'; ctx.lineWidth = 3;
    for (let i = 0; i < 40; i++) {
      let x = rnd() * w, y = rnd() * h; ctx.beginPath(); ctx.moveTo(x, y);
      for (let s = 0; s < 3; s++) { if (s % 2) y += (rnd() - .5) * 160; else x += (rnd() - .5) * 200; ctx.lineTo(x, y); }
      ctx.stroke();
    }
    ctx.fillStyle = '#c9a54b'; for (let i = 0; i < 60; i++) ctx.fillRect(rnd() * w, rnd() * h, 6, 6);
    ctx.fillStyle = 'rgba(255,255,255,.7)'; ctx.font = `18px ${MONO}`; ctx.fillText('REV 2.1', 20, h - 20);
  });
  rbox(dev, .19, .003, .13, 0, .012, 0, mat('#ffffff', .45, .1, { map: pcbTex.map }), .001);
  rbox(dev, .036, .006, .036, -.02, .017, -.01, M.steel, .002);
  rbox(dev, .022, .004, .016, .045, .016, .03, M.chip, .001);
  rbox(dev, .03, .004, .02, .05, .016, -.035, M.chip, .001);
  for (let i = 0; i < 4; i++) cyl(dev, .0045, .013, -.07 + i * .014, .02, .045, mat(i % 2 ? '#20262d' : '#3f4a8a', .4), 12);
  const pins = new T.InstancedMesh(new T.BoxGeometry(.0018, .008, .0018), M.gold, 10);
  for (let i = 0; i < 10; i++) { m4.makeTranslation(.02 + i * .005, .018, .055); pins.setMatrixAt(i, m4); }
  dev.add(pins);
  // The other half of the case, lying open beside it.
  const devLid = new T.Group(); devLid.position.set(-.71, deskTop, .17); devLid.rotation.y = -.45; scene.add(devLid);
  rbox(devLid, .21, .004, .15, 0, .002, 0, shell, .002);
  for (const [w, d, x, z] of [[.21, .006, 0, .072], [.21, .006, 0, -.072], [.006, .15, .102, 0], [.006, .15, -.102, 0]]) rbox(devLid, w, .016, d, x, .008, z, shell, .002);
  for (const [x, z] of [[.085, .055], [-.085, .055], [.085, -.055], [-.085, -.055]]) cyl(devLid, .005, .014, x, .007, z, shell, 12);
  const dish = cyl(scene, .032, .01, -.33, deskTop + .005, -.02, M.metal, 28, .026);
  for (let i = 0; i < 4; i++) cyl(scene, .0022, .007, -.335 + rnd() * .02, deskTop + .012, -.03 + rnd() * .02, M.steel, 8).rotation.z = 1.2 + rnd();
  const sd = new T.Group(); sd.position.set(-.29, deskTop + .012, .19); sd.rotation.y = -.55; scene.add(sd);
  const sdHandle = cyl(sd, .012, .085, 0, 0, 0, M.red, 18, .01); sdHandle.rotation.z = Math.PI / 2;
  const sdCap = cyl(sd, .0125, .012, -.045, 0, 0, M.black, 18); sdCap.rotation.z = Math.PI / 2;
  const sdShaft = cyl(sd, .0025, .1, .09, 0, 0, M.steel, 10); sdShaft.rotation.z = Math.PI / 2;
  sd.position.y = deskTop + .012;

  // Breadboard prototype: its LED switches on at "build one myself".
  const bb = new T.Group(); bb.position.set(-.36, deskTop, -.15); bb.rotation.y = -.08; scene.add(bb);
  const bbTex = canvasTexture(330, 110, (ctx, w, h) => {
    ctx.fillStyle = '#ecebe6'; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#5b5b58';
    for (let x = 12; x < w - 6; x += 10) for (const y of [8, 16, 30, 38, 46, 54, 62, 72, 80, 88, 96]) ctx.fillRect(x, y, 3, 3);
    ctx.fillStyle = '#d0463f'; ctx.fillRect(8, 4, w - 16, 1.5); ctx.fillStyle = '#3b6cc0'; ctx.fillRect(8, 22, w - 16, 1.5);
  });
  rbox(bb, .165, .009, .055, 0, .0045, 0, mat('#ffffff', .6, 0, { map: bbTex.map }), .002);
  rbox(bb, .05, .006, .026, -.03, .012, .004, mat('#1b2c4a', .5), .001);
  rbox(bb, .014, .002, .012, -.035, .0155, .004, M.steel, .0005);
  [['#e0313b', [.0, .009, -.01], [.05, .009, .012]], ['#ffd24a', [.01, .009, .012], [.03, .009, -.015]], ['#2fbf71', [-.005, .009, .015], [.06, .009, .015]]].forEach(([c, a, b]) => {
    const mid = [(a[0] + b[0]) / 2, .03, (a[2] + b[2]) / 2];
    const curve = new T.QuadraticBezierCurve3(new T.Vector3(...a), new T.Vector3(...mid), new T.Vector3(...b));
    bb.add(shade(new T.Mesh(new T.TubeGeometry(curve, 16, .0012, 6), mat(c, .5))));
  });
  const ledMat = new T.MeshStandardMaterial({ color: '#5a1418', emissive: '#ff3b30', emissiveIntensity: 0, roughness: .3 });
  const led = place(bb, new T.SphereGeometry(.003, 12, 8), ledMat, .065, .014, -.005);
  const ledGlow = glow('#ff5040', .05, 0, 0, 0, 0);
  scene.updateMatrixWorld(true); led.getWorldPosition(ledGlow.position);
  cable([[-.36 - .07, deskTop + .012, -.15], [-.1, deskTop + .006, -.02], [.2, deskTop + .004, -.1], [sideSpec.x - .14, deskTop + .01, sideSpec.z - .02]], .0022, mat('#e8ecef', .5));
  cable([[mainSpec.x, deskTop + .2, mainSpec.z - .05], [mainSpec.x + .02, deskTop + .03, -.4], [mainSpec.x + .1, deskTop - .15, -.44]], .004, M.cableBlack);

  // Mug, and a pen resting by the notebook.
  const mugProfile = [[0, 0], [.037, 0], [.04, .004], [.041, .092], [.038, .095], [.035, .012], [0, .012]].map(([x, y]) => new T.Vector2(x, y));
  const cup = bedroomLayout.clutter.find(c => c.id === 'coffee');
  place(scene, new T.LatheGeometry(mugProfile, 40), mat('#dfe6ea', .3), cup.x, deskTop, cup.z);
  place(scene, new T.CylinderGeometry(.036, .036, .002, 32), mat('#2a1a12', .2), cup.x, deskTop + .078, cup.z);
  const mugHandle = place(scene, new T.TorusGeometry(.024, .006, 10, 24, Math.PI * 1.2), mat('#dfe6ea', .3), cup.x + .04, deskTop + .048, cup.z);
  mugHandle.rotation.z = -Math.PI * .6;

  // ---------- the notebook ----------
  const nbAnchor = bedroomLayout.anchors.notebook;
  const NB = { w: .235, d: .3, block: .014 };
  const notebook = new T.Group(); notebook.position.set(nbAnchor.x, deskTop, nbAnchor.z); scene.add(notebook);
  rbox(notebook, NB.w + .006, .004, NB.d + .006, 0, .002, 0, mat('#1b232c', .7), .002);
  rbox(notebook, NB.w, NB.block, NB.d - .004, .002, .004 + NB.block / 2, 0, mat('#efece3', .9), .002);
  // The first page IS the site's paper: same navy, same grid, so the camera can land on it and fade through.
  const pageTex = canvasTexture(1024, 1308, (ctx, w, h) => {
    ctx.fillStyle = '#0f2b47'; ctx.fillRect(0, 0, w, h);
    for (let x = 0; x < w; x += 13) { ctx.fillStyle = x % 65 === 0 ? 'rgba(255,255,255,.11)' : 'rgba(255,255,255,.045)'; ctx.fillRect(x, 0, 1, h); }
    for (let y = 0; y < h; y += 13) { ctx.fillStyle = y % 65 === 0 ? 'rgba(255,255,255,.11)' : 'rgba(255,255,255,.045)'; ctx.fillRect(0, y, w, 1); }
    ctx.fillStyle = '#ffd24a'; ctx.fillRect(70, 84, 64, 26);
    ctx.fillStyle = '#0f2b47'; ctx.font = `600 18px ${MONO}`; ctx.fillText('P.01', 80, 104);
    ctx.fillStyle = '#ffd24a'; ctx.fillText('ABOUT ME', 148, 104);
    ctx.fillStyle = 'rgba(255,255,255,.5)'; ctx.font = `20px ${HAND}`; ctx.fillText('start here →', w - 250, h - 90);
  });
  const page = plane(notebook, NB.w - .01, NB.d - .014, flat(pageTex.map), .004, .0045 + NB.block, 0);
  page.rotation.x = -Math.PI / 2;
  const hinge = new T.Group(); hinge.position.set(-NB.w / 2 - .002, .0045 + NB.block + .002, 0); notebook.add(hinge);
  const coverTex = canvasTexture(800, 1020, (ctx, w, h) => {
    ctx.fillStyle = '#1a222b'; ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 3000; i++) { ctx.fillStyle = `rgba(255,255,255,${rnd() * .035})`; ctx.fillRect(rnd() * w, rnd() * h, 2, 2); }
    ctx.fillStyle = '#e9eef2'; ctx.font = `700 54px ${MONO}`; ctx.fillText('ENGINEERING', 70, 470); ctx.fillText('NOTEBOOK', 70, 540);
    ctx.fillStyle = 'rgba(233,238,242,.55)'; ctx.font = `26px ${MONO}`; ctx.fillText('VOL. 01 · R. SAWEK', 70, 600);
    ctx.save(); ctx.translate(560, 170); ctx.rotate(-.12);
    ctx.fillStyle = '#e0313b'; ctx.beginPath(); ctx.roundRect(-110, -60, 220, 110, 18); ctx.fill();
    ctx.fillStyle = '#ffffff'; ctx.font = `italic 800 74px ${SANS}`; ctx.textAlign = 'center'; ctx.fillText('#RS3', 0, 22); ctx.restore();
    ctx.fillStyle = '#ffd24a'; ctx.fillRect(70, 860, 120, 10);
  });
  const coverMatTop = mat('#ffffff', .75, 0, { map: coverTex.map });
  const coverBoard = rbox(hinge, NB.w + .006, .003, NB.d + .006, NB.w / 2 + .002, 0, 0, mat('#1b232c', .75), .0015);
  const coverFace = plane(hinge, NB.w, NB.d, coverMatTop, NB.w / 2 + .002, .0016, 0); coverFace.rotation.x = -Math.PI / 2;
  const insideTex = canvasTexture(400, 510, (ctx, w, h) => {
    ctx.fillStyle = '#e9e5da'; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#3a4652'; ctx.font = `24px ${HAND}`; ctx.fillText('if found, please return to', 40, 200);
    ctx.fillStyle = '#0f2b47'; ctx.font = `600 34px ${HAND}`; ctx.fillText('Rapeepat · #RS3', 40, 250);
  });
  const coverInside = plane(hinge, NB.w, NB.d, mat('#ffffff', .9, 0, { map: insideTex.map }), NB.w / 2 + .002, -.0016, 0);
  coverInside.rotation.set(Math.PI / 2, 0, Math.PI);
  rbox(hinge, .007, .0035, NB.d + .008, NB.w - .012, .0006, 0, M.red, .0015);
  const pen = new T.Group(); pen.position.set(nbAnchor.x + .145, deskTop + .0046, nbAnchor.z + .01); pen.rotation.y = -.12; scene.add(pen);
  cyl(pen, .0045, .12, 0, 0, 0, M.yellow, 14).rotation.x = Math.PI / 2;
  cyl(pen, .0047, .03, 0, 0, -.045, M.black, 14).rotation.x = Math.PI / 2;
  cyl(pen, .0045, .012, 0, 0, .066, M.metal, 14, .0012).rotation.x = -Math.PI / 2;
  rbox(pen, .0016, .0025, .026, 0, .0045, -.04, M.metal, .0006);
  void coverBoard;

  // ---------- render ----------
  const target = new T.Vector3(), away = new T.Vector3();
  let width = 0, height = 0, lastP = -1, failed = false;
  screens.forEach(s => drawScreen(s, 0));
  function renderAt(p) {
    if (failed || document.hidden || !document.documentElement.classList.contains('film') || reduce.matches) return;
    const rect = section.getBoundingClientRect();
    if (rect.bottom <= 0 || rect.top >= innerHeight) return;
    const w = frame.clientWidth, h = frame.clientHeight;
    if (!w || !h) return;
    if (w !== width || h !== height) {
      width = w; height = h; renderer.setSize(w, h); camera.aspect = w / h;
      camera.fov = 50 + 14 * (1 - beat(camera.aspect, .7, 1.3)); camera.updateProjectionMatrix();
    }
    sampleOpeningCamera(p, camera.position, target);
    // Narrow screens: step back along the view line so the desk stays readable until the notebook close-up.
    const narrow = (1 - beat(camera.aspect, .6, 1.2)) * (1 - beat(p, .7, .9));
    if (narrow > 0) camera.position.add(away.subVectors(camera.position, target).multiplyScalar(.45 * narrow));
    camera.lookAt(target);
    const state = openingState(p);
    hinge.rotation.z = Math.PI * .985 * state.notebookOpen;
    const ledOn = beat(p, .64, .7);
    ledMat.emissiveIntensity = 3 * ledOn; ledGlow.material.opacity = .9 * ledOn;
    if (Math.abs(p - lastP) > .002 || lastP < 0) { screens.forEach(s => drawScreen(s, p)); lastP = p; }
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
    if (event.detail.reducedMotion) section.classList.remove('has-3d');
    if (event.detail.active !== false) renderAt(event.detail.progress);
  });
  new ResizeObserver(() => dispatchEvent(new Event('portfolio:opening-sync'))).observe(frame);
  dispatchEvent(new Event('portfolio:opening-sync'));
}

try { start(); } catch (error) {
  // Preserve the illustrated opening if WebGL is unavailable.
  frame.querySelector('.pw-canvas')?.remove();
  section.classList.remove('has-3d');
  console.warn('3D opening unavailable; using the illustrated opening.', error);
}

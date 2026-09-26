// 3D workbench car, modelled after the shape of the 2023 Red Bull RB19 (proportions only, no logos).
// Bundled to dist/car3d.js (see README). Falls back to the SVG drawing when WebGL is unavailable.
// Units are metres: forward is -z, ground is y = 0.
import {
  WebGLRenderer, Scene, PerspectiveCamera, Group, Mesh, LineSegments, EdgesGeometry, BufferGeometry, Float32BufferAttribute,
  BoxGeometry, CylinderGeometry, SphereGeometry, TorusGeometry, ExtrudeGeometry, LatheGeometry, CircleGeometry, Shape, PlaneGeometry,
  MeshStandardMaterial, LineBasicMaterial, MeshBasicMaterial, HemisphereLight, DirectionalLight, DoubleSide,
  GridHelper, Vector3, Vector2, Raycaster, Color, CanvasTexture, Fog, MathUtils, SRGBColorSpace
} from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

const ICE = new Color('#9ad7f2');
const ICE_BRIGHT = new Color('#e3f6ff');
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');

// Material roles, coloured per skin. Blueprint keeps the site's pit-wall palette; livery borrows the RB19's colours.
const SKINS = {
  blueprint: {
    edge: 0.6,
    body: '#243c4d', panel: '#1d3343', trim: '#2c4a5c', dark: '#0f1a23', carbon: '#16232e',
    tyre: '#111c25', rim: '#2a4455', metal: '#355468', red: '#2c4a5c', yellow: '#2c4a5c', helmet: '#9ad7f2', light: '#9ad7f2'
  },
  livery: {
    edge: 0.16,
    body: '#1b2a52', panel: '#1b2a52', trim: '#22325e', dark: '#07090f', carbon: '#16181d',
    tyre: '#18191c', rim: '#34373d', metal: '#7d8791', red: '#d8203f', yellow: '#f5c400', helmet: '#f5c400', light: '#ff3040'
  }
};

function webglAvailable() {
  try {
    const c = document.createElement('canvas');
    return !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl')));
  } catch { return false; }
}

// ---- Geometry helpers ------------------------------------------------------

const catmull = (p0, p1, p2, p3, t) => {
  const t2 = t * t, t3 = t2 * t;
  return 0.5 * (2 * p1 + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 + (-p0 + 3 * p1 - 3 * p2 + p3) * t3);
};
const spow = (v, e) => Math.sign(v) * Math.abs(v) ** e;

// Smooth body through superellipse cross-sections.
// Each section is [p, a, b, w, h, n]: position along the axis, centre in the other two axes, size, squareness.
// axis 'z': (a, b) = (x, y). axis 'x': (a, b) = (z, y), w is chord along z, h is thickness.
// Returns the mesh geometry plus blueprint contour lines at every authored section.
function loft(sections, { axis = 'z', seg = 36, steps = 6 } = {}) {
  const rings = [], contourAt = [];
  const S = sections;
  for (let i = 0; i < S.length - 1; i++) {
    const p0 = S[Math.max(0, i - 1)], p1 = S[i], p2 = S[i + 1], p3 = S[Math.min(S.length - 1, i + 2)];
    for (let s = 0; s < steps; s++) {
      const t = s / steps;
      if (s === 0) contourAt.push(rings.length);
      rings.push(p1.map((_, k) => catmull(p0[k], p1[k], p2[k], p3[k], t)));
    }
  }
  contourAt.push(rings.length);
  rings.push(S[S.length - 1]);

  const toXYZ = (p, a, b) => axis === 'z' ? [a, b, p] : [p, b, a];
  const pos = [], idx = [];
  for (const [p, a, b, w, h, n] of rings) {
    for (let j = 0; j < seg; j++) {
      const th = (j / seg) * Math.PI * 2;
      pos.push(...toXYZ(p, a + spow(Math.cos(th), 2 / n) * w / 2, b + spow(Math.sin(th), 2 / n) * h / 2));
    }
  }
  for (let i = 0; i < rings.length - 1; i++) {
    for (let j = 0; j < seg; j++) {
      const a = i * seg + j, b = i * seg + (j + 1) % seg, c = a + seg, d = b + seg;
      idx.push(a, c, b, b, c, d);
    }
  }
  // end caps
  for (const [ri, flip] of [[0, true], [rings.length - 1, false]]) {
    const [p, a, b] = rings[ri];
    const centre = pos.length / 3;
    pos.push(...toXYZ(p, a, b));
    for (let j = 0; j < seg; j++) {
      const v1 = ri * seg + j, v2 = ri * seg + (j + 1) % seg;
      flip ? idx.push(centre, v1, v2) : idx.push(centre, v2, v1);
    }
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new Float32BufferAttribute(pos, 3));
  geometry.setIndex(idx);
  geometry.computeVertexNormals();

  // contour lines: authored cross-sections plus top and side "stringers"
  const lp = [];
  const vert = (i, j) => pos.slice((i * seg + (j % seg)) * 3, (i * seg + (j % seg)) * 3 + 3);
  for (const i of contourAt) for (let j = 0; j < seg; j++) lp.push(...vert(i, j), ...vert(i, j + 1));
  for (const j of [0, seg / 4, seg / 2]) for (let i = 0; i < rings.length - 1; i++) lp.push(...vert(i, j), ...vert(i + 1, j));
  const lines = new BufferGeometry();
  lines.setAttribute('position', new Float32BufferAttribute(lp, 3));
  return { geometry, lines };
}

// Flat plate from a side profile [(z, y)...], extruded across x.
function profilePlate(points, thickness) {
  const s = new Shape();
  s.moveTo(...points[0]);
  for (const p of points.slice(1)) p.length === 4 ? s.quadraticCurveTo(...p) : s.lineTo(...p);
  s.closePath();
  const g = new ExtrudeGeometry(s, { depth: thickness, bevelEnabled: false, curveSegments: 10 });
  g.rotateY(-Math.PI / 2); // shape x -> car z, extrusion -> car -x
  g.translate(thickness / 2, 0, 0);
  return g;
}

function init() {
  const drawing = document.querySelector('.drawing');
  const svg = document.querySelector('#car-diagram');
  if (!drawing || !svg || !webglAvailable()) return;

  // ---- DOM stage -------------------------------------------------------
  const stage = document.createElement('div');
  stage.className = 'stage3d';
  stage.setAttribute('role', 'group');
  stage.setAttribute('aria-label', 'Interactive 3D racing car. Drag to rotate. Use the part buttons below to inspect components.');
  const labels = document.createElement('div');
  labels.className = 'stage-labels';
  const tools = document.createElement('div');
  tools.className = 'stage-tools';
  tools.innerHTML =
    '<button type="button" data-zoom="in" aria-label="Zoom in">+</button>' +
    '<button type="button" data-zoom="out" aria-label="Zoom out">−</button>' +
    '<button type="button" data-reset aria-label="Reset view">⟲</button>';
  const skinPicker = document.createElement('div');
  skinPicker.className = 'stage-skin';
  skinPicker.setAttribute('role', 'group');
  skinPicker.setAttribute('aria-label', 'Car finish');
  skinPicker.innerHTML =
    '<button type="button" data-skin="blueprint" aria-pressed="true">Blueprint</button>' +
    '<button type="button" data-skin="livery" aria-pressed="false">Livery</button>';
  const hint = document.createElement('p');
  hint.className = 'stage-hint';
  hint.setAttribute('aria-hidden', 'true');
  hint.textContent = 'drag to rotate · tap a part';
  stage.append(labels, skinPicker, tools, hint);
  svg.after(stage);

  const renderer = new WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.outputColorSpace = SRGBColorSpace;
  renderer.domElement.setAttribute('aria-hidden', 'true');
  stage.prepend(renderer.domElement);
  drawing.classList.add('is-3d');

  const scene = new Scene();
  scene.fog = new Fog('#1a2835', 10, 19);
  const camera = new PerspectiveCamera(34, 1, 0.1, 50);
  const HOME = new Vector3(4.3, 2.4, 4.5);
  camera.position.copy(HOME);

  scene.add(new HemisphereLight('#cfe9f7', '#0d1720', 1.5));
  const key = new DirectionalLight('#ffffff', 1.8);
  key.position.set(3, 6, 2);
  scene.add(key);
  const rim = new DirectionalLight('#9ad7f2', 1.2);
  rim.position.set(-4, 2, -5);
  scene.add(rim);

  const grid = new GridHelper(14, 28, '#3b5a6d', '#2a4050');
  grid.material.transparent = true;
  grid.material.opacity = 0.55;
  scene.add(grid);

  // soft contact shadow
  const sc = document.createElement('canvas');
  sc.width = sc.height = 128;
  const g = sc.getContext('2d');
  const grad = g.createRadialGradient(64, 64, 4, 64, 64, 64);
  grad.addColorStop(0, 'rgba(5,12,18,.75)');
  grad.addColorStop(1, 'rgba(5,12,18,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, 128, 128);
  const shadow = new Mesh(new PlaneGeometry(3, 7), new MeshBasicMaterial({ map: new CanvasTexture(sc), transparent: true, depthWrite: false }));
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.002;
  scene.add(shadow);

  // ---- Car construction -----------------------------------------------
  const car = new Group();
  scene.add(car);
  const allMeshes = [];
  const parts = {}; // component -> [{group, offset}]
  let skin = SKINS.blueprint;

  function add(group, geometry, role = 'body', pos, rot, lines) {
    const material = new MeshStandardMaterial({ color: skin[role], roughness: 0.5, metalness: 0.2, transparent: true, side: DoubleSide });
    const mesh = new Mesh(geometry, material);
    mesh.userData.role = role;
    if (pos) mesh.position.set(...pos);
    if (rot) mesh.rotation.set(...rot);
    const edges = new LineSegments(lines || new EdgesGeometry(geometry, 28), new LineBasicMaterial({ color: ICE, transparent: true, opacity: skin.edge }));
    mesh.add(edges);
    mesh.userData.edges = edges;
    group.add(mesh);
    allMeshes.push(mesh);
    return mesh;
  }
  function addLoft(group, sections, role, opts, pos, rot) {
    const { geometry, lines } = loft(sections, opts);
    return add(group, geometry, role, pos, rot, lines);
  }
  function rod(group, a, b, r = 0.012, role = 'metal') {
    const A = new Vector3(...a), B = new Vector3(...b);
    const mesh = add(group, new CylinderGeometry(r, r, A.distanceTo(B), 6), role);
    mesh.position.copy(A).lerp(B, 0.5);
    mesh.quaternion.setFromUnitVectors(new Vector3(0, 1, 0), B.clone().sub(A).normalize());
    return mesh;
  }
  // Aerofoil element spanning x, built around its own centre so it can be pitched.
  function wing(group, sections, role, pos, pitch) {
    return addLoft(group, sections.map(([x, dz, dy, chord, t]) => [x, dz, dy, chord, t, 2.2]), role, { axis: 'x', seg: 20, steps: 4 }, pos, [pitch, 0, 0]);
  }
  function part(component, offset, build) {
    const group = new Group();
    group.userData.component = component;
    build(group);
    car.add(group);
    (parts[component] ||= []).push({ group, offset: new Vector3(...offset) });
    return group;
  }

  // Chassis, nose and cockpit
  part('cockpit', [0, 0.6, 0], grp => {
    addLoft(grp, [
      [-2.5, 0, 0.17, 0.1, 0.07, 2.4],
      [-2.2, 0, 0.24, 0.17, 0.13, 2.6],
      [-1.7, 0, 0.36, 0.26, 0.24, 3],
      [-1.1, 0, 0.47, 0.4, 0.34, 3.5],
      [-0.6, 0, 0.52, 0.56, 0.4, 3.5],
      [0.0, 0, 0.52, 0.72, 0.42, 3.5],
      [0.45, 0, 0.5, 0.72, 0.42, 3.5]
    ], 'body');
    add(grp, new BoxGeometry(0.1, 0.02, 0.14), 'yellow', [0, 0.2, -2.42], [0.12, 0, 0]); // nose tip marker
    const opening = add(grp, new CircleGeometry(0.5, 32), 'dark', [0, 0.735, -0.2], [-Math.PI / 2, 0, 0]);
    opening.scale.set(0.42, 0.78, 1);
    add(grp, new SphereGeometry(0.125, 20, 14), 'helmet', [0, 0.82, -0.12]);
    const visor = add(grp, new BoxGeometry(0.17, 0.045, 0.02), 'dark', [0, 0.84, -0.245]);
    visor.rotation.x = 0.15;
    add(grp, new BoxGeometry(0.4, 0.06, 0.12), 'trim', [0, 0.76, 0.1]); // headrest
    add(grp, new BoxGeometry(0.2, 0.08, 0.03), 'carbon', [0, 0.77, -0.44], [0.6, 0, 0]); // steering wheel
    // halo
    const halo = add(grp, new TorusGeometry(0.27, 0.024, 8, 32, Math.PI), 'carbon', [0, 0.93, -0.06], [-Math.PI / 2, 0, 0]);
    halo.scale.set(1, 1.45, 1);
    rod(grp, [0.27, 0.93, -0.06], [0.3, 0.73, 0.1], 0.024, 'carbon');
    rod(grp, [-0.27, 0.93, -0.06], [-0.3, 0.73, 0.1], 0.024, 'carbon');
    rod(grp, [0, 0.93, -0.45], [0, 0.73, -0.64], 0.022, 'carbon');
  });

  // Sidepods: letterbox inlet over a deep undercut, steep downwash ramp to the rear
  part('sidepods', [0, 0, 0], () => {});
  for (const s of [-1, 1]) {
    const grp = new Group();
    grp.userData.component = 'sidepods';
    addLoft(grp, [
      [-0.42, s * 0.55, 0.48, 0.5, 0.17, 4],
      [-0.2, s * 0.56, 0.48, 0.52, 0.24, 3.5],
      [0.3, s * 0.52, 0.44, 0.48, 0.28, 3],
      [0.8, s * 0.42, 0.35, 0.36, 0.24, 3],
      [1.3, s * 0.3, 0.26, 0.2, 0.14, 2.6],
      [1.6, s * 0.22, 0.22, 0.1, 0.08, 2.4]
    ], 'body');
    add(grp, new PlaneGeometry(0.42, 0.11), 'dark', [s * 0.57, 0.48, -0.425], [0, Math.PI, 0]); // inlet mouth
    add(grp, new BoxGeometry(0.01, 0.05, 0.7), 'red', [s * 0.795, 0.47, 0.15]); // side stripe
    for (let i = 0; i < 4; i++) add(grp, new BoxGeometry(0.16, 0.012, 0.035), 'dark', [s * 0.5, 0.58 - i * 0.03, 0.42 + i * 0.11], [0.35, 0, 0]); // louvres
    // mirror on stalks
    const mirror = add(grp, new SphereGeometry(0.5, 16, 10), 'panel', [s * 0.58, 0.75, -0.48]);
    mirror.scale.set(0.2, 0.08, 0.07);
    rod(grp, [s * 0.52, 0.6, -0.38], [s * 0.56, 0.72, -0.47], 0.01, 'carbon');
    rod(grp, [s * 0.38, 0.73, -0.45], [s * 0.5, 0.75, -0.48], 0.01, 'carbon');
    car.add(grp);
    parts.sidepods.push({ group: grp, offset: new Vector3(s * 0.55, 0, 0) });
  }

  // Engine cover, roll-hoop airbox, shark fin, gearbox
  part('engine', [0, 0.6, 0.3], grp => {
    addLoft(grp, [
      [0.35, 0, 0.62, 0.62, 0.52, 3],
      [0.8, 0, 0.6, 0.44, 0.52, 3],
      [1.3, 0, 0.5, 0.3, 0.4, 2.8],
      [1.8, 0, 0.4, 0.2, 0.26, 2.6],
      [2.3, 0, 0.36, 0.12, 0.16, 2.4]
    ], 'body');
    addLoft(grp, [
      [0.12, 0, 1.0, 0.24, 0.2, 2.2],
      [0.38, 0, 0.97, 0.22, 0.24, 2.2],
      [0.72, 0, 0.86, 0.2, 0.26, 2.4],
      [1.1, 0, 0.72, 0.14, 0.2, 2.4]
    ], 'body');
    const intake = add(grp, new CircleGeometry(0.5, 24), 'dark', [0, 1.0, 0.115], [0, Math.PI, 0]);
    intake.scale.set(0.18, 0.15, 1);
    for (const s of [-1, 1]) add(grp, new BoxGeometry(0.05, 0.08, 0.12), 'trim', [s * 0.15, 0.9, 0.3]); // ear inlets
    add(grp, profilePlate([[0.85, 0.8], [0.85, 1.0], [2.15, 0.64], [2.15, 0.5]], 0.012), 'red'); // shark fin
    add(grp, new BoxGeometry(0.24, 0.26, 0.9), 'carbon', [0, 0.28, 1.95]); // gearbox
    add(grp, new BoxGeometry(0.16, 0.14, 0.25), 'carbon', [0, 0.36, 2.48]); // crash structure
    add(grp, new BoxGeometry(0.1, 0.04, 0.015), 'light', [0, 0.36, 2.61]); // rain light
  });

  // Front wing: four elements that rise towards the endplates
  part('front', [0, 0, -0.85], grp => {
    const span = [-0.96, -0.7, -0.4, -0.18, 0, 0.18, 0.4, 0.7, 0.96];
    const els = [
      { z: -2.45, y: 0.08, chord: 0.26, t: 0.03, pitch: -0.05, rise: 0 },
      { z: -2.3, y: 0.12, chord: 0.16, t: 0.02, pitch: -0.25, rise: 0.08 },
      { z: -2.2, y: 0.165, chord: 0.13, t: 0.018, pitch: -0.45, rise: 0.14 },
      { z: -2.12, y: 0.21, chord: 0.11, t: 0.016, pitch: -0.65, rise: 0.18 }
    ];
    for (const e of els) {
      wing(grp, span.map(x => [x, 0, Math.max(0, Math.abs(x) - 0.3) * e.rise, e.chord, e.t]), e === els[0] ? 'panel' : 'trim', [0, e.y, e.z], e.pitch);
    }
    for (const s of [-1, 1]) {
      add(grp, profilePlate([[-2.62, 0.04], [-2.62, 0.2], [-2.5, 0.3, -2.3, 0.3], [-2.08, 0.26], [-2.06, 0.04]], 0.012), 'red', [s * 0.97, 0, 0]);
      add(grp, new BoxGeometry(0.06, 0.02, 0.4), 'carbon', [s * 0.93, 0.03, -2.35]); // footplate
    }
  });

  // Wheels and suspension: pull-rod front, push-rod rear
  part('suspension', [0, 0, 0], () => {});
  const axles = [
    { z: -1.55, cx: 0.85, w: 0.305, front: true },
    { z: 2.05, cx: 0.8, w: 0.405, front: false }
  ];
  const R = 0.36;
  for (const { z, cx, w, front } of axles) {
    for (const s of [-1, 1]) {
      const grp = new Group();
      grp.userData.component = 'suspension';
      const x = s * cx;
      // tyre: lathed profile with rounded shoulders
      const hw = w / 2;
      const profile = [[0.225, -hw], [0.3, -hw], [0.345, -hw + 0.02], [R, -hw + 0.07], [R, hw - 0.07], [0.345, hw - 0.02], [0.3, hw], [0.225, hw]].map(([r, y]) => new Vector2(r, y));
      add(grp, new LatheGeometry(profile, 48), 'tyre', [x, R, z], [0, 0, Math.PI / 2]);
      const band = add(grp, new TorusGeometry(0.315, 0.006, 4, 48), 'yellow', [x + s * (hw + 0.001), R, z], [0, Math.PI / 2, 0]);
      band.userData.edges.visible = false;
      add(grp, new CylinderGeometry(0.228, 0.228, 0.012, 40), 'rim', [x + s * (hw - 0.008), R, z], [0, 0, Math.PI / 2]); // wheel cover
      add(grp, new CylinderGeometry(0.035, 0.035, 0.03, 12), 'metal', [x + s * (hw + 0.004), R, z], [0, 0, Math.PI / 2]); // nut
      add(grp, new CylinderGeometry(0.22, 0.22, w - 0.03, 32, 1, true), 'dark', [x, R, z], [0, 0, Math.PI / 2]); // rim barrel
      const inner = x - s * (hw + 0.02); // upright plane
      add(grp, new BoxGeometry(0.05, 0.26, 0.14), 'carbon', [inner, R, z]); // upright
      add(grp, new BoxGeometry(0.08, 0.18, 0.22), 'trim', [inner - s * 0.05, R, z]); // brake duct
      const cxIn = front ? 0.16 : 0.17;
      if (front) {
        add(grp, new BoxGeometry(0.14, 0.012, 0.28), 'trim', [x - s * 0.02, 0.74, z - 0.04], [0.12, 0, s * 0.18]); // wheel wake deflector
        // upper + lower wishbones
        rod(grp, [s * cxIn, 0.54, z - 0.28], [inner, 0.5, z]); rod(grp, [s * cxIn, 0.54, z + 0.26], [inner, 0.5, z]);
        rod(grp, [s * cxIn, 0.3, z - 0.3], [inner, 0.22, z]); rod(grp, [s * cxIn, 0.3, z + 0.34], [inner, 0.22, z]);
        rod(grp, [inner, 0.5, z + 0.02], [s * 0.15, 0.26, z + 0.16], 0.014, 'carbon'); // pull-rod: high outboard, low inboard
        rod(grp, [s * cxIn, 0.42, z + 0.12], [inner, 0.4, z + 0.1], 0.009); // track rod
      } else {
        rod(grp, [s * cxIn, 0.46, z - 0.32], [inner, 0.52, z]); rod(grp, [s * cxIn, 0.46, z + 0.06], [inner, 0.52, z]);
        rod(grp, [s * cxIn, 0.18, z - 0.36], [inner, 0.2, z]); rod(grp, [s * cxIn, 0.18, z + 0.1], [inner, 0.2, z]);
        rod(grp, [inner, 0.22, z - 0.02], [s * 0.15, 0.5, z - 0.12], 0.014, 'carbon'); // push-rod: low outboard, high inboard
        rod(grp, [s * cxIn, 0.3, z + 0.12], [inner, 0.3, z + 0.12], 0.009); // toe link
      }
      car.add(grp);
      parts.suspension.push({ group: grp, offset: new Vector3(s * 0.6, 0, 0) });
    }
  }

  // Rear wing: spoon-shaped main plane on a single pylon, DRS flap, beam wing
  part('rear', [0, 0.4, 0.75], grp => {
    const span = [-0.47, -0.3, -0.1, 0.1, 0.3, 0.47];
    const spoon = x => (1 - (x / 0.47) ** 2) * 0.035;
    wing(grp, span.map(x => [x, 0, -spoon(x), 0.3 + spoon(x) * 1.6, 0.035]), 'panel', [0, 0.87, 2.46], -0.12);
    wing(grp, span.map(x => [x, 0, 0, 0.19, 0.02]), 'trim', [0, 0.99, 2.66], -0.55);
    wing(grp, [-0.3, -0.1, 0.1, 0.3].map(x => [x, 0, 0, 0.14, 0.02]), 'trim', [0, 0.4, 2.36], -0.2);
    wing(grp, [-0.28, -0.1, 0.1, 0.28].map(x => [x, 0, 0, 0.11, 0.018]), 'trim', [0, 0.46, 2.47], -0.45);
    for (const s of [-1, 1]) {
      add(grp, profilePlate([[2.28, 0.5], [2.28, 0.88], [2.3, 1.06, 2.5, 1.07], [2.74, 1.05], [2.8, 1.0, 2.78, 0.84], [2.62, 0.5]], 0.014), 'red', [s * 0.48, 0, 0]);
    }
    add(grp, profilePlate([[2.4, 0.4], [2.46, 0.86], [2.56, 0.86], [2.5, 0.4]], 0.03), 'carbon'); // pylon
    add(grp, new BoxGeometry(0.06, 0.05, 0.12), 'carbon', [0, 1.06, 2.6]); // DRS actuator pod
  });

  // Floor: ground-effect tunnels feed a diffuser at the back
  part('floor', [0, -0.3, 0], grp => {
    const s = new Shape();
    const outline = [[-0.28, -1.25], [-0.8, -0.6], [-0.98, -0.3], [-0.98, 1.3], [-0.62, 1.62], [-0.55, 2.3], [0.55, 2.3], [0.62, 1.62], [0.98, 1.3], [0.98, -0.3], [0.8, -0.6], [0.28, -1.25]];
    s.moveTo(...outline[0]);
    for (const p of outline.slice(1)) s.lineTo(...p);
    s.closePath();
    const plate = new ExtrudeGeometry(s, { depth: 0.025, bevelEnabled: false });
    plate.rotateX(Math.PI / 2); // shape y -> car z, extrusion downwards
    add(grp, plate, 'carbon', [0, 0.1, 0]);
    for (const x of [-1, 1]) add(grp, new BoxGeometry(0.035, 0.06, 1.5), 'trim', [x * 0.95, 0.12, 0.5], [0, 0, x * -0.3]); // edge wing
    for (const x of [-0.28, -0.2, -0.12, 0.12, 0.2, 0.28]) add(grp, new BoxGeometry(0.008, 0.07, 0.5), 'trim', [x, 0.045, -0.95]); // floor fences
    add(grp, new BoxGeometry(1.1, 0.018, 0.75), 'carbon', [0, 0.2, 2.0], [-0.3, 0, 0]); // diffuser ramp
    for (const x of [-0.5, -0.25, 0, 0.25, 0.5]) add(grp, new BoxGeometry(0.01, 0.16, 0.7), 'trim', [x, 0.15, 2.0], [-0.3, 0, 0]); // strakes
  });

  car.position.z = -0.1;

  // ---- Skins -----------------------------------------------------------
  function applySkin(name) {
    skin = SKINS[name];
    for (const mesh of allMeshes) mesh.material.color.set(skin[mesh.userData.role]);
    skinPicker.querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.skin === name)));
    applySelection(selected);
  }
  skinPicker.addEventListener('click', e => { const b = e.target.closest('[data-skin]'); if (b) applySkin(b.dataset.skin); });

  // ---- Component data + selection ---------------------------------------
  const anchors = {
    front: new Vector3(0.55, 0.2, -2.4),
    cockpit: new Vector3(0, 0.98, -0.3),
    sidepods: new Vector3(0.62, 0.62, -0.1),
    suspension: new Vector3(-0.85, 0.74, -1.55),
    engine: new Vector3(0, 1.12, 0.35),
    rear: new Vector3(-0.35, 1.1, 2.5),
    floor: new Vector3(0.9, 0.1, 0.7)
  };
  const labelNames = { front: 'Front wing', cockpit: 'Cockpit', sidepods: 'Sidepods', suspension: 'Suspension', engine: 'Power unit', rear: 'Rear wing', floor: 'Floor' };
  const labelEls = {};
  for (const [key, name] of Object.entries(labelNames)) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'pin';
    b.dataset.pin = key;
    b.tabIndex = -1; // keyboard users have the part picker below
    b.setAttribute('aria-hidden', 'true');
    b.innerHTML = `<span class="pin-dot"></span><span class="pin-text">${name}</span>`;
    b.addEventListener('click', () => window.inspectPart?.(key));
    labels.append(b);
    labelEls[key] = b;
  }

  const componentOf = obj => {
    for (let n = obj; n; n = n.parent) if (n.userData.component) return n.userData.component;
    return null;
  };

  let selected = null;
  function applySelection(key) {
    selected = key;
    for (const mesh of allMeshes) {
      const on = !key || componentOf(mesh) === key;
      mesh.material.opacity = on ? 1 : 0.12;
      mesh.material.depthWrite = on;
      mesh.userData.edges.material.color.copy(key && on ? ICE_BRIGHT : ICE);
      mesh.userData.edges.material.opacity = on ? (key ? Math.max(skin.edge, 0.7) : skin.edge) : 0.1;
      mesh.material.emissive.set(mesh.userData.role === 'light' ? skin.light : key && on ? '#1c4a63' : '#000000');
    }
    for (const [k, el] of Object.entries(labelEls)) el.classList.toggle('is-active', k === key);
    requestRender();
  }
  document.addEventListener('part:inspect', e => applySelection(e.detail));

  // ---- Exploded view ----------------------------------------------------
  let explode = 0, explodeTarget = 0;
  document.addEventListener('part:view', e => { explodeTarget = e.detail === 'exploded' ? 1 : 0; requestRender(); });

  // ---- Controls ---------------------------------------------------------
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(0, 0.45, 0);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.enablePan = false;
  controls.enableZoom = false; // page scroll stays page scroll; zoom via buttons
  controls.minPolarAngle = 0.2;
  controls.maxPolarAngle = 1.5;
  controls.autoRotate = !reduceMotion.matches;
  controls.autoRotateSpeed = 0.9;
  controls.addEventListener('change', requestRender);
  controls.addEventListener('start', () => { controls.autoRotate = false; stage.classList.add('touched'); });

  // distance that fits the whole car; narrow stages need the camera further back
  let fitDist = HOME.length();
  let dist = fitDist, distTarget = dist;
  tools.addEventListener('click', e => {
    const b = e.target.closest('button');
    if (!b) return;
    if (b.dataset.zoom) distTarget = MathUtils.clamp(distTarget * (b.dataset.zoom === 'in' ? 0.8 : 1.25), fitDist * 0.45, fitDist * 1.7);
    if (b.hasAttribute('data-reset')) {
      distTarget = fitDist;
      homeTween = 1;
    }
    requestRender();
  });
  let homeTween = 0;

  // ---- Picking ----------------------------------------------------------
  const ray = new Raycaster();
  const ndc = new Vector2();
  function pick(e) {
    const r = renderer.domElement.getBoundingClientRect();
    ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    const hit = ray.intersectObjects(allMeshes, false).find(h => h.object.material.opacity > 0.5);
    return hit ? componentOf(hit.object) : null;
  }
  let downAt = null;
  renderer.domElement.addEventListener('pointerdown', e => { downAt = [e.clientX, e.clientY]; });
  renderer.domElement.addEventListener('pointerup', e => {
    if (!downAt || Math.hypot(e.clientX - downAt[0], e.clientY - downAt[1]) > 6) return;
    const comp = pick(e);
    if (comp) window.inspectPart?.(comp);
  });
  renderer.domElement.addEventListener('pointermove', e => {
    if (e.buttons) return;
    renderer.domElement.style.cursor = pick(e) ? 'pointer' : 'grab';
  });

  // ---- Render loop ------------------------------------------------------
  let visible = true, needsRender = true, running = false, idleFrames = 0;
  function requestRender() { needsRender = true; if (!running && visible) loop(); }
  new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; if (visible) requestRender(); }).observe(stage);

  function resize() {
    const { width, height } = stage.getBoundingClientRect();
    if (!width || !height) return;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    const prevFit = fitDist;
    fitDist = HOME.length() * Math.max(1, 1.4 / camera.aspect);
    distTarget *= fitDist / prevFit;
    requestRender();
  }
  new ResizeObserver(resize).observe(stage);

  const tmp = new Vector3();
  function loop() {
    running = true;
    const k = reduceMotion.matches ? 1 : 0.09;
    if (Math.abs(explode - explodeTarget) > 0.001) { explode += (explodeTarget - explode) * k; needsRender = true; }
    else explode = explodeTarget;
    for (const list of Object.values(parts)) for (const { group, offset } of list) group.position.copy(offset).multiplyScalar(explode);
    car.position.y = 0.3 * explode; // lift so the dropped floor stays above the ground

    if (homeTween) {
      tmp.copy(HOME).normalize().multiplyScalar(camera.position.distanceTo(controls.target));
      camera.position.lerp(tmp.add(controls.target), k * 1.2);
      if (camera.position.distanceTo(tmp) < 0.01) homeTween = 0;
      needsRender = true;
    }
    if (Math.abs(dist - distTarget) > 0.001) {
      dist += (distTarget - dist) * k;
      tmp.copy(camera.position).sub(controls.target).setLength(dist);
      camera.position.copy(controls.target).add(tmp);
      needsRender = true;
    }
    if (controls.update()) needsRender = true;

    if (needsRender) {
      renderer.render(scene, camera);
      placeLabels();
      needsRender = false;
      idleFrames = 0;
    } else idleFrames++;
    // keep ticking while anything moves (damping settles over a few frames), then sleep
    if (visible && (controls.autoRotate || idleFrames < 20)) requestAnimationFrame(loop);
    else running = false;
  }

  function placeLabels() {
    const w = renderer.domElement.clientWidth, h = renderer.domElement.clientHeight;
    for (const [k, anchor] of Object.entries(anchors)) {
      // follow the piece the pin points at when the car comes apart
      const o = k === 'suspension' ? parts[k].find(p => p.offset.x < 0).offset
        : k === 'sidepods' ? parts[k].find(p => p.offset.x > 0).offset
        : parts[k][0].offset;
      tmp.copy(anchor).addScaledVector(o, explode);
      car.localToWorld(tmp).project(camera);
      const el = labelEls[k];
      el.style.transform = `translate(${((tmp.x + 1) / 2) * w}px, ${((1 - tmp.y) / 2) * h}px)`;
      el.classList.toggle('is-behind', tmp.z > 1);
    }
  }

  reduceMotion.addEventListener?.('change', () => { controls.autoRotate = !reduceMotion.matches && !stage.classList.contains('touched'); requestRender(); });
  resize();
  applySelection(null);
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
else init();

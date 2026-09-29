/**
 * WebGL Brunswick-style table. Real meshes, lighting, and materials —
 * not a painted 2D diagram. Units match the 2D bed: x 0–100, z 0–50, y up.
 */
import * as THREE from '../vendor/three.module.js';

const BALL_HEX = {
  cue: '#f4f6f8',
  1: '#f0d34a', 2: '#2f6fe0', 3: '#e23b3b', 4: '#6d38c9', 5: '#f08a2a', 6: '#1e9a45', 7: '#8a4b12',
  8: '#111418',
  9: '#e2b423', 10: '#2457c9', 11: '#c42828', 12: '#5b27b0', 13: '#d86a18', 14: '#147a38', 15: '#7a3e0c'
};

const POCKETS = [
  [0, 0, 2.55], [100, 0, 2.55], [0, 50, 2.55], [100, 50, 2.55],
  [50, 0, 2.7], [50, 50, 2.7]
];

let world = null;

function texFromCanvas(draw, size = 512) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  draw(c.getContext('2d'), size);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}

function feltMaps() {
  const map = texFromCanvas((g, n) => {
    g.fillStyle = '#1c6b3a';
    g.fillRect(0, 0, n, n);
    for (let i = 0; i < 9000; i++) {
      const x = Math.random() * n;
      const y = Math.random() * n;
      g.fillStyle = Math.random() > 0.5 ? 'rgba(8,40,18,.18)' : 'rgba(210,230,190,.07)';
      g.fillRect(x, y, 1.2, 2.4);
    }
    g.fillStyle = 'rgba(0,20,8,.12)';
    g.fillRect(0, 0, n, n);
  });
  map.repeat.set(6, 3);
  const rough = texFromCanvas((g, n) => {
    g.fillStyle = '#888';
    g.fillRect(0, 0, n, n);
    for (let i = 0; i < 5000; i++) {
      g.fillStyle = `rgb(${120 + Math.random() * 80|0},${120 + Math.random() * 80|0},${120 + Math.random() * 80|0})`;
      g.fillRect(Math.random() * n, Math.random() * n, 2, 2);
    }
  });
  rough.repeat.set(6, 3);
  return { map, rough };
}

function woodMap() {
  const t = texFromCanvas((g, n) => {
    const grd = g.createLinearGradient(0, 0, n, 0);
    grd.addColorStop(0, '#2a1810');
    grd.addColorStop(0.4, '#4a2c18');
    grd.addColorStop(0.7, '#311c10');
    grd.addColorStop(1, '#1a1008');
    g.fillStyle = grd;
    g.fillRect(0, 0, n, n);
    g.strokeStyle = 'rgba(0,0,0,.28)';
    for (let i = 0; i < 40; i++) {
      g.beginPath();
      const y = (i / 40) * n + Math.sin(i) * 4;
      g.moveTo(0, y);
      g.quadraticCurveTo(n * 0.5, y + 6, n, y - 3);
      g.stroke();
    }
  });
  t.repeat.set(2, 1);
  return t;
}

function ballTexture(id) {
  const hex = BALL_HEX[id] || '#94a3b8';
  const stripe = Number(id) >= 9;
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const g = c.getContext('2d');
  g.fillStyle = stripe ? '#f4f6f8' : hex;
  g.fillRect(0, 0, 256, 256);
  if (stripe) {
    g.fillStyle = hex;
    g.fillRect(0, 78, 256, 100);
  }
  if (id !== 'cue') {
    g.beginPath();
    g.fillStyle = '#f7f8fa';
    g.arc(128, 128, 46, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = '#111';
    g.font = 'bold 52px sans-serif';
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText(String(id), 128, 132);
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function feltShape() {
  const geo = new THREE.PlaneGeometry(100, 50, 1, 1);
  geo.rotateX(-Math.PI / 2);
  return geo;
}

function box(w, h, d, mat) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}

function buildScene() {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#1a1612');
  scene.fog = new THREE.Fog('#1a1612', 90, 180);

  const hemi = new THREE.HemisphereLight('#e8dcc8', '#2a1c12', 1.15);
  scene.add(hemi);
  const key = new THREE.DirectionalLight('#fff6e4', 3.4);
  key.position.set(22, 52, 12);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  key.shadow.camera.left = -70;
  key.shadow.camera.right = 70;
  key.shadow.camera.top = 50;
  key.shadow.camera.bottom = -50;
  scene.add(key);
  const lamp = new THREE.SpotLight('#ffe6b8', 32, 180, 0.7, 0.4, 1);
  lamp.position.set(50, 46, 25);
  lamp.target.position.set(50, 0, 25);
  lamp.castShadow = true;
  scene.add(lamp);
  scene.add(lamp.target);
  scene.add(new THREE.AmbientLight('#4a3c30', 0.55));

  const wood = new THREE.MeshStandardMaterial({
    map: woodMap(),
    color: '#5a3a24',
    roughness: 0.42,
    metalness: 0.04
  });
  const leather = new THREE.MeshStandardMaterial({ color: '#140c08', roughness: 0.92, metalness: 0 });
  const rubber = new THREE.MeshStandardMaterial({ color: '#0d4a28', roughness: 0.7, metalness: 0 });
  const { map, rough } = feltMaps();
  const cloth = new THREE.MeshStandardMaterial({
    map,
    roughnessMap: rough,
    color: '#48c46a',
    roughness: 0.78,
    metalness: 0,
    emissive: '#0a3a18',
    emissiveIntensity: 0.15
  });

  const felt = new THREE.Mesh(feltShape(), cloth);
  felt.position.set(50, 0.04, 25);
  felt.receiveShadow = true;
  felt.name = 'felt';
  scene.add(felt);

  for (const [x, z, r] of POCKETS) {
    const well = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.96, r * 1.05, 5.5, 24, 1, true), leather);
    well.position.set(x, -2.6, z);
    scene.add(well);
    const floor = new THREE.Mesh(new THREE.CircleGeometry(r * 1.02, 20), leather);
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(x, -5.3, z);
    scene.add(floor);
  }

  const apron = box(111, 6.4, 61, wood);
  apron.position.set(50, -3.4, 25);
  scene.add(apron);

  const railH = 2.15;
  const railY = 1.05;
  const segs = [
    [24.8, 4.4, 5.6, 22.4, -2.2],
    [24.8, 4.4, 77.6, 22.4, -2.2],
    [24.8, 4.4, 22.4, 22.4, 52.2],
    [24.8, 4.4, 77.6, 22.4, 52.2],
    [4.4, 15.2, -2.2, railH, 14.2],
    [4.4, 15.2, -2.2, railH, 35.8],
    [4.4, 15.2, 102.2, railH, 14.2],
    [4.4, 15.2, 102.2, railH, 35.8]
  ];
  // simpler rail boxes
  const rails = [
    { w: 39, h: railH, d: 4.6, x: 24.5, z: -2.25 },
    { w: 39, h: railH, d: 4.6, x: 75.5, z: -2.25 },
    { w: 39, h: railH, d: 4.6, x: 24.5, z: 52.25 },
    { w: 39, h: railH, d: 4.6, x: 75.5, z: 52.25 },
    { w: 4.6, h: railH, d: 16, x: -2.25, z: 13 },
    { w: 4.6, h: railH, d: 16, x: -2.25, z: 37 },
    { w: 4.6, h: railH, d: 16, x: 102.25, z: 13 },
    { w: 4.6, h: railH, d: 16, x: 102.25, z: 37 }
  ];
  for (const r of rails) {
    const m = box(r.w, r.h, r.d, wood);
    m.position.set(r.x, railY, r.z);
    scene.add(m);
  }
  const cushions = [
    { w: 38, h: 1.05, d: 1.15, x: 24.5, z: 0.45 },
    { w: 38, h: 1.05, d: 1.15, x: 75.5, z: 0.45 },
    { w: 38, h: 1.05, d: 1.15, x: 24.5, z: 49.55 },
    { w: 38, h: 1.05, d: 1.15, x: 75.5, z: 49.55 },
    { w: 1.15, h: 1.05, d: 15, x: 0.45, z: 13 },
    { w: 1.15, h: 1.05, d: 15, x: 0.45, z: 37 },
    { w: 1.15, h: 1.05, d: 15, x: 99.55, z: 13 },
    { w: 1.15, h: 1.05, d: 15, x: 99.55, z: 37 }
  ];
  for (const r of cushions) {
    const m = box(r.w, r.h, r.d, rubber);
    m.position.set(r.x, 0.55, r.z);
    scene.add(m);
  }

  const sight = new THREE.MeshStandardMaterial({ color: '#e8e0d2', roughness: 0.35, metalness: 0.15 });
  for (const x of [12.5, 25, 37.5, 62.5, 75, 87.5]) {
    for (const z of [-2.15, 52.15]) {
      const d = new THREE.Mesh(new THREE.SphereGeometry(0.28, 10, 8), sight);
      d.position.set(x, 2.05, z);
      scene.add(d);
    }
  }

  const ballGroup = new THREE.Group();
  ballGroup.name = 'balls';
  scene.add(ballGroup);

  const cue = new THREE.Mesh(
    new THREE.CylinderGeometry(0.22, 0.38, 28, 12),
    new THREE.MeshStandardMaterial({ color: '#c9a06a', roughness: 0.45 })
  );
  cue.rotation.z = Math.PI / 2;
  cue.position.set(8, 1.1, 25);
  cue.name = 'stick';
  scene.add(cue);

  return { scene, felt, ballGroup, cue };
}

function placeCamera(cam, yaw, pitch) {
  const look = new THREE.Vector3(52, 0.4, 25);
  cam.position.set(-16 + yaw * 8, 17 + pitch * 0.5, 25 + yaw * 16);
  cam.lookAt(look);
}

export function renderTable3D(canvas, { balls = [], ballR = 1.125, yaw = 0, pitch = 0 } = {}) {
  const w = canvas.clientWidth || canvas.width || 400;
  const h = canvas.clientHeight || canvas.height || 400;
  if (!world || world.canvas !== canvas) {
    if (world?.renderer) world.renderer.dispose();
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
    renderer.shadowMap.enabled = true;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.45;
    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    const camera = new THREE.PerspectiveCamera(42, w / h, 0.4, 240);
    const built = buildScene();
    world = { canvas, renderer, camera, ray: new THREE.Raycaster(), ...built, ballMeshes: new Map() };
  }
  const W = Math.max(2, Math.floor(w));
  const H = Math.max(2, Math.floor(h));
  world.renderer.setSize(W, H, false);
  world.camera.aspect = W / H;
  world.camera.updateProjectionMatrix();
  placeCamera(world.camera, yaw, pitch);

  const seen = new Set();
  for (const b of balls) {
    const id = String(b.id);
    seen.add(id);
    let mesh = world.ballMeshes.get(id);
    if (!mesh) {
      const mat = new THREE.MeshStandardMaterial({
        map: ballTexture(b.id),
        roughness: id === 'cue' ? 0.18 : 0.28,
        metalness: 0.04
      });
      mesh = new THREE.Mesh(new THREE.SphereGeometry(ballR, 32, 24), mat);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.userData.id = b.id;
      world.ballGroup.add(mesh);
      world.ballMeshes.set(id, mesh);
    }
    mesh.position.set(b.x, ballR, b.y);
    mesh.visible = true;
  }
  for (const [id, mesh] of world.ballMeshes) {
    if (!seen.has(id)) mesh.visible = false;
  }
  const cueBall = balls.find((b) => b.id === 'cue');
  if (cueBall && world.cue) {
    world.cue.position.set(cueBall.x - 14, 1.05, cueBall.y);
    world.cue.visible = true;
  }
  world.renderer.render(world.scene, world.camera);
}

export function drawTable3D(ctxOrCanvas, w, h, opts) {
  const canvas = ctxOrCanvas?.canvas || ctxOrCanvas;
  if (!canvas || !canvas.getContext) return;
  renderTable3D(canvas, opts);
}

export function pickBall3D(sx, sy, w, h, balls, ballR, yaw, pitch) {
  if (!world) return null;
  const ndc = new THREE.Vector2((sx / w) * 2 - 1, -(sy / h) * 2 + 1);
  world.ray.setFromCamera(ndc, world.camera);
  const hits = world.ray.intersectObjects([...world.ballMeshes.values()].filter((m) => m.visible), false);
  return hits[0]?.object?.userData?.id ?? null;
}

export function feltFromScreen3D(sx, sy, w, h, yaw, pitch, ballR = 1.125) {
  if (!world) return null;
  const ndc = new THREE.Vector2((sx / w) * 2 - 1, -(sy / h) * 2 + 1);
  world.ray.setFromCamera(ndc, world.camera);
  const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -ballR);
  const hit = new THREE.Vector3();
  if (!world.ray.ray.intersectPlane(plane, hit)) return null;
  return { x: hit.x, y: hit.z };
}

export function cameraBehind() {
  return { x: -16, y: 17, z: 25 };
}

export function project() {
  return null;
}

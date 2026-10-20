// ============ Models: shared helpers, bunny, humans, disguise props, burrow, icons ============
// Every model faces +Z. Rotate a group with rotation.y = atan2(dirX, dirZ) to face a direction.

const MatCache = new Map();
function mat(color, opts) {
  const key = color + (opts ? JSON.stringify(opts) : '');
  let m = MatCache.get(key);
  if (!m) { m = new THREE.MeshLambertMaterial(Object.assign({ color }, opts || {})); MatCache.set(key, m); }
  return m;
}
const GeoCache = new Map();
function geo(kind, ...args) {
  const key = kind + ':' + args.join(',');
  let g = GeoCache.get(key);
  if (!g) { g = new THREE[kind](...args); GeoCache.set(key, g); }
  return g;
}
function part(g, color, x, y, z, parent, opts) {
  const m = new THREE.Mesh(g, mat(color, opts));
  m.position.set(x || 0, y || 0, z || 0);
  if (parent) parent.add(m);
  return m;
}
const box = (p, w, h, d, c, x, y, z) => part(geo('BoxGeometry', w, h, d), c, x, y, z, p);
const ball = (p, r, c, x, y, z, seg = 10) => part(geo('SphereGeometry', r, seg, Math.max(6, (seg * 0.75) | 0)), c, x, y, z, p);
const cyl = (p, rt, rb, h, c, x, y, z, seg = 12) => part(geo('CylinderGeometry', rt, rb, h, seg), c, x, y, z, p);
const cone = (p, r, h, c, x, y, z, seg = 10) => part(geo('ConeGeometry', r, h, seg), c, x, y, z, p);

// ---------- Bunny (simple fallback; the Blender model in 02b replaces it) ----------
function makeBunnyBasic() {
  const g = new THREE.Group();
  const body = new THREE.Group(); g.add(body);
  const W = 0xf4f0e8, P = 0xf2a7b5, K = 0x22222e;
  ball(body, 0.3, W, 0, 0.3, 0, 12).scale.set(1, 0.95, 1.15);
  ball(body, 0.23, W, 0, 0.63, 0.17, 12);
  const ears = [];
  for (const s of [-1, 1]) {
    const ear = new THREE.Group();
    ear.position.set(s * 0.09, 0.8, 0.1); ear.rotation.z = -s * 0.2; ear.rotation.x = -0.18;
    body.add(ear); ears.push(ear);
    ball(ear, 0.075, W, 0, 0.22, 0).scale.set(1, 3.4, 0.6);
    ball(ear, 0.05, P, 0, 0.22, 0.03).scale.set(0.75, 3.0, 0.4);
    ball(body, 0.1, W, s * 0.14, 0.06, 0.24).scale.set(1, 0.6, 1.5);
  }
  // burglar mask band with eyes
  const band = part(geo('TorusGeometry', 0.226, 0.045, 6, 20), K, 0, 0.67, 0.17, body);
  band.rotation.x = Math.PI / 2;
  for (const s of [-1, 1]) {
    const a = s * 0.42;
    ball(body, 0.052, 0xffffff, Math.sin(a) * 0.255, 0.675, 0.17 + Math.cos(a) * 0.255, 8);
    ball(body, 0.028, K, Math.sin(a) * 0.29, 0.675, 0.17 + Math.cos(a) * 0.29, 6);
  }
  ball(body, 0.035, P, 0, 0.58, 0.4, 6);
  ball(body, 0.1, W, 0, 0.36, -0.34, 8);
  const sack = ball(body, 0.22, 0x9b7448, 0, 0.5, -0.34, 8);
  sack.visible = false;
  g.userData = { kind: 'bunny', body, ears, sack };
  return g;
}

// ---------- Humans ----------
const PEOPLE = [
  { name: 'Dad', shirt: 0x4f7cc9, pants: 0x2c3e66, skin: 0xf0c7a0, hair: 0x5a3a22, style: 'short' },
  { name: 'Mom', shirt: 0xd96a8a, pants: 0x7a3550, skin: 0xe8b48f, hair: 0x2a1a12, style: 'long' },
  { name: 'Grandma', shirt: 0x9a7fc7, pants: 0x5b4a80, skin: 0xf2d0b5, hair: 0xe4e4e4, style: 'bun' },
  { name: 'Teen', shirt: 0x58b368, pants: 0x333344, skin: 0xc98e66, hair: 0x1c1c1c, style: 'cap', cap: 0xd94a3a },
  { name: 'Uncle Bob', shirt: 0xe0a23a, pants: 0x6b4b2a, skin: 0xd9a07a, hair: 0x8a5a2b, style: 'bald' },
  { name: 'Aunt Lou', shirt: 0x3fb3b0, pants: 0x235e6b, skin: 0x8d5a3c, hair: 0x111111, style: 'afro' },
];

function makeHumanBasic(p) {
  const g = new THREE.Group();
  const legs = [], arms = [];
  for (const s of [-1, 1]) {
    const leg = new THREE.Group(); leg.position.set(s * 0.12, 0.85, 0); g.add(leg); legs.push(leg);
    box(leg, 0.18, 0.82, 0.2, p.pants, 0, -0.41, 0);
    box(leg, 0.21, 0.09, 0.32, 0xf3e6c8, 0, -0.82, 0.05); // fuzzy slippers
    const arm = new THREE.Group(); arm.position.set(s * 0.34, 1.48, 0); g.add(arm); arms.push(arm);
    box(arm, 0.14, 0.56, 0.15, p.shirt, 0, -0.27, 0);
    ball(arm, 0.08, p.skin, 0, -0.6, 0, 6);
  }
  box(g, 0.54, 0.68, 0.3, p.shirt, 0, 1.2, 0);
  box(g, 0.55, 0.06, 0.31, 0xffffff, 0, 1.12, 0); // pajama stripe
  ball(g, 0.21, p.skin, 0, 1.76, 0, 12);
  for (const s of [-1, 1]) ball(g, 0.03, 0x1a1a22, s * 0.075, 1.79, 0.19, 6);
  ball(g, 0.035, p.skin, 0, 1.73, 0.21, 6);
  if (p.style === 'short') { const h = ball(g, 0.22, p.hair, 0, 1.83, -0.02, 10); h.scale.set(1, 0.6, 1); }
  if (p.style === 'long') { const h = ball(g, 0.23, p.hair, 0, 1.8, -0.05, 10); h.scale.set(1.05, 0.85, 1); box(g, 0.4, 0.4, 0.12, p.hair, 0, 1.55, -0.14); }
  if (p.style === 'bun') { const h = ball(g, 0.22, p.hair, 0, 1.84, -0.03, 10); h.scale.set(1, 0.6, 1); ball(g, 0.11, p.hair, 0, 1.98, -0.12, 8); }
  if (p.style === 'cap') { const h = cyl(g, 0.22, 0.23, 0.12, p.cap, 0, 1.9, 0); box(g, 0.3, 0.03, 0.2, p.cap, 0, 1.86, 0.25); h.rotation.x = -0.05; }
  if (p.style === 'afro') ball(g, 0.3, p.hair, 0, 1.88, -0.04, 10);
  g.userData = { kind: 'human', legs, arms };
  return g;
}

function animateWalk(model, phase, amount) {
  const a = model.userData;
  if (!a.legs) return;
  const s = Math.sin(phase) * 0.7 * amount;
  a.legs[0].rotation.x = s; a.legs[1].rotation.x = -s;
  a.arms[0].rotation.x = -s * 0.8; a.arms[1].rotation.x = s * 0.8;
}

// ---------- Disguise props (also used as the player's shape) ----------
const PROPS = {
  box: { name: 'Cardboard Box', speed: 3.0, cap: 6, radius: 0.42, w: 0.75, d: 0.75, build() {
    const g = new THREE.Group();
    box(g, 0.75, 0.62, 0.75, 0xc49a62, 0, 0.31, 0);
    box(g, 0.77, 0.03, 0.14, 0xe8d3a8, 0, 0.62, 0);
    box(g, 0.2, 0.2, 0.01, 0xffffff, 0.18, 0.35, 0.38); // shipping label
    return g; } },
  bin: { name: 'Trash Bin', speed: 2.7, cap: 8, radius: 0.36, w: 0.62, d: 0.62, build() {
    const g = new THREE.Group();
    cyl(g, 0.31, 0.26, 0.82, 0x6f7f8c, 0, 0.41, 0);
    cyl(g, 0.34, 0.34, 0.06, 0x56636e, 0, 0.84, 0);
    box(g, 0.2, 0.05, 0.05, 0x3f4952, 0, 0.9, 0);
    return g; } },
  plant: { name: 'Potted Plant', speed: 3.2, cap: 3, radius: 0.34, w: 0.6, d: 0.6, build() {
    const g = new THREE.Group();
    cyl(g, 0.26, 0.2, 0.42, 0xc0643f, 0, 0.21, 0);
    part(geo('IcosahedronGeometry', 0.4, 0), 0x4c9a52, 0, 0.82, 0, g);
    part(geo('IcosahedronGeometry', 0.26, 0), 0x63b86a, 0.15, 1.08, 0.05, g);
    return g; } },
  lamp: { name: 'Floor Lamp', speed: 3.6, cap: 2, radius: 0.3, w: 0.5, d: 0.5, build() {
    const g = new THREE.Group();
    cyl(g, 0.22, 0.24, 0.06, 0x333333, 0, 0.03, 0);
    cyl(g, 0.03, 0.03, 1.45, 0x444444, 0, 0.75, 0, 6);
    cyl(g, 0.16, 0.3, 0.38, 0xfff1c4, 0, 1.55, 0, 12).material = mat(0xfff1c4, { emissive: 0x806a30 });
    return g; } },
  basket: { name: 'Laundry Basket', speed: 3.3, cap: 5, radius: 0.38, w: 0.7, d: 0.7, build() {
    const g = new THREE.Group();
    cyl(g, 0.36, 0.3, 0.5, 0xd9c08a, 0, 0.25, 0);
    ball(g, 0.18, 0x6aa0e0, -0.1, 0.48, 0.05, 6); ball(g, 0.16, 0xe07a7a, 0.12, 0.5, -0.05, 6); ball(g, 0.14, 0xf0f0f0, 0, 0.53, 0.12, 6);
    return g; } },
  teddy: { name: 'Giant Teddy', speed: 3.0, cap: 4, radius: 0.4, w: 0.8, d: 0.7, build() {
    const g = new THREE.Group(); const B = 0xa8743f;
    ball(g, 0.38, B, 0, 0.4, 0, 10).scale.set(1, 1.05, 0.9);
    ball(g, 0.27, B, 0, 0.98, 0.02, 10);
    for (const s of [-1, 1]) { ball(g, 0.1, B, s * 0.2, 1.2, 0, 6); ball(g, 0.14, B, s * 0.33, 0.12, 0.2, 6); ball(g, 0.12, B, s * 0.38, 0.55, 0.08, 6); ball(g, 0.03, 0x1a1a1a, s * 0.09, 1.03, 0.25, 6); }
    ball(g, 0.11, 0xe8c9a0, 0, 0.93, 0.24, 8);
    ball(g, 0.035, 0x1a1a1a, 0, 0.97, 0.34, 6);
    box(g, 0.32, 0.08, 0.06, 0xd9465a, 0, 0.74, 0.22); // bow tie
    return g; } },
};

// ---------- Burrow (stash + exit) ----------
function makeBurrowBasic() {
  const g = new THREE.Group();
  const mound = ball(g, 1.0, 0x6b4a2e, 0, -0.35, 0, 12); mound.scale.set(1.4, 0.6, 1.2);
  const hole = part(geo('CircleGeometry', 0.55, 16), 0x120c08, 0, 0.27, 0.35, g);
  hole.rotation.x = -Math.PI / 2 + 0.5;
  for (let i = 0; i < 5; i++) {
    const a = -1.2 + i * 0.6;
    const c = cone(g, 0.06, 0.3, 0xff8c42, Math.cos(a) * 1.6, 0.05, Math.sin(a) * 1.5 + 0.2, 6);
    c.rotation.x = Math.PI;
    cone(g, 0.08, 0.2, 0x4ea84e, Math.cos(a) * 1.6, 0.27, Math.sin(a) * 1.5 + 0.2, 5);
  }
  // little signpost
  cyl(g, 0.04, 0.04, 1.2, 0x8a6a48, -1.2, 0.6, -0.5, 6);
  box(g, 0.7, 0.32, 0.05, 0xd8b98a, -1.2, 1.1, -0.47);
  return g;
}

// ---------- Text icons above heads (cached canvas sprites) ----------
const IconCache = {};
function iconSprite(text, color) {
  const key = text + color;
  if (!IconCache[key]) {
    const c = document.createElement('canvas'); c.width = c.height = 128;
    const x = c.getContext('2d');
    x.fillStyle = 'rgba(14,16,36,.85)'; x.beginPath(); x.arc(64, 64, 56, 0, Math.PI * 2); x.fill();
    x.fillStyle = color; x.font = 'bold 84px Arial Black, Arial, sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle';
    x.fillText(text, 64, 70);
    IconCache[key] = new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(c), depthTest: false, transparent: true });
  }
  const s = new THREE.Sprite(IconCache[key]);
  s.scale.set(0.7, 0.7, 1); s.renderOrder = 10;
  return s;
}

// Soft dark blob under characters (cheap fake shadow)
function blobShadow(r) {
  const m = new THREE.Mesh(geo('CircleGeometry', r, 16), mat(0x000000, { transparent: true, opacity: 0.28, depthWrite: false }));
  m.rotation.x = -Math.PI / 2; m.position.y = 0.02;
  return m;
}

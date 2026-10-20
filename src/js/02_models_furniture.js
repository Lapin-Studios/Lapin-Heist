// ============ Models: furniture and loot ============
// Furniture builders return { obj, w, d, h, surf }: w along local X, d along local Z,
// back edge at -Z (goes against a wall). surf = top height loot can sit on (0 = none).

const FURN_NAMES = {
  bed: 'Bed', kidbed: "Kid's Bed", couch: 'Couch', armchair: 'Armchair', table: 'Table', coffeeTable: 'Coffee Table',
  diningTable: 'Dining Table', desk: 'Desk', nightstand: 'Nightstand', dresser: 'Dresser', wardrobe: 'Wardrobe',
  bookshelf: 'Bookshelf', tvStand: 'TV Stand', counter: 'Kitchen Counter', stove: 'Stove', fridge: 'Fridge',
  bathtub: 'Bathtub', toilet: 'Toilet', sink: 'Sink', toyChest: 'Toy Chest', pedestal: 'Pedestal',
  sideboard: 'Sideboard', piano: 'Piano', workbench: 'Workbench', rug: 'Rug',
};
const WOOD = [0x8a5a3c, 0xa8744a, 0x6e4a32, 0xb98a5e];
const FABRIC = [0x6a8fd8, 0xd87a6a, 0x7ac29a, 0xc7a0e0, 0xe0b65a, 0x5ab5b0];

const FURN = {
  bed() { const g = new THREE.Group(), wd = R.pick(WOOD), c = R.pick(FABRIC);
    box(g, 1.9, 0.35, 2.3, wd, 0, 0.18, 0); box(g, 1.8, 0.22, 2.2, 0xf5f1e6, 0, 0.46, 0);
    box(g, 1.84, 0.12, 1.45, c, 0, 0.6, 0.38); box(g, 1.9, 0.95, 0.12, wd, 0, 0.5, -1.1);
    box(g, 0.62, 0.14, 0.36, 0xffffff, -0.43, 0.62, -0.82); box(g, 0.62, 0.14, 0.36, 0xffffff, 0.43, 0.62, -0.82);
    return { obj: g, w: 1.9, d: 2.3, h: 0.7, surf: 0 }; },
  kidbed() { const g = new THREE.Group(), c = R.pick(FABRIC);
    box(g, 1.1, 0.3, 1.9, 0xf0f0f0, 0, 0.15, 0); box(g, 1.04, 0.18, 1.84, c, 0, 0.38, 0.05); box(g, 1.1, 0.7, 0.1, c, 0, 0.35, -0.92);
    ball(g, 0.15, 0xffe066, 0.3, 0.55, -0.6, 6);
    return { obj: g, w: 1.1, d: 1.9, h: 0.5, surf: 0 }; },
  couch() { const g = new THREE.Group(), c = R.pick(FABRIC);
    box(g, 2.2, 0.45, 0.9, c, 0, 0.22, 0); box(g, 2.2, 0.55, 0.25, c, 0, 0.7, -0.33);
    box(g, 0.22, 0.35, 0.9, c, -1.0, 0.6, 0); box(g, 0.22, 0.35, 0.9, c, 1.0, 0.6, 0);
    box(g, 0.8, 0.12, 0.6, 0xffffff, -0.45, 0.5, 0.05).material = mat(c, { emissive: 0x111111 });
    return { obj: g, w: 2.2, d: 0.9, h: 0.9, surf: 0 }; },
  armchair() { const g = new THREE.Group(), c = R.pick(FABRIC);
    box(g, 0.95, 0.45, 0.85, c, 0, 0.22, 0); box(g, 0.95, 0.55, 0.22, c, 0, 0.7, -0.31);
    box(g, 0.18, 0.3, 0.85, c, -0.39, 0.55, 0); box(g, 0.18, 0.3, 0.85, c, 0.39, 0.55, 0);
    return { obj: g, w: 0.95, d: 0.85, h: 0.9, surf: 0 }; },
  table(w = 1.6, d = 1.0, h = 0.78) { const g = new THREE.Group(), wd = R.pick(WOOD);
    box(g, w, 0.07, d, wd, 0, h, 0);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) box(g, 0.08, h, 0.08, wd, sx * (w / 2 - 0.08), h / 2, sz * (d / 2 - 0.08));
    return { obj: g, w, d, h, surf: h + 0.04 }; },
  coffeeTable() { return FURN.table(1.2, 0.6, 0.42); },
  diningTable() { const t = FURN.table(2.2, 1.1, 0.78);
    for (const sx of [-0.6, 0.6]) for (const sz of [-1, 1]) { box(t.obj, 0.42, 0.06, 0.42, 0x8a5a3c, sx, 0.45, sz * 0.82); box(t.obj, 0.42, 0.5, 0.06, 0x8a5a3c, sx, 0.72, sz * 1.02); }
    t.d = 2.2; return t; },
  desk() { const t = FURN.table(1.4, 0.7, 0.78); box(t.obj, 0.45, 0.6, 0.6, 0x6e4a32, 0.42, 0.4, 0); return t; },
  nightstand() { const g = new THREE.Group(), wd = R.pick(WOOD);
    box(g, 0.5, 0.55, 0.45, wd, 0, 0.27, 0); box(g, 0.4, 0.05, 0.02, 0xd9c08a, 0, 0.35, 0.23);
    return { obj: g, w: 0.5, d: 0.45, h: 0.55, surf: 0.56 }; },
  dresser() { const g = new THREE.Group(), wd = R.pick(WOOD);
    box(g, 1.3, 1.0, 0.5, wd, 0, 0.5, 0);
    for (let i = 0; i < 3; i++) box(g, 1.2, 0.26, 0.02, 0xffffff, 0, 0.2 + i * 0.3, 0.25).material = mat(wd, { emissive: 0x161008 });
    return { obj: g, w: 1.3, d: 0.5, h: 1.0, surf: 1.01 }; },
  wardrobe() { const g = new THREE.Group(), wd = R.pick(WOOD);
    box(g, 1.4, 2.1, 0.6, wd, 0, 1.05, 0); box(g, 0.02, 1.9, 0.02, 0x222222, 0, 1.05, 0.31);
    return { obj: g, w: 1.4, d: 0.6, h: 2.1, surf: 0 }; },
  bookshelf() { const g = new THREE.Group(), wd = R.pick(WOOD);
    box(g, 1.4, 2.0, 0.4, wd, 0, 1.0, 0);
    for (let s = 0; s < 4; s++) for (let b = 0; b < 7; b++) if (R.chance(0.8))
      box(g, 0.14, 0.3 + R.f(0, 0.08), 0.3, R.pick(FABRIC), -0.55 + b * 0.18, 0.35 + s * 0.47, 0.06);
    return { obj: g, w: 1.4, d: 0.4, h: 2.0, surf: 0 }; },
  tvStand() { const g = new THREE.Group();
    box(g, 1.7, 0.5, 0.5, 0x3a3a44, 0, 0.25, 0);
    return { obj: g, w: 1.7, d: 0.5, h: 0.5, surf: 0.51 }; },
  counter() { const g = new THREE.Group();
    box(g, 2.2, 0.9, 0.7, 0xe8e2d4, 0, 0.45, 0); box(g, 2.26, 0.06, 0.74, 0x5b6470, 0, 0.93, 0);
    for (let i = 0; i < 3; i++) box(g, 0.25, 0.03, 0.02, 0x999999, -0.7 + i * 0.7, 0.75, 0.36);
    return { obj: g, w: 2.2, d: 0.7, h: 0.96, surf: 0.97 }; },
  stove() { const g = new THREE.Group();
    box(g, 0.9, 0.9, 0.7, 0xf2f2f2, 0, 0.45, 0); box(g, 0.7, 0.4, 0.02, 0x222222, 0, 0.45, 0.36);
    for (const x of [-0.2, 0.2]) for (const z of [-0.15, 0.15]) cyl(g, 0.11, 0.11, 0.02, 0x333333, x, 0.91, z);
    return { obj: g, w: 0.9, d: 0.7, h: 0.92, surf: 0 }; },
  fridge() { const g = new THREE.Group();
    box(g, 0.9, 2.0, 0.75, 0xdfe7ee, 0, 1.0, 0); box(g, 0.04, 0.5, 0.04, 0x999999, 0.32, 1.3, 0.39);
    box(g, 0.12, 0.12, 0.01, 0xe05a5a, -0.2, 1.5, 0.38); box(g, 0.1, 0.14, 0.01, 0x5a8ae0, 0.05, 1.2, 0.38);
    return { obj: g, w: 0.9, d: 0.75, h: 2.0, surf: 0 }; },
  bathtub() { const g = new THREE.Group();
    box(g, 1.8, 0.6, 0.9, 0xffffff, 0, 0.3, 0); box(g, 1.6, 0.05, 0.7, 0x9fd3f0, 0, 0.56, 0);
    ball(g, 0.08, 0xffd23f, 0.4, 0.62, 0, 6);
    return { obj: g, w: 1.8, d: 0.9, h: 0.6, surf: 0 }; },
  toilet() { const g = new THREE.Group();
    box(g, 0.45, 0.6, 0.25, 0xffffff, 0, 0.55, -0.2); cyl(g, 0.22, 0.18, 0.42, 0xffffff, 0, 0.21, 0.08);
    return { obj: g, w: 0.5, d: 0.7, h: 0.8, surf: 0 }; },
  sink() { const g = new THREE.Group();
    box(g, 0.7, 0.85, 0.5, 0xe8e2d4, 0, 0.42, 0); box(g, 0.5, 0.04, 0.35, 0xbfe0f0, 0, 0.86, 0.02);
    box(g, 0.6, 0.7, 0.04, 0xcfe8f5, 0, 1.55, -0.23);
    return { obj: g, w: 0.7, d: 0.5, h: 0.88, surf: 0.89 }; },
  toyChest() { const g = new THREE.Group();
    box(g, 1.0, 0.55, 0.55, 0xe05a5a, 0, 0.27, 0); box(g, 1.04, 0.08, 0.6, 0xffd23f, 0, 0.58, 0);
    return { obj: g, w: 1.0, d: 0.55, h: 0.62, surf: 0.63 }; },
  pedestal() { const g = new THREE.Group();
    box(g, 0.6, 1.0, 0.6, 0xf0ece4, 0, 0.5, 0); box(g, 0.7, 0.06, 0.7, 0xd8d0c0, 0, 1.0, 0);
    return { obj: g, w: 0.7, d: 0.7, h: 1.03, surf: 1.04 }; },
  sideboard() { const g = new THREE.Group(), wd = R.pick(WOOD);
    box(g, 1.8, 0.85, 0.5, wd, 0, 0.42, 0);
    return { obj: g, w: 1.8, d: 0.5, h: 0.85, surf: 0.86 }; },
  piano() { const g = new THREE.Group();
    box(g, 1.5, 1.25, 0.6, 0x1c1c22, 0, 0.62, 0); box(g, 1.4, 0.06, 0.25, 0xffffff, 0, 0.75, 0.42);
    return { obj: g, w: 1.5, d: 0.85, h: 1.25, surf: 1.26 }; },
  workbench() { const t = FURN.table(2.0, 0.8, 0.9); box(t.obj, 1.8, 0.7, 0.04, 0x8f8f7a, 0, 1.4, -0.38); return t; },
  rug(w, d) { const g = new THREE.Group(), c = R.pick(FABRIC);
    box(g, w, 0.02, d, c, 0, 0.012, 0); box(g, w * 0.75, 0.022, d * 0.7, 0xf5efe0, 0, 0.014, 0);
    return { obj: g, w, d, h: 0, surf: 0, flat: true }; },
};

// ---------- Loot ----------
// size: slots it takes in your bag. wall: hangs on a wall instead of sitting on things.
const LOOT_TYPES = {
  watch: { name: 'Gold Watch', icon: '⌚', size: 1, min: 600, max: 1500 },
  ring: { name: 'Diamond Ring', icon: '💍', size: 1, min: 1800, max: 5200 },
  cash: { name: 'Stack of Cash', icon: '💵', size: 1, min: 150, max: 900 },
  phone: { name: 'Smartphone', icon: '📱', size: 1, min: 300, max: 900 },
  carrot: { name: 'Golden Carrot', icon: '🥕', size: 1, min: 6000, max: 9000 },
  duck: { name: 'Rubber Duck', icon: '🦆', size: 1, min: 2, max: 5 },
  sock: { name: 'Single Sock', icon: '🧦', size: 1, min: 0.5, max: 1 },
  teeth: { name: "Grandma's Teeth", icon: '🦷', size: 1, min: 15, max: 40 },
  laptop: { name: 'Laptop', icon: '💻', size: 2, min: 500, max: 1600 },
  vase: { name: 'Antique Vase', icon: '🏺', size: 2, min: 700, max: 3500 },
  console: { name: 'Game Console', icon: '🎮', size: 2, min: 300, max: 550 },
  trophy: { name: 'Bowling Trophy', icon: '🏆', size: 2, min: 20, max: 400 },
  clock: { name: 'Cuckoo Clock', icon: '🕰️', size: 2, min: 200, max: 900 },
  goldbar: { name: 'Gold Bars', icon: '🪙', size: 2, min: 4000, max: 7000 },
  cake: { name: 'Whole Birthday Cake', icon: '🎂', size: 2, min: 25, max: 60 },
  painting: { name: 'Oil Painting', icon: '🖼️', size: 3, min: 800, max: 12000, wall: true },
  tv: { name: 'Big TV', icon: '📺', size: 3, min: 400, max: 1400 },
  guitar: { name: 'Electric Guitar', icon: '🎸', size: 3, min: 300, max: 2200 },
};

function buildLootBasic(id) {
  const g = new THREE.Group();
  const GOLD = 0xffc93c;
  switch (id) {
    case 'watch': part(geo('TorusGeometry', 0.1, 0.03, 6, 14), GOLD, 0, 0.04, 0, g).rotation.x = Math.PI / 2; cyl(g, 0.07, 0.07, 0.04, 0xffffff, 0, 0.05, 0); break;
    case 'ring': part(geo('TorusGeometry', 0.07, 0.022, 6, 12), GOLD, 0, 0.09, 0, g); part(geo('OctahedronGeometry', 0.06, 0), 0x9fe8ff, 0, 0.18, 0, g); break;
    case 'cash': box(g, 0.32, 0.1, 0.16, 0x5cb85c, 0, 0.05, 0); box(g, 0.06, 0.11, 0.17, 0xf5f1e6, 0, 0.05, 0); break;
    case 'phone': box(g, 0.16, 0.025, 0.3, 0x222228, 0, 0.015, 0); box(g, 0.13, 0.01, 0.25, 0x4aa3ff, 0, 0.03, 0); break;
    case 'carrot': { const c = cone(g, 0.09, 0.45, GOLD, 0, 0.09, 0, 8); c.rotation.z = Math.PI / 2; c.material = mat(GOLD, { emissive: 0x664400 });
      for (const a of [-0.4, 0, 0.4]) { const l = cone(g, 0.04, 0.22, 0x4ea84e, -0.3, 0.12 + a * 0.1, a * 0.12, 5); l.rotation.z = Math.PI / 2 + a; } break; }
    case 'duck': ball(g, 0.12, 0xffd23f, 0, 0.11, 0, 8); ball(g, 0.08, 0xffd23f, 0, 0.25, 0.06, 8); cone(g, 0.035, 0.08, 0xff8c42, 0, 0.24, 0.16, 6).rotation.x = Math.PI / 2; break;
    case 'sock': box(g, 0.1, 0.3, 0.1, 0xe05a5a, 0, 0.05, 0).rotation.x = Math.PI / 2; box(g, 0.1, 0.1, 0.18, 0xffffff, 0, 0.05, 0.18); break;
    case 'teeth': box(g, 0.22, 0.06, 0.14, 0xf08aa0, 0, 0.03, 0); for (let i = 0; i < 4; i++) box(g, 0.04, 0.05, 0.04, 0xffffff, -0.075 + i * 0.05, 0.08, 0.05); break;
    case 'laptop': box(g, 0.5, 0.03, 0.36, 0x9aa3ad, 0, 0.015, 0); { const s = box(g, 0.5, 0.34, 0.02, 0x9aa3ad, 0, 0.18, -0.2); s.rotation.x = -0.25; box(s, 0.44, 0.28, 0.01, 0x4aa3ff, 0, 0, 0.012); } break;
    case 'vase': { const pts = [[0, 0], [0.13, 0], [0.2, 0.15], [0.17, 0.35], [0.08, 0.48], [0.11, 0.55]].map((p) => new THREE.Vector2(p[0], p[1]));
      part(geo('LatheGeometry', pts, 10), 0x3d6fd1, 0, 0, 0, g); cyl(g, 0.205, 0.205, 0.05, 0xffffff, 0, 0.16, 0); break; }
    case 'console': box(g, 0.36, 0.08, 0.26, 0x1c1c22, 0, 0.04, 0); box(g, 0.2, 0.05, 0.1, 0x333340, 0.25, 0.03, 0.15); box(g, 0.32, 0.01, 0.02, 0x4aa3ff, 0, 0.085, 0.1); break;
    case 'trophy': box(g, 0.2, 0.08, 0.2, 0x6e4a32, 0, 0.04, 0); cyl(g, 0.03, 0.03, 0.2, GOLD, 0, 0.18, 0, 6); cyl(g, 0.12, 0.05, 0.16, GOLD, 0, 0.36, 0); ball(g, 0.08, 0x222244, 0, 0.5, 0, 8); break;
    case 'clock': box(g, 0.3, 0.36, 0.14, 0x8a5a3c, 0, 0.18, 0); cone(g, 0.26, 0.16, 0x6e4a32, 0, 0.44, 0, 4).rotation.y = Math.PI / 4; cyl(g, 0.09, 0.09, 0.02, 0xffffff, 0, 0.2, 0.07).rotation.x = Math.PI / 2; break;
    case 'goldbar': box(g, 0.3, 0.1, 0.14, GOLD, -0.08, 0.05, 0); box(g, 0.3, 0.1, 0.14, GOLD, 0.08, 0.05, 0.16); box(g, 0.3, 0.1, 0.14, GOLD, 0, 0.15, 0.08); g.children.forEach((c) => (c.material = mat(GOLD, { emissive: 0x553300 }))); break;
    case 'cake': cyl(g, 0.24, 0.24, 0.2, 0xf2a7c3, 0, 0.1, 0, 14); cyl(g, 0.245, 0.245, 0.04, 0xffffff, 0, 0.2, 0, 14); cyl(g, 0.015, 0.015, 0.12, 0x6ab0ff, 0, 0.28, 0, 5); ball(g, 0.025, 0xffb347, 0, 0.36, 0, 5); break;
    case 'painting': { box(g, 1.1, 0.85, 0.06, GOLD, 0, 0, 0); box(g, 0.96, 0.71, 0.02, R.pick([0xf1e3c6, 0x2d3a5a, 0xc9e3f0]), 0, 0, 0.035);
      for (let i = 0; i < 4; i++) box(g, R.f(0.12, 0.35), R.f(0.1, 0.3), 0.01, R.pick([0xe05a5a, 0x5a8ae0, 0xffd23f, 0x4ea84e, 0x222222]), R.f(-0.3, 0.3), R.f(-0.2, 0.2), 0.05); break; }
    case 'tv': box(g, 1.25, 0.72, 0.08, 0x18181c, 0, 0.43, 0); box(g, 1.15, 0.62, 0.01, 0x24345a, 0, 0.43, 0.045); box(g, 0.3, 0.06, 0.2, 0x18181c, 0, 0.03, 0); box(g, 0.06, 0.1, 0.04, 0x18181c, 0, 0.08, 0); break;
    case 'guitar': { const gg = new THREE.Group(); g.add(gg); gg.rotation.x = -0.25; gg.position.z = 0.1;
      ball(gg, 0.2, 0xd9363e, 0, 0.22, 0, 8).scale.set(1, 1, 0.3); ball(gg, 0.15, 0xd9363e, 0, 0.46, 0, 8).scale.set(1, 1, 0.3); box(gg, 0.07, 0.6, 0.04, 0x3a2a1a, 0, 0.85, 0); box(gg, 0.1, 0.14, 0.05, 0x1c1c1c, 0, 1.2, 0); break; }
  }
  return g;
}

// Which loot shows up where (weights)
const ROOM_LOOT = {
  living: { tv: 3, console: 3, vase: 2, painting: 2, guitar: 1, cash: 1, duck: 1, clock: 1 },
  kitchen: { cake: 3, cash: 1, phone: 2, clock: 2, duck: 1, sock: 1 },
  bedroom: { watch: 3, ring: 2, phone: 2, cash: 2, sock: 2, teeth: 1, laptop: 1, painting: 1 },
  bathroom: { duck: 4, teeth: 3, ring: 1, sock: 1 },
  study: { laptop: 3, goldbar: 1, watch: 2, clock: 2, trophy: 2, cash: 2, painting: 1 },
  dining: { vase: 3, cake: 2, painting: 2, clock: 1, trophy: 1 },
  kids: { console: 3, duck: 2, sock: 2, trophy: 2, guitar: 1, phone: 1 },
  gallery: { painting: 4, vase: 3, goldbar: 1, ring: 1, trophy: 1 },
};

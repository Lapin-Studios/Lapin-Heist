// ============ Furniture, props, loot and yard modelled in Blender (blender/objects.py -> 01c_object_data.js) ============
// Each model is a list of single-material parts. Colors come from Blender; wood and fabric get re-rolled per piece.

const hasObj = (n) => typeof OBJ_DATA !== 'undefined' && !!OBJ_DATA[n];
const ObjGeo = new Map();
const GLOW = { Shade: 0x806a30, ScreenLit: 0x1a4a80, GoldGlow: 0x664400, Flame: 0xaa6600 };

function objGeometry(name, k, rec) {
  const key = name + '#' + k;
  let g = ObjGeo.get(key);
  if (!g) {
    g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(Float32Array.from(rec.p, (v) => v / 1000), 3));
    g.setIndex(rec.i);
    if (rec.f) g = g.toNonIndexed(); // crisp bevels on hard furniture
    g.computeVertexNormals();
    ObjGeo.set(key, g);
  }
  return g;
}

function objModel(name, colors = {}) {
  const g = new THREE.Group();
  OBJ_DATA[name].forEach((rec, k) => {
    const c = colors[rec.m] !== undefined ? colors[rec.m] : rec.c;
    g.add(new THREE.Mesh(objGeometry(name, k, rec), GLOW[rec.m] ? mat(c, { emissive: GLOW[rec.m] }) : mat(c)));
  });
  return g;
}

// ---------- Furniture: [width, depth, height, tabletop height] must match the Blender models ----------
const FURN_DIMS = {
  bed: [1.9, 2.3, 0.7, 0], kidbed: [1.1, 1.9, 0.5, 0], couch: [2.2, 0.9, 0.9, 0], armchair: [0.95, 0.85, 0.9, 0],
  table: [1.6, 1.0, 0.78, 0.82], coffeeTable: [1.2, 0.6, 0.42, 0.46], diningTable: [2.2, 2.2, 0.78, 0.82],
  desk: [1.4, 0.7, 0.78, 0.82], nightstand: [0.5, 0.45, 0.55, 0.56], dresser: [1.3, 0.5, 1.0, 1.01],
  wardrobe: [1.4, 0.6, 2.1, 0], bookshelf: [1.4, 0.4, 2.0, 0], tvStand: [1.7, 0.5, 0.5, 0.51],
  counter: [2.2, 0.7, 0.96, 0.97], stove: [0.9, 0.7, 0.92, 0], fridge: [0.9, 0.75, 2.0, 0],
  bathtub: [1.8, 0.9, 0.6, 0], toilet: [0.5, 0.7, 0.8, 0], sink: [0.7, 0.5, 0.88, 0.89],
  toyChest: [1.0, 0.55, 0.62, 0.63], pedestal: [0.7, 0.7, 1.03, 1.04], sideboard: [1.8, 0.5, 0.85, 0.86],
  piano: [1.5, 0.85, 1.25, 1.26], workbench: [2.0, 0.8, 0.9, 0.94],
};
function furnColors(name) {
  const fabric = R.pick(FABRIC);
  return { Wood: R.pick(WOOD), Fabric: fabric, Accent: R.pick(FABRIC.filter((c) => c !== fabric)) };
}
for (const name in FURN_DIMS) {
  if (!hasObj(name)) continue;
  const [w, d, h, surf] = FURN_DIMS[name];
  FURN[name] = () => ({ obj: objModel(name, furnColors(name)), w, d, h, surf });
}

// ---------- Disguise props ----------
for (const type in PROPS) if (hasObj('prop_' + type)) PROPS[type].build = () => objModel('prop_' + type);

// ---------- Loot ----------
function buildLoot(id) {
  if (id === 'painting' && hasObj('loot_painting')) return objModel(R.pick(['loot_painting', 'loot_painting2', 'loot_painting3']));
  return hasObj('loot_' + id) ? objModel('loot_' + id) : buildLootBasic(id);
}

// ---------- Yard ----------
const FOLIAGE = [0x2f6b3a, 0x3c7d46, 0x285a33, 0x4a8a3e];
function makeBurrow() { return hasObj('burrow') ? objModel('burrow') : makeBurrowBasic(); }
function makeTreeModel(kind) { // kind: 'tree' | 'bush'; null if there's no Blender model
  if (!hasObj(kind)) return null;
  const m = objModel(kind, { Foliage: R.pick(FOLIAGE) });
  m.scale.setScalar(R.f(0.85, 1.2));
  return m;
}

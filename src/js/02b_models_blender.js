// ============ Characters modelled in Blender (blender/characters.py -> 00_char_data.js) ============
// Each part has a pivot group (g) and origin (o): limbs swing from the hip/shoulder, ears from their base.

const CharGeo = new Map();
function charGeometry(char, rec) {
  const key = char + ':' + rec.k;
  let g = CharGeo.get(key);
  if (!g) {
    g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(Float32Array.from(rec.p, (v) => v / 1000), 3));
    g.setIndex(rec.i);
    if (rec.f) g = g.toNonIndexed(); // hard-edged parts get flat shading
    g.computeVertexNormals();
    CharGeo.set(key, g);
  }
  return g;
}

// Builds a character group; returns { root, groups } where groups maps pivot names to Object3Ds
function assembleChar(char, colors, style, rootGroup) {
  const root = new THREE.Group();
  const groups = { root };
  if (rootGroup) { groups[rootGroup] = new THREE.Group(); root.add(groups[rootGroup]); }
  for (const rec of CHAR_DATA[char]) {
    if (rec.s && rec.s !== style) continue;
    let grp = groups[rec.g];
    if (!grp) {
      grp = groups[rec.g] = new THREE.Group();
      grp.position.set(rec.o[0] / 1000, rec.o[1] / 1000, rec.o[2] / 1000);
      (rootGroup && rec.g.startsWith('ear') ? groups[rootGroup] : root).add(grp);
    }
    const mesh = new THREE.Mesh(charGeometry(char, rec), mat(colors[rec.m] !== undefined ? colors[rec.m] : 0xff00ff));
    mesh.name = rec.k;
    grp.add(mesh);
  }
  return { root, groups };
}

const hasCharData = (c) => typeof CHAR_DATA !== 'undefined' && CHAR_DATA[c] && CHAR_DATA[c].length;

function makeBunny() {
  if (!hasCharData('bunny')) return makeBunnyBasic();
  const { root, groups } = assembleChar('bunny', {
    Fur: 0xf4f0e8, Pink: 0xf2a7b5, Mask: 0x22222e, EyeWhite: 0xffffff, Pupil: 0x15151c, Sack: 0x9b7448,
  }, null, 'body');
  const ears = [groups.earR, groups.earL]; // [left of screen, right of screen], same order as the fallback
  ears[0].rotation.z = 0.2; ears[1].rotation.z = -0.2;
  const sack = groups.body.children.find((m) => m.name === 'sack');
  sack.visible = false;
  root.userData = { kind: 'bunny', body: groups.body, ears, sack };
  return root;
}

function makeHuman(p) {
  if (!hasCharData('human')) return makeHumanBasic(p);
  const { root, groups } = assembleChar('human', {
    Skin: p.skin, Shirt: p.shirt, Pants: p.pants, Hair: p.hair, Cap: p.cap || 0xd94a3a,
    Slipper: 0xf3e6c8, Pupil: 0x1a1a22, White: 0xffffff, Blush: 0xf2a0a0, Glass: 0x333344,
  }, p.style);
  root.userData = { kind: 'human', legs: [groups.legR, groups.legL], arms: [groups.armR, groups.armL] };
  return root;
}

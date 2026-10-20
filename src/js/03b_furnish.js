// ============ Furnishing: room types, furniture, disguise props, loot ============

const ROOM_SPEC = {
  living: { floor: 'wood', wall: [['couch', 1], ['tvStand', 1], ['bookshelf', 0.6], ['armchair', 0.8], ['piano', 0.3]], center: [['rug', 0.8], ['coffeeTable', 0.9]], props: ['plant', 'lamp', 'box'] },
  kitchen: { floor: 'tile', wall: [['counter', 1], ['fridge', 1], ['stove', 1], ['counter', 0.8]], center: [['table', 0.7]], props: ['bin', 'bin', 'box'] },
  bedroom: { floor: 'carpet', wall: [['bed', 1], ['nightstand', 1], ['dresser', 0.9], ['wardrobe', 0.6], ['nightstand', 0.5]], center: [['rug', 0.5]], props: ['basket', 'lamp', 'plant'] },
  bathroom: { floor: 'tile2', wall: [['bathtub', 1], ['toilet', 1], ['sink', 1]], center: [], props: ['basket', 'bin'] },
  study: { floor: 'wood2', wall: [['desk', 1], ['bookshelf', 1], ['bookshelf', 0.7], ['armchair', 0.6]], center: [['rug', 0.6]], props: ['lamp', 'plant', 'box'] },
  dining: { floor: 'wood', wall: [['sideboard', 1], ['sideboard', 0.4]], center: [['diningTable', 1]], props: ['plant', 'plant', 'lamp'] },
  kids: { floor: 'carpet2', wall: [['kidbed', 1], ['toyChest', 1], ['bookshelf', 0.5], ['nightstand', 0.6]], center: [['rug', 0.8]], props: ['teddy', 'box', 'basket'] },
  gallery: { floor: 'marble', wall: [['pedestal', 1], ['pedestal', 1], ['pedestal', 0.8]], center: [['pedestal', 0.9]], props: ['plant', 'lamp'] },
};

function interior(room) {
  return { x0: room.x0 + WALL_T / 2, x1: room.x1 - WALL_T / 2, z0: room.z0 + WALL_T / 2, z1: room.z1 - WALL_T / 2 };
}
function areaFree(room, bb, m) {
  for (const r of room.items) if (overlapBB(bb, r, m)) return false;
  for (const dz of room.doorZones) if (overlapBB(bb, dz, 0)) return false;
  return true;
}

// Place something with footprint w x d. mode 'wall' backs it against a wall, 'center' near the middle.
function placeIn(room, w, d, mode, flat) {
  const I = interior(room);
  for (let a = 0; a < 30; a++) {
    let x, z, rot, fx, fz;
    if (mode === 'wall') {
      const side = R.i(0, 3);
      if (side < 2) {
        fx = w; fz = d;
        if (I.x1 - I.x0 < fx + 0.4) continue;
        x = R.f(I.x0 + fx / 2 + 0.1, I.x1 - fx / 2 - 0.1);
        z = side === 0 ? I.z0 + fz / 2 + 0.02 : I.z1 - fz / 2 - 0.02;
        rot = side === 0 ? 0 : Math.PI;
      } else {
        fx = d; fz = w;
        if (I.z1 - I.z0 < fz + 0.4) continue;
        z = R.f(I.z0 + fz / 2 + 0.1, I.z1 - fz / 2 - 0.1);
        x = side === 2 ? I.x0 + fx / 2 + 0.02 : I.x1 - fx / 2 - 0.02;
        rot = side === 2 ? Math.PI / 2 : -Math.PI / 2;
      }
    } else {
      const turn = !flat && R.chance(0.5);
      rot = turn ? Math.PI / 2 : 0; fx = turn ? d : w; fz = turn ? w : d;
      if (!flat && (I.x1 - I.x0 < fx + 2.8 || I.z1 - I.z0 < fz + 2.8)) continue;
      x = room.cx + (flat ? 0 : R.f(-0.5, 0.5)); z = room.cz + (flat ? 0 : R.f(-0.5, 0.5));
    }
    const bb = { minX: x - fx / 2, maxX: x + fx / 2, minZ: z - fz / 2, maxZ: z + fz / 2 };
    if (!flat && !areaFree(room, bb, 0.3)) continue;
    return Object.assign(bb, { x, z, rot });
  }
  return null;
}

function furnishRoom(room) {
  const spec = ROOM_SPEC[room.type];
  const add = (name, mode) => {
    const I = interior(room);
    const f = name === 'rug' ? FURN.rug(Math.min(3.2, I.x1 - I.x0 - 2.6), Math.min(2.4, I.z1 - I.z0 - 2.6)) : FURN[name]();
    if (f.w <= 0.5 || f.d <= 0.5) return;
    const p = placeIn(room, f.w, f.d, mode, f.flat);
    if (!p) return;
    f.obj.position.set(p.x, f.flat ? 0.012 : 0.01, p.z); f.obj.rotation.y = p.rot;
    G.world.add(f.obj);
    const label = FURN_NAMES[name] || name;
    if (f.flat) { G.shiftables.push(Object.assign(p, { name: label, obj: f.obj, w: f.w, d: f.d, h: 0.03, flat: true, room })); return; }
    const rec = Object.assign(p, { h: f.h, blocks: f.h >= 1.3, surf: f.surf, w: f.w, d: f.d, slots: Math.max(1, Math.floor(f.w / 0.55)), room, name: label, obj: f.obj });
    room.items.push(rec); G.solids.push(rec); G.shiftables.push(rec);
  };
  for (const [n, p] of spec.center) if (R.chance(p)) add(n, 'center');
  for (const [n, p] of spec.wall) if (R.chance(p)) add(n, 'wall');
  // Disguise props
  const nProps = R.i(1, Math.min(3, spec.props.length));
  for (const type of R.shuffle(spec.props.slice()).slice(0, nProps)) addProp(room, type);
}

// A disguise prop against a wall of the room (null if there's no space)
function addProp(room, type) {
  const P = PROPS[type];
  const p = placeIn(room, P.w, P.d, 'wall');
  if (!p) return null;
  const obj = P.build();
  obj.position.set(p.x, 0.01, p.z); obj.rotation.y = p.rot + R.f(-0.3, 0.3);
  G.world.add(obj);
  const rec = Object.assign(p, { h: 1, blocks: false, prop: type, obj, room, w: P.w, d: P.d, name: P.name });
  room.items.push(rec); G.solids.push(rec); G.props.push(rec); G.shiftables.push(rec);
  if (type === 'lamp') addLightPool(room, p.x, p.z);
  return rec;
}

// Points in a room where people can stand
function computeFreePoints(room) {
  const I = interior(room);
  room.free = [];
  for (let x = I.x0 + 0.7; x < I.x1 - 0.6; x += 0.9) {
    for (let z = I.z0 + 0.7; z < I.z1 - 0.6; z += 0.9) {
      let ok = true;
      for (const s of room.items) {
        const cx = clamp(x, s.minX, s.maxX), cz = clamp(z, s.minZ, s.maxZ);
        if (Math.hypot(x - cx, z - cz) < 0.6) { ok = false; break; }
      }
      if (ok) room.free.push({ x, z });
    }
  }
  if (!room.free.length) room.free.push({ x: room.cx, z: room.cz });
}

function niceValue(def) {
  const v = R.f(def.min, def.max);
  if (v < 10) return Math.round(v * 100) / 100;
  if (v < 1000) return Math.round(v / 5) * 5;
  return Math.round(v / 50) * 50;
}

function addLoot(room, id) {
  const def = LOOT_TYPES[id];
  const I = interior(room);
  let x, z, y = 0, rotY = R.f(0, 6.28), px, pz;
  if (def.wall) {
    let ok = false;
    for (let a = 0; a < 20 && !ok; a++) {
      const side = R.i(0, 3);
      if (side < 2) { x = R.f(I.x0 + 0.9, I.x1 - 0.9); z = side === 0 ? I.z0 + 0.05 : I.z1 - 0.05; rotY = side === 0 ? 0 : Math.PI; px = x; pz = side === 0 ? I.z0 + 0.6 : I.z1 - 0.6; }
      else { z = R.f(I.z0 + 0.9, I.z1 - 0.9); x = side === 2 ? I.x0 + 0.05 : I.x1 - 0.05; rotY = side === 2 ? Math.PI / 2 : -Math.PI / 2; pz = z; px = side === 2 ? I.x0 + 0.6 : I.x1 - 0.6; }
      const spot = { minX: Math.min(x, px) - 0.6, maxX: Math.max(x, px) + 0.6, minZ: Math.min(z, pz) - 0.6, maxZ: Math.max(z, pz) + 0.6 };
      ok = room.doorZones.every((dz) => !overlapBB(spot, dz, 0)) && room.items.every((s) => s.h < 1.2 || !overlapBB(spot, s, 0)) && G.loot.every((l) => dist2D(l.x, l.z, px, pz) > 1.2);
    }
    if (!ok) return null;
    y = 1.45;
  } else {
    const surfaces = room.items.filter((s) => s.surf > 0 && s.slots > 0 && !s.prop);
    if (surfaces.length && (def.size < 3 || R.chance(0.7)) && R.chance(0.85)) {
      const s = R.pick(surfaces); s.slots--;
      x = R.f(s.minX + 0.25, s.maxX - 0.25); z = R.f(s.minZ + 0.2, s.maxZ - 0.2); y = s.surf;
      if (def.size === 3) rotY = s.rot;
    } else {
      const p = R.pick(room.free); x = p.x + R.f(-0.2, 0.2); z = p.z + R.f(-0.2, 0.2);
    }
    px = x; pz = z;
  }
  const obj = buildLoot(id);
  obj.position.set(x, y, z); obj.rotation.y = rotY;
  G.world.add(obj);
  const glow = new THREE.Mesh(geo('RingGeometry', 0.28, 0.38, 20), G.glowMat);
  glow.rotation.x = -Math.PI / 2;
  glow.position.set(px, def.wall ? 0.03 : y + 0.015, pz);
  G.world.add(glow);
  const l = { id, name: def.name, icon: def.icon, size: def.size, value: niceValue(def), obj, glow, x: px, z: pz, y, baseY: y, room, taken: false, spin: def.size === 1 };
  G.loot.push(l);
  return l;
}

// opts: layout options (see generateLayout), types (room types in order), noLoot
function buildHouse(opts = {}) {
  G.solids = []; G.walls = []; G.loot = []; G.props = []; G.shiftables = []; G.pools = [];
  const house = generateLayout(opts);
  G.house = house;
  // room types: the must-haves, then a random mix
  let types = ['living', 'kitchen', 'bathroom', 'bedroom', 'bedroom'];
  const pool = R.shuffle(['study', 'dining', 'kids', 'gallery', 'bedroom', 'study', 'kids', 'dining', 'living', 'bathroom', 'bedroom']);
  while (types.length < house.rooms.length) types.push(pool.pop());
  R.shuffle(types);
  if (opts.types) types = opts.types.slice();
  house.rooms.forEach((r, k) => {
    r.type = types[k];
    const f = floorMesh(r.w, r.d, ROOM_SPEC[r.type].floor, r.type.startsWith('tile') || ROOM_SPEC[r.type].floor.startsWith('tile') ? 2.4 : 3);
    f.position.set(r.cx, 0.005, r.cz);
    G.world.add(f);
    furnishRoom(r);
    computeFreePoints(r);
  });
  // loot
  for (const r of opts.noLoot ? [] : house.rooms) {
    const table = ROOM_LOOT[r.type];
    const list = Object.keys(table).map((id) => ({ id, w: table[id] }));
    const n = R.i(2, 3) + (r.type === 'gallery' || r.type === 'study' ? 1 : 0);
    for (let k = 0; k < n; k++) addLoot(r, R.weighted(list).id);
  }
  if (!opts.noLoot && R.chance(0.75)) addLoot(R.pick(house.rooms.filter((r) => r !== house.back.room)), 'carrot');
  buildYard(house);
  return house;
}

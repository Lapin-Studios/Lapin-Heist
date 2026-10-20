// ============ House generation: room grid, doors, walls, floors, yard, navigation ============

const WALL_H = 2.2, WALL_T = 0.2, DOOR_W = 1.9;

// ---------- Collision + line of sight helpers ----------
function overlapBB(a, b, m) {
  return a.minX < b.maxX + m && a.maxX > b.minX - m && a.minZ < b.maxZ + m && a.maxZ > b.minZ - m;
}
function collideCircle(pos, r, ignore) {
  for (let it = 0; it < 2; it++) {
    for (const s of G.solids) {
      if (s === ignore || pos.x < s.minX - r || pos.x > s.maxX + r || pos.z < s.minZ - r || pos.z > s.maxZ + r) continue;
      const cx = clamp(pos.x, s.minX, s.maxX), cz = clamp(pos.z, s.minZ, s.maxZ);
      const dx = pos.x - cx, dz = pos.z - cz, d2 = dx * dx + dz * dz;
      if (d2 >= r * r) continue;
      if (d2 > 1e-8) { const d = Math.sqrt(d2), k = (r - d) / d; pos.x += dx * k; pos.z += dz * k; }
      else {
        const l = pos.x - s.minX, rr = s.maxX - pos.x, t = pos.z - s.minZ, b = s.maxZ - pos.z, m = Math.min(l, rr, t, b);
        if (m === l) pos.x = s.minX - r; else if (m === rr) pos.x = s.maxX + r; else if (m === t) pos.z = s.minZ - r; else pos.z = s.maxZ + r;
      }
    }
  }
}
// Distance along a ray until it hits a wall or tall furniture
function rayHit(ox, oz, dx, dz, maxD) {
  let best = maxD;
  for (const s of G.solids) {
    if (!s.blocks) continue;
    let tmin = 0, tmax = best;
    if (Math.abs(dx) < 1e-9) { if (ox < s.minX || ox > s.maxX) continue; }
    else { let t1 = (s.minX - ox) / dx, t2 = (s.maxX - ox) / dx; if (t1 > t2) { const q = t1; t1 = t2; t2 = q; } if (t1 > tmin) tmin = t1; if (t2 < tmax) tmax = t2; if (tmin > tmax) continue; }
    if (Math.abs(dz) < 1e-9) { if (oz < s.minZ || oz > s.maxZ) continue; }
    else { let t1 = (s.minZ - oz) / dz, t2 = (s.maxZ - oz) / dz; if (t1 > t2) { const q = t1; t1 = t2; t2 = q; } if (t1 > tmin) tmin = t1; if (t2 < tmax) tmax = t2; if (tmin > tmax) continue; }
    if (tmin < best) best = tmin;
  }
  return best;
}
function lineClear(ax, az, bx, bz) {
  const d = Math.hypot(bx - ax, bz - az);
  if (d < 0.01) return true;
  return rayHit(ax, az, (bx - ax) / d, (bz - az) / d, d) >= d - 0.05;
}
function roomAt(x, z) {
  for (const r of G.house.rooms) if (x >= r.x0 && x <= r.x1 && z >= r.z0 && z <= r.z1) return r;
  return null;
}

// ---------- Floor textures ----------
const FloorTex = {};
function floorTexture(kind) {
  if (FloorTex[kind]) return FloorTex[kind];
  const c = document.createElement('canvas'); c.width = c.height = 128;
  const x = c.getContext('2d');
  const fill = (col) => { x.fillStyle = col; x.fillRect(0, 0, 128, 128); };
  if (kind === 'wood' || kind === 'wood2') {
    fill(kind === 'wood' ? '#a87a52' : '#8a6040');
    for (let r = 0; r < 8; r++) {
      x.fillStyle = 'rgba(0,0,0,.18)'; x.fillRect(0, r * 16, 128, 1.5);
      const off = (r * 37) % 128; x.fillRect(off, r * 16, 1.5, 16);
      x.fillStyle = `rgba(255,255,255,${0.03 + (r % 3) * 0.025})`; x.fillRect(0, r * 16 + 2, 128, 13);
    }
  } else if (kind === 'tile' || kind === 'tile2') {
    const [a, b] = kind === 'tile' ? ['#ece6d8', '#c7d5db'] : ['#e8f3f7', '#9fc9d8'];
    for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) { x.fillStyle = (i + j) % 2 ? a : b; x.fillRect(i * 32, j * 32, 32, 32); }
  } else if (kind === 'marble') {
    fill('#efece6'); x.strokeStyle = 'rgba(120,120,140,.16)'; x.lineWidth = 1;
    for (let i = 0; i < 5; i++) { x.beginPath(); x.moveTo(0, Math.random() * 128); x.bezierCurveTo(40, Math.random() * 128, 90, Math.random() * 128, 128, Math.random() * 128); x.stroke(); }
    x.strokeStyle = 'rgba(0,0,0,.12)'; x.strokeRect(0, 0, 128, 128);
  } else if (kind === 'grass') {
    fill('#2f5a3a');
    for (let i = 0; i < 700; i++) { x.fillStyle = Math.random() < 0.5 ? 'rgba(80,140,80,.35)' : 'rgba(10,40,20,.35)'; x.fillRect(Math.random() * 128, Math.random() * 128, 2, 3); }
  } else {
    fill(kind === 'carpet' ? '#7c86b8' : '#d58a8a');
    for (let i = 0; i < 900; i++) { x.fillStyle = Math.random() < 0.5 ? 'rgba(255,255,255,.07)' : 'rgba(0,0,0,.07)'; x.fillRect(Math.random() * 128, Math.random() * 128, 2, 2); }
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  FloorTex[kind] = t;
  return t;
}
function floorMesh(w, d, kind, tile) {
  const t = floorTexture(kind).clone(); t.needsUpdate = true;
  t.repeat.set(w / tile, d / tile);
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), new THREE.MeshLambertMaterial({ map: t }));
  m.rotation.x = -Math.PI / 2;
  return m;
}

// ---------- Warm light pools under lamps (clipped to the room so light doesn't leak through walls) ----------
let PoolTex = null;
function addLightPool(room, x, z, r = 3.0, color = 0xffa448) {
  const I = interior(room);
  const x0 = Math.max(x - r, I.x0), x1 = Math.min(x + r, I.x1), z0 = Math.max(z - r, I.z0), z1 = Math.min(z + r, I.z1);
  const u = (X) => (X - (x - r)) / (2 * r), v = (Z) => 1 - (Z - (z - r)) / (2 * r);
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute([x0, 0.025, z0, x1, 0.025, z0, x1, 0.025, z1, x0, 0.025, z1], 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute([u(x0), v(z0), u(x1), v(z0), u(x1), v(z1), u(x0), v(z1)], 2));
  g.setIndex([0, 2, 1, 0, 3, 2]);
  const m = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ map: glowTexture(), color, transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending, depthWrite: false }));
  m.renderOrder = 1;
  G.world.add(m); G.pools.push(m);
}

// ---------- Walls ----------
let WallMats = null;
function addWallSeg(horiz, fixed, a, b, ext) {
  const len = b - a;
  if (len < 0.05) return;
  if (!WallMats) {
    const side = mat(0xe9dcc3), top = mat(0x3b3550), outer = mat(0xb7a58a);
    WallMats = { int: [side, side, top, side, side, side], ext: [outer, outer, top, outer, outer, outer] };
  }
  const L = len + WALL_T;
  const mesh = new THREE.Mesh(geo('BoxGeometry', horiz ? L : WALL_T, WALL_H, horiz ? WALL_T : L), ext ? WallMats.ext : WallMats.int);
  const cx = horiz ? (a + b) / 2 : fixed, cz = horiz ? fixed : (a + b) / 2;
  mesh.position.set(cx, WALL_H / 2, cz);
  G.world.add(mesh);
  const hx = (horiz ? L : WALL_T) / 2, hz = (horiz ? WALL_T : L) / 2;
  const rec = { minX: cx - hx, maxX: cx + hx, minZ: cz - hz, maxZ: cz + hz, h: WALL_H, blocks: true, wall: true, horiz, mesh, cx, cz, cut: 1 };
  G.solids.push(rec); G.walls.push(rec);
}
function addWallLine(horiz, fixed, from, to, gaps, ext) {
  let cur = from;
  for (const gp of gaps.sort((p, q) => p.c - q.c)) { addWallSeg(horiz, fixed, cur, gp.c - gp.w / 2, ext); cur = gp.c + gp.w / 2; }
  addWallSeg(horiz, fixed, cur, to, ext);
}

// ---------- Layout ----------
// opts (all optional, used by the tutorial): C, Rr, colW, rowD, backRoom (index), backSide ('N'|'S'|'W'|'E')
function generateLayout(opts = {}) {
  const C = opts.C || R.i(3, 4), Rr = opts.Rr || R.i(3, 4);
  const colW = [], rowD = [];
  for (let i = 0; i < C; i++) colW.push(opts.colW ? opts.colW[i] : R.f(7, 10));
  for (let j = 0; j < Rr; j++) rowD.push(opts.rowD ? opts.rowD[j] : R.f(6.5, 9));
  const W = colW.reduce((a, b) => a + b, 0), D = rowD.reduce((a, b) => a + b, 0);
  const colX = [-W / 2], rowZ = [-D / 2];
  colW.forEach((w) => colX.push(colX[colX.length - 1] + w));
  rowD.forEach((d) => rowZ.push(rowZ[rowZ.length - 1] + d));
  const rooms = [], grid = [];
  for (let i = 0; i < C; i++) {
    grid.push([]);
    for (let j = 0; j < Rr; j++) {
      const r = { id: rooms.length, i, j, x0: colX[i], x1: colX[i + 1], z0: rowZ[j], z1: rowZ[j + 1], doors: [], links: [], items: [], doorZones: [], free: [] };
      r.cx = (r.x0 + r.x1) / 2; r.cz = (r.z0 + r.z1) / 2; r.w = r.x1 - r.x0; r.d = r.z1 - r.z0;
      rooms.push(r); grid[i].push(r);
    }
  }
  // Random spanning tree (every room reachable) + extra doors for loops
  const edges = new Set(), visited = new Set([rooms[0].id]), stack = [rooms[0]];
  const nbrs = (r) => [[1, 0], [-1, 0], [0, 1], [0, -1]].map(([di, dj]) => grid[r.i + di] && grid[r.i + di][r.j + dj]).filter(Boolean);
  const key = (a, b) => (a.id < b.id ? a.id + '-' + b.id : b.id + '-' + a.id);
  while (stack.length) {
    const r = stack[stack.length - 1];
    const opts = nbrs(r).filter((n) => !visited.has(n.id));
    if (!opts.length) { stack.pop(); continue; }
    const n = R.pick(opts); visited.add(n.id); edges.add(key(r, n)); stack.push(n);
  }
  for (const r of rooms) for (const n of nbrs(r)) if (r.id < n.id && !edges.has(key(r, n)) && R.chance(0.4)) edges.add(key(r, n));

  const doors = [];
  const vGaps = {}, hGaps = {}; // per boundary line segment: gaps
  for (const k of edges) {
    const [a, b] = k.split('-').map((s) => rooms[+s]);
    const door = { a, b };
    if (a.j === b.j) { // side by side: wall runs along z at x = boundary
      const left = a.i < b.i ? a : b, right = left === a ? b : a;
      door.x = left.x1; door.z = R.f(left.z0 + 0.9 + DOOR_W / 2, left.z1 - 0.9 - DOOR_W / 2);
      door.horiz = false;
      door.pa = { x: door.x - 1.0, z: door.z, room: left }; door.pb = { x: door.x + 1.0, z: door.z, room: right };
      (vGaps[left.i + ',' + left.j] = vGaps[left.i + ',' + left.j] || []).push({ c: door.z, w: DOOR_W });
    } else {
      const top = a.j < b.j ? a : b, bot = top === a ? b : a;
      door.z = top.z1; door.x = R.f(top.x0 + 0.9 + DOOR_W / 2, top.x1 - 0.9 - DOOR_W / 2);
      door.horiz = true;
      door.pa = { x: door.x, z: door.z - 1.0, room: top }; door.pb = { x: door.x, z: door.z + 1.0, room: bot };
      (hGaps[top.i + ',' + top.j] = hGaps[top.i + ',' + top.j] || []).push({ c: door.x, w: DOOR_W });
    }
    doors.push(door);
    for (const r of [a, b]) {
      r.doors.push(door); r.links.push({ room: r === a ? b : a, door });
      r.doorZones.push({ minX: door.x - 1.45, maxX: door.x + 1.45, minZ: door.z - 1.45, maxZ: door.z + 1.45 });
    }
  }
  // Back door: an outside wall of a random edge room leads to the yard and the burrow
  const edgeRooms = rooms.filter((r) => r.i === 0 || r.j === 0 || r.i === C - 1 || r.j === Rr - 1);
  const br = opts.backRoom !== undefined ? rooms[opts.backRoom] : R.pick(edgeRooms);
  const sides = [];
  if (br.j === 0) sides.push('N'); if (br.j === Rr - 1) sides.push('S'); if (br.i === 0) sides.push('W'); if (br.i === C - 1) sides.push('E');
  const side = sides.includes(opts.backSide) ? opts.backSide : R.pick(sides);
  const back = { room: br, side };
  if (side === 'N' || side === 'S') { back.x = R.f(br.x0 + 1.2 + DOOR_W / 2, br.x1 - 1.2 - DOOR_W / 2); back.z = side === 'N' ? br.z0 : br.z1; }
  else { back.z = R.f(br.z0 + 1.2 + DOOR_W / 2, br.z1 - 1.2 - DOOR_W / 2); back.x = side === 'W' ? br.x0 : br.x1; }
  const out = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] }[side];
  back.dir = out;
  back.inside = { x: back.x - out[0] * 1.1, z: back.z - out[1] * 1.1 };
  back.burrow = { x: back.x + out[0] * 4.2, z: back.z + out[1] * 4.2 };
  br.doorZones.push({ minX: back.x - 1.5, maxX: back.x + 1.5, minZ: back.z - 1.5, maxZ: back.z + 1.5 });

  // Interior walls
  for (let i = 0; i < C - 1; i++) for (let j = 0; j < Rr; j++) addWallLine(false, colX[i + 1], rowZ[j], rowZ[j + 1], vGaps[i + ',' + j] || [], false);
  for (let i = 0; i < C; i++) for (let j = 0; j < Rr - 1; j++) addWallLine(true, rowZ[j + 1], colX[i], colX[i + 1], hGaps[i + ',' + j] || [], false);
  // Exterior walls
  const bg = (s) => (side === s ? [{ c: s === 'N' || s === 'S' ? back.x : back.z, w: DOOR_W }] : []);
  addWallLine(true, rowZ[0], colX[0], colX[C], bg('N'), true);
  addWallLine(true, rowZ[Rr], colX[0], colX[C], bg('S'), true);
  addWallLine(false, colX[0], rowZ[0], rowZ[Rr], bg('W'), true);
  addWallLine(false, colX[C], rowZ[0], rowZ[Rr], bg('E'), true);

  return { rooms, doors, back, C, Rr, bounds: { minX: colX[0], maxX: colX[C], minZ: rowZ[0], maxZ: rowZ[Rr] } };
}

// ---------- Room-to-room path (list of doors) ----------
function roomPath(from, to) {
  if (!from || !to) return null;
  if (from === to) return [];
  const prev = new Map([[from.id, null]]), q = [from];
  while (q.length) {
    const r = q.shift();
    if (r === to) break;
    for (const l of r.links) if (!prev.has(l.room.id)) { prev.set(l.room.id, { room: r, door: l.door }); q.push(l.room); }
  }
  if (!prev.has(to.id)) return null;
  const path = [];
  let cur = to;
  while (cur !== from) { const p = prev.get(cur.id); path.unshift({ door: p.door, from: p.room, to: cur }); cur = p.room; }
  return path;
}
// Turn a room path into waypoints: approach point, through the door, out the other side
function pathWaypoints(fromRoom, toRoom, end) {
  const rp = roomPath(fromRoom, toRoom);
  if (!rp) return [end];
  const pts = [];
  for (const step of rp) {
    const d = step.door;
    const near = d.pa.room === step.from ? d.pa : d.pb, far = near === d.pa ? d.pb : d.pa;
    pts.push({ x: near.x, z: near.z }, { x: far.x, z: far.z });
  }
  pts.push(end);
  return pts;
}

// ---------- Yard ----------
function buildYard(house) {
  const b = house.bounds;
  const W = b.maxX - b.minX + 34, D = b.maxZ - b.minZ + 34;
  const ground = floorMesh(W, D, 'grass', 4);
  ground.position.set((b.minX + b.maxX) / 2, -0.01, (b.minZ + b.maxZ) / 2);
  G.world.add(ground);
  const bur = house.back.burrow;
  // garden path from back door to burrow
  for (let k = 0; k < 3; k++) {
    const s = new THREE.Mesh(geo('CircleGeometry', 0.35, 7), mat(0x8c8a80));
    s.rotation.x = -Math.PI / 2;
    s.position.set(lerp(house.back.x, bur.x, 0.25 + k * 0.22), 0.005, lerp(house.back.z, bur.z, 0.25 + k * 0.22));
    G.world.add(s);
  }
  // trees and bushes around the outside
  let placed = 0;
  for (let tries = 0; tries < 200 && placed < 18; tries++) {
    const x = R.f(b.minX - 9, b.maxX + 9), z = R.f(b.minZ - 9, b.maxZ + 9);
    const inside = x > b.minX - 2.2 && x < b.maxX + 2.2 && z > b.minZ - 2.2 && z < b.maxZ + 2.2;
    if (inside || dist2D(x, z, bur.x, bur.z) < 4.5 || dist2D(x, z, house.back.x, house.back.z) < 4.5) continue;
    const t = new THREE.Group();
    let rec;
    if (R.chance(0.55)) {
      const model = makeTreeModel('tree');
      if (model) t.add(model);
      else {
        cyl(t, 0.2, 0.28, 1.6, 0x5b3b25, 0, 0.8, 0, 7);
        part(geo('IcosahedronGeometry', 1, 0), R.pick([0x2f6b3a, 0x3c7d46, 0x285a33]), 0, 2.2, 0, t).scale.setScalar(R.f(1.1, 1.6));
      }
      rec = { minX: x - 0.3, maxX: x + 0.3, minZ: z - 0.3, maxZ: z + 0.3, h: 3.2, blocks: false, name: 'Tree', w: 0.6, d: 0.6 };
    } else {
      const model = makeTreeModel('bush');
      if (model) t.add(model);
      else part(geo('IcosahedronGeometry', 0.7, 0), 0x3a7a44, 0, 0.45, 0, t).scale.set(1, 0.7, 1);
      rec = { minX: x - 0.55, maxX: x + 0.55, minZ: z - 0.55, maxZ: z + 0.55, h: 0.9, blocks: false, name: 'Bush', w: 1.1, d: 1.1 };
    }
    Object.assign(rec, { x, z, obj: t });
    G.solids.push(rec); G.shiftables.push(rec);
    t.position.set(x, 0, z); t.rotation.y = R.f(0, 6.28);
    G.world.add(t); placed++;
  }
  const burrow = makeBurrow();
  burrow.position.set(bur.x, 0, bur.z);
  burrow.rotation.y = Math.atan2(house.back.x - bur.x, house.back.z - bur.z);
  G.world.add(burrow);
  // door mat inside the back door
  const matM = new THREE.Mesh(geo('PlaneGeometry', 1.2, 0.7), mat(0x7a4a3a));
  matM.rotation.x = -Math.PI / 2;
  if (house.back.side === 'W' || house.back.side === 'E') matM.rotation.z = Math.PI / 2;
  matM.position.set(house.back.inside.x, 0.02, house.back.inside.z);
  G.world.add(matM);
  addFireflies(house);
}

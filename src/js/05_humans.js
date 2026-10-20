// ============ Humans: patrol, vision, suspicion, chase, slipper throwing ============

const VIEW_RANGE = 8.5, FOV_HALF = 55 * Math.PI / 180, VIEW_COS = Math.cos(FOV_HALF);
const CONE_SEGS = 14;
const SPEED = { walk: 1.6, investigate: 2.3, chase: 4.2 };

function spawnHumans(n) {
  G.humans = [];
  const people = R.shuffle(PEOPLE.slice()).slice(0, n);
  const rooms = R.shuffle(G.house.rooms.filter((r) => r !== G.house.back.room));
  people.forEach((person, k) => {
    const room = rooms[k % rooms.length];
    const pt = R.pick(room.free);
    createHuman(person, pt.x, pt.z, room);
  });
  // some of the family is asleep (for now)
  const beds = R.shuffle(G.shiftables.filter((s) => s.name === 'Bed' || s.name === "Kid's Bed"));
  const sleepers = n >= 3 ? Math.min(beds.length, n >= 4 ? 2 : 1) : 0;
  for (let k = 0; k < sleepers; k++) tuckIn(G.humans[G.humans.length - 1 - k], beds[k]);
}

function createHuman(person, x, z, room) {
  const h = {
    person, model: makeHuman(person), shadow: blobShadow(0.42), x, z, facing: R.f(0, 6.28), lookGoal: 0,
    state: 'idle', timer: R.f(1, 4), path: [], room, sus: 0, lastSeen: null, throwCd: 1.5, phase: 0,
    icon: null, iconKey: '', stuckT: 0, replanT: 0, prevX: x, prevZ: z, saw: false,
  };
  h.lookGoal = h.facing;
  h.cone = makeCone();
  G.world.add(h.model, h.shadow, h.cone);
  G.humans.push(h);
  return h;
}
function removeHuman(h) {
  G.world.remove(h.model, h.shadow, h.cone);
  G.humans = G.humans.filter((o) => o !== h);
}

function makeCone() {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(new Float32Array((CONE_SEGS + 2) * 3), 3));
  const idx = [];
  for (let i = 0; i < CONE_SEGS; i++) idx.push(0, i + 2, i + 1);
  g.setIndex(idx);
  const m = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ color: 0xffc020, transparent: true, opacity: 0.3, depthWrite: false, side: THREE.DoubleSide }));
  m.frustumCulled = false; m.renderOrder = 2;
  return m;
}
function updateCone(h) {
  const pos = h.cone.geometry.attributes.position, a = pos.array;
  a[0] = h.x; a[1] = 0.04; a[2] = h.z;
  for (let i = 0; i <= CONE_SEGS; i++) {
    const ang = h.facing - FOV_HALF + (2 * FOV_HALF * i) / CONE_SEGS;
    const dx = Math.sin(ang), dz = Math.cos(ang);
    const d = rayHit(h.x, h.z, dx, dz, VIEW_RANGE);
    a[(i + 1) * 3] = h.x + dx * d; a[(i + 1) * 3 + 1] = 0.04; a[(i + 1) * 3 + 2] = h.z + dz * d;
  }
  pos.needsUpdate = true;
  const col = h.state === 'chase' ? 0xff3048 : h.sus > 35 ? 0xff8a1a : 0xffc020;
  h.cone.material.color.setHex(col);
  h.cone.material.opacity = h.state === 'chase' ? 0.38 : 0.3;
}

function humanSees(h, x, z) {
  if (h.state === 'sleep') return false;
  const dx = x - h.x, dz = z - h.z, d = Math.hypot(dx, dz);
  if (d > VIEW_RANGE) return false;
  if (d > 0.3 && (dx * Math.sin(h.facing) + dz * Math.cos(h.facing)) / d < VIEW_COS) return false;
  return lineClear(h.x, h.z, x, z);
}
// Something just happened at (x,z): everyone who can see it gets suspicious
function witness(x, z, amount) {
  for (const h of G.humans) if (humanSees(h, x, z)) { h.sus = Math.min(130, h.sus + amount); h.lastSeen = { x, z }; }
}
// Loud footsteps: nearby humans turn and come look
function noise(x, z, radius, dt) {
  for (const h of G.humans) {
    if (dist2D(h.x, h.z, x, z) > radius || h.state === 'chase') continue;
    h.sus = Math.min(99, h.sus + 45 * dt);
    h.lastSeen = { x, z };
    h.lookGoal = Math.atan2(x - h.x, z - h.z);
  }
}

function bark(h, text, color = '#f7eed6') { Popups.add(text, new THREE.Vector3(h.x, 1.6, h.z), color, 1.6); }

function setIcon(h, key) {
  if (h.iconKey === key) return;
  if (h.icon) { h.model.remove(h.icon); h.icon = null; }
  h.iconKey = key;
  if (key) { h.icon = iconSprite(key, key === '!' ? '#ff4f62' : key === 'z' ? '#9fd3ff' : '#ffd34d'); h.icon.position.y = 2.45; h.model.add(h.icon); }
}

function planTo(h, x, z) {
  const from = roomAt(h.x, h.z) || h.room, to = roomAt(x, z);
  if (!to) { // target is outside: go to the back door and stop there
    const b = G.house.back.inside;
    h.path = pathWaypoints(from, G.house.back.room, { x: b.x, z: b.z });
  } else h.path = pathWaypoints(from, to, { x, z });
}

function pickPatrol(h) {
  const cur = roomAt(h.x, h.z) || h.room;
  let room = cur;
  const r = R.rand();
  if (r < 0.35 && cur.links.length) room = R.pick(cur.links).room;
  else if (r < 0.85) room = R.pick(G.house.rooms);
  const pt = R.pick(room.free);
  planTo(h, pt.x, pt.z);
  h.state = 'walk';
}

function stepAlong(h, speed, dt) {
  if (!h.path.length) return true;
  const t = h.path[0];
  const dx = t.x - h.x, dz = t.z - h.z, d = Math.hypot(dx, dz);
  if (d < 0.35) { h.path.shift(); return !h.path.length; }
  const s = Math.min(d, speed * dt);
  const pos = { x: h.x + (dx / d) * s, z: h.z + (dz / d) * s };
  collideCircle(pos, 0.34);
  const b = G.house.bounds;
  pos.x = clamp(pos.x, b.minX + 0.4, b.maxX - 0.4); pos.z = clamp(pos.z, b.minZ + 0.4, b.maxZ - 0.4);
  h.x = pos.x; h.z = pos.z;
  h.lookGoal = Math.atan2(dx, dz);
  h.phase += dt * speed * 4.2;
  // stuck on furniture? skip this waypoint
  h.stuckT = Math.hypot(h.x - h.prevX, h.z - h.prevZ) < speed * dt * 0.25 ? h.stuckT + dt : 0;
  if (h.stuckT > 0.8) { h.stuckT = 0; h.path.shift(); }
  return false;
}

function throwSlipper(h, p) {
  const lead = 0.35;
  const tx = p.x + p.vx * lead, tz = p.z + p.vz * lead;
  const dx = tx - h.x, dz = tz - h.z, d = Math.hypot(dx, dz) || 1;
  const m = hasObj('slipper') ? objModel('slipper') : new THREE.Mesh(geo('BoxGeometry', 0.18, 0.07, 0.32), mat(0xf3e6c8));
  m.position.set(h.x, 1.3, h.z);
  G.world.add(m);
  const v = 11;
  G.projectiles.push({ mesh: m, x: h.x, z: h.z, y: 1.3, vx: (dx / d) * v, vz: (dz / d) * v, vy: 1.5, life: 1.4, owner: h });
  Sfx.play('throw');
}

function updateProjectiles(dt) {
  const p = G.player;
  for (let i = G.projectiles.length - 1; i >= 0; i--) {
    const s = G.projectiles[i];
    s.life -= dt;
    s.x += s.vx * dt; s.z += s.vz * dt; s.vy -= 9 * dt; s.y = Math.max(0.1, s.y + s.vy * dt);
    s.mesh.position.set(s.x, s.y, s.z);
    s.mesh.rotation.y += dt * 18; s.mesh.rotation.x += dt * 9;
    let dead = s.life <= 0;
    if (!dead && dist2D(s.x, s.z, p.x, p.z) < p.def.radius + 0.28 && s.y < 1.4) { hurtPlayer(p, s.owner.x, s.owner.z); dead = true; }
    if (!dead) for (const w of G.solids) if (w.blocks && s.x > w.minX && s.x < w.maxX && s.z > w.minZ && s.z < w.maxZ) { dead = true; break; }
    if (dead) { FX.puff(s.mesh.position, 0xf3e6c8, 5, 0.4); G.world.remove(s.mesh); G.projectiles.splice(i, 1); }
  }
}

const CHASE_BARKS = {
  bunny: ['A BUNNY BURGLAR!', 'HEY! RABBIT!', 'GET THAT BUNNY!'],
  prop: (n) => [`THAT ${n.toUpperCase()} MOVED!`, `${n.toUpperCase()}?! WALKING?!`],
  twin: ['WAIT... THAT\'S ME?!', 'THERE ARE TWO OF ME!'],
  human: ['WHO ARE YOU?!', 'YOU DON\'T LIVE HERE!'],
};

// ---------- Sleepers ----------
function tuckIn(h, bed) {
  h.state = 'sleep'; h.bed = bed; h.timer = R.f(60, 150); h.sus = 0;
  const kid = bed.name !== 'Bed', foot = kid ? 0.75 : 0.85;
  h.x = bed.x + Math.sin(bed.rot) * foot; h.z = bed.z + Math.cos(bed.rot) * foot;
  h.facing = h.lookGoal = bed.rot;
  h.model.rotation.order = 'YXZ';
  h.model.rotation.set(-Math.PI / 2, bed.rot, 0); // lie down, head on the pillow
  h.model.position.set(h.x, kid ? 0.5 : 0.62, h.z);
  h.cone.visible = false; h.shadow.visible = false;
  setIcon(h, 'z');
}
function wakeUp(h, startled) {
  h.model.rotation.order = 'XYZ';
  h.model.rotation.set(0, h.facing, 0);
  const room = h.bed.room;
  let best = room.free[0], bd = Infinity;
  for (const f of room.free) { const d = dist2D(f.x, f.z, h.bed.x, h.bed.z); if (d < bd) { bd = d; best = f; } }
  h.x = h.prevX = best.x; h.z = h.prevZ = best.z;
  h.model.position.set(h.x, 0, h.z);
  h.cone.visible = true; h.shadow.visible = true;
  setIcon(h, '');
  if (startled && h.lastSeen) { h.state = 'investigate'; h.sus = Math.max(h.sus, 50); planTo(h, h.lastSeen.x, h.lastSeen.z); bark(h, R.pick(["Wha-? Who's there?!", 'Huh?! What was that?'])); Sfx.play('huh'); }
  else { h.state = 'idle'; h.timer = 1.5; bark(h, R.pick(['*yaaawn*', 'Midnight snack time...', 'Bathroom break...'])); }
}

function updateHuman(h, dt) {
  const p = G.player;
  if (h.state === 'sleep') {
    h.timer -= dt;
    if (h.sus > 30) wakeUp(h, true);
    else if (h.timer <= 0) wakeUp(h, false);
    else if (h.icon) { h.icon.position.set(0, 1.1 + Math.sin(G.time * 2) * 0.1, 1.2); h.icon.scale.setScalar(0.5); }
    return;
  }
  const d = dist2D(h.x, h.z, p.x, p.z);
  const sees = humanSees(h, p.x, p.z);
  // how alarming is what they see?
  let rate = 0;
  if (sees) {
    const near = 1.5 - d / VIEW_RANGE;
    if (p.form === 'bunny') rate = 95 * near;
    else if (p.form === 'human') rate = p.person === h.person ? 170 : (p.sprinting && p.moving ? 45 * near : 0);
    else if (p.moving) rate = 700; // furniture doesn't walk. Instant chase.
  }
  if (!rate && d < 0.8 && p.moving && p.form !== 'human') rate = p.form === 'thing' ? 700 : 70; // bumped into it
  h.sees = sees;
  const detected = rate > 0 && G.state === 'play';
  if (detected) { h.sus = Math.min(130, h.sus + rate * dt); h.lastSeen = { x: p.x, z: p.z }; }
  else h.sus = Math.max(0, h.sus - (h.state === 'chase' ? 7 : 11) * dt);

  // ---- state transitions ----
  if (h.sus >= 100 && h.state !== 'chase') {
    h.state = 'chase'; h.replanT = 0; h.throwCd = R.f(0.4, 0.9); G.stats.spotted++;
    Sfx.play('alert');
    const lines = p.form === 'bunny' ? CHASE_BARKS.bunny : p.form === 'human' ? (p.person === h.person ? CHASE_BARKS.twin : CHASE_BARKS.human) : CHASE_BARKS.prop(p.def.name);
    bark(h, R.pick(lines), '#ff4f62');
    for (const o of G.humans) if (o !== h && dist2D(o.x, o.z, h.x, h.z) < 9 && o.state !== 'chase') { o.sus = Math.max(o.sus, 75); o.lastSeen = h.lastSeen; }
  } else if (h.sus > 35 && rate < 300 && (h.state === 'idle' || h.state === 'walk') && h.lastSeen) {
    h.state = 'investigate'; planTo(h, h.lastSeen.x, h.lastSeen.z);
    bark(h, R.pick(['Huh?', 'Hmm...', 'Who\'s there?', 'What was that?']));
    Sfx.play('huh');
  }

  // ---- behaviour ----
  let moving = false;
  if (h.state === 'idle') {
    h.timer -= dt;
    if (Math.random() < dt * 0.5) h.lookGoal = h.facing + R.f(-1.6, 1.6);
    if (h.timer <= 0) pickPatrol(h);
  } else if (h.state === 'walk') {
    moving = true;
    if (stepAlong(h, SPEED.walk, dt)) { h.state = 'idle'; h.timer = R.f(1.5, 4.5); }
  } else if (h.state === 'investigate') {
    moving = true;
    if (stepAlong(h, SPEED.investigate, dt)) { h.state = 'search'; h.timer = 3.5; }
  } else if (h.state === 'search') {
    h.timer -= dt;
    if (Math.random() < dt * 2) h.lookGoal = h.facing + R.f(-2, 2);
    if (h.timer <= 0) { if (h.sus > 35 && h.lastSeen) { h.state = 'investigate'; planTo(h, h.lastSeen.x, h.lastSeen.z); } else { h.state = 'idle'; h.timer = 1; } }
  } else if (h.state === 'chase') {
    moving = true;
    h.replanT -= dt;
    const tgt = detected ? { x: p.x, z: p.z } : h.lastSeen || { x: h.x, z: h.z };
    if (h.replanT <= 0) {
      h.replanT = 0.35;
      if (lineClear(h.x, h.z, tgt.x, tgt.z) && roomAt(tgt.x, tgt.z)) h.path = [{ x: tgt.x, z: tgt.z }];
      else planTo(h, tgt.x, tgt.z);
    }
    const arrived = stepAlong(h, SPEED.chase, dt);
    if (detected) h.lookGoal = Math.atan2(p.x - h.x, p.z - h.z);
    h.throwCd -= dt;
    const practice = G.mode === 'tutorial'; // the tutorial never throws or grabs
    if (!practice && detected && d < 7.5 && d > 1.6 && h.throwCd <= 0) { throwSlipper(h, p); h.throwCd = R.f(1.6, 2.6); }
    if (!practice && detected && d < 0.7 + p.def.radius && p.invuln <= 0) { bark(h, 'GOTCHA!', '#ff4f62'); endGame('caught'); return; }
    if (!detected && (arrived || h.sus < 60)) { h.state = 'search'; h.timer = 4; h.sus = Math.min(h.sus, 80); bark(h, R.pick(['Where did it go?', 'I KNOW you\'re here...', 'Weird...'])); }
  }

  h.facing = angleDamp(h.facing, h.lookGoal, h.state === 'chase' ? 10 : 5, dt);
  h.prevX = h.x; h.prevZ = h.z;
  h.model.position.set(h.x, 0, h.z); h.model.rotation.y = h.facing;
  h.shadow.position.set(h.x, 0.02, h.z);
  animateWalk(h.model, h.phase, moving ? 1 : 0);
  setIcon(h, h.state === 'chase' ? '!' : h.sus > 35 ? '?' : '');
  if (h.icon) h.icon.scale.setScalar(0.55 + Math.min(1, h.sus / 100) * 0.3 + (h.state === 'chase' ? Math.sin(G.time * 12) * 0.06 : 0));
  updateCone(h);
}

function updateHumans(dt) {
  let chasing = 0;
  for (const h of G.humans) { updateHuman(h, dt); if (G.state !== 'play') return; if (h.state === 'chase') chasing++; }
  G.alertLevel = chasing;
  updateProjectiles(dt);
}

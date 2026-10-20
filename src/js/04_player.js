// ============ Player: movement, shapeshifting into anything, loot, burrow ============

let BAG_SIZE = 5; // set from the Bigger Backpack upgrade each heist
const BUNNY_FORM = { name: 'Bunny', speed: 4.6, radius: 0.3 };
const HUMAN_FORM = { speed: 3.6, radius: 0.36 };
const SPRINT_MULT = 1.6;
const MIN_SHIFT = 2; // seconds of shapeshift charge needed to start a disguise
const RECHARGE_TIME = 8; // seconds to refill from empty

function createPlayer(x, z) {
  const up = G.up;
  const p = {
    x, z, vx: 0, vz: 0, facing: 0, form: 'bunny', def: BUNNY_FORM, person: null, source: null, model: null,
    shadow: blobShadow(0.45), carried: [], hearts: up.hearts, invuln: 0, moving: false, sprinting: false,
    phase: 0, hold: 0, grab: null, shift: null, atBurrow: false, speed: 0, stillT: 0,
    energy: up.shift, energyMax: up.shift,
  };
  G.world.add(p.shadow);
  setPlayerModel(p, makeBunny());
  return p;
}
function setPlayerModel(p, m) {
  if (p.model) G.world.remove(p.model);
  p.model = m; G.world.add(m);
  m.position.set(p.x, 0, p.z); m.rotation.y = p.facing;
}
const carriedValue = (p) => p.carried.reduce((a, l) => a + l.value, 0);

// Bigger things are slower and wider
function thingForm(name, w, d, h) {
  const size = Math.max(w, d);
  return { name, speed: clamp(4.5 - size * 0.8 - h * 0.25, 2.0, 4.4), radius: clamp((size / 2) * 0.85, 0.2, 0.8) };
}
// Copy any object's model, sitting on the floor and centred on the player
function cloneThing(src) {
  const inner = src.obj.clone();
  inner.position.set(0, 0, 0); inner.rotation.set(0, 0, 0); inner.scale.set(1, 1, 1);
  const g = new THREE.Group(); g.add(inner);
  g.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(inner);
  const size = box.getSize(new THREE.Vector3());
  const s = Math.max(size.x, size.y, size.z) < 0.4 ? 0.4 / Math.max(size.x, size.y, size.z, 0.01) : 1;
  inner.scale.setScalar(s);
  inner.position.set((-(box.min.x + box.max.x) / 2) * s, -box.min.y * s, (-(box.min.z + box.max.z) / 2) * s);
  g.userData = { kind: 'thing' };
  return { model: g, w: size.x * s, d: size.z * s, h: size.y * s };
}

// t: { kind: 'bunny' } | { kind: 'human', ref: human } | { kind: 'thing', ref: { name, obj } }
function applyForm(p, t) {
  let model;
  if (t.kind === 'bunny') { p.form = 'bunny'; p.def = BUNNY_FORM; p.person = null; p.source = null; model = makeBunny(); }
  else if (t.kind === 'human') { p.form = 'human'; p.person = t.ref.person; p.source = null; p.def = Object.assign({ name: t.ref.person.name }, HUMAN_FORM); model = makeHuman(t.ref.person); }
  else { const c = cloneThing(t.ref); p.form = 'thing'; p.person = null; p.source = t.ref.obj; p.def = thingForm(t.ref.name, c.w, c.d, c.h); model = c.model; }
  setPlayerModel(p, model);
  const pos = { x: p.x, z: p.z }; collideCircle(pos, p.def.radius); p.x = pos.x; p.z = pos.z;
  p.model.position.set(p.x, 0, p.z);
  refreshInventoryHud();
}
function shapeshift(p, t) {
  applyForm(p, t);
  FX.puff(new THREE.Vector3(p.x, 0.3, p.z), t.kind === 'bunny' ? 0xffffff : 0xe8e0ff, 16);
  Sfx.play(t.kind === 'bunny' ? 'unpoof' : 'poof');
  G.stats.shifts++;
  witness(p.x, p.z, 100); // anyone who watches you transform knows what's up
  hint('shifted');
}

function dropLoot(l, x, z) {
  l.taken = false; l.x = x; l.z = z;
  l.y = LOOT_TYPES[l.id].wall ? 0.45 : 0;
  l.baseY = l.y;
  l.obj.position.set(x, l.y, z);
  l.glow.position.set(x, 0.02, z);
  G.world.add(l.obj); G.world.add(l.glow);
}

function hurtPlayer(p, fromX, fromZ) {
  if (p.invuln > 0 || G.state !== 'play' || G.mode === 'tutorial') return;
  p.hearts--; p.invuln = 1.8; G.stats.hits++;
  Sfx.play('hit'); shake = 0.25;
  const dx = p.x - fromX, dz = p.z - fromZ, d = Math.hypot(dx, dz) || 1;
  p.vx = (dx / d) * 9; p.vz = (dz / d) * 9;
  // everything you carry goes flying
  for (const l of p.carried) {
    const a = Math.random() * Math.PI * 2, r = 0.8 + Math.random() * 1.2;
    const pos = { x: p.x + Math.cos(a) * r, z: p.z + Math.sin(a) * r };
    collideCircle(pos, 0.25);
    dropLoot(l, pos.x, pos.z);
  }
  p.carried = [];
  if (p.form !== 'bunny') { applyForm(p, { kind: 'bunny' }); FX.puff(new THREE.Vector3(p.x, 0.4, p.z), 0xffffff, 12); }
  Popups.add('BONK!', new THREE.Vector3(p.x, 0.5, p.z), '#ff4f62');
  refreshInventoryHud();
  if (p.hearts <= 0) endGame('caught');
}

function grabLoot(p, l) {
  if (p.carried.length >= BAG_SIZE) {
    toast(`Bag is full (${BAG_SIZE}/${BAG_SIZE}). Drop it off at the burrow!`);
    Sfx.play('nope');
    return;
  }
  l.taken = true;
  G.world.remove(l.obj); G.world.remove(l.glow);
  p.carried.push(l);
  FX.puff(new THREE.Vector3(l.x, l.y + 0.2, l.z), 0xffd34d, 8, 0.6, 2);
  Sfx.play('pickup');
  Popups.add(`${l.icon} ${money(l.value)}`, new THREE.Vector3(l.x, l.y, l.z), '#8fe3a0');
  // a lamp reaching out to grab a watch is a dead giveaway
  witness(p.x, p.z, p.form === 'thing' ? 100 : p.form === 'human' ? 35 : 50);
  if (p.carried.length >= BAG_SIZE) hint('full');
  refreshInventoryHud();
}

function bankLoot(p) {
  if (!p.carried.length) return;
  p.carried.forEach((l, i) => {
    G.banked.push(l);
    setTimeout(() => Popups.add(`+${money(l.value)}`, new THREE.Vector3(p.x + ((i % 3) - 1) * 0.5, 0.4, p.z), '#8fe3a0', 1.6), i * 160);
  });
  p.carried = [];
  Sfx.play('bank');
  toast('Stashed in the burrow!', 1200);
  refreshInventoryHud();
}

// What E (grab) and F (shift) would do right now
function findTargets(p) {
  let grab = null, gd = Infinity, shift = null, sd = Infinity;
  for (const l of G.loot) {
    if (l.taken) continue;
    const d = dist2D(p.x, p.z, l.x, l.z);
    if (d < 1.25 + p.def.radius && d < gd) { gd = d; grab = l; }
    if (d < 0.8 + p.def.radius && d < sd && l.obj !== p.source) { sd = d; shift = { kind: 'thing', ref: { name: l.name, obj: l.obj }, x: l.x, z: l.z, r: 0.45 }; }
  }
  for (const s of G.shiftables) {
    if (s.obj === p.source) continue;
    let d;
    if (s.flat) d = dist2D(p.x, p.z, s.x, s.z) - 0.4; // rugs: stand near the middle
    else { const cx = clamp(p.x, s.minX, s.maxX), cz = clamp(p.z, s.minZ, s.maxZ); d = Math.hypot(p.x - cx, p.z - cz); }
    if (d < 0.7 + p.def.radius && d < sd) { sd = d; shift = { kind: 'thing', ref: s, x: s.x, z: s.z, r: Math.max(s.w, s.d) / 2 + 0.15 }; }
  }
  for (const h of G.humans) {
    if (p.form === 'human' && p.person === h.person) continue;
    const d = dist2D(p.x, p.z, h.x, h.z) - 0.3;
    if (d < 1.1 && d < sd) { sd = d; shift = { kind: 'human', ref: h, x: h.x, z: h.z, r: 0.55 }; }
  }
  return { grab, shift };
}

function tryShift(p) {
  const t = p.shift;
  if (!t) { if (p.form !== 'bunny') shapeshift(p, { kind: 'bunny' }); return; } // nothing nearby: back to bunny
  const nope = (msg) => { toast(msg); Sfx.play('nope'); };
  if (t.kind === 'human' && !G.up.human) return nope('Copying humans is a perk. Buy Human Disguise in the shop!');
  if (t.kind === 'human' && humanSees(t.ref, p.x, p.z)) return nope(`${t.ref.person.name} is looking right at you!`);
  if (p.energy < MIN_SHIFT) return nope('Your shapeshift is still recharging!');
  shapeshift(p, t);
}

function updatePlayer(p, dt) {
  const inp = Input.move();
  p.sprinting = Input.down('shift') || Input.touchRun;
  const spd = p.def.speed * G.up.speed * (p.sprinting ? SPRINT_MULT : 1);
  p.vx = damp(p.vx, inp.x * spd, 12, dt);
  p.vz = damp(p.vz, inp.z * spd, 12, dt);
  const pos = { x: p.x + p.vx * dt, z: p.z + p.vz * dt };
  collideCircle(pos, p.def.radius);
  const b = G.house.bounds;
  pos.x = clamp(pos.x, b.minX - 8, b.maxX + 8); pos.z = clamp(pos.z, b.minZ - 8, b.maxZ + 8);
  p.speed = Math.hypot(pos.x - p.x, pos.z - p.z) / Math.max(dt, 1e-4);
  p.x = pos.x; p.z = pos.z;
  p.moving = p.speed > 0.35;
  p.stillT = p.moving ? 0 : p.stillT + dt;
  if (Math.hypot(inp.x, inp.z) > 0.1) p.facing = angleDamp(p.facing, Math.atan2(inp.x, inp.z), 14, dt);
  if (p.invuln > 0) p.invuln -= dt;

  // ---- shapeshift timer: drains while disguised, refills as a bunny ----
  if (p.form !== 'bunny') {
    if (!G.noDrain) p.energy -= dt;
    if (p.energy <= 0) { p.energy = 0; shapeshift(p, { kind: 'bunny' }); toast('Your disguise wore off!'); }
  } else p.energy = Math.min(p.energyMax, p.energy + (dt * p.energyMax) / RECHARGE_TIME);

  // ---- animation ----
  const m = p.model, u = m.userData;
  m.position.set(p.x, 0, p.z); m.rotation.y = p.facing;
  p.shadow.position.set(p.x, 0.02, p.z);
  p.shadow.scale.setScalar(p.form === 'thing' ? p.def.radius / 0.35 : 1);
  p.phase += dt * (p.moving ? (p.sprinting ? 17 : 12) : 0);
  if (p.form === 'bunny') {
    const hop = p.moving ? Math.abs(Math.sin(p.phase)) : 0;
    u.body.position.y = hop * 0.2;
    u.body.scale.set(1 + (1 - hop) * 0.06 * (p.moving ? 1 : 0), 1 - (1 - hop) * 0.08 * (p.moving ? 1 : 0), 1);
    const twitch = Math.sin(G.time * 3.1) > 0.97 ? 0.25 : 0;
    u.ears[0].rotation.x = -0.18 - hop * 0.4 - twitch; u.ears[1].rotation.x = -0.18 - hop * 0.4;
    u.sack.visible = p.carried.length > 0;
    if (u.sack.visible) u.sack.scale.setScalar(0.6 + (0.6 * p.carried.length) / BAG_SIZE);
  } else if (p.form === 'human') {
    animateWalk(m, p.phase * 0.7, p.moving ? 1 : 0);
  } else {
    // objects waddle when they move (a dead giveaway if anyone's looking)
    m.rotation.z = p.moving ? Math.sin(p.phase) * 0.12 : 0;
    m.position.y = p.moving ? Math.abs(Math.sin(p.phase)) * 0.08 : 0;
  }
  m.visible = p.invuln > 0 ? Math.floor(G.time * 14) % 2 === 0 : true;

  // ---- burrow: auto-stash, hold E to escape ----
  const bur = G.house.back.burrow;
  p.atBurrow = dist2D(p.x, p.z, bur.x, bur.z) < 2.0;
  if (p.atBurrow && p.carried.length) bankLoot(p);
  const T = findTargets(p);
  p.grab = p.atBurrow ? null : T.grab;
  p.shift = T.shift;
  if (p.shift && p.form === 'bunny') hint('shift', p.shift);

  // holding E (or Space, or the on-screen button) fills the ring; a dropped key-repeat only drains it a little
  if (p.atBurrow && Input.down('e', ' ') && tutorialCanEscape()) {
    p.hold += dt;
    if (p.hold >= 0.9) { p.hold = 0; endGame('escaped'); return; }
  } else p.hold = Math.max(0, p.hold - dt * 1.5);

  // ---- interact: E grabs (or shifts if there's nothing to grab), F always shifts ----
  if (!p.atBurrow && Input.hit('e', ' ')) { if (p.grab) grabLoot(p, p.grab); else if (p.shift) tryShift(p); }
  if (Input.hit('f')) tryShift(p);
  if (Input.hit('q', 'r') && p.form !== 'bunny') shapeshift(p, { kind: 'bunny' });

  // ---- noise: sprinting is loud ----
  p.noiseR = p.sprinting && p.moving ? (p.form === 'bunny' ? 3.5 : p.form === 'human' ? 4.5 : 5) * G.up.quiet : 0;
  if (p.noiseR) noise(p.x, p.z, p.noiseR, dt);
}

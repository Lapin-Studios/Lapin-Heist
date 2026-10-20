// ============ Tutorial: a small fixed house and step-by-step lessons ============

const TUTORIAL_SEED = 20261019;
const TUT_HOUSE = { C: 2, Rr: 1, colW: [9, 8.5], rowD: [7.5], backRoom: 0, backSide: 'S', types: ['living', 'bedroom'], noLoot: true };

const TUT_STEPS = [
  { text: 'Welcome, little thief! Hop inside through the back door with <span class="key">WASD</span> or the arrow keys.',
    done: (p) => !!roomAt(p.x, p.z) },
  { text: 'See the glowing stack of cash? Walk up to it and press <span class="key">E</span> to grab it.',
    done: (p) => p.carried.length > 0 },
  { text: 'Now find the cardboard box in this room. Stand next to it until a purple ring appears, then press <span class="key">F</span> to turn into it.',
    done: (p) => p.form === 'thing' },
  { text: 'Someone is coming! <b>Don\'t move a muscle.</b> Nobody notices a box that stands still.',
    start: spawnWalker, update: updateWalker },
  { text: 'Phew! In a real heist a disguise only lasts a few seconds (watch the purple bar). Press <span class="key">Q</span> to turn back into a bunny.',
    start: () => { G.noDrain = false; }, done: (p) => p.form === 'bunny' },
  { text: 'Loot only counts once it\'s safe in your burrow. Carry the cash back outside to the burrow.',
    done: () => G.banked.length > 0 },
  { text: 'Nice! Hold <span class="key">E</span> at the burrow to escape. In a real heist, get out before the sun comes up!',
    done: () => false },
];

function buildTutorialHouse() {
  buildHouse(TUT_HOUSE);
  const room = G.house.back.room, inside = G.house.back.inside;
  // a stack of cash a few steps inside the door, a cardboard box somewhere in the same room
  const spots = room.free.slice().sort((a, b) => dist2D(a.x, a.z, inside.x, inside.z) - dist2D(b.x, b.z, inside.x, inside.z));
  const spot = spots.find((s) => dist2D(s.x, s.z, inside.x, inside.z) > 2.2) || spots[0];
  const cash = addLoot(room, 'cash');
  if (cash) {
    cash.x = spot.x; cash.z = spot.z; cash.y = cash.baseY = 0;
    cash.obj.position.set(spot.x, 0, spot.z); cash.glow.position.set(spot.x, 0.015, spot.z);
  }
  if (!G.props.some((p) => p.room === room && p.prop === 'box')) addProp(room, 'box');
  addLoot(G.house.rooms[1], 'watch'); // a bonus for anyone who explores
}

function startTutorial() {
  G.tut = { step: 0 };
  renderTutStep();
}
function renderTutStep() {
  $('tutStep').textContent = `Tutorial · Step ${G.tut.step + 1} of ${TUT_STEPS.length}`;
  $('tutText').innerHTML = TUT_STEPS[G.tut.step].text;
}
function updateTutorial(dt) {
  const T = G.tut, s = TUT_STEPS[T.step], p = G.player;
  const done = s.update ? s.update(p, dt) : s.done(p);
  if (done && T.step < TUT_STEPS.length - 1) {
    T.step++;
    Sfx.play('pickup');
    const next = TUT_STEPS[T.step];
    if (next.start) next.start(p);
    renderTutStep();
  }
}
const tutorialCanEscape = () => G.mode !== 'tutorial' || G.tut.step === TUT_STEPS.length - 1;

// Dad wanders in, stares at you for a moment, then leaves. Move and he spots you.
function spawnWalker() {
  const T = G.tut, p = G.player;
  const far = G.house.rooms.find((r) => r !== G.house.back.room);
  const byDist = far.free.slice().sort((a, b) => dist2D(a.x, a.z, p.x, p.z) - dist2D(b.x, b.z, p.x, p.z));
  const start = byDist[Math.floor(byDist.length / 3)]; // not right next to you, but not a long walk either
  const h = createHuman(PEOPLE[0], start.x, start.z, far);
  const room = roomAt(p.x, p.z) || G.house.back.room;
  const near = room.free.filter((f) => { const d = dist2D(f.x, f.z, p.x, p.z); return d > 2.2 && d < 4.5 && lineClear(f.x, f.z, p.x, p.z); });
  const target = near.length ? near[0] : room.free[0];
  planTo(h, target.x, target.z);
  h.state = 'walk'; h.timer = 999;
  Object.assign(T, { walker: h, phase: 'approach', start, fail: false, t: 0 });
  bark(h, '*yawn* Midnight snack...');
}
function updateWalker(p, dt) {
  const T = G.tut, h = T.walker;
  if (!h) return false;
  if (!T.fail && (h.state === 'chase' || h.state === 'investigate')) {
    T.fail = true; T.t = 2.5;
    $('tutText').innerHTML = p.form === 'thing'
      ? 'He saw the box move! Only move when nobody is looking. Let\'s try that again.'
      : 'He spotted a bunny! Turn into something with <span class="key">F</span> first, then hold still.';
  }
  if (T.fail) {
    T.t -= dt;
    if (T.t <= 0) { removeHuman(h); T.walker = null; renderTutStep(); spawnWalker(); }
    return false;
  }
  h.timer = 999; // keep him on the script instead of wandering off
  if (T.phase === 'approach' && h.state === 'idle') { T.phase = 'look'; T.t = 2.5; }
  else if (T.phase === 'look') {
    h.lookGoal = Math.atan2(p.x - h.x, p.z - h.z);
    h.facing = angleDamp(h.facing, h.lookGoal, 8, dt); // turn to stare right at you
    T.t -= dt;
    if (T.t <= 0) { bark(h, 'Hm. Just a box.'); planTo(h, T.start.x, T.start.z); h.state = 'walk'; T.phase = 'leave'; }
  } else if (T.phase === 'leave' && h.state === 'idle') { removeHuman(h); T.walker = null; return true; }
  return false;
}

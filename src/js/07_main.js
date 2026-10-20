// ============ Main: setup, world reset, camera, wall cutaway, loop, screens ============

const CAM_OFF = { x: 0, y: 17.5, z: 11.5 };
const camLook = { x: 0, z: 0, set(x, y, z) { this.x = x; this.z = z; } };
let shake = 0;

function init() {
  if (!window.THREE) {
    $('err').hidden = false;
    $('err').textContent = 'The 3D engine could not load. Connect to the internet once and refresh this page.';
    $('startBtn').disabled = true;
    return;
  }
  let renderer;
  try { renderer = new THREE.WebGLRenderer({ antialias: devicePixelRatio < 2, powerPreference: 'high-performance' }); }
  catch (e) { $('err').hidden = false; $('err').textContent = 'This browser could not start WebGL. Try turning on hardware acceleration in Chrome settings.'; return; }
  G.renderer = renderer;
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
  renderer.setSize(innerWidth, innerHeight);
  $('game').appendChild(renderer.domElement);
  G.scene = new THREE.Scene();
  G.scene.background = new THREE.Color(0x10142c);
  G.scene.fog = new THREE.Fog(0x10142c, 32, 70);
  G.camera = new THREE.PerspectiveCamera(36, innerWidth / innerHeight, 0.1, 200);
  G.hemi = new THREE.HemisphereLight(0xc8d4ff, 0x2a2440, 0.62); G.scene.add(G.hemi);
  G.amb = new THREE.AmbientLight(0x4a4a78, 0.2); G.scene.add(G.amb);
  G.moon = new THREE.DirectionalLight(0xdfe4ff, 0.5); G.moon.position.set(6, 20, 10); G.scene.add(G.moon);
  G.glowMat = new THREE.MeshBasicMaterial({ color: 0xffd34d, transparent: true, opacity: 0.5, depthWrite: false, side: THREE.DoubleSide });
  addEventListener('resize', onResize);
  Input.init();
  setupTouch();
  setupButtons();
  setupShop();
  Save.load();
  G.frame = 0;
  showMenu();
  requestAnimationFrame(loop);
}

// Main menu with a random house slowly spinning behind it
function showMenu() {
  G.mode = 'menu'; G.up = currentUpgrades();
  R.seed((Math.random() * 1e9) | 0);
  resetWorld(); buildHouse(); spawnHumans(3);
  G.state = 'title';
  setSky(0);
  for (const id of ['hud', 'touch', 'end', 'shop', 'pause', 'tut']) $(id).hidden = true;
  $('title').hidden = false;
  refreshMenu();
}

function onResize() {
  G.camera.aspect = innerWidth / innerHeight;
  G.camera.updateProjectionMatrix();
  G.renderer.setSize(innerWidth, innerHeight);
}

function resetWorld() {
  if (G.world) {
    const keepGeo = new Set([...GeoCache.values(), ...CharGeo.values(), ...ObjGeo.values()]), keepMat = new Set(MatCache.values());
    G.world.traverse((o) => {
      if (!o.isMesh && !o.isPoints) return;
      if (!keepGeo.has(o.geometry)) o.geometry.dispose();
      const ms = Array.isArray(o.material) ? o.material : [o.material];
      for (const m of ms) if (!keepMat.has(m) && m !== G.glowMat) { if (m.map && !Object.values(FloorTex).includes(m.map)) m.map.dispose(); m.dispose(); }
    });
    G.scene.remove(G.world);
  }
  FX.clear(); Popups.clear();
  G.projectiles = []; G.humans = []; G.banked = []; G.player = null; G.alertLevel = 0; G.fireflies = null; G.pools = [];
  WallMats = null;
  G.world = new THREE.Group();
  G.scene.add(G.world);
}

function startGame(mode = 'heist') {
  Sfx.init(); Sfx.startMusic();
  G.mode = mode; G.up = currentUpgrades(); BAG_SIZE = G.up.bag; G.noDrain = mode === 'tutorial';
  G.seed = mode === 'tutorial' ? TUTORIAL_SEED : (Math.random() * 1e9) | 0;
  R.seed(G.seed);
  resetWorld();
  if (mode === 'tutorial') buildTutorialHouse(); else buildHouse();
  const n = G.house.rooms.length;
  spawnHumans(mode === 'tutorial' ? 0 : clamp(Math.round(n / 4) + 1, 3, 5));
  const b = G.house.back;
  G.player = createPlayer(b.burrow.x - b.dir[0] * 2.4, b.burrow.z - b.dir[1] * 2.4);
  G.player.facing = Math.atan2(-b.dir[0], -b.dir[1]);
  G.timeTotal = G.timeLeft = 150 + n * 12 + G.up.night;
  G.stats = { spotted: 0, shifts: 0, hits: 0 };
  Hints.seen.clear();
  const ringMat = (c) => new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: 0.85, depthWrite: false, side: THREE.DoubleSide });
  G.hl = new THREE.Mesh(geo('RingGeometry', 0.84, 1, 36), ringMat(0xa99cff));
  G.noiseRing = new THREE.Mesh(geo('RingGeometry', 0.92, 1, 40), ringMat(0xffffff));
  for (const r of [G.hl, G.noiseRing]) { r.rotation.x = -Math.PI / 2; r.visible = false; r.renderOrder = 3; G.world.add(r); }
  buildMinimapBase();
  refreshInventoryHud();
  for (const k in hudCache) delete hudCache[k];
  $('title').hidden = true; $('end').hidden = true; $('pause').hidden = true; $('shop').hidden = true; $('hud').hidden = false;
  $('touch').hidden = !Input.isTouch;
  $('tut').hidden = mode !== 'tutorial';
  G.state = 'play';
  setSky(0);
  camLook.set(G.player.x, 0, G.player.z);
  if (mode === 'tutorial') startTutorial();
  else toast('Sneak in through the back door. Watch out for the vision cones!', 3200);
}

function endGame(reason) {
  if (G.state !== 'play') return;
  G.state = 'end';
  const p = G.player;
  const lost = p.carried.slice();
  Sfx.play(reason === 'escaped' ? 'win' : reason === 'caught' ? 'caught' : 'alert');
  if (reason === 'escaped') { FX.puff(new THREE.Vector3(p.x, 0.3, p.z), 0x6b4a2e, 18); p.model.visible = false; }
  if (reason === 'caught') shake = 0.5;
  $('touch').hidden = true; $('pGrab').hidden = true; $('pShift').hidden = true; $('pBack').hidden = true; $('alert').hidden = true;
  G.hl.visible = false; G.noiseRing.visible = false; $('tut').hidden = true;
  setTimeout(() => { $('hud').hidden = true; if (G.mode === 'tutorial') showTutorialDone(); else showEndReport(reason, lost); }, reason === 'quit' ? 50 : 1300);
}

function setPaused(on) {
  if (on && G.state === 'play') { G.state = 'paused'; $('pause').hidden = false; $('resumeBtn').focus(); }
  else if (!on && G.state === 'paused') { G.state = 'play'; $('pause').hidden = true; }
}

function setupButtons() {
  $('startBtn').addEventListener('click', () => startGame('heist'));
  $('againBtn').addEventListener('click', () => startGame('heist'));
  $('tutorialBtn').addEventListener('click', () => startGame('tutorial'));
  $('shopBtn').addEventListener('click', () => openShop('title'));
  $('endShopBtn').addEventListener('click', () => openShop('end'));
  $('menuBtn').addEventListener('click', showMenu);
  $('tutSkip').addEventListener('click', showMenu);
  $('resumeBtn').addEventListener('click', () => setPaused(false));
  $('quitBtn').addEventListener('click', () => {
    $('pause').hidden = true;
    if (G.mode === 'tutorial') return showMenu();
    G.state = 'play'; endGame('quit');
  });
  $('pauseBtn').addEventListener('click', () => setPaused(true));
  document.addEventListener('visibilitychange', () => { if (document.hidden) setPaused(true); });
}

// ---------- First-time tips ----------
const Hints = { seen: new Set() };
function hint(key, arg) {
  if (G.state !== 'play' || Hints.seen.has(key)) return;
  Hints.seen.add(key);
  const msg = {
    shift: arg && arg.kind === 'human' ? `Press F to copy ${arg.ref.person.name}. Only works from behind!` : `Press F to turn into the ${arg && arg.ref.name}!`,
    shifted: 'Stand still and nobody notices you. Move while someone looks and they chase you! Press Q to turn back.',
    full: 'Bag full! Take it to the burrow outside the back door.',
  }[key];
  if (msg) toast(msg, 3200);
}

// Ring under whatever F would turn you into, and a ring showing how far your sprinting is heard
function updateMarkers(dt) {
  const p = G.player, t = p.shift;
  G.hl.visible = !!t;
  if (t) {
    const x = t.kind === 'human' ? t.ref.x : t.x, z = t.kind === 'human' ? t.ref.z : t.z;
    G.hl.position.set(x, 0.05, z);
    G.hl.scale.setScalar((t.r || 0.5) * (1 + Math.sin(G.time * 6) * 0.06));
  }
  if (p.noiseR) {
    G.noiseT = ((G.noiseT || 0) + dt * 1.8) % 1;
    G.noiseRing.visible = true;
    G.noiseRing.position.set(p.x, 0.06, p.z);
    G.noiseRing.scale.setScalar(Math.max(0.05, G.noiseT * p.noiseR));
    G.noiseRing.material.opacity = 0.6 * (1 - G.noiseT);
  } else G.noiseRing.visible = false;
}

let zoomLevel = 1;
addEventListener('wheel', (e) => { if (G.state === 'play') zoomLevel = clamp(zoomLevel * (e.deltaY > 0 ? 1.08 : 0.93), 0.6, 1.6); }, { passive: true });

function updateCamera(dt) {
  const p = G.player;
  camLook.x = damp(camLook.x, p.x, 6, dt); camLook.z = damp(camLook.z, p.z, 6, dt);
  if (Input.down('-', '_')) zoomLevel = clamp(zoomLevel * (1 + dt), 0.6, 1.6);
  if (Input.down('=', '+')) zoomLevel = clamp(zoomLevel * (1 - dt), 0.6, 1.6);
  const zoom = (innerWidth < innerHeight ? 1.35 : 1) * zoomLevel;
  G.camera.position.set(camLook.x + CAM_OFF.x * zoom, CAM_OFF.y * zoom, camLook.z + CAM_OFF.z * zoom);
  if (shake > 0) { shake -= dt; G.camera.position.x += (Math.random() - 0.5) * shake; G.camera.position.y += (Math.random() - 0.5) * shake; }
  G.camera.lookAt(camLook.x, 0.4, camLook.z);
}

// Lower the walls that stand between the camera and the bunny
function updateCutaway(dt) {
  const p = G.player;
  for (const w of G.walls) {
    let target = 1;
    if (w.horiz) { const dz = w.cz - p.z; if (dz > 0.15 && dz < 9 && p.x > w.minX - 7 && p.x < w.maxX + 7) target = 0.12; }
    else if (w.minZ > p.z - 0.3 && w.minZ - p.z < 8 && Math.abs(w.cx - p.x) < 8) target = 0.12;
    if (Math.abs(w.cut - target) > 0.001) {
      w.cut = damp(w.cut, target, 9, dt);
      w.mesh.scale.y = w.cut; w.mesh.position.y = (WALL_H * w.cut) / 2;
    }
  }
}

function animateLoot(dt) {
  G.glowMat.opacity = 0.32 + Math.sin(G.time * 4) * 0.2;
  for (const l of G.loot) {
    if (l.taken || !l.spin) continue;
    l.obj.rotation.y += dt * 1.4;
    l.obj.position.y = l.baseY + 0.06 + Math.sin(G.time * 3 + l.x) * 0.04;
  }
}

let lastT = performance.now();
function loop(now) {
  requestAnimationFrame(loop);
  const dt = Math.min(0.05, (now - lastT) / 1000);
  lastT = now;
  G.time += dt; G.frame++;
  if (G.state === 'play') {
    if (Input.hit('p', 'escape')) setPaused(true);
    else {
      updatePlayer(G.player, dt);
      if (G.state === 'play') updateHumans(dt);
      if (G.state === 'play' && G.mode === 'tutorial') updateTutorial(dt);
      else if (G.state === 'play') {
        G.timeLeft -= dt;
        if (G.timeLeft <= 0) { G.timeLeft = 0; endGame('sunrise'); }
        setSky(clamp((1 - G.timeLeft / G.timeTotal - 0.72) / 0.28, 0, 1)); // sunrise over the last stretch
      }
      updateCutaway(dt);
      if (G.state === 'play') { updateHud(); updateMarkers(dt); }
    }
    updateCamera(dt);
  } else if (G.state === 'paused') {
    if (Input.hit('p', 'escape')) setPaused(false);
  } else if (G.state === 'end') {
    updateCamera(dt);
    updateProjectiles(dt);
  } else if (G.state === 'title') {
    const b = G.house.bounds, cx = (b.minX + b.maxX) / 2, cz = (b.minZ + b.maxZ) / 2, r = Math.max(b.maxX - b.minX, b.maxZ - b.minZ) * 0.85;
    G.camera.position.set(cx + Math.sin(G.time * 0.08) * r, r * 0.9, cz + Math.cos(G.time * 0.08) * r);
    G.camera.lookAt(cx, 0, cz);
    for (const h of G.humans) {
      if (h.state === 'sleep') continue;
      if (h.state === 'walk') { if (stepAlong(h, SPEED.walk, dt)) { h.state = 'idle'; h.timer = R.f(1, 3); } }
      else { h.timer -= dt; if (h.timer <= 0) pickPatrol(h); }
      h.facing = angleDamp(h.facing, h.lookGoal, 5, dt);
      h.model.position.set(h.x, 0, h.z); h.model.rotation.y = h.facing; h.shadow.position.set(h.x, 0.02, h.z);
      animateWalk(h.model, h.phase, h.state === 'walk' ? 1 : 0);
      h.prevX = h.x; h.prevZ = h.z;
    }
  }
  if (Input.hit('m')) toast(Sfx.toggleMute() ? 'Sound off' : 'Sound on', 900);
  animateLoot(dt);
  updateFireflies();
  FX.update(dt);
  Popups.update(dt);
  Input.endFrame();
  G.renderer.render(G.scene, G.camera);
}

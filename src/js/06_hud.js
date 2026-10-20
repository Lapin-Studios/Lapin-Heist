// ============ HUD, minimap, end report, touch controls ============

const $ = (id) => document.getElementById(id);
const HEART_SVG = '<svg class="heart{c}" viewBox="0 0 24 22"><path fill="#ff4f62" d="M12 21s-9-5.6-9-12.2C3 5.2 5.5 3 8.3 3c1.7 0 3 .8 3.7 2 .7-1.2 2-2 3.7-2C18.5 3 21 5.2 21 8.8 21 15.4 12 21 12 21z"/></svg>';
const hudCache = {};
function setText(id, txt) { if (hudCache[id] !== txt) { hudCache[id] = txt; $(id).textContent = txt; } }
const bankedTotal = () => G.banked.reduce((a, l) => a + l.value, 0);

function refreshInventoryHud() {
  const p = G.player;
  if (!p) return;
  $('formName').textContent = p.form === 'human' ? `${p.person.name} (fake)` : p.def.name;
  let bar = '';
  for (let i = 0; i < BAG_SIZE; i++) {
    const l = p.carried[i];
    bar += l ? `<i class="on" title="${l.name} · ${money(l.value)}">${l.icon}</i>` : '<i></i>';
  }
  $('capBar').innerHTML = bar;
  $('tForm').hidden = p.form === 'bunny';
}

function updateHud() {
  const p = G.player;
  const t = Math.ceil(G.timeLeft);
  if (G.mode === 'tutorial') { setText('timer', 'Practice'); setText('timerLbl', 'no time limit'); }
  else setText('timer', `${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')}`);
  $('timer').classList.toggle('low', G.mode !== 'tutorial' && t <= 30);
  setText('stash', money(bankedTotal()));
  const hk = 'h' + p.hearts;
  if (hudCache.hearts !== hk) {
    hudCache.hearts = hk;
    let s = ''; for (let i = 0; i < G.up.hearts; i++) s += HEART_SVG.replace('{c}', i < p.hearts ? '' : ' lost');
    $('hearts').innerHTML = s;
  }
  // shapeshift timer bar
  const bar = $('energyBar'), e = p.energy, em = p.energyMax;
  bar.style.width = ((100 * e) / em).toFixed(1) + '%';
  let et, ec = '';
  if (p.form !== 'bunny') { et = G.noDrain ? 'Disguised' : `Disguise: ${Math.ceil(e)}s left`; ec = e < 3 && !G.noDrain ? 'low' : ''; }
  else if (e < em - 0.05) { et = e < MIN_SHIFT ? 'Recharging...' : `Shapeshift: ${Math.floor(e)}/${em}s`; ec = 'charging'; }
  else et = `Shapeshift ready (${em}s)`;
  setText('energyText', et);
  if (bar.className !== ec) bar.className = ec;
  $('alert').hidden = G.alertLevel === 0;

  // grab prompt (or escape, at the burrow)
  let gText = '', gBad = false;
  if (p.atBurrow) gText = bankedTotal() > 0 ? `Hold E to escape with ${money(bankedTotal())}` : 'Hold E to give up and go home';
  else if (p.grab) {
    const l = p.grab;
    if (p.carried.length >= BAG_SIZE) { gBad = true; gText = `Bag full (${BAG_SIZE}/${BAG_SIZE})`; }
    else gText = `Grab ${l.icon} ${l.name} · ${money(l.value)}`;
  }
  $('pGrab').hidden = !gText;
  if (gText) { setText('pGrabText', gText); $('pGrab').classList.toggle('bad', gBad); }
  // SVG elements ignore .hidden, so the ring is shown with style.display
  $('holdRing').style.display = p.atBurrow ? '' : 'none';
  if (p.atBurrow) $('holdArc').style.strokeDashoffset = String(106.8 * (1 - clamp(p.hold / 0.9, 0, 1)));
  // shift prompt
  const sh = p.shift;
  let sText = '', sBad = false;
  if (sh) {
    if (sh.kind === 'human') {
      const nm = sh.ref.person.name;
      if (!G.up.human) { sBad = true; sText = `Copy ${nm}: buy the Human Disguise perk`; }
      else if (humanSees(sh.ref, p.x, p.z)) { sBad = true; sText = `${nm} can see you!`; }
      else sText = `Copy ${nm}`;
    } else sText = `Become the ${sh.ref.name}`;
    if (!sBad && p.energy < MIN_SHIFT) { sBad = true; sText = 'Shapeshift recharging...'; }
  }
  $('pShift').hidden = !sText;
  if (sText) { setText('pShiftText', sText); $('pShift').classList.toggle('bad', sBad); }
  $('pBack').hidden = p.form === 'bunny';
  setText('tAct', p.atBurrow ? 'ESCAPE' : 'GRAB');
  setText('tShift', sh && sh.kind === 'human' ? 'COPY' : 'SHIFT');

  // are you safe right now?
  const seen = G.humans.some((h) => h.sees);
  let st = 'Sneaking', cls = '';
  if (p.form === 'thing') {
    if (p.moving) { st = seen ? 'Spotted moving!' : 'Moving: freeze if anyone looks'; cls = seen ? 'danger' : 'warn'; }
    else { st = 'Hidden in plain sight'; cls = 'safe'; }
  } else if (p.form === 'human') {
    const twin = G.humans.some((h) => h.sees && h.person === p.person), running = p.sprinting && p.moving;
    st = twin ? 'Your twin sees you!' : running ? 'Running looks suspicious' : 'Blending in';
    cls = twin ? 'danger' : running ? 'warn' : 'safe';
  } else if (seen) { st = 'Someone sees you!'; cls = 'danger'; }
  if (hudCache.status !== st) { hudCache.status = st; $('status').textContent = st; $('status').className = 'status ' + cls; }
  if (G.frame % 3 === 0) drawMinimap();
}

// ---------- Minimap ----------
const Mini = { base: null, scale: 1, ox: 0, oz: 0 };
function buildMinimapBase() {
  const cv = $('minimap'), b = G.house.bounds;
  const W = cv.width, H = cv.height, pad = 10;
  const mw = b.maxX - b.minX + 8, md = b.maxZ - b.minZ + 8;
  Mini.scale = Math.min((W - pad * 2) / mw, (H - pad * 2) / md);
  Mini.ox = W / 2 - ((b.minX + b.maxX) / 2) * Mini.scale; Mini.oz = H / 2 - ((b.minZ + b.maxZ) / 2) * Mini.scale;
  const c = document.createElement('canvas'); c.width = W; c.height = H;
  const x = c.getContext('2d');
  const sx = (v) => Mini.ox + v * Mini.scale, sz = (v) => Mini.oz + v * Mini.scale;
  x.fillStyle = 'rgba(48,55,107,.55)';
  x.fillRect(sx(b.minX), sz(b.minZ), (b.maxX - b.minX) * Mini.scale, (b.maxZ - b.minZ) * Mini.scale);
  x.fillStyle = '#f7eed6';
  for (const w of G.walls) x.fillRect(sx(w.minX), sz(w.minZ), Math.max(1, (w.maxX - w.minX) * Mini.scale), Math.max(1, (w.maxZ - w.minZ) * Mini.scale));
  const bur = G.house.back.burrow;
  x.fillStyle = '#ff8c42'; x.beginPath(); x.arc(sx(bur.x), sz(bur.z), 4, 0, 7); x.fill();
  Mini.base = c;
}
function drawMinimap() {
  const cv = $('minimap'), x = cv.getContext('2d');
  x.clearRect(0, 0, cv.width, cv.height);
  if (Mini.base) x.drawImage(Mini.base, 0, 0);
  const sx = (v) => Mini.ox + v * Mini.scale, sz = (v) => Mini.oz + v * Mini.scale;
  for (const h of G.humans) {
    x.fillStyle = h.state === 'chase' ? '#ff4f62' : h.sus > 35 ? '#ffa040' : '#ffe08a';
    x.beginPath(); x.arc(sx(h.x), sz(h.z), 3, 0, 7); x.fill();
    x.strokeStyle = x.fillStyle; x.lineWidth = 1.5; x.beginPath(); x.moveTo(sx(h.x), sz(h.z));
    x.lineTo(sx(h.x + Math.sin(h.facing) * 2.2), sz(h.z + Math.cos(h.facing) * 2.2)); x.stroke();
  }
  const p = G.player;
  x.fillStyle = '#ffffff'; x.strokeStyle = '#161a35'; x.lineWidth = 2;
  x.beginPath(); x.arc(sx(p.x), sz(p.z), 3.6, 0, 7); x.fill(); x.stroke();
}

// ---------- End report ----------
// One line on the fence's receipt: icon, name ....... value
function receiptRow(cls, icon, name, note, val, i) {
  return `<div class="end-row ${cls}" style="animation-delay:${0.15 + i * 0.12}s"><span class="ico">${icon}</span>`
    + `<span class="nm">${name}${note ? `<small>${note}</small>` : ''}</span><span class="dots"></span><span class="val">${val}</span></div>`;
}
const RANKS = [
  [0, 'Empty-Pawed Amateur'], [1, 'Carrot Pickpocket'], [1500, 'Cottontail Crook'], [6000, 'Burrow Baron'],
  [15000, 'Master of Disguise'], [30000, 'Legendary Lapin'],
];
function showEndReport(reason, lost) {
  const haul = bankedTotal();
  const bonuses = [];
  if (haul > 0 && G.stats.spotted === 0) bonuses.push({ icon: '👻', name: 'Ghost bonus', note: 'never spotted', value: Math.round(haul * 0.25) });
  if (haul > 0 && reason === 'escaped') bonuses.push({ icon: '⏰', name: 'Early bird bonus', note: `${Math.floor(G.timeLeft)}s before sunrise`, value: Math.floor(G.timeLeft) * 10 });
  if (haul > 0 && G.stats.hits === 0 && reason !== 'caught') bonuses.push({ icon: '🛡️', name: 'Untouched bonus', note: 'no slippers to the face', value: 250 });
  const total = haul + bonuses.reduce((a, b) => a + b.value, 0);
  const titles = {
    escaped: ['Clean Getaway!', 'You hopped home with everything in the burrow.'],
    caught: [G.player.hearts <= 0 ? 'Slippered!' : 'Busted!', 'The family caught you, but whatever made it to the burrow is still yours.'],
    sunrise: ['Sunrise!', 'The family is waking up. You slip away with what made it to the burrow.'],
    quit: ['Went Home Early', 'Sometimes a bunny just needs a nap. You keep what made it to the burrow.'],
  };
  const [title, sub] = titles[reason];
  $('endTitle').textContent = title;
  $('endTitle').classList.toggle('bad', reason === 'caught');
  $('endSub').textContent = sub + (lost.length ? ` ${lost.length} item${lost.length > 1 ? 's were' : ' was'} still in your paws and got left behind.` : '');
  const rows = G.banked.slice().sort((a, b) => b.value - a.value);
  let html = '';
  let n = 0;
  rows.forEach((l) => { html += receiptRow('', l.icon, l.name, '', money(l.value), n++); });
  bonuses.forEach((b) => { html += receiptRow('bonus', b.icon, b.name, b.note, '+' + money(b.value), n++); });
  lost.forEach((l) => { html += receiptRow('lost', l.icon, l.name, 'left behind', money(l.value), n++); });
  if (!rows.length && !lost.length) html = '<div class="end-empty">Nothing stolen this time. The burrow is very empty.</div>';
  $('endList').innerHTML = html;
  let rank = RANKS[0][1];
  for (const [min, name] of RANKS) if (total >= min) rank = name;
  $('endRank').textContent = rank;
  const secs = Math.round(G.timeTotal - G.timeLeft);
  const best = Save.data.best;
  if (total > best) Save.data.best = total;
  Save.data.wallet += total; Save.data.heists++;
  Save.save();
  $('endWallet').innerHTML = `Added to your wallet: <b>+${money(total)}</b> &nbsp;·&nbsp; Wallet now <b>${money(Save.data.wallet)}</b>`;
  $('againBtn').textContent = 'Rob a New House';
  $('endEyebrow').textContent = 'Heist report';
  $('endRank').hidden = false; $('endStats').hidden = false;
  $('endStats').innerHTML = `<span>Items stashed <b>${rows.length}</b></span><span>Time <b>${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}</b></span><span>Times spotted <b>${G.stats.spotted}</b></span><span>Shapeshifts <b>${G.stats.shifts}</b></span>` + (total > best && best > 0 ? '<span><b>New best haul!</b></span>' : best ? `<span>Best <b>${money(Math.max(best, total))}</b></span>` : '');
  $('end').hidden = false;
  // money counter ticks up
  const start = performance.now(), dur = 900 + Math.min(2200, rows.length * 220);
  let lastTick = 0;
  const tick = (now) => {
    const k = clamp((now - start) / dur, 0, 1), e = 1 - Math.pow(1 - k, 3); // a frame can start slightly before `start`
    $('endTotal').textContent = money(total * e);
    if (now - lastTick > 70 && k < 1 && total > 0) { Sfx.play('coin'); lastTick = now; }
    if (k < 1) requestAnimationFrame(tick); else if (total > 0) Sfx.play('bank');
  };
  $('endTotal').textContent = '$0';
  setTimeout(() => requestAnimationFrame(tick), 300 + rows.length * 120);
}

function showTutorialDone() {
  const first = !Save.data.tutorialDone;
  if (first) { Save.data.tutorialDone = true; Save.data.wallet += TUTORIAL_REWARD; Save.save(); }
  $('endEyebrow').textContent = 'Tutorial';
  $('endTitle').textContent = 'You\'re ready!';
  $('endTitle').classList.remove('bad');
  $('endSub').textContent = 'Real houses are bigger, the family wanders around, and some of them are asleep. Grab what you can, stash it in the burrow, and escape before sunrise.';
  $('endList').innerHTML = first ? receiptRow('bonus', '🎓', 'Tutorial reward', 'first time only', '+' + money(TUTORIAL_REWARD), 0) : '<div class="end-empty">You already collected the tutorial reward.</div>';
  $('endTotal').textContent = money(first ? TUTORIAL_REWARD : 0);
  $('endRank').hidden = true; $('endStats').hidden = true;
  $('endWallet').innerHTML = `Wallet now <b>${money(Save.data.wallet)}</b>`;
  $('againBtn').textContent = 'Start a Real Heist';
  $('end').hidden = false;
}

// ---------- Main menu and shop ----------
function refreshMenu() {
  $('walletTitle').textContent = money(Save.data.wallet);
  $('best').textContent = Save.data.best ? `Best haul: ${money(Save.data.best)}` : '';
  $('tutorialBtn').textContent = Save.data.tutorialDone ? 'Tutorial' : 'Tutorial (+$500)';
}
function renderShop() {
  $('walletShop').textContent = money(Save.data.wallet);
  let html = '';
  for (const u of UPGRADES) {
    const lv = Save.level(u.id), cost = nextCost(u);
    const pips = u.costs.map((_, i) => `<i class="${i < lv ? 'on' : ''}"></i>`).join('');
    const next = cost !== null ? ` → <b>${u.fmt(u.values[lv + 1])}</b>` : ' <b>(maxed out)</b>';
    html += `<div class="shop-item${cost === null ? ' maxed' : ''}"><div class="shop-top"><span class="ico">${u.icon}</span><span class="nm">${u.name}</span></div>`
      + `<span class="desc">${u.desc}</span><span class="now">${u.fmt(u.values[lv])}${next}</span><div class="pips">${pips}</div>`
      + `<button class="buy" data-up="${u.id}"${cost === null || cost > Save.data.wallet ? ' disabled' : ''}>${cost === null ? 'Maxed out' : `Buy · ${money(cost)}`}</button></div>`;
  }
  for (const k of PERKS) {
    const owned = Save.has(k.id);
    html += `<div class="shop-item perk"><div class="shop-top"><span class="ico">${k.icon}</span><span class="nm">${k.name}</span></div>`
      + `<span class="desc">${k.desc}</span><span class="now">${owned ? '<b>Unlocked</b>' : 'Perk · one-time unlock'}</span>`
      + `<button class="buy" data-perk="${k.id}"${owned || k.cost > Save.data.wallet ? ' disabled' : ''}>${owned ? 'Owned' : `Unlock · ${money(k.cost)}`}</button></div>`;
  }
  $('shopList').innerHTML = html;
}
function openShop(from) {
  G.shopFrom = from;
  renderShop();
  $('title').hidden = true; $('end').hidden = true; $('shop').hidden = false;
  document.querySelector('.shop-panel').scrollTop = 0;
  $('shopBack').focus({ preventScroll: true });
}
function closeShop() {
  $('shop').hidden = true;
  if (G.shopFrom === 'end') { $('endWallet').innerHTML = `Wallet now <b>${money(Save.data.wallet)}</b>`; $('end').hidden = false; }
  else { refreshMenu(); $('title').hidden = false; }
}
function setupShop() {
  $('shopList').addEventListener('click', (e) => {
    const b = e.target.closest('.buy');
    if (!b || b.disabled) return;
    const ok = b.dataset.up ? buyUpgrade(b.dataset.up) : buyPerk(b.dataset.perk);
    if (ok) { Sfx.init(); Sfx.play('bank'); renderShop(); refreshMenu(); }
  });
  $('shopBack').addEventListener('click', closeShop);
  let armed = null;
  $('resetSave').addEventListener('click', () => {
    const btn = $('resetSave');
    if (!armed) { btn.textContent = 'Click again to erase everything'; armed = setTimeout(() => { armed = null; btn.textContent = 'Reset saved progress'; }, 3000); return; }
    clearTimeout(armed); armed = null;
    Save.reset(); btn.textContent = 'Progress erased';
    renderShop(); refreshMenu();
  });
}

// ---------- Touch controls ----------
function setupTouch() {
  const reveal = () => { if (G.state === 'play') $('touch').hidden = false; Input.isTouch = true; };
  addEventListener('touchstart', reveal, { passive: true });
  const joy = $('joy'), knob = $('joyKnob');
  let pid = null;
  const moveJoy = (e) => {
    const r = joy.getBoundingClientRect();
    let ox = e.clientX - (r.left + r.width / 2), oy = e.clientY - (r.top + r.height / 2);
    const l = Math.hypot(ox, oy), max = r.width * 0.38;
    if (l > max) { ox *= max / l; oy *= max / l; }
    knob.style.transform = `translate(${ox}px, ${oy}px)`;
    Input.joy.x = ox / max; Input.joy.z = oy / max; Input.joy.active = true;
  };
  joy.addEventListener('pointerdown', (e) => { pid = e.pointerId; joy.setPointerCapture(pid); moveJoy(e); });
  joy.addEventListener('pointermove', (e) => { if (e.pointerId === pid) moveJoy(e); });
  const endJoy = (e) => { if (e.pointerId !== pid) return; pid = null; knob.style.transform = ''; Input.joy.active = false; Input.joy.x = Input.joy.z = 0; };
  joy.addEventListener('pointerup', endJoy); joy.addEventListener('pointercancel', endJoy);
  const hold = (id, key) => {
    const el = $(id);
    el.addEventListener('pointerdown', (e) => { e.preventDefault(); Input.press(key); });
    for (const ev of ['pointerup', 'pointerleave', 'pointercancel']) el.addEventListener(ev, () => Input.release(key));
  };
  hold('tAct', 'e'); hold('tForm', 'q'); hold('tShift', 'f');
  hold('pGrab', 'e'); hold('pShift', 'f'); hold('pBack', 'q'); // on-screen prompts are clickable too
  $('tRun').addEventListener('pointerdown', (e) => { e.preventDefault(); Input.touchRun = !Input.touchRun; $('tRun').classList.toggle('on', Input.touchRun); });
}

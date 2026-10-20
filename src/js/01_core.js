'use strict';
// ============ Lapin Heist: core (rng, math, input, audio, effects) ============

const G = {
  state: 'title', // title | play | paused | end
  scene: null, camera: null, renderer: null, world: null,
  house: null, player: null, humans: [], loot: [], props: [], solids: [], walls: [],
  projectiles: [], banked: [], lostItems: [],
  time: 0, timeLeft: 240, seed: 0,
  stats: { spotted: 0, shifts: 0, hits: 0 },
  alertLevel: 0,
};

// ---------- Seeded random ----------
function mulberry32(a) {
  return function () {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
const R = {
  rand: Math.random,
  seed(s) { this.rand = mulberry32(s); },
  f(a, b) { return a + (b - a) * this.rand(); },
  i(a, b) { return Math.floor(this.f(a, b + 1)); },
  pick(arr) { return arr[Math.floor(this.rand() * arr.length)]; },
  chance(p) { return this.rand() < p; },
  shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) { const j = Math.floor(this.rand() * (i + 1)); [arr[i], arr[j]] = [arr[j], arr[i]]; }
    return arr;
  },
  weighted(list) {
    let tot = 0; for (const e of list) tot += e.w;
    let r = this.rand() * tot;
    for (const e of list) { r -= e.w; if (r <= 0) return e; }
    return list[list.length - 1];
  },
};

// ---------- Math ----------
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const lerp = (a, b, t) => a + (b - a) * t;
const damp = (a, b, k, dt) => lerp(a, b, 1 - Math.exp(-k * dt));
function angleDiff(a, b) { let d = (b - a) % (Math.PI * 2); if (d > Math.PI) d -= Math.PI * 2; if (d < -Math.PI) d += Math.PI * 2; return d; }
function angleDamp(a, b, k, dt) { return a + angleDiff(a, b) * (1 - Math.exp(-k * dt)); }
const money = (n) => (n > 0 && n < 20 && n % 1 ? '$' + n.toFixed(2) : '$' + Math.round(n).toLocaleString('en-US'));
const dist2D = (ax, az, bx, bz) => Math.hypot(ax - bx, az - bz);

// ---------- Input ----------
const Input = {
  keys: new Set(), pressed: new Set(),
  joy: { x: 0, z: 0, active: false },
  init() {
    addEventListener('keydown', (e) => {
      const k = e.key.toLowerCase();
      if (!this.keys.has(k)) this.pressed.add(k);
      this.keys.add(k);
      if ([' ', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(k) && G.state === 'play') e.preventDefault();
    });
    addEventListener('keyup', (e) => this.keys.delete(e.key.toLowerCase()));
    addEventListener('blur', () => this.keys.clear());
  },
  down(...ks) { return ks.some((k) => this.keys.has(k)); },
  hit(...ks) { return ks.some((k) => this.pressed.has(k)); },
  endFrame() { this.pressed.clear(); },
  move() {
    let x = 0, z = 0;
    if (this.down('w', 'arrowup')) z -= 1;
    if (this.down('s', 'arrowdown')) z += 1;
    if (this.down('a', 'arrowleft')) x -= 1;
    if (this.down('d', 'arrowright')) x += 1;
    if (this.joy.active) { x += this.joy.x; z += this.joy.z; }
    const l = Math.hypot(x, z);
    if (l > 1) { x /= l; z /= l; }
    return { x, z };
  },
  // virtual buttons from touch controls
  press(k) { if (!this.keys.has(k)) this.pressed.add(k); this.keys.add(k); },
  release(k) { this.keys.delete(k); },
};

// ---------- Audio (all synthesized, no files) ----------
const Sfx = {
  ctx: null, master: null, muted: false, musicTimer: null, step: 0, nextT: 0,
  init() {
    if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume(); return; }
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.45;
      this.master.connect(this.ctx.destination);
      const len = this.ctx.sampleRate * 0.5;
      this.noiseBuf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
      const d = this.noiseBuf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    } catch (e) { this.ctx = null; }
  },
  toggleMute() { this.muted = !this.muted; if (this.master) this.master.gain.value = this.muted ? 0 : 0.45; return this.muted; },
  tone(freq, dur, type = 'sine', vol = 0.25, slide = 0, delay = 0) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime + delay;
    const o = this.ctx.createOscillator(), g = this.ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, freq + slide), t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(this.master); o.start(t); o.stop(t + dur + 0.05);
  },
  noise(dur, vol = 0.25, freq = 1500, delay = 0, q = 1) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime + delay;
    const s = this.ctx.createBufferSource(), f = this.ctx.createBiquadFilter(), g = this.ctx.createGain();
    s.buffer = this.noiseBuf; f.type = 'bandpass'; f.frequency.value = freq; f.Q.value = q;
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f); f.connect(g); g.connect(this.master); s.start(t); s.stop(t + dur + 0.05);
  },
  play(name) {
    if (!this.ctx) return;
    switch (name) {
      case 'pickup': this.tone(784, 0.09, 'square', 0.12); this.tone(1175, 0.14, 'square', 0.12, 0, 0.07); break;
      case 'bank': this.noise(0.08, 0.3, 4000, 0, 2); this.tone(1568, 0.25, 'triangle', 0.2, 0, 0.05); this.tone(2093, 0.35, 'triangle', 0.18, 0, 0.12); break;
      case 'poof': this.noise(0.35, 0.35, 900, 0, 0.7); this.tone(300, 0.3, 'sine', 0.15, 500); break;
      case 'unpoof': this.noise(0.3, 0.3, 700, 0, 0.7); this.tone(700, 0.25, 'sine', 0.15, -400); break;
      case 'huh': this.tone(330, 0.18, 'triangle', 0.18, 140); break;
      case 'alert': this.tone(880, 0.12, 'square', 0.16); this.tone(660, 0.12, 'square', 0.16, 0, 0.12); this.tone(880, 0.2, 'square', 0.16, 0, 0.24); break;
      case 'throw': this.noise(0.18, 0.2, 2200, 0, 1.5); break;
      case 'hit': this.tone(160, 0.25, 'sawtooth', 0.25, -90); this.noise(0.15, 0.3, 500); break;
      case 'caught': [523, 392, 330, 262].forEach((f, i) => this.tone(f, 0.3, 'square', 0.16, 0, i * 0.18)); break;
      case 'win': [523, 659, 784, 1047].forEach((f, i) => this.tone(f, 0.25, 'triangle', 0.2, 0, i * 0.12)); break;
      case 'nope': this.tone(180, 0.15, 'square', 0.12); break;
      case 'coin': this.tone(1975, 0.06, 'square', 0.06); break;
    }
  },
  // Sneaky pizzicato bassline; speeds up and adds stabs while anyone is chasing.
  startMusic() {
    if (!this.ctx || this.musicTimer) return;
    const bass = [110, 0, 131, 0, 165, 0, 175, 165, 147, 0, 131, 0, 123, 0, 104, 0];
    this.step = 0; this.nextT = this.ctx.currentTime + 0.1;
    this.musicTimer = setInterval(() => {
      if (!this.ctx || G.state !== 'play') { this.nextT = this.ctx ? this.ctx.currentTime + 0.1 : 0; return; }
      const chase = G.alertLevel > 0;
      const stepDur = chase ? 0.15 : 0.21;
      while (this.nextT < this.ctx.currentTime + 0.15) {
        const n = bass[this.step % 16];
        const d = this.nextT - this.ctx.currentTime;
        if (n) this.tone(n, 0.18, 'triangle', 0.22, 0, d);
        if (this.step % 2 === 1) this.noise(0.04, 0.05, 7000, d, 3);
        if (chase && this.step % 4 === 0) this.tone(n ? n * 4 : 440, 0.08, 'square', 0.05, 0, d);
        this.step++; this.nextT += stepDur;
      }
    }, 50);
  },
};

// ---------- Particle effects ----------
const FX = {
  list: [],
  geo: null,
  puff(pos, color = 0xffffff, n = 14, spread = 1, up = 1.4) {
    if (!this.geo) this.geo = new THREE.IcosahedronGeometry(0.18, 0);
    for (let i = 0; i < n; i++) {
      const m = new THREE.Mesh(this.geo, new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.9 }));
      m.position.set(pos.x + (Math.random() - 0.5) * 0.4 * spread, pos.y + Math.random() * 0.5, pos.z + (Math.random() - 0.5) * 0.4 * spread);
      const a = Math.random() * Math.PI * 2, s = (1 + Math.random() * 2) * spread;
      m.userData = { vx: Math.cos(a) * s, vy: up * (0.5 + Math.random()), vz: Math.sin(a) * s, life: 0.5 + Math.random() * 0.4, age: 0, s0: 0.6 + Math.random() * 0.9 };
      G.scene.add(m); this.list.push(m);
    }
  },
  update(dt) {
    for (let i = this.list.length - 1; i >= 0; i--) {
      const m = this.list[i], u = m.userData;
      u.age += dt;
      const k = u.age / u.life;
      if (k >= 1) { G.scene.remove(m); m.material.dispose(); this.list.splice(i, 1); continue; }
      m.position.x += u.vx * dt; m.position.y += u.vy * dt; m.position.z += u.vz * dt;
      u.vx *= 0.9; u.vz *= 0.9;
      m.scale.setScalar(u.s0 * (1 + k * 1.2));
      m.material.opacity = 0.9 * (1 - k);
    }
  },
  clear() { for (const m of this.list) { G.scene.remove(m); m.material.dispose(); } this.list = []; },
};

// ---------- Floating text popups (DOM, follow a world point) ----------
const Popups = {
  list: [],
  add(text, pos, color = '#f7eed6', life = 1.3) {
    const el = document.createElement('div');
    el.className = 'pop'; el.textContent = text; el.style.color = color;
    document.getElementById('popups').appendChild(el);
    this.list.push({ el, pos: pos.clone(), age: 0, life });
  },
  update(dt) {
    const v = new THREE.Vector3();
    for (let i = this.list.length - 1; i >= 0; i--) {
      const p = this.list[i];
      p.age += dt;
      if (p.age > p.life) { p.el.remove(); this.list.splice(i, 1); continue; }
      v.copy(p.pos); v.y += 1.2 + p.age * 1.4;
      v.project(G.camera);
      p.el.style.left = ((v.x + 1) / 2 * innerWidth) + 'px';
      p.el.style.top = ((1 - v.y) / 2 * innerHeight) + 'px';
      p.el.style.opacity = String(Math.min(1, (p.life - p.age) * 3));
    }
  },
  clear() { for (const p of this.list) p.el.remove(); this.list = []; },
};

let toastTimer = null;
function toast(msg, ms = 1800) {
  const el = document.getElementById('toast');
  el.textContent = msg; el.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { el.hidden = true; }, ms);
}

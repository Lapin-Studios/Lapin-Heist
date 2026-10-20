// ============ Night sky, sunrise and fireflies ============

const SKY_NIGHT = { bg: 0x060918, sky: 0x5866a6, ground: 0x15112a, moon: 0x93a5ff, hemi: 0.68, amb: 0.17, moonI: 0.5 };
const SKY_DAWN = { bg: 0xf0a27a, sky: 0xffd6b0, ground: 0x4a3a44, moon: 0xffcf96, hemi: 0.72, amb: 0.2, moonI: 0.62 };
let skyK = -1;

// k = 0 deep night ... 1 sunrise
function setSky(k) {
  if (Math.abs(k - skyK) < 0.002) return;
  skyK = k;
  const N = SKY_NIGHT, D = SKY_DAWN, c = new THREE.Color();
  G.scene.background.setHex(N.bg).lerp(c.setHex(D.bg), k);
  G.scene.fog.color.copy(G.scene.background);
  G.hemi.color.setHex(N.sky).lerp(c.setHex(D.sky), k);
  G.hemi.groundColor.setHex(N.ground).lerp(c.setHex(D.ground), k);
  G.hemi.intensity = lerp(N.hemi, D.hemi, k);
  G.amb.intensity = lerp(N.amb, D.amb, k);
  G.moon.color.setHex(N.moon).lerp(c.setHex(D.moon), k);
  G.moon.intensity = lerp(N.moonI, D.moonI, k);
  $('night').style.opacity = String(1 - k);
  for (const pool of G.pools || []) pool.material.opacity = 0.85 * (1 - 0.85 * k);
  if (G.fireflies) G.fireflies.material.opacity = 0.9 * (1 - k);
  const lbl = $('timerLbl'), txt = k > 0 ? 'the sun is coming up!' : 'until sunrise';
  if (lbl.textContent !== txt) lbl.textContent = txt;
  $('clockChip').classList.toggle('dawn', k > 0);
}

function glowTexture() {
  if (!PoolTex) {
    const c = document.createElement('canvas'); c.width = c.height = 64;
    const g = c.getContext('2d'), gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.45, 'rgba(255,255,255,.4)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
    PoolTex = new THREE.CanvasTexture(c);
  }
  return PoolTex;
}

function addFireflies(house) {
  const b = house.bounds, n = 36, base = [];
  for (let i = 0; i < n; i++) {
    let x, z;
    do { x = R.f(b.minX - 9, b.maxX + 9); z = R.f(b.minZ - 9, b.maxZ + 9); }
    while (x > b.minX - 1 && x < b.maxX + 1 && z > b.minZ - 1 && z < b.maxZ + 1);
    base.push(x, R.f(0.4, 1.6), z, R.f(0, 6.28));
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(n * 3), 3));
  G.fireflies = new THREE.Points(g, new THREE.PointsMaterial({
    color: 0xe4ff9a, size: 0.35, map: glowTexture(), transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false,
  }));
  G.fireflies.userData.base = base;
  G.fireflies.frustumCulled = false;
  G.world.add(G.fireflies);
}

function updateFireflies() {
  const f = G.fireflies;
  if (!f) return;
  const a = f.geometry.attributes.position.array, b = f.userData.base, t = G.time;
  for (let i = 0; i < b.length / 4; i++) {
    const ph = b[i * 4 + 3];
    a[i * 3] = b[i * 4] + Math.sin(t * 0.4 + ph) * 0.8;
    a[i * 3 + 1] = b[i * 4 + 1] + Math.sin(t * 1.3 + ph * 2) * 0.25;
    a[i * 3 + 2] = b[i * 4 + 2] + Math.cos(t * 0.33 + ph) * 0.8;
  }
  f.geometry.attributes.position.needsUpdate = true;
  f.material.size = 0.5 + 0.12 * Math.sin(t * 3);
}

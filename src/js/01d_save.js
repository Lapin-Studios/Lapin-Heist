// ============ Saved progress (this device only): wallet, shop upgrades, perks ============

const SAVE_KEY = 'lapinHeistSave';

// values[level] is what you get; costs[level] is the price of the next level
const UPGRADES = [
  { id: 'bag', name: 'Bigger Backpack', icon: '🎒', desc: 'Carry more loot on every trip.',
    values: [5, 6, 7, 8, 10, 12], costs: [1500, 4000, 9000, 18000, 35000], fmt: (v) => `${v} items` },
  { id: 'speed', name: 'Speedy Paws', icon: '🐾', desc: 'Move faster in every form.',
    values: [1, 1.08, 1.16, 1.24, 1.32, 1.4], costs: [1000, 2500, 6000, 12000, 25000], fmt: (v) => (v === 1 ? 'Normal speed' : `+${Math.round((v - 1) * 100)}% speed`) },
  { id: 'shift', name: 'Longer Disguises', icon: '⏳', desc: 'How long a shapeshift lasts before it wears off.',
    values: [10, 15, 20, 30, 45, 60], costs: [1200, 3000, 7000, 15000, 30000], fmt: (v) => `${v} seconds` },
  { id: 'quiet', name: 'Quiet Feet', icon: '🤫', desc: 'Sprinting wakes and alerts fewer people.',
    values: [1, 0.8, 0.6, 0.45], costs: [2000, 6000, 14000], fmt: (v) => (v === 1 ? 'Normal noise' : `${Math.round((1 - v) * 100)}% quieter`) },
  { id: 'hearts', name: 'Thick Fur', icon: '❤️', desc: 'Take more slippers to the face before you are caught.',
    values: [3, 4, 5], costs: [5000, 15000], fmt: (v) => `${v} hearts` },
  { id: 'night', name: 'Longer Night', icon: '🌙', desc: 'More time before the sun comes up.',
    values: [0, 30, 60, 90], costs: [2500, 7000, 16000], fmt: (v) => (v ? `+${v} seconds` : 'Normal night') },
];
const PERKS = [
  { id: 'human', name: 'Human Disguise', icon: '🎭', cost: 8000,
    desc: 'Sneak up behind a family member and press F to copy them. Just never let them see their twin.' },
];
const TUTORIAL_REWARD = 500;

const Save = {
  data: null,
  fresh() { return { wallet: 0, best: 0, heists: 0, lv: {}, perks: {}, tutorialDone: false }; },
  load() {
    this.data = this.fresh();
    try {
      const s = JSON.parse(localStorage.getItem(SAVE_KEY) || 'null');
      if (s && typeof s === 'object') Object.assign(this.data, s, { lv: Object.assign({}, s.lv), perks: Object.assign({}, s.perks) });
      const oldBest = +localStorage.getItem('lapinHeistBest') || 0; // from before saves existed
      if (oldBest > this.data.best) this.data.best = oldBest;
    } catch (e) { /* storage blocked: progress lasts until the page closes */ }
    return this.data;
  },
  save() { try { localStorage.setItem(SAVE_KEY, JSON.stringify(this.data)); } catch (e) { /* storage blocked */ } },
  reset() { this.data = this.fresh(); this.save(); try { localStorage.removeItem('lapinHeistBest'); } catch (e) { /* storage blocked */ } },
  level(id) { return this.data.lv[id] || 0; },
  has(perk) { return !!this.data.perks[perk]; },
};

function upgradeValue(id) {
  const u = UPGRADES.find((x) => x.id === id);
  return u.values[Math.min(Save.level(id), u.values.length - 1)];
}
function nextCost(u) { const lv = Save.level(u.id); return lv < u.costs.length ? u.costs[lv] : null; }
function buyUpgrade(id) {
  const u = UPGRADES.find((x) => x.id === id), cost = nextCost(u);
  if (cost === null || Save.data.wallet < cost) return false;
  Save.data.wallet -= cost; Save.data.lv[id] = Save.level(id) + 1; Save.save();
  return true;
}
function buyPerk(id) {
  const k = PERKS.find((x) => x.id === id);
  if (Save.has(id) || Save.data.wallet < k.cost) return false;
  Save.data.wallet -= k.cost; Save.data.perks[id] = true; Save.save();
  return true;
}
// Everything the current save gives you for one heist
function currentUpgrades() {
  const up = {};
  for (const u of UPGRADES) up[u.id] = upgradeValue(u.id);
  up.human = Save.has('human');
  return up;
}

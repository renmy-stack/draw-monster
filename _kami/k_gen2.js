// 形の 作り方 2（かみ 用）: プレイヤーの 形は 使わない。体は 16 角の 半径を ばらばらに、うで・あしは「少しずつ 曲がる 線」（かめの あるき方）
// → フックの 腕・まるめた 足・ひくくて ひろい 体 など、ランキング上位の ような 形も 作れる
const RB = require('../sim.js');
let seed = 1; const r = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
const gauss = () => Math.sqrt(-2 * Math.log(r() + 1e-9)) * Math.cos(2 * Math.PI * r());
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const NA = 14, NL = 12;
const LIM = { w: [30, 220], h: [20, 170], cy: [-200, -12], armLen: [20, 150], armA0: [-3.1, 3.1], legLen: [10, 130], legA0: [-3.1, 3.1], wind: [1, 3.2], spir: [0, 0.25] };   // wind: 体を 何周 巻くか（上位の 形の 描き方）・spir: 1 周ごとに 内側へ
function randP() {
  const p = {}; for (const [k, [a, b]] of Object.entries(LIM)) p[k] = a + (b - a) * r();
  p.rad = Array.from({ length: 16 }, () => 0.6 + 0.4 * r());
  p.at = Array.from({ length: NA }, () => (r() - 0.5) * 1.2);
  p.lt = Array.from({ length: NL }, () => (r() - 0.5) * 1.6);
  return p;
}
function mutate(p, s) {
  const q = JSON.parse(JSON.stringify(p)); if (q.wind == null) { q.wind = 1; q.spir = 0; }
  for (const [k, [a, b]] of Object.entries(LIM)) if (r() < 0.4) q[k] = clamp(q[k] + gauss() * (b - a) * s, a, b);
  q.rad = q.rad.map(v => r() < 0.25 ? clamp(v + gauss() * s * 1.5, 0.3, 1) : v);
  q.at = q.at.map(v => r() < 0.3 ? clamp(v + gauss() * s * 4, -1.6, 1.6) : v);
  q.lt = q.lt.map(v => r() < 0.3 ? clamp(v + gauss() * s * 4, -1.6, 1.6) : v);
  return q;
}
function turtle(x, y, a, len, turns) { const pts = [[x, y]], n = turns.length, d = len / n; for (let i = 0; i < n; i++) { a += turns[i]; x += Math.cos(a) * d; y += Math.sin(a) * d; pts.push([Math.round(x), Math.round(y)]); } return pts; }
function build(p) {
  const body = [];
  const nw = p.wind || 1, sp = p.spir || 0, n = Math.ceil(16 * nw);
  for (let i = 0; i < n; i++) { const t = i / 16 * Math.PI * 2, k = p.rad[i % 16] * (1 - sp * i / 16); body.push([Math.round(Math.cos(t) * p.w / 2 * k), Math.round(p.cy + Math.sin(t) * p.h / 2 * k)]); }
  const bodyC = RB.cleanStroke(body, RB.INK.body); if (bodyC.length < 3) return null;
  const j = RB.joints(bodyC);
  const arm = turtle(j.shoulder[0], j.shoulder[1], p.armA0, p.armLen, p.at), leg = turtle(j.hip[0], j.hip[1], p.legA0, p.legLen, p.lt);
  const d = RB.design(bodyC, RB.cleanStroke(arm, RB.INK.arm), RB.cleanStroke(leg, RB.INK.leg));
  return RB.validDesign(d) ? d : null;
}
const plain = d => RB.encodeDesign({ body: d.body, arm: d.arm, leg: d.leg });
module.exports = { randP, mutate, build, plain, setSeed: s => { seed = s; } };

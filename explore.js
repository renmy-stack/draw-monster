// node explore.js [体数] [種] [出力] — 形の種類を 広げて ランダムに作り、ふつうの相手（人の形・表の CPU・いろいろな形）への勝率を はかる
// 足: 棒 / 輪 / トゲトゲの輪（星形）/ ジグザグ、腕: まっすぐ / ジグザグ / ハンマー / 輪（鉄球）/ かぎ爪、体: 四角 / 楕円 / 平たい / 三角（くさび）/ U 字
'use strict';
const RB = require('./sim.js');
const { randomRobot } = require('./clear_rate.js');
const fs = require('fs');
let seed = +(process.argv[3] || 1); const r = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };
const rr = (a, b) => a + (b - a) * r(), pick = a => a[Math.floor(r() * a.length)];
const LEGS = ['stick', 'loop', 'star', 'zig'], ARMS = ['straight', 'zig', 'hammer', 'ball', 'claw'], BODIES = ['rect', 'oval', 'flat', 'wedge', 'u'];
function randP(fix) {
  const p = { body: pick(BODIES), arm: pick(ARMS), leg: pick(LEGS), w: rr(20, 150), h: rr(20, 140), cy: rr(-170, -60), armLen: rr(20, 140), armAng: rr(-1.3, 1.1), legLen: rr(20, 110), legAng: rr(-0.6, 0.6), R: rr(6, 18), spikes: 5 + Math.floor(r() * 5), zig: rr(6, 20) };
  if (p.body === 'flat') { p.w = rr(120, 200); p.h = rr(16, 40); }
  return Object.assign(p, fix || {});
}
function bodyPts(p) {
  const pts = [], n = 16;
  if (p.body === 'wedge') return [[-p.w / 2, p.cy + p.h / 2], [p.w / 2, p.cy + p.h / 2], [-p.w / 2, p.cy - p.h / 2]];   // 前が低い くさび
  if (p.body === 'u') { const w = p.w / 2, h = p.h / 2, t = Math.min(w, h) * 0.45; return [[-w, p.cy - h], [-w + t, p.cy - h], [-w + t, p.cy + h - t], [w - t, p.cy + h - t], [w - t, p.cy - h], [w, p.cy - h], [w, p.cy + h], [-w, p.cy + h]]; }
  for (let i = 0; i < n; i++) { const t = i / n * Math.PI * 2; let x = Math.cos(t), y = Math.sin(t); if (p.body === 'rect') { const m = Math.max(Math.abs(x), Math.abs(y)); x /= m; y /= m; } pts.push([x * p.w / 2, p.cy + y * p.h / 2]); }
  return pts;
}
function limb(start, kind, len, ang, p, isLeg) {
  const pts = [[start[0], start[1]]], ux = Math.cos(ang), uy = Math.sin(ang);
  const along = (d, side) => [start[0] + ux * d - uy * side, start[1] + uy * d + ux * side];
  if (kind === 'loop' || kind === 'star') {
    // 腰（肩）を中心に 丸 / トゲトゲの丸
    const n = kind === 'star' ? p.spikes * 2 : 16;
    for (let i = 1; i <= n; i++) { const t = ang + i / n * Math.PI * 2, rad = kind === 'star' ? (i % 2 ? p.R * 1.8 : p.R * 0.7) : p.R; pts.push([start[0] + Math.cos(t) * rad, start[1] + Math.sin(t) * rad]); }
    return pts;
  }
  const n = Math.max(3, Math.round(len / 10));
  for (let i = 1; i <= n; i++) { const d = len * i / n, z = (kind === 'zig') ? p.zig * (i % 2 ? 1 : -1) * (i < n ? 1 : 0) : 0; pts.push(along(d, z)); }
  const e = pts[pts.length - 1];
  if (kind === 'hammer') for (const [a, b] of [[0, -14], [14, -14], [14, 14], [0, 14], [0, 0]]) pts.push([e[0] + ux * a - uy * b, e[1] + uy * a + ux * b]);
  if (kind === 'ball') { for (let i = 1; i <= 12; i++) { const t = ang + Math.PI + i / 12 * Math.PI * 2; pts.push([e[0] + ux * 12 + Math.cos(t) * 12, e[1] + uy * 12 + Math.sin(t) * 12]); } }
  if (kind === 'claw') { pts.push([e[0] - uy * 18, e[1] + ux * 18]); pts.push([e[0] - uy * 18 - ux * 20, e[1] + ux * 18 - uy * 20]); }
  return pts;
}
function build(p) {
  const b = RB.cleanStroke(bodyPts(p), RB.INK.body); if (b.length < 3) return null;
  const j = RB.joints(b);
  const arm = RB.cleanStroke(limb(j.shoulder, p.arm, p.armLen, p.armAng, p, false), RB.INK.arm);
  const leg = RB.cleanStroke(limb(j.hip, p.leg === 'stick' ? 'straight' : p.leg, p.legLen, Math.PI / 2 + p.legAng, p, true), RB.INK.leg);
  const d = RB.design(b, arm, leg);
  return RB.validDesign(d) ? d : null;
}
module.exports = { randP, build, LEGS, ARMS, BODIES };
if (require.main !== module) return;
// ふつうの相手: 人の形 20・表の CPU 5・いろいろな形 15（固定の種で 全プロセス共通）
const POOL = (() => { const save = seed; seed = 424242; const a = RB.CPU.slice(); let k = 0; while (k < 20) { const d = randomRobot(); if (d) { a.push(d); k++; } } k = 0; while (k < 15) { const d = build(randP()); if (d) { a.push(d); k++; } } seed = save; return a; })();
function rate(d) { let w = 0, t = 0; for (const o of POOL) for (const [A, B, me] of [[d, o, 'A'], [o, d, 'B']]) { if (RB.fight(A, B).winner === me) w++; t++; } return w / t; }
const N = +(process.argv[2] || 500), out = [];
while (out.length < N) { const p = randP(), d = build(p); if (!d) continue; out.push({ p, rate: rate(d), d: { body: d.body, arm: d.arm, leg: d.leg } }); }
fs.writeFileSync(process.argv[4] || '_explore.json', JSON.stringify(out));
console.log('おわり ' + out.length);

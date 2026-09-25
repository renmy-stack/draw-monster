// node clear_rate.js [体数] — 人が描きそうなランダムなロボで、勝ち抜き（CPU 5 体）を何人抜けるか
'use strict';
const RB = require('./sim.js');
let seed = 11; const r = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };
const rr = (a, b) => a + (b - a) * r();
function randomRobot() {
  // 体: 大きさ・縦横・デコボコが ばらばらの まるっこい形
  const w = rr(18, 110), h = rr(18, 120), cy = rr(-170, -70), n = 10 + Math.floor(r() * 10), bump = rr(0, 0.35), sq = r() < 0.5;
  const body = [];
  for (let i = 0; i < n; i++) {
    const t = i / n * Math.PI * 2, k = 1 + (r() - 0.5) * bump;
    let x = Math.cos(t), y = Math.sin(t);
    if (sq) { const m = Math.max(Math.abs(x), Math.abs(y)); x /= m; y /= m; }   // 四角っぽい
    body.push([x * w / 2 * k, cy + y * h / 2 * k]);
  }
  // 腕: 長さ・向き・ジグザグ
  const armLen = rr(20, 150), ang = rr(-1.2, 0.8), zig = r() < 0.3 ? rr(5, 20) : 0, na = Math.max(3, Math.round(armLen / 10));
  const arm = [];
  for (let i = 0; i <= na; i++) { const d = armLen * i / na, z = zig * (i % 2 ? 1 : -1) * (i > 0 && i < na ? 1 : 0); arm.push([Math.cos(ang) * d - Math.sin(ang) * z, Math.sin(ang) * d + Math.cos(ang) * z]); }
  // 足: 長さ・曲がり
  const legLen = rr(20, 130), bend = rr(-0.8, 0.8), nl = Math.max(3, Math.round(legLen / 10)), la = Math.PI / 2 + rr(-0.4, 0.4);
  const leg = [];
  let x = 0, y = 0, a = la;
  leg.push([0, 0]);
  for (let i = 0; i < nl; i++) { a += bend / nl; x += Math.cos(a) * legLen / nl; y += Math.sin(a) * legLen / nl; leg.push([x, y]); }
  // 画面と同じく、うで・あしは 肩・腰の位置から描いたことにして パッドの範囲で切る
  const bodyC = RB.cleanStroke(body, RB.INK.body);
  if (bodyC.length < 3) return null;
  const j = RB.joints(bodyC), at = (pts, o) => pts.map(p => [p[0] + o[0], p[1] + o[1]]);
  const d = RB.design(bodyC, RB.cleanStroke(at(arm, j.shoulder), RB.INK.arm), RB.cleanStroke(at(leg, j.hip), RB.INK.leg));
  return RB.validDesign(d) ? d : null;
}
module.exports = { randomRobot };
if (require.main !== module) return;
const N = +(process.argv[2] || 2000);
const reach = new Array(RB.CPU.length + 1).fill(0), beat = RB.CPU.map(() => [0, 0]);
let made = 0;
while (made < N) {
  const d = randomRobot(); if (!d) continue; made++;
  let k = 0;
  for (; k < RB.CPU.length; k++) { const S = RB.fight(d, RB.CPU[k]); beat[k][1]++; if (S.winner !== 'A') break; beat[k][0]++; }
  reach[k]++;
}
const pct = x => (x / N * 100).toFixed(1) + '%';
console.log(N + ' 体のランダムなロボ');
console.log('何人抜き: ' + reach.map((c, k) => k + '人 ' + pct(c)).join(' / '));
const clear = reach[RB.CPU.length] / N;
console.log('5 人抜き（クリア）: ' + pct(reach[RB.CPU.length]));
console.log('その相手まで来たロボが勝つ割合: ' + RB.CPU.map((c, k) => c.name + ' ' + (beat[k][1] ? Math.round(beat[k][0] / beat[k][1] * 100) : '-') + '%').join(' / '));
for (const t of [5, 10, 20, 50]) console.log('ちがうロボを ' + t + ' 体 ためして 1 体でもクリアできる確率: ' + ((1 - Math.pow(1 - clear, t)) * 100).toFixed(0) + '%');

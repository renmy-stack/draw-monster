// node tune_cpu.js — CPU 5 体の 体の大きさ・腕・足の長さを変えて、ランダムなロボが勝つ割合を目標に近づける
'use strict';
const RB = require('./sim.js');
const { randomRobot } = require('./clear_rate.js');
const POOL = []; while (POOL.length < +(process.argv[2] || 400)) { const d = randomRobot(); if (d) POOL.push(d); }
function ln(x0, y0, x1, y1, n) { const a = []; for (let i = 0; i <= n; i++) a.push([Math.round(x0 + (x1 - x0) * i / n), Math.round(y0 + (y1 - y0) * i / n)]); return a; }
function rect(x0, y0, x1, y1) { return [[x0, y0], [x1, y0], [x1, y1], [x0, y1]].map(p => p.map(Math.round)); }
// キャラの形（s = 体の大きさ、a = 腕の長さ、l = 足の長さ の倍率）
const CHARS = [
  { name: 'ノッポ', color: '#5e35b1', f: (s, a, l) => ({ body: rect(-20 * s, -90 - 110 * s, 20 * s, -90), arm: ln(0, 0, 60 * a, 30 * a, 6), leg: ln(0, 0, 0, 80 * l, 6) }) },
  { name: 'デカ', color: '#6d4c41', f: (s, a, l) => ({ body: rect(-55 * s, -70 - 100 * s, 55 * s, -70), arm: ln(0, 0, 50 * a, 20 * a, 5), leg: ln(0, 0, 10 * l, 60 * l, 5) }) },
  { name: 'ハコロボ', color: '#8d6e63', f: (s, a, l) => ({ body: rect(-30 * s, -80 - 70 * s, 30 * s, -80), arm: ln(0, 0, 50 * a, 10 * a, 5), leg: ln(0, 0, 0, 60 * l, 5) }) },
  { name: 'チビ', color: '#00897b', f: (s, a, l) => ({ body: rect(-25 * s, -50 - 40 * s, 25 * s, -50), arm: ln(0, 0, 40 * a, -10 * a, 4), leg: ln(0, 0, 0, 45 * l, 4) }) },
  { name: 'ハンマー', color: '#c62828', f: (s, a, l) => ({ body: rect(-30 * s, -80 - 70 * s, 30 * s, -80), arm: ln(0, 0, 60 * a, 0, 6).concat([[60 * a, -15], [60 * a + 15, -15], [60 * a + 15, 15], [60 * a, 15], [60 * a, 0]].map(p => p.map(Math.round))), leg: ln(0, 0, 0, 60 * l, 5) }) },
];
// 勝ち上がってきたロボ（前の CPU に勝ったロボ）のうち、この割合が勝つように 1 体ずつ決める。掛けると 約 9%
const TARGET = [0.90, 0.80, 0.65, 0.50, 0.40];
const inkOk = d => RB.inkOf(d.arm) <= RB.INK.arm && RB.inkOf(d.leg) <= RB.INK.leg && RB.inkOf(d.body.concat([d.body[0]])) <= RB.INK.body;
function build(c, s, a, l) { const r = c.f(s, a, l); return Object.assign({ name: c.name, color: c.color }, RB.design(r.body, r.arm, r.leg)); }   // CPU は 線をそのまま（関節につなぐ）
const order = process.argv[3] ? JSON.parse(process.argv[3]) : [0, 1, 2, 3, 4];
let alive = POOL.slice();
const chosen = [];
order.forEach((ci, k) => {
  const c = CHARS[ci]; let best = null;
  for (const s of [0.8, 1, 1.25, 1.5, 1.8]) for (const a of [0.8, 1, 1.3, 1.6, 2]) for (const l of [0.6, 1, 1.4]) {
    const cpu = build(c, s, a, l); if (!RB.validDesign(cpu) || !inkOk(cpu)) continue;
    const win = alive.filter(d => RB.fight(d, cpu).winner === 'A');
    const r = win.length / alive.length, e = Math.abs(r - TARGET[k]);
    if (!best || e < best.e) best = { s, a, l, r, e, win };
  }
  console.log((k + 1) + '人目 ' + c.name.padEnd(5) + ' 体×' + best.s + ' 腕×' + best.a + ' 足×' + best.l + '  勝ち上がり ' + alive.length + ' 体のうち ' + Math.round(best.r * 100) + '% が勝つ（目標 ' + TARGET[k] * 100 + '%）');
  alive = best.win; chosen.push({ name: c.name, s: best.s, a: best.a, l: best.l });
});
console.log('5 人抜き（この ' + POOL.length + ' 体で）: ' + (alive.length / POOL.length * 100).toFixed(1) + '%');
require('fs').writeFileSync('_cpu.json', JSON.stringify(chosen));

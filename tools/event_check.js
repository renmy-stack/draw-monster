// node tools/event_check.js <本番の 登録 json> [1 お題の 体数=100] [お題 番号…] — お題ごとに「一択」の 形が ないか
// 本番に 登録された モンスターの 固定部分を お題に 置きかえ、N 体の 総当たり（左右 2 戦）と、かんたんな 形（ものさし）の 勝率を 出す
'use strict';
const { Worker, isMainThread, parentPort, workerData } = require('worker_threads');
const path = require('path'), fs = require('fs');
const RB = require('../sim.js'), EV = require('../event.js');
const rel = p => p.map(q => [q[0] - p[0][0], q[1] - p[0][1]]);
// d の part を お題の 形に（うで・あしは 関節に つけなおす）
function withTheme(d, t) {
  if (t.part === 'body') return RB.design(t.pts, rel(d.arm), rel(d.leg));
  return RB.design(d.body, t.part === 'arm' ? t.pts : rel(d.arm), t.part === 'leg' ? t.pts : rel(d.leg));
}
const score = (w, me) => w === me ? 1 : w ? 0 : 0.5;
if (!isMainThread) {
  parentPort.on('message', ({ id, a, b }) => {
    const A = RB.decodeDesign(a), B = RB.decodeDesign(b), s1 = RB.fight(A, B), s2 = RB.fight(B, A);
    parentPort.postMessage({ id, r: [score(s1.winner, 'A'), score(s2.winner, 'B')], d: (s1.winner ? 0 : 1) + (s2.winner ? 0 : 1), ko: (s1.reason === 'ko') + (s2.reason === 'ko') });
  });
  return;
}
const [, , SRC, NS, ...only] = process.argv, N = +(NS || 100);
const real = JSON.parse(fs.readFileSync(SRC))[0].results.map(x => RB.decodeDesign(x.code)).filter(Boolean);
let seed = 7; const rnd = () => (seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff;
const pick = real.map(d => [rnd(), d]).sort((x, y) => x[0] - y[0]).slice(0, N).map(x => x[1]);
// ものさし: 体（小・中・大・ノッポ・ぺったん）× 腕（短・長）× 足（短・長）＝ 20
const ln = (x, y, n) => Array.from({ length: n + 1 }, (_, i) => [Math.round(x * i / n), Math.round(y * i / n)]);
const box = (w, h) => [[-w / 2, -60 - h], [w / 2, -60 - h], [w / 2, -60], [-w / 2, -60]];
const probes = [];
for (const [bn, w, h] of [['ちび', 28, 28], ['中', 60, 70], ['大', 120, 120], ['ノッポ', 30, 200], ['ぺったん', 200, 30]]) for (const [an, a] of [['短腕', 35], ['長腕', 140]]) for (const [gn, g] of [['短足', 30], ['長足', 120]])
  probes.push({ name: bn + '・' + an + '・' + gn, d: RB.design(RB.cleanStroke(box(w, h), RB.INK.body), ln(a, 0, Math.ceil(a / 8)), ln(0, g, Math.ceil(g / 8))) });
const W = Math.max(1, require('os').cpus().length - 1), workers = Array.from({ length: W }, () => new Worker(__filename));
let qid = 0; const waits = new Map(), free = workers.slice(), queue = [];
workers.forEach(w => w.on('message', m => { waits.get(m.id)(m); waits.delete(m.id); free.push(w); pump(); }));
const pair = (a, b) => new Promise(res => { queue.push({ id: ++qid, a, b, res }); pump(); });
function pump() { while (free.length && queue.length) { const w = free.pop(), j = queue.shift(); waits.set(j.id, j.res); w.postMessage({ id: j.id, a: j.a, b: j.b }); } }
async function judge(t) {
  const ds = t ? pick.map(d => withTheme(d, t)) : pick, cs = ds.map(RB.encodeDesign), n = cs.length;
  const pts = new Float64Array(n), jobs = []; let draw = 0, ko = 0, games = 0;
  for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) jobs.push(pair(cs[i], cs[j]).then(m => { pts[i] += m.r[0] + m.r[1]; pts[j] += 2 - m.r[0] - m.r[1]; draw += m.d; ko += m.ko; games += 2; }));
  const pr = probes.map(p => ({ name: p.name, c: RB.encodeDesign(t ? withTheme(p.d, t) : p.d), s: 0 }));
  for (const p of pr) for (let i = 0; i < n; i++) jobs.push(pair(p.c, cs[i]).then(m => { p.s += m.r[0] + m.r[1]; }));
  await Promise.all(jobs);
  const pct = [...pts].map(x => x / (2 * (n - 1)) * 100).sort((a, b) => b - a);
  pr.forEach(p => p.pct = p.s / (2 * n) * 100); pr.sort((a, b) => b.pct - a.pct);
  return { top: pct[0], p10: pct[Math.floor(n * 0.1)], mid: pct[n >> 1], draw: draw / games * 100, ko: ko / games * 100, probe: pr[0] };
}
(async () => {
  const t0 = Date.now(), rows = [], f1 = x => x.toFixed(1);
  const list = [null, ...Array.from({ length: 60 }, (_, n) => EV.eventTheme(n))].filter((t, i) => !only.length || i === 0 || only.includes(String(i - 1)));
  for (const t of list) {
    const r = await judge(t), name = t ? '#' + (t.part === 'arm' ? 'うで' : t.part === 'leg' ? 'あし' : 'からだ') + String(t.no + 1).padStart(2) + ' ' + t.name : '（ふだんの ランクせん）';
    rows.push(Object.assign({ name }, r));
    console.log(name.padEnd(14, '　') + ' 1位 ' + f1(r.top) + '%  上位1割 ' + f1(r.p10) + '%  まんなか ' + f1(r.mid) + '%  ひきわけ ' + f1(r.draw) + '%  KO ' + f1(r.ko) + '%  ものさし最高 ' + f1(r.probe.pct) + '%（' + r.probe.name + '）  ' + ((Date.now() - t0) / 1000).toFixed(0) + '秒');
  }
  fs.writeFileSync(path.join(process.cwd(), 'event_check.json'), JSON.stringify(rows));
  process.exit(0);
})();

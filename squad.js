// node squad.js [くり返し回数] — 最強の部隊: これまでの敵の候補から「止められる攻略者が いちばん多い 5 体」を選ぶ（勝ち抜きは 5 体のうち 誰か 1 体が勝てば止まる）
// くり返し: 部隊に 攻略者の進化（challenge.js × 4）をかけ、5 人抜きの形が見つかったら 攻略者に足して 選び直す
// 結果: _squad_v{n}.json（各版の並び）、_squad.log
'use strict';
const RB = require('./sim.js');
const { randomRobot } = require('./clear_rate.js');
const { spawn } = require('child_process');
const fs = require('fs');
const say = s => { const l = new Date().toTimeString().slice(0, 5) + ' ' + s; console.log(l); fs.appendFileSync('_squad.log', l + '\n'); };
const plain = d => ({ body: d.body, arm: d.arm, leg: d.leg });
const D = c => RB.design(c.body, c.arm, c.leg);
const key = c => JSON.stringify([c.body, c.arm, c.leg]);
const run = args => new Promise(res => { const p = spawn('node', args); let out = ''; p.stdout.on('data', d => out += d); p.on('close', () => res(out)); });
const cm = {}; { const src = fs.readFileSync('./challenge.js', 'utf8'); new Function('RB', 'process', 'cm', src.slice(src.indexOf('let seed'), src.indexOf('function score')).replace('let seed = +(process.argv[4] || 4242);', 'let seed = 8080;') + '; cm.randP = randP; cm.build = build; cm.r = r;')(RB, { argv: [] }, cm); }

// ---- 敵の候補（重複は 1 つに）----
const cand = [], seenC = new Set();
function addC(c, from) { const k = key(c); if (seenC.has(k)) return; seenC.add(k); const d = D(c); if (RB.validDesign(d)) cand.push({ c: plain(c), d, from }); }
for (let n = 1; n <= 4; n++) if (fs.existsSync('_coevo_round' + n + '.json')) JSON.parse(fs.readFileSync('_coevo_round' + n + '.json')).forEach((c, i) => addC(c, '第' + n + '回-' + (i + 1)));
RB.URA.forEach((c, i) => addC(c, 'いまのうら-' + (i + 1)));
for (const t of ['chibi', 'nop', 'kyo', 'hammer', 'flat', 'free', 'wheel']) if (fs.existsSync('_co_' + t + '.json')) JSON.parse(fs.readFileSync('_co_' + t + '.json')).slice(0, 3).forEach((e, i) => addC(e.d, t + '上位' + (i + 1)));
say('敵の候補 ' + cand.length + ' 体');

// ---- 攻略者（重み: 見つかった攻略者・オーナーは 10、ランダムは 1）----
const att = [], seenA = new Set();
function addA(c, w, from) { const k = key(c); if (seenA.has(k)) return; seenA.add(k); const d = D(c); if (RB.validDesign(d)) att.push({ c: plain(c), d, w, from }); }
if (fs.existsSync('_owner.json')) addA(JSON.parse(fs.readFileSync('_owner.json')), 30, 'オーナー');
if (fs.existsSync('_owner2.json')) addA(JSON.parse(fs.readFileSync('_owner2.json')), 30, 'オーナー2');   // 正方形っぽい強い形
if (fs.existsSync('_attack.json')) JSON.parse(fs.readFileSync('_attack.json')).forEach(c => addA(c, 10, '攻略者'));
for (let n = 1; n <= 4; n++) if (fs.existsSync('_coevo_round' + n + '_clear.json')) JSON.parse(fs.readFileSync('_coevo_round' + n + '_clear.json')).forEach(c => addA(c, 10, '第' + n + '回の攻略者'));
{ let k = 0; while (k < 200) { const p = cm.randP(); p.w = 120 + cm.r() * 80; p.h = 16 + cm.r() * 29; const d = cm.build(p); if (d) { addA(plain(d), 1, '平たい'); k++; } } }
{ let k = 0; while (k < 150) { const d = cm.build(cm.randP()); if (d) { addA(plain(d), 1, '広い'); k++; } } }
{ let k = 0; while (k < 100) { const p = cm.randP(); p.loop = 1; const d = cm.build(p); if (d) { addA(plain(d), 1, '輪の足'); k++; } } }
{ let k = 0; while (k < 150) { const d = randomRobot(); if (d) { addA(plain(d), 1, '人'); k++; } } }
say('攻略者 ' + att.length + ' 体（重い攻略者 ' + att.filter(a => a.w >= 10).length + ' 体）');

// ---- 勝ち負けの表: stop[e][a] = 敵 e が 攻略者 a に勝つ（止める）----
const stop = cand.map(() => []);
function fillRow(ai) { cand.forEach((e, ei) => { stop[ei][ai] = RB.fight(att[ai].d, e.d).winner !== 'A'; }); }
for (let ai = 0; ai < att.length; ai++) fillRow(ai);
say('勝ち負けの表 できた（' + cand.length + '×' + att.length + '）');

function choose() {
  // 5 体の組み合わせを ぜんぶ試し、止められる攻略者の重みの合計が いちばん大きいもの
  const n = cand.length, W = att.map(a => a.w);
  let best = null;
  const idx = [0, 1, 2, 3, 4];
  const rec = (start, depth, cur) => {
    if (depth === 5) {
      let s = 0; for (let a = 0; a < att.length; a++) if (stop[cur[0]][a] || stop[cur[1]][a] || stop[cur[2]][a] || stop[cur[3]][a] || stop[cur[4]][a]) s += W[a];
      if (!best || s > best.s) best = { s, set: cur.slice() };
      return;
    }
    for (let i = start; i <= n - (5 - depth); i++) { cur[depth] = i; rec(i + 1, depth + 1, cur); }
  };
  rec(0, 0, idx);
  // 並び: 1 体で止められる数が 少ない順（いちばん多いのが ラスボス）
  const solo = e => att.reduce((s, a, ai) => s + (stop[e][ai] ? a.w : 0), 0);
  const order = best.set.slice().sort((a, b) => solo(a) - solo(b));
  const total = att.reduce((s, a) => s + a.w, 0);
  const heavyLeft = att.filter((a, ai) => a.w >= 10 && !order.some(e => stop[e][ai])).length;
  return { order, cover: best.s / total, heavyLeft };
}

(async () => {
  const R = +(process.argv[2] || 5);
  for (let v = 1; v <= R; v++) {
    const pick = choose();
    const lineup = pick.order.map(e => cand[e].c);
    fs.writeFileSync('_squad_v' + v + '.json', JSON.stringify(lineup));
    say('部隊 v' + v + ': ' + pick.order.map(e => cand[e].from).join(' → ') + '  止められる重み ' + Math.round(pick.cover * 100) + '%、止められない重い攻略者 ' + pick.heavyLeft + ' 体');
    const outs = await Promise.all(['1', '2', '3', '4'].map(sd => run(['challenge.js', '40', '30', String(5000 + 10 * v + +sd), './_squad_v' + v + '.json', '_sq_ch_' + sd + '.json'])));
    const found = [];
    outs.forEach((o, i) => { if (/あり/.test(o)) { found.push(JSON.parse(fs.readFileSync('_sq_ch_' + (i + 1) + '.json'))); fs.unlinkSync('_sq_ch_' + (i + 1) + '.json'); } });
    const gens = outs.map(o => /あり/.test(o) ? (o.match(/世代/g) || []).length + '世代' : 'なし');
    say('  攻略者の進化: ' + gens.join(', '));
    if (!found.length) { say('部隊 v' + v + ' は 攻略者の進化でも 5 人抜きが見つからない → ここで止める'); break; }
    for (const c of found) { const before = att.length; addA(c, 10, '部隊v' + v + 'の攻略者'); if (att.length > before) fillRow(att.length - 1); }
  }
  say('おわり');
})();

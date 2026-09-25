// node coevo.js [回数] — いたちごっこ: 攻略者に勝つ敵を進化 → 並べる → 攻略者の進化で 5 人抜きを探す → 見つかれば 攻略者に足して くり返す
// 敵も プレイヤーと同じルール（形だけ）。結果: _coevo_round{n}.json（並び）、_attack.json（攻略者）
'use strict';
const RB = require('./sim.js');
const { randomRobot } = require('./clear_rate.js');
const { spawn } = require('child_process');
const fs = require('fs');
const run = (args, log) => new Promise(res => { const p = spawn('node', args); let out = ''; p.stdout.on('data', d => out += d); p.stderr.on('data', d => out += d); p.on('close', () => { if (log) fs.appendFileSync(log, out); res(out); }); });
const say = s => { console.log(new Date().toTimeString().slice(0, 5) + ' ' + s); };
const TYPES = [['chibi', { w: [16, 55], h: [16, 55] }], ['nop', { w: [16, 60], h: [70, 150] }], ['kyo', { w: [95, 140], h: [95, 150] }], ['hammer', { head: [0.6, 1] }], ['flat', { w: [120, 200], h: [16, 45] }], ['free', {}]];
const plain = d => ({ body: d.body, arm: d.arm, leg: d.leg });
function ladder(d, L) { let k = 0; for (; k < L.length; k++) if (RB.fight(d, L[k]).winner !== 'A') break; return k; }
const cm = {}; { const src = fs.readFileSync('./challenge.js', 'utf8'); new Function('RB', 'process', 'cm', src.slice(src.indexOf('let seed'), src.indexOf('function score')).replace('let seed = +(process.argv[4] || 4242);', 'let seed = 31337;') + '; cm.randP = randP; cm.build = build; cm.r = r;')(RB, { argv: [] }, cm); }
const HUMAN = []; while (HUMAN.length < 300) { const d = randomRobot(); if (d) HUMAN.push(d); }
(async () => {
  let owner;
  let attack = [101, 202, 303].map(s => plain(JSON.parse(fs.readFileSync('_challenger_' + s + '.json'))));
  // オーナーが実際に裏をクリアした形（とても平たい横長）を 3 回ぶん入れて 重く数える
  owner = JSON.parse(fs.readFileSync('_owner.json'));
  attack = attack.concat([owner, owner, owner]);
  let lineup = RB.URA.map(plain);
  const RESUME = process.argv[3];   // 例: _coevo_round2.json（その並びと _attack.json から 再開）
  let r0 = 1;
  if (RESUME) { lineup = JSON.parse(fs.readFileSync(RESUME)); attack = JSON.parse(fs.readFileSync('_attack.json')).concat(JSON.parse(fs.readFileSync(RESUME.replace('.json', '_clear.json')))); r0 = +RESUME.match(/round(\d+)/)[1] + 1; say('再開: 第 ' + r0 + ' 回から、攻略者 ' + attack.length + ' 体'); }
  const R = +(process.argv[2] || 3);
  for (let r = r0; r <= R; r++) {
    fs.writeFileSync('_attack.json', JSON.stringify(attack)); fs.writeFileSync('_lineup_now.json', JSON.stringify(lineup));
    // 敵を鍛える相手: 攻略者 ＋ 毎回ランダムに作る「平たく横長の形」15 体（平たい形の 種類ぜんたいに 勝てるように）
    const flat = []; while (flat.length < 15) { const p = cm.randP(); p.w = 120 + cm.r() * 80; p.h = 16 + cm.r() * 29; const d = cm.build(p); if (d) flat.push(plain(d)); }
    fs.writeFileSync('_attack_train.json', JSON.stringify(attack.concat(flat)));
    say('第 ' + r + ' 回: 攻略者 ' + attack.length + ' 体に勝つ敵を 5 タイプで進化');
    await Promise.all(TYPES.map(([t, lim], i) => run(['evolve.js', '10', '16', JSON.stringify(lim), '_co_' + t + '.json', String(1000 * r + i), './_attack_train.json', './_lineup_now.json'])));
    // 各タイプの上位 3 体から、攻略者＋人の形に いちばん勝つものを 1 体ずつ
    const cand = [];
    for (const [t] of TYPES) {
      const E = JSON.parse(fs.readFileSync('_co_' + t + '.json')).slice(0, 3).map(e => RB.design(e.d.body, e.d.arm, e.d.leg));
      let best = null;
      for (const d of E) { const beatA = attack.filter(a => RB.fight(RB.design(a.body, a.arm, a.leg), d).winner !== 'A').length / attack.length; const beatH = HUMAN.slice(0, 120).filter(h => RB.fight(h, d).winner !== 'A').length / 120; const s = beatA * 2 + beatH; if (!best || s > best.s) best = { t, d, s, beatA, beatH }; }
      cand.push(best);
    }
    // いちばん強いものを ラスボスに、のこりは 人の形に負けやすい順
    cand.sort((a, b) => b.s - a.s);
    const boss = cand[0], rest = cand.slice(1, 5).sort((a, b) => a.beatH - b.beatH);   // 6 タイプから 強い 5 体
    say('オーナーの形に勝てる敵: ' + cand.filter(c => RB.fight(RB.design(owner.body, owner.arm, owner.leg), c.d).winner !== 'A').map(c => c.t).join(', '));
    lineup = rest.concat([boss]).map(c => plain(c.d));
    say('並び: ' + rest.concat([boss]).map(c => c.t + '(攻略者に ' + Math.round(c.beatA * 100) + '%・人に ' + Math.round(c.beatH * 100) + '% 勝つ)').join(' → '));
    const reach = new Array(6).fill(0); for (const h of HUMAN) reach[ladder(h, lineup.map(c => RB.design(c.body, c.arm, c.leg)))]++;
    say('人が描きそうな形 300 体: ' + reach.map((c, k) => k + '人 ' + Math.round(c / 3) + '%').join(' / '));
    const ownerNow = ladder(RB.design(owner.body, owner.arm, owner.leg), lineup.map(c => RB.design(c.body, c.arm, c.leg)));
    say('オーナーの形は この並びで ' + ownerNow + ' 人抜き');
    const oldA = attack.filter(a => ladder(RB.design(a.body, a.arm, a.leg), lineup.map(c => RB.design(c.body, c.arm, c.leg))) === 5).length;
    say('いままでの攻略者で まだ 5 人抜きできるもの: ' + oldA + ' / ' + attack.length);
    fs.writeFileSync('_coevo_round' + r + '.json', JSON.stringify(lineup));
    fs.writeFileSync('_lineup_now.json', JSON.stringify(lineup));
    // 攻略者の進化（4 通り）
    const outs = await Promise.all(['1', '2', '3', '4'].map(sd => run(['challenge.js', '40', '30', String(100 * r + +sd), './_lineup_now.json', '_co_ch_' + sd + '.json'])));
    const found = [];
    outs.forEach((o, i) => { if (/あり/.test(o)) { found.push(plain(JSON.parse(fs.readFileSync('_co_ch_' + (i + 1) + '.json')))); fs.unlinkSync('_co_ch_' + (i + 1) + '.json'); } });
    say('攻略者の進化: 4 通り中 ' + found.length + ' 通りで 5 人抜きの形あり' + (found.length ? '' : '（' + outs.map(o => (o.match(/さいこう ([\d.]+)/) || [])[1]).join(', ') + ' 人ぶん）'));
    fs.writeFileSync('_coevo_round' + r + '_clear.json', JSON.stringify(found));
    if (!found.length) { say('第 ' + r + ' 回の並びは 攻略者の進化でも 5 人抜きが見つからない → ここで止める（1 つ前の回が ぎりぎり）'); break; }
    attack = attack.concat(found);
    fs.writeFileSync('_attack.json', JSON.stringify(attack));
  }
  say('おわり');
})();

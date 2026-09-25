// node wheel_round.js — 輪の足を 知った 敵の進化（7 タイプ）→ そのあと squad.js
'use strict';
const RB = require('./sim.js');
const { spawn } = require('child_process');
const fs = require('fs');
const say = s => { const l = new Date().toTimeString().slice(0, 5) + ' ' + s; console.log(l); fs.appendFileSync('_wheel.log', l + '\n'); };
const plain = d => ({ body: d.body, arm: d.arm, leg: d.leg });
const run = args => new Promise(res => { const p = spawn('node', args); let out = ''; p.stdout.on('data', d => out += d); p.on('close', () => res(out)); });
const cm = {}; { const src = fs.readFileSync('./challenge.js', 'utf8'); new Function('RB', 'process', 'cm', src.slice(src.indexOf('let seed'), src.indexOf('function score')).replace('let seed = +(process.argv[4] || 4242);', 'let seed = 9090;') + '; cm.randP = randP; cm.build = build; cm.r = r;')(RB, { argv: [] }, cm); }
(async () => {
  let attack = JSON.parse(fs.readFileSync('_attack.json'));
  for (let n = 1; n <= 4; n++) if (fs.existsSync('_coevo_round' + n + '_clear.json')) attack = attack.concat(JSON.parse(fs.readFileSync('_coevo_round' + n + '_clear.json')));
  const o1 = JSON.parse(fs.readFileSync('_owner.json')), o2 = JSON.parse(fs.readFileSync('_owner2.json'));
  attack = attack.concat([o1, o1, o1, o2, o2, o2]);
  const extra = [];
  while (extra.length < 15) { const p = cm.randP(); p.w = 120 + cm.r() * 80; p.h = 16 + cm.r() * 29; const d = cm.build(p); if (d) extra.push(plain(d)); }
  while (extra.length < 35) { const p = cm.randP(); p.loop = 1; const d = cm.build(p); if (d) extra.push(plain(d)); }
  fs.writeFileSync('_attack_train.json', JSON.stringify(attack.concat(extra)));
  fs.writeFileSync('_lineup_now.json', JSON.stringify(JSON.parse(fs.readFileSync('_coevo_round3.json'))));
  const TYPES = [['chibi', { w: [16, 55], h: [16, 55] }], ['nop', { w: [16, 60], h: [70, 150] }], ['kyo', { w: [95, 140], h: [95, 150] }], ['hammer', { head: [0.6, 1] }], ['flat', { w: [120, 200], h: [16, 45] }], ['free', {}], ['wheel', { loop: [0.5, 1] }]];
  say('輪の足を知った 敵の進化: 7 タイプ、鍛える相手 ' + (attack.length + extra.length) + ' 体');
  await Promise.all(TYPES.map(([t, lim], i) => run(['evolve.js', '10', '16', JSON.stringify(lim), '_co_' + t + '.json', String(9000 + i), './_attack_train.json', './_lineup_now.json'])));
  say('敵の進化 おわり → 最強の部隊へ');
  if (fs.existsSync('_squad.log')) fs.renameSync('_squad.log', '_squad_old.log');
  await run(['squad.js', '6']);
  say('おわり');
})();

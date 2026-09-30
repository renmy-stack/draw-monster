// プール: R = 人が描きそうな ランダム 1500、Q = プレイヤーの 形（ランクせん ＋ うら・みんな クリア）
const L = require('C:/Users/umiya/OneDrive/Desktop/Share/claude/03_game-cc-company/renmy-logs/load.js');
const RB = require('C:/Users/umiya/OneDrive/Desktop/Share/claude/03_game-cc-company/draw-monster/sim.js');
const { randomRobot } = require('C:/Users/umiya/OneDrive/Desktop/Share/claude/03_game-cc-company/draw-monster/clear_rate.js');
const plain = d => RB.encodeDesign({ body: d.body, arm: d.arm, leg: d.leg });
const R = []; while (R.length < 1500) { const d = randomRobot(); if (d) R.push(plain(d)); }
const Q = new Set(require(__dirname + '/gd_in.json').ranked.map(m => m.code));
const ura = new Set();
for (const e of L.events({ from: '2026-09-26', g: 'draw-monster' })) { if ((e.name === 'uraclear' || e.name === 'minnaclear') && e.data && e.data.me) { const d = RB.decodeDesign(e.data.me); if (d) { const c = plain(d); Q.add(c); ura.add(c); } } }
require('fs').writeFileSync(__dirname + '/tp_pool.json', JSON.stringify({ R, Q: [...Q], ura: [...ura] }));
console.log('R', R.length, 'Q', Q.size, 'うらクリア', ura.size);

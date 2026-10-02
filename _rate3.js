// node _rate3.js 体数 [形.json] — ランダムな モンスター（または 形の リスト）で 表・裏・みんな を 何人 抜けるか（並列）
const { Worker, isMainThread, parentPort, workerData } = require('worker_threads');
if (isMainThread) {
  const N = +process.argv[2], file = process.argv[3], n = require('os').cpus().length, tot = { omote: [0,0,0,0,0,0], ura: [0,0,0,0,0,0], minna: [0,0,0,0,0,0] }; let done = 0, cnt = 0;
  for (let k = 0; k < n; k++) new Worker(__filename, { workerData: { N, file, k, n } }).on('message', m => { for (const s in tot) m[s].forEach((c, i) => tot[s][i] += c); cnt += m.cnt; if (++done === n) {
    console.log('体数', cnt);
    for (const s in tot) console.log(s.padEnd(6), tot[s].map((c, i) => i + '人 ' + (c / cnt * 100).toFixed(2) + '%').join(' / '), ' → クリア ' + tot[s][5] + ' 体 = ' + (tot[s][5] / cnt * 100).toFixed(3) + '%');
  } });
} else {
  const RB = require('./sim.js'); const { N, file, k, n } = workerData;
  let list = [];
  if (file) list = JSON.parse(require('fs').readFileSync(file, 'utf8')).filter((c, i) => i % n === k).map(c => RB.decodeDesign(c)).filter(d => d && RB.validDesign(d));
  else { const { randomRobot } = require('./clear_rate.js'); let i = 0; while (i < N) { const d = randomRobot(); if (!d) continue; if (i % n === k) list.push(d); i++; } }
  const L = { omote: RB.CPU, ura: RB.URA, minna: RB.MINNA }, out = { cnt: list.length };
  for (const s in L) { out[s] = [0,0,0,0,0,0]; for (const d of list) { let j = 0; for (; j < 5; j++) if (RB.fight(d, L[s][j]).winner !== 'A') break; out[s][j]++; } }
  parentPort.postMessage(out);
}

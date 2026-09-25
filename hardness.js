// node hardness.js _coevo_round1.json _coevo_round2.json ... — 各並びに 同じ条件で 攻略者の進化（6 通り × 40 世代）をかけ、見つけるまでの世代数を比べる
'use strict';
const { spawnSync } = require('child_process');
const SEEDS = ['7001', '7002', '7003', '7004', '7005', '7006'];
for (const f of process.argv.slice(2)) {
  const gens = SEEDS.map(sd => {
    const out = spawnSync('node', ['challenge.js', '40', '30', sd, './' + f, '_hard_tmp.json'], { encoding: 'utf8' }).stdout;
    const g = (out.match(/世代/g) || []).length;
    return /あり/.test(out) ? g : 'なし';
  });
  const found = gens.filter(g => g !== 'なし');
  console.log(f + ': 見つけるまでの世代 ' + gens.join(', ') + '  → 見つかった ' + found.length + '/6、平均 ' + (found.length ? (found.reduce((a, b) => a + b, 0) / found.length).toFixed(1) : '-') + ' 世代');
}

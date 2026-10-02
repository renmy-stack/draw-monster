// 候補の 勝ち方（みんなクリアの 形 769 に 勝った とき 時間切れ 勝ちの 割合）を dist（desk2 も）で。cand_to.json に ない 候補だけ
const fs = require('fs'), { run } = require('../_terrain/dist_par.js');
const KA = 'C:/Users/umiya/AppData/Local/Temp/claude/kamiall/';
const M = JSON.parse(fs.readFileSync('pool_matrix.json', 'utf8')), old = JSON.parse(fs.readFileSync(KA + 'cand_to.json', 'utf8'));
const R = JSON.parse(fs.readFileSync(KA + 'result.json', 'utf8')), S = JSON.parse(fs.readFileSync(KA + 'shapes.json', 'utf8'));
const mi = S.map((o, i) => i).filter(i => R.tiers[i] === 'みんなクリア').map(i => S[i].c);
const byCode = new Map(); try { for (const o of JSON.parse(fs.readFileSync('cand_to_all.json', 'utf8'))) byCode.set(o.c, o); } catch (e) {}
// 前の cand_to.json は pool_matrix の 前の 並び（54）
const prevCand = JSON.parse(fs.readFileSync('pool_matrix_54.json', 'utf8')).cand; old.out.forEach(o => byCode.set(prevCand[o.ci].c, { c: prevCand[o.ci].c, stop: o.stop, timeShare: o.timeShare }));
(async () => {
  const need = M.cand.filter(c => !byCode.has(c.c));
  const r = await run(need.flatMap(c => mi.map(m => [m, c.c, 'flat', 'r'])));
  need.forEach((c, k) => { const v = r.slice(k * mi.length, (k + 1) * mi.length), w = v.filter(x => x[0] === 'B'); byCode.set(c.c, { c: c.c, stop: w.length / v.length, timeShare: w.length ? w.filter(x => x[1] === 't').length / w.length : 0 }); });
  fs.writeFileSync('cand_to_all.json', JSON.stringify([...byCode.values()]));
  console.log('勝ち方: 新しく 測った', need.length);
})();

// 計算の 進み具合（%）を 出す（2026-10-03 オーナー「計算の とき 進捗を % で」）
// tp_par.js・dist_par.js の run が 使う。いちばん 外の run だけが 数える（dist_par → tp_par の 二重 カウントを しない）
// ・標準エラーに 5 秒おきに 1 行:「[進捗] 45%（21,500 / 47,750 戦）・のこり 約 3 分」
// ・%TEMP%/claude/analysis/progress.txt に 今の ようす（ほかの ところから 見る 用）
const fs = require('fs'), path = require('path');
const FILE = path.join(process.env.TEMP || process.env.TMPDIR || '/tmp', 'claude', 'analysis', 'progress.txt');
let depth = 0, total = 0, done = 0, t0 = 0, last = 0;
const fmt = n => n.toLocaleString('ja-JP');
function line(final) {
  const pct = total ? Math.floor(100 * done / total) : 100, el = (Date.now() - t0) / 1000;
  const rest = done && !final ? Math.max(0, el * (total - done) / done) : 0;
  const eta = final ? 'おわり（' + Math.round(el) + ' 秒）' : rest >= 90 ? 'のこり 約 ' + Math.round(rest / 60) + ' 分' : 'のこり 約 ' + Math.ceil(rest) + ' 秒';
  return '[進捗] ' + pct + '%（' + fmt(done) + ' / ' + fmt(total) + ' 戦）・' + eta;
}
function show(final) {
  const s = line(final);
  if (process.env.PROGRESS !== '0') process.stderr.write(s + '\n');
  try { fs.mkdirSync(path.dirname(FILE), { recursive: true }); fs.writeFileSync(FILE, new Date().toLocaleString('ja-JP') + ' ' + process.argv.slice(1).map(a => path.basename(a)).join(' ') + '\n' + s + '\n'); } catch (e) {}
}
// begin → add（なんども）→ end。入れ子の 内がわは 何も しない
exports.begin = n => { if (depth++ === 0) { total = n; done = 0; t0 = last = Date.now(); } };
exports.add = k => { if (depth !== 1) return; done += k; if (Date.now() - last >= 5000) { last = Date.now(); show(false); } };
exports.end = () => { if (--depth === 0 && total >= 1000) show(true); };   // 小さい 束（1,000 戦 未満）は だまって おわる
exports.inner = () => depth > 1;

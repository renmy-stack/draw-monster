// 配布イベントの コード（みんな 同じ コード・期限つき・1 台 1 回）。受付係 renmy-rank の D1 に 直接 入れる（wrangler の ログインが 要る）
//   node tools/event_codes.js add <コード> <かざり番号> <はじめ> <おわり> [人数の上限|-] [コイン|-] [メモ]
//       例: node tools/event_codes.js add HALLOWEEN 86 2026-10-25 2026-11-01 - 1000 "ハロウィン"（コインは ゲームが 1 端末 1 回だけ 足す）
//       日付だけ なら 日本時間の 0:00。「2026-10-25T18:00」の ように 時刻も 書ける。おわりの 時刻に なったら つかえない
//   node tools/event_codes.js list           … コードと 使った 人数
//   node tools/event_codes.js end <コード>    … いますぐ おわりに する（もらった 人の かざりは そのまま）
const { execSync } = require('child_process'), path = require('path');
const W = path.join(__dirname, '..', '..', 'counter', 'rank-worker');
const q = sql => JSON.parse(execSync('npx wrangler d1 execute renmy-rank --remote --json --command ' + JSON.stringify(sql), { cwd: W, stdio: ['ignore', 'pipe', 'ignore'] }).toString())[0].results;
const KZ = require('../kazari.js').KZ;
const jst = s => { const t = Date.parse(/T/.test(s) ? s + ':00+09:00' : s + 'T00:00:00+09:00'); if (!isFinite(t)) throw new Error('日付が よめない: ' + s); return t; };
const show = t => new Date(t + 9 * 3600e3).toISOString().slice(0, 16).replace('T', ' ');
const norm = c => String(c || '').toUpperCase().replace(/[^0-9A-Z]/g, '');
const [cmd, ...a] = process.argv.slice(2);
if (cmd === 'add') {
  const code = norm(a[0]), item = +a[1], start = jst(a[2]), end = jst(a[3]), max = a[4] && a[4] !== '-' ? +a[4] : null, coins = a[5] && a[5] !== '-' ? +a[5] : null, note = String(a[6] || '').replace(/'/g, "''").slice(0, 80);
  if (code.length < 4 || code.length > 16 || code.length === 10) throw new Error('コードは 英数字 4〜16 文字（10 文字は おうえんの コードと まぎれるので だめ）');
  const it = KZ.ITEMS[item]; if (!it) throw new Error('かざり ' + item + ' が ない');
  if (!it.gift) console.warn('※ かざり ' + item + '「' + it.name + '」は 配布用（gift）では ない。ガチャにも 出る もの です');
  if (!(end > start)) throw new Error('おわりが はじめより 前');
  q(`INSERT INTO event_codes (code, item, opens, closes, max, coins, created, note) VALUES ('${code}', ${item}, ${start}, ${end}, ${max == null ? 'NULL' : max}, ${coins == null ? 'NULL' : coins}, ${Date.now()}, '${note}')`);
  console.log(code, '→', it.name, show(start), '〜', show(end), max == null ? '上限なし' : max + ' 人まで', coins ? '🪙' + coins : '');
} else if (cmd === 'end') {
  q(`UPDATE event_codes SET closes = ${Date.now()} WHERE code = '${norm(a[0])}'`); console.log('おわりに しました', norm(a[0]));
} else {
  for (const r of q('SELECT e.code, e.item, e.opens, e.closes, e.max, e.coins, e.note, (SELECT count(*) FROM event_code_uses u WHERE u.code = e.code) n FROM event_codes e ORDER BY e.opens'))
    console.log(r.code, (KZ.ITEMS[r.item] || {}).name, show(r.opens), '〜', show(r.closes), r.n + (r.max == null ? '' : '/' + r.max) + ' 人', r.coins ? '🪙' + r.coins : '', r.note || '');
}

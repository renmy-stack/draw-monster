// おうえん（OFUSE）の お礼の コードを 作る（1 回きり）。受付係 renmy-rank の D1 に 直接 入れる（wrangler の ログインが 要る）
//   node tools/gift_codes.js [数=1] [メモ]      例: node tools/gift_codes.js 1 "OFUSE 10/3 ○○さん"
//   node tools/gift_codes.js list               … 作った コードと 使われたか
const { execSync } = require('child_process'), crypto = require('crypto'), path = require('path');
const W = path.join(__dirname, '..', '..', 'counter', 'rank-worker');
const q = sql => JSON.parse(execSync('npx wrangler d1 execute renmy-rank --remote --json --command ' + JSON.stringify(sql), { cwd: W, stdio: ['ignore', 'pipe', 'ignore'] }).toString())[0].results;
const ABC = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';   // 0 O 1 I L なし
const mk = () => Array.from(crypto.randomBytes(10), b => ABC[b % ABC.length]).join('');
const ITEM = 84;   // きんの はね
const [a, note] = process.argv.slice(2);
if (a === 'list') {
  for (const r of q('SELECT code, note, created, used_by, used_at FROM gift_codes ORDER BY created')) console.log(r.code.slice(0, 5) + '-' + r.code.slice(5), new Date(r.created + 9 * 3600e3).toISOString().slice(5, 16), r.used_at ? '使われた ' + new Date(r.used_at + 9 * 3600e3).toISOString().slice(5, 16) : 'まだ', r.note || '');
} else {
  const n = Math.max(1, Math.min(50, +a || 1)), now = Date.now(), codes = Array.from({ length: n }, mk);
  q('INSERT INTO gift_codes (code, item, created, note) VALUES ' + codes.map(c => "('" + c + "', " + ITEM + ', ' + now + ", '" + String(note || '').replace(/'/g, "''").slice(0, 80) + "')").join(', '));
  for (const c of codes) console.log(c.slice(0, 5) + '-' + c.slice(5));
}

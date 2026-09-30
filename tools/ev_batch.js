// きょうの イベント の 順位の 計算（GitHub Actions の rank.yml で ふだんの ランクせん（rank_batch.js）の あとに 動く）
// しくみは rank_batch.js と おなじ: 左右 入れかえて 2 戦ずつ した 勝率。同じ 2 体・同じ 左右は いつも 同じ 結果 なので 運が 入らない
//   相手（代表）: その 日に 先に 出した 100 体（出しなおした 人は 前の 体が 抜けて、つぎに 出した 体が 入る）。101 体目 から は 100 体と 戦って 順位だけ つく
//   1 日で おわり: 0 時を すぎた 最初の 回に、きのうの のこりを 計算して しめる（1 位 ＝ リボン）。キャッシュも 日ごと
// 1. /admin/ev_active で その 日の 体（prev が あれば きのうの しめ から）
// 2. まだの 組み合わせを、計算ずみが 少ない 体から RANK_TIME（1.5 分）まで 計算（のこりは 次の 回。しめの 日は 全部 おわるまで）
// 3. 順位表を /admin/ev_board へ
'use strict';
const fs = require('fs'), path = require('path'), os = require('os');
const { Worker, isMainThread, parentPort, workerData } = require('worker_threads');
const RB = require('../sim.js');
const API = process.env.RANK_API || 'https://renmy-rank.renmy-stack.workers.dev';
const KEY = process.env.RANK_ADMIN;
const TIME_LIMIT = +(process.env.RANK_TIME || 90e3), REP_MAX = +(process.env.RANK_REP || 100), TOP_N = 30, CHAMP_MIN = 20, BUCKETS = 16;
const DIR = path.join(__dirname, '..', '.rankcache');
const CODE = { A: 1, B: 2, D: 3 };

if (!isMainThread) {
  const out = [];
  for (const [l, r, cl, cr] of workerData) { const W = RB.fight(RB.decodeDesign(cl), RB.decodeDesign(cr)).winner; out.push([l + '|' + r, W || 'D']); }
  parentPort.postMessage(out);
  return;
}
function hashStr(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619) >>> 0; return h; }
function bucketOf(id) { let h = 0; for (const ch of String(id)) h = (h * 31 + ch.charCodeAt(0)) >>> 0; return h % 64; }   // 受付係と おなじ（そのあと % 16）
const H = { Authorization: 'Bearer ' + KEY, 'Content-Type': 'application/json' };

// その 日を 計算して 書き戻す。final なら 全部 おわるまで 計算して 1 位を きめる
async function runDay(day, final) {
  const act = await (await fetch(API + '/admin/ev_active?day=' + day, { headers: H })).json();
  const list = act.list.filter(m => RB.decodeDesign(m.code)), n = list.length;
  const cache = path.join(DIR, 'ev_' + day + '.json');
  const R = new Uint8Array(n * n), idx = new Map(list.map((m, i) => [m.id, i]));
  const can = (i, j) => i !== j && list[i].dev !== list[j].dev;
  let bh = {}, before = '';
  try {
    before = fs.readFileSync(cache, 'utf8'); const c = JSON.parse(before); bh = c.bh || {};
    const m = c.ids.length, bytes = Buffer.from(c.res, 'base64'), map = c.ids.map(id => idx.has(id) ? idx.get(id) : -1);
    for (let a = 0; a < m; a++) { const i = map[a]; if (i < 0) continue; for (let b = 0; b < m; b++) { const j = map[b]; if (j < 0) continue; const k = a * m + b, v = (bytes[k >> 2] >> ((k & 3) * 2)) & 3; if (v) R[i * n + j] = v; } }
  } catch (e) {}
  // 代表 ＝ 先に 出した REP_MAX 体（list は 出した 順）
  const reps = list.slice(0, REP_MAX).map((m, i) => i), isRep = new Uint8Array(n); for (const r of reps) isRep[r] = 1;
  // まだの 組み合わせ（代表との 左右 2 戦）を、計算ずみが 少ない 体から
  const done = new Array(n).fill(0);
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) if (R[i * n + j]) { done[i]++; done[j]++; }
  const order = list.map((m, i) => i).sort((a, b) => done[a] - done[b]);
  const todo = [], want = new Set();
  for (const a of order) for (const b of reps) {
    if (!can(a, b)) continue;
    for (const [i, j] of [[a, b], [b, a]]) { const k = i * n + j; if (!R[k] && !want.has(k)) { want.add(k); todo.push([i, j, list[i].code, list[j].code]); } }
  }
  const t0 = Date.now(), cores = Math.max(1, os.cpus().length), WAVE = cores * 200;
  let fought = 0;
  for (let w0 = 0; w0 < todo.length && (final || Date.now() - t0 < TIME_LIMIT); w0 += WAVE) {
    const wave = todo.slice(w0, w0 + WAVE), nt = Math.max(1, Math.min(cores, Math.ceil(wave.length / 50)));
    const parts = Array.from({ length: nt }, (_, t) => wave.filter((x, q) => q % nt === t));
    const res = await Promise.all(parts.map(p => new Promise((ok, ng) => { const w = new Worker(__filename, { workerData: p }); w.on('message', ok); w.on('error', ng); })));
    for (const r of res) for (const [k, W] of r) { const [i, j] = k.split('|').map(Number); R[i * n + j] = CODE[W] || 3; }
    fought += wave.length;
  }
  // 勝率（代表との 対戦だけで 数える。rank_batch.js の statsOf と おなじ）
  const st = list.map(() => ({ w: 0, l: 0, d: 0, tot: 0, beat: [], lost: [] }));
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
    if (!can(i, j) || (!isRep[i] && !isRep[j])) continue;
    const cntI = isRep[j], cntJ = isRep[i];
    if (cntI) st[i].tot++; if (cntJ) st[j].tot++;
    const v = R[i * n + j]; if (!v) continue;
    if (v === 3) { if (cntI) st[i].d++; if (cntJ) st[j].d++; continue; }
    const [win, lose, ws, ls] = v === 1 ? [i, j, 'A', 'B'] : [j, i, 'B', 'A'];
    if (win === i ? cntI : cntJ) { st[win].w++; st[win].beat.push([lose, ws]); }
    if (lose === i ? cntI : cntJ) { st[lose].l++; st[lose].lost.push([win, ls]); }
  }
  const pctOf = s => (s.w + s.d / 2) / Math.max(1, s.w + s.l + s.d), playedOf = s => s.w + s.l + s.d;
  const ranked = list.map((m, i) => i).filter(i => playedOf(st[i]) > 0).sort((a, b) => pctOf(st[b]) - pctOf(st[a]) || playedOf(st[b]) - playedOf(st[a]));
  ranked.forEach((i, p) => { st[i].pos = p + 1; });
  const entry = i => {
    const s = st[i];
    const pickx = (arr, res) => arr.slice().sort((x, y) => pctOf(st[y[0]]) - pctOf(st[x[0]])).slice(0, 3).map(([o, side]) => [list[o].id, list[o].name, res, side]);
    const nb = s.pos ? ranked.slice(Math.max(0, s.pos - 3), s.pos + 2).map(k => [st[k].pos, list[k].id, list[k].name, Math.round(pctOf(st[k]) * 1000) / 10, list[k].code, list[k].kz || null]) : [];   // 形と かざりも（ゲームが /mon で 聞かなくて すむ ように）
    return { pos: s.pos || null, pct: Math.round(pctOf(s) * 1000) / 10, pl: playedOf(s), tot: s.tot, w: s.w, l: s.l, d: s.d, rec: pickx(s.beat, 'W').concat(pickx(s.lost, 'L')), nb };
  };
  const top = { t: act.now, n, reps: reps.length, top: ranked.slice(0, TOP_N).map(i => { const e = entry(i); return { id: list[i].id, name: list[i].name, pos: e.pos, pct: e.pct, pl: e.pl, tot: e.tot }; }) };
  const buckets = {};
  for (let i = 0; i < n; i++) { const b = bucketOf(list[i].id) % BUCKETS; (buckets[b] = buckets[b] || { m: {} }).m[list[i].id] = entry(i); }
  const changed = {};
  for (let b = 0; b < BUCKETS; b++) { const v = buckets[b] || { m: {} }, h = hashStr(JSON.stringify(v)); if (bh[b] !== h) { changed[b] = v; bh[b] = h; } }
  const body = { day, top, buckets: changed };
  if (final) {
    body.final = true;
    const c = ranked.map(i => ({ i, e: entry(i) })).find(x => !list[x.i].dev.startsWith('testdev') && x.e.pl >= Math.min(CHAMP_MIN, x.e.tot));
    if (c) body.champion = { id: list[c.i].id, pct: c.e.pct, n };
  }
  if (process.env.RANK_DRY) { console.log('お試し ' + day + ': ' + n + ' 体・今回 ' + fought + ' 戦・上位 ' + top.top.slice(0, 3).map(x => x.name + ' ' + x.pct + '%').join(' / ') + (body.champion ? '・1 位 ' + body.champion.id : '')); return; }
  const res = await (await fetch(API + '/admin/ev_board', { method: 'POST', headers: H, body: JSON.stringify(body) })).json();
  if (!res.ok) throw new Error('ev_board 失敗 ' + JSON.stringify(res));
  // 順位表の ファイル（.board/evtop.json → rank.yml が board 枝へ）。きょうの ぶんだけ。形は GET /ev/top と おなじ
  if (!final) {
    const byId = new Map(list.map(m => [m.id, m]));
    const file = { day, now: act.now, updated: top.t, count: n, top: top.top.map(x => ({ ...x, code: byId.get(x.id).code, kz: byId.get(x.id).kz || null })), champion: act.champion || null };
    const dir = path.join(__dirname, '..', '.board'); fs.mkdirSync(dir, { recursive: true }); fs.writeFileSync(path.join(dir, 'evtop.json'), JSON.stringify(file));
  }
  // キャッシュ（日ごと。しめた 日の ものと 2 日 より 前の ものは けす）
  fs.mkdirSync(DIR, { recursive: true });
  const packed = Buffer.alloc(Math.ceil(n * n / 4));
  for (let k = 0; k < n * n; k++) if (R[k]) packed[k >> 2] |= R[k] << ((k & 3) * 2);
  const after = JSON.stringify({ ids: list.map(m => m.id), res: packed.toString('base64'), bh });
  if (final) { try { fs.unlinkSync(cache); } catch (e) {} } else fs.writeFileSync(cache, after);
  for (const f of fs.readdirSync(DIR)) { const m = /^ev_(\d{4}-\d{2}-\d{2})\.json$/.exec(f); if (m && m[1] < day && m[1] !== act.prev) try { fs.unlinkSync(path.join(DIR, f)); } catch (e) {} }
  console.log('イベント ' + day + (final ? '（しめ）' : '') + ': ' + n + ' 体・代表 ' + reps.length + ' 体・今回 ' + fought + ' 戦' + (fought < todo.length ? '（のこり ' + (todo.length - fought) + ' 戦は 次の 回）' : '') + '（' + ((Date.now() - t0) / 1000).toFixed(1) + ' 秒）・書きこみ ' + res.written + ' 行' + (body.champion ? '・1 位 ' + list[ranked.find(i => list[i].id === body.champion.id)].name : ''));
  return before !== after;
}

(async () => {
  if (!KEY) throw new Error('RANK_ADMIN が ない');
  const first = await (await fetch(API + '/admin/ev_active', { headers: H })).json();
  let changed = false;
  if (first.prev) changed = (await runDay(first.prev, true)) || changed;   // きのうの しめ（0 時 すぎの 最初の 回）
  changed = (await runDay(first.season, false)) || changed;
  if (process.env.GITHUB_OUTPUT) fs.appendFileSync(process.env.GITHUB_OUTPUT, 'changed=' + (changed ? 1 : 0) + String.fromCharCode(10));
})().catch(e => { console.error(e); process.exit(1); });

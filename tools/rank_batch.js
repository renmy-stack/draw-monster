// node tools/rank_batch.js — モンスター ランクせん の 計算（GitHub Actions が 実行。起動は Cloudflare の 受付係から 15 分に 1 回まで。RANK_ADMIN が いる）
// 順位 ＝ 「代表」と 左右 入れかえて 2 戦ずつ した 勝率。同じ 2 体・同じ 左右は いつも 同じ 結果 なので 運が 入らない
//   代表: 登録が REP_MAX（1000）体 までは 全員（＝ 総当たり）。それを こえたら 全員が 同じ 代表 1000 体と 戦う
//         代表 = 固定の ランダム 900 体（引退・お休みの ときだけ 補充）＋ その日の 上位 100 体（日が かわると 入れかえ）
// 1. 登録中の モンスターを 受け取る（2000 体ずつ）
// 2. まだの 組み合わせを、計算ずみが 少ない モンスター（＝ 新しく 登録された）から TIME_LIMIT（8 分）まで 計算（CPU の 数だけ 並列、
//    WAVE 戦ずつ 区切って 時間を 見る。のこりは 次の 回に つづき から）
//    結果は .rankcache/pairs.json（GitHub Actions の キャッシュ）: { v: 2, ids, res: base64（左 i × 右 j を 1 組 2 ビット:
//    0 まだ / 1 左の 勝ち / 2 右の 勝ち / 3 ひきわけ）, bh, rep: { fixed: [ID], top: [ID], day } }
// 3. 勝率・順位・対戦の 例（強い 相手に かった／まけた）を 出して、順位表を まとめて 書き戻す（上位 30 と、64 の かたまりの うち 変わった ものだけ）
// 4. 日が かわったら、前の 日の 1 位（CPU は のぞく）を チャンピオンに
'use strict';
const fs = require('fs'), path = require('path'), os = require('os');
const { Worker, isMainThread, parentPort, workerData } = require('worker_threads');
const RB = require('../sim.js');
const API = 'https://renmy-rank.renmy-stack.workers.dev';
const KEY = process.env.RANK_ADMIN;
const TIME_LIMIT = +(process.env.RANK_TIME || 8 * 60e3), MAX_TODO = 400000, TOP_N = 30, CHAMP_MIN = 20;   // チャンピオンは 20 戦 以上（総当たりが 20 戦 未満 なら 全員と 戦い おわって いれば よい）
const REP_MAX = +(process.env.RANK_REP || 1000), REP_TOP = Math.round(REP_MAX / 10);
const CACHE = path.join(__dirname, '..', '.rankcache', 'pairs.json');

const seasonOf = t => new Date(t + 9 * 3600e3).toISOString().slice(0, 10);
const bucketOf = id => { let h = 0; for (const ch of String(id)) h = (h * 31 + ch.charCodeAt(0)) >>> 0; return h % 64; };
const hashStr = s => { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0; return h; };

if (!isMainThread) {
  // 計算係: [左, 右, 左の形, 右の形] の 組を 戦わせて 勝った ほう（'A' 左 / 'B' 右 / 'D' ひきわけ）を 返す
  const out = [];
  for (const [l, r, cl, cr] of workerData) { const W = RB.fight(RB.decodeDesign(cl), RB.decodeDesign(cr)).winner; out.push([l + '|' + r, W || 'D']); }
  parentPort.postMessage(out);
} else {
  main().catch(e => { console.error(e); process.exit(1); });
}

async function main() {
  if (!KEY) throw new Error('RANK_ADMIN が ない');
  const H = { Authorization: 'Bearer ' + KEY, 'Content-Type': 'application/json' };
  // 1) 登録中の モンスター（2000 体ずつ）
  let act = null, raw = [];
  for (let off = 0; ; off += 2000) {
    const page = await (await fetch(API + '/admin/active?offset=' + off, { headers: H })).json();
    if (!act) act = page;
    raw = raw.concat(page.list);
    if (!page.more) break;
  }
  const now = act.now, season = act.season, today = seasonOf(now);
  const list = raw.filter(m => RB.decodeDesign(m.code));
  const n = list.length, idx = new Map(list.map((m, i) => [m.id, i])), byId = new Map(list.map(m => [m.id, m]));
  const R = new Uint8Array(n * n), CODE = { A: 1, B: 2, D: 3 };
  const can = (i, j) => i !== j && list[i].dev !== list[j].dev;   // 同じ 端末どうしは 戦わない

  // キャッシュを 読む（前の 形 { pairs: { 'L|R': 'A' } } も 読める）→ 今の 登録順の 表 R[i * n + j] に 並べなおす
  let bh = {}, before = '', rep = { fixed: [], top: [], day: '' };
  try {
    before = fs.readFileSync(CACHE, 'utf8'); const c = JSON.parse(before); bh = c.bh || {}; if (c.rep) rep = c.rep;
    if (c.v === 2) {
      const m = c.ids.length, bytes = Buffer.from(c.res, 'base64'), map = c.ids.map(id => idx.has(id) ? idx.get(id) : -1);
      for (let a = 0; a < m; a++) { const i = map[a]; if (i < 0) continue;
        for (let b = 0; b < m; b++) { const j = map[b]; if (j < 0) continue;
          const k = a * m + b, v = (bytes[k >> 2] >> ((k & 3) * 2)) & 3; if (v) R[i * n + j] = v; } }
    } else if (c.pairs) {
      for (const [k, W] of Object.entries(c.pairs)) { const [l, r] = k.split('|'); const i = idx.get(l), j = idx.get(r); if (i !== undefined && j !== undefined) R[i * n + j] = CODE[W] || 3; }
    }
  } catch (e) {}

  // 勝率（代表 reps との 対戦だけで 数える）
  const statsOf = reps => {
    const isRep = new Uint8Array(n); for (const r of reps) isRep[r] = 1;
    const st = list.map(() => ({ w: 0, l: 0, d: 0, tot: 0, beat: [], lost: [] }));
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
      if (!can(i, j) || (!isRep[i] && !isRep[j])) continue;
      // i が 代表 以外 なら 相手 j は 代表。i が 代表 なら 相手が 代表 以外の 戦いは i の 成績に 入れない（全員が 同じ 相手と 比べる ため）
      const cntI = isRep[j], cntJ = isRep[i];
      if (cntI) st[i].tot++; if (cntJ) st[j].tot++;
      const v = R[i * n + j]; if (!v) continue;
      if (v === 3) { if (cntI) st[i].d++; if (cntJ) st[j].d++; continue; }
      const [win, lose, ws, ls] = v === 1 ? [i, j, 'A', 'B'] : [j, i, 'B', 'A'];
      const cw = win === i ? cntI : cntJ, cl = lose === i ? cntI : cntJ;
      if (cw) { st[win].w++; st[win].beat.push([lose, ws]); }
      if (cl) { st[lose].l++; st[lose].lost.push([win, ls]); }
    }
    return st;
  };
  const pctOf = s => (s.w + s.d / 2) / Math.max(1, s.w + s.l + s.d);
  const playedOf = s => s.w + s.l + s.d;

  // 代表を きめる
  let reps;
  if (n <= REP_MAX) reps = list.map((m, i) => i);
  else {
    // 固定の ランダム 900 体: 前の 代表で まだ いる ものを のこし、たりない ぶんを 補充（日付で きまる ならび）
    const fixed = (rep.fixed || []).filter(id => idx.has(id)).map(id => idx.get(id));
    const inFixed = new Set(fixed);
    let seed = hashStr(today); const rnd = () => (seed = (Math.imul(seed, 1103515245) + 12345) >>> 0) / 4294967296;
    const pool = list.map((m, i) => i).filter(i => !inFixed.has(i));
    for (let k = pool.length - 1; k > 0; k--) { const r = Math.floor(rnd() * (k + 1)); [pool[k], pool[r]] = [pool[r], pool[k]]; }
    while (fixed.length < REP_MAX - REP_TOP && pool.length) { const i = pool.pop(); fixed.push(i); inFixed.add(i); }
    // その日の 上位 100 体: 日が かわった ときだけ 入れかえ（前の 代表での 勝率で）
    let top = (rep.top || []).filter(id => idx.has(id)).map(id => idx.get(id));
    if (rep.day !== today || !top.length) {
      const prevReps = [...new Set(fixed.concat(top))], st0 = statsOf(prevReps);
      top = list.map((m, i) => i).filter(i => !inFixed.has(i) && playedOf(st0[i]) > 0).sort((a, b) => pctOf(st0[b]) - pctOf(st0[a])).slice(0, REP_TOP);
      rep.day = today;
    }
    reps = [...new Set(fixed.concat(top))];
    rep.fixed = fixed.map(i => list[i].id); rep.top = top.map(i => list[i].id);
  }
  const isRep = new Uint8Array(n); for (const r of reps) isRep[r] = 1;

  // 2) まだの 組み合わせ（代表との 左右 2 戦）を、計算ずみが 少ない モンスターから
  const done = new Array(n).fill(0);
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) if (R[i * n + j]) { done[i]++; done[j]++; }
  const order = list.map((m, i) => i).sort((a, b) => done[a] - done[b]);
  const todo = [], want = new Set();
  for (const a of order) {
    if (todo.length >= MAX_TODO) break;
    for (const b of reps) {
      if (!can(a, b)) continue;
      for (const [i, j] of [[a, b], [b, a]]) { const k = i * n + j; if (!R[k] && !want.has(k)) { want.add(k); todo.push([i, j, list[i].code, list[j].code]); } }
      if (todo.length >= MAX_TODO) break;
    }
  }
  const t0 = Date.now(), cores = Math.max(1, os.cpus().length), WAVE = +(process.env.RANK_WAVE || cores * 400);
  let fought = 0;
  // WAVE 戦ずつ 並列で 計算。8 分を すぎたら そこまで（のこりは 次の 回）
  for (let w0 = 0; w0 < todo.length && Date.now() - t0 < TIME_LIMIT; w0 += WAVE) {
    const wave = todo.slice(w0, w0 + WAVE);
    const nt = Math.max(1, Math.min(cores, Math.ceil(wave.length / 50)));
    const parts = Array.from({ length: nt }, (_, t) => wave.filter((x, q) => q % nt === t));
    const res = await Promise.all(parts.map(p => new Promise((ok, ng) => { const w = new Worker(__filename, { workerData: p }); w.on('message', ok); w.on('error', ng); })));
    for (const r of res) for (const [k, W] of r) { const [i, j] = k.split('|').map(Number); R[i * n + j] = CODE[W] || 3; }
    fought += wave.length;
  }

  // 3) 勝率と 順位
  const st = statsOf(reps);
  const ranked = list.map((m, i) => i).filter(i => playedOf(st[i]) > 0).sort((a, b) => pctOf(st[b]) - pctOf(st[a]) || playedOf(st[b]) - playedOf(st[a]));
  ranked.forEach((i, p) => { st[i].pos = p + 1; });
  const entry = i => {
    const s = st[i];
    // 対戦の 例: 強い 相手に かった 3 戦・まけた 3 戦（リプレイ用に 自分が 左か 右か も）
    const pickx = (arr, res) => arr.slice().sort((x, y) => pctOf(st[y[0]]) - pctOf(st[x[0]])).slice(0, 3).map(([o, side]) => [list[o].id, list[o].name, res, side]);
    return { pos: s.pos || null, pct: Math.round(pctOf(s) * 1000) / 10, pl: playedOf(s), tot: s.tot, w: s.w, l: s.l, d: s.d, rec: pickx(s.beat, 'W').concat(pickx(s.lost, 'L')) };
  };
  const top = { t: now, n, reps: reps.length, top: ranked.slice(0, TOP_N).map(i => { const e = entry(i); return { id: list[i].id, name: list[i].name, pos: e.pos, pct: e.pct, pl: e.pl, tot: e.tot }; }) };
  const buckets = {};
  for (let i = 0; i < n; i++) { const b = bucketOf(list[i].id); (buckets[b] = buckets[b] || { m: {} }).m[list[i].id] = entry(i); }
  const changed = {};
  for (let b = 0; b < 64; b++) { const v = buckets[b] || { m: {} }, h = hashStr(JSON.stringify(v)); if (bh[b] !== h) { changed[b] = v; bh[b] = h; } }

  // 4) チャンピオン（前の 順位表が きのうの もの なら、その 1 位。CPU（はじめの 相手の 表の CPU）は のぞく）
  let champion = null;
  const prev = act.board;
  const cc = prev && prev.top ? prev.top.find(x => byId.has(x.id) && !byId.get(x.id).dev.startsWith('testdev')) : null;
  if (prev && prev.t && seasonOf(prev.t) !== season && cc && cc.pl >= Math.min(CHAMP_MIN, cc.tot)) {
    champion = { season: seasonOf(prev.t), id: cc.id, name: cc.name, code: byId.get(cc.id).code, pct: cc.pct, w: 0, l: 0, d: 0, n: prev.n };
  }
  const body = { top, buckets: changed }; if (champion) body.champion = champion;
  // RANK_DRY=1 は お試し（書き戻さない・キャッシュも 保存しない）
  if (process.env.RANK_DRY) { console.log('お試し: 代表', reps.length, '上位', top.top.slice(0, 5).map(x => x.pos + ' ' + x.name + ' ' + x.pct + '% ' + x.pl + '/' + x.tot).join(' / '), '固定', (rep.fixed || []).length, '上位代表', (rep.top || []).length); return; }
  const res = await (await fetch(API + '/admin/board', { method: 'POST', headers: H, body: JSON.stringify(body) })).json();
  if (!res.ok) throw new Error('board 失敗 ' + JSON.stringify(res));

  // キャッシュを 詰めて 保存（変わった ときだけ Actions が 保存する）
  const packed = Buffer.alloc(Math.ceil(n * n / 4));
  for (let k = 0; k < n * n; k++) if (R[k]) packed[k >> 2] |= R[k] << ((k & 3) * 2);
  const after = JSON.stringify({ v: 2, ids: list.map(m => m.id), res: packed.toString('base64'), bh, rep });
  fs.mkdirSync(path.dirname(CACHE), { recursive: true }); fs.writeFileSync(CACHE, after);
  if (process.env.GITHUB_OUTPUT) fs.appendFileSync(process.env.GITHUB_OUTPUT, 'changed=' + (before !== after ? 1 : 0) + String.fromCharCode(10));
  const need = st.reduce((a, s) => a + s.tot, 0) / 2, have = st.reduce((a, s) => a + playedOf(s), 0) / 2;
  console.log('登録 ' + n + ' 体・代表 ' + reps.length + ' 体・今回 ' + fought + ' 戦' + (fought < todo.length ? '（のこり ' + (todo.length - fought) + ' 戦は 次の 回）' : '') +
    '（' + ((Date.now() - t0) / 1000).toFixed(1) + ' 秒）・計算ずみ ' + have + ' / ' + need + ' 戦・キャッシュ ' + (after.length / 1024).toFixed(1) + ' KB・書きこみ ' + res.written + ' 行' + (champion ? '・きのうの チャンピオン ' + champion.name : ''));
}

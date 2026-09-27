// node tools/rank_batch.js — モンスター ランクせん の 計算（GitHub Actions が 実行。起動は Cloudflare の 受付係から 15 分に 1 回まで。RANK_ADMIN が いる）
// 順位 ＝ 登録中の みんなと 総当たり（左右 入れかえて 2 戦）した 勝率。同じ 2 体・同じ 左右は いつも 同じ 結果 なので 運が 入らない
// 1. 登録中の モンスターを 受け取る
// 2. まだ 戦って いない 組み合わせを、戦った 数が 少ない モンスター（＝ 新しく 登録された）から 最大 BUDGET 戦 計算（CPU の 数だけ 並列）
//    結果は .rankcache/pairs.json に のこす（GitHub Actions の キャッシュ。次の 回は 新しい 組み合わせ だけ）
//    形: { v: 2, ids: [登録の ID], res: base64（左 i × 右 j の 結果を 1 組 2 ビット: 0 まだ / 1 左の 勝ち / 2 右の 勝ち / 3 ひきわけ）, bh }
// 3. 勝率・順位・対戦の 例（強い 相手に かった／まけた）を 出して、順位表を まとめて 書き戻す（上位 30 と、64 の かたまりの うち 変わった ものだけ）
// 4. 日が かわったら、前の 日の 1 位を チャンピオンに
'use strict';
const fs = require('fs'), path = require('path'), os = require('os');
const { Worker, isMainThread, parentPort, workerData } = require('worker_threads');
const RB = require('../sim.js');
const API = 'https://renmy-rank.renmy-stack.workers.dev';
const KEY = process.env.RANK_ADMIN;
const BUDGET = 8000, TOP_N = 30, CHAMP_MIN = 20;   // チャンピオンは 20 戦 以上（登録が 少なくて 総当たりが 20 戦 未満 なら 全員と 戦い おわって いれば よい）
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
  const act = await (await fetch(API + '/admin/active', { headers: H })).json();
  const now = act.now, season = act.season;
  const list = act.list.filter(m => RB.decodeDesign(m.code));
  const byId = new Map(list.map(m => [m.id, m]));
  // キャッシュを 読む（前の 形 { pairs: { 'L|R': 'A' } } も 読める）→ 今の 登録順の 表 R[i * n + j] に 並べなおす
  const n = list.length, idx = new Map(list.map((m, i) => [m.id, i])), R = new Uint8Array(n * n);
  const CODE = { A: 1, B: 2, D: 3 };
  let bh = {}, before = '';
  try {
    before = fs.readFileSync(CACHE, 'utf8'); const c = JSON.parse(before); bh = c.bh || {};
    if (c.v === 2) {
      const m = c.ids.length, bytes = Buffer.from(c.res, 'base64');
      for (let a = 0; a < m; a++) { const i = idx.get(c.ids[a]); if (i === undefined) continue;
        for (let b = 0; b < m; b++) { const j = idx.get(c.ids[b]); if (j === undefined) continue;
          const k = a * m + b, v = (bytes[k >> 2] >> ((k & 3) * 2)) & 3; if (v) R[i * n + j] = v; } }
    } else if (c.pairs) {
      for (const [k, W] of Object.entries(c.pairs)) { const [l, r] = k.split('|'); const i = idx.get(l), j = idx.get(r); if (i !== undefined && j !== undefined) R[i * n + j] = CODE[W] || 3; }
    }
  } catch (e) {}
  const can = (i, j) => i !== j && list[i].dev !== list[j].dev;   // 同じ 端末どうしは 戦わない

  // 2) まだの 組み合わせを、計算ずみが 少ない モンスターから
  const done = new Array(n).fill(0);
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) if (R[i * n + j]) { done[i]++; done[j]++; }
  const order = list.map((m, i) => i).sort((a, b) => done[a] - done[b]);
  const todo = [], want = new Set();
  for (const a of order) {
    if (todo.length >= BUDGET) break;
    for (let b = 0; b < n && todo.length < BUDGET; b++) {
      if (!can(a, b)) continue;
      for (const [i, j] of [[a, b], [b, a]]) { const k = i * n + j; if (!R[k] && !want.has(k)) { want.add(k); todo.push([i, j, list[i].code, list[j].code]); } }
    }
  }
  const t0 = Date.now();
  if (todo.length) {
    const nt = Math.max(1, Math.min(os.cpus().length, Math.ceil(todo.length / 50)));
    const parts = Array.from({ length: nt }, (_, t) => todo.filter((x, q) => q % nt === t));
    const res = await Promise.all(parts.map(p => new Promise((ok, ng) => { const w = new Worker(__filename, { workerData: p }); w.on('message', ok); w.on('error', ng); })));
    for (const r of res) for (const [k, W] of r) { const [i, j] = k.split('|').map(Number); R[i * n + j] = CODE[W] || 3; }
  }

  // 3) 勝率と 順位
  const st = new Map(list.map(m => [m.id, { w: 0, l: 0, d: 0, tot: 0, beat: [], lost: [] }]));
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
    if (!can(i, j)) continue;
    st.get(list[i].id).tot++; st.get(list[j].id).tot++;   // 左右 2 戦 ぶんが i,j と j,i で 2 回 数えられる
    const v = R[i * n + j]; if (!v) continue;
    const L = list[i].id, Rr = list[j].id;
    if (v === 3) { st.get(L).d++; st.get(Rr).d++; continue; }
    const win = v === 1 ? L : Rr, lose = v === 1 ? Rr : L;
    st.get(win).w++; st.get(lose).l++;
    st.get(win).beat.push([lose, v === 1 ? 'A' : 'B']); st.get(lose).lost.push([win, v === 1 ? 'B' : 'A']);
  }
  const pct = s => (s.w + s.d / 2) / Math.max(1, s.w + s.l + s.d);
  const played = id => { const s = st.get(id); return s.w + s.l + s.d; };
  const ranked = list.filter(m => played(m.id) > 0).sort((a, b) => pct(st.get(b.id)) - pct(st.get(a.id)) || played(b.id) - played(a.id));
  ranked.forEach((m, i) => { st.get(m.id).pos = i + 1; });
  const pr = id => pct(st.get(id));
  const entry = m => {
    const s = st.get(m.id);
    // 対戦の 例: 強い 相手に かった 3 戦・まけた 3 戦（リプレイ用に 自分が 左か 右か も）
    const pickx = (arr, res) => arr.slice().sort((x, y) => pr(y[0]) - pr(x[0])).slice(0, 3).map(([o, side]) => [o, byId.get(o).name, res, side]);
    return { pos: s.pos || null, pct: Math.round(pct(s) * 1000) / 10, pl: played(m.id), tot: s.tot, w: s.w, l: s.l, d: s.d, rec: pickx(s.beat, 'W').concat(pickx(s.lost, 'L')) };
  };
  const top = { t: now, n: list.length, top: ranked.slice(0, TOP_N).map(m => { const e = entry(m); return { id: m.id, name: m.name, pos: e.pos, pct: e.pct, pl: e.pl, tot: e.tot }; }) };
  const buckets = {};
  for (const m of list) { const b = bucketOf(m.id); (buckets[b] = buckets[b] || { m: {} }).m[m.id] = entry(m); }
  const changed = {};
  for (let b = 0; b < 64; b++) { const v = buckets[b] || { m: {} }, h = hashStr(JSON.stringify(v)); if (bh[b] !== h) { changed[b] = v; bh[b] = h; } }

  // 4) チャンピオン（前の 順位表が きのうの もの なら、その 1 位）
  let champion = null;
  const prev = act.board;
  // CPU（はじめの 相手として 入れて いる 表の CPU）は チャンピオンに しない
  const cc = prev && prev.top ? prev.top.find(x => byId.has(x.id) && !byId.get(x.id).dev.startsWith('testdev')) : null;
  if (prev && prev.t && seasonOf(prev.t) !== season && cc && cc.pl >= Math.min(CHAMP_MIN, cc.tot)) {
    const c = cc;
    champion = { season: seasonOf(prev.t), id: c.id, name: c.name, code: byId.get(c.id).code, pct: c.pct, w: 0, l: 0, d: 0, n: prev.n };
  }
  const body = { top, buckets: changed }; if (champion) body.champion = champion;
  const res = await (await fetch(API + '/admin/board', { method: 'POST', headers: H, body: JSON.stringify(body) })).json();
  if (!res.ok) throw new Error('board 失敗 ' + JSON.stringify(res));
  const packed = Buffer.alloc(Math.ceil(n * n / 4));
  for (let k = 0; k < n * n; k++) if (R[k]) packed[k >> 2] |= R[k] << ((k & 3) * 2);
  const after = JSON.stringify({ v: 2, ids: list.map(m => m.id), res: packed.toString('base64'), bh });
  fs.mkdirSync(path.dirname(CACHE), { recursive: true }); fs.writeFileSync(CACHE, after);
  // GitHub Actions に「キャッシュが 変わったか」を 知らせる（変わった ときだけ 保存）
  if (process.env.GITHUB_OUTPUT) fs.appendFileSync(process.env.GITHUB_OUTPUT, 'changed=' + (before !== after ? 1 : 0) + String.fromCharCode(10));
  let computed = 0; for (let k = 0; k < n * n; k++) if (R[k]) computed++;
  const allPairs = list.reduce((a, m) => a + st.get(m.id).tot, 0) / 2;
  const kb = (after.length / 1024).toFixed(1);
  console.log('登録 ' + list.length + ' 体・今回 ' + todo.length + ' 戦（' + ((Date.now() - t0) / 1000).toFixed(1) + ' 秒）・計算ずみ ' + computed + ' / ' + allPairs + ' 戦・キャッシュ ' + kb + ' KB・書きこみ ' + res.written + ' 行' + (champion ? '・きのうの チャンピオン ' + champion.name : ''));
}

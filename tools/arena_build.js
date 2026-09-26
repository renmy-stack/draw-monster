// node tools/arena_build.js — アリーナの 相手リスト arena.json を 作る（GitHub Actions が 3 時間ごとに 実行）
// 1. Firebase の arena/sub（出された 形）と arena/res（5 れんせんの 結果）を、前回の つづきから 読む（FB_SECRET が いる）
// 2. 形を たしかめて（validDesign）同じ 形は 1 つに。1 端末 1 日 5 たいまで。arena_block.txt の 形は 出さない
// 3. 結果は 送られてきた 勝ち負けを 信じず、この sim で 戦わせなおして 数える（同じ 形なら 同じ 結果）
// 4. arena_state.json（ぜんぶの 記録）と arena.json（ゲームが 読む 相手リスト・ランキング）を 書く
'use strict';
const fs = require('fs'), path = require('path');
const RB = require('../sim.js');
const DIR = path.join(__dirname, '..');
const DB = 'https://renmy-games-default-rtdb.asia-southeast1.firebasedatabase.app';
const SEC = process.env.FB_SECRET;
const POOL_MAX = 300, KEEP_DAYS = 14, TOP_N = 10, MIN_BATTLES = 6;

const A1 = ['あかい', 'あおい', 'くろい', 'しろい', 'きいろい', 'みどりの', 'ちびの', 'でかい', 'まるい', 'とがった', 'ギザギザ', 'ふわふわ', 'かたい', 'はやい', 'ねむい', 'おこった', 'わらう', 'なぞの', 'ひかる', 'さびた'];
const A2 = ['ドラゴン', 'ゴーレム', 'スライム', 'オバケ', 'カイジュウ', 'ロボ', 'ザウルス', 'タコ', 'カニ', 'クマ', 'ネコ', 'トリ', 'ヘビ', 'キノコ', 'ホネ', 'マジン', 'カッパ', 'ヤドカリ', 'コウモリ', 'サメ'];
function nameOf(code) {
  let h = 2166136261; for (let i = 0; i < code.length; i++) { h ^= code.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; }
  return A1[h % A1.length] + ' ' + A2[(h >>> 8) % A2.length] + ' ' + String((h >>> 16) % 1000).padStart(3, '0');
}
const jst = t => new Date(t + 9 * 3600e3).toISOString().slice(0, 16).replace('T', ' ');

async function get(p, q) {
  const url = DB + p + '.json?auth=' + encodeURIComponent(SEC) + (q || '');
  for (let i = 0; i < 4; i++) {
    const r = await fetch(url);
    if (r.ok) return r.json();
    await new Promise(s => setTimeout(s, 2000));
  }
  throw new Error('read fail ' + p);
}
// base 以下を 日付ごとに、前回の つづき（{ day, key }）から 読む
async function readNew(base, from) {
  const days = Object.keys((await get(base, '&shallow=true')) || {}).filter(d => !from.day || d >= from.day).sort();
  const out = []; let pos = Object.assign({}, from);
  for (const d of days) {
    const q = d === from.day && from.key ? '&orderBy=' + encodeURIComponent('"$key"') + '&startAt=' + encodeURIComponent('"' + from.key + '"') : '';
    const o = (await get(base + '/' + d, q)) || {};
    for (const k of Object.keys(o).sort()) { if (d === from.day && k === from.key) continue; out.push(Object.assign({ k, day: d }, o[k])); pos = { day: d, key: k }; }
  }
  return { rows: out, pos };
}

(async () => {
  if (!SEC) throw new Error('FB_SECRET が ない');
  const stFile = path.join(DIR, 'arena_state.json');
  const st = fs.existsSync(stFile) ? JSON.parse(fs.readFileSync(stFile, 'utf8')) : { sub: {}, res: {}, pool: {}, perDay: {} };
  const block = new Set(fs.existsSync(path.join(DIR, 'arena_block.txt')) ? fs.readFileSync(path.join(DIR, 'arena_block.txt'), 'utf8').split(/\s+/).filter(Boolean) : []);
  const now = Date.now(), today = jst(now).slice(0, 10);
  // はじめは 表と 裏の CPU を 相手に 入れておく（みんなの 形が あつまるまで）
  if (!st.seeded) { for (const d of RB.CPU.concat(RB.URA)) { const c = RB.encodeDesign({ body: d.body, arm: d.arm, leg: d.leg }); st.pool[c] = { t: 0, id: 'cpu', nm: d.name, w: 0, l: 0 }; } st.seeded = true; }

  // 1) 出された 形
  const sub = await readNew('/arena/sub', st.sub); st.sub = sub.pos;
  let added = 0;
  for (const x of sub.rows) {
    const code = String(x.d || ''), dayKey = x.day + ':' + x.id;
    if (st.pool[code] || block.has(code)) continue;
    if ((st.perDay[dayKey] || 0) >= 5) continue;
    const d = RB.decodeDesign(code);
    if (!d || !RB.validDesign(d)) continue;
    st.perDay[dayKey] = (st.perDay[dayKey] || 0) + 1;
    st.pool[code] = { t: x.r || now, id: x.id, w: 0, l: 0, dw: 0 };
    added++;
  }
  for (const k of Object.keys(st.perDay)) if (k.slice(0, 10) < today) delete st.perDay[k];

  // 2) 5 れんせんの 結果（戦わせなおして 数える。w = 勝ち数、l = 負け数、ひきわけは 0.5 ずつ）
  const res = await readNew('/arena/res', st.res); st.res = res.pos;
  const cache = new Map(), dec = c => { if (!cache.has(c)) cache.set(c, RB.decodeDesign(c)); return cache.get(c); };
  let fights = 0;
  for (const x of res.rows) {
    let e = []; try { e = JSON.parse(x.e); } catch (err) {}
    for (const [oc, mc] of e.slice(0, 5)) {
      const o = dec(oc), m = dec(mc);
      if (!o || !m || !st.pool[oc]) continue;
      const W = RB.fight(m, o).winner; fights++;
      const rec = (c, won) => { const p = st.pool[c]; if (!p) return; if (won === 0.5) { p.w += 0.5; p.l += 0.5; } else if (won) p.w++; else p.l++; };
      rec(oc, W === 'B' ? 1 : W == null ? 0.5 : 0);   // 相手（まもる がわ）
      rec(mc, W === 'A' ? 1 : W == null ? 0.5 : 0);   // じぶん（アリーナに 出していれば）
    }
  }

  // 3) ふるくて あまり 戦っていない 形は はずす。多すぎたら 新しい 順＋強い 順で のこす
  for (const [c, p] of Object.entries(st.pool)) if (block.has(c) || (p.id !== 'cpu' && now - p.t > KEEP_DAYS * 864e5 && p.w + p.l < MIN_BATTLES)) delete st.pool[c];
  const score = p => (p.w + 2) / (p.w + p.l + 4);
  let list = Object.entries(st.pool).map(([c, p]) => ({ c, ...p }));
  if (list.length > POOL_MAX) {
    const strong = list.filter(p => p.w + p.l >= MIN_BATTLES).sort((a, b) => score(b) - score(a)).slice(0, 50);
    const rest = list.filter(p => !strong.includes(p)).sort((a, b) => b.t - a.t).slice(0, POOL_MAX - strong.length);
    list = strong.concat(rest);
  }
  list.sort((a, b) => a.t - b.t);
  const pool = list.map(p => ({ c: p.c, n: p.nm || nameOf(p.c), w: Math.round(p.w * 10) / 10, l: Math.round(p.l * 10) / 10 }));
  const top = pool.map((p, i) => [i, p]).filter(([, p]) => p.w + p.l >= MIN_BATTLES).sort((a, b) => score(b[1]) - score(a[1])).slice(0, TOP_N).map(([i]) => i);

  fs.writeFileSync(stFile, JSON.stringify(st));
  fs.writeFileSync(path.join(DIR, 'arena.json'), JSON.stringify({ t: jst(now), pool, top }));
  console.log('あたらしい 形 ' + added + '・戦いなおし ' + fights + '・アリーナ ' + pool.length + ' たい・ランキング ' + top.length);
})().catch(e => { console.error(e); process.exit(1); });

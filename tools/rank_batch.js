// node tools/rank_batch.js — モンスター ランクせん の 5 分ごとの 計算（GitHub Actions が 実行。RANK_ADMIN が いる）
// 1. 登録中の モンスターを ぜんぶ 受け取る
// 2. 日が かわっていたら、きのうの 1 位を チャンピオンに 記録して、点数・勝ち負けを 0 から
// 3. 点数の 近い 相手と 自動で 対戦（1 回 最大 MAXF 戦。登録が 少なければ 1 体 あたり 2 戦 前後）。点数は イロレーティング
// 4. 戦った モンスターだけ 点数・最近の 10 戦を 書き戻す（順位は 見るときに 数える。書きこみ枠の 節約）
'use strict';
const RB = require('../sim.js');
const API = 'https://renmy-rank.renmy-stack.workers.dev';
const KEY = process.env.RANK_ADMIN;
const MAXF = 60, WINDOW = 8, RECENT = 10, CHAMP_MIN = 5;
const H = { Authorization: 'Bearer ' + KEY, 'Content-Type': 'application/json' };

async function main() {
  if (!KEY) throw new Error('RANK_ADMIN が ない');
  const act = await (await fetch(API + '/admin/active', { headers: H })).json();
  const season = act.season, now = act.now;
  const rows = act.list.map(x => ({ ...x, recent: JSON.parse(x.recent || '[]'), changed: false }));

  // 2) シーズンの 切りかえ
  let champion = null;
  const old = rows.filter(r => r.season !== season);
  if (old.length) {
    const last = old.map(r => r.season).sort().pop();
    const cand = old.filter(r => r.season === last && r.w + r.l + r.d >= CHAMP_MIN).sort((a, b) => b.rating - a.rating);
    if (cand.length) { const c = cand[0]; champion = { season: last, id: c.id, name: c.name, code: c.code, rating: Math.round(c.rating), w: c.w, l: c.l, d: c.d, n: old.filter(r => r.season === last).length }; }
    for (const r of old) Object.assign(r, { season, rating: 1000, w: 0, l: 0, d: 0, recent: [], changed: true });
  }

  // 3) 対戦
  const dec = new Map(rows.map(r => [r.id, RB.decodeDesign(r.code)]));
  const live = rows.filter(r => dec.get(r.id));
  live.sort((a, b) => b.rating - a.rating);
  let fights = 0;
  if (live.length >= 2) {
    // ならびを まぜて、ひとりずつ 近い 点数の 相手と 1 戦（上限 MAXF 戦）
    const order = live.map((r, i) => i).sort(() => Math.random() - 0.5);
    for (let rep = 0; rep < 2 && fights < MAXF; rep++) for (const i of order) {
      if (fights >= MAXF) break;
      const a = live[i];
      const lo = Math.max(0, i - WINDOW), hi = Math.min(live.length - 1, i + WINDOW);
      const pool = []; for (let j = lo; j <= hi; j++) if (j !== i && live[j].dev !== a.dev) pool.push(live[j]);
      if (!pool.length) continue;
      const b = pool[Math.floor(Math.random() * pool.length)];
      const left = Math.random() < 0.5 ? a : b, right = left === a ? b : a;   // 左右は ランダム
      const W = RB.fight(dec.get(left.id), dec.get(right.id)).winner;
      elo(left, right, W === 'A' ? 1 : W === 'B' ? 0 : 0.5, now);
      fights++;
    }
  }

  // 4) 戦った モンスターだけ 書き戻す
  const out = rows.filter(r => r.changed).map(r => ({ id: r.id, season: r.season, rating: Math.round(r.rating * 10) / 10, w: r.w, l: r.l, d: r.d, recent: r.recent }));
  for (let i = 0; i < out.length || (i === 0 && champion); i += 200) {
    const body = { rows: out.slice(i, i + 200) }; if (i === 0 && champion) body.champion = champion;
    const res = await (await fetch(API + '/admin/update', { method: 'POST', headers: H, body: JSON.stringify(body) })).json();
    if (!res.ok) throw new Error('update 失敗 ' + JSON.stringify(res));
  }
  console.log('シーズン ' + season + '・登録 ' + rows.length + ' 体・対戦 ' + fights + ' 戦・書き戻し ' + out.length + ' 体' + (champion ? '・きのうの チャンピオン ' + champion.name : ''));
}

// イロレーティング（はじめの 20 戦は 大きく 動く）。最近の 10 戦も 記録（リプレイ用に 相手の 形と 左右）
function elo(L, R, sL, now) {
  const eL = 1 / (1 + Math.pow(10, (R.rating - L.rating) / 400));
  const kL = L.w + L.l + L.d < 20 ? 32 : 20, kR = R.w + R.l + R.d < 20 ? 32 : 20;
  const dL = kL * (sL - eL), dR = kR * ((1 - sL) - (1 - eL));
  L.rating += dL; R.rating += dR;
  const res = s => s === 1 ? 'W' : s === 0 ? 'L' : 'D';
  const rec = (me, op, s, side, d) => {
    if (s === 1) me.w++; else if (s === 0) me.l++; else me.d++;
    me.recent.unshift({ t: now, o: op.id, n: op.name, c: op.code, r: res(s), s: side, d: Math.round(d) });
    me.recent = me.recent.slice(0, RECENT); me.changed = true;
  };
  rec(L, R, sL, 'A', dL); rec(R, L, 1 - sL, 'B', dR);
}

main().catch(e => { console.error(e); process.exit(1); });

// ランクせん リーグ制（2026-10-03〜、オーナーと 決めた しくみ）。rank_batch.js が 使う
// ・リーグは プレイヤー（端末）に つく。描きなおしても リーグは そのまま。はじめての 人は ブロンズ
//   0 ブロンズ・1 シルバー・2 ゴールド・3 プラチナ・4 ダイヤ・5 マスター・6 グランドマスター・7 レジェンド（人が ふえたら 上に 足す）
// ・いちばん上 以外の リーグは だいたい 50 体（30〜60）の グループに 分けて、グループの 中で 総当たり（左右 2 戦）
//   60 を こえた グループは 分ける・30 を 切った グループは ほかに 空きが あれば まとめる。グループの 数が かわる・差が 5 より 大きい ときは ならす（2026-10-03 案 A）
// ・いちばん上の リーグ（はじめは ダイヤ）は 全員で 1 グループ（人数は きめない、2026-10-03 オーナー「定員 30 は やめる」）
// ・毎日 0 時（日本時間）の はじめの 計算で 昇格・降格。わりあいは 模型で くらべて 決めた（2026-10-03、ladder_compare2.js の 案 G）:
//   昇格 ブロンズ 25%・シルバー 15%・ゴールド 10%・プラチナ 以上 7%（グループの 上から）、降格 10%（下から、ブロンズは なし）
//   プラチナ 以上を 7% に して、人が ふえた ときに 上の リーグが ふえすぎない ように（1 万人で 6 段。10% だと 7 段、ladder_split.js）
//   降格を 20% → 10% に して「上がって すぐ 落ちる」を 43% → 26% に。真ん中の 人が シルバー、強い 新人は 3〜4 日で いちばん上
//   試合が 半分も 終わって いない 人は 動かない。動いた 人だけ 行き先の グループへ。月曜 0 時は 全員を まぜなおす
// ・いちばん上が 60 体を こえたら、0 時に 勝率の 上半分が 新しい 上の リーグへ（オーナー 案）。15 体を 切ったら その リーグを とじて 下と あわせる
// ・はじめて リーグ制に する とき: 今の 全体順位の わりあいで 上位 3% ダイヤ・10% プラチナ・25% ゴールド・50% シルバー・のこり ブロンズ
// ・CPU（dev が testdev…）は リーグに 入れない
'use strict';
const LG_N = 50, LG_MAX = 60, LG_MIN = 30, SPLIT = 60, CLOSE = 15, MAXL = 7, TOP0 = 4;
const UP = [0.25, 0.15, 0.10, 0.07], DOWN = 0.10, INIT = [0.50, 0.25, 0.10, 0.03];   // INIT[k]: これより 上なら リーグ k+1
const upOf = L => UP[Math.min(L, UP.length - 1)];
const NAMES = ['ブロンズ', 'シルバー', 'ゴールド', 'プラチナ', 'ダイヤ', 'マスター', 'グランドマスター', 'レジェンド'];
const isCPU = m => String(m.dev).startsWith('testdev');
const hashStr = s => { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0; return h; };
const weekOf = day => { const d = new Date(day + 'T00:00:00Z'), w = (d.getUTCDay() + 6) % 7; return new Date(d - w * 864e5).toISOString().slice(0, 10); };   // その 週の 月曜

// グループの 中の 成績（左右 2 戦ずつ）。R[i*n+j]: 0 まだ・1 左の 勝ち・2 右の 勝ち・3 ひきわけ
function scoreGroup(mem, R, n, can) {
  const out = new Map();
  for (const a of mem) {
    let w = 0, l = 0, d = 0, tot = 0;
    for (const b of mem) {
      if (a === b || !can(a, b)) continue;
      tot += 2;
      const x = R[a * n + b], y = R[b * n + a];   // x: a が 左、y: a が 右
      if (x === 1) w++; else if (x === 2) l++; else if (x === 3) d++;
      if (y === 2) w++; else if (y === 1) l++; else if (y === 3) d++;
    }
    const pl = w + l + d;
    out.set(a, { w, l, d, pl, tot, pct: (w + d / 2) / Math.max(1, pl) });
  }
  return out;
}
// グループの 順位と 印。up 昇格・down 降格・hold 試合が 半分 未満で 動かない
function rankGroup(L, mem, sc, list, top) {
  const s = mem.slice().sort((a, b) => sc.get(b).pct - sc.get(a).pct || sc.get(b).pl - sc.get(a).pl || (list[a].id < list[b].id ? -1 : 1));
  const k = s.length, up = L < top ? Math.round(k * upOf(L)) : 0;
  const dn = L === 0 ? 0 : Math.round(k * DOWN);
  return s.map((i, p) => { const r = sc.get(i); return { i, gp: p + 1, gn: k, z: r.pl < r.tot / 2 ? 'hold' : p < up ? 'up' : p >= k - dn ? 'down' : '' }; });
}
const groupsOf = (P, list) => { const g = new Map(); for (const [i, p] of P) if (p.g != null) { const key = p.L + '_' + p.g; if (!g.has(key)) g.set(key, []); g.get(key).push(i); } return g; };
// 全部の グループの 印。key → { L, g, sc, rows }
function zonesAll(groups, top, R, n, can, list) {
  const res = new Map();
  for (const [key, mem] of groups) { const L = +key.split('_')[0], g = +key.split('_')[1], sc = scoreGroup(mem, R, n, can); res.set(key, { L, g, sc, rows: rankGroup(L, mem, sc, list, top) }); }
  return res;
}

// 1) リーグと グループを きめる（計算の 前）。pct(i): 今の 全体勝率（はじめて の ときだけ 使う、まだ なら -1）
function plan({ list, n, R, can, pct, meta, today }) {
  const week = weekOf(today), log = [];
  let top = meta && meta.top != null ? meta.top : TOP0;
  // P: モンスターの 番号 → { L, g, dev, L0, g0 }（L0・g0 は データベースに 今 ある 値）
  const P = new Map();
  list.forEach((m, i) => { if (!isCPU(m)) P.set(i, { dev: m.dev, L: m.league == null ? null : +m.league, g: m.grp == null ? null : +m.grp, L0: m.league == null ? null : +m.league, g0: m.grp == null ? null : +m.grp }); });
  let seed = hashStr(today); const rnd = () => (seed = (Math.imul(seed, 1103515245) + 12345) >>> 0) / 4294967296;
  const shuffle = a => { for (let k = a.length - 1; k > 0; k--) { const r = Math.floor(rnd() * (k + 1)); [a[k], a[r]] = [a[r], a[k]]; } return a; };
  const init = !meta;
  if (init) {
    // はじめて: 今の 全体順位の わりあいで（まだ 順位の ない 人は ブロンズ）
    const ranked = [...P.keys()].filter(i => pct(i) >= 0).sort((a, b) => pct(b) - pct(a)), N = ranked.length;
    if (N < P.size * 0.8) return null;   // 計算ずみが 少ない（キャッシュが 消えた など）ときは リーグ分けを しない（みんな ブロンズに なって しまう）
    ranked.forEach((i, p) => { const f = (p + 1) / Math.max(1, N); const p0 = P.get(i); p0.L = f <= INIT[3] ? 4 : f <= INIT[2] ? 3 : f <= INIT[1] ? 2 : f <= INIT[0] ? 1 : 0; p0.g = null; });
    for (const p of P.values()) if (p.L == null) { p.L = 0; p.g = null; }
    log.push('はじめての リーグ分け ' + [0, 1, 2, 3, 4].map(L => NAMES[L] + ' ' + [...P.values()].filter(p => p.L === L).length).join('・'));
  } else {
    for (const p of P.values()) if (p.L == null) { p.L = 0; p.g = null; }   // はじめての 人
    if (meta.day !== today) {
      // 0 時: きのうの グループの 成績で 昇格・降格（いまの グループで 数える）
      let up = 0, dn = 0;
      for (const v of zonesAll(groupsOf(P, list), top, R, n, can, list).values()) for (const r of v.rows) {
        const p = P.get(r.i);
        if (r.z === 'up') { p.L++; p.g = null; up++; } else if (r.z === 'down') { p.L--; p.g = null; dn++; }
      }
      log.push('0 時の 昇格 ' + up + '・降格 ' + dn);
      // いちばん上が 60 体を こえた → 勝率の 上半分が 新しい 上の リーグへ。15 体を 切った → その リーグを とじて 下と あわせる
      const topP = [...P.entries()].filter(([, p]) => p.L === top);
      if (topP.length > SPLIT && top < MAXL) {
        const sc = scoreGroup(topP.map(([i]) => i), R, n, can);
        topP.sort((a, b) => sc.get(b[0]).pct - sc.get(a[0]).pct).slice(0, Math.ceil(topP.length / 2)).forEach(([, p]) => { p.L = top + 1; p.g = null; });
        top++; for (const p of P.values()) if (p.L === top - 1) p.g = null;
        log.push('上に ' + NAMES[top] + ' を 足した（' + Math.ceil(topP.length / 2) + ' 体）');
      } else if (topP.length < CLOSE && top > TOP0) {
        for (const [, p] of topP) { p.L = top - 1; p.g = null; }
        top--; log.push(NAMES[top + 1] + ' を とじて ' + NAMES[top] + ' と あわせた');
      }
      if (meta.week !== week) { for (const p of P.values()) p.g = null; log.push('月曜: 全員を まぜなおし'); }
    }
  }
  // グループに 入れる: いちばん上は 1 グループ。ほかは リーグに 何グループ いるかを きめ（だいたい 50 体・60 を こえない 数）、
  // 入って いない 人は いちばん 少ない グループへ。グループの 数が かわった・30〜60 を はみだした・差が 5 より 大きい ときだけ 大きい グループから 小さい グループへ うつす
  for (let L = 0; L <= top; L++) {
    const inL = [...P.entries()].filter(([, p]) => p.L === L);
    if (L === top) { for (const [, p] of inL) p.g = 0; continue; }
    if (!inL.length) continue;
    const T = inL.length, k = Math.max(1, Math.round(T / LG_N), Math.ceil(T / LG_MAX)), mem = new Map();
    for (const [i, p] of inL) if (p.g != null) { if (!mem.has(p.g)) mem.set(p.g, []); mem.get(p.g).push(i); }
    const free = shuffle(inL.filter(([, p]) => p.g == null).map(([i]) => i));
    let nextId = mem.size ? Math.max(...mem.keys()) + 1 : 0;
    const smallest = () => [...mem].sort((x, y) => x[1].length - y[1].length || x[0] - y[0])[0], largest = () => [...mem].sort((x, y) => y[1].length - x[1].length || x[0] - y[0])[0];
    const k0 = mem.size;
    while (mem.size > k) { const [g, m] = smallest(); mem.delete(g); free.push(...m); }   // 人が へった: 小さい グループを ほかへ
    while (mem.size < k) mem.set(nextId++, []);                                          // 人が ふえた: 新しい グループ（下で 大きい グループから 分ける）
    for (const i of free) smallest()[1].push(i);
    for (let t = 0; t < T; t++) {
      const [, big] = largest(), [, sm] = smallest();
      const need = mem.size !== k0 || sm.length < LG_MIN || big.length > LG_MAX || big.length - sm.length > 5;
      if (big.length - sm.length <= 1 || !need && t === 0) break;
      sm.push(big.splice(Math.floor(rnd() * big.length), 1)[0]);
    }
    for (const [g, m] of mem) for (const i of m) P.get(i).g = g;
  }
  return { P, groups: groupsOf(P, list), init, week, top, log };
}

// 2) まだの 対戦（グループの 中、左右 2 戦）。試合が 少ない 人から
function todo(pl, R, n, can) {
  const out = [], need = [];
  for (const mem of pl.groups.values()) for (const a of mem) { let miss = 0; for (const b of mem) if (a !== b && can(a, b)) { if (!R[a * n + b]) miss++; if (!R[b * n + a]) miss++; } need.push([a, miss, mem]); }
  need.sort((x, y) => y[1] - x[1]);
  const seen = new Set();
  for (const [a, miss, mem] of need) { if (!miss) continue; for (const b of mem) if (a !== b && can(a, b)) for (const [i, j] of [[a, b], [b, a]]) { const k = i * n + j; if (!R[k] && !seen.has(k)) { seen.add(k); out.push([i, j]); } } }
  return out;
}

// 3) 成績・グループの 順位表・書き戻す もの（計算の あと）。prevH: 前に 書いた グループ表の ハッシュ
// entry: { L, g, gp, gn, pct, pl, tot, z, top（いちばん上の リーグ）, un（この グループの 昇格の 数）, dn（降格の 数）, rec }
function finish(pl, { list, n, R, can, prevH, today, now }) {
  const entry = new Map(), lgroups = {}, H = {}, top = pl.top;
  for (const [key, v] of zonesAll(pl.groups, top, R, n, can, list)) {
    const { L, g, sc, rows } = v, mem = pl.groups.get(key), un = rows.filter(r => r.z === 'up').length, dn = rows.filter(r => r.z === 'down').length;
    // 対戦の 例（リプレイ用）: グループの 強い 相手に かった 3 戦・まけた 3 戦 [相手 ID, 名前, 'W'/'L', 自分が 'A' 左 / 'B' 右]
    const recOf = a => { const beat = [], lost = []; for (const b of mem) { if (a === b || !can(a, b)) continue; const x = R[a * n + b], y = R[b * n + a];
      if (x === 1) beat.push([b, 'A']); else if (x === 2) lost.push([b, 'A']); if (y === 2) beat.push([b, 'B']); else if (y === 1) lost.push([b, 'B']); }
      const pick = (arr, res) => arr.sort((p, q) => sc.get(q[0]).pct - sc.get(p[0]).pct).slice(0, 3).map(([b, side]) => [list[b].id, list[b].name, res, side]);
      return pick(beat, 'W').concat(pick(lost, 'L')); };
    const tab = rows.map(r => { const s = sc.get(r.i); entry.set(r.i, { L, g, gp: r.gp, gn: r.gn, pct: Math.round(s.pct * 1000) / 10, pl: s.pl, tot: s.tot, z: r.z, top: L === top, un, dn, rec: recOf(r.i) }); return [r.gp, list[r.i].id, list[r.i].name, Math.round(s.pct * 1000) / 10, r.z, list[r.i].code, list[r.i].kz || null]; });   // 6・7 番目: 形・かざり（グループ表の 絵）
    const h = hashStr(JSON.stringify(tab)); H[key] = h; if ((prevH || {})[key] !== h) lgroups[key] = tab;
  }
  for (const key of Object.keys(prevH || {})) if (!(key in H)) lgroups[key] = null;   // なくなった グループ
  const players = []; for (const p of pl.P.values()) if (p.L !== p.L0 || p.g !== p.g0) players.push([p.dev, p.L, p.g]);
  const sizes = [], groups = []; for (let L = 0; L <= top; L++) { sizes.push([...pl.P.values()].filter(p => p.L === L).length); groups.push([...pl.groups.keys()].filter(k => +k.split('_')[0] === L).length); }
  return { entry, lgroups, players, H, meta: { day: today, week: pl.week, top, t: now, sizes, groups, n: LG_N, split: SPLIT, close: CLOSE, up: UP, down: DOWN } };
}
module.exports = { plan, todo, finish, scoreGroup, rankGroup, zonesAll, weekOf, NAMES, LG_N, SPLIT };

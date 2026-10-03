// ランクせん リーグ制（2026-10-03〜、オーナーと 決めた しくみ）。rank_batch.js が 使う
// ・リーグは プレイヤー（端末）に つく。描きなおしても リーグは そのまま。はじめての 人は ブロンズ
//   0 ブロンズ・1 シルバー・2 ゴールド・3 プラチナ・4 ダイヤ
// ・リーグを 50 体ずつの グループに 分けて、グループの 中で 総当たり（左右 2 戦）。ダイヤは グループ 1 つ
// ・毎日 0 時（日本時間）の はじめの 計算で: グループの 上位 UP[L] を 昇格・下位 20% を 降格（ブロンズは 降格 なし・ダイヤは 昇格 なし）
//   上の リーグほど 昇格を 少なく（全部 同じ だと 何日かで 全リーグ 同じ 人数に なる）。試合が 半分も 終わって いない 人は 動かない
//   動いた 人だけ 行き先の グループへ（毎日 全員を まぜると 0 時すぎに 約 10 万戦）。月曜 0 時は 全員を まぜなおす（グループの 運・ねらい撃ちを へらす）
// ・はじめて リーグ制に する とき: 今の 全体順位の わりあいで 上位 3% ダイヤ・10% プラチナ・25% ゴールド・50% シルバー・のこり ブロンズ
// ・CPU（dev が testdev…）は リーグに 入れない
'use strict';
const LG_N = 50, LG_MAX = 60, LG_MIN = 10, UP = [0.20, 0.15, 0.10, 0.08, 0], DOWN = 0.20, INIT = [0.50, 0.25, 0.10, 0.03];   // INIT[k]: これより 上なら リーグ k+1
const NAMES = ['ブロンズ', 'シルバー', 'ゴールド', 'プラチナ', 'ダイヤ'];
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
// 順位と 印（up 昇格圏・down 降格圏・hold 試合が 半分 未満で 動かない・'' そのまま）
function rankGroup(L, mem, sc, list) {
  const s = mem.slice().sort((a, b) => sc.get(b).pct - sc.get(a).pct || sc.get(b).pl - sc.get(a).pl || (list[a].id < list[b].id ? -1 : 1));
  const k = s.length, up = L < 4 ? Math.round(k * UP[L]) : 0, dn = L > 0 ? Math.round(k * DOWN) : 0;
  return s.map((i, p) => { const r = sc.get(i); return { i, gp: p + 1, gn: k, z: r.pl < r.tot / 2 ? 'hold' : p < up ? 'up' : p >= k - dn ? 'down' : '' }; });
}
const groupsOf = (P, list) => { const g = new Map(); for (const [i, p] of P) if (p.g != null) { const key = p.L + '_' + p.g; if (!g.has(key)) g.set(key, []); g.get(key).push(i); } return g; };

// 1) リーグと グループを きめる（計算の 前）。pct(i): 今の 全体勝率（はじめて の ときだけ 使う、まだ なら -1）
function plan({ list, n, R, can, pct, meta, today }) {
  const week = weekOf(today), log = [];
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
      for (const [key, mem] of groupsOf(P, list)) {
        const L = +key.split('_')[0], sc = scoreGroup(mem, R, n, can);
        for (const r of rankGroup(L, mem, sc, list)) { const p = P.get(r.i); if (r.z === 'up') { p.L++; p.g = null; up++; } else if (r.z === 'down') { p.L--; p.g = null; dn++; } }
      }
      log.push('0 時の 昇格 ' + up + '・降格 ' + dn);
      if (meta.week !== week) { for (const p of P.values()) p.g = null; log.push('月曜: 全員を まぜなおし'); }
    }
  }
  // グループに 入れる: 入って いない 人を、その リーグの いちばん 少ない グループへ（60 体まで。いっぱいなら 新しい グループ）。ダイヤは いつも 0
  for (let L = 0; L < 5; L++) {
    const inL = [...P.entries()].filter(([, p]) => p.L === L);
    if (L === 4) { for (const [, p] of inL) p.g = 0; continue; }
    const cnt = new Map(); for (const [, p] of inL) if (p.g != null) cnt.set(p.g, (cnt.get(p.g) || 0) + 1);
    // 小さく なりすぎた グループ（10 体 未満）は ほかの グループへ（リーグに グループが 2 つ 以上 ある とき）
    if (cnt.size > 1) for (const [g, c] of [...cnt]) if (c < LG_MIN) { for (const [, p] of inL) if (p.g === g) p.g = null; cnt.delete(g); }
    const free = shuffle(inL.filter(([, p]) => p.g == null).map(([i]) => i));
    if (!cnt.size) {
      // まだ グループが ない（はじめて・月曜）: ちょうど よい 数に 分ける
      const k = Math.max(1, Math.round(free.length / LG_N));
      free.forEach((i, q) => { P.get(i).g = q % k; });
      continue;
    }
    let nextId = Math.max(...cnt.keys()) + 1;
    for (const i of free) {
      let best = null; for (const [g, c] of cnt) if (c < LG_MAX && (best == null || c < cnt.get(best))) best = g;
      if (best == null) { best = nextId++; cnt.set(best, 0); }
      P.get(i).g = best; cnt.set(best, cnt.get(best) + 1);
    }
  }
  return { P, groups: groupsOf(P, list), init, week, log };
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
function finish(pl, { list, n, R, can, prevH, today, now }) {
  const entry = new Map(), lgroups = {}, H = {};
  for (const [key, mem] of pl.groups) {
    const L = +key.split('_')[0], g = +key.split('_')[1], sc = scoreGroup(mem, R, n, can), rows = rankGroup(L, mem, sc, list);
    // 対戦の 例（リプレイ用）: グループの 強い 相手に かった 3 戦・まけた 3 戦 [相手 ID, 名前, 'W'/'L', 自分が 'A' 左 / 'B' 右]
    const recOf = a => { const beat = [], lost = []; for (const b of mem) { if (a === b || !can(a, b)) continue; const x = R[a * n + b], y = R[b * n + a];
      if (x === 1) beat.push([b, 'A']); else if (x === 2) lost.push([b, 'A']); if (y === 2) beat.push([b, 'B']); else if (y === 1) lost.push([b, 'B']); }
      const pick = (arr, res) => arr.sort((p, q) => sc.get(q[0]).pct - sc.get(p[0]).pct).slice(0, 3).map(([b, side]) => [list[b].id, list[b].name, res, side]);
      return pick(beat, 'W').concat(pick(lost, 'L')); };
    const tab = rows.map(r => { const s = sc.get(r.i); entry.set(r.i, { L, g, gp: r.gp, gn: r.gn, pct: Math.round(s.pct * 1000) / 10, pl: s.pl, tot: s.tot, z: r.z, rec: recOf(r.i) }); return [r.gp, list[r.i].id, list[r.i].name, Math.round(s.pct * 1000) / 10, r.z, list[r.i].code, list[r.i].kz || null]; });   // 6・7 番目: 形・かざり（グループ表の 絵）
    const h = hashStr(JSON.stringify(tab)); H[key] = h; if ((prevH || {})[key] !== h) lgroups[key] = tab;
  }
  for (const key of Object.keys(prevH || {})) if (!(key in H)) lgroups[key] = null;   // なくなった グループ
  const players = []; for (const p of pl.P.values()) if (p.L !== p.L0 || p.g !== p.g0) players.push([p.dev, p.L, p.g]);
  const sizes = [0, 1, 2, 3, 4].map(L => [...pl.P.values()].filter(p => p.L === L).length);
  const groups = [0, 1, 2, 3, 4].map(L => [...pl.groups.keys()].filter(k => +k.split('_')[0] === L).length);
  return { entry, lgroups, players, H, meta: { day: today, week: pl.week, t: now, sizes, groups, n: LG_N, up: UP, down: DOWN } };
}
module.exports = { plan, todo, finish, scoreGroup, rankGroup, weekOf, NAMES, LG_N };

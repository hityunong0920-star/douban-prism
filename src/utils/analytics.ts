import type { Category, DoubanRecord, UserDataset } from '../types/douban';

export const ALL_CATEGORIES: Category[] = ['电影', '读书', '游戏', '音乐'];

export interface CategoryStat {
  category: Category;
  total: number;
  done: number;
  doing: number;
  wish: number;
  rated: number;
  avgRating: number;
  stars: [number, number, number, number, number]; // index 0 = 1★ .. index 4 = 5★
}

export interface OverviewStats {
  total: number;
  ratedCount: number;
  avgRating: number;
  commentCount: number;
  starCounts: [number, number, number, number, number];
  categories: CategoryStat[];
  years: number[];
  minDate: string | null;
  maxDate: string | null;
  fiveStarRatio: number;
  harshRatio: number; // 1-2★ ratio among rated
  strictestCategory: CategoryStat | null;
  generousCategory: CategoryStat | null;
}

export function computeOverviewStats(records: DoubanRecord[]): OverviewStats {
  const starCounts: [number, number, number, number, number] = [0, 0, 0, 0, 0];
  let ratingSum = 0;
  let ratedCount = 0;
  let commentCount = 0;
  const yearSet = new Set<number>();
  let minDate: string | null = null;
  let maxDate: string | null = null;

  const catMap = new Map<Category, { total: number; done: number; doing: number; wish: number; rated: number; sum: number; stars: [number, number, number, number, number] }>();
  for (const c of ALL_CATEGORIES) {
    catMap.set(c, { total: 0, done: 0, doing: 0, wish: 0, rated: 0, sum: 0, stars: [0, 0, 0, 0, 0] });
  }

  for (const r of records) {
    const cs = catMap.get(r.category)!;
    cs.total += 1;
    cs[r.statusGroup] += 1;

    if (r.rating !== null) {
      ratedCount += 1;
      ratingSum += r.rating;
      starCounts[r.rating - 1] += 1;
      cs.rated += 1;
      cs.sum += r.rating;
      cs.stars[r.rating - 1] += 1;
    }

    if (r.comment) commentCount += 1;

    if (r.date) {
      if (!minDate || r.date < minDate) minDate = r.date;
      if (!maxDate || r.date > maxDate) maxDate = r.date;
    }
    if (r.year) yearSet.add(r.year);
  }

  const categories: CategoryStat[] = ALL_CATEGORIES.map((c) => {
    const v = catMap.get(c)!;
    return {
      category: c,
      total: v.total,
      done: v.done,
      doing: v.doing,
      wish: v.wish,
      rated: v.rated,
      avgRating: v.rated > 0 ? Number((v.sum / v.rated).toFixed(2)) : 0,
      stars: v.stars,
    };
  });

  const ratedCategories = categories.filter((c) => c.rated >= 5);
  const strictestCategory =
    ratedCategories.length > 0
      ? [...ratedCategories].sort((a, b) => a.avgRating - b.avgRating)[0]
      : null;
  const generousCategory =
    ratedCategories.length > 0
      ? [...ratedCategories].sort((a, b) => b.avgRating - a.avgRating)[0]
      : null;

  return {
    total: records.length,
    ratedCount,
    avgRating: ratedCount > 0 ? Number((ratingSum / ratedCount).toFixed(2)) : 0,
    commentCount,
    starCounts,
    categories,
    years: Array.from(yearSet).sort((a, b) => b - a),
    minDate,
    maxDate,
    fiveStarRatio: ratedCount > 0 ? Math.round((starCounts[4] / ratedCount) * 100) : 0,
    harshRatio: ratedCount > 0 ? Math.round(((starCounts[0] + starCounts[1]) / ratedCount) * 100) : 0,
    strictestCategory,
    generousCategory,
  };
}

// ==========================================
// Module 1: GitHub-Style Cultural Heatmap
// ==========================================

export interface HeatmapDayCell {
  date: string; // YYYY-MM-DD
  count: number;
  level: 0 | 1 | 2 | 3 | 4;
  items: DoubanRecord[];
  inRange: boolean;
}

export interface HeatmapResult {
  weeks: HeatmapDayCell[][]; // columns of 7 days (Sun..Sat)
  monthLabels: { weekIndex: number; label: string }[];
  totalCount: number;
  activeDays: number;
  longestStreak: number;
  busiestDay: { date: string; count: number; items: DoubanRecord[] } | null;
  monthlyTotals: { month: string; count: number; byCat: Record<Category, number> }[];
}

function formatDateYMD(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function computeHeatmap(
  records: DoubanRecord[],
  selectedYear: number | 'recent',
  categoryFilter: Category | '全部'
): HeatmapResult {
  const filtered = records.filter(
    (r) => r.date && (categoryFilter === '全部' || r.category === categoryFilter)
  );

  let startDate: Date;
  let endDate: Date;

  if (selectedYear === 'recent') {
    const latestDateStr = filtered.reduce<string | null>(
      (max, r) => (r.date && (!max || r.date > max) ? r.date : max),
      null
    );
    endDate = latestDateStr ? new Date(`${latestDateStr}T00:00:00`) : new Date();
    startDate = new Date(endDate);
    startDate.setDate(startDate.getDate() - 364);
  } else {
    startDate = new Date(selectedYear, 0, 1);
    endDate = new Date(selectedYear, 11, 31);
  }

  const startStr = formatDateYMD(startDate);
  const endStr = formatDateYMD(endDate);

  const dayMap = new Map<string, DoubanRecord[]>();
  const monthlyMap = new Map<string, { count: number; byCat: Record<Category, number> }>();

  for (const r of filtered) {
    if (!r.date || r.date < startStr || r.date > endStr) continue;
    const list = dayMap.get(r.date) || [];
    list.push(r);
    dayMap.set(r.date, list);

    const ym = r.date.slice(0, 7);
    const mEntry = monthlyMap.get(ym) || {
      count: 0,
      byCat: { 电影: 0, 读书: 0, 游戏: 0, 音乐: 0 },
    };
    mEntry.count += 1;
    mEntry.byCat[r.category] += 1;
    monthlyMap.set(ym, mEntry);
  }

  // Align grid to Sunday before startDate through Saturday after endDate
  const gridStart = new Date(startDate);
  gridStart.setDate(gridStart.getDate() - gridStart.getDay());
  const gridEnd = new Date(endDate);
  gridEnd.setDate(gridEnd.getDate() + (6 - gridEnd.getDay()));

  const counts = Array.from(dayMap.values()).map((arr) => arr.length);
  const maxDayCount = counts.length > 0 ? Math.max(...counts) : 1;

  const getLevel = (count: number): 0 | 1 | 2 | 3 | 4 => {
    if (count === 0) return 0;
    if (maxDayCount <= 4) return Math.min(4, count) as 1 | 2 | 3 | 4;
    const ratio = count / Math.min(maxDayCount, 12);
    if (ratio <= 0.25) return 1;
    if (ratio <= 0.5) return 2;
    if (ratio <= 0.78) return 3;
    return 4;
  };

  const weeks: HeatmapDayCell[][] = [];
  const monthLabels: { weekIndex: number; label: string }[] = [];
  let lastMonth = -1;

  let totalCount = 0;
  let activeDays = 0;
  let longestStreak = 0;
  let currentStreak = 0;
  let busiestDay: { date: string; count: number; items: DoubanRecord[] } | null = null;

  const cursor = new Date(gridStart);
  let weekIdx = 0;

  while (cursor <= gridEnd) {
    const week: HeatmapDayCell[] = [];
    for (let dow = 0; dow < 7; dow++) {
      const ymd = formatDateYMD(cursor);
      const inRange = ymd >= startStr && ymd <= endStr;
      const items = inRange ? dayMap.get(ymd) || [] : [];
      const count = items.length;

      if (inRange) {
        totalCount += count;
        if (count > 0) {
          activeDays += 1;
          currentStreak += 1;
          if (currentStreak > longestStreak) longestStreak = currentStreak;
          if (!busiestDay || count > busiestDay.count) {
            busiestDay = { date: ymd, count, items };
          }
        } else {
          currentStreak = 0;
        }
      }

      if (dow === 0 && inRange) {
        const m = cursor.getMonth();
        if (m !== lastMonth) {
          monthLabels.push({ weekIndex: weekIdx, label: `${m + 1}月` });
          lastMonth = m;
        }
      }

      week.push({
        date: ymd,
        count,
        level: getLevel(count),
        items,
        inRange,
      });

      cursor.setDate(cursor.getDate() + 1);
    }
    weeks.push(week);
    weekIdx += 1;
  }

  // Build ordered 12-month bar list
  const monthlyTotals: { month: string; count: number; byCat: Record<Category, number> }[] = [];
  const mCursor = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
  const mEnd = new Date(endDate.getFullYear(), endDate.getMonth(), 1);
  while (mCursor <= mEnd) {
    const ym = `${mCursor.getFullYear()}-${String(mCursor.getMonth() + 1).padStart(2, '0')}`;
    const entry = monthlyMap.get(ym) || {
      count: 0,
      byCat: { 电影: 0, 读书: 0, 游戏: 0, 音乐: 0 },
    };
    monthlyTotals.push({ month: ym, ...entry });
    mCursor.setMonth(mCursor.getMonth() + 1);
  }

  return {
    weeks,
    monthLabels,
    totalCount,
    activeDays,
    longestStreak,
    busiestDay,
    monthlyTotals,
  };
}

// ==========================================
// Module 2: Taste Evolution Timeline
// ==========================================

export interface YearlyEvolution {
  year: number;
  total: number;
  doneCount: number;
  avgRating: number;
  byCategory: Record<Category, number>;
  dominantCategory: Category;
  fiveStarHighlights: DoubanRecord[];
  roastHighlights: DoubanRecord[];
  commentedItems: DoubanRecord[];
  peakMonth: string | null;
}

export function computeYearlyEvolution(records: DoubanRecord[]): YearlyEvolution[] {
  const byYear = new Map<number, DoubanRecord[]>();
  for (const r of records) {
    if (!r.year) continue;
    const arr = byYear.get(r.year) || [];
    arr.push(r);
    byYear.set(r.year, arr);
  }

  const years = Array.from(byYear.keys()).sort((a, b) => b - a);

  return years.map((year) => {
    const list = byYear.get(year)!;
    const byCategory: Record<Category, number> = { 电影: 0, 读书: 0, 游戏: 0, 音乐: 0 };
    const monthCount = new Map<string, number>();
    let ratingSum = 0;
    let rated = 0;
    let doneCount = 0;

    for (const r of list) {
      byCategory[r.category] += 1;
      if (r.statusGroup === 'done') doneCount += 1;
      if (r.rating !== null) {
        ratingSum += r.rating;
        rated += 1;
      }
      if (r.date) {
        const m = r.date.slice(5, 7);
        monthCount.set(m, (monthCount.get(m) || 0) + 1);
      }
    }

    const dominantCategory = ALL_CATEGORIES.reduce((best, cur) =>
      byCategory[cur] > byCategory[best] ? cur : best
    );

    const fiveStarHighlights = list
      .filter((r) => r.rating === 5)
      .sort((a, b) => {
        const cDiff = (b.comment ? 1 : 0) - (a.comment ? 1 : 0);
        if (cDiff !== 0) return cDiff;
        return (b.date || '').localeCompare(a.date || '');
      });

    const roastHighlights = list
      .filter((r) => r.rating !== null && r.rating <= 2)
      .sort((a, b) => {
        const cDiff = (b.comment ? 1 : 0) - (a.comment ? 1 : 0);
        if (cDiff !== 0) return cDiff;
        return (a.rating || 5) - (b.rating || 5);
      });

    const commentedItems = list
      .filter((r) => r.comment.length > 0)
      .sort((a, b) => b.comment.length - a.comment.length);

    let peakMonth: string | null = null;
    let maxM = 0;
    for (const [m, c] of monthCount.entries()) {
      if (c > maxM) {
        maxM = c;
        peakMonth = `${Number(m)}月 (${c}条)`;
      }
    }

    return {
      year,
      total: list.length,
      doneCount,
      avgRating: rated > 0 ? Number((ratingSum / rated).toFixed(2)) : 0,
      byCategory,
      dominantCategory,
      fiveStarHighlights,
      roastHighlights,
      commentedItems,
      peakMonth,
    };
  });
}

// ==========================================
// Module 3: 5★ Favorites vs 1-2★ Roast Wall
// ==========================================

export interface RedBlackWallData {
  favorites: DoubanRecord[];
  roasts: DoubanRecord[];
  favoriteQuotes: DoubanRecord[];
  roastQuotes: DoubanRecord[];
  localTraits: string[];
}

export function computeRedBlackWall(
  records: DoubanRecord[],
  categoryFilter: Category | '全部'
): RedBlackWallData {
  const pool =
    categoryFilter === '全部'
      ? records
      : records.filter((r) => r.category === categoryFilter);

  const favorites = pool
    .filter((r) => r.rating === 5)
    .sort((a, b) => {
      const lenDiff = (b.comment.length > 0 ? 1 : 0) - (a.comment.length > 0 ? 1 : 0);
      if (lenDiff !== 0) return lenDiff;
      return (b.date || '').localeCompare(a.date || '');
    });

  const roasts = pool
    .filter((r) => r.rating !== null && r.rating <= 2)
    .sort((a, b) => {
      const cDiff = (b.comment.length > 0 ? 1 : 0) - (a.comment.length > 0 ? 1 : 0);
      if (cDiff !== 0) return cDiff;
      const rDiff = (a.rating || 2) - (b.rating || 2);
      if (rDiff !== 0) return rDiff;
      return (b.date || '').localeCompare(a.date || '');
    });

  const stats = computeOverviewStats(records);
  const localTraits: string[] = [];

  if (stats.strictestCategory && stats.strictestCategory.avgRating < 3.95) {
    localTraits.push(`对${stats.strictestCategory.category}打分最严苛（均分 ${stats.strictestCategory.avgRating}）`);
  }
  if (stats.generousCategory && stats.generousCategory.avgRating >= 4.2) {
    localTraits.push(`${stats.generousCategory.category}均分最高（${stats.generousCategory.avgRating}★）`);
  }
  if (stats.starCounts[2] < stats.starCounts[0] + stats.starCounts[1] && stats.ratedCount > 20) {
    localTraits.push('爱憎分明：几乎不打敷衍三星');
  } else if (stats.fiveStarRatio >= 40) {
    localTraits.push(`偏爱鲜明：5★ 占比达 ${stats.fiveStarRatio}%`);
  }
  const wishCount = records.filter((r) => r.statusGroup === 'wish').length;
  if (wishCount >= 80) {
    localTraits.push(`屯书如山倒，看书如抽丝（愿望单 ${wishCount} 项）`);
  }
  const doingCount = records.filter((r) => r.statusGroup === 'doing').length;
  if (doingCount >= 20) {
    localTraits.push(`多线程对照阅读/观看（同时在看/在读 ${doingCount} 项）`);
  }

  return {
    favorites,
    roasts,
    favoriteQuotes: favorites.filter((r) => r.comment.length > 0),
    roastQuotes: roasts.filter((r) => r.comment.length > 0),
    localTraits,
  };
}

// ==========================================
// Module 4: Wishlist Gacha Pool
// ==========================================

export type DustAgeFilter = 'all' | 'over1y' | 'over2y' | 'recent';

export interface WishlistCandidate extends DoubanRecord {
  dustDays: number | null;
}

export function computeWishlistPool(
  records: DoubanRecord[],
  options: {
    categories: Category[];
    includeDoing: boolean;
    dustAge: DustAgeFilter;
  }
): WishlistCandidate[] {
  const refDate = records.reduce<string>(
    (max, r) => (r.date && r.date > max ? r.date : max),
    new Date().toISOString().slice(0, 10)
  );
  const refMs = new Date(`${refDate}T00:00:00`).getTime();

  return records
    .filter((r) => {
      if (!options.categories.includes(r.category)) return false;
      if (r.statusGroup === 'wish') return true;
      if (options.includeDoing && r.statusGroup === 'doing') return true;
      return false;
    })
    .map((r) => {
      let dustDays: number | null = null;
      if (r.date) {
        const ms = new Date(`${r.date}T00:00:00`).getTime();
        dustDays = Math.max(0, Math.round((refMs - ms) / 86400000));
      }
      return { ...r, dustDays };
    })
    .filter((r) => {
      if (options.dustAge === 'all') return true;
      if (r.dustDays === null) return false;
      if (options.dustAge === 'over1y') return r.dustDays >= 365;
      if (options.dustAge === 'over2y') return r.dustDays >= 730;
      if (options.dustAge === 'recent') return r.dustDays <= 180;
      return true;
    });
}

// ==========================================
// Module 5: Dual-User Taste Clash
// ==========================================

export interface ClashPair {
  id: string;
  category: Category;
  title: string;
  shortTitle: string;
  url: string;
  a: DoubanRecord;
  b: DoubanRecord;
  ratingDiff: number | null; // |a.rating - b.rating|
}

export interface MutualRecItem {
  record: DoubanRecord;
  alreadyInTargetWish: boolean;
}

export interface TasteClashResult {
  userAName: string;
  userBName: string;
  compatibilityScore: number; // 0..100
  tierLabel: string;
  tierDesc: string;
  sharedTotal: number;
  sharedRatedCount: number;
  avgRatingDiff: number;
  sharedFavorites: ClashPair[];        // Both rated >= 4 (5★ + 5★ sorted first)
  spicyDisagreements: ClashPair[];     // |a - b| >= 2
  sharedWishlist: ClashPair[];         // Both in wish/doing
  aRecommendsToB: MutualRecItem[];     // A rated 5★, B not done/doing
  bRecommendsToA: MutualRecItem[];     // B rated 5★, A not done/doing
  categoryOverlap: { category: Category; shared: number; aTotal: number; bTotal: number }[];
}

function dedupeByCanonicalId(records: DoubanRecord[]): Map<string, DoubanRecord> {
  const priority = { done: 3, doing: 2, wish: 1 };
  const map = new Map<string, DoubanRecord>();
  for (const r of records) {
    const existing = map.get(r.id);
    if (!existing) {
      map.set(r.id, r);
    } else if (priority[r.statusGroup] > priority[existing.statusGroup]) {
      map.set(r.id, r);
    } else if (
      priority[r.statusGroup] === priority[existing.statusGroup] &&
      (r.rating ?? 0) > (existing.rating ?? 0)
    ) {
      map.set(r.id, r);
    }
  }
  return map;
}

export function computeTasteClash(userA: UserDataset, userB: UserDataset): TasteClashResult {
  const mapA = dedupeByCanonicalId(userA.records);
  const mapB = dedupeByCanonicalId(userB.records);

  const sharedPairs: ClashPair[] = [];
  for (const [id, a] of mapA.entries()) {
    const b = mapB.get(id);
    if (!b) continue;
    const ratingDiff =
      a.rating !== null && b.rating !== null ? Math.abs(a.rating - b.rating) : null;
    sharedPairs.push({
      id,
      category: a.category,
      title: a.title.length >= b.title.length ? a.title : b.title,
      shortTitle: a.shortTitle,
      url: a.url || b.url,
      a,
      b,
      ratingDiff,
    });
  }

  const sharedRated = sharedPairs.filter((p) => p.ratingDiff !== null);
  const avgRatingDiff =
    sharedRated.length > 0
      ? Number(
          (
            sharedRated.reduce((acc, p) => acc + (p.ratingDiff ?? 0), 0) / sharedRated.length
          ).toFixed(2)
        )
      : 0;

  const sharedFavorites = sharedRated
    .filter((p) => (p.a.rating ?? 0) >= 4 && (p.b.rating ?? 0) >= 4)
    .sort((x, y) => {
      const sumDiff = (y.a.rating! + y.b.rating!) - (x.a.rating! + x.b.rating!);
      if (sumDiff !== 0) return sumDiff;
      const cDiff = (y.a.comment || y.b.comment ? 1 : 0) - (x.a.comment || x.b.comment ? 1 : 0);
      return cDiff;
    });

  const spicyDisagreements = sharedRated
    .filter((p) => (p.ratingDiff ?? 0) >= 2)
    .sort((x, y) => {
      const gapDiff = (y.ratingDiff ?? 0) - (x.ratingDiff ?? 0);
      if (gapDiff !== 0) return gapDiff;
      const bothComment =
        (y.a.comment && y.b.comment ? 2 : y.a.comment || y.b.comment ? 1 : 0) -
        (x.a.comment && x.b.comment ? 2 : x.a.comment || x.b.comment ? 1 : 0);
      return bothComment;
    });

  const sharedWishlist = sharedPairs.filter(
    (p) => p.a.statusGroup !== 'done' && p.b.statusGroup !== 'done'
  );

  const aRecommendsToB: MutualRecItem[] = [];
  for (const [id, a] of mapA.entries()) {
    if (a.rating === 5) {
      const b = mapB.get(id);
      if (!b || b.statusGroup === 'wish') {
        aRecommendsToB.push({
          record: a,
          alreadyInTargetWish: b?.statusGroup === 'wish',
        });
      }
    }
  }
  aRecommendsToB.sort((x, y) => {
    const wishDiff = (y.alreadyInTargetWish ? 1 : 0) - (x.alreadyInTargetWish ? 1 : 0);
    if (wishDiff !== 0) return wishDiff;
    return (y.record.comment ? 1 : 0) - (x.record.comment ? 1 : 0);
  });

  const bRecommendsToA: MutualRecItem[] = [];
  for (const [id, b] of mapB.entries()) {
    if (b.rating === 5) {
      const a = mapA.get(id);
      if (!a || a.statusGroup === 'wish') {
        bRecommendsToA.push({
          record: b,
          alreadyInTargetWish: a?.statusGroup === 'wish',
        });
      }
    }
  }
  bRecommendsToA.sort((x, y) => {
    const wishDiff = (y.alreadyInTargetWish ? 1 : 0) - (x.alreadyInTargetWish ? 1 : 0);
    if (wishDiff !== 0) return wishDiff;
    return (y.record.comment ? 1 : 0) - (x.record.comment ? 1 : 0);
  });

  // Compatibility score calculation (0 - 100)
  let compatibilityScore = 50;
  if (sharedRated.length > 0) {
    const proximity = Math.max(0, 1 - avgRatingDiff / 3.2); // 0..1
    const agreeRate =
      sharedRated.filter((p) => (p.ratingDiff ?? 4) <= 1).length / sharedRated.length;
    const overlapBonus = Math.min(12, Math.log2(sharedPairs.length + 1) * 2.2);
    compatibilityScore = Math.round(
      Math.max(12, Math.min(99, proximity * 52 + agreeRate * 38 + overlapBonus))
    );
  } else if (sharedPairs.length > 0) {
    compatibilityScore = Math.min(75, 45 + sharedPairs.length * 2);
  } else {
    compatibilityScore = 18;
  }

  let tierLabel = '交集较少，各有领域';
  let tierDesc = '两人的共同标记不多，彼此的 5★ 列表里藏着对方尚未涉足的片单与书目。';
  if (compatibilityScore >= 86) {
    tierLabel = '高度相近';
    tierDesc = '评分标准与题材取向高度一致，互相推荐的命中率很高。';
  } else if (compatibilityScore >= 72) {
    tierLabel = '大体合拍，偶有分歧';
    tierDesc = '大方向很接近，在少数作品上有不同看法，适合看完后互相交换意见。';
  } else if (compatibilityScore >= 54) {
    tierLabel = '各有侧重，互有反差';
    tierDesc = '既有共同认可的高分作品，也在不少热门条目上给出了截然不同的评价。';
  } else if (sharedPairs.length > 0) {
    tierLabel = '取向迥异';
    tierDesc = '面对同一批作品往往关注不同侧面，评分差距较大，互看短评很有对照趣味。';
  }

  const categoryOverlap = ALL_CATEGORIES.map((category) => ({
    category,
    shared: sharedPairs.filter((p) => p.category === category).length,
    aTotal: userA.records.filter((r) => r.category === category).length,
    bTotal: userB.records.filter((r) => r.category === category).length,
  }));

  return {
    userAName: userA.name,
    userBName: userB.name,
    compatibilityScore,
    tierLabel,
    tierDesc,
    sharedTotal: sharedPairs.length,
    sharedRatedCount: sharedRated.length,
    avgRatingDiff,
    sharedFavorites,
    spicyDisagreements,
    sharedWishlist,
    aRecommendsToB,
    bRecommendsToA,
    categoryOverlap,
  };
}

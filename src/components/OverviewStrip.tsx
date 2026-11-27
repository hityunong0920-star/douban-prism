import type { OverviewStats } from '../utils/analytics';
import { CAT_BAR_COLORS, CategoryIcon } from './CategoryBadge';

export function OverviewStrip({ stats }: { stats: OverviewStats }) {
  const maxStar = Math.max(1, ...stats.starCounts);

  return (
    <section className="grid grid-cols-1 lg:grid-cols-12 gap-4">
      {/* KPI Bento */}
      <div className="lg:col-span-5 grid grid-cols-2 gap-3">
        <div className="card-surface rounded-2xl p-4 flex flex-col justify-between">
          <span className="text-xs text-[var(--text-muted)]">全部标记</span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="font-mono-num text-2xl sm:text-3xl font-bold text-[var(--text-primary)]">
              {stats.total.toLocaleString()}
            </span>
            <span className="text-xs text-[var(--text-secondary)]">条</span>
          </div>
          <span className="mt-1 text-[11px] text-[var(--text-muted)] font-mono-num">
            {stats.minDate ? `${stats.minDate.slice(0, 7)} ~ ${stats.maxDate?.slice(0, 7)}` : '无日期跨度'}
          </span>
        </div>

        <div className="card-surface rounded-2xl p-4 flex flex-col justify-between">
          <span className="text-xs text-[var(--text-muted)]">综合平均分</span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="font-mono-num text-2xl sm:text-3xl font-bold text-[var(--gold)]">
              {stats.avgRating.toFixed(2)}
            </span>
            <span className="text-xs text-[var(--text-secondary)]">/ 5.0</span>
          </div>
          <span className="mt-1 text-[11px] text-[var(--text-muted)]">
            已评分 <span className="font-mono-num">{stats.ratedCount}</span> · 含短评{' '}
            <span className="font-mono-num">{stats.commentCount}</span>
          </span>
        </div>

        <div className="card-surface rounded-2xl p-4 flex flex-col justify-between">
          <span className="text-xs text-[var(--text-muted)]">5★ 占比</span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="font-mono-num text-2xl font-bold text-[var(--accent)]">
              {stats.fiveStarRatio}%
            </span>
            <span className="text-xs text-[var(--text-secondary)] font-mono-num">
              ({stats.starCounts[4]} 条)
            </span>
          </div>
          <span className="mt-1 text-[11px] text-[var(--text-muted)] truncate">
            {stats.generousCategory
              ? `均分最高：${stats.generousCategory.category} (${stats.generousCategory.avgRating}★)`
              : '—'}
          </span>
        </div>

        <div className="card-surface rounded-2xl p-4 flex flex-col justify-between">
          <span className="text-xs text-[var(--text-muted)]">1–2★ 评分</span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="font-mono-num text-2xl font-bold text-[var(--crimson)]">
              {stats.starCounts[0] + stats.starCounts[1]}
            </span>
            <span className="text-xs text-[var(--text-secondary)]">
              条 ({stats.harshRatio}%)
            </span>
          </div>
          <span className="mt-1 text-[11px] text-[var(--text-muted)] truncate">
            {stats.strictestCategory
              ? `打分最严格：${stats.strictestCategory.category} (${stats.strictestCategory.avgRating}★)`
              : '—'}
          </span>
        </div>
      </div>

      {/* Category Breakdown */}
      <div className="lg:col-span-4 card-surface rounded-2xl p-4 flex flex-col justify-between">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
            四维品类分布
          </h3>
          <span className="text-[11px] text-[var(--text-muted)]">总量 · 均分</span>
        </div>
        <div className="space-y-3">
          {stats.categories.map((c) => {
            const pct = stats.total > 0 ? Math.round((c.total / stats.total) * 100) : 0;
            return (
              <div key={c.category} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="inline-flex items-center gap-1.5 font-medium text-[var(--text-primary)]">
                    <CategoryIcon category={c.category} className="w-3.5 h-3.5 text-[var(--text-secondary)]" />
                    {c.category}
                    <span className="text-[11px] text-[var(--text-muted)] font-normal">
                      (已{c.done} / 在{c.doing} / 想{c.wish})
                    </span>
                  </span>
                  <span className="font-mono-num text-[var(--text-secondary)]">
                    <strong className="text-[var(--text-primary)]">{c.total}</strong> ·{' '}
                    {c.rated > 0 ? `${c.avgRating}★` : '—'}
                  </span>
                </div>
                <div className="h-2 rounded-full bg-[var(--bg-subtle)] overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${CAT_BAR_COLORS[c.category]}`}
                    style={{ width: `${Math.max(pct, c.total > 0 ? 3 : 0)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Star Rating Distribution */}
      <div className="lg:col-span-3 card-surface rounded-2xl p-4 flex flex-col justify-between">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
            星级分布
          </h3>
          <span className="text-[11px] text-[var(--text-muted)] font-mono-num">1★ → 5★</span>
        </div>
        <div className="flex items-end justify-between gap-2 h-28 pt-2">
          {[1, 2, 3, 4, 5].map((star, idx) => {
            const count = stats.starCounts[idx];
            const heightPct = Math.round((count / maxStar) * 100);
            const barColor =
              star >= 4
                ? 'bg-[var(--gold)]'
                : star <= 2
                  ? 'bg-[var(--crimson)]'
                  : 'bg-[var(--text-muted)]/60';
            return (
              <div key={star} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                <span className="text-[10px] font-mono-num text-[var(--text-muted)]">{count}</span>
                <div className="w-full bg-[var(--bg-subtle)] rounded-lg h-20 flex items-end overflow-hidden p-0.5">
                  <div
                    className={`w-full rounded-md transition-all ${barColor}`}
                    style={{ height: `${Math.max(heightPct, count > 0 ? 8 : 0)}%` }}
                  />
                </div>
                <span className="text-xs font-mono-num text-[var(--text-secondary)]">{star}★</span>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

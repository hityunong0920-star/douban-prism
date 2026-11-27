import { useMemo, useState } from 'react';
import { CalendarDays, ExternalLink, Flame, Sparkles, Trophy } from 'lucide-react';
import type { Category, DoubanRecord } from '../types/douban';
import { ALL_CATEGORIES, computeHeatmap, type HeatmapDayCell } from '../utils/analytics';
import { CAT_BAR_COLORS, CategoryBadge, StarDisplay } from './CategoryBadge';

interface HeatmapViewProps {
  records: DoubanRecord[];
  years: number[];
}

const HEAT_VAR: Record<0 | 1 | 2 | 3 | 4, string> = {
  0: 'var(--heat-0)',
  1: 'var(--heat-1)',
  2: 'var(--heat-2)',
  3: 'var(--heat-3)',
  4: 'var(--heat-4)',
};

export function HeatmapView({ records, years }: HeatmapViewProps) {
  const [selectedYear, setSelectedYear] = useState<number | 'recent'>('recent');
  const [category, setCategory] = useState<Category | '全部'>('全部');
  const [hoveredCell, setHoveredCell] = useState<HeatmapDayCell | null>(null);
  const [selectedDay, setSelectedDay] = useState<HeatmapDayCell | null>(null);

  const heatmap = useMemo(
    () => computeHeatmap(records, selectedYear, category),
    [records, selectedYear, category]
  );

  const maxMonthly = useMemo(
    () => Math.max(1, ...heatmap.monthlyTotals.map((m) => m.count)),
    [heatmap.monthlyTotals]
  );

  const activeDay = selectedDay ?? (heatmap.busiestDay ? {
    date: heatmap.busiestDay.date,
    count: heatmap.busiestDay.count,
    level: 4 as const,
    items: heatmap.busiestDay.items,
    inRange: true,
  } : null);

  return (
    <div className="space-y-6">
      {/* Filter Header */}
      <div className="card-surface rounded-3xl p-5 sm:p-6 space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="font-serif-editorial text-xl sm:text-2xl font-bold text-[var(--text-primary)] flex items-center gap-2">
              <CalendarDays className="w-5 h-5 text-[var(--accent)]" />
              文化摄入热力图
            </h2>
            <p className="text-xs text-[var(--text-secondary)] mt-1">
              点击任意绿色格子，查看当天的全部书影音游标记明细与短评
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Category filter */}
            <div className="inline-flex items-center p-1 rounded-xl bg-[var(--bg-subtle)]">
              {(['全部', ...ALL_CATEGORIES] as const).map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => {
                    setCategory(cat);
                    setSelectedDay(null);
                  }}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition cursor-pointer ${
                    category === cat
                      ? 'bg-[var(--bg-card)] text-[var(--text-primary)] shadow-xs'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Year Selector */}
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => {
              setSelectedYear('recent');
              setSelectedDay(null);
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition cursor-pointer ${
              selectedYear === 'recent'
                ? 'bg-[var(--accent)] text-white border-transparent'
                : 'bg-[var(--bg-subtle)] border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            最近 365 天
          </button>
          {years.map((y) => (
            <button
              key={y}
              type="button"
              onClick={() => {
                setSelectedYear(y);
                setSelectedDay(null);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono-num font-medium border transition cursor-pointer ${
                selectedYear === y
                  ? 'bg-[var(--accent)] text-white border-transparent'
                  : 'bg-[var(--bg-subtle)] border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              {y}
            </button>
          ))}
        </div>

        {/* Summary Metrics Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="subtle-surface rounded-2xl px-4 py-3">
            <div className="text-[11px] text-[var(--text-muted)]">期间总标记</div>
            <div className="font-mono-num text-xl font-bold text-[var(--text-primary)] mt-0.5">
              {heatmap.totalCount}
            </div>
          </div>
          <div className="subtle-surface rounded-2xl px-4 py-3">
            <div className="text-[11px] text-[var(--text-muted)]">活跃标记天数</div>
            <div className="font-mono-num text-xl font-bold text-[var(--accent)] mt-0.5">
              {heatmap.activeDays} <span className="text-xs font-normal text-[var(--text-muted)]">天</span>
            </div>
          </div>
          <div className="subtle-surface rounded-2xl px-4 py-3">
            <div className="text-[11px] text-[var(--text-muted)] flex items-center gap-1">
              <Flame className="w-3 h-3 text-[var(--gold)]" /> 最长连续记录
            </div>
            <div className="font-mono-num text-xl font-bold text-[var(--gold)] mt-0.5">
              {heatmap.longestStreak} <span className="text-xs font-normal text-[var(--text-muted)]">天</span>
            </div>
          </div>
          <div className="subtle-surface rounded-2xl px-4 py-3">
            <div className="text-[11px] text-[var(--text-muted)] flex items-center gap-1">
              <Trophy className="w-3 h-3 text-[var(--accent)]" /> 单日记录峰值
            </div>
            <div className="font-mono-num text-sm sm:text-base font-bold text-[var(--text-primary)] mt-1 truncate">
              {heatmap.busiestDay
                ? `${heatmap.busiestDay.date} (${heatmap.busiestDay.count}条)`
                : '暂无记录'}
            </div>
          </div>
        </div>

        {/* GitHub-Style Grid */}
        <div className="overflow-x-auto pb-2">
          <div className="inline-block min-w-full">
            {/* Month Labels */}
            <div className="flex items-center pl-8 mb-1.5 relative h-4">
              {heatmap.monthLabels.map((m, idx) => (
                <span
                  key={`${m.weekIndex}-${idx}`}
                  className="text-[10px] text-[var(--text-muted)] absolute"
                  style={{ left: `${32 + m.weekIndex * 15}px` }}
                >
                  {m.label}
                </span>
              ))}
            </div>

            <div className="flex gap-1.5">
              {/* Weekday labels */}
              <div className="flex flex-col justify-between py-[2px] pr-1 text-[10px] text-[var(--text-muted)] select-none h-[102px]">
                <span>日</span>
                <span>二</span>
                <span>四</span>
                <span>六</span>
              </div>

              {/* Weeks columns */}
              <div className="flex gap-[3px]">
                {heatmap.weeks.map((week, wi) => (
                  <div key={wi} className="flex flex-col gap-[3px]">
                    {week.map((cell) => {
                      const isSelected = activeDay?.date === cell.date;
                      return (
                        <button
                          key={cell.date}
                          type="button"
                          disabled={!cell.inRange}
                          onMouseEnter={() => cell.inRange && setHoveredCell(cell)}
                          onMouseLeave={() => setHoveredCell(null)}
                          onClick={() => cell.inRange && cell.count > 0 && setSelectedDay(cell)}
                          className={`w-[12px] h-[12px] rounded-[3px] transition-transform ${
                            !cell.inRange
                              ? 'opacity-0 pointer-events-none'
                              : cell.count > 0
                                ? 'cursor-pointer hover:scale-125'
                                : 'cursor-default'
                          } ${isSelected ? 'ring-2 ring-[var(--gold)] ring-offset-1 ring-offset-[var(--bg-card)]' : ''}`}
                          style={{ backgroundColor: HEAT_VAR[cell.level] }}
                          title={
                            cell.inRange
                              ? `${cell.date} · ${cell.count} 条记录`
                              : undefined
                          }
                        />
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>

            {/* Footer status + legend */}
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-[var(--text-muted)]">
              <div className="h-5 flex items-center">
                {hoveredCell ? (
                  <span className="font-mono-num text-[var(--text-primary)]">
                    {hoveredCell.date}：共标记 <strong>{hoveredCell.count}</strong> 条
                    {hoveredCell.count > 0 &&
                      `（${hoveredCell.items
                        .slice(0, 2)
                        .map((i) => `《${i.shortTitle}》`)
                        .join('、')}${hoveredCell.count > 2 ? ' 等' : ''}）`}
                  </span>
                ) : (
                  <span>悬停预览日期 · 点击彩色方块展开当日详情</span>
                )}
              </div>
              <div className="flex items-center gap-1.5 text-[11px]">
                <span>少</span>
                {([0, 1, 2, 3, 4] as const).map((lvl) => (
                  <span
                    key={lvl}
                    className="w-3 h-3 rounded-[3px] inline-block"
                    style={{ backgroundColor: HEAT_VAR[lvl] }}
                  />
                ))}
                <span>多</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Split: Monthly Rhythm Chart + Day Detail Drawer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Monthly Stacked Bars */}
        <div className="lg:col-span-7 card-surface rounded-3xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-serif-editorial font-bold text-base text-[var(--text-primary)]">
              月度摄入节奏
            </h3>
            <div className="flex items-center gap-3 text-[11px] text-[var(--text-muted)]">
              {ALL_CATEGORIES.map((c) => (
                <span key={c} className="inline-flex items-center gap-1">
                  <span className={`w-2 h-2 rounded-full ${CAT_BAR_COLORS[c]}`} />
                  {c}
                </span>
              ))}
            </div>
          </div>

          <div className="flex items-end gap-2 h-44 pt-4">
            {heatmap.monthlyTotals.map((m) => {
              const totalPct = Math.round((m.count / maxMonthly) * 100);
              return (
                <div
                  key={m.month}
                  className="flex-1 flex flex-col items-center justify-end h-full gap-1.5 group"
                >
                  <span className="text-[10px] font-mono-num text-[var(--text-muted)] group-hover:text-[var(--text-primary)]">
                    {m.count > 0 ? m.count : ''}
                  </span>
                  <div className="w-full max-w-[28px] h-32 rounded-lg bg-[var(--bg-subtle)] flex flex-col justify-end overflow-hidden p-0.5">
                    <div
                      className="w-full flex flex-col-reverse rounded-md overflow-hidden transition-all"
                      style={{ height: `${Math.max(totalPct, m.count > 0 ? 6 : 0)}%` }}
                    >
                      {ALL_CATEGORIES.map((cat) => {
                        const cCount = m.byCat[cat];
                        if (cCount === 0) return null;
                        const subPct = (cCount / m.count) * 100;
                        return (
                          <div
                            key={cat}
                            className={CAT_BAR_COLORS[cat]}
                            style={{ height: `${subPct}%` }}
                            title={`${m.month} ${cat}: ${cCount}条`}
                          />
                        );
                      })}
                    </div>
                  </div>
                  <span className="text-[10px] font-mono-num text-[var(--text-muted)]">
                    {Number(m.month.slice(5))}月
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Day Details */}
        <div className="lg:col-span-5 card-surface rounded-3xl p-5 flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-serif-editorial font-bold text-base text-[var(--text-primary)] flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-[var(--gold)]" />
              {selectedDay ? `${selectedDay.date} 标记明细` : '单日记录峰值日'}
            </h3>
            {activeDay && (
              <span className="text-xs font-mono-num px-2.5 py-0.5 rounded-full bg-[var(--accent-soft)] text-[var(--accent-text)]">
                {activeDay.date} · {activeDay.count} 条
              </span>
            )}
          </div>

          {activeDay && activeDay.items.length > 0 ? (
            <div className="space-y-2.5 overflow-y-auto max-h-60 pr-1">
              {activeDay.items.map((item, idx) => (
                <div
                  key={`${item.id}-${idx}`}
                  className="subtle-surface rounded-2xl p-3 space-y-1.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <CategoryBadge category={item.category} />
                      <span className="text-[11px] text-[var(--text-muted)]">{item.status}</span>
                    </div>
                    <StarDisplay rating={item.rating} size="xs" />
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold text-[var(--text-primary)]">
                      {item.shortTitle}
                    </span>
                    {item.url && (
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[var(--text-muted)] hover:text-[var(--accent)] shrink-0"
                        title="在豆瓣查看"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                  {item.comment && (
                    <p className="text-xs text-[var(--text-secondary)] italic leading-relaxed">
                      “{item.comment}”
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-xs text-[var(--text-muted)] py-10">
              该时段暂无带日期的记录
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

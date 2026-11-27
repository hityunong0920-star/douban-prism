import { useMemo, useState } from 'react';
import { ArrowUpDown, ExternalLink, MessageSquareQuote, Sparkles, Star } from 'lucide-react';
import type { AiConfig, AiTimelineResult, UserDataset } from '../types/douban';
import { ALL_CATEGORIES, computeYearlyEvolution } from '../utils/analytics';
import { buildTimelinePrompt } from '../utils/ai';
import { AiActionBridge } from './AiActionBridge';
import { CAT_BAR_COLORS, CategoryBadge, StarDisplay } from './CategoryBadge';

interface TimelineViewProps {
  dataset: UserDataset;
  aiConfig: AiConfig;
  aiResult: AiTimelineResult | null;
  onAiResult: (res: AiTimelineResult) => void;
  onOpenAiSettings: () => void;
}

export function TimelineView({
  dataset,
  aiConfig,
  aiResult,
  onAiResult,
  onOpenAiSettings,
}: TimelineViewProps) {
  const [ascending, setAscending] = useState(false);

  const yearly = useMemo(() => {
    const raw = computeYearlyEvolution(dataset.records);
    return ascending ? [...raw].reverse() : raw;
  }, [dataset.records, ascending]);

  const aiPeriodMap = useMemo(() => {
    const map = new Map<string, AiTimelineResult['periods'][number]>();
    if (aiResult?.periods) {
      for (const p of aiResult.periods) {
        map.set(String(p.year), p);
      }
    }
    return map;
  }, [aiResult]);

  return (
    <div className="space-y-6">
      {/* Header + AI Bridge */}
      <div className="card-surface rounded-3xl p-5 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="font-serif-editorial text-xl sm:text-2xl font-bold text-[var(--text-primary)] flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[var(--accent)]" />
              品味演进时间线 · Taste Evolution
            </h2>
            <p className="text-xs text-[var(--text-secondary)] mt-1">
              按年份切片回顾书影音游重心的迁徙，保留当年 5★ 精选与真实短评摘录
            </p>
          </div>
          <button
            type="button"
            onClick={() => setAscending((v) => !v)}
            className="self-start sm:self-auto inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-[var(--bg-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer"
          >
            <ArrowUpDown className="w-3.5 h-3.5" />
            {ascending ? '时间正序（早 → 晚）' : '时间倒序（新 → 旧）'}
          </button>
        </div>

        <AiActionBridge<AiTimelineResult>
          aiConfig={aiConfig}
          buttonLabel="生成品味编年史"
          description="按年份梳理阅读、观影与听歌重心的变化脉络，概括各阶段标题与转向。"
          buildPrompt={() => buildTimelinePrompt(dataset)}
          onResult={onAiResult}
          onOpenSettings={onOpenAiSettings}
        />

        {aiResult?.overallArc && (
          <div className="rounded-2xl p-4 bg-[var(--accent-soft)]/70 border border-[var(--accent)]/25 space-y-1.5">
            <div className="text-xs font-semibold text-[var(--accent-text)] uppercase tracking-wider">
              AI 脉络总览
            </div>
            <p className="font-serif-editorial text-sm sm:text-base text-[var(--text-primary)] leading-relaxed">
              {aiResult.overallArc}
            </p>
          </div>
        )}
      </div>

      {/* Vertical Timeline */}
      {yearly.length === 0 ? (
        <div className="card-surface rounded-3xl p-10 text-center text-sm text-[var(--text-muted)]">
          当前数据未包含有效的「标记日期」，无法生成年度时间线。
        </div>
      ) : (
        <div className="relative pl-4 sm:pl-8 space-y-6 before:content-[''] before:absolute before:left-[15px] sm:before:left-[31px] before:top-4 before:bottom-4 before:w-[2px] before:bg-[var(--border-subtle)]">
          {yearly.map((y) => {
            const aiPeriod = aiPeriodMap.get(String(y.year));
            const topComments = y.commentedItems.slice(0, 3);
            const topFiveStars = y.fiveStarHighlights.slice(0, 8);

            return (
              <article key={y.year} className="relative pl-6 sm:pl-8">
                {/* Timeline Dot */}
                <div className="absolute left-[-5px] sm:left-[-5px] top-6 w-3 h-3 rounded-full bg-[var(--accent)] ring-4 ring-[var(--bg-page)]" />

                <div className="card-surface rounded-3xl p-5 sm:p-6 space-y-4">
                  {/* Year Header */}
                  <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 border-b border-[var(--border-subtle)] pb-3.5">
                    <div className="flex flex-wrap items-baseline gap-2.5">
                      <span className="font-mono-num text-2xl sm:text-3xl font-black text-[var(--text-primary)]">
                        {y.year}
                      </span>
                      {aiPeriod?.eraTitle && (
                        <span className="font-serif-editorial text-base sm:text-lg font-bold text-[var(--accent)]">
                          「{aiPeriod.eraTitle}」
                        </span>
                      )}
                      <span className="text-xs px-2.5 py-0.5 rounded-full bg-[var(--bg-subtle)] text-[var(--text-secondary)]">
                        主阵地：{y.dominantCategory}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-xs font-mono-num text-[var(--text-secondary)]">
                      <span>
                        共 <strong className="text-[var(--text-primary)]">{y.total}</strong> 条
                      </span>
                      <span>
                        均分 <strong className="text-[var(--gold)]">{y.avgRating || '—'}</strong>
                      </span>
                      {y.peakMonth && <span>峰值 {y.peakMonth}</span>}
                    </div>
                  </div>

                  {/* Category Stacked Proportion Bar */}
                  <div className="space-y-1.5">
                    <div className="h-2.5 rounded-full overflow-hidden flex bg-[var(--bg-subtle)]">
                      {ALL_CATEGORIES.map((cat) => {
                        const count = y.byCategory[cat];
                        if (count === 0) return null;
                        const pct = (count / y.total) * 100;
                        return (
                          <div
                            key={cat}
                            className={CAT_BAR_COLORS[cat]}
                            style={{ width: `${pct}%` }}
                            title={`${cat}: ${count}条 (${Math.round(pct)}%)`}
                          />
                        );
                      })}
                    </div>
                    <div className="flex flex-wrap gap-3 text-[11px] text-[var(--text-muted)]">
                      {ALL_CATEGORIES.map((cat) =>
                        y.byCategory[cat] > 0 ? (
                          <span key={cat} className="inline-flex items-center gap-1 font-mono-num">
                            <span className={`w-2 h-2 rounded-full ${CAT_BAR_COLORS[cat]}`} />
                            {cat} {y.byCategory[cat]}
                          </span>
                        ) : null
                      )}
                    </div>
                  </div>

                  {/* AI Year Summary */}
                  {aiPeriod && (
                    <div className="subtle-surface rounded-2xl p-4 space-y-2.5">
                      <p className="text-sm text-[var(--text-primary)] leading-relaxed">
                        {aiPeriod.summary}
                      </p>
                      <div className="flex flex-wrap items-center gap-2">
                        {aiPeriod.keywords?.map((kw) => (
                          <span
                            key={kw}
                            className="text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-[var(--accent-soft)] text-[var(--accent-text)]"
                          >
                            # {kw}
                          </span>
                        ))}
                        {aiPeriod.turningPoint && (
                          <span className="text-xs text-[var(--text-secondary)]">
                            · 转折点：{aiPeriod.turningPoint}
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* 5★ Standouts */}
                  {topFiveStars.length > 0 && (
                    <div className="space-y-2">
                      <div className="text-xs font-semibold text-[var(--text-secondary)] flex items-center gap-1.5">
                        <Star className="w-3.5 h-3.5 text-[var(--gold)] fill-[var(--gold)]" />
                        当年 5★ 精选（共 {y.fiveStarHighlights.length} 部）
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {topFiveStars.map((item, idx) => (
                          <a
                            key={`${item.id}-${idx}`}
                            href={item.url || undefined}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs bg-[var(--bg-subtle)] hover:bg-[var(--bg-hover)] text-[var(--text-primary)] transition"
                          >
                            <span className="text-[10px] text-[var(--text-muted)]">{item.category}</span>
                            <span className="font-medium">《{item.shortTitle}》</span>
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Highlighted Real Comments from that Year */}
                  {topComments.length > 0 && (
                    <div className="space-y-2 pt-1">
                      <div className="text-xs font-semibold text-[var(--text-secondary)] flex items-center gap-1.5">
                        <MessageSquareQuote className="w-3.5 h-3.5 text-[var(--accent)]" />
                        当年短评摘录
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                        {topComments.map((item, idx) => (
                          <div
                            key={`${item.id}-c-${idx}`}
                            className="subtle-surface rounded-2xl p-3 flex flex-col justify-between gap-2"
                          >
                            <p className="text-xs text-[var(--text-primary)] leading-relaxed line-clamp-4 font-serif-editorial">
                              “{item.comment}”
                            </p>
                            <div className="flex items-center justify-between gap-2 pt-1 border-t border-[var(--border-subtle)]/70">
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <CategoryBadge category={item.category} />
                                  <StarDisplay rating={item.rating} size="xs" />
                                </div>
                                <div className="text-[11px] font-medium text-[var(--text-secondary)] truncate mt-1">
                                  《{item.shortTitle}》
                                </div>
                              </div>
                              {item.url && (
                                <a
                                  href={item.url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-[var(--text-muted)] hover:text-[var(--accent)] shrink-0"
                                >
                                  <ExternalLink className="w-3.5 h-3.5" />
                                </a>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}

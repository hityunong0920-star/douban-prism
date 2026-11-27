import { useMemo, useRef, useState } from 'react';
import {
  Download,
  ExternalLink,
  Flame,
  Heart,
  Loader2,
  Quote,
  Skull,
  Sparkles,
} from 'lucide-react';
import type { AiConfig, AiPersonaResult, Category, UserDataset } from '../types/douban';
import type { ThemeMode } from '../hooks/useTheme';
import {
  ALL_CATEGORIES,
  computeOverviewStats,
  computeRedBlackWall,
} from '../utils/analytics';
import { buildPersonaPrompt } from '../utils/ai';
import { exportElementAsPng } from '../utils/exportImage';
import { AiActionBridge } from './AiActionBridge';
import { CategoryBadge, StarDisplay } from './CategoryBadge';

interface RedBlackWallProps {
  dataset: UserDataset;
  theme: ThemeMode;
  aiConfig: AiConfig;
  aiPersona: AiPersonaResult | null;
  onAiPersona: (res: AiPersonaResult) => void;
  onOpenAiSettings: () => void;
}

export function RedBlackWall({
  dataset,
  theme,
  aiConfig,
  aiPersona,
  onAiPersona,
  onOpenAiSettings,
}: RedBlackWallProps) {
  const [category, setCategory] = useState<Category | '全部'>('全部');
  const [onlyCommented, setOnlyCommented] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [showAllFavs, setShowAllFavs] = useState(false);
  const [showAllRoasts, setShowAllRoasts] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const stats = useMemo(() => computeOverviewStats(dataset.records), [dataset.records]);
  const wall = useMemo(
    () => computeRedBlackWall(dataset.records, category),
    [dataset.records, category]
  );

  const favList = onlyCommented ? wall.favoriteQuotes : wall.favorites;
  const roastList = onlyCommented ? wall.roastQuotes : wall.roasts;

  const handleExportCard = async () => {
    if (!cardRef.current) return;
    setExporting(true);
    try {
      const bg = theme === 'dark' ? '#0c0d10' : '#f6f3eb';
      await exportElementAsPng(
        cardRef.current,
        `DoubanLens_${dataset.name}_红黑品味卡片.png`,
        bg
      );
    } finally {
      setExporting(false);
    }
  };

  const cardTopFavs = (wall.favoriteQuotes.length >= 3 ? wall.favoriteQuotes : wall.favorites).slice(0, 4);
  const cardTopRoasts = (wall.roastQuotes.length >= 3 ? wall.roastQuotes : wall.roasts).slice(0, 4);

  return (
    <div className="space-y-6">
      {/* Control + AI Persona Bridge */}
      <div className="card-surface rounded-3xl p-5 sm:p-6 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="font-serif-editorial text-xl sm:text-2xl font-bold text-[var(--text-primary)] flex items-center gap-2">
              <Flame className="w-5 h-5 text-[var(--crimson)]" />
              红黑榜与审美底线
            </h2>
            <p className="text-xs text-[var(--text-secondary)] mt-1">
              高分标出趣味上限，低分往往更直白地暴露审美底线。支持导出亮/暗双主题 2x PNG 长图
            </p>
          </div>

          <button
            type="button"
            onClick={handleExportCard}
            disabled={exporting}
            className="self-start md:self-auto inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-[var(--accent)] text-white hover:opacity-90 transition shadow-sm cursor-pointer disabled:opacity-60"
          >
            {exporting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            <span>{exporting ? '正在渲染高清图...' : '导出高清长图 PNG'}</span>
          </button>
        </div>

        <AiActionBridge<AiPersonaResult>
          aiConfig={aiConfig}
          buttonLabel="AI 总结品味画像与雷区"
          description="结合你的 5★ 偏爱与 1–2★ 差评，梳理核心审美暗线、主要雷区与低分短评风格，自动写入下方卡片。"
          buildPrompt={() => buildPersonaPrompt(dataset)}
          onResult={onAiPersona}
          onOpenSettings={onOpenAiSettings}
        />
      </div>

      {/* Shareable Magazine / Vinyl Poster Card Preview */}
      <div className="flex justify-center">
        <div
          ref={cardRef}
          className={`w-full max-w-3xl rounded-3xl p-6 sm:p-8 border space-y-6 ${
            theme === 'dark'
              ? 'bg-[#12141a] border-[#2d3240] text-[#f1eee7]'
              : 'bg-[#fffdf7] border-[#dfd6c3] text-[#1b1a17]'
          }`}
        >
          {/* Poster Top Masthead */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 pb-4 border-b border-[var(--border-subtle)]">
            <div className="space-y-1">
              <div className="text-[11px] font-mono-num uppercase tracking-[0.2em] text-[var(--accent)]">
                DOUBANLENS · TASTE MANIFESTO
              </div>
              <h3 className="font-serif-editorial text-2xl sm:text-3xl font-black tracking-tight">
                {aiPersona?.archetype || `${dataset.name} 的审美红黑榜`}
              </h3>
              <p className="text-xs sm:text-sm text-[var(--text-secondary)] font-serif-editorial">
                {aiPersona?.tagline ||
                  `基于 ${stats.total} 条书影音游记录 · 5★ 占比 ${stats.fiveStarRatio}% · 均分 ${stats.avgRating}`}
              </p>
            </div>
            <div className="text-left sm:text-right font-mono-num text-xs text-[var(--text-muted)] shrink-0">
              <div className="font-semibold text-[var(--text-primary)]">{dataset.name}</div>
              <div>
                {stats.total} 条档案 · {stats.avgRating}★ 均分
              </div>
            </div>
          </div>

          {/* Persona Traits or Auto-Derived Local Traits */}
          {aiPersona ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="rounded-2xl p-4 bg-[var(--gold-soft)]/70 border border-[var(--gold)]/20 space-y-2">
                <div className="text-xs font-bold text-[var(--gold)] flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" /> 核心审美暗线
                </div>
                <ul className="space-y-1 text-xs text-[var(--text-primary)] leading-relaxed">
                  {aiPersona.coreLines.map((line, i) => (
                    <li key={i}>• {line}</li>
                  ))}
                </ul>
              </div>
              <div className="rounded-2xl p-4 bg-[var(--crimson-soft)]/70 border border-[var(--crimson)]/20 space-y-2">
                <div className="text-xs font-bold text-[var(--crimson)] flex items-center gap-1.5">
                  <Skull className="w-3.5 h-3.5" /> 主要审美雷区
                </div>
                <ul className="space-y-1 text-xs text-[var(--text-primary)] leading-relaxed">
                  {aiPersona.redLines.map((line, i) => (
                    <li key={i}>• {line}</li>
                  ))}
                </ul>
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {wall.localTraits.map((trait) => (
                <span
                  key={trait}
                  className="text-xs px-3 py-1 rounded-full bg-[var(--bg-subtle)] text-[var(--text-primary)] border border-[var(--border-subtle)]"
                >
                  ✦ {trait}
                </span>
              ))}
            </div>
          )}

          {/* Side-by-Side Poster Highlights */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Red Card Column */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between text-xs font-bold text-[var(--gold)]">
                <span className="inline-flex items-center gap-1.5">
                  <Heart className="w-3.5 h-3.5 fill-current" /> 5★ 偏爱红榜
                </span>
                <span className="font-mono-num">{wall.favorites.length} 项</span>
              </div>
              <div className="space-y-2">
                {cardTopFavs.map((item, idx) => (
                  <div
                    key={`card-fav-${item.id}-${idx}`}
                    className="rounded-2xl p-3 bg-[var(--bg-subtle)]/80 border border-[var(--border-subtle)] space-y-1"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-[var(--text-primary)] truncate">
                        《{item.shortTitle}》
                      </span>
                      <span className="text-[10px] text-[var(--text-muted)] shrink-0">
                        {item.category}
                      </span>
                    </div>
                    {item.comment && (
                      <p className="text-[11px] text-[var(--text-secondary)] font-serif-editorial line-clamp-2">
                        “{item.comment}”
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Black Card Column */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between text-xs font-bold text-[var(--crimson)]">
                <span className="inline-flex items-center gap-1.5">
                  <Skull className="w-3.5 h-3.5" /> 1–2★ 差评与雷区
                </span>
                <span className="font-mono-num">{wall.roasts.length} 项</span>
              </div>
              <div className="space-y-2">
                {cardTopRoasts.length > 0 ? (
                  cardTopRoasts.map((item, idx) => (
                    <div
                      key={`card-roast-${item.id}-${idx}`}
                      className="rounded-2xl p-3 bg-[var(--bg-subtle)]/80 border border-[var(--border-subtle)] space-y-1"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold text-[var(--text-primary)] truncate">
                          《{item.shortTitle}》
                        </span>
                        <span className="text-[10px] font-mono-num text-[var(--crimson)] shrink-0">
                          {item.rating}★ · {item.category}
                        </span>
                      </div>
                      {item.comment && (
                        <p className="text-[11px] text-[var(--text-secondary)] font-serif-editorial line-clamp-2">
                          “{item.comment}”
                        </p>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="rounded-2xl p-4 bg-[var(--bg-subtle)]/60 text-xs text-[var(--text-muted)]">
                    目前没有 1–2★ 的低分记录。
                  </div>
                )}
              </div>
            </div>
          </div>

          {aiPersona?.roastStyle && (
            <div className="text-xs text-[var(--text-secondary)] italic border-l-2 border-[var(--crimson)] pl-3">
              低分短评风格：{aiPersona.roastStyle}
            </div>
          )}

          {/* Poster Footer */}
          <div className="pt-3 border-t border-[var(--border-subtle)] flex items-center justify-between text-[10px] font-mono-num text-[var(--text-muted)]">
            <span>Generated locally by DoubanLens · 豆瓣棱镜</span>
            <span>{new Date().toISOString().slice(0, 10)}</span>
          </div>
        </div>
      </div>

      {/* Full Interactive Red vs Black Wall Explorer */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="inline-flex items-center p-1 rounded-xl bg-[var(--bg-subtle)]">
            {(['全部', ...ALL_CATEGORIES] as const).map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategory(cat)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition cursor-pointer ${
                  category === cat
                    ? 'bg-[var(--bg-card)] text-[var(--text-primary)] shadow-xs'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <label className="inline-flex items-center gap-2 text-xs text-[var(--text-secondary)] cursor-pointer select-none">
            <input
              type="checkbox"
              checked={onlyCommented}
              onChange={(e) => setOnlyCommented(e.target.checked)}
              className="accent-[var(--accent)] rounded"
            />
            <Quote className="w-3.5 h-3.5" />
            只看写过短评的条目
          </label>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Left: 5★ Favorites */}
          <div className="card-surface rounded-3xl p-5 space-y-3.5">
            <div className="flex items-center justify-between">
              <h3 className="font-serif-editorial font-bold text-base text-[var(--gold)] flex items-center gap-1.5">
                <Heart className="w-4 h-4 fill-current" /> 5★ 偏爱红榜
              </h3>
              <span className="text-xs font-mono-num text-[var(--text-muted)]">
                {favList.length} 条
              </span>
            </div>

            <div className="space-y-2.5">
              {(showAllFavs ? favList : favList.slice(0, 12)).map((item, idx) => (
                <div
                  key={`fav-${item.id}-${idx}`}
                  className="subtle-surface rounded-2xl p-3.5 space-y-1.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <CategoryBadge category={item.category} />
                      <span className="font-semibold text-sm text-[var(--text-primary)]">
                        {item.shortTitle}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[11px] font-mono-num text-[var(--text-muted)]">
                        {item.date?.slice(0, 7) || ''}
                      </span>
                      {item.url && (
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[var(--text-muted)] hover:text-[var(--accent)]"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>
                  </div>
                  {item.comment && (
                    <p className="text-xs text-[var(--text-secondary)] font-serif-editorial leading-relaxed">
                      “{item.comment}”
                    </p>
                  )}
                </div>
              ))}
            </div>

            {favList.length > 12 && (
              <button
                type="button"
                onClick={() => setShowAllFavs((v) => !v)}
                className="w-full py-2 rounded-xl text-xs font-medium bg-[var(--bg-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer"
              >
                {showAllFavs ? '收起列表' : `展开全部 ${favList.length} 条 5★ 记录`}
              </button>
            )}
          </div>

          {/* Right: 1-2★ Roasts */}
          <div className="card-surface rounded-3xl p-5 space-y-3.5">
            <div className="flex items-center justify-between">
              <h3 className="font-serif-editorial font-bold text-base text-[var(--crimson)] flex items-center gap-1.5">
                <Skull className="w-4 h-4" /> 1–2★ 差评与雷区
              </h3>
              <span className="text-xs font-mono-num text-[var(--text-muted)]">
                {roastList.length} 条
              </span>
            </div>

            {roastList.length === 0 ? (
              <div className="text-center py-12 text-xs text-[var(--text-muted)]">
                当前筛选下没有 1–2★ 记录
              </div>
            ) : (
              <div className="space-y-2.5">
                {(showAllRoasts ? roastList : roastList.slice(0, 12)).map((item, idx) => (
                  <div
                    key={`roast-${item.id}-${idx}`}
                    className="subtle-surface rounded-2xl p-3.5 space-y-1.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <CategoryBadge category={item.category} />
                        <span className="font-semibold text-sm text-[var(--text-primary)]">
                          {item.shortTitle}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <StarDisplay rating={item.rating} size="xs" />
                        {item.url && (
                          <a
                            href={item.url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[var(--text-muted)] hover:text-[var(--accent)]"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </div>
                    </div>
                    {item.comment && (
                      <p className="text-xs text-[var(--text-secondary)] font-serif-editorial leading-relaxed">
                        “{item.comment}”
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}

            {roastList.length > 12 && (
              <button
                type="button"
                onClick={() => setShowAllRoasts((v) => !v)}
                className="w-full py-2 rounded-xl text-xs font-medium bg-[var(--bg-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer"
              >
                {showAllRoasts ? '收起列表' : `展开全部 ${roastList.length} 条差评`}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

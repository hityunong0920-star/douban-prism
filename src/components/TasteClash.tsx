import { useMemo, useRef, useState } from 'react';
import {
  Download,
  ExternalLink,
  Flame,
  Gift,
  GitCompareArrows,
  Handshake,
  Heart,
  Loader2,
  Sparkles,
  Swords,
  UploadCloud,
  UserPlus,
  X,
} from 'lucide-react';
import type { AiClashVerdict, AiConfig, UserDataset } from '../types/douban';
import type { ThemeMode } from '../hooks/useTheme';
import { computeTasteClash } from '../utils/analytics';
import { buildClashPrompt } from '../utils/ai';
import { getDemoFriendDataset } from '../utils/demoData';
import { exportElementAsPng } from '../utils/exportImage';
import { parseUploadedFile } from '../utils/parser';
import { AiActionBridge } from './AiActionBridge';
import { CategoryBadge, StarDisplay } from './CategoryBadge';

interface TasteClashProps {
  dataset: UserDataset;
  friendDataset: UserDataset | null;
  onFriendDataset: (ds: UserDataset | null) => void;
  theme: ThemeMode;
  aiConfig: AiConfig;
  aiVerdict: AiClashVerdict | null;
  onAiVerdict: (v: AiClashVerdict | null) => void;
  onOpenAiSettings: () => void;
}

export function TasteClash({
  dataset,
  friendDataset,
  onFriendDataset,
  theme,
  aiConfig,
  aiVerdict,
  onAiVerdict,
  onOpenAiSettings,
}: TasteClashProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const reportCardRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  const clash = useMemo(
    () => (friendDataset ? computeTasteClash(dataset, friendDataset) : null),
    [dataset, friendDataset]
  );

  const handleFriendFile = async (file: File) => {
    setError(null);
    try {
      const ds = await parseUploadedFile(file);
      onFriendDataset(ds);
      onAiVerdict(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : '解析好友文件失败');
    }
  };

  const handleLoadDemoFriend = () => {
    setError(null);
    onFriendDataset(getDemoFriendDataset());
    onAiVerdict(null);
  };

  const handleExportClashCard = async () => {
    if (!reportCardRef.current || !clash) return;
    setExporting(true);
    try {
      const bg = theme === 'dark' ? '#0c0d10' : '#f6f3eb';
      await exportElementAsPng(
        reportCardRef.current,
        `DoubanLens_${clash.userAName}_vs_${clash.userBName}_品味碰撞.png`,
        bg
      );
    } finally {
      setExporting(false);
    }
  };

  if (!friendDataset || !clash) {
    return (
      <div className="card-surface rounded-3xl p-6 sm:p-10 max-w-2xl mx-auto text-center space-y-6">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-[var(--accent-soft)] text-[var(--accent)] flex items-center justify-center">
          <GitCompareArrows className="w-7 h-7" />
        </div>

        <div className="space-y-2">
          <h2 className="font-serif-editorial text-2xl font-bold text-[var(--text-primary)]">
            双人口味对比 · Taste Comparison
          </h2>
          <p className="text-xs sm:text-sm text-[var(--text-secondary)] max-w-lg mx-auto leading-relaxed">
            上传另一位豆友（或好友公开主页导出）的 CSV / Excel / JSON 记录，系统将按豆瓣条目 ID 精准匹配，展示两人的
            <strong className="text-[var(--text-primary)]">
              评分契合度、共同高分作品、分歧较大条目、互相推荐与共同愿望单
            </strong>
            。
          </p>
        </div>

        <div
          onClick={() => fileRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            const f = e.dataTransfer.files?.[0];
            if (f) handleFriendFile(f);
          }}
          className="rounded-2xl p-8 border-2 border-dashed border-[var(--border-strong)] hover:border-[var(--accent)] bg-[var(--bg-subtle)]/50 cursor-pointer transition space-y-2"
        >
          <input
            ref={fileRef}
            type="file"
            accept=".csv,.json,.xlsx,.xls"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFriendFile(f);
              e.target.value = '';
            }}
          />
          <UploadCloud className="w-7 h-7 mx-auto text-[var(--accent)]" />
          <div className="font-semibold text-sm text-[var(--text-primary)]">
            拖拽或点击导入好友的豆瓣记录
          </div>
          <div className="text-xs text-[var(--text-muted)]">
            当前对比方 A：<strong>{dataset.name}</strong> ({dataset.records.length} 条)
          </div>
        </div>

        {error && (
          <div className="text-xs text-[var(--crimson)] bg-[var(--crimson-soft)] px-4 py-2 rounded-xl">
            {error}
          </div>
        )}

        <div className="pt-1">
          <button
            type="button"
            onClick={handleLoadDemoFriend}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold bg-[var(--accent)] text-white hover:opacity-90 transition cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>加载示例好友「苏木」查看对比效果</span>
          </button>
        </div>
      </div>
    );
  }

  const strokeDashoffset = 251.2 - (251.2 * clash.compatibilityScore) / 100;

  return (
    <div className="space-y-6">
      {/* Top Action Bar */}
      <div className="card-surface rounded-3xl p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-[var(--accent-soft)] text-[var(--accent-text)]">
              {clash.userAName}
            </span>
            <span className="text-xs font-mono-num text-[var(--text-muted)]">VS</span>
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-[var(--gold-soft)] text-[var(--gold)]">
              {clash.userBName}
            </span>
            <button
              type="button"
              onClick={() => {
                onFriendDataset(null);
                onAiVerdict(null);
              }}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs text-[var(--text-muted)] hover:bg-[var(--bg-subtle)] hover:text-[var(--text-primary)] cursor-pointer"
            >
              <X className="w-3.5 h-3.5" /> 更换好友
            </button>
          </div>

          <button
            type="button"
            onClick={handleExportClashCard}
            disabled={exporting}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-[var(--accent)] text-white hover:opacity-90 transition cursor-pointer disabled:opacity-60"
          >
            {exporting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
            {exporting ? '正在生成长图...' : '导出双人对比长图 PNG'}
          </button>
        </div>

        <AiActionBridge<AiClashVerdict>
          aiConfig={aiConfig}
          buttonLabel="生成 AI 口味异同点评"
          description="结合两人的共同高分与评分分歧，总结审美异同并基于交集给出适合共同观看或阅读的建议。"
          buildPrompt={() => buildClashPrompt(clash)}
          onResult={onAiVerdict}
          onOpenSettings={onOpenAiSettings}
          compact
        />
      </div>

      {/* Exportable Dual-User Compatibility Poster Card */}
      <div
        ref={reportCardRef}
        className={`rounded-3xl p-6 sm:p-8 border space-y-6 ${
          theme === 'dark'
            ? 'bg-[#12141a] border-[#2d3240] text-[#f1eee7]'
            : 'bg-[#fffdf7] border-[#dfd6c3] text-[#1b1a17]'
        }`}
      >
        <div className="flex flex-col md:flex-row items-center gap-6 justify-between">
          {/* Score Ring */}
          <div className="flex items-center gap-5">
            <div className="relative w-24 h-24 shrink-0">
              <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="none"
                  stroke="var(--border-subtle)"
                  strokeWidth="9"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="none"
                  stroke="var(--accent)"
                  strokeWidth="9"
                  strokeLinecap="round"
                  strokeDasharray="251.2"
                  strokeDashoffset={strokeDashoffset}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="font-mono-num text-2xl font-black text-[var(--text-primary)]">
                  {clash.compatibilityScore}%
                </span>
                <span className="text-[10px] text-[var(--text-muted)]">契合度</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="text-[11px] font-mono-num uppercase tracking-widest text-[var(--accent)]">
                TASTE CLASH REPORT
              </div>
              <h3 className="font-serif-editorial text-xl sm:text-2xl font-black">
                {aiVerdict?.headline || clash.tierLabel}
              </h3>
              <p className="text-xs text-[var(--text-secondary)] max-w-md leading-relaxed">
                {aiVerdict?.compatibilityComment || clash.tierDesc}
              </p>
            </div>
          </div>

          {/* Overlap Counters */}
          <div className="grid grid-cols-3 gap-2.5 w-full md:w-auto shrink-0">
            <div className="subtle-surface rounded-2xl px-3.5 py-3 text-center">
              <div className="font-mono-num text-lg font-bold text-[var(--text-primary)]">
                {clash.sharedTotal}
              </div>
              <div className="text-[10px] text-[var(--text-muted)]">共同条目</div>
            </div>
            <div className="subtle-surface rounded-2xl px-3.5 py-3 text-center">
              <div className="font-mono-num text-lg font-bold text-[var(--gold)]">
                {clash.sharedFavorites.length}
              </div>
              <div className="text-[10px] text-[var(--text-muted)]">共同高分</div>
            </div>
            <div className="subtle-surface rounded-2xl px-3.5 py-3 text-center">
              <div className="font-mono-num text-lg font-bold text-[var(--crimson)]">
                {clash.spicyDisagreements.length}
              </div>
              <div className="text-[10px] text-[var(--text-muted)]">分歧条目</div>
            </div>
          </div>
        </div>

        {/* AI Extra Insights if present */}
        {aiVerdict && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="rounded-2xl p-4 bg-[var(--crimson-soft)]/60 border border-[var(--crimson)]/20 space-y-1">
              <div className="text-xs font-bold text-[var(--crimson)] flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5" /> 主要分歧点
              </div>
              <p className="text-xs text-[var(--text-primary)] leading-relaxed">
                {aiVerdict.fightPrediction}
              </p>
            </div>
            <div className="rounded-2xl p-4 bg-[var(--accent-soft)]/70 border border-[var(--accent)]/20 space-y-1">
              <div className="text-xs font-bold text-[var(--accent-text)] flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" /> 适合共同观看或阅读
              </div>
              <p className="text-xs text-[var(--text-primary)] leading-relaxed">
                {aiVerdict.weekendPlan}
              </p>
            </div>
          </div>
        )}

        {/* Mini Preview of Top Disagreement & Shared Love inside Export Card */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-[var(--border-subtle)]">
          <div className="space-y-1.5">
            <div className="text-[11px] font-bold text-[var(--gold)]">
              ★ 共同高分 TOP 3
            </div>
            {clash.sharedFavorites.slice(0, 3).map((p) => (
              <div key={p.id} className="text-xs text-[var(--text-secondary)] flex items-center justify-between">
                <span className="truncate">
                  [{p.category}] 《{p.shortTitle}》
                </span>
                <span className="font-mono-num text-[var(--gold)] shrink-0 ml-2">
                  {p.a.rating}★ / {p.b.rating}★
                </span>
              </div>
            ))}
            {clash.sharedFavorites.length === 0 && (
              <div className="text-xs text-[var(--text-muted)]">暂未发现共同 4–5★ 作品</div>
            )}
          </div>

          <div className="space-y-1.5">
            <div className="text-[11px] font-bold text-[var(--crimson)]">
              ≠ 评分分歧 TOP 3
            </div>
            {clash.spicyDisagreements.slice(0, 3).map((p) => (
              <div key={p.id} className="text-xs text-[var(--text-secondary)] flex items-center justify-between">
                <span className="truncate">
                  [{p.category}] 《{p.shortTitle}》
                </span>
                <span className="font-mono-num text-[var(--crimson)] shrink-0 ml-2">
                  {p.a.rating}★ vs {p.b.rating}★
                </span>
              </div>
            ))}
            {clash.spicyDisagreements.length === 0 && (
              <div className="text-xs text-[var(--text-muted)]">没有分差 ≥ 2★ 的条目，评价颇为接近。</div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between text-[10px] font-mono-num text-[var(--text-muted)] pt-2 border-t border-[var(--border-subtle)]">
          <span>
            {clash.userAName} × {clash.userBName} · 平均评分差 {clash.avgRatingDiff}★
          </span>
          <span>DoubanLens · 豆瓣棱镜</span>
        </div>
      </div>

      {/* Arena 1: Spicy Disagreements */}
      <div className="card-surface rounded-3xl p-5 sm:p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-serif-editorial text-lg font-bold text-[var(--crimson)] flex items-center gap-2">
            <Swords className="w-5 h-5" />
            评分分歧较大（分差 ≥ 2★）
          </h3>
          <span className="text-xs font-mono-num text-[var(--text-muted)]">
            共 {clash.spicyDisagreements.length} 部
          </span>
        </div>

        {clash.spicyDisagreements.length === 0 ? (
          <div className="subtle-surface rounded-2xl p-6 text-center text-xs text-[var(--text-muted)]">
            你们在共同评分的作品上分差均小于 2★，整体评价相当接近。
          </div>
        ) : (
          <div className="space-y-3">
            {clash.spicyDisagreements.slice(0, 12).map((p) => (
              <div key={p.id} className="subtle-surface rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <CategoryBadge category={p.category} />
                    <span className="font-serif-editorial font-bold text-sm sm:text-base text-[var(--text-primary)]">
                      《{p.shortTitle}》
                    </span>
                    <span className="text-[11px] font-mono-num px-2 py-0.5 rounded-full bg-[var(--crimson-soft)] text-[var(--crimson)]">
                      相差 {p.ratingDiff}★
                    </span>
                  </div>
                  {p.url && (
                    <a
                      href={p.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[var(--text-muted)] hover:text-[var(--accent)]"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="rounded-xl p-3 bg-[var(--bg-card)] border border-[var(--border-subtle)] space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-[var(--accent-text)]">{clash.userAName}</span>
                      <StarDisplay rating={p.a.rating} size="xs" />
                    </div>
                    <p className="text-xs text-[var(--text-secondary)] font-serif-editorial">
                      {p.a.comment ? `“${p.a.comment}”` : '（未留短评）'}
                    </p>
                  </div>
                  <div className="rounded-xl p-3 bg-[var(--bg-card)] border border-[var(--border-subtle)] space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-[var(--gold)]">{clash.userBName}</span>
                      <StarDisplay rating={p.b.rating} size="xs" />
                    </div>
                    <p className="text-xs text-[var(--text-secondary)] font-serif-editorial">
                      {p.b.comment ? `“${p.b.comment}”` : '（未留短评）'}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Arena 2: Shared Favorites & Shared Wishlist */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="card-surface rounded-3xl p-5 space-y-3.5">
          <div className="flex items-center justify-between">
            <h3 className="font-serif-editorial font-bold text-base text-[var(--gold)] flex items-center gap-1.5">
              <Heart className="w-4 h-4 fill-current" /> 共同高分条目（均 ≥ 4★）
            </h3>
            <span className="text-xs font-mono-num text-[var(--text-muted)]">
              {clash.sharedFavorites.length} 部
            </span>
          </div>
          <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
            {clash.sharedFavorites.length === 0 ? (
              <p className="text-xs text-[var(--text-muted)] py-6 text-center">暂无共同 4–5★ 交集</p>
            ) : (
              clash.sharedFavorites.slice(0, 20).map((p) => (
                <div
                  key={p.id}
                  className="subtle-surface rounded-2xl px-3.5 py-2.5 flex items-center justify-between gap-2"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <CategoryBadge category={p.category} />
                    <span className="text-xs sm:text-sm font-medium text-[var(--text-primary)] truncate">
                      {p.shortTitle}
                    </span>
                  </div>
                  <span className="text-xs font-mono-num text-[var(--gold)] shrink-0">
                    {p.a.rating}★ / {p.b.rating}★
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="card-surface rounded-3xl p-5 space-y-3.5">
          <div className="flex items-center justify-between">
            <h3 className="font-serif-editorial font-bold text-base text-[var(--accent)] flex items-center gap-1.5">
              <Handshake className="w-4 h-4" /> 共同愿望单（都在想看 / 想读 / 想玩）
            </h3>
            <span className="text-xs font-mono-num text-[var(--text-muted)]">
              {clash.sharedWishlist.length} 部
            </span>
          </div>
          <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
            {clash.sharedWishlist.length === 0 ? (
              <p className="text-xs text-[var(--text-muted)] py-6 text-center">
                两人的愿望单暂无直接重合，可以参考下方的 5★ 互相推荐。
              </p>
            ) : (
              clash.sharedWishlist.slice(0, 20).map((p) => (
                <div
                  key={p.id}
                  className="subtle-surface rounded-2xl px-3.5 py-2.5 flex items-center justify-between gap-2"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <CategoryBadge category={p.category} />
                    <span className="text-xs sm:text-sm font-medium text-[var(--text-primary)] truncate">
                      {p.shortTitle}
                    </span>
                  </div>
                  {p.url && (
                    <a
                      href={p.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-[var(--accent)] hover:underline shrink-0 inline-flex items-center gap-1"
                    >
                      豆瓣条目 <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Arena 3: Mutual 5★ Recommendations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="card-surface rounded-3xl p-5 space-y-3.5">
          <h3 className="font-serif-editorial font-bold text-base text-[var(--text-primary)] flex items-center gap-1.5">
            <Gift className="w-4 h-4 text-[var(--accent)]" />
            {clash.userBName} 的 5★ 推荐 → {clash.userAName}
          </h3>
          <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
            {clash.bRecommendsToA.slice(0, 12).map((item) => (
              <div key={item.record.id} className="subtle-surface rounded-2xl p-3 space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <CategoryBadge category={item.record.category} />
                    <span className="text-xs sm:text-sm font-semibold text-[var(--text-primary)] truncate">
                      {item.record.shortTitle}
                    </span>
                  </div>
                  {item.alreadyInTargetWish && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--gold-soft)] text-[var(--gold)] font-semibold shrink-0">
                      已在你的愿望单中
                    </span>
                  )}
                </div>
                {item.record.comment && (
                  <p className="text-xs text-[var(--text-secondary)] italic line-clamp-2">
                    对方短评：“{item.record.comment}”
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="card-surface rounded-3xl p-5 space-y-3.5">
          <h3 className="font-serif-editorial font-bold text-base text-[var(--text-primary)] flex items-center gap-1.5">
            <Gift className="w-4 h-4 text-[var(--gold)]" />
            {clash.userAName} 的 5★ 推荐 → {clash.userBName}
          </h3>
          <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
            {clash.aRecommendsToB.slice(0, 12).map((item) => (
              <div key={item.record.id} className="subtle-surface rounded-2xl p-3 space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <CategoryBadge category={item.record.category} />
                    <span className="text-xs sm:text-sm font-semibold text-[var(--text-primary)] truncate">
                      {item.record.shortTitle}
                    </span>
                  </div>
                  {item.alreadyInTargetWish && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--gold-soft)] text-[var(--gold)] font-semibold shrink-0">
                      已在对方愿望单中
                    </span>
                  )}
                </div>
                {item.record.comment && (
                  <p className="text-xs text-[var(--text-secondary)] italic line-clamp-2">
                    你的短评：“{item.record.comment}”
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

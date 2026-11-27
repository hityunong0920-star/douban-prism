import { useMemo, useRef, useState } from 'react';
import {
  Clock,
  Dices,
  ExternalLink,
  RefreshCw,
  Shuffle,
  Sparkles,
  XCircle,
} from 'lucide-react';
import type { AiConfig, AiGachaPick, Category, UserDataset } from '../types/douban';
import {
  ALL_CATEGORIES,
  computeWishlistPool,
  type DustAgeFilter,
  type WishlistCandidate,
} from '../utils/analytics';
import { buildGachaPrompt } from '../utils/ai';
import { AiActionBridge } from './AiActionBridge';
import { CategoryBadge } from './CategoryBadge';

interface GachaPickerProps {
  dataset: UserDataset;
  aiConfig: AiConfig;
  aiPicks: AiGachaPick[] | null;
  onAiPicks: (picks: AiGachaPick[]) => void;
  onOpenAiSettings: () => void;
}

const MOOD_PRESETS = [
  '今晚大概有 2 小时，想找一部节奏轻松但有质感的',
  '想看现实主义、历史或制度分析相关的作品',
  '周末有整块时间，适合沉下心看一部长片或厚书',
  '最近提不起劲，想找一部容易进入状态的作品',
];

const DUST_OPTIONS: { id: DustAgeFilter; label: string }[] = [
  { id: 'all', label: '全部愿望单' },
  { id: 'over1y', label: '收藏超 1 年' },
  { id: 'over2y', label: '收藏超 2 年' },
  { id: 'recent', label: '近半年添加' },
];

export function GachaPicker({
  dataset,
  aiConfig,
  aiPicks,
  onAiPicks,
  onOpenAiSettings,
}: GachaPickerProps) {
  const [selectedCats, setSelectedCats] = useState<Category[]>(['电影', '读书', '游戏', '音乐']);
  const [includeDoing, setIncludeDoing] = useState(true);
  const [dustAge, setDustAge] = useState<DustAgeFilter>('all');
  const [excludedIds, setExcludedIds] = useState<Set<string>>(new Set());

  const [rolling, setRolling] = useState(false);
  const [drawnItems, setDrawnItems] = useState<WishlistCandidate[]>([]);
  const [moodInput, setMoodInput] = useState(MOOD_PRESETS[0]);

  const timerRef = useRef<number | null>(null);

  const pool = useMemo(() => {
    const raw = computeWishlistPool(dataset.records, {
      categories: selectedCats,
      includeDoing,
      dustAge,
    });
    return raw.filter((item) => !excludedIds.has(item.id));
  }, [dataset.records, selectedCats, includeDoing, dustAge, excludedIds]);

  const toggleCat = (cat: Category) => {
    setSelectedCats((prev) =>
      prev.includes(cat)
        ? prev.length > 1
          ? prev.filter((c) => c !== cat)
          : prev
        : [...prev, cat]
    );
  };

  const samplePool = (count: number): WishlistCandidate[] => {
    const shuffled = [...pool].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, Math.min(count, shuffled.length));
  };

  const spinGacha = (count: 1 | 3) => {
    if (pool.length === 0 || rolling) return;
    setRolling(true);
    let ticks = 0;
    const maxTicks = 10;

    if (timerRef.current) window.clearInterval(timerRef.current);
    timerRef.current = window.setInterval(() => {
      ticks += 1;
      setDrawnItems(samplePool(count));
      if (ticks >= maxTicks) {
        if (timerRef.current) window.clearInterval(timerRef.current);
        setDrawnItems(samplePool(count));
        setRolling(false);
      }
    }, 65);
  };

  const excludeItem = (id: string) => {
    setExcludedIds((prev) => new Set(prev).add(id));
    setDrawnItems((prev) => prev.filter((item) => item.id !== id));
  };

  return (
    <div className="space-y-6">
      {/* Main Gacha Machine Card */}
      <div className="card-surface rounded-3xl p-5 sm:p-7 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="font-serif-editorial text-xl sm:text-2xl font-bold text-[var(--text-primary)] flex items-center gap-2">
              <Dices className="w-5 h-5 text-[var(--accent)]" />
              愿望单随机抽取
            </h2>
            <p className="text-xs text-[var(--text-secondary)] mt-1">
              从「想看 / 想读 / 想玩」里随机挑一项，或按当下的时间与心境由 AI 协助筛选
            </p>
          </div>
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[var(--accent-soft)] text-[var(--accent-text)] text-xs font-mono-num font-semibold self-start">
            当前候选池：{pool.length} 项
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 pt-1">
          {/* Categories */}
          <div className="flex flex-wrap items-center gap-1.5">
            {ALL_CATEGORIES.map((cat) => {
              const active = selectedCats.includes(cat);
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => toggleCat(cat)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition cursor-pointer ${
                    active
                      ? 'bg-[var(--accent)] text-white border-transparent'
                      : 'bg-[var(--bg-subtle)] text-[var(--text-secondary)] border-transparent hover:text-[var(--text-primary)]'
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>

          <span className="hidden sm:inline text-[var(--border-strong)]">|</span>

          {/* Dust Age */}
          <div className="inline-flex flex-wrap items-center p-1 rounded-xl bg-[var(--bg-subtle)] gap-1">
            {DUST_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setDustAge(opt.id)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition cursor-pointer ${
                  dustAge === opt.id
                    ? 'bg-[var(--bg-card)] text-[var(--text-primary)] shadow-xs'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <label className="inline-flex items-center gap-1.5 text-xs text-[var(--text-secondary)] cursor-pointer select-none">
            <input
              type="checkbox"
              checked={includeDoing}
              onChange={(e) => setIncludeDoing(e.target.checked)}
              className="accent-[var(--accent)]"
            />
            包含「在看/在读/在玩」
          </label>

          {excludedIds.size > 0 && (
            <button
              type="button"
              onClick={() => setExcludedIds(new Set())}
              className="text-xs text-[var(--accent)] hover:underline cursor-pointer"
            >
              恢复已排除 ({excludedIds.size})
            </button>
          )}
        </div>

        {/* Gacha Stage */}
        <div className="rounded-3xl p-6 sm:p-8 bg-[var(--bg-subtle)]/75 border border-[var(--border-subtle)] text-center space-y-6">
          {pool.length === 0 ? (
            <div className="py-8 space-y-2">
              <p className="font-serif-editorial text-base text-[var(--text-primary)]">
                当前筛选条件下候选池为空
              </p>
              <p className="text-xs text-[var(--text-muted)]">
                可以放宽收藏时长、勾选更多品类，或包含「在看 / 在读 / 在玩」列表。
              </p>
            </div>
          ) : drawnItems.length === 0 ? (
            <div className="py-6 space-y-2">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-[var(--bg-card)] border border-[var(--border-subtle)] flex items-center justify-center text-[var(--accent)]">
                <Shuffle className="w-7 h-7" />
              </div>
              <p className="font-serif-editorial text-lg font-bold text-[var(--text-primary)]">
                从愿望单里随机挑一项
              </p>
              <p className="text-xs text-[var(--text-secondary)]">
                点击下方按钮，从 {pool.length} 项待看/待读作品中随机抽取
              </p>
            </div>
          ) : (
            <div
              className={`grid gap-4 text-left ${
                drawnItems.length === 1
                  ? 'max-w-lg mx-auto grid-cols-1'
                  : 'grid-cols-1 md:grid-cols-3'
              }`}
            >
              {drawnItems.map((item, idx) => (
                <div
                  key={`${item.id}-${idx}-${rolling ? 'r' : 'f'}`}
                  className={`card-surface rounded-2xl p-5 flex flex-col justify-between gap-4 ${
                    !rolling ? 'animate-gacha-pop ring-2 ring-[var(--accent)]/35' : 'opacity-80'
                  }`}
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <CategoryBadge category={item.category} />
                        <span className="text-[11px] px-2 py-0.5 rounded-full bg-[var(--bg-subtle)] text-[var(--text-secondary)]">
                          {item.status}
                        </span>
                      </div>
                      {item.dustDays !== null && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-mono-num text-[var(--gold)]">
                          <Clock className="w-3 h-3" />
                          已收藏 {item.dustDays} 天
                        </span>
                      )}
                    </div>

                    <div>
                      <h3 className="font-serif-editorial text-lg sm:text-xl font-black text-[var(--text-primary)] leading-snug">
                        {item.shortTitle}
                      </h3>
                      {item.title !== item.shortTitle && (
                        <p className="text-[11px] text-[var(--text-muted)] mt-1 line-clamp-2">
                          {item.title}
                        </p>
                      )}
                    </div>

                    {item.comment && (
                      <p className="text-xs text-[var(--text-secondary)] italic">
                        当年备注：“{item.comment}”
                      </p>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-[var(--border-subtle)]">
                    <button
                      type="button"
                      onClick={() => excludeItem(item.id)}
                      className="inline-flex items-center gap-1 text-xs text-[var(--text-muted)] hover:text-[var(--crimson)] cursor-pointer"
                    >
                      <XCircle className="w-3.5 h-3.5" /> 本轮暂不考虑
                    </button>

                    {item.url && (
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--accent)] hover:underline"
                      >
                        豆瓣条目 <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Action Spin Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
            <button
              type="button"
              disabled={pool.length === 0 || rolling}
              onClick={() => spinGacha(1)}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl text-sm font-bold bg-[var(--accent)] text-white hover:opacity-90 transition shadow-sm cursor-pointer disabled:opacity-50"
            >
              <Dices className={`w-4 h-4 ${rolling ? 'animate-spin' : ''}`} />
              {rolling ? '抽取中...' : '随机抽 1 项'}
            </button>

            <button
              type="button"
              disabled={pool.length === 0 || rolling}
              onClick={() => spinGacha(3)}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl text-sm font-semibold bg-[var(--bg-card)] border border-[var(--border-strong)] text-[var(--text-primary)] hover:border-[var(--accent)] transition cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className="w-4 h-4 text-[var(--accent)]" />
              随机抽 3 项
            </button>
          </div>
        </div>
      </div>

      {/* AI Mood Curator */}
      <div className="card-surface rounded-3xl p-5 sm:p-6 space-y-4">
        <div className="space-y-1">
          <h3 className="font-serif-editorial text-lg font-bold text-[var(--text-primary)] flex items-center gap-2">
            <Sparkles className="w-4.5 h-4.5 text-[var(--gold)]" />
            按当前需求从愿望单筛选
          </h3>
          <p className="text-xs text-[var(--text-secondary)]">
            说明你此刻的可用时间或想看的方向，AI 会严格只从上方愿望单候选池中挑选 3 项并给出简短理由。
          </p>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {MOOD_PRESETS.map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => setMoodInput(preset)}
              className={`px-3 py-1.5 rounded-xl text-xs border transition cursor-pointer ${
                moodInput === preset
                  ? 'bg-[var(--accent-soft)] border-[var(--accent)]/40 text-[var(--accent-text)]'
                  : 'bg-[var(--bg-subtle)] border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              {preset}
            </button>
          ))}
        </div>

        <input
          type="text"
          value={moodInput}
          onChange={(e) => setMoodInput(e.target.value)}
          placeholder="例如：下雨天的周五晚上，想看一部节奏克制、后劲大的片子..."
          className="w-full px-4 py-3 rounded-2xl text-sm bg-[var(--bg-subtle)] border border-[var(--border-subtle)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]"
        />

        <AiActionBridge<AiGachaPick[]>
          aiConfig={aiConfig}
          buttonLabel="从愿望单挑选 3 项"
          description="结合过往高分偏好与低分原因，从你的愿望单候选池里挑选 3 项最契合当前需求的作品。"
          buildPrompt={() => buildGachaPrompt(dataset, moodInput, pool)}
          onResult={onAiPicks}
          onOpenSettings={onOpenAiSettings}
          compact
        />

        {aiPicks && aiPicks.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 pt-2">
            {aiPicks.map((pick, idx) => (
              <div
                key={`${pick.title}-${idx}`}
                className="subtle-surface rounded-2xl p-4 space-y-2.5 border border-[var(--accent)]/25"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-[var(--accent-soft)] text-[var(--accent-text)]">
                    {pick.category}
                  </span>
                  <span className="text-[11px] font-medium text-[var(--gold)]">
                    ✦ {pick.vibeTag}
                  </span>
                </div>
                <h4 className="font-serif-editorial text-base font-bold text-[var(--text-primary)]">
                  《{pick.title}》
                </h4>
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                  {pick.reason}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

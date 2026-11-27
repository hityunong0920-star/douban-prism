import { useRef, useState } from 'react';
import {
  Bot,
  CalendarDays,
  Dices,
  FileSpreadsheet,
  Flame,
  GitCompareArrows,
  ShieldCheck,
  Sparkles,
  UploadCloud,
} from 'lucide-react';
import type { UserDataset } from '../types/douban';
import { parseUploadedFile } from '../utils/parser';
import { PrismHeroMark } from './PrismLogo';

interface LandingHeroProps {
  onDatasetLoaded: (dataset: UserDataset) => void;
  onLoadDemo: () => void;
  onOpenAgentGuide: () => void;
}

const FEATURES = [
  {
    icon: CalendarDays,
    title: '文化摄入热力图',
    desc: '按年或近 365 天查看标记密度，一眼看出哪段时期集中观影或阅读。',
  },
  {
    icon: Sparkles,
    title: '品味演进时间线',
    desc: '按年份切片回顾文化重心的迁徙，附当年 5★ 精选与真实短评摘录。',
  },
  {
    icon: Flame,
    title: '红黑榜与审美底线',
    desc: '5★ 偏爱与 1–2★ 差评并置对照，支持导出亮/暗双主题高清长图。',
  },
  {
    icon: Dices,
    title: '愿望单随机抽取',
    desc: '从想看、想读、想玩清单里按品类或收藏时长随机抽取，也支持 AI 按需求筛选。',
  },
  {
    icon: GitCompareArrows,
    title: '双人口味对比',
    desc: '导入好友记录按条目 ID 匹配，查看评分契合度、分歧条目与互相推荐。',
  },
];

export function LandingHero({
  onDatasetLoaded,
  onLoadDemo,
  onOpenAgentGuide,
}: LandingHeroProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [parsing, setParsing] = useState(false);

  const handleFile = async (file: File) => {
    setError(null);
    setParsing(true);
    try {
      const ds = await parseUploadedFile(file);
      onDatasetLoaded(ds);
    } catch (err) {
      setError(err instanceof Error ? err.message : '解析文件失败');
    } finally {
      setParsing(false);
    }
  };

  return (
    <main className="max-w-5xl mx-auto px-4 sm:px-6 py-10 sm:py-16 space-y-12">
      {/* Hero Copy */}
      <section className="text-center max-w-2xl mx-auto space-y-5">
        <div className="flex flex-col items-center gap-2">
          <PrismHeroMark className="w-56 sm:w-72 h-auto text-[var(--text-primary)]" />
          <div className="text-[11px] sm:text-xs font-mono-num tracking-[0.22em] uppercase text-[var(--text-muted)]">
            DOUBANPRISM · 豆瓣书影音游整理工具
          </div>
        </div>

        <h1 className="font-serif-editorial text-3xl sm:text-5xl font-black tracking-tight leading-[1.2] text-[var(--text-primary)]">
          为你的豆瓣书影音游，
          <br />
          整理一份<span className="text-[var(--accent)]">个人品味档案</span>
        </h1>

        <p className="text-sm sm:text-base text-[var(--text-secondary)] leading-relaxed max-w-xl mx-auto">
          导入历年标记记录，回顾观影与阅读轨迹、对照高低分评价、从愿望单里随手抽一项，或与朋友比对彼此的口味。
        </p>

        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 pt-1 text-xs text-[var(--text-muted)]">
          <span className="inline-flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-[var(--accent)]" />
            浏览器本地解析，数据不上传
          </span>
          <span className="hidden sm:inline text-[var(--border-strong)]">·</span>
          <span>兼容 CSV / Excel / JSON</span>
          <span className="hidden sm:inline text-[var(--border-strong)]">·</span>
          <span>AI 总结按需开启（支持免 Key）</span>
        </div>
      </section>

      {/* Upload Dropzone Card */}
      <section className="max-w-2xl mx-auto">
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            const file = e.dataTransfer.files?.[0];
            if (file) handleFile(file);
          }}
          onClick={() => inputRef.current?.click()}
          className={`card-surface rounded-3xl p-8 sm:p-11 text-center cursor-pointer transition-all border-2 border-dashed ${
            dragging
              ? 'border-[var(--accent)] bg-[var(--accent-soft)]/40 scale-[1.01]'
              : 'border-[var(--border-strong)] hover:border-[var(--accent)]'
          }`}
        >
          <input
            ref={inputRef}
            type="file"
            accept=".csv,.json,.xlsx,.xls"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
              e.target.value = '';
            }}
          />

          <div className="w-14 h-14 mx-auto rounded-2xl bg-[var(--accent-soft)] text-[var(--accent)] flex items-center justify-center mb-4">
            <UploadCloud className="w-7 h-7" />
          </div>

          <h2 className="font-serif-editorial text-lg sm:text-xl font-bold text-[var(--text-primary)]">
            {parsing ? '正在解析你的文化档案...' : '拖拽或点击上传你的豆瓣记录文件'}
          </h2>

          <p className="mt-2 text-xs sm:text-sm text-[var(--text-secondary)]">
            兼容标准 CSV / Excel (.xlsx) / JSON（支持 Agent 导出格式、douban-archive、豆伴等）
          </p>

          <div className="mt-5 flex flex-wrap items-center justify-center gap-2 text-[11px] text-[var(--text-muted)]">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[var(--bg-subtle)]">
              <FileSpreadsheet className="w-3 h-3" /> 分类 · 状态 · 标题 · 评分 · 标记日期 · 短评 · 链接
            </span>
          </div>

          {error && (
            <div className="mt-4 text-xs text-[var(--crimson)] bg-[var(--crimson-soft)] px-4 py-2.5 rounded-xl">
              {error}
            </div>
          )}
        </div>

        {/* Action Buttons under Dropzone */}
        <div className="mt-5 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            type="button"
            onClick={onLoadDemo}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-[var(--accent)] text-white hover:opacity-90 transition shadow-sm cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            <span>加载内置示例数据</span>
          </button>

          <button
            type="button"
            onClick={onOpenAgentGuide}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium bg-[var(--bg-card)] border border-[var(--border-subtle)] text-[var(--text-primary)] hover:border-[var(--border-strong)] transition cursor-pointer"
          >
            <Bot className="w-4 h-4 text-[var(--accent)]" />
            <span>查看数据导出说明</span>
          </button>
        </div>
      </section>

      {/* Feature Highlights Grid */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        {FEATURES.map((f) => {
          const Icon = f.icon;
          return (
            <div key={f.title} className="card-surface rounded-2xl p-4 space-y-2.5">
              <div className="w-9 h-9 rounded-xl bg-[var(--bg-subtle)] text-[var(--accent)] flex items-center justify-center">
                <Icon className="w-4.5 h-4.5" />
              </div>
              <h3 className="font-serif-editorial font-bold text-sm text-[var(--text-primary)]">
                {f.title}
              </h3>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed">{f.desc}</p>
            </div>
          );
        })}
      </section>
    </main>
  );
}

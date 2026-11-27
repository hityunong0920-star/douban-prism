import {
  Bot,
  CalendarDays,
  Dices,
  Flame,
  GitCompareArrows,
  KeyRound,
  Moon,
  Sparkles,
  Sun,
  Upload,
} from 'lucide-react';
import type { ActiveTab, AiConfig, UserDataset } from '../types/douban';
import type { ThemeMode } from '../hooks/useTheme';
import { PrismIcon } from './PrismLogo';

interface HeaderProps {
  dataset: UserDataset | null;
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  theme: ThemeMode;
  onToggleTheme: () => void;
  aiConfig: AiConfig;
  onOpenAiSettings: () => void;
  onOpenAgentGuide: () => void;
  onResetUpload: () => void;
}

const NAV_ITEMS: { id: ActiveTab; label: string; shortLabel: string; icon: typeof CalendarDays }[] = [
  { id: 'heatmap', label: '文化热力图', shortLabel: '热力图', icon: CalendarDays },
  { id: 'timeline', label: '品味时间线', shortLabel: '时间线', icon: Sparkles },
  { id: 'wall', label: '红黑榜', shortLabel: '红黑榜', icon: Flame },
  { id: 'gacha', label: '愿望单抽取', shortLabel: '愿望单', icon: Dices },
  { id: 'clash', label: '双人对比', shortLabel: '对比', icon: GitCompareArrows },
];

export function Header({
  dataset,
  activeTab,
  onSelectTab,
  theme,
  onToggleTheme,
  aiConfig,
  onOpenAiSettings,
  onOpenAgentGuide,
  onResetUpload,
}: HeaderProps) {
  const hasKey = Boolean(aiConfig.apiKey.trim());

  return (
    <header className="sticky top-0 z-30 backdrop-blur-md bg-[var(--bg-page)]/85 border-b border-[var(--border-subtle)]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
        {/* Brand */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={onResetUpload}
            className="flex items-center gap-2.5 group cursor-pointer text-left"
            title="返回导入页"
          >
            <PrismIcon className="w-9 h-9 rounded-xl shadow-sm group-hover:scale-105 transition shrink-0" />
            <div>
              <div className="flex items-baseline gap-1.5">
                <span className="font-serif-editorial font-bold text-base sm:text-lg tracking-tight text-[var(--text-primary)]">
                  DoubanLens
                </span>
                <span className="hidden sm:inline text-xs text-[var(--text-muted)] font-serif-editorial">
                  豆瓣棱镜
                </span>
              </div>
              {dataset && (
                <p className="text-[11px] text-[var(--text-muted)] truncate max-w-[160px] sm:max-w-[220px]">
                  {dataset.name} · <span className="font-mono-num">{dataset.records.length}</span> 条记录
                </p>
              )}
            </div>
          </button>
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onOpenAgentGuide}
            className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-[var(--bg-card)] border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--border-strong)] transition cursor-pointer"
          >
            <Bot className="w-3.5 h-3.5 text-[var(--accent)]" />
            <span>Agent 导出指南</span>
          </button>

          <button
            type="button"
            onClick={onOpenAiSettings}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition cursor-pointer ${
              hasKey
                ? 'bg-[var(--accent-soft)] border-[var(--accent)]/30 text-[var(--accent-text)]'
                : 'bg-[var(--bg-card)] border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{hasKey ? 'AI 已配置' : '配置 AI'}</span>
          </button>

          {dataset && (
            <button
              type="button"
              onClick={onResetUpload}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-[var(--bg-card)] border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition cursor-pointer"
              title="更换数据文件"
            >
              <Upload className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">换文件</span>
            </button>
          )}

          <button
            type="button"
            onClick={onToggleTheme}
            className="w-9 h-9 rounded-xl bg-[var(--bg-card)] border border-[var(--border-subtle)] flex items-center justify-center text-[var(--text-primary)] hover:border-[var(--border-strong)] transition cursor-pointer"
            title={theme === 'light' ? '切换到暗夜黑胶风' : '切换到复古杂志亮色风'}
            aria-label="切换明暗主题"
          >
            {theme === 'light' ? (
              <Moon className="w-4 h-4 text-[var(--text-secondary)]" />
            ) : (
              <Sun className="w-4 h-4 text-[var(--gold)]" />
            )}
          </button>
        </div>
      </div>

      {/* Sub-navigation Tabs when dataset is loaded */}
      {dataset && (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 pb-2.5">
          <nav className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-0.5">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const active = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onSelectTab(item.id)}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-medium whitespace-nowrap transition cursor-pointer ${
                    active
                      ? 'bg-[var(--accent)] text-white shadow-sm'
                      : 'text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{item.label}</span>
                  <span className="sm:hidden">{item.shortLabel}</span>
                </button>
              );
            })}
          </nav>
        </div>
      )}
    </header>
  );
}

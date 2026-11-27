import { useMemo, useState } from 'react';
import type {
  ActiveTab,
  AiClashVerdict,
  AiConfig,
  AiGachaPick,
  AiPersonaResult,
  AiTimelineResult,
  UserDataset,
} from './types/douban';
import { useTheme } from './hooks/useTheme';
import { computeOverviewStats } from './utils/analytics';
import { loadAiConfig, saveAiConfig } from './utils/ai';
import { getDemoMainDataset } from './utils/demoData';
import { Header } from './components/Header';
import { LandingHero } from './components/LandingHero';
import { OverviewStrip } from './components/OverviewStrip';
import { HeatmapView } from './components/HeatmapView';
import { TimelineView } from './components/TimelineView';
import { RedBlackWall } from './components/RedBlackWall';
import { GachaPicker } from './components/GachaPicker';
import { TasteClash } from './components/TasteClash';
import { AiSettingsModal } from './components/AiSettingsModal';
import { AgentGuideModal } from './components/AgentGuideModal';

export default function App() {
  const { theme, toggleTheme } = useTheme();
  const [dataset, setDataset] = useState<UserDataset | null>(null);
  const [friendDataset, setFriendDataset] = useState<UserDataset | null>(null);
  const [activeTab, setActiveTab] = useState<ActiveTab>('heatmap');

  const [aiConfig, setAiConfig] = useState<AiConfig>(() => loadAiConfig());
  const [aiSettingsOpen, setAiSettingsOpen] = useState(false);
  const [agentGuideOpen, setAgentGuideOpen] = useState(false);

  // Per-session AI results
  const [aiTimeline, setAiTimeline] = useState<AiTimelineResult | null>(null);
  const [aiPersona, setAiPersona] = useState<AiPersonaResult | null>(null);
  const [aiGachaPicks, setAiGachaPicks] = useState<AiGachaPick[] | null>(null);
  const [aiClashVerdict, setAiClashVerdict] = useState<AiClashVerdict | null>(null);

  const stats = useMemo(
    () => (dataset ? computeOverviewStats(dataset.records) : null),
    [dataset]
  );

  const handleLoadDataset = (ds: UserDataset) => {
    setDataset(ds);
    setAiTimeline(null);
    setAiPersona(null);
    setAiGachaPicks(null);
    setAiClashVerdict(null);
    setActiveTab('heatmap');
  };

  const handleLoadDemo = () => {
    handleLoadDataset(getDemoMainDataset());
  };

  const handleSaveAiConfig = (cfg: AiConfig) => {
    setAiConfig(cfg);
    saveAiConfig(cfg);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header
        dataset={dataset}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        theme={theme}
        onToggleTheme={toggleTheme}
        aiConfig={aiConfig}
        onOpenAiSettings={() => setAiSettingsOpen(true)}
        onOpenAgentGuide={() => setAgentGuideOpen(true)}
        onResetUpload={() => setDataset(null)}
      />

      <div className="flex-1">
        {!dataset || !stats ? (
          <LandingHero
            onDatasetLoaded={handleLoadDataset}
            onLoadDemo={handleLoadDemo}
            onOpenAgentGuide={() => setAgentGuideOpen(true)}
          />
        ) : (
          <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
            <OverviewStrip stats={stats} />

            {activeTab === 'heatmap' && (
              <HeatmapView records={dataset.records} years={stats.years} />
            )}

            {activeTab === 'timeline' && (
              <TimelineView
                dataset={dataset}
                aiConfig={aiConfig}
                aiResult={aiTimeline}
                onAiResult={setAiTimeline}
                onOpenAiSettings={() => setAiSettingsOpen(true)}
              />
            )}

            {activeTab === 'wall' && (
              <RedBlackWall
                dataset={dataset}
                theme={theme}
                aiConfig={aiConfig}
                aiPersona={aiPersona}
                onAiPersona={setAiPersona}
                onOpenAiSettings={() => setAiSettingsOpen(true)}
              />
            )}

            {activeTab === 'gacha' && (
              <GachaPicker
                dataset={dataset}
                aiConfig={aiConfig}
                aiPicks={aiGachaPicks}
                onAiPicks={setAiGachaPicks}
                onOpenAiSettings={() => setAiSettingsOpen(true)}
              />
            )}

            {activeTab === 'clash' && (
              <TasteClash
                dataset={dataset}
                friendDataset={friendDataset}
                onFriendDataset={setFriendDataset}
                theme={theme}
                aiConfig={aiConfig}
                aiVerdict={aiClashVerdict}
                onAiVerdict={setAiClashVerdict}
                onOpenAiSettings={() => setAiSettingsOpen(true)}
              />
            )}
          </main>
        )}
      </div>

      <footer className="border-t border-[var(--border-subtle)] mt-12 py-6">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-[var(--text-muted)]">
          <span>
            DoubanLens · 豆瓣棱镜 — 纯前端静态应用，所有数据均在浏览器本地解析计算
          </span>
          <span>支持 GitHub Pages / Vercel 零成本静态部署</span>
        </div>
      </footer>

      <AiSettingsModal
        open={aiSettingsOpen}
        config={aiConfig}
        onSave={handleSaveAiConfig}
        onClose={() => setAiSettingsOpen(false)}
      />

      <AgentGuideModal
        open={agentGuideOpen}
        onClose={() => setAgentGuideOpen(false)}
      />
    </div>
  );
}

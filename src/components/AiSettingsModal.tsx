import { useState } from 'react';
import { Check, Eye, EyeOff, KeyRound, ShieldCheck, X } from 'lucide-react';
import type { AiConfig } from '../types/douban';
import { AI_PRESETS } from '../utils/ai';

interface AiSettingsModalProps {
  open: boolean;
  config: AiConfig;
  onSave: (config: AiConfig) => void;
  onClose: () => void;
}

export function AiSettingsModal({ open, config, onSave, onClose }: AiSettingsModalProps) {
  const [draft, setDraft] = useState<AiConfig>(config);
  const [showKey, setShowKey] = useState(false);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/55 backdrop-blur-sm">
      <div className="card-surface rounded-3xl max-w-lg w-full p-6 space-y-5 relative animate-gacha-pop">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 w-8 h-8 rounded-full flex items-center justify-center text-[var(--text-muted)] hover:bg-[var(--bg-subtle)] cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="space-y-1">
          <div className="flex items-center gap-2 text-[var(--accent)]">
            <KeyRound className="w-5 h-5" />
            <h2 className="font-serif-editorial text-xl font-bold text-[var(--text-primary)]">
              配置大模型接口（BYOK）
            </h2>
          </div>
          <p className="text-xs text-[var(--text-secondary)]">
            你的 API Key 仅保存在当前浏览器 <code className="font-mono-num">localStorage</code>，请求由浏览器直连模型服务商，不经过任何第三方服务器。
          </p>
        </div>

        {/* Presets */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-[var(--text-secondary)]">快捷服务商预设</label>
          <div className="flex flex-wrap gap-1.5">
            {AI_PRESETS.map((p) => {
              const selected = draft.baseUrl === p.baseUrl;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() =>
                    setDraft((prev) => ({
                      ...prev,
                      baseUrl: p.baseUrl,
                      model: p.defaultModel,
                    }))
                  }
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition cursor-pointer ${
                    selected
                      ? 'bg-[var(--accent-soft)] border-[var(--accent)] text-[var(--accent-text)]'
                      : 'bg-[var(--bg-subtle)] border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                  title={p.hint}
                >
                  {p.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
              API Base URL（OpenAI 兼容端点）
            </label>
            <input
              type="text"
              value={draft.baseUrl}
              onChange={(e) => setDraft({ ...draft, baseUrl: e.target.value })}
              placeholder="https://api.deepseek.com/v1"
              className="w-full px-3.5 py-2.5 rounded-xl text-xs font-mono-num bg-[var(--bg-subtle)] border border-[var(--border-subtle)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
              模型名称（Model ID）
            </label>
            <input
              type="text"
              value={draft.model}
              onChange={(e) => setDraft({ ...draft, model: e.target.value })}
              placeholder="deepseek-chat / gpt-4o-mini / gemini-2.5-flash"
              className="w-full px-3.5 py-2.5 rounded-xl text-xs font-mono-num bg-[var(--bg-subtle)] border border-[var(--border-subtle)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
              API Key
            </label>
            <div className="relative">
              <input
                type={showKey ? 'text' : 'password'}
                value={draft.apiKey}
                onChange={(e) => setDraft({ ...draft, apiKey: e.target.value })}
                placeholder="sk-..."
                className="w-full pr-10 px-3.5 py-2.5 rounded-xl text-xs font-mono-num bg-[var(--bg-subtle)] border border-[var(--border-subtle)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]"
              />
              <button
                type="button"
                onClick={() => setShowKey((s) => !s)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
              >
                {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>

        <div className="flex items-start gap-2 p-3 rounded-xl bg-[var(--accent-soft)]/60 text-xs text-[var(--accent-text)]">
          <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5" />
          <span>
            <strong>没有 API Key 也可以正常使用。</strong>每个 AI 模块均提供「复制 Prompt（免 Key）」按钮，可粘贴到任意网页版对话模型运行后再贴回 JSON 展示。
          </span>
        </div>

        <div className="flex items-center justify-end gap-2 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)] cursor-pointer"
          >
            取消
          </button>
          <button
            type="button"
            onClick={() => {
              onSave(draft);
              onClose();
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-[var(--accent)] text-white hover:opacity-90 cursor-pointer"
          >
            <Check className="w-3.5 h-3.5" />
            保存配置
          </button>
        </div>
      </div>
    </div>
  );
}

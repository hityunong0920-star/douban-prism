import { useState } from 'react';
import {
  Check,
  ClipboardCopy,
  KeyRound,
  Loader2,
  Sparkles,
  Wand2,
} from 'lucide-react';
import type { AiConfig } from '../types/douban';
import { callAiJson, extractJsonFromText } from '../utils/ai';

interface AiActionBridgeProps<T> {
  aiConfig: AiConfig;
  buttonLabel: string;
  description: string;
  buildPrompt: () => string;
  onResult: (data: T) => void;
  onOpenSettings: () => void;
  compact?: boolean;
}

export function AiActionBridge<T>({
  aiConfig,
  buttonLabel,
  description,
  buildPrompt,
  onResult,
  onOpenSettings,
  compact = false,
}: AiActionBridgeProps<T>) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showManual, setShowManual] = useState(false);
  const [copied, setCopied] = useState(false);
  const [pastedJson, setPastedJson] = useState('');

  const hasKey = Boolean(aiConfig.apiKey.trim());

  const handleRunApi = async () => {
    setError(null);
    if (!hasKey) {
      onOpenSettings();
      return;
    }
    setLoading(true);
    try {
      const prompt = buildPrompt();
      const result = await callAiJson<T>(aiConfig, prompt);
      onResult(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'AI 调用失败');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyPrompt = async () => {
    try {
      const prompt = buildPrompt();
      await navigator.clipboard.writeText(prompt);
      setCopied(true);
      setShowManual(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      setError('剪贴板写入失败，请检查浏览器权限。');
    }
  };

  const handleApplyPasted = () => {
    setError(null);
    if (!pastedJson.trim()) {
      setError('请先粘贴 AI 返回的 JSON 内容');
      return;
    }
    try {
      const parsed = extractJsonFromText<T>(pastedJson);
      onResult(parsed);
      setShowManual(false);
      setPastedJson('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'JSON 解析失败');
    }
  };

  return (
    <div
      className={`rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-subtle)]/70 ${
        compact ? 'p-3.5' : 'p-4 sm:p-5'
      }`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2 text-sm font-semibold text-[var(--text-primary)]">
            <Sparkles className="w-4 h-4 text-[var(--accent)]" />
            <span>AI 辅助总结</span>
            <span className="text-[11px] font-normal px-2 py-0.5 rounded-full bg-[var(--accent-soft)] text-[var(--accent-text)]">
              {hasKey ? `已配置 ${aiConfig.model}` : '支持 API Key 或手动复制 Prompt'}
            </span>
          </div>
          <p className="text-xs text-[var(--text-secondary)]">{description}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleRunApi}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-[var(--accent)] text-white hover:opacity-90 transition cursor-pointer disabled:opacity-60"
          >
            {loading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : hasKey ? (
              <Wand2 className="w-3.5 h-3.5" />
            ) : (
              <KeyRound className="w-3.5 h-3.5" />
            )}
            {loading ? '正在分析...' : hasKey ? buttonLabel : '配置 API Key 生成'}
          </button>

          <button
            type="button"
            onClick={handleCopyPrompt}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium bg-[var(--bg-card)] border border-[var(--border-subtle)] text-[var(--text-primary)] hover:border-[var(--border-strong)] transition cursor-pointer"
            title="没有 API Key 时，可复制 Prompt 发送给任意网页版 AI，再将返回的 JSON 粘贴回来展示"
          >
            {copied ? (
              <Check className="w-3.5 h-3.5 text-[var(--accent)]" />
            ) : (
              <ClipboardCopy className="w-3.5 h-3.5 text-[var(--text-secondary)]" />
            )}
            {copied ? '已复制 Prompt' : '复制 Prompt（免 Key）'}
          </button>
        </div>
      </div>

      {showManual && (
        <div className="mt-3.5 pt-3.5 border-t border-[var(--border-subtle)] space-y-2.5">
          <p className="text-xs text-[var(--text-secondary)]">
            已将完整 Prompt 复制到剪贴板！把它粘贴到任意网页版 AI（DeepSeek / ChatGPT / Claude / Gemini），再将返回的 JSON 贴进下方即可渲染：
          </p>
          <textarea
            rows={4}
            value={pastedJson}
            onChange={(e) => setPastedJson(e.target.value)}
            placeholder='粘贴 AI 返回的 JSON（带 ```json 代码块也没关系）...'
            className="w-full rounded-xl p-3 text-xs font-mono-num bg-[var(--bg-card)] border border-[var(--border-subtle)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]"
          />
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowManual(false)}
              className="px-3 py-1.5 rounded-lg text-xs text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] cursor-pointer"
            >
              收起
            </button>
            <button
              type="button"
              onClick={handleApplyPasted}
              className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-[var(--accent)] text-white hover:opacity-90 cursor-pointer"
            >
              解析并渲染卡片
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="mt-3 text-xs text-[var(--crimson)] bg-[var(--crimson-soft)] px-3 py-2 rounded-xl">
          {error}
        </div>
      )}
    </div>
  );
}

import { useState } from 'react';
import { Bot, Check, ClipboardCopy, Download, X } from 'lucide-react';

interface AgentGuideModalProps {
  open: boolean;
  onClose: () => void;
}

const AGENT_PROMPT = `请帮我导出我的豆瓣个人书影音游完整记录（包含电影、读书、游戏、音乐的 看过/在看/想看、读过/在读/想读、玩过/在玩/想玩、听过/想听），并保存为一个 UTF-8 BOM 编码的 CSV 文件（文件名如：豆瓣记录_我的昵称.csv）。

采集方式建议：
1. 使用内置浏览器打开 https://www.douban.com/ 并等待我手动扫码登录（如已登录则直接进入我的主页）。
2. 在我已登录的浏览器会话内，以温和节奏（每页间隔 1~2 秒）分页读取 DOM 提取所有记录，避免触发反爬验证；如遇验证码或登录跳转则暂停由我手工点击。
3. CSV 严格使用以下 8 列标准表头：
分类,状态,标题,评分,标记日期,标签,短评,链接

字段规范：
- 分类：电影 / 读书 / 游戏 / 音乐
- 状态：看过 / 在看 / 想看 / 读过 / 在读 / 想读 / 玩过 / 在玩 / 想玩 / 听过 / 想听
- 评分：5星 / 4星 / 3星 / 2星 / 1星 / 未评分
- 标记日期：YYYY-MM-DD
- 链接：完整豆瓣条目 URL（用于精确去重与双人碰撞）`;

const SAMPLE_CSV = `分类,状态,标题,评分,标记日期,标签,短评,链接
电影,看过,2001太空漫游 / 2001: A Space Odyssey,5星,2026-11-24,,服化道让人惊叹,https://movie.douban.com/subject/1292226/
读书,读过,置身事内,5星,2026-10-05,,财政逻辑讲透了,https://book.douban.com/subject/35546622/
游戏,玩过,领主 Suzerain,5星,2026-09-02,,硬核政治模拟器,https://www.douban.com/game/35196662/
音乐,听过,万能青年旅店,5星,2026-11-01,,小号一响鸡皮疙瘩起来了,https://music.douban.com/subject/5365226/`;

export function AgentGuideModal({ open, onClose }: AgentGuideModalProps) {
  const [copied, setCopied] = useState(false);

  if (!open) return null;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(AGENT_PROMPT);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadTemplate = () => {
    const blob = new Blob(['\uFEFF' + SAMPLE_CSV], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = '豆瓣记录_标准模板.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/55 backdrop-blur-sm">
      <div className="card-surface rounded-3xl max-w-2xl w-full max-h-[88vh] overflow-y-auto p-6 space-y-5 relative animate-gacha-pop">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 w-8 h-8 rounded-full flex items-center justify-center text-[var(--text-muted)] hover:bg-[var(--bg-subtle)] cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="space-y-1">
          <div className="flex items-center gap-2 text-[var(--accent)]">
            <Bot className="w-5 h-5" />
            <h2 className="font-serif-editorial text-xl font-bold text-[var(--text-primary)]">
              用 AI Agent 优雅导出你的豆瓣数据
            </h2>
          </div>
          <p className="text-xs text-[var(--text-secondary)]">
            豆瓣反爬严格，与其自己折腾 Cookie 和爬虫脚本，不如直接交给具备浏览器操作能力的 AI Agent（Antigravity / Claude Code / Codex / OpenClaw）在你已登录的真实浏览器里温和抓取！
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
          <div className="subtle-surface rounded-2xl p-3.5 space-y-1">
            <div className="font-mono-num text-[var(--accent)] font-bold">STEP 01</div>
            <div className="font-semibold text-[var(--text-primary)]">复制下方提示词</div>
            <p className="text-[var(--text-secondary)]">发给 Antigravity / Claude Code / Codex，或直接安装本仓库根目录的 SKILL.md。</p>
          </div>
          <div className="subtle-surface rounded-2xl p-3.5 space-y-1">
            <div className="font-mono-num text-[var(--accent)] font-bold">STEP 02</div>
            <div className="font-semibold text-[var(--text-primary)]">登录浏览器自动导出</div>
            <p className="text-[var(--text-secondary)]">扫码登录后，Agent 复现真实浏览节奏，几分钟内生成标准 8 列 CSV。</p>
          </div>
          <div className="subtle-surface rounded-2xl p-3.5 space-y-1">
            <div className="font-mono-num text-[var(--accent)] font-bold">STEP 03</div>
            <div className="font-semibold text-[var(--text-primary)]">拖回本页立即解锁</div>
            <p className="text-[var(--text-secondary)]">拖入 CSV / Excel / JSON（也兼容豆伴、douban-archive），纯本地渲染。</p>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[var(--text-primary)]">
              一键复制给 Agent 的采集指令
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleDownloadTemplate}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs bg-[var(--bg-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                下载 CSV 模板
              </button>
              <button
                type="button"
                onClick={handleCopy}
                className="inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-semibold bg-[var(--accent)] text-white hover:opacity-90 cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <ClipboardCopy className="w-3.5 h-3.5" />}
                {copied ? '已复制指令' : '复制指令'}
              </button>
            </div>
          </div>
          <pre className="p-4 rounded-2xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)] text-xs font-mono-num text-[var(--text-secondary)] whitespace-pre-wrap leading-relaxed max-h-56 overflow-y-auto">
            {AGENT_PROMPT}
          </pre>
        </div>
      </div>
    </div>
  );
}

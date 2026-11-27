import type { AiConfig, UserDataset } from '../types/douban';
import {
  computeOverviewStats,
  computeRedBlackWall,
  computeYearlyEvolution,
  type TasteClashResult,
  type WishlistCandidate,
} from './analytics';

const AI_CONFIG_KEY = 'douban-prism-ai-config';

export interface AiPreset {
  id: string;
  label: string;
  baseUrl: string;
  defaultModel: string;
  hint: string;
}

export const AI_PRESETS: AiPreset[] = [
  {
    id: 'deepseek',
    label: 'DeepSeek',
    baseUrl: 'https://api.deepseek.com/v1',
    defaultModel: 'deepseek-chat',
    hint: '中文文学感与锐评性价比极高',
  },
  {
    id: 'openai',
    label: 'OpenAI',
    baseUrl: 'https://api.openai.com/v1',
    defaultModel: 'gpt-4o-mini',
    hint: '结构化 JSON 输出极稳',
  },
  {
    id: 'gemini',
    label: 'Gemini (OpenAI 兼容)',
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai',
    defaultModel: 'gemini-2.5-flash',
    hint: '长上下文吞吐极快，有免费额度',
  },
  {
    id: 'openrouter',
    label: 'OpenRouter',
    baseUrl: 'https://openrouter.ai/api/v1',
    defaultModel: 'anthropic/claude-3.5-sonnet',
    hint: '一个 Key 调用 Claude / Gemini / GPT',
  },
  {
    id: 'moonshot',
    label: 'Kimi (Moonshot)',
    baseUrl: 'https://api.moonshot.cn/v1',
    defaultModel: 'moonshot-v1-8k',
    hint: '国内直连稳定',
  },
];

export function loadAiConfig(): AiConfig {
  try {
    const sessionRaw = window.sessionStorage.getItem(AI_CONFIG_KEY);
    if (sessionRaw) {
      const parsed = JSON.parse(sessionRaw);
      return {
        baseUrl: parsed.baseUrl || AI_PRESETS[0].baseUrl,
        apiKey: parsed.apiKey || '',
        model: parsed.model || AI_PRESETS[0].defaultModel,
        rememberKey: Boolean(parsed.rememberKey),
      };
    }
    const localRaw = window.localStorage.getItem(AI_CONFIG_KEY);
    if (localRaw) {
      const parsed = JSON.parse(localRaw);
      return {
        baseUrl: parsed.baseUrl || AI_PRESETS[0].baseUrl,
        apiKey: parsed.apiKey || '',
        model: parsed.model || AI_PRESETS[0].defaultModel,
        rememberKey: true,
      };
    }
  } catch {
    // ignore
  }
  return {
    baseUrl: AI_PRESETS[0].baseUrl,
    apiKey: '',
    model: AI_PRESETS[0].defaultModel,
    rememberKey: false,
  };
}

export function saveAiConfig(config: AiConfig): void {
  const payload = JSON.stringify({
    baseUrl: config.baseUrl,
    apiKey: config.apiKey,
    model: config.model,
    rememberKey: Boolean(config.rememberKey),
  });
  window.sessionStorage.setItem(AI_CONFIG_KEY, payload);
  if (config.rememberKey && config.apiKey.trim()) {
    window.localStorage.setItem(AI_CONFIG_KEY, payload);
  } else {
    window.localStorage.removeItem(AI_CONFIG_KEY);
  }
}

export function clearStoredAiKey(): void {
  window.sessionStorage.removeItem(AI_CONFIG_KEY);
  window.localStorage.removeItem(AI_CONFIG_KEY);
}

export function extractJsonFromText<T>(rawText: string): T {
  const trimmed = rawText.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced ? fenced[1].trim() : trimmed;
  try {
    return JSON.parse(candidate) as T;
  } catch {
    const firstBrace = candidate.indexOf('{');
    const firstBracket = candidate.indexOf('[');
    let start = -1;
    let end = -1;
    if (firstBracket !== -1 && (firstBrace === -1 || firstBracket < firstBrace)) {
      start = firstBracket;
      end = candidate.lastIndexOf(']');
    } else if (firstBrace !== -1) {
      start = firstBrace;
      end = candidate.lastIndexOf('}');
    }
    if (start !== -1 && end > start) {
      return JSON.parse(candidate.slice(start, end + 1)) as T;
    }
    throw new Error('未能解析 AI 返回的 JSON，请确认粘贴内容包含完整 JSON 对象。');
  }
}

export async function callAiJson<T>(config: AiConfig, prompt: string): Promise<T> {
  if (!config.apiKey.trim()) {
    throw new Error('请先配置 API Key，或使用「免 Key 复制 Prompt」模式！');
  }
  const endpoint = `${config.baseUrl.replace(/\/+$/, '')}/chat/completions`;
  const resp = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.apiKey.trim()}`,
    },
    body: JSON.stringify({
      model: config.model.trim() || 'deepseek-chat',
      temperature: 0.7,
      messages: [
        {
          role: 'system',
          content:
            '你是熟悉电影、书籍、音乐与游戏的文化评论人。行文平实、克制、切中要害，紧扣具体作品和用户真实短评进行分析；严禁使用网络流行热词、营销号夸张修辞或算命式标签。请严格只输出合法 JSON，不要附带多余解释。',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
    }),
  });

  if (!resp.ok) {
    const errText = await resp.text().catch(() => '');
    throw new Error(`AI 请求失败 (${resp.status})：${errText.slice(0, 180) || resp.statusText}`);
  }

  const data = await resp.json();
  const content: string = data?.choices?.[0]?.message?.content || '';
  if (!content) {
    throw new Error('AI 返回内容为空，请检查模型名称或接口配置。');
  }
  return extractJsonFromText<T>(content);
}

// ==========================================
// Prompt Builders (also usable in Zero-Key Copy/Paste Mode!)
// ==========================================

export function buildTimelinePrompt(dataset: UserDataset): string {
  const yearly = computeYearlyEvolution(dataset.records);
  const digest = yearly.map((y) => ({
    year: String(y.year),
    total: y.total,
    avgRating: y.avgRating,
    categories: y.byCategory,
    fiveStars: y.fiveStarHighlights.slice(0, 12).map((r) =>
      r.comment ? `${r.category}《${r.shortTitle}》(${r.comment.slice(0, 40)})` : `${r.category}《${r.shortTitle}》`
    ),
    roasts: y.roastHighlights.slice(0, 5).map((r) =>
      r.comment ? `${r.category}《${r.shortTitle}》${r.rating}★(${r.comment.slice(0, 40)})` : `${r.category}《${r.shortTitle}》${r.rating}★`
    ),
  }));

  return `请根据以下豆瓣用户「${dataset.name}」历年书影音游标记摘要，按年份切片撰写一份《品味演进编年史》。
要求：
1. 捕捉每一年兴趣重心的迁移、跨媒介主题暗线和审美取向的变化；
2. 紧扣用户真实短评与具体作品名展开，语言平实克制，不用网络热词和空洞套话；
3. 严格按以下 JSON 格式输出（不要输出 JSON 以外的多余文字）：
{
  "overallArc": "120字以内总结这几年的整体审美演进脉络",
  "periods": [
    {
      "year": "2026",
      "eraTitle": "4-8字的年度阶段标题（如：制度解剖与历史阅读）",
      "summary": "80-120字，点出具体作品和年度文化状态",
      "keywords": ["关键词1", "关键词2", "关键词3"],
      "turningPoint": "30字以内点出这一年最显著的口味变化或代表作"
    }
  ]
}

年度数据摘要：
${JSON.stringify(digest, null, 2)}`;
}

export function buildPersonaPrompt(dataset: UserDataset): string {
  const stats = computeOverviewStats(dataset.records);
  const wall = computeRedBlackWall(dataset.records, '全部');

  const payload = {
    user: dataset.name,
    overview: stats.categories.map((c) => `${c.category}:${c.total}条(均分${c.avgRating})`),
    fiveStarSamples: wall.favorites.slice(0, 35).map((r) =>
      r.comment ? `[${r.category}]《${r.shortTitle}》—"${r.comment.slice(0, 50)}"` : `[${r.category}]《${r.shortTitle}》`
    ),
    roastSamples: wall.roasts.slice(0, 25).map((r) =>
      r.comment ? `[${r.category}]《${r.shortTitle}》(${r.rating}★)—"${r.comment.slice(0, 50)}"` : `[${r.category}]《${r.shortTitle}》(${r.rating}★)`
    ),
  };

  return `请根据豆瓣用户「${dataset.name}」的 5★ 高分记录与 1–2★ 低分记录，梳理其跨媒介品味画像与主要审美雷区。
要求：语言克制、平实、切中要害，紧扣具体作品与真实短评，不使用网络热词或算命式标签。
严格只输出以下 JSON：
{
  "archetype": "5-10字的品味画像概括（如：制度史与现实主义偏好者）",
  "tagline": "35字以内的一句话核心评价",
  "coreLines": ["核心审美暗线1（30字内）", "核心审美暗线2", "核心审美暗线3"],
  "redLines": ["主要审美雷区1（25字内）", "主要审美雷区2", "主要审美雷区3"],
  "roastStyle": "45字以内客观概括其打 1–2★ 时的关注点与短评表达特点"
}

样本数据：
${JSON.stringify(payload, null, 2)}`;
}

export function buildGachaPrompt(
  dataset: UserDataset,
  moodInput: string,
  candidates: WishlistCandidate[]
): string {
  const wall = computeRedBlackWall(dataset.records, '全部');
  const likedSample = wall.favorites.slice(0, 15).map((r) => `${r.category}《${r.shortTitle}》`);
  const dislikedSample = wall.roasts.slice(0, 10).map((r) => `${r.category}《${r.shortTitle}》`);
  // Shuffle and cap to 90 candidates to keep prompt compact & fresh
  const shuffled = [...candidates].sort(() => Math.random() - 0.5).slice(0, 90);
  const poolText = shuffled.map(
    (c) => `[${c.category}|${c.status}${c.dustDays ? `|已收藏${c.dustDays}天` : ''}] ${c.shortTitle}`
  );

  return `用户「${dataset.name}」想从自己的豆瓣愿望单里选一部近期观看或阅读的作品。
用户当前需求：「${moodInput || '请挑选最契合过往高分品味的作品'}」

参考过往 5★ 作品：${likedSample.join('、')}
参考过往 1–2★ 作品：${dislikedSample.join('、')}

请**严格只从下方候选愿望单列表中**挑选 3 个最匹配的作品（不要编造清单外的作品），语言克制平实，严格输出 JSON 数组：
[
  {
    "title": "候选清单中的原作品名",
    "category": "电影/读书/游戏/音乐",
    "vibeTag": "3-6字气质标签（如：冷峻写实 / 精密推理）",
    "reason": "60字以内结合过往品味与当前需求说明推荐理由"
  }
]

候选愿望单（共 ${poolText.length} 项）：
${poolText.join('\n')}`;
}

export function buildClashPrompt(clash: TasteClashResult): string {
  const payload = {
    userA: clash.userAName,
    userB: clash.userBName,
    compatibilityScore: clash.compatibilityScore,
    sharedTotal: clash.sharedTotal,
    avgRatingDiff: clash.avgRatingDiff,
    sharedFavorites: clash.sharedFavorites.slice(0, 10).map((p) => `${p.category}《${p.shortTitle}》`),
    spicyDisagreements: clash.spicyDisagreements.slice(0, 8).map((p) => ({
      title: `${p.category}《${p.shortTitle}》`,
      aRating: p.a.rating,
      aComment: p.a.comment.slice(0, 40),
      bRating: p.b.rating,
      bComment: p.b.comment.slice(0, 40),
    })),
    sharedWishlist: clash.sharedWishlist.slice(0, 8).map((p) => `${p.category}《${p.shortTitle}》`),
  };

  return `请根据豆瓣用户「${clash.userAName}」与「${clash.userBName}」的书影音游对比数据，撰写一份简短、客观、有洞察的口味异同点评。
要求：语言平实克制，可带一点温和幽默，但避免夸张网感词；严格只输出以下 JSON：
{
  "headline": "12字以内的关系概括标题",
  "compatibilityComment": "90字以内分析两人的共同取向与审美差异",
  "fightPrediction": "70字以内点出两人评分分歧背后的视角差异（可举 1–2 部具体作品）",
  "weekendPlan": "70字以内基于共同愿望单或共同偏好，推荐适合一起观看或阅读的作品"
}

对比数据：
${JSON.stringify(payload, null, 2)}`;
}

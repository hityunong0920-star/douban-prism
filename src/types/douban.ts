export type Category = '电影' | '读书' | '游戏' | '音乐';

export type StatusGroup = 'done' | 'doing' | 'wish';

export interface DoubanRecord {
  id: string;              // Canonical matching key: e.g., "movie:1292226" or normalized title
  category: Category;
  status: string;          // 原状态：看过 / 在看 / 想看 / 读过 / 在读 / 想读 / 玩过 / 在玩 / 想玩 / 听过 / 想听
  statusGroup: StatusGroup;
  title: string;           // 完整标题
  shortTitle: string;      // 主标题（首个 " / " 之前）
  rating: number | null;   // 1..5 或 null（未评分）
  date: string | null;     // YYYY-MM-DD 或 null
  year: number | null;
  tags: string[];
  comment: string;
  url: string;
}

export interface UserDataset {
  name: string;
  sourceFileName: string;
  records: DoubanRecord[];
  loadedAt: string;
}

export interface AiConfig {
  baseUrl: string;
  apiKey: string;
  model: string;
}

export interface AiTimelinePeriod {
  year: string;
  eraTitle: string;
  summary: string;
  keywords: string[];
  turningPoint: string;
}

export interface AiTimelineResult {
  overallArc: string;
  periods: AiTimelinePeriod[];
}

export interface AiPersonaResult {
  archetype: string;       // e.g. "冷峻制度解构者"
  tagline: string;         // 一句话判词
  coreLines: string[];     // 3-4 条审美暗线
  redLines: string[];      // 3 条绝对雷区
  roastStyle: string;      // 毒舌风格总结
}

export interface AiGachaPick {
  title: string;
  category: string;
  reason: string;
  vibeTag: string;
}

export interface AiClashVerdict {
  headline: string;
  compatibilityComment: string;
  fightPrediction: string;
  weekendPlan: string;
}

export type ActiveTab = 'heatmap' | 'timeline' | 'wall' | 'gacha' | 'clash';

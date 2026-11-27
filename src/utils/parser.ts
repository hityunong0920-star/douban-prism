import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import type { Category, DoubanRecord, StatusGroup, UserDataset } from '../types/douban';

const RATING_TEXT_MAP: Record<string, number> = {
  '5': 5,
  '5星': 5,
  '力荐': 5,
  '★★★★★': 5,
  '4': 4,
  '4星': 4,
  '推荐': 4,
  '★★★★': 4,
  '3': 3,
  '3星': 3,
  '还行': 3,
  '★★★': 3,
  '2': 2,
  '2星': 2,
  '较差': 2,
  '★★': 2,
  '1': 1,
  '1星': 1,
  '很差': 1,
  '★': 1,
};

function normalizeRating(raw: unknown): number | null {
  if (raw === null || raw === undefined) return null;
  if (typeof raw === 'number') {
    if (raw >= 1 && raw <= 5) return Math.round(raw);
    if (raw > 5 && raw <= 10) return Math.max(1, Math.min(5, Math.round(raw / 2)));
    return null;
  }
  const str = String(raw).trim();
  if (!str || str === '未评分' || str === '-' || str.toLowerCase() === 'null') return null;
  if (RATING_TEXT_MAP[str] !== undefined) return RATING_TEXT_MAP[str];
  const m = str.match(/([1-5])(?:\.0)?\s*星?/);
  if (m) return Number(m[1]);
  return null;
}

function normalizeDate(raw: unknown): string | null {
  if (!raw) return null;
  if (raw instanceof Date && !Number.isNaN(raw.getTime())) {
    return raw.toISOString().slice(0, 10);
  }
  // Excel serial date
  if (typeof raw === 'number' && raw > 25000 && raw < 60000) {
    const utcDays = Math.floor(raw - 25569);
    const d = new Date(utcDays * 86400 * 1000);
    if (!Number.isNaN(d.getTime())) return d.toISOString().slice(0, 10);
  }
  const str = String(raw).trim();
  const match = str.match(/(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);
  if (!match) return null;
  const [, y, m, d] = match;
  return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
}

function normalizeCategory(rawCat: unknown, rawStatus: string, url: string): Category {
  const s = String(rawCat ?? '').trim().toLowerCase();
  if (s.includes('影') || s.includes('剧') || s.includes('movie') || s.includes('film') || s.includes('tv')) return '电影';
  if (s.includes('书') || s.includes('读') || s.includes('book')) return '读书';
  if (s.includes('游') || s.includes('game')) return '游戏';
  if (s.includes('音') || s.includes('乐') || s.includes('music')) return '音乐';

  if (url.includes('movie.douban.com')) return '电影';
  if (url.includes('book.douban.com')) return '读书';
  if (url.includes('music.douban.com')) return '音乐';
  if (url.includes('/game/')) return '游戏';

  if (rawStatus.includes('读')) return '读书';
  if (rawStatus.includes('玩')) return '游戏';
  if (rawStatus.includes('听')) return '音乐';
  return '电影';
}

function normalizeStatusGroup(status: string): StatusGroup {
  const s = status.trim().toLowerCase();
  if (s.includes('想') || s === 'wish') return 'wish';
  if (s.includes('在') || s === 'do' || s === 'doing') return 'doing';
  return 'done';
}

function defaultStatusLabel(category: Category, group: StatusGroup): string {
  const verb = category === '读书' ? '读' : category === '游戏' ? '玩' : category === '音乐' ? '听' : '看';
  if (group === 'wish') return `想${verb}`;
  if (group === 'doing') return `在${verb}`;
  return `${verb}过`;
}

function extractCanonicalId(category: Category, shortTitle: string, url: string): string {
  if (url) {
    const mMovie = url.match(/movie\.douban\.com\/subject\/(\d+)/);
    if (mMovie) return `movie:${mMovie[1]}`;
    const mBook = url.match(/book\.douban\.com\/subject\/(\d+)/);
    if (mBook) return `book:${mBook[1]}`;
    const mMusic = url.match(/music\.douban\.com\/subject\/(\d+)/);
    if (mMusic) return `music:${mMusic[1]}`;
    const mGame = url.match(/douban\.com\/game\/(\d+)/);
    if (mGame) return `game:${mGame[1]}`;
    const mGeneric = url.match(/subject\/(\d+)/);
    if (mGeneric) return `${category}:${mGeneric[1]}`;
  }
  return `${category}:${shortTitle.toLowerCase().replace(/[\s:：·\-—《》()（）]/g, '')}`;
}

function parseTags(raw: unknown): string[] {
  if (!raw) return [];
  if (Array.isArray(raw)) {
    return raw.map((x) => String(x).trim()).filter(Boolean);
  }
  return String(raw)
    .split(/[\s,，;；/]+/)
    .map((t) => t.trim())
    .filter(Boolean);
}

function getField(row: Record<string, unknown>, candidates: string[]): unknown {
  for (const key of candidates) {
    if (row[key] !== undefined && row[key] !== null && String(row[key]).trim() !== '') {
      return row[key];
    }
  }
  // case-insensitive fallback
  const lowerKeys = Object.keys(row).reduce<Record<string, string>>((acc, k) => {
    acc[k.trim().toLowerCase()] = k;
    return acc;
  }, {});
  for (const c of candidates) {
    const found = lowerKeys[c.toLowerCase()];
    if (found && row[found] !== undefined && row[found] !== null && String(row[found]).trim() !== '') {
      return row[found];
    }
  }
  return '';
}

function mapRawRow(row: Record<string, unknown>, fallbackCategory?: Category): DoubanRecord | null {
  const titleRaw = getField(row, ['标题', 'title', 'name', '片名', '书名', '作品', '条目']);
  const title = String(titleRaw ?? '').trim();
  if (!title) return null;

  const url = String(getField(row, ['链接', 'url', 'link', '条目链接', 'subject_url', 'href']) ?? '').trim();
  const statusRaw = String(getField(row, ['状态', 'status', '标记状态', 'type_status']) ?? '').trim();
  const catRaw = getField(row, ['分类', 'category', 'type', '品类', '类型']) || fallbackCategory || '';
  const category = normalizeCategory(catRaw, statusRaw, url);
  const statusGroup = normalizeStatusGroup(statusRaw || 'done');
  const status = statusRaw && /[看读玩听]/.test(statusRaw) ? statusRaw : defaultStatusLabel(category, statusGroup);

  const shortTitle = title.split(/\s+\/\s+/)[0].trim() || title;
  const rating = normalizeRating(getField(row, ['评分', 'rating', 'score', '我的评分', '星级', 'star']));
  const date = normalizeDate(getField(row, ['标记日期', 'date', 'create_time', '创建时间', '打分日期', 'marked_at', 'time']));
  const year = date ? Number(date.slice(0, 4)) : null;
  const tags = parseTags(getField(row, ['标签', 'tags', 'tag', '我的标签']));
  const comment = String(getField(row, ['短评', 'comment', '评论', '我的短评', 'review', 'note']) ?? '').trim();
  const id = extractCanonicalId(category, shortTitle, url);

  return {
    id,
    category,
    status,
    statusGroup,
    title,
    shortTitle,
    rating,
    date,
    year,
    tags,
    comment,
    url,
  };
}

export function inferUserNameFromFileName(fileName: string): string {
  const base = fileName.replace(/\.(csv|json|xlsx|xls)$/i, '');
  const match = base.match(/(?:豆瓣记录|douban)[_\-\s]+(.+)$/i);
  if (match && match[1]) return match[1].trim();
  return base.trim() || '豆友';
}

export function parseCsvText(csvText: string, sourceName = '导入数据.csv', customName?: string): UserDataset {
  const parsed = Papa.parse<Record<string, unknown>>(csvText.replace(/^\uFEFF/, ''), {
    header: true,
    skipEmptyLines: true,
  });

  const records = parsed.data
    .map((row) => mapRawRow(row))
    .filter((r): r is DoubanRecord => r !== null);

  return {
    name: customName || inferUserNameFromFileName(sourceName),
    sourceFileName: sourceName,
    records,
    loadedAt: new Date().toISOString(),
  };
}

export function parseJsonText(jsonText: string, sourceName = '导入数据.json', customName?: string): UserDataset {
  const raw = JSON.parse(jsonText);
  const records: DoubanRecord[] = [];

  const pushArray = (arr: unknown[], fallbackCat?: Category) => {
    for (const item of arr) {
      if (item && typeof item === 'object') {
        const mapped = mapRawRow(item as Record<string, unknown>, fallbackCat);
        if (mapped) records.push(mapped);
      }
    }
  };

  if (Array.isArray(raw)) {
    pushArray(raw);
  } else if (raw && typeof raw === 'object') {
    const obj = raw as Record<string, unknown>;
    if (Array.isArray(obj.records)) pushArray(obj.records);
    if (Array.isArray(obj.items)) pushArray(obj.items);
    if (Array.isArray(obj.movies)) pushArray(obj.movies, '电影');
    if (Array.isArray(obj.books)) pushArray(obj.books, '读书');
    if (Array.isArray(obj.musics) || Array.isArray(obj.music)) {
      pushArray((obj.musics || obj.music) as unknown[], '音乐');
    }
    if (Array.isArray(obj.games)) pushArray(obj.games, '游戏');
  }

  return {
    name: customName || (typeof raw?.name === 'string' ? raw.name : inferUserNameFromFileName(sourceName)),
    sourceFileName: sourceName,
    records,
    loadedAt: new Date().toISOString(),
  };
}

export async function parseUploadedFile(file: File): Promise<UserDataset> {
  const ext = file.name.split('.').pop()?.toLowerCase() || '';

  if (ext === 'csv' || ext === 'txt') {
    const text = await file.text();
    const dataset = parseCsvText(text, file.name);
    if (dataset.records.length === 0) {
      throw new Error('未在 CSV 中解析到有效豆瓣记录，请确认表头包含「标题 / 分类 / 状态 / 评分」等字段。');
    }
    return dataset;
  }

  if (ext === 'json') {
    const text = await file.text();
    const dataset = parseJsonText(text, file.name);
    if (dataset.records.length === 0) {
      throw new Error('未在 JSON 中解析到有效豆瓣记录。');
    }
    return dataset;
  }

  if (ext === 'xlsx' || ext === 'xls') {
    const buf = await file.arrayBuffer();
    const workbook = XLSX.read(buf, { type: 'array', cellDates: true });
    const allRecords: DoubanRecord[] = [];

    for (const sheetName of workbook.SheetNames) {
      const sheet = workbook.Sheets[sheetName];
      const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' });
      const sheetCat =
        sheetName.includes('影') || sheetName.includes('剧')
          ? '电影'
          : sheetName.includes('书') || sheetName.includes('读')
            ? '读书'
            : sheetName.includes('游')
              ? '游戏'
              : sheetName.includes('音')
                ? '音乐'
                : undefined;

      for (const row of rows) {
        const mapped = mapRawRow(row, sheetCat);
        if (mapped) allRecords.push(mapped);
      }
    }

    if (allRecords.length === 0) {
      throw new Error('未在 Excel 文件中解析到有效豆瓣记录。');
    }
    return {
      name: inferUserNameFromFileName(file.name),
      sourceFileName: file.name,
      records: allRecords,
      loadedAt: new Date().toISOString(),
    };
  }

  throw new Error(`不支持的文件格式 (.${ext})，请上传 CSV、JSON 或 Excel (.xlsx) 文件。`);
}

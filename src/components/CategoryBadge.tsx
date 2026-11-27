import { BookOpen, Disc3, Film, Gamepad2, Star } from 'lucide-react';
import type { Category } from '../types/douban';

export function CategoryIcon({
  category,
  className = 'w-3.5 h-3.5',
}: {
  category: Category;
  className?: string;
}) {
  switch (category) {
    case '电影':
      return <Film className={className} />;
    case '读书':
      return <BookOpen className={className} />;
    case '游戏':
      return <Gamepad2 className={className} />;
    case '音乐':
      return <Disc3 className={className} />;
  }
}

const CAT_COLORS: Record<Category, string> = {
  电影: 'bg-emerald-500/12 text-emerald-700 dark:text-emerald-300 border-emerald-500/25',
  读书: 'bg-amber-500/12 text-amber-800 dark:text-amber-300 border-amber-500/25',
  游戏: 'bg-indigo-500/12 text-indigo-700 dark:text-indigo-300 border-indigo-500/25',
  音乐: 'bg-rose-500/12 text-rose-700 dark:text-rose-300 border-rose-500/25',
};

export const CAT_BAR_COLORS: Record<Category, string> = {
  电影: 'bg-emerald-600 dark:bg-emerald-400',
  读书: 'bg-amber-600 dark:bg-amber-400',
  游戏: 'bg-indigo-600 dark:bg-indigo-400',
  音乐: 'bg-rose-600 dark:bg-rose-400',
};

export function CategoryBadge({ category }: { category: Category }) {
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full border ${CAT_COLORS[category]}`}
    >
      <CategoryIcon category={category} className="w-3 h-3" />
      {category}
    </span>
  );
}

export function StarDisplay({
  rating,
  size = 'sm',
}: {
  rating: number | null;
  size?: 'xs' | 'sm' | 'md';
}) {
  if (rating === null) {
    return (
      <span className="text-xs text-[var(--text-muted)] font-mono-num">未评分</span>
    );
  }
  const sz = size === 'xs' ? 'w-3 h-3' : size === 'md' ? 'w-4 h-4' : 'w-3.5 h-3.5';
  const colorClass =
    rating >= 4
      ? 'text-[var(--gold)] fill-[var(--gold)]'
      : rating <= 2
        ? 'text-[var(--crimson)] fill-[var(--crimson)]'
        : 'text-[var(--text-muted)] fill-[var(--text-muted)]';

  return (
    <span className="inline-flex items-center gap-0.5" title={`${rating}星`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={`${sz} ${i <= rating ? colorClass : 'text-[var(--border-strong)]'}`}
        />
      ))}
    </span>
  );
}

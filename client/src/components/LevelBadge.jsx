import { Star } from 'lucide-react';

export function LevelBadge({ level, title }) {
  return (
    <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-amber-100 text-amber-700 text-sm font-medium">
      <Star size={14} />
      <span>Lv.{level}</span>
      {title && <span className="text-amber-600/70">{title}</span>}
    </div>
  );
}

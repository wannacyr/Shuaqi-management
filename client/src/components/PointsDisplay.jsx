import { Coins } from 'lucide-react';

export function PointsDisplay({ points }) {
  return (
    <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-violet-100 text-violet-700 text-sm font-medium">
      <Coins size={14} />
      <span>{points} 积分</span>
    </div>
  );
}

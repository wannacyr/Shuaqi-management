import { useEffect } from 'react';
import { useUser } from '../context/UserContext';
import { Trophy } from 'lucide-react';

export function BadgesView() {
  const { user, refreshUser } = useUser();

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const badges = user?.badges || [];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-800">我的徽章</h1>
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
        {badges.length === 0 ? (
          <div className="text-slate-400 text-sm">还没有徽章，继续加油解锁奖励吧！</div>
        ) : (
          <div className="flex flex-wrap gap-3">
            {badges.map((badge) => (
              <div key={badge.id} className="flex items-center gap-2 px-3 py-2 bg-violet-50 text-violet-700 rounded-lg text-sm">
                <Trophy size={14} />
                <span>{badge.name}</span>
                {badge.awarded_at && (
                  <span className="text-xs text-violet-400 ml-1">{badge.awarded_at.slice(0, 10)}</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

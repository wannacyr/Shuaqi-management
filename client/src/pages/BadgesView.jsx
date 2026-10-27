import { useEffect, useState } from 'react';
import { useUser } from '../context/UserContext';
import { listAllBadges } from '../store';
import { badgeIcon } from '../utils/badgeIcons';

// 成就页：已获得区按时间倒序（隐藏成就金色+「隐藏」标签区分）；未获得区只列常规成就，
// 隐藏成就在获得前完全不展示
export function BadgesView() {
  const { refreshUser } = useUser();
  const [badges, setBadges] = useState([]);

  useEffect(() => {
    refreshUser();
    setBadges(listAllBadges());
  }, [refreshUser]);

  const earned = badges
    .filter((b) => b.awarded_at)
    .sort((a, b) => String(b.awarded_at).localeCompare(String(a.awarded_at)));
  const lockedNormal = badges.filter((b) => !b.awarded_at && !b.hidden);

  const renderBadge = (badge, isLocked) => {
    const Icon = badgeIcon(badge.icon);
    const hiddenEarned = !isLocked && badge.hidden;
    const cls = isLocked
      ? 'bg-slate-50 text-slate-400 border border-dashed border-slate-200'
      : hiddenEarned
        ? 'bg-amber-50 text-amber-700 border border-amber-200'
        : 'bg-violet-50 text-violet-700';
    const dateCls = hiddenEarned ? 'text-amber-400' : 'text-violet-400';
    return (
      <div key={badge.id} className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${cls}`}>
        <Icon size={14} />
        <span>{badge.name}</span>
        {hiddenEarned && (
          <span className="text-xs px-1.5 py-0.5 rounded bg-amber-100 text-amber-600">隐藏</span>
        )}
        {badge.awarded_at ? (
          <span className={`text-xs ml-1 ${dateCls}`}>{badge.awarded_at.slice(0, 10)}</span>
        ) : (
          <span className="text-xs ml-1">{badge.description}</span>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-800">我的徽章</h1>
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
        {earned.length === 0 && (
          <div className="text-slate-400 text-sm">还没有徽章，继续加油解锁奖励吧！</div>
        )}
        {earned.length > 0 && (
          <div>
            <p className="text-xs font-medium text-slate-400 mb-2">已获得（{earned.length}）</p>
            <div className="flex flex-wrap gap-3">{earned.map((b) => renderBadge(b, false))}</div>
          </div>
        )}
        {lockedNormal.length > 0 && (
          <div>
            <p className="text-xs font-medium text-slate-400 mb-2">未获得（{lockedNormal.length}）</p>
            <div className="flex flex-wrap gap-3">{lockedNormal.map((b) => renderBadge(b, true))}</div>
          </div>
        )}
      </div>
      <p className="text-xs text-slate-400">还有一些神秘成就藏在日常里，达成时会自动现身……</p>
    </div>
  );
}

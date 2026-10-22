import { useEffect, useState } from 'react';
import { useUser } from '../context/UserContext';
import { listAllBadges } from '../store';
import { badgeIcon } from '../utils/badgeIcons';
import { Lock } from 'lucide-react';

// 成就页：展示全部徽章。已获得=彩色+日期；未获得常规=灰色+达成条件；未获得隐藏=??? 神秘成就
export function BadgesView() {
  const { refreshUser } = useUser();
  const [badges, setBadges] = useState([]);

  useEffect(() => {
    refreshUser();
    setBadges(listAllBadges());
  }, [refreshUser]);

  const earned = badges.filter((b) => b.awarded_at);
  const lockedNormal = badges.filter((b) => !b.awarded_at && !b.hidden);
  const lockedHidden = badges.filter((b) => !b.awarded_at && b.hidden);

  const renderBadge = (badge, isLocked) => {
    const Icon = badgeIcon(badge.icon);
    const mystery = isLocked && badge.hidden;
    return (
      <div
        key={badge.id}
        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${
          isLocked
            ? 'bg-slate-50 text-slate-400 border border-dashed border-slate-200'
            : 'bg-violet-50 text-violet-700'
        }`}
      >
        {mystery ? <Lock size={14} /> : <Icon size={14} />}
        <span>{mystery ? '???' : badge.name}</span>
        {badge.awarded_at ? (
          <span className="text-xs text-violet-400 ml-1">{badge.awarded_at.slice(0, 10)}</span>
        ) : (
          <span className="text-xs ml-1">{mystery ? '神秘成就' : badge.description}</span>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-800">我的徽章</h1>
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
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
        {lockedHidden.length > 0 && (
          <div>
            <p className="text-xs font-medium text-slate-400 mb-2">神秘成就（{lockedHidden.length}）</p>
            <div className="flex flex-wrap gap-3">{lockedHidden.map((b) => renderBadge(b, true))}</div>
          </div>
        )}
      </div>
    </div>
  );
}

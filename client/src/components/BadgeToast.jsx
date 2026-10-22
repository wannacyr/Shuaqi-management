import { useEffect, useMemo, useState } from 'react';
import { badgeIcon } from '../utils/badgeIcons';

const CONFETTI_COLORS = ['#f43f5e', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899', '#eab308'];

// 获得成就徽章时的激励小卡片：弹出瞬间撒 0.5s 小彩带，卡片 3s 后自动消失
// 监听 store 层 checkBadges 派发的 'rewardquest:badge-earned' 事件，多枚徽章排队展示
export function BadgeToast() {
  const [queue, setQueue] = useState([]);

  useEffect(() => {
    const handler = (e) => {
      setQueue((prev) => [...prev, e.detail || {}]);
    };
    window.addEventListener('rewardquest:badge-earned', handler);
    return () => window.removeEventListener('rewardquest:badge-earned', handler);
  }, []);

  const current = queue[0] || null;

  useEffect(() => {
    if (!current) return;
    const t = setTimeout(() => {
      setQueue((prev) => prev.slice(1));
    }, 3000);
    return () => clearTimeout(t);
  }, [current]);

  // 彩带碎片：每张卡片弹出时生成一批，CSS 动画 0.5s 后自动隐去
  const confetti = useMemo(() => {
    if (!current) return [];
    return Array.from({ length: 18 }, (_, i) => ({
      id: i,
      dx: Math.round((Math.random() - 0.5) * 180),
      dy: Math.round(-20 - Math.random() * 80),
      rot: Math.round((Math.random() - 0.5) * 540),
      color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
      delay: Math.round(Math.random() * 60),
    }));
  }, [current]);

  if (!current) return null;

  const Icon = badgeIcon(current.icon);

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 pointer-events-none">
      <div className="relative pointer-events-auto bg-white rounded-2xl shadow-2xl border border-amber-100 px-8 py-5 text-center space-y-1.5 toast-pop">
        <div className="absolute inset-x-0 top-1/2 h-0 overflow-visible pointer-events-none">
          {confetti.map((c) => (
            <span
              key={c.id}
              className="confetti-piece"
              style={{
                '--dx': `${c.dx}px`,
                '--dy': `${c.dy}px`,
                '--rot': `${c.rot}deg`,
                backgroundColor: c.color,
                animationDelay: `${c.delay}ms`,
              }}
            />
          ))}
        </div>
        <div className="w-12 h-12 mx-auto bg-amber-100 rounded-full flex items-center justify-center">
          <Icon size={24} className="text-amber-500" />
        </div>
        <p className="text-base font-bold text-slate-800">获得徽章「{current.name}」</p>
        {current.description && <p className="text-xs text-slate-500">{current.description}</p>}
        <p className="text-sm font-medium text-emerald-600">积分+{current.points ?? 20}</p>
      </div>
    </div>
  );
}

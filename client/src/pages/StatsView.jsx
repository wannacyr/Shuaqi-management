import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import { LevelBadge } from '../components/LevelBadge';
import { PointsDisplay } from '../components/PointsDisplay';
import { getTransactions } from '../api/points';
import { Trophy, Ticket, ChevronRight } from 'lucide-react';

export function StatsView() {
  const { user, refreshUser, redeemCoupon } = useUser();
  const [transactions, setTransactions] = useState([]);

  useEffect(() => {
    refreshUser();
    getTransactions(3).then(setTransactions);
  }, [refreshUser]);

  const handleRedeem = async () => {
    try {
      await redeemCoupon();
      refreshUser();
    } catch (err) {
      alert(err.response?.data?.error || '兑换失败');
    }
  };

  const recentBadges = (user?.badges || []).slice(0, 3);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-800">统计与成就</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <div className="text-sm text-slate-500 mb-1">当前等级</div>
          <div className="flex items-center gap-2">
            <LevelBadge level={user?.level || 1} title={user?.current_level_title} />
          </div>
          <div className="text-xs text-slate-400 mt-2">
            距离下一级还需 {user?.next_level_points || 0} 积分
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <div className="text-sm text-slate-500 mb-1">总积分</div>
          <PointsDisplay points={user?.total_points || 0} />
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <div className="text-sm text-slate-500 mb-1">自由奖励券</div>
          <div className="flex items-center gap-2 text-xl font-bold text-amber-600">
            <Ticket size={20} />
            {user?.free_coupons || 0}
          </div>
          <button
            onClick={handleRedeem}
            disabled={(user?.total_points || 0) < 200}
            className="mt-2 text-xs px-3 py-1 bg-amber-100 text-amber-700 rounded-lg disabled:opacity-50"
          >
            200 积分兑换 1 张
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
        <h3 className="font-bold text-slate-800 mb-4">我的徽章</h3>
        {recentBadges.length === 0 ? (
          <div className="text-slate-400 text-sm">还没有徽章，继续加油解锁奖励吧！</div>
        ) : (
          <div className="flex flex-wrap gap-3">
            {recentBadges.map((badge) => (
              <div key={badge.id} className="flex items-center gap-2 px-3 py-2 bg-violet-50 text-violet-700 rounded-lg text-sm">
                <Trophy size={14} />
                <span>{badge.name}</span>
              </div>
            ))}
          </div>
        )}
        <div className="flex justify-end mt-4">
          <Link to="/badges" className="flex items-center gap-1 text-sm text-violet-600 hover:text-violet-700">
            更多 <ChevronRight size={16} />
          </Link>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
        <h3 className="font-bold text-slate-800 mb-4">积分明细</h3>
        <div className="space-y-2">
          {transactions.length === 0 ? (
            <div className="text-slate-400 text-sm">暂无积分记录</div>
          ) : (
            transactions.map((tx) => (
              <div key={tx.id} className="flex justify-between items-center text-sm py-2 border-b border-slate-100 last:border-0">
                <div>
                  <span className="text-slate-700">{tx.description || tx.type}</span>
                  <span className="text-xs text-slate-400 ml-2">{tx.created_at?.slice(0, 16).replace('T', ' ')}</span>
                </div>
                <span className={`font-medium ${tx.amount >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                  {tx.amount >= 0 ? '+' : ''}{tx.amount}
                </span>
              </div>
            ))
          )}
        </div>
        <div className="flex justify-end mt-4">
          <Link to="/points" className="flex items-center gap-1 text-sm text-violet-600 hover:text-violet-700">
            更多 <ChevronRight size={16} />
          </Link>
        </div>
      </div>
    </div>
  );
}

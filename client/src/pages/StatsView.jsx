import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import { LevelBadge } from '../components/LevelBadge';
import { PointsDisplay } from '../components/PointsDisplay';
import { getTransactions } from '../api/points';
import { exportData, importData } from '../store';
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

  const fileInputRef = useRef(null);

  // 导出全量数据为 JSON 文件下载
  const handleExport = () => {
    const json = exportData();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `daily-playbook-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // 选择备份文件 → 确认覆盖 → 导入并刷新
  const handleImport = (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        if (!window.confirm('导入将覆盖当前全部数据，且无法撤销。确定继续吗？')) return;
        importData(String(reader.result));
        location.reload();
      } catch (err) {
        alert(err.message || '导入失败，请检查备份文件');
      }
    };
    reader.readAsText(file);
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

      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
        <h3 className="font-bold text-slate-800 mb-2">数据管理</h3>
        <p className="text-xs text-slate-400 mb-3">数据仅保存在本浏览器，清除缓存会丢失，建议定期导出备份</p>
        <div className="flex gap-3">
          <button
            onClick={handleExport}
            className="px-4 py-2 text-sm bg-violet-600 text-white rounded-lg hover:bg-violet-700"
          >
            导出备份
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-4 py-2 text-sm bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200"
          >
            导入备份
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            className="hidden"
            onChange={handleImport}
          />
        </div>
      </div>
    </div>
  );
}

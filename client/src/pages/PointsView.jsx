import { useEffect, useState } from 'react';
import { getTransactions } from '../api/points';

export function PointsView() {
  const [transactions, setTransactions] = useState([]);

  useEffect(() => {
    getTransactions(1000).then(setTransactions);
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-800">积分明细</h1>
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
        {transactions.length === 0 ? (
          <div className="text-slate-400 text-sm">暂无积分记录</div>
        ) : (
          <div className="space-y-2">
            {transactions.map((tx) => (
              <div key={tx.id} className="flex justify-between items-center text-sm py-2 border-b border-slate-100 last:border-0">
                <div>
                  <span className="text-slate-700">{tx.description || tx.type}</span>
                  <span className="text-xs text-slate-400 ml-2">{tx.created_at?.slice(0, 16).replace('T', ' ')}</span>
                </div>
                <span className={`font-medium ${tx.amount >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                  {tx.amount >= 0 ? '+' : ''}{tx.amount}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

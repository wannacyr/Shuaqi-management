import { useEffect } from 'react';
import { PartyPopper, X } from 'lucide-react';
import { useQuest } from '../context/QuestContext';

// 完成前置条件时的激励小卡片：随机祝贺语 + 积分+xx，2.5s 后自动消失
export function CelebrationToast() {
  const { celebration, closeCelebration } = useQuest();

  useEffect(() => {
    if (!celebration) return;
    const t = setTimeout(closeCelebration, 2500);
    return () => clearTimeout(t);
  }, [celebration, closeCelebration]);

  if (!celebration) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 pointer-events-none">
      <div className="relative pointer-events-auto bg-white rounded-2xl shadow-2xl border border-violet-100 px-8 py-5 text-center space-y-2 toast-pop">
        <div className="w-12 h-12 mx-auto bg-violet-100 rounded-full flex items-center justify-center">
          <PartyPopper size={24} className="text-violet-600" />
        </div>
        <p className="text-base font-bold text-slate-800">{celebration.message}</p>
        <p className="text-sm font-medium text-emerald-600">积分+{celebration.points}</p>
        <button
          onClick={closeCelebration}
          className="absolute top-2 right-2 p-1 text-slate-300 hover:text-slate-500 rounded-lg"
          title="关闭"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}

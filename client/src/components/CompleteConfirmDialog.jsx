import { PartyPopper, Hourglass, Undo2 } from 'lucide-react';

// 完成最后一个条件时的确认弹卡：
// - 开始奖励！   → 勾选该条件并进入奖励倒计时
// - 再沉淀一会儿 → 勾选该条件但返回当前界面
// - 等下，我手滑了 → 不勾选该条件并返回当前界面
export function CompleteConfirmDialog({ open, questName, onOops, onSettle, onStart }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 space-y-5">
        <div className="text-center space-y-3">
          <div className="w-14 h-14 mx-auto bg-violet-100 rounded-full flex items-center justify-center">
            <PartyPopper size={28} className="text-violet-600" />
          </div>
          <h2 className="text-lg font-bold text-slate-800">真的完事了准备奖励自己吗</h2>
          {questName && (
            <p className="text-sm text-slate-500">「{questName}」的最后一个条件</p>
          )}
        </div>
        <div className="space-y-2">
          <button
            onClick={onStart}
            className="w-full px-4 py-2.5 bg-violet-600 text-white text-sm font-medium rounded-lg hover:bg-violet-700 flex items-center justify-center gap-2"
          >
            <PartyPopper size={16} />
            开始奖励！
          </button>
          <button
            onClick={onSettle}
            className="w-full px-4 py-2.5 bg-white border border-slate-300 text-slate-700 text-sm rounded-lg hover:bg-slate-50 flex items-center justify-center gap-2"
          >
            <Hourglass size={16} />
            再沉淀一会儿
          </button>
          <button
            onClick={onOops}
            className="w-full px-4 py-2.5 bg-white border border-slate-300 text-slate-500 text-sm rounded-lg hover:bg-slate-50 flex items-center justify-center gap-2"
          >
            <Undo2 size={16} />
            等下，我手滑了
          </button>
        </div>
      </div>
    </div>
  );
}

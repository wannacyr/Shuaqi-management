import { formatDuration } from '../utils/calc';

export function Timer({ remaining, elapsed, running, onStart, onPause, onStop, label }) {
  return (
    <div className="flex flex-col items-center gap-6 p-8 bg-white rounded-2xl shadow-sm border border-slate-200">
      <div className="text-slate-500 text-sm font-medium">{label || '剩余奖励时间'}</div>
      <div className="text-6xl font-mono font-bold text-violet-600 tabular-nums">
        {formatDuration(remaining)}
      </div>
      <div className="text-slate-400 text-sm">已享受 {formatDuration(elapsed)}</div>
      <div className="flex gap-3">
        {!running ? (
          <button
            onClick={onStart}
            disabled={remaining <= 0}
            className="px-6 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 disabled:opacity-50"
          >
            开始
          </button>
        ) : (
          <button
            onClick={onPause}
            className="px-6 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600"
          >
            暂停
          </button>
        )}
        <button
          onClick={onStop}
          className="px-6 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-900"
        >
          结束享受
        </button>
      </div>
    </div>
  );
}

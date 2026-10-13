import { Check } from 'lucide-react';

export function ConditionItem({ condition, disabled, onToggle }) {
  return (
    <label
      className={`flex items-center gap-3 p-2 rounded-lg border transition cursor-pointer ${
        condition.completed
          ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
          : 'bg-white border-slate-200 hover:border-violet-300'
      } ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
    >
      <button
        type="button"
        disabled={disabled}
        onClick={() => onToggle(condition)}
        className={`w-5 h-5 rounded flex items-center justify-center border ${
          condition.completed
            ? 'bg-emerald-500 border-emerald-500 text-white'
            : 'border-slate-300 bg-white'
        }`}
      >
        {condition.completed && <Check size={14} />}
      </button>
      <span className={`text-sm flex-1 ${condition.completed ? 'line-through opacity-70' : ''}`}>
        {condition.title}
      </span>
      <span className="text-xs text-slate-400 shrink-0">
        {condition.duration_minutes ?? 30} 分钟
      </span>
    </label>
  );
}

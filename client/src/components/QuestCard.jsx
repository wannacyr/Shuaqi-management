import { Lock, Unlock, CheckCircle, Play, Trophy, Sparkles, Pencil, Trash2, Gamepad2, Video, Dumbbell, Coffee, Tv, Film, ShoppingBag, Footprints } from 'lucide-react';
import { ProgressBar } from './ProgressBar';
import { ConditionItem } from './ConditionItem';
import { calcProgress } from '../utils/calc';
import { todayStr } from '../utils/date';
import { Link } from 'react-router-dom';

const ICON_MAP = {
  'gamepad-2': Gamepad2,
  'video': Video,
  'dumbbell': Dumbbell,
  'coffee': Coffee,
  'tv': Tv,
  'film': Film,
  'shopping-bag': ShoppingBag,
  'footprints': Footprints,
};

const statusConfig = {
  locked: { label: '锁定中', icon: Lock, color: 'text-slate-500', bg: 'bg-slate-50', border: 'border-slate-200' },
  unlocked: { label: '已解锁', icon: Unlock, color: 'text-violet-600', bg: 'bg-violet-50', border: 'border-violet-200' },
  completed: { label: '已完成', icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200' },
  skipped: { label: '已跳过', icon: Trophy, color: 'text-slate-400', bg: 'bg-slate-50', border: 'border-slate-200' },
};

export function QuestCard({ plan, onToggleCondition, onUnlock, onEdit, onDelete }) {
  const { quest, conditions, status, is_reward_pool, used_seconds } = plan;
  const config = statusConfig[status] || statusConfig.locked;
  const StatusIcon = config.icon;
  const progress = calcProgress(conditions);
  const isToday = plan.plan_date === todayStr();
  const canStartTimer = status === 'unlocked' && isToday;
  const allCompleted = conditions.length > 0 && conditions.every(c => c.completed);
  const TypeIcon = ICON_MAP[quest.icon] || Sparkles;

  return (
    <div className={`rounded-2xl border p-5 shadow-sm ${config.bg} ${config.border}`}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-2xl">
            {quest.is_free ? <Sparkles size={24} className="text-amber-500" /> : <TypeIcon size={24} className="text-violet-500" />}
          </div>
          <div>
            <h3 className="font-bold text-slate-800">{quest.name}</h3>
            <p className="text-xs text-slate-500">{quest.description || '无描述'}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onEdit({ ...plan.quest, conditions: plan.conditions })}
            className="p-1.5 text-slate-400 hover:text-violet-600 hover:bg-violet-50 rounded-lg"
            title="编辑关卡"
          >
            <Pencil size={14} />
          </button>
          {onDelete && (
            <button
              onClick={() => onDelete(plan)}
              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
              title="删除关卡"
            >
              <Trash2 size={14} />
            </button>
          )}
          <div className={`flex items-center gap-1 text-xs font-medium ${config.color}`}>
            <StatusIcon size={14} />
            <span>{config.label}</span>
          </div>
        </div>
      </div>

      {is_reward_pool ? (
        <div className="text-xs text-amber-600 bg-amber-100 px-2 py-1 rounded mb-3 inline-block">
          来自奖励池
        </div>
      ) : null}

      {conditions.length > 0 && (
        <div className="mb-4">
          <div className="flex justify-between text-xs text-slate-500 mb-1">
            <span>解锁进度</span>
            <span>{progress}%</span>
          </div>
          <ProgressBar value={progress} />
          <div className="mt-3 space-y-2">
            {conditions.map(condition => (
              <ConditionItem
                key={condition.id}
                condition={condition}
                disabled={status !== 'locked' || !isToday}
                onToggle={onToggleCondition}
              />
            ))}
          </div>
        </div>
      )}

      {conditions.length === 0 && (
        <div className="text-sm text-slate-500 mb-4">自由关卡，无需条件</div>
      )}

      {!isToday && (
        <div className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-4">
          这是 {plan.plan_date} 的卡片，只有当天的条件可以点击完成
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="text-xs text-slate-500">
          时长 {quest.daily_limit_minutes} 分钟 · 已享受 {Math.floor((used_seconds || 0) / 60)} 分钟
        </div>
        <div className="flex gap-2">
          {status === 'locked' && allCompleted && isToday && (
            <button
              onClick={() => onUnlock(plan)}
              className="px-4 py-2 bg-violet-600 text-white text-sm rounded-lg hover:bg-violet-700"
            >
              确认解锁
            </button>
          )}
          {canStartTimer && (
            <Link
              to={`/timer/${plan.id}`}
              className="px-4 py-2 bg-violet-600 text-white text-sm rounded-lg hover:bg-violet-700 flex items-center gap-1"
            >
              <Play size={14} />
              开始享受
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

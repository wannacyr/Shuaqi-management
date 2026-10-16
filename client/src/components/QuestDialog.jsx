import { useEffect, useState } from 'react';
import { Plus, X, Save, Sparkles } from 'lucide-react';
import { QUEST_TYPES, iconForType } from '../utils/questTypes';
import { todayStr } from '../utils/date';
import { rewardPoints, conditionPoints } from '../store';

const REPEAT_OPTIONS = [
  { value: 'none', label: '不重复' },
  { value: 'daily', label: '每日' },
  { value: 'w1', label: '每周一' },
  { value: 'w2', label: '每周二' },
  { value: 'w3', label: '每周三' },
  { value: 'w4', label: '每周四' },
  { value: 'w5', label: '每周五' },
  { value: 'w6', label: '每周六' },
  { value: 'w0', label: '每周日' },
];

// 前置条件快捷模板：点击即添加一条预填条件
const CONDITION_TEMPLATES = [
  { title: '学习', duration_minutes: 30 },
  { title: '运动', duration_minutes: 20 },
  { title: '阅读', duration_minutes: 30 },
  { title: '练琴', duration_minutes: 30 },
  { title: '背单词', duration_minutes: 15 },
  { title: '早起', duration_minutes: 10 },
];

// quest 的重复字段 -> 表单下拉值
function repeatFormValue(quest) {
  if (!quest) return 'none';
  if (quest.repeat_type === 'daily') return 'daily';
  if (quest.repeat_type === 'weekly') return 'w' + (quest.repeat_weekday ?? 0);
  return 'none';
}

// 表单下拉值 -> 提交给 store 的重复字段
function buildRepeatPayload(value, until) {
  if (value === 'daily') return { repeat_type: 'daily', repeat_weekday: null, repeat_until: until };
  if (value && value.startsWith('w')) return { repeat_type: 'weekly', repeat_weekday: Number(value.slice(1)), repeat_until: until };
  return { repeat_type: 'none', repeat_weekday: null, repeat_until: null };
}

const newEmpty = () => ({
  name: '游戏',
  description: '',
  daily_limit_minutes: 30,
  is_free: false,
  repeat: 'none',
  repeat_until: '',
  conditions: [{ title: '', duration_minutes: 30 }],
});

export function QuestDialog({ open, onClose, initialQuest, freeCoupons, onSave }) {
  const [form, setForm] = useState(newEmpty);
  const editing = initialQuest?.id || null;

  useEffect(() => {
    if (open) {
      if (initialQuest) {
        setForm({
          name: initialQuest.name || '游戏',
          description: initialQuest.description || '',
          daily_limit_minutes: initialQuest.daily_limit_minutes,
          is_free: !!initialQuest.is_free,
          repeat: repeatFormValue(initialQuest),
          repeat_until: initialQuest.repeat_until || '',
          conditions: initialQuest.conditions?.length
            ? initialQuest.conditions.map((c) => ({ title: c.title, duration_minutes: c.duration_minutes ?? 30 }))
            : [],
        });
      } else {
        setForm(newEmpty());
      }
    }
  }, [open, initialQuest]);

  const addCondition = () => {
    setForm((prev) => ({ ...prev, conditions: [...prev.conditions, { title: '', duration_minutes: 30 }] }));
  };

  // 快捷模板：清掉未填写的空白行后追加一条预填条件
  const addTemplateCondition = (tpl) => {
    setForm((prev) => ({
      ...prev,
      conditions: [...prev.conditions.filter((c) => c.title.trim()), { ...tpl }],
    }));
  };

  const updateCondition = (idx, patch) => {
    setForm((prev) => ({
      ...prev,
      conditions: prev.conditions.map((c, i) => (i === idx ? { ...c, ...patch } : c)),
    }));
  };

  const removeCondition = (idx) => {
    setForm((prev) => ({ ...prev, conditions: prev.conditions.filter((_, i) => i !== idx) }));
  };

  const buildPayload = (isFree) => ({
    name: form.name,
    description: form.description,
    icon: iconForType(form.name),
    daily_limit_minutes: Number(form.daily_limit_minutes) || 0,
    is_free: isFree,
    ...buildRepeatPayload(form.repeat, form.repeat_until || null),
    conditions: isFree
      ? []
      : form.conditions
          .filter((c) => c.title.trim())
          .map((c) => ({ ...c, duration_minutes: Number(c.duration_minutes) || 0 })),
  });

  // 选择了重复时必须选择结束日期，且不能早于今天
  const validateRepeat = () => {
    if (form.repeat === 'none') return true;
    if (!form.repeat_until) {
      alert('请选择重复结束的日期');
      return false;
    }
    if (form.repeat_until < todayStr()) {
      alert('重复结束日期不能早于今天');
      return false;
    }
    return true;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const validConditions = form.conditions.filter((c) => c.title.trim());
    if (validConditions.length === 0 && !form.is_free) {
      alert(`请设置条件，否则将消耗自由奖励券（当前持有${freeCoupons}张）`);
      return;
    }
    if (!validateRepeat()) return;
    const payload = buildPayload(form.is_free);
    onSave(editing ? { ...payload, id: editing } : payload);
  };

  const handleUseCoupon = () => {
    if (!validateRepeat()) return;
    const payload = buildPayload(true);
    onSave(editing ? { ...payload, id: editing } : payload);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-slate-200 px-5 py-4 flex items-center justify-between rounded-t-2xl">
          <h2 className="text-lg font-bold text-slate-800">
            {editing ? '编辑奖励关卡' : '新建奖励关卡'}
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded-lg text-slate-500">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">类型</label>
              <select
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 bg-white"
              >
                {!QUEST_TYPES.includes(form.name) && (
                  <option value={form.name}>{form.name}</option>
                )}
                {QUEST_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">描述</label>
              <input
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                placeholder="简短描述这个奖励"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">时长（分钟）</label>
            <div className="relative">
              <input
                type="number"
                min="1"
                value={form.daily_limit_minutes}
                onChange={(e) => setForm({ ...form, daily_limit_minutes: e.target.value === '' ? '' : Number(e.target.value) })}
                className="w-full px-3 py-2 pr-20 border border-slate-300 rounded-lg"
              />
              {form.daily_limit_minutes > 0 && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-violet-600 pointer-events-none">
                  积分+{rewardPoints(form.daily_limit_minutes)}
                </span>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">重复</label>
            <select
              value={form.repeat}
              onChange={(e) => setForm({ ...form, repeat: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 bg-white"
            >
              {REPEAT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
            {form.repeat !== 'none' && (
              <div className="mt-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">重复直到</label>
                <input
                  type="date"
                  min={todayStr()}
                  value={form.repeat_until}
                  onChange={(e) => setForm({ ...form, repeat_until: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 bg-white"
                />
                {form.repeat_until && (
                  <p className="text-xs text-violet-600 mt-1">重复至{form.repeat_until.replace(/-/g, '/')}</p>
                )}
              </div>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-slate-700">前置条件</label>
              <button
                type="button"
                onClick={addCondition}
                className="text-sm text-violet-600 hover:text-violet-700 flex items-center gap-1"
              >
                <Plus size={14} /> 添加条件
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {CONDITION_TEMPLATES.map((tpl) => (
                <button
                  key={tpl.title}
                  type="button"
                  onClick={() => addTemplateCondition(tpl)}
                  className="px-2.5 py-1 text-xs bg-violet-50 text-violet-700 rounded-full hover:bg-violet-100 transition-colors"
                >
                  {tpl.title} {tpl.duration_minutes}分钟
                </button>
              ))}
            </div>
            {form.conditions.length === 0 && (
              <div className="text-sm text-slate-400 mb-2">
                未设置条件，可点击右下角「消耗一张自由奖励券」创建自由关卡
              </div>
            )}
            <div className="space-y-2">
              {form.conditions.map((c, idx) => (
                <div key={idx} className="flex gap-2 items-center">
                  <input
                    value={c.title}
                    onChange={(e) => updateCondition(idx, { title: e.target.value })}
                    placeholder={`条件 ${idx + 1} 名称`}
                    className="flex-1 px-3 py-2 border border-slate-300 rounded-lg"
                  />
                  <div className="flex items-center gap-1">
                    <div className="relative">
                      <input
                        type="number"
                        min="1"
                        value={c.duration_minutes}
                        onChange={(e) => updateCondition(idx, { duration_minutes: e.target.value === '' ? '' : Number(e.target.value) })}
                        className="w-28 px-2 py-2 pr-14 border border-slate-300 rounded-lg"
                      />
                      {c.duration_minutes > 0 && (
                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-semibold text-violet-600 pointer-events-none whitespace-nowrap">
                          积分+{conditionPoints(c.duration_minutes)}
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-slate-400">分钟</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeCondition(idx)}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            {freeCoupons > 0 && (
              <button
                type="button"
                onClick={handleUseCoupon}
                className="px-4 py-2 bg-amber-100 text-amber-700 text-sm rounded-lg hover:bg-amber-200 flex items-center gap-1"
              >
                <Sparkles size={14} /> 消耗一张自由奖励券
              </button>
            )}
            <button
              type="submit"
              className="px-4 py-2 bg-violet-600 text-white text-sm rounded-lg hover:bg-violet-700 flex items-center gap-1"
            >
              <Save size={14} /> 保存
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

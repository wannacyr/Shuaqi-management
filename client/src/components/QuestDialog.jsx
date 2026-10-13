import { useEffect, useState } from 'react';
import { Plus, X, Save, Sparkles } from 'lucide-react';
import { QUEST_TYPES, iconForType } from '../utils/questTypes';

const newEmpty = () => ({
  name: '游戏',
  description: '',
  daily_limit_minutes: 30,
  is_free: false,
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
    daily_limit_minutes: form.daily_limit_minutes,
    is_free: isFree,
    conditions: isFree ? [] : form.conditions.filter((c) => c.title.trim()),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const validConditions = form.conditions.filter((c) => c.title.trim());
    if (validConditions.length === 0 && !form.is_free) {
      alert(`请设置条件，否则将消耗自由奖励券（当前持有${freeCoupons}张）`);
      return;
    }
    const payload = buildPayload(form.is_free);
    onSave(editing ? { ...payload, id: editing } : payload);
  };

  const handleUseCoupon = () => {
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
            <input
              type="number"
              min="1"
              value={form.daily_limit_minutes}
              onChange={(e) => setForm({ ...form, daily_limit_minutes: Number(e.target.value) })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg"
            />
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
                    <input
                      type="number"
                      min="1"
                      value={c.duration_minutes}
                      onChange={(e) => updateCondition(idx, { duration_minutes: Number(e.target.value) })}
                      className="w-20 px-2 py-2 border border-slate-300 rounded-lg"
                    />
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

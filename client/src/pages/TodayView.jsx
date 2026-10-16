import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { QuestCard } from '../components/QuestCard';
import { QuestDialog } from '../components/QuestDialog';
import { CompleteConfirmDialog } from '../components/CompleteConfirmDialog';
import { useQuest } from '../context/QuestContext';
import { useUser } from '../context/UserContext';
import { todayStr } from '../utils/date';
import { Sparkles, Plus } from 'lucide-react';
import { listQuests } from '../api/quests';
import { injectDemoQuests } from '../store';

export function TodayView() {
  const { dailyPlans, loading, refreshDailyPlans, toggleCondition, unlockPlan, saveQuest, removeQuest } = useQuest();
  const { user, refreshUser } = useUser();
  const navigate = useNavigate();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingQuest, setEditingQuest] = useState(null);
  const [selectedDate, setSelectedDate] = useState(todayStr());
  const [pendingComplete, setPendingComplete] = useState(null);

  useEffect(() => {
    refreshDailyPlans(selectedDate);
    refreshUser();
  }, [selectedDate, refreshDailyPlans, refreshUser]);

  const handleToggle = async (plan, condition) => {
    // 勾选「最后一个未完成条件」时，先弹确认卡，不直接落库
    const isCompleting = !condition.completed;
    const remaining = plan.conditions.filter((c) => !c.completed);
    const isLastOne = isCompleting && remaining.length === 1 && remaining[0].id === condition.id;
    if (isLastOne) {
      setPendingComplete({ plan, condition });
      return;
    }
    try {
      await toggleCondition(plan.id, condition.id);
      refreshUser();
    } catch (err) {
      alert(err.message || '操作失败');
    }
  };

  // 等下，我手滑了：不勾选刚才的条件，退回弹出前界面
  const handleConfirmOops = () => {
    setPendingComplete(null);
  };

  // 再沉淀一会儿：勾选刚才的条件，返回弹出前界面
  const handleConfirmSettle = async () => {
    if (!pendingComplete) return;
    try {
      await toggleCondition(pendingComplete.plan.id, pendingComplete.condition.id);
      refreshUser();
    } catch (err) {
      alert(err.message || '操作失败');
    }
    setPendingComplete(null);
  };

  // 开始奖励！：勾选刚才的条件，进入奖励关卡倒计时
  const handleConfirmStart = async () => {
    if (!pendingComplete) return;
    const { plan, condition } = pendingComplete;
    try {
      await toggleCondition(plan.id, condition.id);
      refreshUser();
      setPendingComplete(null);
      navigate(`/timer/${plan.id}`);
    } catch (err) {
      alert(err.message || '操作失败');
      setPendingComplete(null);
    }
  };

  const handleUnlock = async (plan) => {
    await unlockPlan(plan.id);
    refreshUser();
  };

  const handleEdit = (quest) => {
    setEditingQuest(quest);
    setDialogOpen(true);
  };

  const handleDelete = async (plan) => {
    if (!window.confirm(`确定删除关卡「${plan.quest.name}」吗？删除后当天不再显示。`)) return;
    await removeQuest(plan.quest.id);
    await refreshDailyPlans(selectedDate);
    refreshUser();
  };

  const handleAdd = () => {
    setEditingQuest(null);
    setDialogOpen(true);
  };

  const handleSave = async (quest) => {
    await saveQuest(quest, selectedDate);
    await refreshDailyPlans(selectedDate);
    setDialogOpen(false);
    setEditingQuest(null);
  };

  // 空库检测：quests 全空时才展示「演示数据」入口
  const [hasQuests, setHasQuests] = useState(true);
  useEffect(() => {
    listQuests().then((qs) => setHasQuests((qs || []).length > 0)).catch(() => {});
  }, []);

  // 注入演示关卡并刷新今日计划
  const handleInjectDemo = async () => {
    injectDemoQuests();
    setHasQuests(true);
    await refreshDailyPlans();
  };

  const normalPlans = dailyPlans.filter(p => !p.is_reward_pool);
  const poolPlans = dailyPlans.filter(p => p.is_reward_pool);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">今日关卡</h1>
          <p className="text-slate-500 text-sm mt-1">完成前置条件，解锁今日奖励</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleAdd}
            className="px-4 py-2 bg-violet-600 text-white text-sm rounded-lg hover:bg-violet-700 flex items-center gap-1"
          >
            <Plus size={16} />
            添加奖励关卡
          </button>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="text-sm text-slate-600 border border-slate-300 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-violet-500"
          />
        </div>
      </div>

      {loading && <div className="text-slate-400">加载中...</div>}

      {!loading && normalPlans.length === 0 && (
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-8 text-center">
          <Sparkles className="mx-auto text-violet-400 mb-3" size={32} />
          <h3 className="text-lg font-bold text-slate-700 mb-1">开始写今天的Playbook吧</h3>
          <p className="text-sm text-slate-400 mb-6">三步开始：创建奖励关卡 → 完成前置条件 → 解锁享受时光</p>
          <div className="flex justify-center gap-3">
            <button
              onClick={handleAdd}
              className="px-4 py-2 bg-violet-600 text-white text-sm rounded-lg hover:bg-violet-700"
            >
              创建第一个关卡
            </button>
            {!hasQuests && (
              <button
                onClick={handleInjectDemo}
                className="px-4 py-2 bg-slate-100 text-slate-600 text-sm rounded-lg hover:bg-slate-200"
              >
                看看演示数据
              </button>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {normalPlans.map(plan => (
          <QuestCard
            key={plan.id}
            plan={plan}
            onToggleCondition={(c) => handleToggle(plan, c)}
            onUnlock={handleUnlock}
            onEdit={handleEdit}
            onDelete={plan.quest.quest_date === todayStr() ? handleDelete : undefined}
          />
        ))}
      </div>

      {poolPlans.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-amber-600 font-medium">
            <Sparkles size={18} />
            <h2>奖励池（昨日未完成）</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {poolPlans.map(plan => (
              <QuestCard
                key={plan.id}
                plan={plan}
                onToggleCondition={(c) => handleToggle(plan, c)}
                onUnlock={handleUnlock}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))}
          </div>
        </div>
      )}

      <QuestDialog
        open={dialogOpen}
        onClose={() => { setDialogOpen(false); setEditingQuest(null); }}
        initialQuest={editingQuest}
        freeCoupons={user?.free_coupons || 0}
        onSave={handleSave}
      />

      <CompleteConfirmDialog
        open={!!pendingComplete}
        questName={pendingComplete?.plan?.quest?.name}
        onOops={handleConfirmOops}
        onSettle={handleConfirmSettle}
        onStart={handleConfirmStart}
      />
    </div>
  );
}

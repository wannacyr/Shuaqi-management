import { createContext, useContext, useState, useCallback } from 'react';
import * as questApi from '../api/quests';
import * as dailyPlanApi from '../api/dailyPlans';
import { todayStr } from '../utils/date';
import { conditionPoints } from '../store';

const QuestContext = createContext(null);

const CHEERS = ['这么努力辛苦啦！', '居然完成了？', '离快乐又近一步！', '可别真卷上了~~'];

export function QuestProvider({ children }) {
  const [quests, setQuests] = useState([]);
  const [dailyPlans, setDailyPlans] = useState([]);
  const [selectedPlanId, setSelectedPlanId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [celebration, setCelebration] = useState(null);

  const closeCelebration = useCallback(() => setCelebration(null), []);

  const refreshQuests = useCallback(async () => {
    const data = await questApi.listQuests();
    setQuests(data);
    return data;
  }, []);

  const refreshDailyPlans = useCallback(async (date = todayStr()) => {
    setLoading(true);
    try {
      const data = await dailyPlanApi.getDailyPlans(date);
      setDailyPlans(data);
      return data;
    } finally {
      setLoading(false);
    }
  }, []);

  const toggleCondition = useCallback(async (planId, conditionId) => {
    const updated = await dailyPlanApi.toggleCondition(planId, conditionId);
    setDailyPlans(prev => prev.map(p => p.id === planId ? updated : p));
    // 勾选完成（非取消）时弹出激励小卡片：随机祝贺语 + 本次积分
    const cond = updated?.conditions?.find((c) => c.id === conditionId);
    if (cond && cond.completed === 1) {
      setCelebration({
        message: CHEERS[Math.floor(Math.random() * CHEERS.length)],
        points: conditionPoints(cond.duration_minutes),
      });
    }
    return updated;
  }, []);

  const unlockPlan = useCallback(async (planId) => {
    const updated = await dailyPlanApi.unlockPlan(planId);
    setDailyPlans(prev => prev.map(p => p.id === planId ? updated : p));
    return updated;
  }, []);

  const completePlan = useCallback(async (planId) => {
    const updated = await dailyPlanApi.completePlan(planId);
    setDailyPlans(prev => prev.map(p => p.id === planId ? updated : p));
    return updated;
  }, []);

  const saveQuest = useCallback(async (quest, date) => {
    if (quest.id) {
      await questApi.updateQuest(quest.id, quest);
    } else {
      await questApi.createQuest({ ...quest, quest_date: date });
    }
    await refreshQuests();
  }, [refreshQuests]);

  const removeQuest = useCallback(async (id) => {
    await questApi.deleteQuest(id);
    await refreshQuests();
  }, [refreshQuests]);

  return (
    <QuestContext.Provider
      value={{
        quests,
        dailyPlans,
        selectedPlanId,
        loading,
        setSelectedPlanId,
        refreshQuests,
        refreshDailyPlans,
        toggleCondition,
        unlockPlan,
        completePlan,
        saveQuest,
        removeQuest,
        celebration,
        closeCelebration,
      }}
    >
      {children}
    </QuestContext.Provider>
  );
}

export function useQuest() {
  const ctx = useContext(QuestContext);
  if (!ctx) throw new Error('useQuest must be used within QuestProvider');
  return ctx;
}

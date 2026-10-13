import { createContext, useContext, useState, useCallback } from 'react';
import * as questApi from '../api/quests';
import * as dailyPlanApi from '../api/dailyPlans';
import { todayStr } from '../utils/date';

const QuestContext = createContext(null);

export function QuestProvider({ children }) {
  const [quests, setQuests] = useState([]);
  const [dailyPlans, setDailyPlans] = useState([]);
  const [selectedPlanId, setSelectedPlanId] = useState(null);
  const [loading, setLoading] = useState(false);

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

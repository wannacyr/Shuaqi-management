import * as store from '../store';

export const getDailyPlans = async (date) => store.getDailyPlans(date);
export const toggleCondition = async (planId, conditionId) => store.toggleCondition(planId, conditionId);
export const unlockPlan = async (planId) => store.unlockPlan(planId);
export const completePlan = async (planId) => store.completePlan(planId);

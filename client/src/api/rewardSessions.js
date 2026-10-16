import * as store from '../store';

export const createRewardSession = async (dailyPlanId, durationSeconds) => store.createRewardSession(dailyPlanId, durationSeconds);
export const listRewardSessions = async (date) => store.listRewardSessions(date);
export const recordRewardUsage = async (dailyPlanId, durationSeconds) => store.recordRewardUsage(dailyPlanId, durationSeconds);

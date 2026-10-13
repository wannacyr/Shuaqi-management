import client from './client';

export const createRewardSession = (dailyPlanId, durationSeconds) =>
  client.post('/reward-sessions', { daily_plan_id: dailyPlanId, duration_seconds: durationSeconds }).then(r => r.data);

export const listRewardSessions = (date) =>
  client.get('/reward-sessions', { params: date ? { date } : {} }).then(r => r.data);

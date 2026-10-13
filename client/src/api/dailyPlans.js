import client from './client';

export const getDailyPlans = (date) => client.get('/daily-plans', { params: { date } }).then(r => r.data);
export const toggleCondition = (planId, conditionId) =>
  client.post(`/daily-plans/${planId}/conditions/${conditionId}/toggle`).then(r => r.data);
export const unlockPlan = (planId) => client.post(`/daily-plans/${planId}/unlock`).then(r => r.data);
export const completePlan = (planId) => client.post(`/daily-plans/${planId}/complete`).then(r => r.data);

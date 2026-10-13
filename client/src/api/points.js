import client from './client';

export const getTransactions = (limit = 100) =>
  client.get('/points/transactions', { params: { limit } }).then(r => r.data);

export const getDailyPoints = () => client.get('/points/daily').then(r => r.data);

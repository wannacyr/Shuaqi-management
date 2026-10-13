import * as store from '../store';

export const getTransactions = async (limit = 100) => store.getTransactions(limit);
export const getDailyPoints = async () => store.getDailyPoints();

import * as store from '../store';

export const listQuests = async () => store.listQuests();
export const createQuest = async (data) => store.createQuest(data);
export const updateQuest = async (id, data) => store.updateQuest(id, data);
export const deleteQuest = async (id) => store.deleteQuest(id);

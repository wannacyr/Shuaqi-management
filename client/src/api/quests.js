import client from './client';

export const listQuests = () => client.get('/quests').then(r => r.data);
export const createQuest = (data) => client.post('/quests', data).then(r => r.data);
export const updateQuest = (id, data) => client.put(`/quests/${id}`, data).then(r => r.data);
export const deleteQuest = (id) => client.delete(`/quests/${id}`);

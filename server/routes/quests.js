import { Router } from 'express';
import { get, all, run } from '../db.js';
import { formatDate } from '../utils.js';
import { syncPlanConditions } from './dailyPlans.js';

const router = Router();

async function loadQuestWithConditions(questId) {
  const quest = await get('SELECT * FROM quests WHERE id = ?', [questId]);
  if (!quest) return null;
  const conditions = await all(
    'SELECT * FROM conditions WHERE quest_id = ? ORDER BY sort_order, created_at',
    [questId]
  );
  return { ...quest, conditions };
}

router.get('/', async (req, res) => {
  const quests = await all('SELECT * FROM quests WHERE active = 1 ORDER BY created_at DESC');
  const result = await Promise.all(quests.map(q => loadQuestWithConditions(q.id)));
  res.json(result);
});

router.post('/', async (req, res) => {
  const { name, description, icon, daily_limit_minutes, is_free, conditions, quest_date } = req.body;
  const questId = crypto.randomUUID();

  if (is_free) {
    const user = await get('SELECT * FROM users WHERE id = 1');
    if (user.free_coupons <= 0) {
      return res.status(400).json({ error: '自由奖励券不足' });
    }
  }

  await run(
    `INSERT INTO quests (id, name, description, icon, daily_limit_minutes, is_daily, is_free, quest_date)
     VALUES (?, ?, ?, ?, ?, 0, ?, ?)`,
    [questId, name, description || '', icon || 'sparkles', daily_limit_minutes || 30, is_free ? 1 : 0, quest_date || formatDate(new Date())]
  );

  if (is_free) {
    await run('UPDATE users SET free_coupons = free_coupons - 1 WHERE id = 1');
    await run(
      `INSERT INTO point_transactions (id, user_id, type, amount, description, ref_id)
       VALUES (lower(hex(randomblob(16))), 1, 'coupon_use', 0, ?, ?)`,
      [`使用自由奖励券创建关卡：${name}`, questId]
    );
  }

  if (conditions && conditions.length > 0) {
    for (let idx = 0; idx < conditions.length; idx++) {
      const c = conditions[idx];
      await run(
        'INSERT INTO conditions (id, quest_id, title, duration_minutes, sort_order) VALUES (?, ?, ?, ?, ?)',
        [crypto.randomUUID(), questId, c.title, Number(c.duration_minutes) || 30, idx]
      );
    }
  }

  res.status(201).json(await loadQuestWithConditions(questId));
});

router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { name, description, icon, daily_limit_minutes, is_free, conditions } = req.body;

  const existing = await get('SELECT * FROM quests WHERE id = ?', [id]);
  if (!existing) return res.status(404).json({ error: '关卡不存在' });

  if (is_free && !existing.is_free) {
    const user = await get('SELECT * FROM users WHERE id = 1');
    if (user.free_coupons <= 0) {
      return res.status(400).json({ error: '自由奖励券不足' });
    }
  }

  await run(
    `UPDATE quests SET name = ?, description = ?, icon = ?, daily_limit_minutes = ?, is_free = ?
     WHERE id = ?`,
    [name, description || '', icon || 'sparkles', daily_limit_minutes || 30, is_free ? 1 : 0, id]
  );

  if (is_free && !existing.is_free) {
    await run('UPDATE users SET free_coupons = free_coupons - 1 WHERE id = 1');
    await run(
      `INSERT INTO point_transactions (id, user_id, type, amount, description, ref_id)
       VALUES (lower(hex(randomblob(16))), 1, 'coupon_use', 0, ?, ?)`,
      [`使用自由奖励券创建关卡：${name}`, id]
    );
  }

  await run('DELETE FROM conditions WHERE quest_id = ?', [id]);
  if (conditions && conditions.length > 0) {
    for (let idx = 0; idx < conditions.length; idx++) {
      const c = conditions[idx];
      await run(
        'INSERT INTO conditions (id, quest_id, title, duration_minutes, sort_order) VALUES (?, ?, ?, ?, ?)',
        [crypto.randomUUID(), id, c.title, Number(c.duration_minutes) || 30, idx]
      );
    }
  }

  // 同步今日及未来的计划条件记录
  const todayStr = new Date().toISOString().slice(0, 10);
  const affectedPlans = await all(
    `SELECT id FROM daily_plans WHERE quest_id = ? AND plan_date >= ? AND status NOT IN ('completed', 'skipped')`,
    [id, todayStr]
  );
  for (const p of affectedPlans) {
    await syncPlanConditions(p.id);
  }

  res.json(await loadQuestWithConditions(id));
});

router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  const quest = await get('SELECT * FROM quests WHERE id = ?', [id]);
  if (!quest) return res.status(404).json({ error: '关卡不存在' });

  await run('UPDATE quests SET active = 0 WHERE id = ?', [id]);

  // 清理该关卡今日及未来的计划（含关联记录），避免已删关卡继续出现或顺延到奖励池
  const plans = await all(
    `SELECT id FROM daily_plans WHERE quest_id = ? AND plan_date >= ?`,
    [id, formatDate(new Date())]
  );
  for (const p of plans) {
    await run('DELETE FROM condition_completions WHERE daily_plan_id = ?', [p.id]);
    await run('DELETE FROM reward_sessions WHERE daily_plan_id = ?', [p.id]);
    await run('DELETE FROM daily_plans WHERE id = ?', [p.id]);
  }

  res.status(204).send();
});

export default router;

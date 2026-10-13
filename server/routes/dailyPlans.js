import { Router } from 'express';
import { get, all, run } from '../db.js';
import { getUser, addPoints, checkBadges, formatDate, conditionPoints } from '../utils.js';

const router = Router();

async function getPlanFull(planId) {
  const plan = await get('SELECT * FROM daily_plans WHERE id = ?', [planId]);
  if (!plan) return null;
  const quest = await get('SELECT * FROM quests WHERE id = ?', [plan.quest_id]);
  const conditions = await all(
    `SELECT c.*, COALESCE(cc.completed, 0) as completed, cc.id as completion_id
     FROM conditions c
     LEFT JOIN condition_completions cc ON cc.condition_id = c.id AND cc.daily_plan_id = ?
     WHERE c.quest_id = ?
     ORDER BY c.sort_order, c.created_at`,
    [planId, plan.quest_id]
  );
  const totalSeconds = (await get(
    'SELECT COALESCE(SUM(duration_seconds), 0) as total FROM reward_sessions WHERE daily_plan_id = ?',
    [planId]
  )).total || 0;
  return { ...plan, quest, conditions, used_seconds: totalSeconds };
}

async function generateDailyPlan(userId, questId, dateStr, isRewardPool = false) {
  const existing = await get(
    'SELECT id FROM daily_plans WHERE user_id = ? AND quest_id = ? AND plan_date = ?',
    [userId, questId, dateStr]
  );
  if (existing) return existing.id;

  const planId = crypto.randomUUID();
  await run(
    `INSERT INTO daily_plans (id, user_id, quest_id, plan_date, status, is_reward_pool)
     VALUES (?, ?, ?, ?, 'locked', ?)`,
    [planId, userId, questId, dateStr, isRewardPool ? 1 : 0]
  );

  const conditions = await all('SELECT id FROM conditions WHERE quest_id = ?', [questId]);
  if (conditions.length === 0) {
    await run("UPDATE daily_plans SET status = 'unlocked' WHERE id = ?", [planId]);
  } else {
    for (const c of conditions) {
      await run(
        'INSERT INTO condition_completions (id, daily_plan_id, condition_id, completed) VALUES (?, ?, ?, 0)',
        [crypto.randomUUID(), planId, c.id]
      );
    }
  }
  return planId;
}

export async function syncPlanConditions(planId) {
  const plan = await get('SELECT * FROM daily_plans WHERE id = ?', [planId]);
  if (!plan || plan.status === 'completed' || plan.status === 'skipped') return;

  const currentConditions = await all('SELECT id FROM conditions WHERE quest_id = ?', [plan.quest_id]);
  const currentConditionIds = currentConditions.map(c => c.id);

  // 删除已不存在的条件完成记录
  const existingCompletions = await all(
    'SELECT * FROM condition_completions WHERE daily_plan_id = ?',
    [planId]
  );
  for (const cc of existingCompletions) {
    if (!currentConditionIds.includes(cc.condition_id)) {
      await run('DELETE FROM condition_completions WHERE id = ?', [cc.id]);
    }
  }

  // 为新增条件补全完成记录
  const existingConditionIds = existingCompletions.map(cc => cc.condition_id);
  for (const c of currentConditions) {
    if (!existingConditionIds.includes(c.id)) {
      await run(
        'INSERT INTO condition_completions (id, daily_plan_id, condition_id, completed) VALUES (?, ?, ?, 0)',
        [crypto.randomUUID(), planId, c.id]
      );
    }
  }

  // 重新评估状态：无条件则解锁，全部完成则解锁，否则锁定
  if (currentConditions.length === 0) {
    if (plan.status !== 'unlocked') {
      await run("UPDATE daily_plans SET status = 'unlocked' WHERE id = ?", [planId]);
    }
  } else {
    const totalRow = await get('SELECT COUNT(*) as cnt FROM condition_completions WHERE daily_plan_id = ?', [planId]);
    const completedRow = await get('SELECT COUNT(*) as cnt FROM condition_completions WHERE daily_plan_id = ? AND completed = 1', [planId]);
    if (totalRow.cnt > 0 && totalRow.cnt === completedRow.cnt && plan.status === 'locked') {
      await run("UPDATE daily_plans SET status = 'unlocked' WHERE id = ?", [planId]);
      await checkBadges('unlock');
      await checkBadges('daily_check');
    } else if (plan.status === 'unlocked' && completedRow.cnt < totalRow.cnt) {
      // 编辑后新增了未完成的条件，重新锁定
      await run("UPDATE daily_plans SET status = 'locked' WHERE id = ?", [planId]);
    }
  }
}

async function ensurePlansForDate(dateStr) {
  const user = await getUser();

  // 1. 确保每个设定在该日期的关卡都有当日计划
  const dailyQuests = await all('SELECT id FROM quests WHERE quest_date = ? AND active = 1', [dateStr]);
  for (const q of dailyQuests) {
    await generateDailyPlan(user.id, q.id, dateStr);
  }

  // 2. 同步所有当日计划的条件完成记录（处理编辑后新增/删除条件）
  const todayPlans = await all('SELECT id FROM daily_plans WHERE user_id = 1 AND plan_date = ?', [dateStr]);
  for (const p of todayPlans) {
    await syncPlanConditions(p.id);
  }

  // 3. 把昨日 locked 的关卡移入奖励池
  const yesterday = new Date(dateStr);
  yesterday.setDate(yesterday.getDate() - 1);
  const yestStr = formatDate(yesterday);
  const lockedYesterday = await all(
    `SELECT DISTINCT quest_id FROM daily_plans WHERE user_id = 1 AND plan_date = ? AND status = 'locked'`,
    [yestStr]
  );
  for (const row of lockedYesterday) {
    await generateDailyPlan(user.id, row.quest_id, dateStr, true);
  }
}

router.get('/', async (req, res) => {
  const dateStr = req.query.date || formatDate(new Date());
  await ensurePlansForDate(dateStr);
  const plans = await all(
    `SELECT dp.id FROM daily_plans dp
     JOIN quests q ON q.id = dp.quest_id
     WHERE dp.user_id = 1 AND dp.plan_date = ? AND q.active = 1
     ORDER BY dp.is_reward_pool ASC, dp.created_at ASC`,
    [dateStr]
  );
  const result = await Promise.all(plans.map(p => getPlanFull(p.id)));
  res.json(result);
});

router.post('/:id/conditions/:cid/toggle', async (req, res) => {
  const { id, cid } = req.params;
  const cc = await get(
    `SELECT cc.*, c.title, c.duration_minutes
     FROM condition_completions cc
     JOIN conditions c ON cc.condition_id = c.id
     WHERE cc.daily_plan_id = ? AND cc.condition_id = ?`,
    [id, cid]
  );
  if (!cc) return res.status(404).json({ error: '条件不存在' });

  const newCompleted = cc.completed ? 0 : 1;
  await run(
    `UPDATE condition_completions SET completed = ?, completed_at = ? WHERE id = ?`,
    [newCompleted, newCompleted ? new Date().toISOString() : null, cc.id]
  );

  const plan = await get('SELECT * FROM daily_plans WHERE id = ?', [id]);
  const points = conditionPoints(cc.duration_minutes);

  if (newCompleted) {
    await addPoints('unlock', points, `完成条件：${cc.title}`, cid);
  } else {
    await addPoints('unlock', -points, `取消条件：${cc.title}`, cid);
  }

  if (plan.status === 'locked') {
    const totalRow = await get('SELECT COUNT(*) as cnt FROM condition_completions WHERE daily_plan_id = ?', [id]);
    const completedRow = await get('SELECT COUNT(*) as cnt FROM condition_completions WHERE daily_plan_id = ? AND completed = 1', [id]);
    if (totalRow.cnt > 0 && totalRow.cnt === completedRow.cnt) {
      await run("UPDATE daily_plans SET status = 'unlocked' WHERE id = ?", [id]);
      await checkBadges('unlock');
      await checkBadges('daily_check');
    }
  } else if (plan.status === 'unlocked' && !newCompleted) {
    // 取消了一个已完成条件，重新锁定
    await run("UPDATE daily_plans SET status = 'locked' WHERE id = ?", [id]);
  }

  res.json(await getPlanFull(id));
});

router.post('/:id/unlock', async (req, res) => {
  const { id } = req.params;
  const plan = await get('SELECT * FROM daily_plans WHERE id = ?', [id]);
  if (!plan) return res.status(404).json({ error: '计划不存在' });
  if (plan.status !== 'locked') return res.json(await getPlanFull(id));

  await run("UPDATE daily_plans SET status = 'unlocked' WHERE id = ?", [id]);
  await checkBadges('unlock');
  res.json(await getPlanFull(id));
});

router.post('/:id/complete', async (req, res) => {
  const { id } = req.params;
  await run("UPDATE daily_plans SET status = 'completed' WHERE id = ?", [id]);
  res.json(await getPlanFull(id));
});

export default router;

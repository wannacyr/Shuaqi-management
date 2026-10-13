import { Router } from 'express';
import { get, all, run } from '../db.js';
import { addPoints, checkBadges, rewardPoints } from '../utils.js';

const router = Router();

router.get('/', async (req, res) => {
  const dateStr = req.query.date;
  let rows;
  if (dateStr) {
    rows = await all(
      `SELECT rs.* FROM reward_sessions rs
       JOIN daily_plans dp ON rs.daily_plan_id = dp.id
       WHERE dp.plan_date = ? ORDER BY rs.started_at DESC`,
      [dateStr]
    );
  } else {
    rows = await all('SELECT * FROM reward_sessions ORDER BY started_at DESC LIMIT 100');
  }
  res.json(rows);
});

router.post('/', async (req, res) => {
  const { daily_plan_id, duration_seconds } = req.body;
  if (!daily_plan_id || duration_seconds == null) {
    return res.status(400).json({ error: '缺少参数' });
  }

  const plan = await get('SELECT * FROM daily_plans WHERE id = ?', [daily_plan_id]);
  if (!plan) return res.status(404).json({ error: '计划不存在' });

  const quest = await get('SELECT * FROM quests WHERE id = ?', [plan.quest_id]);
  const usedSecondsRow = await get(
    'SELECT COALESCE(SUM(duration_seconds), 0) as total FROM reward_sessions WHERE daily_plan_id = ?',
    [daily_plan_id]
  );
  const usedSeconds = usedSecondsRow.total || 0;

  const remainingSeconds = Math.max(0, quest.daily_limit_minutes * 60 - usedSeconds);
  const actualSeconds = Math.min(duration_seconds, remainingSeconds);
  const earnedPoints = rewardPoints(quest.daily_limit_minutes);

  const sessionId = crypto.randomUUID();
  const now = new Date();
  const startedAt = new Date(now.getTime() - actualSeconds * 1000);
  await run(
    `INSERT INTO reward_sessions (id, daily_plan_id, started_at, ended_at, duration_seconds, earned_points)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [sessionId, daily_plan_id, startedAt.toISOString(), now.toISOString(), actualSeconds, earnedPoints]
  );

  await run('UPDATE users SET total_reward_minutes = total_reward_minutes + ? WHERE id = 1', [Math.floor(actualSeconds / 60)]);

  if (earnedPoints > 0) {
    await addPoints('reward', earnedPoints, `享受奖励：${quest.name || ''}`, sessionId);
  }

  await run("UPDATE daily_plans SET status = 'completed' WHERE id = ?", [daily_plan_id]);
  await checkBadges('reward');

  res.status(201).json({
    id: sessionId,
    duration_seconds: actualSeconds,
    earned_points: earnedPoints,
    remaining_seconds: remainingSeconds - actualSeconds
  });
});

export default router;

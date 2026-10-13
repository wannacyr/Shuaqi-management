import { get, run, all } from './db.js';

export async function getUser() {
  return get('SELECT * FROM users WHERE id = 1');
}

export async function getLevelInfo(level) {
  return get('SELECT * FROM levels WHERE level = ?', [level]);
}

export async function getNextLevelInfo(level) {
  return get('SELECT * FROM levels WHERE level = ?', [level + 1]);
}

export async function addPoints(type, amount, description, refId) {
  if (amount === 0) return;
  await run(
    `INSERT INTO point_transactions (id, user_id, type, amount, description, ref_id)
     VALUES (lower(hex(randomblob(16))), 1, ?, ?, ?, ?)`,
    [type, amount, description || '', refId || null]
  );

  await run('UPDATE users SET total_points = total_points + ? WHERE id = 1', [amount]);
  await checkLevelUp();
}

export async function checkLevelUp() {
  const user = await getUser();
  const next = await getNextLevelInfo(user.level);
  if (!next) return;
  if (user.total_points >= next.required_points) {
    await run('UPDATE users SET level = ? WHERE id = 1', [next.level]);
    await addPoints('level_up', 0, `升级到 ${next.level} 级：${next.title}`, null);
  }
}

export async function checkBadges(eventType) {
  const user = await getUser();
  const earnedRows = await all('SELECT badge_id FROM user_badges WHERE user_id = 1');
  const earnedIds = earnedRows.map(r => r.badge_id);
  const badges = await all('SELECT * FROM badges');

  for (const badge of badges) {
    if (earnedIds.includes(badge.id)) continue;
    let awarded = false;
    if (badge.condition_type === 'first_unlock' && eventType === 'unlock') {
      awarded = true;
    } else if (badge.condition_type === 'weekly_streak' && eventType === 'daily_check') {
      awarded = await hasWeeklyStreak();
    } else if (badge.condition_type === 'reward_10h' && user.total_reward_minutes >= 600) {
      awarded = true;
    } else if (badge.condition_type === 'coupon_collector' && eventType === 'coupon_redeem') {
      awarded = true;
    }
    if (awarded) {
      await run(
        `INSERT INTO user_badges (user_id, badge_id, awarded_at) VALUES (1, ?, datetime('now', 'localtime'))`,
        [badge.id]
      );
      await addPoints('badge', 20, `获得徽章：${badge.name}`, badge.id);
    }
  }
}

export async function hasWeeklyStreak() {
  const today = new Date();
  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().slice(0, 10);
    const completed = await get(
      `SELECT COUNT(*) as cnt FROM condition_completions cc
       JOIN daily_plans dp ON cc.daily_plan_id = dp.id
       WHERE dp.plan_date = ? AND cc.completed = 1`,
      [dateStr]
    );
    if (!completed || completed.cnt === 0) return false;
  }
  return true;
}

export function conditionPoints(minutes) {
  const m = Number(minutes) || 0;
  if (m <= 30) return 5;
  if (m <= 60) return 10;
  return 20;
}

export function rewardPoints(minutes) {
  const m = Number(minutes) || 0;
  if (m <= 30) return 10;
  if (m <= 60) return 5;
  return 0;
}

export function formatDate(date) {
  return date.toISOString().slice(0, 10);
}

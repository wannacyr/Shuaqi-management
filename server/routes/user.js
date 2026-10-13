import { Router } from 'express';
import { all, run } from '../db.js';
import { getUser, getLevelInfo, getNextLevelInfo, addPoints, checkBadges } from '../utils.js';

const router = Router();

async function getUserWithBadges() {
  const user = await getUser();
  const currentLevel = await getLevelInfo(user.level);
  const nextLevel = await getNextLevelInfo(user.level);
  const badges = await all(
    `SELECT b.*, ub.awarded_at FROM user_badges ub
     JOIN badges b ON ub.badge_id = b.id
     WHERE ub.user_id = 1 ORDER BY ub.awarded_at DESC`
  );
  return {
    ...user,
    current_level_title: currentLevel?.title || '',
    next_level_points: nextLevel ? nextLevel.required_points - user.total_points : 0,
    badges
  };
}

router.get('/', async (req, res) => {
  res.json(await getUserWithBadges());
});

router.post('/redeem-coupon', async (req, res) => {
  const COUPON_COST = 200;
  const user = await getUser();
  if (user.total_points < COUPON_COST) {
    return res.status(400).json({ error: '积分不足' });
  }
  await addPoints('coupon_redeem', -COUPON_COST, '兑换自由奖励券', null);
  await run('UPDATE users SET free_coupons = free_coupons + 1 WHERE id = 1');
  await checkBadges('coupon_redeem');
  res.json(await getUserWithBadges());
});

export default router;

import { Router } from 'express';
import { all } from '../db.js';

const router = Router();

router.get('/transactions', async (req, res) => {
  const limit = parseInt(req.query.limit, 10) || 100;
  const rows = await all(
    'SELECT * FROM point_transactions WHERE user_id = 1 ORDER BY created_at DESC LIMIT ?',
    [limit]
  );
  res.json(rows);
});

router.get('/daily', async (req, res) => {
  const rows = await all(
    `SELECT date(created_at) as date, SUM(amount) as total
     FROM point_transactions
     WHERE user_id = 1 AND created_at >= datetime('now', '-30 days')
     GROUP BY date(created_at)
     ORDER BY date ASC`
  );
  res.json(rows);
});

export default router;

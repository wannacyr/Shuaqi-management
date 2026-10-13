import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import userRoutes from './routes/user.js';
import questRoutes from './routes/quests.js';
import dailyPlanRoutes from './routes/dailyPlans.js';
import rewardSessionRoutes from './routes/rewardSessions.js';
import pointRoutes from './routes/points.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

app.use('/api/user', userRoutes);
app.use('/api/quests', questRoutes);
app.use('/api/daily-plans', dailyPlanRoutes);
app.use('/api/reward-sessions', rewardSessionRoutes);
app.use('/api/points', pointRoutes);

app.get('/api/health', (req, res) => res.json({ ok: true }));

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

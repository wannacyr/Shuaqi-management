import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
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

// 一体化部署：托管前端构建产物（client/dist）
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const clientDist = path.join(__dirname, '..', 'client', 'dist');
app.use(express.static(clientDist));

// SPA fallback：非 /api 请求一律返回前端 index.html
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) return next();
  res.sendFile(path.join(clientDist, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

// 本地数据层：用 localStorage 模拟原 server 的 SQLite 数据库
// 表结构对应 server/init-db.sql，首次访问时注入种子数据（6 级、4 徽章、1 用户）

const STORAGE_KEY = 'reward_quest_db_v1';

export function uuid() {
  return crypto.randomUUID();
}

function nowIso() {
  return new Date().toISOString();
}

function seedData() {
  return {
    user: {
      id: 1,
      name: '玩家',
      total_points: 0,
      level: 1,
      free_coupons: 0,
      total_reward_minutes: 0,
      created_at: nowIso(),
    },
    levels: [
      { level: 1, required_points: 0, title: '初心者' },
      { level: 2, required_points: 100, title: '见习勇者' },
      { level: 3, required_points: 300, title: '奖励猎人' },
      { level: 4, required_points: 600, title: '娱乐大师' },
      { level: 5, required_points: 1000, title: '生活玩家' },
      { level: 6, required_points: 1500, title: '快乐传奇' },
    ],
    badges: [
      { id: 'first_unlock', name: '首次解锁', description: '成功解锁第一个奖励关卡', icon: 'trophy', condition_type: 'first_unlock' },
      { id: 'weekly_streak', name: '七日连击', description: '连续 7 天完成至少一个前置条件', icon: 'flame', condition_type: 'weekly_streak' },
      { id: 'reward_10h', name: '沉浸十小时', description: '累计享受奖励达到 10 小时', icon: 'clock', condition_type: 'reward_10h' },
      { id: 'coupon_collector', name: '自由兑换者', description: '兑换过自由奖励券', icon: 'ticket', condition_type: 'coupon_collector' },
    ],
    user_badges: [],
    quests: [],
    conditions: [],
    daily_plans: [],
    condition_completions: [],
    reward_sessions: [],
    point_transactions: [],
  };
}

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (
      !data ||
      typeof data !== 'object' ||
      !data.user ||
      !Array.isArray(data.levels) ||
      !Array.isArray(data.quests) ||
      !Array.isArray(data.conditions)
    ) {
      return null;
    }
    return data;
  } catch {
    return null;
  }
}

let db = load();
if (!db) {
  db = seedData();
  persist();
}

function persist() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
  } catch (e) {
    console.error('本地数据持久化失败', e);
  }
}

export function getDb() {
  return db;
}

export function save() {
  persist();
}

export function resetDb() {
  db = seedData();
  persist();
  return db;
}

// 整体替换数据库（导入备份用）；调用方负责结构校验，导入后需刷新页面
export function replaceDb(data) {
  db = data;
  persist();
}

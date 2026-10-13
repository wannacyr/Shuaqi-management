PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  name TEXT NOT NULL DEFAULT '玩家',
  total_points INTEGER NOT NULL DEFAULT 0,
  level INTEGER NOT NULL DEFAULT 1,
  free_coupons INTEGER NOT NULL DEFAULT 0,
  total_reward_minutes INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
);

CREATE TABLE IF NOT EXISTS levels (
  level INTEGER PRIMARY KEY,
  required_points INTEGER NOT NULL,
  title TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS badges (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL,
  condition_type TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS user_badges (
  user_id INTEGER NOT NULL DEFAULT 1,
  badge_id TEXT NOT NULL,
  awarded_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
  PRIMARY KEY (user_id, badge_id),
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (badge_id) REFERENCES badges(id)
);

CREATE TABLE IF NOT EXISTS quests (
  id TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL DEFAULT 1,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT NOT NULL DEFAULT 'gamepad-2',
  unlock_points INTEGER NOT NULL DEFAULT 10,
  reward_rate INTEGER NOT NULL DEFAULT 1,
  daily_limit_minutes INTEGER NOT NULL DEFAULT 30,
  is_daily INTEGER NOT NULL DEFAULT 1,
  is_free INTEGER NOT NULL DEFAULT 0,
  quest_date TEXT,
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS conditions (
  id TEXT PRIMARY KEY,
  quest_id TEXT NOT NULL,
  title TEXT NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 30,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
  FOREIGN KEY (quest_id) REFERENCES quests(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS daily_plans (
  id TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL DEFAULT 1,
  quest_id TEXT NOT NULL,
  plan_date TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'locked' CHECK (status IN ('locked', 'unlocked', 'completed', 'skipped')),
  is_reward_pool INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (quest_id) REFERENCES quests(id)
);

CREATE TABLE IF NOT EXISTS condition_completions (
  id TEXT PRIMARY KEY,
  daily_plan_id TEXT NOT NULL,
  condition_id TEXT NOT NULL,
  completed INTEGER NOT NULL DEFAULT 0,
  completed_at TEXT,
  FOREIGN KEY (daily_plan_id) REFERENCES daily_plans(id) ON DELETE CASCADE,
  FOREIGN KEY (condition_id) REFERENCES conditions(id) ON DELETE CASCADE,
  UNIQUE(daily_plan_id, condition_id)
);

CREATE TABLE IF NOT EXISTS reward_sessions (
  id TEXT PRIMARY KEY,
  daily_plan_id TEXT NOT NULL,
  started_at TEXT NOT NULL,
  ended_at TEXT,
  duration_seconds INTEGER NOT NULL DEFAULT 0,
  earned_points INTEGER NOT NULL DEFAULT 0,
  FOREIGN KEY (daily_plan_id) REFERENCES daily_plans(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS point_transactions (
  id TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL DEFAULT 1,
  type TEXT NOT NULL CHECK (type IN ('unlock', 'reward', 'level_up', 'badge', 'coupon_redeem', 'coupon_use')),
  amount INTEGER NOT NULL,
  description TEXT,
  ref_id TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

INSERT OR IGNORE INTO users (id, name, total_points, level, free_coupons) VALUES (1, '玩家', 0, 1, 0);

INSERT OR IGNORE INTO levels (level, required_points, title) VALUES
  (1, 0, '初心者'),
  (2, 100, '见习勇者'),
  (3, 300, '奖励猎人'),
  (4, 600, '娱乐大师'),
  (5, 1000, '生活玩家'),
  (6, 1500, '快乐传奇');

INSERT OR IGNORE INTO badges (id, name, description, icon, condition_type) VALUES
  ('first_unlock', '首次解锁', '成功解锁第一个奖励关卡', 'trophy', 'first_unlock'),
  ('weekly_streak', '七日连击', '连续 7 天完成至少一个前置条件', 'flame', 'weekly_streak'),
  ('reward_10h', '沉浸十小时', '累计享受奖励达到 10 小时', 'clock', 'reward_10h'),
  ('coupon_collector', '自由兑换者', '兑换过自由奖励券', 'ticket', 'coupon_collector');

CREATE INDEX IF NOT EXISTS idx_daily_plans_date ON daily_plans(plan_date);
CREATE INDEX IF NOT EXISTS idx_daily_plans_user ON daily_plans(user_id);
CREATE INDEX IF NOT EXISTS idx_conditions_quest ON conditions(quest_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user_created ON point_transactions(user_id, created_at);

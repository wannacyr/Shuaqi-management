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
      // ---- 常规成就（新增） ----
      { id: 'first_condition', name: '初试锋芒', description: '首次完成一个前置条件', icon: 'target', condition_type: 'first_condition' },
      { id: 'conditions_10', name: '条件猎手', description: '累计完成 10 个前置条件', icon: 'dumbbell', condition_type: 'conditions_10' },
      { id: 'conditions_50', name: '习惯养成', description: '累计完成 50 个前置条件', icon: 'brick-wall', condition_type: 'conditions_50' },
      { id: 'conditions_100', name: '百炼成钢', description: '累计完成 100 个前置条件', icon: 'swords', condition_type: 'conditions_100' },
      { id: 'first_plan_complete', name: '首次通关', description: '首次完成整个奖励关卡', icon: 'flag', condition_type: 'first_plan_complete' },
      { id: 'plans_5', name: '五关斩将', description: '累计完成 5 个奖励关卡', icon: 'hand', condition_type: 'plans_5' },
      { id: 'plans_10', name: '十关连破', description: '累计完成 10 个奖励关卡', icon: 'medal', condition_type: 'plans_10' },
      { id: 'points_200', name: '小有积蓄', description: '累计获得 200 积分', icon: 'coins', condition_type: 'points_200' },
      { id: 'points_1000', name: '积分富翁', description: '累计获得 1000 积分', icon: 'gem', condition_type: 'points_1000' },
      { id: 'reward_30h', name: '沉浸三十时', description: '累计享受奖励达到 30 小时', icon: 'hourglass', condition_type: 'reward_30h' },
      { id: 'perfect_day', name: '完美一天', description: '当天所有奖励关卡全部完成', icon: 'star', condition_type: 'perfect_day' },
      // ---- 隐藏成就（获得前显示 ???） ----
      { id: 'night_owl', name: '夜猫子', description: '晚上 23 点后完成一个前置条件', icon: 'moon', condition_type: 'night_owl', hidden: true },
      { id: 'early_bird', name: '早起鸟', description: '早上 7 点前完成一个前置条件', icon: 'sunrise', condition_type: 'early_bird', hidden: true },
      { id: 'unlock_3_day', name: '摸鱼大师', description: '同一天解锁 3 个及以上奖励关卡', icon: 'fish', condition_type: 'unlock_3_day', hidden: true },
      { id: 'coupon_hoarder', name: '囤券达人', description: '同时持有 5 张及以上自由奖励券', icon: 'tickets', condition_type: 'coupon_hoarder', hidden: true },
      { id: 'lazy_day', name: '一日躺平', description: '同一天解锁的 3 个及以上关卡全部使用自由奖励券', icon: 'sofa', condition_type: 'lazy_day', hidden: true },
      { id: 'nice_try', name: 'Nice try', description: '没有自由奖励券时创建了一个无条件的奖励关卡', icon: 'laugh', condition_type: 'nice_try', hidden: true },
      { id: 'oops', name: 'Oops', description: '在最后一项条件的确认卡上点了「等下，我手滑了」', icon: 'undo-2', condition_type: 'oops', hidden: true },
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
} else {
  // 老库升级：补录后续版本新增的徽章定义（不清空已获得的徽章记录）
  const seed = seedData();
  if (!Array.isArray(db.badges)) db.badges = [];
  if (!Array.isArray(db.user_badges)) db.user_badges = [];
  const knownIds = new Set(db.badges.map((b) => b.id));
  let migrated = false;
  for (const b of seed.badges) {
    if (!knownIds.has(b.id)) {
      db.badges.push(b);
      migrated = true;
    }
  }
  if (migrated) persist();
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

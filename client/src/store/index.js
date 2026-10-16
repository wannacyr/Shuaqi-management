// 纯前端版业务逻辑：把原 server/routes + server/utils 迁移到浏览器 localStorage
// 约定：内部辅助函数（addPoints / checkBadges 等）只改内存不落盘；
//       顶层导出的操作函数在完成后调用 save() 一次性持久化。
import { getDb, save, uuid } from './db.js';

// ---------- 通用工具 ----------
export function formatDate(date) {
  const d = date instanceof Date ? date : new Date(date);
  return d.toISOString().slice(0, 10);
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

// ---------- 内部查询 ----------
function getLevelInfo(level) {
  return getDb().levels.find((l) => l.level === level) || null;
}

function getNextLevelInfo(level) {
  return getDb().levels.find((l) => l.level === level + 1) || null;
}

// ---------- 积分 ----------
function addPoints(type, amount, description, refId) {
  if (amount === 0) return;
  const db = getDb();
  db.point_transactions.unshift({
    id: uuid(),
    user_id: 1,
    type,
    amount,
    description: description || '',
    ref_id: refId || null,
    created_at: new Date().toISOString(),
  });
  db.user.total_points += amount;
  checkLevelUp();
}

function checkLevelUp() {
  const db = getDb();
  const next = getNextLevelInfo(db.user.level);
  if (!next) return;
  if (db.user.total_points >= next.required_points) {
    db.user.level = next.level;
    addPoints('level_up', 0, `升级到 ${next.level} 级：${next.title}`, null);
  }
}

// ---------- 徽章 ----------
function hasWeeklyStreak() {
  const db = getDb();
  const today = new Date();
  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = formatDate(d);
    const hasCompleted = db.condition_completions.some((cc) => {
      if (!cc.completed) return false;
      const plan = db.daily_plans.find((p) => p.id === cc.daily_plan_id);
      return !!plan && plan.plan_date === dateStr;
    });
    if (!hasCompleted) return false;
  }
  return true;
}

function checkBadges(eventType) {
  const db = getDb();
  const earnedIds = db.user_badges.map((b) => b.badge_id);
  for (const badge of db.badges) {
    if (earnedIds.includes(badge.id)) continue;
    let awarded = false;
    if (badge.condition_type === 'first_unlock' && eventType === 'unlock') {
      awarded = true;
    } else if (badge.condition_type === 'weekly_streak' && eventType === 'daily_check') {
      awarded = hasWeeklyStreak();
    } else if (badge.condition_type === 'reward_10h' && db.user.total_reward_minutes >= 600) {
      awarded = true;
    } else if (badge.condition_type === 'coupon_collector' && eventType === 'coupon_redeem') {
      awarded = true;
    }
    if (awarded) {
      db.user_badges.push({ badge_id: badge.id, awarded_at: new Date().toISOString() });
      addPoints('badge', 20, `获得徽章：${badge.name}`, badge.id);
      // 通知前端弹出徽章激励卡（BadgeToast 监听此事件）
      window.dispatchEvent(new CustomEvent('rewardquest:badge-earned', {
        detail: { name: badge.name, description: badge.description, points: 20 },
      }));
    }
  }
}

// ---------- 用户 ----------
function getUserWithBadges() {
  const db = getDb();
  const user = { ...db.user };
  const currentLevel = getLevelInfo(user.level);
  const nextLevel = getNextLevelInfo(user.level);
  const badges = db.user_badges
    .map((ub) => {
      const badge = db.badges.find((b) => b.id === ub.badge_id);
      return badge ? { ...badge, awarded_at: ub.awarded_at } : null;
    })
    .filter(Boolean)
    .sort((a, b) => String(b.awarded_at || '').localeCompare(String(a.awarded_at || '')));
  return {
    ...user,
    current_level_title: currentLevel?.title || '',
    next_level_points: nextLevel ? nextLevel.required_points - user.total_points : 0,
    badges,
  };
}

export function getUser() {
  return getUserWithBadges();
}

export function redeemCoupon() {
  const db = getDb();
  const COUPON_COST = 200;
  if (db.user.total_points < COUPON_COST) {
    throw new Error('积分不足');
  }
  addPoints('coupon_redeem', -COUPON_COST, '兑换自由奖励券', null);
  db.user.free_coupons += 1;
  checkBadges('coupon_redeem');
  save();
  return getUserWithBadges();
}

// ---------- 关卡 ----------
function loadQuestWithConditions(questId) {
  const db = getDb();
  const quest = db.quests.find((q) => q.id === questId);
  if (!quest) return null;
  const conditions = db.conditions
    .filter((c) => c.quest_id === questId)
    .sort((a, b) => a.sort_order - b.sort_order || String(a.created_at || '').localeCompare(String(b.created_at || '')));
  return { ...quest, conditions };
}

export function listQuests() {
  const db = getDb();
  return db.quests
    .filter((q) => q.active === 1)
    .sort((a, b) => String(b.created_at || '').localeCompare(String(a.created_at || '')))
    .map((q) => loadQuestWithConditions(q.id));
}

export function createQuest(data) {
  const db = getDb();
  const { name, description, icon, daily_limit_minutes, is_free, conditions, quest_date, repeat_type, repeat_weekday, repeat_until } = data || {};
  const questId = uuid();

  if (is_free) {
    if (db.user.free_coupons <= 0) {
      throw new Error('自由奖励券不足');
    }
  }

  const quest = {
    id: questId,
    user_id: 1,
    name,
    description: description || '',
    icon: icon || 'sparkles',
    unlock_points: 10,
    reward_rate: 1,
    daily_limit_minutes: daily_limit_minutes || 30,
    is_daily: 0,
    is_free: is_free ? 1 : 0,
    quest_date: quest_date || formatDate(new Date()),
    repeat_type: repeat_type || 'none',
    repeat_weekday: repeat_type === 'weekly' ? (repeat_weekday ?? 0) : null,
    repeat_until: repeat_type && repeat_type !== 'none' ? (repeat_until || null) : null,
    active: 1,
    created_at: new Date().toISOString(),
  };
  db.quests.push(quest);

  if (is_free) {
    db.user.free_coupons -= 1;
    db.point_transactions.unshift({
      id: uuid(),
      user_id: 1,
      type: 'coupon_use',
      amount: 0,
      description: `使用自由奖励券创建关卡：${name}`,
      ref_id: questId,
      created_at: new Date().toISOString(),
    });
  }

  if (conditions && conditions.length > 0) {
    conditions.forEach((c, idx) => {
      db.conditions.push({
        id: uuid(),
        quest_id: questId,
        title: c.title,
        duration_minutes: Number(c.duration_minutes) || 30,
        sort_order: idx,
        created_at: new Date().toISOString(),
      });
    });
  }

  save();
  return loadQuestWithConditions(questId);
}

export function updateQuest(id, data) {
  const db = getDb();
  const { name, description, icon, daily_limit_minutes, is_free, conditions, repeat_type, repeat_weekday, repeat_until } = data || {};

  const existing = db.quests.find((q) => q.id === id);
  if (!existing) throw new Error('关卡不存在');

  const wasFree = !!existing.is_free;
  if (is_free && !wasFree) {
    if (db.user.free_coupons <= 0) {
      throw new Error('自由奖励券不足');
    }
  }

  existing.name = name;
  existing.description = description || '';
  existing.icon = icon || 'sparkles';
  existing.daily_limit_minutes = daily_limit_minutes || 30;
  existing.is_free = is_free ? 1 : 0;
  existing.repeat_type = repeat_type || 'none';
  existing.repeat_weekday = repeat_type === 'weekly' ? (repeat_weekday ?? 0) : null;
  existing.repeat_until = repeat_type && repeat_type !== 'none' ? (repeat_until || null) : null;

  if (is_free && !wasFree) {
    db.user.free_coupons -= 1;
    db.point_transactions.unshift({
      id: uuid(),
      user_id: 1,
      type: 'coupon_use',
      amount: 0,
      description: `使用自由奖励券创建关卡：${name}`,
      ref_id: id,
      created_at: new Date().toISOString(),
    });
  }

  // 重建条件
  db.conditions = db.conditions.filter((c) => c.quest_id !== id);
  if (conditions && conditions.length > 0) {
    conditions.forEach((c, idx) => {
      db.conditions.push({
        id: uuid(),
        quest_id: id,
        title: c.title,
        duration_minutes: Number(c.duration_minutes) || 30,
        sort_order: idx,
        created_at: new Date().toISOString(),
      });
    });
  }

  // 同步今日及未来计划的条件记录
  syncPlansForQuest(id);

  save();
  return loadQuestWithConditions(id);
}

export function deleteQuest(id) {
  const db = getDb();
  const quest = db.quests.find((q) => q.id === id);
  if (!quest) throw new Error('关卡不存在');

  quest.active = 0;

  const todayStr = formatDate(new Date());
  const plans = db.daily_plans.filter((p) => p.quest_id === id && p.plan_date >= todayStr);
  for (const p of plans) {
    db.condition_completions = db.condition_completions.filter((cc) => cc.daily_plan_id !== p.id);
    db.reward_sessions = db.reward_sessions.filter((rs) => rs.daily_plan_id !== p.id);
    db.daily_plans = db.daily_plans.filter((pp) => pp.id !== p.id);
  }

  save();
  return true;
}

// ---------- 每日计划 ----------
function getPlanFull(planId) {
  const db = getDb();
  const plan = db.daily_plans.find((p) => p.id === planId);
  if (!plan) return null;
  const quest = db.quests.find((q) => q.id === plan.quest_id);
  const conditions = db.conditions
    .filter((c) => c.quest_id === plan.quest_id)
    .sort((a, b) => a.sort_order - b.sort_order || String(a.created_at || '').localeCompare(String(b.created_at || '')))
    .map((c) => {
      const cc = db.condition_completions.find((x) => x.condition_id === c.id && x.daily_plan_id === planId);
      return { ...c, completed: cc ? cc.completed : 0, completion_id: cc ? cc.id : null };
    });
  const used_seconds = db.reward_sessions
    .filter((rs) => rs.daily_plan_id === planId)
    .reduce((sum, rs) => sum + (rs.duration_seconds || 0), 0);
  return { ...plan, quest, conditions, used_seconds };
}

function generateDailyPlan(questId, dateStr, isRewardPool = false) {
  const db = getDb();
  const existing = db.daily_plans.find((p) => p.quest_id === questId && p.plan_date === dateStr);
  if (existing) return existing.id;

  const planId = uuid();
  const plan = {
    id: planId,
    user_id: 1,
    quest_id: questId,
    plan_date: dateStr,
    status: 'locked',
    is_reward_pool: isRewardPool ? 1 : 0,
    created_at: new Date().toISOString(),
  };
  db.daily_plans.push(plan);

  const conditions = db.conditions.filter((c) => c.quest_id === questId);
  if (conditions.length === 0) {
    plan.status = 'unlocked';
  } else {
    for (const c of conditions) {
      db.condition_completions.push({
        id: uuid(),
        daily_plan_id: planId,
        condition_id: c.id,
        completed: 0,
        completed_at: null,
      });
    }
  }
  return planId;
}

// 顺延：把源计划的 dayend 状态（计划状态 + 各条件勾选）复制到新计划
function carryOverPlanState(srcPlanId, dstPlanId, status) {
  const db = getDb();
  const srcCcs = db.condition_completions.filter((cc) => cc.daily_plan_id === srcPlanId);
  for (const srcCc of srcCcs) {
    const dstCc = db.condition_completions.find(
      (cc) => cc.daily_plan_id === dstPlanId && cc.condition_id === srcCc.condition_id
    );
    if (dstCc) {
      dstCc.completed = srcCc.completed;
      dstCc.completed_at = srcCc.completed_at;
    }
  }
  const dstPlan = db.daily_plans.find((p) => p.id === dstPlanId);
  if (dstPlan && (status === 'locked' || status === 'unlocked')) {
    dstPlan.status = status;
  }
}

function syncPlanConditions(planId) {
  const db = getDb();
  const plan = db.daily_plans.find((p) => p.id === planId);
  if (!plan || plan.status === 'completed' || plan.status === 'skipped') return;

  const currentConditions = db.conditions.filter((c) => c.quest_id === plan.quest_id);
  const currentConditionIds = currentConditions.map((c) => c.id);

  // 删除已不存在的条件完成记录
  db.condition_completions = db.condition_completions.filter((cc) => {
    if (cc.daily_plan_id !== planId) return true;
    return currentConditionIds.includes(cc.condition_id);
  });

  // 为新增条件补全完成记录
  const existingConditionIds = db.condition_completions
    .filter((cc) => cc.daily_plan_id === planId)
    .map((cc) => cc.condition_id);
  for (const c of currentConditions) {
    if (!existingConditionIds.includes(c.id)) {
      db.condition_completions.push({
        id: uuid(),
        daily_plan_id: planId,
        condition_id: c.id,
        completed: 0,
        completed_at: null,
      });
    }
  }

  // 重新评估状态：无条件则解锁，全部完成则解锁，否则锁定
  if (currentConditions.length === 0) {
    if (plan.status !== 'unlocked') plan.status = 'unlocked';
  } else {
    const total = db.condition_completions.filter((cc) => cc.daily_plan_id === planId).length;
    const completed = db.condition_completions.filter((cc) => cc.daily_plan_id === planId && cc.completed === 1).length;
    if (total > 0 && total === completed && plan.status === 'locked') {
      plan.status = 'unlocked';
      checkBadges('unlock');
      checkBadges('daily_check');
    } else if (plan.status === 'unlocked' && completed < total) {
      plan.status = 'locked';
    }
  }
}

function syncPlansForQuest(questId) {
  const db = getDb();
  const todayStr = formatDate(new Date());
  const affectedPlans = db.daily_plans.filter(
    (p) => p.quest_id === questId && p.plan_date >= todayStr && p.status !== 'completed' && p.status !== 'skipped'
  );
  for (const p of affectedPlans) {
    syncPlanConditions(p.id);
  }
}

// 判断关卡在某日期是否应出现：创建日当天 + 重复规则覆盖的日期
function questOccursOnDate(q, dateStr) {
  if (q.quest_date === dateStr) return true;
  if (!q.repeat_type || q.repeat_type === 'none') return false;
  const start = q.quest_date || dateStr;
  if (dateStr < start) return false;
  if (q.repeat_until && dateStr > q.repeat_until) return false;
  if (q.repeat_type === 'daily') return true;
  if (q.repeat_type === 'weekly') {
    const [y, m, d] = dateStr.split('-').map(Number);
    return new Date(y, m - 1, d).getDay() === (q.repeat_weekday ?? 0);
  }
  return false;
}

function ensurePlansForDate(dateStr) {
  const db = getDb();

  // 1. 每个设定在该日期（含重复规则命中）的关卡生成当日计划
  const dailyQuests = db.quests.filter((q) => q.active === 1 && questOccursOnDate(q, dateStr));
  for (const q of dailyQuests) {
    generateDailyPlan(q.id, dateStr);
  }

  // 2. 同步所有当日计划的条件（处理编辑后新增/删除条件）
  const todayPlans = db.daily_plans.filter((p) => p.plan_date === dateStr);
  for (const p of todayPlans) {
    syncPlanConditions(p.id);
  }

  // 3. 昨日未完成（locked / unlocked）的关卡顺延到今日奖励池，状态维持昨日 dayend 状态
  const yesterday = new Date(dateStr);
  yesterday.setDate(yesterday.getDate() - 1);
  const yestStr = formatDate(yesterday);
  const unfinishedPlans = db.daily_plans.filter(
    (p) => p.plan_date === yestStr && (p.status === 'locked' || p.status === 'unlocked')
  );
  for (const srcPlan of unfinishedPlans) {
    const existing = db.daily_plans.find((p) => p.quest_id === srcPlan.quest_id && p.plan_date === dateStr);
    if (existing) continue;
    const newPlanId = generateDailyPlan(srcPlan.quest_id, dateStr, true);
    carryOverPlanState(srcPlan.id, newPlanId, srcPlan.status);
  }
}

export function getDailyPlans(date) {
  const db = getDb();
  const dateStr = date || formatDate(new Date());
  ensurePlansForDate(dateStr);
  const plans = db.daily_plans
    .filter((p) => p.plan_date === dateStr)
    .filter((p) => {
      const q = db.quests.find((qq) => qq.id === p.quest_id);
      return !!q && q.active === 1;
    })
    .sort((a, b) => {
      if (a.is_reward_pool !== b.is_reward_pool) return (a.is_reward_pool || 0) - (b.is_reward_pool || 0);
      return String(a.created_at || '').localeCompare(String(b.created_at || ''));
    });
  return plans.map((p) => getPlanFull(p.id));
}

export function toggleCondition(planId, conditionId) {
  const db = getDb();
  const cc = db.condition_completions.find((x) => x.daily_plan_id === planId && x.condition_id === conditionId);
  if (!cc) throw new Error('条件不存在');

  const condition = db.conditions.find((c) => c.id === conditionId);
  if (!condition) throw new Error('条件不存在');

  const plan = db.daily_plans.find((p) => p.id === planId);
  if (!plan) throw new Error('计划不存在');
  const today = formatDate(new Date());
  if (plan.plan_date !== today) throw new Error('只能完成当天的条件');

  const newCompleted = cc.completed ? 0 : 1;
  cc.completed = newCompleted;
  cc.completed_at = newCompleted ? new Date().toISOString() : null;

  const points = conditionPoints(condition.duration_minutes);

  if (newCompleted) {
    addPoints('unlock', points, `完成条件：${condition.title}`, conditionId);
  } else {
    addPoints('unlock', -points, `取消条件：${condition.title}`, conditionId);
  }

  if (plan.status === 'locked') {
    const total = db.condition_completions.filter((x) => x.daily_plan_id === planId).length;
    const completed = db.condition_completions.filter((x) => x.daily_plan_id === planId && x.completed === 1).length;
    if (total > 0 && total === completed) {
      plan.status = 'unlocked';
      checkBadges('unlock');
      checkBadges('daily_check');
    }
  } else if (plan.status === 'unlocked' && !newCompleted) {
    plan.status = 'locked';
  }

  save();
  return getPlanFull(planId);
}

export function unlockPlan(planId) {
  const db = getDb();
  const plan = db.daily_plans.find((p) => p.id === planId);
  if (!plan) throw new Error('计划不存在');
  if (plan.status === 'locked') {
    plan.status = 'unlocked';
    checkBadges('unlock');
  }
  save();
  return getPlanFull(planId);
}

export function completePlan(planId) {
  const db = getDb();
  const plan = db.daily_plans.find((p) => p.id === planId);
  if (plan) plan.status = 'completed';
  save();
  return getPlanFull(planId);
}

// ---------- 奖励会话 ----------
export function createRewardSession(dailyPlanId, durationSeconds) {
  const db = getDb();
  if (!dailyPlanId || durationSeconds == null) {
    throw new Error('缺少参数');
  }

  const plan = db.daily_plans.find((p) => p.id === dailyPlanId);
  if (!plan) throw new Error('计划不存在');

  const quest = db.quests.find((q) => q.id === plan.quest_id);
  if (!quest) throw new Error('关卡不存在');

  const usedSeconds = db.reward_sessions
    .filter((rs) => rs.daily_plan_id === dailyPlanId)
    .reduce((sum, rs) => sum + (rs.duration_seconds || 0), 0);

  const remainingSeconds = Math.max(0, quest.daily_limit_minutes * 60 - usedSeconds);
  const actualSeconds = Math.min(durationSeconds, remainingSeconds);
  const earnedPoints = rewardPoints(quest.daily_limit_minutes);

  const sessionId = uuid();
  const now = new Date();
  const startedAt = new Date(now.getTime() - actualSeconds * 1000);
  db.reward_sessions.push({
    id: sessionId,
    daily_plan_id: dailyPlanId,
    started_at: startedAt.toISOString(),
    ended_at: now.toISOString(),
    duration_seconds: actualSeconds,
    earned_points: earnedPoints,
  });

  db.user.total_reward_minutes += Math.floor(actualSeconds / 60);

  if (earnedPoints > 0) {
    addPoints('reward', earnedPoints, `享受奖励：${quest.name || ''}`, sessionId);
  }

  plan.status = 'completed';
  checkBadges('reward');
  save();

  return {
    id: sessionId,
    duration_seconds: actualSeconds,
    earned_points: earnedPoints,
    remaining_seconds: remainingSeconds - actualSeconds,
  };
}

// 暂停返回时累计已享受时长：只记录时长（used_seconds 随之更新），不结算积分、不改变计划状态
export function recordRewardUsage(dailyPlanId, durationSeconds) {
  const db = getDb();
  if (!dailyPlanId || !durationSeconds || durationSeconds <= 0) return null;

  const plan = db.daily_plans.find((p) => p.id === dailyPlanId);
  if (!plan) throw new Error('计划不存在');
  const quest = db.quests.find((q) => q.id === plan.quest_id);
  if (!quest) throw new Error('关卡不存在');

  const usedSeconds = db.reward_sessions
    .filter((rs) => rs.daily_plan_id === dailyPlanId)
    .reduce((sum, rs) => sum + (rs.duration_seconds || 0), 0);
  const remainingSeconds = Math.max(0, quest.daily_limit_minutes * 60 - usedSeconds);
  const actualSeconds = Math.min(Math.floor(durationSeconds), remainingSeconds);
  if (actualSeconds <= 0) return null;

  const now = new Date();
  const startedAt = new Date(now.getTime() - actualSeconds * 1000);
  db.reward_sessions.push({
    id: uuid(),
    daily_plan_id: dailyPlanId,
    started_at: startedAt.toISOString(),
    ended_at: now.toISOString(),
    duration_seconds: actualSeconds,
    earned_points: 0,
  });

  db.user.total_reward_minutes += Math.floor(actualSeconds / 60);
  save();

  return { used_seconds: usedSeconds + actualSeconds, remaining_seconds: remainingSeconds - actualSeconds };
}

export function listRewardSessions(date) {
  const db = getDb();
  let rows;
  if (date) {
    rows = db.reward_sessions.filter((rs) => {
      const plan = db.daily_plans.find((p) => p.id === rs.daily_plan_id);
      return !!plan && plan.plan_date === date;
    });
    rows = rows.sort((a, b) => String(b.started_at || '').localeCompare(String(a.started_at || '')));
  } else {
    rows = [...db.reward_sessions]
      .sort((a, b) => String(b.started_at || '').localeCompare(String(a.started_at || '')))
      .slice(0, 100);
  }
  return rows;
}

// ---------- 积分查询 ----------
export function getTransactions(limit = 100) {
  const db = getDb();
  const n = Number(limit) || 100;
  return [...db.point_transactions]
    .sort((a, b) => String(b.created_at || '').localeCompare(String(a.created_at || '')))
    .slice(0, n);
}

export function getDailyPoints() {
  const db = getDb();
  const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const map = {};
  for (const tx of db.point_transactions) {
    if (tx.created_at && tx.created_at >= cutoff) {
      const date = tx.created_at.slice(0, 10);
      map[date] = (map[date] || 0) + tx.amount;
    }
  }
  return Object.keys(map)
    .sort()
    .map((date) => ({ date, total: map[date] }));
}

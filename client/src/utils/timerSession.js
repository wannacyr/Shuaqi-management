// 计时会话持久化：防止刷新 / 切页 / 关闭标签页丢失已享受时长
// 与主数据库键 reward_quest_db_v1 相互独立，仅存"当前进行中的计时会话"

const TIMER_KEY = 'reward_quest_active_timer_v1';

// 读取未完成的计时会话；无记录或数据损坏时返回 null
export function loadTimerSession() {
  try {
    const raw = localStorage.getItem(TIMER_KEY);
    if (!raw) return null;
    const session = JSON.parse(raw);
    if (!session || !session.planId) return null;
    return session;
  } catch {
    return null;
  }
}

// 写入计时会话（elapsedBase = 已累计秒数；lastStartAt = 计时中则为最近 start/resume 时间戳，暂停时为 null）
export function saveTimerSession(session) {
  try {
    if (!session || !session.planId) return;
    localStorage.setItem(TIMER_KEY, JSON.stringify({ ...session, savedAt: Date.now() }));
  } catch {
    /* 写入失败不影响计时本身 */
  }
}

export function clearTimerSession() {
  try {
    localStorage.removeItem(TIMER_KEY);
  } catch {
    /* 忽略 */
  }
}

// 由持久化会话推算"此刻"已累计的秒数（计时中的话把离开期间流逝的时间补上）
export function sessionElapsed(session) {
  if (!session) return 0;
  const base = session.elapsedBase || 0;
  if (session.lastStartAt) {
    return base + Math.floor((Date.now() - session.lastStartAt) / 1000);
  }
  return base;
}

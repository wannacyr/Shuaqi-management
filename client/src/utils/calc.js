export function formatDuration(totalSeconds) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function clamp(num, min, max) {
  return Math.max(min, Math.min(max, num));
}

export function calcProgress(conditions) {
  if (!conditions || conditions.length === 0) return 100;
  const completed = conditions.filter(c => c.completed).length;
  return Math.round((completed / conditions.length) * 100);
}

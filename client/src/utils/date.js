export function formatDate(date) {
  const d = date instanceof Date ? date : new Date(date);
  return d.toISOString().slice(0, 10);
}

export function todayStr() {
  return formatDate(new Date());
}

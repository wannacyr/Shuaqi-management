import { useMemo } from 'react';
import { startOfMonth, endOfMonth, eachDayOfInterval, format, getDay, subMonths } from 'date-fns';

export function CalendarHeatmap({ data, title }) {
  const months = useMemo(() => {
    const end = endOfMonth(new Date());
    const start = startOfMonth(subMonths(new Date(), 2));
    const days = eachDayOfInterval({ start, end });

    const map = new Map(data.map(d => [d.date, d.value]));
    const max = Math.max(1, ...data.map(d => d.value));

    const weeks = [];
    let currentWeek = [];
    days.forEach(day => {
      const dayOfWeek = getDay(day);
      if (dayOfWeek === 0 && currentWeek.length > 0) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
      currentWeek.push({ date: day, value: map.get(format(day, 'yyyy-MM-dd')) || 0 });
    });
    if (currentWeek.length > 0) weeks.push(currentWeek);
    return { weeks, max };
  }, [data]);

  function intensity(value, max) {
    if (value === 0) return 'bg-slate-100';
    const ratio = value / max;
    if (ratio <= 0.25) return 'bg-violet-200';
    if (ratio <= 0.5) return 'bg-violet-300';
    if (ratio <= 0.75) return 'bg-violet-400';
    return 'bg-violet-600';
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
      <h3 className="font-bold text-slate-800 mb-4">{title || '近三月活跃度'}</h3>
      <div className="flex gap-1 overflow-x-auto">
        {months.weeks.map((week, idx) => (
          <div key={idx} className="flex flex-col gap-1">
            {week.map(day => (
              <div
                key={day.date.toISOString()}
                title={`${format(day.date, 'yyyy-MM-dd')}: ${day.value}`}
                className={`w-4 h-4 rounded-sm ${intensity(day.value, months.max)}`}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

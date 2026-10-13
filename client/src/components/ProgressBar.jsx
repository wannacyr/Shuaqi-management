export function ProgressBar({ value, colorClass = 'bg-violet-500' }) {
  return (
    <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
      <div
        className={`h-full ${colorClass} transition-all duration-500`}
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
}

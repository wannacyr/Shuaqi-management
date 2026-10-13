import { Link, useLocation } from 'react-router-dom';
import { Gamepad2, BarChart3, Home } from 'lucide-react';
import { LevelBadge } from './LevelBadge';
import { PointsDisplay } from './PointsDisplay';
import { useUser } from '../context/UserContext';

const navItems = [
  { path: '/', label: '今日关卡', icon: Home },
  { path: '/stats', label: '统计', icon: BarChart3 },
];

export function NavBar() {
  const { pathname } = useLocation();
  const { user } = useUser();

  return (
    <nav className="sticky top-0 z-10 bg-white/80 backdrop-blur border-b border-slate-200">
      <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2 font-bold text-violet-700">
          <Gamepad2 size={22} />
          <span>奖励关卡</span>
        </div>
        <div className="flex items-center gap-1">
          {navItems.map(item => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium transition ${
                pathname === item.path
                  ? 'bg-violet-100 text-violet-700'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <item.icon size={16} />
              <span className="hidden sm:inline">{item.label}</span>
            </Link>
          ))}
        </div>
        <div className="flex items-center gap-2">
          {user && (
            <>
              <LevelBadge level={user.level} title={user.current_level_title} />
              <PointsDisplay points={user.total_points} />
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

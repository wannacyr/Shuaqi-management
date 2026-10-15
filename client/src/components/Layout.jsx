import { NavBar } from './NavBar';
import { CelebrationToast } from './CelebrationToast';
import { BadgeToast } from './BadgeToast';

export function Layout({ children }) {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <NavBar />
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-6">
        {children}
      </main>
      <CelebrationToast />
      <BadgeToast />
    </div>
  );
}

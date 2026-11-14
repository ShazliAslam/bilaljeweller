import { Sun, Moon, Plus, LogOut, ShieldCheck } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { useEffect, useState } from 'react';

const titles: Record<string, string> = {
  '/': 'Dashboard',
  '/new': 'New Invoice',
  '/history': 'Invoice History',
  '/settings': 'Settings',
};

export default function Topbar() {
  const { theme, toggle } = useTheme();
  const { user, isAdmin, signOut } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();
  const title = titles[loc.pathname] || (loc.pathname.startsWith('/invoice') ? 'Invoice' : 'Bilal Jewellers');
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  return (
    <header className="no-print px-6 lg:px-10 pt-6 pb-2 flex items-center justify-between gap-6">
      <div className="min-w-0">
        <div className="text-[11px] uppercase tracking-[0.22em] flex items-center gap-2" style={{ color: 'var(--text-mute)' }}>
          <span>Bilal Jewellers</span>
          {isAdmin && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full" style={{ background: 'var(--accent-glow)', color: 'var(--accent)' }}>
              <ShieldCheck className="w-3 h-3" /> Admin
            </span>
          )}
        </div>
        <h1 className="font-display text-[28px] leading-tight font-semibold truncate">
          {title}
        </h1>
      </div>
      <div className="flex items-center gap-2">
        <div className="hidden lg:flex flex-col items-end mr-2">
          <div className="text-sm font-mono num" style={{ color: 'var(--text)' }}>
            {now.toLocaleTimeString('en-GB')}
          </div>
          <div className="text-[11px] uppercase tracking-[0.18em]" style={{ color: 'var(--text-mute)' }}>
            {now.toLocaleDateString('en-GB', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })}
          </div>
        </div>
        {user && (
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl glass">
            <div className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold"
              style={{ background: 'linear-gradient(135deg,var(--accent),var(--accent-soft))', color: '#15120E' }}>
              {(user.email || '?').slice(0, 1).toUpperCase()}
            </div>
            <div className="text-xs leading-tight">
              <div className="font-semibold truncate max-w-[180px]">{user.email}</div>
              <div style={{ color: 'var(--text-mute)' }}>{isAdmin ? 'Administrator' : 'POS user'}</div>
            </div>
          </div>
        )}
        <button onClick={toggle} className="btn btn-ghost" aria-label="Toggle theme">
          {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>
        <button onClick={async () => { await signOut(); nav('/login', { replace: true }); }}
          className="btn btn-ghost" aria-label="Sign out" title="Sign out">
          <LogOut className="w-4 h-4" />
        </button>
        <Link to="/new" className="btn btn-primary">
          <Plus className="w-4 h-4" /> New Invoice
        </Link>
      </div>
    </header>
  );
}

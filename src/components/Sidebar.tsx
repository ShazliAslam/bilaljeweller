import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Receipt, History as HistoryIcon, Settings as SettingsIcon, Gem } from 'lucide-react';
import { useSettings } from '../contexts/SettingsContext';

const items = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/new', label: 'New Invoice', icon: Receipt },
  { to: '/history', label: 'Invoice History', icon: HistoryIcon },
  { to: '/settings', label: 'Settings', icon: SettingsIcon },
];

export default function Sidebar() {
  const { settings } = useSettings();
  return (
    <aside className="hidden md:flex w-64 shrink-0 flex-col border-r no-print"
      style={{ borderColor: 'var(--border)', background: 'var(--panel-soft)' }}>
      <div className="px-5 pt-6 pb-5">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg,var(--accent),var(--accent-soft))' }}>
            <Gem className="w-5 h-5" style={{ color: 'var(--ink-800,#15120E)' }} />
          </div>
          <div className="min-w-0">
            <div className="font-display text-lg leading-tight font-semibold truncate">{settings.shop_name}</div>
            <div className="text-[11px] uppercase tracking-[0.18em]" style={{ color: 'var(--text-mute)' }}>
              Point of Sale
            </div>
          </div>
        </div>
        <div className="divider-gold mt-5" />
      </div>
      <nav className="px-4 flex-1 space-y-1">
        {items.map(({ to, label, icon: Icon, end }) => (
          <NavLink key={to} to={to} end={end}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <Icon className="w-[18px] h-[18px]" />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
      <div className="p-5 text-[11px]" style={{ color: 'var(--text-mute)' }}>
        <div className="ornament text-center mb-2">◆ ◆ ◆</div>
        <div className="text-center">Offline-ready POS · v1.0</div>
      </div>
    </aside>
  );
}

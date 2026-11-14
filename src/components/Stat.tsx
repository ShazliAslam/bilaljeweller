import type { ReactNode } from 'react';

export default function Stat({
  label, value, sub, icon,
}: { label: string; value: ReactNode; sub?: string; icon?: ReactNode }) {
  return (
    <div className="card p-5 relative overflow-hidden">
      <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full opacity-[0.07]"
        style={{ background: 'radial-gradient(circle, var(--accent) 0%, transparent 70%)' }} />
      <div className="flex items-center justify-between">
        <div className="text-[11px] uppercase tracking-[0.18em] font-semibold" style={{ color: 'var(--text-mute)' }}>
          {label}
        </div>
        <div style={{ color: 'var(--accent)' }}>{icon}</div>
      </div>
      <div className="mt-3 font-display text-[32px] leading-none font-semibold num">
        {value}
      </div>
      {sub && <div className="mt-2 text-xs" style={{ color: 'var(--text-soft)' }}>{sub}</div>}
    </div>
  );
}

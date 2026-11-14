import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Receipt, TrendingUp, Calendar, ArrowRight, Gem, Sparkles,
  UserPlus, ShieldCheck, Scale, Flame, Coins, ArrowUpRight,
} from 'lucide-react';
import { getStats, type Stats } from '../lib/invoices';
import { fmtMoney, round3 } from '../lib/money';
import { useSettings, GRAMS_PER_TOLA } from '../contexts/SettingsContext';
import { useAuth } from '../contexts/AuthContext';
import CreateUserModal from '../components/CreateUserModal';

export default function Dashboard() {
  const { settings } = useSettings();
  const { isAdmin, user } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => {
    getStats().then(s => { setStats(s); setErr(null); })
      .catch(e => setErr(e.message))
      .finally(() => setLoading(false));
  }, []);

  // Derived figures from recent invoices (precise & local, no extra round-trip).
  const derived = useMemo(() => {
    const recent = stats?.recent ?? [];
    const gramsSold = recent.reduce(
      (a, inv) => a + inv.items.reduce((s, it) => s + (it.totalWeight || 0), 0), 0,
    );
    const avg = stats && stats.month_count > 0 ? stats.month_total / stats.month_count : 0;
    const peakItem = recent
      .flatMap(inv => inv.items.map(it => ({ it, inv })))
      .sort((a, b) => (b.it.itemTotal || 0) - (a.it.itemTotal || 0))[0];
    return { gramsSold, avg, peakItem };
  }, [stats]);

  const greeting = useMemo(() => {
    const h = new Date().getHours();
    if (h < 5) return 'Still trading tonight';
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  }, []);

  return (
    <div className="space-y-8">
      {/* ===== Hero ===== */}
      <div className="relative rounded-3xl overflow-hidden glass p-8 lg:p-10"
        style={{ boxShadow: '0 30px 80px -40px var(--accent-glow)' }}>
        {/* Ambient layers */}
        <div className="absolute inset-0 pointer-events-none" aria-hidden>
          <div className="absolute -top-32 -right-24 w-[520px] h-[520px] rounded-full blur-3xl opacity-50"
            style={{ background: 'radial-gradient(circle, var(--accent-soft), transparent 70%)' }} />
          <div className="absolute -bottom-32 -left-24 w-[420px] h-[420px] rounded-full blur-3xl opacity-40"
            style={{ background: 'radial-gradient(circle, var(--accent), transparent 70%)' }} />
          <svg className="absolute inset-0 w-full h-full opacity-[0.04]" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid" width="48" height="48" patternUnits="userSpaceOnUse">
                <path d="M48 0H0V48" fill="none" stroke="currentColor" strokeWidth="0.5"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>

        <div className="relative flex flex-col lg:flex-row lg:items-end justify-between gap-8">
          <div className="min-w-0">
            <div className="ornament mb-2 text-xs">◆ · ◆ · ◆</div>
            <div className="text-[11px] uppercase tracking-[0.25em]" style={{ color: 'var(--text-mute)' }}>
              {greeting}{user?.email ? `, ${user.email.split('@')[0]}` : ''}
            </div>
            <h2 className="font-display text-[44px] lg:text-[52px] leading-[1.02] font-semibold mt-1 max-w-2xl">
              Craft invoices with <span style={{ color: 'var(--accent)' }}>gold-grade</span> precision.
            </h2>
            <p className="mt-3 max-w-xl text-[15px]" style={{ color: 'var(--text-soft)' }}>
              Every weight, wastage and making charge calculated in decimal-safe maths.
              Offline-first, local, instant.
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Link to="/new" className="btn btn-primary"><Receipt className="w-4 h-4" /> Start Billing</Link>
              <Link to="/history" className="btn">View History <ArrowRight className="w-4 h-4" /></Link>
              {isAdmin && (
                <button onClick={() => setShowCreate(true)} className="btn">
                  <UserPlus className="w-4 h-4" /> Create User
                </button>
              )}
            </div>
          </div>

          {/* Rate cards (glass) */}
          <div className="grid grid-cols-2 gap-3 shrink-0">
            <MiniGlass label="Rate Unit" value={`per ${settings.rate_unit}`} icon={<Scale className="w-4 h-4" />} />
            <MiniGlass label="Default Wastage" value={`${settings.default_wastage}%`} icon={<Flame className="w-4 h-4" />} />
            <MiniGlass label="Gold Rate" value={`${settings.currency}${settings.default_gold_rate.toLocaleString()}`}
              icon={<Coins className="w-4 h-4" />} span />
          </div>
        </div>
      </div>

      {err && (
        <div className="glass rounded-xl p-4 text-sm" style={{ color: 'var(--danger)' }}>
          Unable to load statistics: {err}
        </div>
      )}

      {/* ===== KPI Row ===== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <KPI
          label="Today's Sales"
          value={loading ? '—' : fmtMoney(stats?.today_total ?? 0, settings.currency)}
          sub={`${stats?.today_count ?? 0} invoice${(stats?.today_count ?? 0) === 1 ? '' : 's'} today`}
          icon={<TrendingUp className="w-5 h-5" />}
          accent
        />
        <KPI
          label="Invoices Today"
          value={loading ? '—' : stats?.today_count ?? 0}
          sub="Transactions issued today"
          icon={<Receipt className="w-5 h-5" />}
        />
        <KPI
          label="This Month"
          value={loading ? '—' : fmtMoney(stats?.month_total ?? 0, settings.currency)}
          sub={`${stats?.month_count ?? 0} invoices · avg ${fmtMoney(derived.avg, settings.currency)}`}
          icon={<Calendar className="w-5 h-5" />}
        />
        <KPI
          label="Gold Moved"
          value={loading ? '—' : `${round3(derived.gramsSold).toFixed(3)} g`}
          sub={`≈ ${(derived.gramsSold / GRAMS_PER_TOLA).toFixed(3)} tola · recent`}
          icon={<Sparkles className="w-5 h-5" />}
        />
      </div>

      {/* ===== Main Grid ===== */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Invoices */}
        <div className="lg:col-span-2 glass rounded-2xl overflow-hidden">
          <div className="p-5 lg:p-6 flex items-center justify-between border-b" style={{ borderColor: 'var(--border-soft)' }}>
            <div>
              <h3 className="font-display text-xl font-semibold">Recent Invoices</h3>
              <div className="text-xs mt-1" style={{ color: 'var(--text-mute)' }}>Latest transactions, newest first</div>
            </div>
            <Link to="/history" className="btn btn-ghost text-sm">All invoices <ArrowRight className="w-4 h-4" /></Link>
          </div>
          {loading && <div className="p-8 text-sm" style={{ color: 'var(--text-mute)' }}>Loading…</div>}
          {!loading && (stats?.recent?.length ?? 0) === 0 && (
            <div className="p-12 text-center">
              <div className="mx-auto w-14 h-14 rounded-full flex items-center justify-center mb-3"
                style={{ background: 'var(--accent-glow)', color: 'var(--accent)' }}>
                <Gem className="w-6 h-6" />
              </div>
              <div className="font-display text-lg">No invoices yet</div>
              <div className="text-sm mt-1" style={{ color: 'var(--text-mute)' }}>
                Your first sale is only a click away.
              </div>
              <Link to="/new" className="btn btn-primary mt-4">Create Invoice</Link>
            </div>
          )}
          {!loading && (stats?.recent?.length ?? 0) > 0 && (
            <div className="divide-y" style={{ borderColor: 'var(--border-soft)' }}>
              {stats!.recent.map(inv => {
                const totalG = inv.items.reduce((a, it) => a + (it.totalWeight || 0), 0);
                return (
                  <Link to={`/invoice/${inv.id}`} key={inv.id}
                    className="group grid grid-cols-12 items-center gap-3 px-5 lg:px-6 py-4 hover:bg-[color:var(--bg-soft)] transition"
                    style={{ borderColor: 'var(--border-soft)' }}>
                    <div className="col-span-6 md:col-span-4 flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                        style={{ background: 'var(--accent-glow)', color: 'var(--accent)' }}>
                        <Gem className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="font-mono text-xs truncate">{inv.invoice_number}</div>
                        <div className="text-sm font-semibold truncate">
                          {inv.customer_name || <span style={{ color: 'var(--text-mute)' }}>Walk-in</span>}
                        </div>
                      </div>
                    </div>
                    <div className="hidden md:block md:col-span-3 text-xs" style={{ color: 'var(--text-soft)' }}>
                      {new Date(inv.created_at).toLocaleString('en-GB', {
                        day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
                      })}
                    </div>
                    <div className="hidden md:block md:col-span-2 text-xs num" style={{ color: 'var(--text-soft)' }}>
                      {inv.items.length} item · {round3(totalG).toFixed(3)} g
                    </div>
                    <div className="col-span-5 md:col-span-2 text-right num font-semibold">
                      {fmtMoney(inv.subtotal, settings.currency)}
                    </div>
                    <div className="col-span-1 flex justify-end">
                      <ArrowUpRight className="w-4 h-4 opacity-50 group-hover:opacity-100 transition"
                        style={{ color: 'var(--accent)' }} />
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Side column */}
        <div className="space-y-6">
          {isAdmin ? (
            <div className="glass rounded-2xl p-6 relative overflow-hidden">
              <div className="absolute -top-16 -right-16 w-52 h-52 rounded-full blur-2xl opacity-40 pointer-events-none"
                style={{ background: 'radial-gradient(circle, var(--accent-soft), transparent 70%)' }} />
              <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.2em]" style={{ color: 'var(--accent)' }}>
                <ShieldCheck className="w-3.5 h-3.5" /> Admin Panel
              </div>
              <h3 className="font-display text-xl font-semibold mt-2">User Management</h3>
              <p className="text-sm mt-1" style={{ color: 'var(--text-soft)' }}>
                Create accounts for staff so they can sign in to the POS with their own credentials.
              </p>
              <button onClick={() => setShowCreate(true)} className="btn btn-primary w-full mt-4">
                <UserPlus className="w-4 h-4" /> Create New User
              </button>
              <div className="mt-4 text-[11px] space-y-1" style={{ color: 'var(--text-mute)' }}>
                <div>• Email + password login, instantly active</div>
                <div>• Only the admin can create accounts</div>
                <div>• Share credentials securely</div>
              </div>
            </div>
          ) : (
            <div className="glass rounded-2xl p-6">
              <div className="text-[11px] uppercase tracking-[0.2em]" style={{ color: 'var(--text-mute)' }}>
                Signed in as
              </div>
              <div className="font-display text-xl mt-1 truncate">{user?.email}</div>
              <p className="text-sm mt-2" style={{ color: 'var(--text-soft)' }}>
                You have POS access. Contact the administrator to manage accounts.
              </p>
            </div>
          )}

          <div className="glass rounded-2xl p-6">
            <div className="text-[11px] uppercase tracking-[0.2em]" style={{ color: 'var(--text-mute)' }}>
              Top Line in Recent
            </div>
            {derived.peakItem ? (
              <>
                <div className="font-display text-lg mt-2 line-clamp-2">
                  {derived.peakItem.it.description}
                </div>
                <div className="flex items-baseline justify-between mt-3">
                  <div className="text-xs" style={{ color: 'var(--text-soft)' }}>
                    {round3(derived.peakItem.it.totalWeight).toFixed(3)} g · {derived.peakItem.it.wastagePercent}%
                  </div>
                  <div className="font-display text-2xl font-semibold num" style={{ color: 'var(--accent)' }}>
                    {fmtMoney(derived.peakItem.it.itemTotal, settings.currency)}
                  </div>
                </div>
                <Link to={`/invoice/${derived.peakItem.inv.id}`}
                  className="btn btn-ghost w-full mt-3 text-sm">
                  Open invoice <ArrowRight className="w-4 h-4" />
                </Link>
              </>
            ) : (
              <div className="text-sm mt-2" style={{ color: 'var(--text-mute)' }}>
                No line items yet — your top-seller will appear here.
              </div>
            )}
          </div>

          <div className="glass rounded-2xl p-6">
            <div className="text-[11px] uppercase tracking-[0.2em]" style={{ color: 'var(--text-mute)' }}>
              Quick actions
            </div>
            <div className="mt-3 space-y-2">
              <Link to="/new" className="btn w-full justify-start"><Receipt className="w-4 h-4" /> New Invoice</Link>
              <Link to="/history" className="btn w-full justify-start"><Calendar className="w-4 h-4" /> Browse History</Link>
              <Link to="/settings" className="btn w-full justify-start"><Sparkles className="w-4 h-4" /> Shop Settings</Link>
            </div>
          </div>
        </div>
      </div>

      <CreateUserModal open={showCreate} onClose={() => setShowCreate(false)} />
    </div>
  );
}

function MiniGlass({ label, value, icon, span }: { label: string; value: string; icon: React.ReactNode; span?: boolean }) {
  return (
    <div className={`glass rounded-xl p-4 ${span ? 'col-span-2' : ''}`}>
      <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.2em]"
        style={{ color: 'var(--text-mute)' }}>
        <span>{label}</span>
        <span style={{ color: 'var(--accent)' }}>{icon}</span>
      </div>
      <div className="font-display text-lg font-semibold mt-2 num truncate">{value}</div>
    </div>
  );
}

function KPI({ label, value, sub, icon, accent }: {
  label: string; value: React.ReactNode; sub?: string; icon?: React.ReactNode; accent?: boolean;
}) {
  return (
    <div className="relative glass rounded-2xl p-5 overflow-hidden"
      style={accent ? { boxShadow: '0 20px 60px -30px var(--accent-glow)' } : undefined}>
      <div className="absolute -top-14 -right-14 w-40 h-40 rounded-full opacity-[0.1] pointer-events-none"
        style={{ background: 'radial-gradient(circle, var(--accent) 0%, transparent 70%)' }} />
      <div className="flex items-center justify-between relative">
        <div className="text-[11px] uppercase tracking-[0.18em] font-semibold" style={{ color: 'var(--text-mute)' }}>
          {label}
        </div>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ background: 'var(--accent-glow)', color: 'var(--accent)' }}>
          {icon}
        </div>
      </div>
      <div className="mt-3 font-display text-[30px] leading-none font-semibold num relative">
        {value}
      </div>
      {sub && <div className="mt-2 text-xs relative" style={{ color: 'var(--text-soft)' }}>{sub}</div>}
    </div>
  );
}

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Calendar, ArrowRight, X } from 'lucide-react';
import { listInvoices, type StoredInvoice } from '../lib/invoices';
import { fmtMoney } from '../lib/money';
import { useSettings } from '../contexts/SettingsContext';

export default function History() {
  const { settings } = useSettings();
  const [q, setQ] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [invoices, setInvoices] = useState<StoredInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    listInvoices({ q, from, to, limit: 200 })
      .then(setInvoices).then(() => setErr(null))
      .catch(e => setErr(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  const clear = () => { setQ(''); setFrom(''); setTo(''); };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="card p-5 grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
        <div className="md:col-span-5">
          <div className="label"><Search className="w-3 h-3 inline mr-1" /> Search</div>
          <input className="input input-lg" placeholder="Invoice no., customer name or phone…"
            value={q} onChange={e => setQ(e.target.value)} onKeyDown={e => e.key === 'Enter' && load()} />
        </div>
        <div className="md:col-span-3">
          <div className="label"><Calendar className="w-3 h-3 inline mr-1" /> From</div>
          <input type="date" className="input input-lg input-mono" value={from} onChange={e => setFrom(e.target.value)} />
        </div>
        <div className="md:col-span-3">
          <div className="label"><Calendar className="w-3 h-3 inline mr-1" /> To</div>
          <input type="date" className="input input-lg input-mono" value={to} onChange={e => setTo(e.target.value)} />
        </div>
        <div className="md:col-span-1 flex gap-2">
          <button onClick={load} className="btn btn-primary w-full">Apply</button>
        </div>
        {(q || from || to) && (
          <div className="md:col-span-12 flex gap-2">
            <button onClick={() => { clear(); setTimeout(load, 0); }} className="btn btn-ghost text-xs">
              <X className="w-3 h-3" /> Clear filters
            </button>
          </div>
        )}
      </div>

      {err && <div className="card p-4 text-sm" style={{ color: 'var(--danger)' }}>{err}</div>}

      <div className="card overflow-hidden">
        <div className="card-head flex items-center justify-between">
          <h3 className="font-display text-xl font-semibold">Results</h3>
          <div className="text-xs" style={{ color: 'var(--text-mute)' }}>
            {loading ? 'Loading…' : `${invoices.length} invoice${invoices.length === 1 ? '' : 's'}`}
          </div>
        </div>
        {!loading && invoices.length === 0 && (
          <div className="p-10 text-center text-sm" style={{ color: 'var(--text-mute)' }}>
            No invoices match these filters.
          </div>
        )}
        {invoices.length > 0 && (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left" style={{ color: 'var(--text-mute)' }}>
                <th className="px-5 py-3 text-[11px] uppercase tracking-[0.15em] font-semibold">Invoice</th>
                <th className="px-5 py-3 text-[11px] uppercase tracking-[0.15em] font-semibold">Customer</th>
                <th className="px-5 py-3 text-[11px] uppercase tracking-[0.15em] font-semibold">Phone</th>
                <th className="px-5 py-3 text-[11px] uppercase tracking-[0.15em] font-semibold">Date</th>
                <th className="px-5 py-3 text-[11px] uppercase tracking-[0.15em] font-semibold text-right">Items</th>
                <th className="px-5 py-3 text-[11px] uppercase tracking-[0.15em] font-semibold text-right">Total</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {invoices.map(inv => (
                <tr key={inv.id} className="border-t hover:bg-[color:var(--bg-soft)] transition"
                  style={{ borderColor: 'var(--border-soft)' }}>
                  <td className="px-5 py-3 font-mono text-xs">{inv.invoice_number}</td>
                  <td className="px-5 py-3">{inv.customer_name || <span style={{ color: 'var(--text-mute)' }}>Walk-in</span>}</td>
                  <td className="px-5 py-3 text-xs num">{inv.customer_phone || '—'}</td>
                  <td className="px-5 py-3 text-xs" style={{ color: 'var(--text-soft)' }}>
                    {new Date(inv.created_at).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: '2-digit', hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className="px-5 py-3 text-right num">{inv.items.length}</td>
                  <td className="px-5 py-3 text-right num font-semibold">{fmtMoney(inv.subtotal, settings.currency)}</td>
                  <td className="px-5 py-3 text-right">
                    <Link to={`/invoice/${inv.id}`} className="btn btn-ghost text-xs">Open <ArrowRight className="w-3 h-3" /></Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

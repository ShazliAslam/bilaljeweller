import { useEffect, useState } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Printer, ReceiptText, Download } from 'lucide-react';
import { getInvoice, type StoredInvoice } from '../lib/invoices';
import { useSettings } from '../contexts/SettingsContext';
import { fmtMoney, fmtRate, round3 } from '../lib/money';
import InvoicePrintA4 from '../components/InvoicePrintA4';
import InvoicePrint80 from '../components/InvoicePrint80';

export default function InvoiceView() {
  const { id } = useParams();
  const { settings } = useSettings();
  const [params] = useSearchParams();
  const [inv, setInv] = useState<StoredInvoice | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [mode, setMode] = useState<'a4' | 'thermal'>(settings.printer_mode);
  const [printed, setPrinted] = useState(false);

  useEffect(() => {
    if (!id) return;
    getInvoice(parseInt(id, 10))
      .then(data => { setInv(data); setErr(null); })
      .catch(e => setErr(e.message));
  }, [id]);

  // Auto-print when ?print=1 is set and the invoice is loaded (fired once).
  useEffect(() => {
    if (inv && !printed && params.get('print') === '1') {
      setPrinted(true);
      const chosen: 'a4' | 'thermal' = (params.get('mode') as 'a4' | 'thermal') || settings.printer_mode;
      setMode(chosen);
      setTimeout(() => window.print(), 300);
    }
  }, [inv, printed, params, settings.printer_mode]);

  const doPrint = (m: 'a4' | 'thermal') => {
    setMode(m);
    setTimeout(() => window.print(), 100);
  };

  if (err) {
    return (
      <div className="card p-10 text-center">
        <div className="font-display text-xl">Invoice not found</div>
        <div className="text-sm mt-1" style={{ color: 'var(--text-mute)' }}>{err}</div>
        <Link to="/history" className="btn mt-4">Back to history</Link>
      </div>
    );
  }
  if (!inv) {
    return <div className="card p-10 text-sm" style={{ color: 'var(--text-mute)' }}>Loading…</div>;
  }

  const d = new Date(inv.created_at);

  return (
    <div className="space-y-6">
      {/* Top actions (hidden on print) */}
      <div className="no-print flex flex-wrap items-center justify-between gap-3">
        <Link to="/history" className="btn btn-ghost"><ArrowLeft className="w-4 h-4" /> Back to history</Link>
        <div className="flex gap-2">
          <button onClick={() => doPrint('thermal')}
            className={`btn ${mode === 'thermal' ? 'btn-primary' : ''}`}>
            <ReceiptText className="w-4 h-4" /> Print 80mm
          </button>
          <button onClick={() => doPrint('a4')}
            className={`btn ${mode === 'a4' ? 'btn-primary' : ''}`}>
            <Printer className="w-4 h-4" /> Print A4
          </button>
          <button onClick={() => downloadJson(inv)} className="btn">
            <Download className="w-4 h-4" /> Backup
          </button>
        </div>
      </div>

      {/* Screen preview (hidden on print) */}
      <div className="no-print card overflow-hidden">
        <div className="p-8" style={{ background: 'linear-gradient(135deg, var(--panel) 0%, var(--panel-soft) 100%)' }}>
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-5 pb-5 border-b"
            style={{ borderColor: 'var(--accent-soft)' }}>
            <div>
              <div className="ornament text-xs">◆ · ◆ · ◆</div>
              <div className="font-display text-[36px] leading-tight font-semibold" style={{ color: 'var(--accent)' }}>
                {settings.shop_name}
              </div>
              <div className="text-xs tracking-[0.2em] uppercase" style={{ color: 'var(--text-mute)' }}>
                {settings.shop_tagline}
              </div>
              {settings.address && <div className="text-sm mt-2" style={{ color: 'var(--text-soft)' }}>{settings.address}</div>}
              {settings.phone && <div className="text-sm" style={{ color: 'var(--text-soft)' }}>Tel: {settings.phone}</div>}
            </div>
            <div className="text-right">
              <div className="text-[11px] uppercase tracking-[0.2em]" style={{ color: 'var(--text-mute)' }}>Invoice</div>
              <div className="font-mono text-lg">{inv.invoice_number}</div>
              <div className="text-sm mt-2 num">{d.toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}</div>
              <div className="text-sm num" style={{ color: 'var(--text-soft)' }}>{d.toLocaleTimeString('en-GB')}</div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4 mt-6">
            <div>
              <div className="text-[11px] uppercase tracking-[0.2em]" style={{ color: 'var(--text-mute)' }}>Billed To</div>
              <div className="font-display text-xl mt-1">{inv.customer_name || 'Walk-in Customer'}</div>
              {inv.customer_phone && <div className="text-sm num" style={{ color: 'var(--text-soft)' }}>{inv.customer_phone}</div>}
            </div>
            <div className="md:text-right">
              <div className="text-[11px] uppercase tracking-[0.2em]" style={{ color: 'var(--text-mute)' }}>Gold Rate Applied</div>
              <div className="font-display text-xl mt-1 num">{fmtRate(inv.gold_rate, inv.rate_unit, settings.currency)}</div>
              <div className="text-sm" style={{ color: 'var(--text-soft)' }}>Wastage default: {inv.wastage_percent}%</div>
            </div>
          </div>

          <table className="w-full mt-8 text-sm">
            <thead>
              <tr style={{ color: 'var(--text-mute)' }}>
                <th className="text-left pb-2 pr-2">#</th>
                <th className="text-left pb-2 pr-2">Item</th>
                <th className="text-right pb-2 pr-2">Weight</th>
                <th className="text-right pb-2 pr-2">Wastage</th>
                <th className="text-right pb-2 pr-2">Total</th>
                <th className="text-right pb-2 pr-2">Gold Amt</th>
                <th className="text-right pb-2 pr-2">Making</th>
                <th className="text-right pb-2">Amount</th>
              </tr>
            </thead>
            <tbody>
              {inv.items.map((it, i) => (
                <tr key={i} className="border-t" style={{ borderColor: 'var(--border-soft)' }}>
                  <td className="py-2 pr-2">{i + 1}</td>
                  <td className="py-2 pr-2">{it.description}</td>
                  <td className="py-2 pr-2 text-right num">{round3(it.weight).toFixed(3)} g</td>
                  <td className="py-2 pr-2 text-right num">{it.wastagePercent}% • {round3(it.wastageWeight).toFixed(3)} g</td>
                  <td className="py-2 pr-2 text-right num">{round3(it.totalWeight).toFixed(3)} g</td>
                  <td className="py-2 pr-2 text-right num">{fmtMoney(it.goldAmount, settings.currency)}</td>
                  <td className="py-2 pr-2 text-right num">{fmtMoney(it.makingCharges, settings.currency)}</td>
                  <td className="py-2 text-right num font-semibold">{fmtMoney(it.itemTotal, settings.currency)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="divider-gold mt-6 mb-4" />
          <div className="flex justify-end">
            <div className="min-w-[280px]">
              <div className="flex justify-between text-sm py-1">
                <span style={{ color: 'var(--text-soft)' }}>Subtotal</span>
                <span className="num">{fmtMoney(inv.subtotal, settings.currency)}</span>
              </div>
              <div className="divider-gold my-2" />
              <div className="flex justify-between items-baseline">
                <span className="text-[11px] uppercase tracking-[0.2em]" style={{ color: 'var(--text-mute)' }}>Grand Total</span>
                <span className="font-display text-[28px] font-semibold num" style={{ color: 'var(--accent)' }}>
                  {fmtMoney(inv.subtotal, settings.currency)}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-8 text-center text-xs" style={{ color: 'var(--text-mute)' }}>
            {settings.footer}
          </div>
        </div>
      </div>

      {/* Print-only variants */}
      {mode === 'a4' && <InvoicePrintA4 invoice={inv} settings={settings} />}
      {mode === 'thermal' && <InvoicePrint80 invoice={inv} settings={settings} />}
    </div>
  );
}

function downloadJson(inv: StoredInvoice) {
  const blob = new Blob([JSON.stringify(inv, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${inv.invoice_number}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

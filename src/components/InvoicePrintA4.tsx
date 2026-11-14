import { GRAMS_PER_TOLA, type Settings } from '../contexts/SettingsContext';
import { fmtMoney, fmtRate, round3 } from '../lib/money';
import type { StoredInvoice } from '../lib/invoices';

export default function InvoicePrintA4({ invoice, settings }: { invoice: StoredInvoice; settings: Settings }) {
  const d = new Date(invoice.created_at);
  return (
    <div className="print-only" id="print-a4" style={{ color: '#111', background: 'white' }}>
      <div style={{ padding: '0', fontFamily: "'Fraunces', Georgia, serif" }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderBottom: '2px solid #B08A3C', paddingBottom: 14 }}>
          <div>
            <div style={{ fontSize: 34, fontWeight: 700, letterSpacing: '-0.02em' }}>{settings.shop_name}</div>
            <div style={{ fontSize: 12, letterSpacing: '0.25em', textTransform: 'uppercase', color: '#8B6F3A', marginTop: 2 }}>
              {settings.shop_tagline}
            </div>
            {settings.address && <div style={{ fontSize: 11, marginTop: 8 }}>{settings.address}</div>}
            {settings.phone && <div style={{ fontSize: 11 }}>Tel: {settings.phone}</div>}
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 10, letterSpacing: '0.25em', textTransform: 'uppercase', color: '#8B6F3A' }}>Invoice</div>
            <div style={{ fontSize: 16, fontFamily: 'JetBrains Mono, monospace', fontWeight: 600 }}>{invoice.invoice_number}</div>
            <div style={{ fontSize: 11, marginTop: 6 }}>{d.toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}</div>
            <div style={{ fontSize: 11 }}>{d.toLocaleTimeString('en-GB')}</div>
          </div>
        </div>

        {/* Customer */}
        <div style={{ display: 'flex', gap: 24, marginTop: 20, fontFamily: 'Manrope, sans-serif' }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#8B6F3A' }}>Billed To</div>
            <div style={{ fontSize: 15, fontWeight: 600, marginTop: 4 }}>{invoice.customer_name || 'Walk-in Customer'}</div>
            {invoice.customer_phone && <div style={{ fontSize: 12 }}>{invoice.customer_phone}</div>}
          </div>
          <div style={{ flex: 1, textAlign: 'right' }}>
            <div style={{ fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#8B6F3A' }}>Gold Rate</div>
            <div style={{ fontSize: 14, fontWeight: 600, marginTop: 4, fontVariantNumeric: 'tabular-nums' }}>
              {fmtRate(invoice.gold_rate, invoice.rate_unit, settings.currency)}
            </div>
            <div style={{ fontSize: 11, color: '#555' }}>Wastage: {invoice.wastage_percent}%</div>
          </div>
        </div>

        {/* Items */}
        <table style={{ width: '100%', marginTop: 24, borderCollapse: 'collapse', fontFamily: 'Manrope, sans-serif', fontSize: 11 }}>
          <thead>
            <tr style={{ background: '#FBF6E8', color: '#4A391B' }}>
              <th style={th}>#</th>
              <th style={{ ...th, textAlign: 'left' }}>Item</th>
              <th style={th}>Weight (g)</th>
              <th style={th}>Wastage</th>
              <th style={th}>Total (g)</th>
              <th style={th}>Gold Amount</th>
              <th style={th}>Making</th>
              <th style={{ ...th, textAlign: 'right' }}>Amount</th>
            </tr>
          </thead>
          <tbody>
            {invoice.items.map((it, i) => (
              <tr key={i} style={{ borderBottom: '1px solid #EEE' }}>
                <td style={td}>{i + 1}</td>
                <td style={{ ...td, textAlign: 'left' }}>{it.description || '—'}</td>
                <td style={tdNum}>{round3(it.weight).toFixed(3)}</td>
                <td style={tdNum}>{it.wastagePercent}%<br/><span style={{ color: '#777' }}>{round3(it.wastageWeight).toFixed(3)} g</span></td>
                <td style={tdNum}>{round3(it.totalWeight).toFixed(3)}</td>
                <td style={tdNum}>{fmtMoney(it.goldAmount, settings.currency)}</td>
                <td style={tdNum}>{fmtMoney(it.makingCharges, settings.currency)}</td>
                <td style={{ ...tdNum, textAlign: 'right', fontWeight: 700 }}>{fmtMoney(it.itemTotal, settings.currency)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 20 }}>
          <div style={{ minWidth: 300, fontFamily: 'Manrope, sans-serif' }}>
            <Row k="Subtotal" v={fmtMoney(invoice.subtotal, settings.currency)} />
            <div style={{ height: 2, background: '#B08A3C', margin: '8px 0' }} />
            <Row k="Grand Total" v={fmtMoney(invoice.subtotal, settings.currency)} big />
          </div>
        </div>

        {/* Footer */}
        <div style={{ marginTop: 40, borderTop: '1px solid #DDD', paddingTop: 10, fontSize: 10, color: '#555', textAlign: 'center', fontFamily: 'Manrope, sans-serif' }}>
          {settings.footer}
          <div style={{ marginTop: 6, fontSize: 9 }}>1 tola = {GRAMS_PER_TOLA} grams · All weights verified at point of sale.</div>
        </div>
      </div>
    </div>
  );
}

const th: React.CSSProperties = { padding: '8px 6px', fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', textAlign: 'center', borderBottom: '1px solid #DDBE6A' };
const td: React.CSSProperties = { padding: '8px 6px', textAlign: 'center', verticalAlign: 'top' };
const tdNum: React.CSSProperties = { ...td, fontVariantNumeric: 'tabular-nums' };

function Row({ k, v, big }: { k: string; v: string; big?: boolean }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: big ? 16 : 13, fontWeight: big ? 700 : 500 }}>
      <span>{k}</span><span style={{ fontVariantNumeric: 'tabular-nums' }}>{v}</span>
    </div>
  );
}

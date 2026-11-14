import type { Settings } from '../contexts/SettingsContext';
import { fmtMoney, round3 } from '../lib/money';
import type { StoredInvoice } from '../lib/invoices';

export default function InvoicePrint80({ invoice, settings }: { invoice: StoredInvoice; settings: Settings }) {
  const d = new Date(invoice.created_at);
  return (
    <div className="print-only print-receipt-80" id="print-80"
      style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, lineHeight: 1.45, color: 'black' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontFamily: "'Fraunces', serif", fontSize: 18, fontWeight: 700 }}>{settings.shop_name}</div>
        <div style={{ fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase' }}>{settings.shop_tagline}</div>
        {settings.address && <div style={{ fontSize: 10 }}>{settings.address}</div>}
        {settings.phone && <div style={{ fontSize: 10 }}>Tel: {settings.phone}</div>}
      </div>
      <Divider />
      <Row k="Invoice" v={invoice.invoice_number} />
      <Row k="Date" v={d.toLocaleDateString('en-GB')} />
      <Row k="Time" v={d.toLocaleTimeString('en-GB')} />
      {invoice.customer_name && <Row k="Customer" v={invoice.customer_name} />}
      {invoice.customer_phone && <Row k="Phone" v={invoice.customer_phone} />}
      <Row k="Gold Rate" v={`${settings.currency}${invoice.gold_rate.toLocaleString()}/${invoice.rate_unit}`} />
      <Divider />
      {invoice.items.map((it, i) => (
        <div key={i} style={{ marginBottom: 6 }}>
          <div style={{ fontWeight: 700 }}>{i + 1}. {it.description || 'Item'}</div>
          <Row k="Wt" v={`${round3(it.weight).toFixed(3)}g + ${it.wastagePercent}% = ${round3(it.totalWeight).toFixed(3)}g`} small />
          <Row k="Gold" v={fmtMoney(it.goldAmount, settings.currency)} small />
          <Row k="Making" v={fmtMoney(it.makingCharges, settings.currency)} small />
          <Row k="Line" v={fmtMoney(it.itemTotal, settings.currency)} small bold />
        </div>
      ))}
      <Divider />
      <Row k="TOTAL" v={fmtMoney(invoice.subtotal, settings.currency)} bold big />
      <Divider />
      <div style={{ textAlign: 'center', fontSize: 10, marginTop: 6 }}>{settings.footer}</div>
      <div style={{ textAlign: 'center', fontSize: 9, marginTop: 4 }}>◆ ◆ ◆</div>
    </div>
  );
}

function Divider() {
  return <div style={{ borderTop: '1px dashed #000', margin: '6px 0' }} />;
}
function Row({ k, v, small, bold, big }: { k: string; v: string; small?: boolean; bold?: boolean; big?: boolean }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between',
      fontSize: big ? 13 : small ? 10 : 11,
      fontWeight: bold ? 700 : 400,
    }}>
      <span>{k}</span><span style={{ fontVariantNumeric: 'tabular-nums', textAlign: 'right', marginLeft: 8 }}>{v}</span>
    </div>
  );
}

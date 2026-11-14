import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, Save, Printer, Scale, Hash, User, Phone, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useSettings, GRAMS_PER_TOLA } from '../contexts/SettingsContext';
import { calcItem, calcInvoiceTotal, generateInvoiceNumber, ratePerGram, type ItemInput, type ItemCalc } from '../lib/calc';
import { fmtMoney, round3 } from '../lib/money';
import { createInvoice } from '../lib/invoices';

type Row = ItemInput & { id: string };

const newRow = (wastage: number): Row => ({
  id: Math.random().toString(36).slice(2, 10),
  description: '',
  weight: 0,
  wastagePercent: wastage,
  makingCharges: 0,
});

export default function NewInvoice() {
  const { settings } = useSettings();
  const navigate = useNavigate();

  const [invoiceNumber, setInvoiceNumber] = useState(generateInvoiceNumber);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [goldRate, setGoldRate] = useState<number>(settings.default_gold_rate);
  const [rateUnit, setRateUnit] = useState<'gram' | 'tola'>(settings.rate_unit);
  const [defaultWastage, setDefaultWastage] = useState<number>(settings.default_wastage);
  const [rows, setRows] = useState<Row[]>(() => [newRow(settings.default_wastage)]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedId, setSavedId] = useState<number | null>(null);

  // When settings load/change, adopt their defaults only if the user hasn't customized yet
  useEffect(() => {
    setGoldRate(prev => prev || settings.default_gold_rate);
    setRateUnit(prev => prev || settings.rate_unit);
    setDefaultWastage(prev => prev || settings.default_wastage);
    // eslint-disable-next-line
  }, [settings.default_gold_rate, settings.rate_unit, settings.default_wastage]);

  const perGram = useMemo(() => ratePerGram(goldRate, rateUnit), [goldRate, rateUnit]);

  const calcs: ItemCalc[] = useMemo(
    () => rows.map(r => calcItem(r, goldRate, rateUnit)),
    [rows, goldRate, rateUnit],
  );
  const subtotal = useMemo(() => calcInvoiceTotal(calcs), [calcs]);
  const totalGross = useMemo(() => rows.reduce((a, r) => a + (r.weight || 0), 0), [rows]);
  const totalFinal = useMemo(() => calcs.reduce((a, c) => a + c.totalWeight, 0), [calcs]);

  const updateRow = (id: string, patch: Partial<Row>) => {
    setRows(rs => rs.map(r => r.id === id ? { ...r, ...patch } : r));
  };
  const removeRow = (id: string) => setRows(rs => rs.length > 1 ? rs.filter(r => r.id !== id) : rs);
  const addRow = () => setRows(rs => [...rs, newRow(defaultWastage)]);

  const anyInvalid = rows.some(r => !r.description.trim() || r.weight <= 0);

  const handleSave = async (): Promise<number | null> => {
    setError(null);
    if (anyInvalid) { setError('Every item needs a description and a weight greater than zero.'); return null; }
    if (goldRate <= 0) { setError('Gold rate must be greater than zero.'); return null; }
    setSaving(true);
    try {
      const items = rows.map((r, i) => ({ ...r, ...calcs[i] }));
      const payload = {
        invoice_number: invoiceNumber,
        customer_name: customerName.trim() || null,
        customer_phone: customerPhone.trim() || null,
        items,
        subtotal,
        gold_rate: goldRate,
        rate_unit: rateUnit,
        wastage_percent: defaultWastage,
      };
      const saved = await createInvoice(payload);
      setSavedId(saved.id);
      // also stash the just-saved invoice locally so the user can reprint instantly offline
      try {
        const cache = JSON.parse(localStorage.getItem('bj_recent') || '[]');
        cache.unshift(saved);
        localStorage.setItem('bj_recent', JSON.stringify(cache.slice(0, 20)));
      } catch {}
      return saved.id;
    } catch (e) {
      setError((e as Error).message);
      return null;
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAndNew = async () => {
    const id = await handleSave();
    if (id) {
      setInvoiceNumber(generateInvoiceNumber());
      setCustomerName(''); setCustomerPhone('');
      setRows([newRow(defaultWastage)]);
      setSavedId(null);
    }
  };

  const handleSaveAndPrint = async () => {
    const id = savedId ?? await handleSave();
    if (id) navigate(`/invoice/${id}?print=1`);
  };

  return (
    <div className="space-y-6">
      {/* Meta bar */}
      <div className="card p-5 grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <div className="label"><Hash className="w-3 h-3 inline mr-1" /> Invoice No.</div>
          <input className="input input-mono input-lg" value={invoiceNumber} onChange={e => setInvoiceNumber(e.target.value)} />
        </div>
        <div>
          <div className="label"><User className="w-3 h-3 inline mr-1" /> Customer Name</div>
          <input className="input input-lg" placeholder="Walk-in customer" value={customerName} onChange={e => setCustomerName(e.target.value)} />
        </div>
        <div>
          <div className="label"><Phone className="w-3 h-3 inline mr-1" /> Customer Phone</div>
          <input className="input input-lg" placeholder="Optional" value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} />
        </div>
        <div>
          <div className="label">Date &amp; Time</div>
          <div className="input input-lg flex items-center" style={{ background: 'var(--bg-soft)' }}>
            <span className="num">{new Date().toLocaleString('en-GB')}</span>
          </div>
        </div>
      </div>

      {/* Rate / Wastage */}
      <div className="card p-5 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <div className="label"><Scale className="w-3 h-3 inline mr-1" /> Gold Rate</div>
          <div className="flex gap-2">
            <input type="number" inputMode="decimal" min={0} className="input input-lg input-mono flex-1"
              value={goldRate || ''} onChange={e => setGoldRate(parseFloat(e.target.value) || 0)} />
            <div className="flex items-center gap-1 p-1 rounded-xl" style={{ background: 'var(--bg-soft)' }}>
              {(['gram', 'tola'] as const).map(u => (
                <button key={u}
                  onClick={() => setRateUnit(u)}
                  className="px-3 py-2 rounded-lg text-sm font-semibold transition"
                  style={{
                    background: rateUnit === u ? 'var(--panel)' : 'transparent',
                    color: rateUnit === u ? 'var(--accent)' : 'var(--text-mute)',
                    boxShadow: rateUnit === u ? '0 1px 2px rgba(0,0,0,0.05)' : 'none',
                  }}>
                  /{u}
                </button>
              ))}
            </div>
          </div>
          <div className="text-xs mt-2 num" style={{ color: 'var(--text-mute)' }}>
            ≈ {fmtMoney(perGram, settings.currency)}/gram · 1 tola = {GRAMS_PER_TOLA} g
          </div>
        </div>
        <div>
          <div className="label">Default Wastage %</div>
          <input type="number" inputMode="decimal" min={0} className="input input-lg input-mono"
            value={defaultWastage || ''} onChange={e => {
              const v = parseFloat(e.target.value) || 0;
              setDefaultWastage(v);
              setRows(rs => rs.map(r => ({ ...r, wastagePercent: v })));
            }} />
          <div className="text-xs mt-2" style={{ color: 'var(--text-mute)' }}>Applied to every new item; editable per-item.</div>
        </div>
        <div>
          <div className="label">Items on Invoice</div>
          <div className="input input-lg num flex items-center justify-between" style={{ background: 'var(--bg-soft)' }}>
            <span>{rows.length} item{rows.length === 1 ? '' : 's'}</span>
            <span style={{ color: 'var(--text-mute)' }}>Gross {round3(totalGross).toFixed(3)} g → Final {round3(totalFinal).toFixed(3)} g</span>
          </div>
        </div>
      </div>

      {/* Items grid */}
      <div className="card overflow-hidden">
        <div className="card-head flex items-center justify-between">
          <div>
            <h3 className="font-display text-xl font-semibold">Line Items</h3>
            <div className="text-xs mt-1" style={{ color: 'var(--text-mute)' }}>
              Weight, wastage &amp; making charges — calculations update instantly.
            </div>
          </div>
          <button onClick={addRow} className="btn"><Plus className="w-4 h-4" /> Add Item</button>
        </div>
        <div className="divide-y" style={{ borderColor: 'var(--border-soft)' }}>
          {rows.map((r, idx) => {
            const c = calcs[idx];
            return (
              <div key={r.id} className="p-5 grid grid-cols-12 gap-3 items-end"
                style={{ borderColor: 'var(--border-soft)' }}>
                <div className="col-span-12 lg:col-span-4">
                  <div className="label flex items-center justify-between">
                    <span>Item #{idx + 1} — Description</span>
                    {!r.description.trim() && <span className="tag" style={{ color: 'var(--danger)' }}>required</span>}
                  </div>
                  <input className="input input-lg" placeholder="e.g. 22K Gold Ring"
                    value={r.description} onChange={e => updateRow(r.id, { description: e.target.value })} />
                </div>
                <div className="col-span-6 lg:col-span-2">
                  <div className="label">Weight (g)</div>
                  <input type="number" inputMode="decimal" min={0} step="0.001"
                    className="input input-lg input-mono"
                    value={r.weight || ''}
                    onChange={e => updateRow(r.id, { weight: Math.max(0, parseFloat(e.target.value) || 0) })} />
                </div>
                <div className="col-span-6 lg:col-span-1">
                  <div className="label">Wastage %</div>
                  <input type="number" inputMode="decimal" min={0} step="0.01"
                    className="input input-lg input-mono"
                    value={r.wastagePercent || ''}
                    onChange={e => updateRow(r.id, { wastagePercent: Math.max(0, parseFloat(e.target.value) || 0) })} />
                </div>
                <div className="col-span-6 lg:col-span-2">
                  <div className="label">Making Charges</div>
                  <input type="number" inputMode="decimal" min={0} step="1"
                    className="input input-lg input-mono"
                    value={r.makingCharges || ''}
                    onChange={e => updateRow(r.id, { makingCharges: Math.max(0, parseFloat(e.target.value) || 0) })} />
                </div>
                <div className="col-span-6 lg:col-span-2">
                  <div className="label">Line Total</div>
                  <div className="input input-lg input-mono num font-semibold"
                    style={{ background: 'var(--bg-soft)', color: 'var(--accent)' }}>
                    {fmtMoney(c.itemTotal, settings.currency)}
                  </div>
                </div>
                <div className="col-span-12 lg:col-span-1 flex lg:justify-end">
                  <button onClick={() => removeRow(r.id)}
                    disabled={rows.length === 1}
                    className="btn btn-ghost"
                    style={{ color: rows.length === 1 ? 'var(--text-mute)' : 'var(--danger)' }}
                    title="Remove item">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Calculation breakdown */}
                <div className="col-span-12 grid grid-cols-2 md:grid-cols-4 gap-3 text-xs rounded-lg px-3 py-2"
                  style={{ background: 'var(--bg-soft)' }}>
                  <BreakCell label="Wastage Weight" value={`${round3(c.wastageWeight).toFixed(3)} g`} />
                  <BreakCell label="Total Weight" value={`${round3(c.totalWeight).toFixed(3)} g`} />
                  <BreakCell label="Gold Amount" value={fmtMoney(c.goldAmount, settings.currency)} />
                  <BreakCell label="Making" value={fmtMoney(r.makingCharges, settings.currency)} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Total bar */}
      <div className="card p-6 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-5 sticky bottom-4"
        style={{ borderColor: 'var(--accent-soft)' }}>
        <div>
          <div className="text-[11px] uppercase tracking-[0.2em]" style={{ color: 'var(--text-mute)' }}>Grand Total</div>
          <div className="font-display text-[42px] leading-none font-semibold num mt-1" style={{ color: 'var(--accent)' }}>
            {fmtMoney(subtotal, settings.currency)}
          </div>
          <div className="text-xs mt-2" style={{ color: 'var(--text-soft)' }}>
            {rows.length} item{rows.length === 1 ? '' : 's'} · Final weight {round3(totalFinal).toFixed(3)} g
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {error && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm"
              style={{ background: 'color-mix(in oklab, var(--danger) 10%, transparent)', color: 'var(--danger)' }}>
              <AlertCircle className="w-4 h-4" /> {error}
            </div>
          )}
          {savedId && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm"
              style={{ background: 'color-mix(in oklab, var(--ok) 15%, transparent)', color: 'var(--ok)' }}>
              <CheckCircle2 className="w-4 h-4" /> Invoice saved
            </div>
          )}
          <button onClick={handleSave} disabled={saving} className="btn">
            <Save className="w-4 h-4" /> {saving ? 'Saving…' : 'Save'}
          </button>
          <button onClick={handleSaveAndPrint} disabled={saving} className="btn btn-primary">
            <Printer className="w-4 h-4" /> Save &amp; Print
          </button>
          <button onClick={handleSaveAndNew} disabled={saving} className="btn">
            New After Save
          </button>
        </div>
      </div>
    </div>
  );
}

function BreakCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="uppercase tracking-[0.15em] text-[10px]" style={{ color: 'var(--text-mute)' }}>{label}</span>
      <span className="num font-semibold">{value}</span>
    </div>
  );
}

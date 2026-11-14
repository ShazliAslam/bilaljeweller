import { useEffect, useState } from 'react';
import { Save, Download, Upload, CheckCircle2, Store, Printer, Scale, FileText } from 'lucide-react';
import { useSettings, type Settings as S, type RateUnit } from '../contexts/SettingsContext';
import { listInvoices } from '../lib/invoices';

export default function SettingsPage() {
  const { settings, save } = useSettings();
  const [form, setForm] = useState<S>(settings);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [restoreMsg, setRestoreMsg] = useState<string | null>(null);

  useEffect(() => { setForm(settings); }, [settings]);

  const onSave = async () => {
    await save(form);
    setSavedAt(Date.now());
    setTimeout(() => setSavedAt(null), 2200);
  };

  const set = <K extends keyof S>(k: K, v: S[K]) => setForm(f => ({ ...f, [k]: v }));

  const backup = async () => {
    const invoices = await listInvoices({ limit: 1000 });
    const payload = { exported_at: new Date().toISOString(), settings: form, invoices };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bilal-jewellers-backup-${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setRestoreMsg('Backup downloaded.');
    setTimeout(() => setRestoreMsg(null), 2500);
  };

  const restore = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const data = JSON.parse(reader.result as string);
        if (data.settings) {
          setForm({ ...form, ...data.settings });
          await save({ ...form, ...data.settings });
        }
        if (Array.isArray(data.invoices)) {
          const res = await fetch('/api/restore', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ invoices: data.invoices }),
          });
          if (!res.ok) throw new Error('Restore failed');
          const result = await res.json();
          setRestoreMsg(`Restored: ${result.inserted} invoices added, ${result.skipped} already present.`);
        } else {
          setRestoreMsg('Settings restored.');
        }
      } catch (err) {
        setRestoreMsg('Invalid backup file: ' + (err as Error).message);
      }
      setTimeout(() => setRestoreMsg(null), 4000);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      <div className="lg:col-span-8 space-y-6">
        <Section icon={<Store className="w-4 h-4" />} title="Shop Details" subtitle="Appears on every invoice & receipt.">
          <div className="grid md:grid-cols-2 gap-4">
            <Field label="Shop Name">
              <input className="input input-lg" value={form.shop_name} onChange={e => set('shop_name', e.target.value)} />
            </Field>
            <Field label="Tagline">
              <input className="input input-lg" value={form.shop_tagline} onChange={e => set('shop_tagline', e.target.value)} />
            </Field>
            <Field label="Phone">
              <input className="input input-lg" value={form.phone} onChange={e => set('phone', e.target.value)} />
            </Field>
            <Field label="Currency Symbol">
              <input className="input input-lg" value={form.currency} onChange={e => set('currency', e.target.value)} />
            </Field>
            <Field label="Address" wide>
              <textarea className="textarea" rows={2} value={form.address} onChange={e => set('address', e.target.value)} />
            </Field>
          </div>
        </Section>

        <Section icon={<Scale className="w-4 h-4" />} title="Calculation Defaults" subtitle="Prefilled when you open a new invoice.">
          <div className="grid md:grid-cols-3 gap-4">
            <Field label="Rate Unit">
              <div className="flex items-center gap-1 p-1 rounded-xl" style={{ background: 'var(--bg-soft)' }}>
                {(['gram', 'tola'] as RateUnit[]).map(u => (
                  <button key={u} onClick={() => set('rate_unit', u)}
                    className="px-4 py-2 rounded-lg text-sm font-semibold flex-1 transition"
                    style={{
                      background: form.rate_unit === u ? 'var(--panel)' : 'transparent',
                      color: form.rate_unit === u ? 'var(--accent)' : 'var(--text-mute)',
                    }}>
                    per {u}
                  </button>
                ))}
              </div>
            </Field>
            <Field label={`Default Rate (per ${form.rate_unit})`}>
              <input type="number" min={0} className="input input-lg input-mono"
                value={form.default_gold_rate || ''} onChange={e => set('default_gold_rate', Math.max(0, parseFloat(e.target.value) || 0))} />
            </Field>
            <Field label="Default Wastage %">
              <input type="number" min={0} step="0.01" className="input input-lg input-mono"
                value={form.default_wastage || ''} onChange={e => set('default_wastage', Math.max(0, parseFloat(e.target.value) || 0))} />
            </Field>
          </div>
        </Section>

        <Section icon={<Printer className="w-4 h-4" />} title="Printer" subtitle="Choose default invoice size.">
          <div className="grid md:grid-cols-2 gap-3">
            {[
              { v: 'a4', title: 'A4 Invoice', desc: 'Full-page formal invoice for records.' },
              { v: 'thermal', title: '80mm Receipt', desc: 'Thermal POS printer, quick checkout.' },
            ].map(o => (
              <button key={o.v}
                onClick={() => set('printer_mode', o.v as 'a4' | 'thermal')}
                className="text-left p-4 rounded-xl border transition"
                style={{
                  borderColor: form.printer_mode === o.v ? 'var(--accent)' : 'var(--border)',
                  background: form.printer_mode === o.v ? 'var(--accent-glow)' : 'var(--panel)',
                }}>
                <div className="font-display text-lg font-semibold">{o.title}</div>
                <div className="text-sm mt-1" style={{ color: 'var(--text-soft)' }}>{o.desc}</div>
              </button>
            ))}
          </div>
        </Section>

        <Section icon={<FileText className="w-4 h-4" />} title="Invoice Footer" subtitle="Shown at the bottom of every printed invoice.">
          <Field label="Footer Text" wide>
            <textarea className="textarea" rows={3} value={form.footer} onChange={e => set('footer', e.target.value)} />
          </Field>
        </Section>
      </div>

      <div className="lg:col-span-4 space-y-6">
        <div className="card p-5 sticky top-4">
          <div className="text-[11px] uppercase tracking-[0.2em] mb-2" style={{ color: 'var(--text-mute)' }}>Preview</div>
          <div className="font-display text-2xl font-semibold" style={{ color: 'var(--accent)' }}>{form.shop_name}</div>
          <div className="text-[10px] tracking-[0.2em] uppercase" style={{ color: 'var(--text-mute)' }}>{form.shop_tagline}</div>
          <div className="divider-gold my-3" />
          <div className="text-xs space-y-1" style={{ color: 'var(--text-soft)' }}>
            {form.address && <div>{form.address}</div>}
            {form.phone && <div>Tel: {form.phone}</div>}
          </div>
          <div className="divider-gold my-3" />
          <div className="text-xs flex justify-between"><span>Default rate</span><span className="num">{form.currency} {form.default_gold_rate.toLocaleString()} / {form.rate_unit}</span></div>
          <div className="text-xs flex justify-between mt-1"><span>Default wastage</span><span className="num">{form.default_wastage}%</span></div>
          <div className="text-xs flex justify-between mt-1"><span>Printer</span><span>{form.printer_mode === 'a4' ? 'A4' : '80mm'}</span></div>

          <button onClick={onSave} className="btn btn-primary w-full mt-4">
            <Save className="w-4 h-4" /> Save Settings
          </button>
          {savedAt && (
            <div className="mt-3 text-xs flex items-center gap-2" style={{ color: 'var(--ok)' }}>
              <CheckCircle2 className="w-4 h-4" /> Settings saved.
            </div>
          )}
        </div>

        <div className="card p-5">
          <div className="font-display text-lg font-semibold">Database Backup</div>
          <div className="text-sm mt-1" style={{ color: 'var(--text-soft)' }}>
            Export every invoice & setting to a JSON file, or restore from one.
          </div>
          <div className="mt-4 flex flex-col gap-2">
            <button onClick={backup} className="btn"><Download className="w-4 h-4" /> Download Backup</button>
            <label className="btn cursor-pointer">
              <Upload className="w-4 h-4" /> Restore From File
              <input type="file" accept="application/json" onChange={restore} className="hidden" />
            </label>
          </div>
          {restoreMsg && (
            <div className="mt-3 text-xs" style={{ color: 'var(--ok)' }}>{restoreMsg}</div>
          )}
        </div>
      </div>
    </div>
  );
}

function Section({ icon, title, subtitle, children }: { icon: React.ReactNode; title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div className="card">
      <div className="card-head flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg flex items-center justify-center"
          style={{ background: 'var(--accent-glow)', color: 'var(--accent)' }}>{icon}</div>
        <div>
          <div className="font-display text-lg font-semibold">{title}</div>
          <div className="text-xs" style={{ color: 'var(--text-mute)' }}>{subtitle}</div>
        </div>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function Field({ label, children, wide }: { label: string; children: React.ReactNode; wide?: boolean }) {
  return (
    <div className={wide ? 'md:col-span-2' : ''}>
      <div className="label">{label}</div>
      {children}
    </div>
  );
}

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

export type RateUnit = 'gram' | 'tola';
export const GRAMS_PER_TOLA = 11.664;

export type Settings = {
  shop_name: string;
  shop_tagline: string;
  phone: string;
  address: string;
  footer: string;
  rate_unit: RateUnit;
  default_gold_rate: number;   // stored in the unit above
  default_wastage: number;     // percent
  currency: string;            // symbol, e.g. 'Rs.'
  printer_mode: 'a4' | 'thermal';
};

const DEFAULTS: Settings = {
  shop_name: 'Bilal Jewellers',
  shop_tagline: 'Fine Gold • Timeless Craft',
  phone: '',
  address: '',
  footer: 'Thank you for shopping with Bilal Jewellers.',
  rate_unit: 'tola',
  default_gold_rate: 285000,
  default_wastage: 8,
  currency: 'Rs.',
  printer_mode: 'a4',
};

type Ctx = {
  settings: Settings;
  loading: boolean;
  save: (patch: Partial<Settings>) => Promise<void>;
  reload: () => Promise<void>;
};

const SettingsCtx = createContext<Ctx>({
  settings: DEFAULTS, loading: true, save: async () => {}, reload: async () => {},
});

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(() => {
    try {
      const raw = localStorage.getItem('bj_settings');
      if (raw) return { ...DEFAULTS, ...JSON.parse(raw) };
    } catch {}
    return DEFAULTS;
  });
  const [loading, setLoading] = useState(true);

  const reload = async () => {
    try {
      const res = await fetch('/api/settings');
      if (!res.ok) throw new Error('fail');
      const data = await res.json();
      const merged = { ...DEFAULTS, ...data };
      setSettings(merged);
      localStorage.setItem('bj_settings', JSON.stringify(merged));
    } catch {
      // offline-first: keep local values
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { reload(); /* eslint-disable-next-line */ }, []);

  const save = async (patch: Partial<Settings>) => {
    const next = { ...settings, ...patch };
    setSettings(next);
    localStorage.setItem('bj_settings', JSON.stringify(next));
    try {
      await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(next),
      });
    } catch {}
  };

  return (
    <SettingsCtx.Provider value={{ settings, loading, save, reload }}>
      {children}
    </SettingsCtx.Provider>
  );
}

export const useSettings = () => useContext(SettingsCtx);

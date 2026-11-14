import type { ItemCalc, ItemInput } from './calc';
import type { RateUnit } from '../contexts/SettingsContext';

export type StoredItem = ItemInput & ItemCalc;

export type StoredInvoice = {
  id: number;
  invoice_number: string;
  customer_name: string | null;
  customer_phone: string | null;
  items: StoredItem[];
  subtotal: number;
  gold_rate: number;
  rate_unit: RateUnit;
  wastage_percent: number;
  created_at: string;
};

export async function createInvoice(payload: Omit<StoredInvoice, 'id' | 'created_at'>): Promise<StoredInvoice> {
  const res = await fetch('/api/invoices', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error((await res.json()).error || 'Failed to save invoice');
  return res.json();
}

export async function listInvoices(params: { q?: string; from?: string; to?: string; limit?: number } = {}): Promise<StoredInvoice[]> {
  const qs = new URLSearchParams();
  if (params.q) qs.set('q', params.q);
  if (params.from) qs.set('from', params.from);
  if (params.to) qs.set('to', params.to);
  if (params.limit) qs.set('limit', String(params.limit));
  const res = await fetch('/api/invoices?' + qs.toString());
  if (!res.ok) throw new Error('Failed to load invoices');
  return res.json();
}

export async function getInvoice(id: number): Promise<StoredInvoice> {
  const res = await fetch('/api/invoice?id=' + id);
  if (!res.ok) throw new Error('Not found');
  return res.json();
}

export type Stats = {
  today_total: number;
  today_count: number;
  month_total: number;
  month_count: number;
  recent: StoredInvoice[];
};

export async function getStats(): Promise<Stats> {
  const res = await fetch('/api/stats');
  if (!res.ok) throw new Error('Failed to load stats');
  return res.json();
}

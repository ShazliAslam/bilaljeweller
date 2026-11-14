// Decimal-safe arithmetic for POS totals.
// We work internally in integer "micro units" (×1,000,000) and round at display
// boundaries to avoid IEEE float drift on sums of many line items.

const SCALE = 1_000_000;

export const toMicro = (n: number): number => Math.round((Number(n) || 0) * SCALE);
export const fromMicro = (m: number): number => m / SCALE;

export const addMicro = (...xs: number[]): number => xs.reduce((a, b) => a + b, 0);
export const mulMicro = (a: number, b: number): number => Math.round((a * b) / SCALE);

export const round2 = (n: number): number => Math.round(n * 100) / 100;
export const round3 = (n: number): number => Math.round(n * 1000) / 1000;

export function fmtMoney(n: number, currency = 'Rs.'): string {
  const v = round2(n);
  const s = Math.abs(v).toLocaleString('en-PK', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${currency} ${v < 0 ? '-' : ''}${s}`;
}

export function fmtWeight(g: number): string {
  return `${round3(g).toLocaleString('en-US', { minimumFractionDigits: 3, maximumFractionDigits: 3 })} g`;
}

export function fmtRate(n: number, unit: 'gram' | 'tola', currency = 'Rs.'): string {
  return `${fmtMoney(n, currency)}/${unit === 'tola' ? 'tola' : 'g'}`;
}

export function clampNonNeg(n: number): number {
  if (!Number.isFinite(n) || n < 0) return 0;
  return n;
}

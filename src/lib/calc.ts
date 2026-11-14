// Gold Jewellery POS calculation engine.
// All math is done in integer micro-units via money.ts to stay decimal-safe,
// and final values are rounded to 2 decimal places for money / 3 for weight.

import { toMicro, mulMicro, addMicro, fromMicro, round2, round3, clampNonNeg } from './money';
import { GRAMS_PER_TOLA, type RateUnit } from '../contexts/SettingsContext';

export type ItemInput = {
  description: string;
  weight: number;           // grams
  wastagePercent: number;   // e.g. 8  ->  8%
  makingCharges: number;    // flat amount
};

export type ItemCalc = {
  wastageWeight: number;    // grams (rounded 3dp)
  totalWeight: number;      // grams (rounded 3dp)
  goldAmount: number;       // money (rounded 2dp)
  itemTotal: number;        // money (rounded 2dp)
};

/** Convert a user-entered gold rate (per gram OR per tola) to per-gram. */
export function ratePerGram(rate: number, unit: RateUnit): number {
  const r = clampNonNeg(rate);
  return unit === 'tola' ? r / GRAMS_PER_TOLA : r;
}

/** Run the full item calculation. Safe for any numeric input; negatives clamp to 0. */
export function calcItem(input: ItemInput, goldRate: number, rateUnit: RateUnit): ItemCalc {
  const weight = clampNonNeg(input.weight);
  const wastagePct = clampNonNeg(input.wastagePercent);
  const making = clampNonNeg(input.makingCharges);

  // Weights in micro-grams
  const weightMicro = toMicro(weight);
  const wastageMicro = mulMicro(weightMicro, toMicro(wastagePct / 100));
  const totalWeightMicro = addMicro(weightMicro, wastageMicro);

  const perGramMicro = toMicro(ratePerGram(goldRate, rateUnit));
  const goldAmountMicro = mulMicro(totalWeightMicro, perGramMicro);
  const makingMicro = toMicro(making);
  const itemTotalMicro = addMicro(goldAmountMicro, makingMicro);

  return {
    wastageWeight: round3(fromMicro(wastageMicro)),
    totalWeight: round3(fromMicro(totalWeightMicro)),
    goldAmount: round2(fromMicro(goldAmountMicro)),
    itemTotal: round2(fromMicro(itemTotalMicro)),
  };
}

export function calcInvoiceTotal(items: ItemCalc[]): number {
  const totalMicro = addMicro(...items.map(i => toMicro(i.itemTotal)));
  return round2(fromMicro(totalMicro));
}

/** Generate a locally-unique invoice number as a client-side fallback.
 *  Format: BJ-YYYYMMDD-HHMMSS-XXX (XXX random). */
export function generateInvoiceNumber(): string {
  const d = new Date();
  const p = (n: number, w = 2) => String(n).padStart(w, '0');
  const date = `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}`;
  const time = `${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`;
  const rand = p(Math.floor(Math.random() * 1000), 3);
  return `BJ-${date}-${time}-${rand}`;
}

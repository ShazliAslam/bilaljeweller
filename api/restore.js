import supabase from './db-client.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
    const { invoices } = req.body || {};
    if (!Array.isArray(invoices)) return res.status(400).json({ error: 'invoices array required' });

    let inserted = 0, skipped = 0;
    for (const inv of invoices) {
      if (!inv.invoice_number) { skipped++; continue; }
      const { data: existing } = await supabase
        .from('invoices').select('id').eq('invoice_number', inv.invoice_number).maybeSingle();
      if (existing) { skipped++; continue; }
      const row = {
        invoice_number: inv.invoice_number,
        customer_name: inv.customer_name ?? null,
        customer_phone: inv.customer_phone ?? null,
        items: inv.items || [],
        subtotal: Number(inv.subtotal) || 0,
        gold_rate: Number(inv.gold_rate) || 0,
        rate_unit: inv.rate_unit === 'gram' ? 'gram' : 'tola',
        wastage_percent: Number(inv.wastage_percent) || 0,
        created_at: inv.created_at || new Date().toISOString(),
      };
      const { error } = await supabase.from('invoices').insert(row);
      if (!error) inserted++;
    }
    return res.status(200).json({ inserted, skipped });
  } catch (err) {
    console.error('restore error:', err);
    res.status(500).json({ error: err.message });
  }
}

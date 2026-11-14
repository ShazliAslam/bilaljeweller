import supabase from './db-client.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    const now = new Date();
    const startOfDay = new Date(now); startOfDay.setHours(0, 0, 0, 0);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [{ data: today, error: e1 }, { data: month, error: e2 }, { data: recent, error: e3 }] = await Promise.all([
      supabase.from('invoices').select('subtotal').gte('created_at', startOfDay.toISOString()),
      supabase.from('invoices').select('subtotal').gte('created_at', startOfMonth.toISOString()),
      supabase.from('invoices').select('*').order('created_at', { ascending: false }).limit(8),
    ]);
    if (e1) throw e1;
    if (e2) throw e2;
    if (e3) throw e3;

    const sum = rows => rows.reduce((a, r) => a + Number(r.subtotal || 0), 0);

    return res.status(200).json({
      today_total: sum(today || []),
      today_count: (today || []).length,
      month_total: sum(month || []),
      month_count: (month || []).length,
      recent: recent || [],
    });
  } catch (err) {
    console.error('stats error:', err);
    res.status(500).json({ error: err.message });
  }
}

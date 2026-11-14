import supabase from './db-client.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    if (req.method === 'GET') {
      const { q, from, to, limit } = req.query;
      let query = supabase
        .from('invoices')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(Math.min(parseInt(limit, 10) || 100, 1000));

      if (from) query = query.gte('created_at', new Date(from).toISOString());
      if (to) {
        const d = new Date(to); d.setHours(23, 59, 59, 999);
        query = query.lte('created_at', d.toISOString());
      }
      if (q && q.trim()) {
        const term = q.trim().replace(/[%,]/g, '');
        // search invoice_number, customer_name and customer_phone
        query = query.or(
          `invoice_number.ilike.%${term}%,customer_name.ilike.%${term}%,customer_phone.ilike.%${term}%`
        );
      }

      const { data, error } = await query;
      if (error) throw error;
      return res.status(200).json(data);
    }

    if (req.method === 'POST') {
      const body = req.body || {};
      const required = ['invoice_number', 'items', 'subtotal', 'gold_rate', 'rate_unit'];
      for (const k of required) {
        if (body[k] === undefined || body[k] === null) {
          return res.status(400).json({ error: `Missing field: ${k}` });
        }
      }
      if (!Array.isArray(body.items) || body.items.length === 0) {
        return res.status(400).json({ error: 'At least one item is required.' });
      }
      if (Number(body.subtotal) < 0) {
        return res.status(400).json({ error: 'Subtotal must be non-negative.' });
      }
      if (!['gram', 'tola'].includes(body.rate_unit)) {
        return res.status(400).json({ error: 'Invalid rate_unit.' });
      }

      const row = {
        invoice_number: String(body.invoice_number),
        customer_name: body.customer_name ?? null,
        customer_phone: body.customer_phone ?? null,
        items: body.items,
        subtotal: Number(body.subtotal),
        gold_rate: Number(body.gold_rate),
        rate_unit: body.rate_unit,
        wastage_percent: Number(body.wastage_percent) || 0,
      };

      const { data, error } = await supabase
        .from('invoices')
        .insert(row)
        .select()
        .single();
      if (error) throw error;
      return res.status(201).json(data);
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('invoices error:', err);
    res.status(500).json({ error: err.message });
  }
}

import supabase from './db-client.js';

const DEFAULTS = {
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

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    if (req.method === 'GET') {
      const { data, error } = await supabase.from('settings').select('*').eq('id', 1).maybeSingle();
      if (error) throw error;
      if (!data) {
        // seed defaults
        const { data: seeded, error: seedErr } = await supabase
          .from('settings').insert({ id: 1, data: DEFAULTS }).select().single();
        if (seedErr) throw seedErr;
        return res.status(200).json(seeded.data);
      }
      return res.status(200).json({ ...DEFAULTS, ...(data.data || {}) });
    }

    if (req.method === 'PUT') {
      const body = req.body || {};
      const merged = { ...DEFAULTS, ...body };
      const { data, error } = await supabase
        .from('settings')
        .upsert({ id: 1, data: merged, updated_at: new Date().toISOString() })
        .select()
        .single();
      if (error) throw error;
      return res.status(200).json(data.data);
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('settings error:', err);
    res.status(500).json({ error: err.message });
  }
}

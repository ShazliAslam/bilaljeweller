import { createClient } from '@supabase/supabase-js';

const ADMIN_EMAIL = 'mshazliaslam@gmail.com';

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } },
);

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    // Verify the caller is the admin.
    const token = (req.headers.authorization || '').replace('Bearer ', '').trim();
    if (!token) return res.status(401).json({ error: 'Not authenticated' });
    const { data: userData, error: userErr } = await admin.auth.getUser(token);
    if (userErr || !userData?.user) return res.status(401).json({ error: 'Invalid session' });
    const callerEmail = (userData.user.email || '').toLowerCase();
    if (callerEmail !== ADMIN_EMAIL.toLowerCase()) {
      return res.status(403).json({ error: 'Only the admin can create users.' });
    }

    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ error: 'Email and password are required.' });
    if (String(password).length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters.' });

    const { data, error } = await admin.auth.admin.createUser({
      email: String(email).trim(),
      password: String(password),
      email_confirm: true,
    });
    if (error) return res.status(400).json({ error: error.message });

    return res.status(201).json({ id: data.user?.id, email: data.user?.email });
  } catch (err) {
    console.error('create-user error:', err);
    return res.status(500).json({ error: err.message });
  }
}

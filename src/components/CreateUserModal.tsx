import { useEffect, useRef, useState, type FormEvent } from 'react';
import { X, UserPlus, Mail, Lock, CheckCircle2, AlertCircle, Copy } from 'lucide-react';
import supabase from '../lib/supabase';

export default function CreateUserModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<{ email: string } | null>(null);
  const emailRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setEmail(''); setPassword(''); setErr(null); setOk(null);
      setTimeout(() => emailRef.current?.focus(), 50);
    }
  }, [open]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' && open) onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setErr(null); setOk(null);
    if (!email.trim() || password.length < 6) {
      setErr('Enter a valid email and a password of at least 6 characters.');
      return;
    }
    setBusy(true);
    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;
      const res = await fetch('/api/create-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ email: email.trim(), password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create user');
      setOk({ email: data.email || email.trim() });
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const genPassword = () => {
    const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$';
    let out = '';
    for (let i = 0; i < 14; i++) out += chars[Math.floor(Math.random() * chars.length)];
    setPassword(out);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(8px)' }}
      onClick={onClose}>
      <div className="w-full max-w-md glass rounded-2xl p-6 relative" onClick={e => e.stopPropagation()}
        style={{ boxShadow: '0 30px 80px -20px rgba(0,0,0,0.5)' }}>
        <button onClick={onClose} className="absolute top-3 right-3 btn btn-ghost" aria-label="Close">
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg,var(--accent),var(--accent-soft))' }}>
            <UserPlus className="w-5 h-5" style={{ color: '#15120E' }} />
          </div>
          <div>
            <div className="font-display text-xl font-semibold">Create New User</div>
            <div className="text-xs" style={{ color: 'var(--text-mute)' }}>
              Grants POS access with the chosen credentials.
            </div>
          </div>
        </div>

        <div className="divider-gold my-5" />

        {ok ? (
          <div className="space-y-4">
            <div className="flex items-start gap-2 p-3 rounded-lg text-sm"
              style={{ background: 'color-mix(in oklab, var(--ok) 15%, transparent)', color: 'var(--ok)' }}>
              <CheckCircle2 className="w-4 h-4 mt-0.5" />
              <div>
                <div className="font-semibold">User created successfully.</div>
                <div className="text-xs mt-0.5" style={{ color: 'var(--text-soft)' }}>
                  Share the credentials below with the user.
                </div>
              </div>
            </div>
            <div className="card p-3">
              <div className="flex items-center justify-between gap-3 text-sm">
                <div>
                  <div className="text-[10px] uppercase tracking-[0.2em]" style={{ color: 'var(--text-mute)' }}>Email</div>
                  <div className="num">{ok.email}</div>
                </div>
                <button className="btn btn-ghost" onClick={() => navigator.clipboard.writeText(ok.email)}>
                  <Copy className="w-3 h-3" /> Copy
                </button>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => { setOk(null); setEmail(''); setPassword(''); setTimeout(() => emailRef.current?.focus(), 30); }}
                className="btn flex-1">Add Another</button>
              <button onClick={onClose} className="btn btn-primary flex-1">Done</button>
            </div>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            <div>
              <div className="label"><Mail className="w-3 h-3 inline mr-1" /> Email</div>
              <input ref={emailRef} type="email" required className="input input-lg"
                placeholder="user@example.com" value={email} onChange={e => setEmail(e.target.value)} />
            </div>
            <div>
              <div className="label flex items-center justify-between">
                <span><Lock className="w-3 h-3 inline mr-1" /> Password</span>
                <button type="button" onClick={genPassword}
                  className="text-[10px] font-semibold tracking-wider uppercase"
                  style={{ color: 'var(--accent)' }}>Generate</button>
              </div>
              <input type="text" required minLength={6} className="input input-lg input-mono"
                placeholder="At least 6 characters" value={password} onChange={e => setPassword(e.target.value)} />
              <div className="text-[11px] mt-1" style={{ color: 'var(--text-mute)' }}>
                Visible so you can share it once. Users can change it later.
              </div>
            </div>

            {err && (
              <div className="flex items-start gap-2 p-3 rounded-lg text-sm"
                style={{ background: 'color-mix(in oklab, var(--danger) 10%, transparent)', color: 'var(--danger)' }}>
                <AlertCircle className="w-4 h-4 mt-0.5" /> {err}
              </div>
            )}

            <div className="flex gap-2">
              <button type="button" onClick={onClose} className="btn flex-1">Cancel</button>
              <button type="submit" disabled={busy} className="btn btn-primary flex-1">
                {busy ? 'Creating…' : (<><UserPlus className="w-4 h-4" /> Create User</>)}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

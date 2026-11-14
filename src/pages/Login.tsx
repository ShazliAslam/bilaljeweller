import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Gem, Lock, Mail, ArrowRight, AlertCircle, Eye, EyeOff } from 'lucide-react';
import supabase from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export default function Login() {
  const { user, loading } = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => { if (!loading && user) nav('/', { replace: true }); }, [user, loading, nav]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setErr(null);
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    setBusy(false);
    if (error) setErr(error.message);
    else nav('/', { replace: true });
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center p-6 overflow-hidden" style={{ zIndex: 1 }}>
      {/* Atmospheric background */}
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <div className="absolute -top-40 -left-40 w-[560px] h-[560px] rounded-full blur-3xl opacity-40"
          style={{ background: 'radial-gradient(circle, var(--accent-soft), transparent 70%)' }} />
        <div className="absolute -bottom-40 -right-40 w-[560px] h-[560px] rounded-full blur-3xl opacity-30"
          style={{ background: 'radial-gradient(circle, var(--accent), transparent 70%)' }} />
        <svg className="absolute inset-0 w-full h-full opacity-[0.025]" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="g" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M40 0H0V40" fill="none" stroke="currentColor" strokeWidth="0.5"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#g)" />
        </svg>
      </div>

      <div className="w-full max-w-md relative">
        <div className="glass rounded-2xl p-8 shadow-2xl" style={{ boxShadow: '0 30px 80px -30px var(--accent-glow)' }}>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center shadow-lg"
              style={{ background: 'linear-gradient(135deg,var(--accent),var(--accent-soft))' }}>
              <Gem className="w-5 h-5" style={{ color: '#15120E' }} />
            </div>
            <div>
              <div className="font-display text-2xl font-semibold leading-tight">Bilal Jewellers</div>
              <div className="text-[10px] uppercase tracking-[0.25em]" style={{ color: 'var(--text-mute)' }}>
                Point of Sale
              </div>
            </div>
          </div>

          <div className="divider-gold mb-6" />

          <h1 className="font-display text-[28px] leading-tight font-semibold">Welcome back</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-soft)' }}>
            Sign in to continue to the POS dashboard.
          </p>

          <form onSubmit={submit} className="mt-6 space-y-4">
            <div>
              <div className="label"><Mail className="w-3 h-3 inline mr-1" /> Email</div>
              <input
                type="email" required autoFocus autoComplete="email"
                className="input input-lg" placeholder="you@example.com"
                value={email} onChange={e => setEmail(e.target.value)} />
            </div>
            <div>
              <div className="label"><Lock className="w-3 h-3 inline mr-1" /> Password</div>
              <div className="relative">
                <input
                  type={show ? 'text' : 'password'} required autoComplete="current-password"
                  className="input input-lg pr-11" placeholder="••••••••"
                  value={password} onChange={e => setPassword(e.target.value)} />
                <button type="button" onClick={() => setShow(s => !s)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg hover:bg-[color:var(--bg-soft)]"
                  aria-label="Toggle password visibility">
                  {show ? <EyeOff className="w-4 h-4" style={{ color: 'var(--text-mute)' }}/> : <Eye className="w-4 h-4" style={{ color: 'var(--text-mute)' }}/>}
                </button>
              </div>
            </div>

            {err && (
              <div className="flex items-start gap-2 p-3 rounded-lg text-sm"
                style={{ background: 'color-mix(in oklab, var(--danger) 10%, transparent)', color: 'var(--danger)' }}>
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" /> {err}
              </div>
            )}

            <button type="submit" disabled={busy} className="btn btn-primary w-full input-lg justify-center">
              {busy ? 'Signing in…' : (<>Sign In <ArrowRight className="w-4 h-4" /></>)}
            </button>
          </form>

          <div className="mt-6 text-[11px] text-center" style={{ color: 'var(--text-mute)' }}>
            Protected by local authentication · Data never leaves your vault.
          </div>
        </div>

        <div className="mt-4 text-center text-[11px]" style={{ color: 'var(--text-mute)' }}>
          <span className="ornament">◆ · ◆ · ◆</span>
        </div>
      </div>
    </div>
  );
}

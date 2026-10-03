import { FormEvent, type ReactNode, useCallback, useEffect, useMemo, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { getSupabaseClient, getSupabaseClientConfigStatus } from '../supabase/client';
import type { AppAdminRow } from '../supabase/appAdmin.types';

type AuthGateStatus = 'local_only' | 'checking' | 'signed_out' | 'allowed' | 'blocked' | 'error';

interface AdminSessionGateProps {
  children: ReactNode;
}

const shellStyle = {
  minHeight: '100vh',
  background: '#0f172a',
  color: '#e2e8f0',
  display: 'grid',
  placeItems: 'center',
  padding: '2rem'
};

const cardStyle = {
  width: 'min(680px, 100%)',
  border: '1px solid rgba(148, 163, 184, 0.35)',
  borderRadius: '24px',
  padding: '2rem',
  background: 'rgba(15, 23, 42, 0.92)',
  boxShadow: '0 24px 80px rgba(0, 0, 0, 0.35)'
};

const bannerStyle = {
  display: 'flex',
  gap: '1rem',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '0.85rem 1rem',
  background: '#111827',
  color: '#e5e7eb',
  borderBottom: '1px solid rgba(148, 163, 184, 0.25)',
  fontSize: '0.92rem'
};

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function StatusBanner({ admin, onSignOut }: { admin: AppAdminRow; onSignOut: () => Promise<void> }) {
  return (
    <div style={bannerStyle}>
      <span>
        Supabase session verified: <strong>{admin.role}</strong> access for {admin.email}. Live customer writes remain disabled.
      </span>
      <button type="button" onClick={onSignOut}>
        Sign out
      </button>
    </div>
  );
}

function LocalOnlyBanner({ reasons }: { reasons: string[] }) {
  return (
    <div style={bannerStyle}>
      <span>
        Local-only mode. Supabase login is not enabled yet{reasons.length ? `: ${reasons.join(' ')}` : '.'}
      </span>
    </div>
  );
}

export function AdminSessionGate({ children }: AdminSessionGateProps) {
  const configStatus = useMemo(() => getSupabaseClientConfigStatus(), []);
  const supabase = useMemo(() => getSupabaseClient(), []);
  const [status, setStatus] = useState<AuthGateStatus>(configStatus.ready && supabase ? 'checking' : 'local_only');
  const [session, setSession] = useState<Session | null>(null);
  const [admin, setAdmin] = useState<AppAdminRow | null>(null);
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');

  const verifySession = useCallback(async () => {
    if (!supabase) {
      setStatus('local_only');
      return;
    }

    setStatus('checking');
    const sessionResult = await supabase.auth.getSession();
    const nextSession = sessionResult.data.session;
    setSession(nextSession);

    const userEmail = nextSession?.user.email ? normalizeEmail(nextSession.user.email) : '';

    if (!userEmail) {
      setAdmin(null);
      setStatus('signed_out');
      return;
    }

    const { data, error } = await (supabase as any)
      .from('app_admins')
      .select('id,email,role,brand_scope,active,notes,created_at,updated_at')
      .eq('email', userEmail)
      .eq('active', true)
      .maybeSingle();

    if (error) {
      setMessage(error.message);
      setStatus('error');
      return;
    }

    if (!data) {
      setMessage('This signed-in email is not active in public.app_admins.');
      setAdmin(null);
      setStatus('blocked');
      return;
    }

    setAdmin(data as AppAdminRow);
    setStatus('allowed');
  }, [supabase]);

  useEffect(() => {
    if (!supabase) return;

    void verifySession();
    const { data } = supabase.auth.onAuthStateChange(() => {
      void verifySession();
    });

    return () => data.subscription.unsubscribe();
  }, [supabase, verifySession]);

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase) return;

    const cleanEmail = normalizeEmail(email);
    if (!cleanEmail) {
      setMessage('Enter your owner/admin email.');
      return;
    }

    const { error } = await supabase.auth.signInWithOtp({
      email: cleanEmail,
      options: {
        emailRedirectTo: window.location.origin
      }
    });

    if (error) {
      setMessage(error.message);
      setStatus('error');
      return;
    }

    setMessage('Magic-link email sent. Open it in this browser, then return here.');
  }

  async function handleSignOut() {
    if (!supabase) return;
    await supabase.auth.signOut();
    setAdmin(null);
    setSession(null);
    setStatus('signed_out');
  }

  if (status === 'local_only') {
    return (
      <>
        <LocalOnlyBanner reasons={configStatus.reasons} />
        {children}
      </>
    );
  }

  if (status === 'allowed' && admin) {
    return (
      <>
        <StatusBanner admin={admin} onSignOut={handleSignOut} />
        {children}
      </>
    );
  }

  return (
    <div style={shellStyle}>
      <section style={cardStyle}>
        <p className="eyebrow">Rosevear Comms Hub</p>
        <h1>Admin login</h1>
        <p>
          QL-010 verifies a Supabase Auth session and checks the signed-in email against the app admin allowlist before live Supabase data access is allowed.
        </p>

        {status === 'checking' && <p>Checking Supabase session…</p>}

        {status !== 'checking' && (
          <form onSubmit={handleLogin}>
            <label>
              Owner/admin email
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
              />
            </label>
            <button type="submit">Send magic link</button>
          </form>
        )}

        {session?.user.email && status !== 'allowed' && (
          <p>
            Signed in as {session.user.email}, but access is not verified. Confirm the email is active in <code>public.app_admins</code>.
          </p>
        )}

        {message && <p>{message}</p>}

        <p>
          Real customer data, live writes, phone/SMS, and AI auto-send remain disabled until the next data-access build.
        </p>
      </section>
    </div>
  );
}

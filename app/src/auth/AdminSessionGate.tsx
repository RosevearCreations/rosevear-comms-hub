import { FormEvent, type ReactNode, useCallback, useEffect, useMemo, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { getSupabaseClient, getSupabaseClientConfigStatus } from '../supabase/client';
import { createLocalFallbackReadModel, loadSupabaseReadModel, type SupabaseReadModel } from '../supabase/readModel';
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
  fontSize: '0.92rem',
  flexWrap: 'wrap' as const
};

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function describeReadModel(readModel: SupabaseReadModel | null): string {
  if (!readModel) return 'Reference reads pending. Customer data remains local-only.';
  if (readModel.mode === 'supabase_reference') {
    return `Supabase reference read verified: ${readModel.brands.length} brand workspace${readModel.brands.length === 1 ? '' : 's'} loaded. Customer data remains local-only.`;
  }
  if (readModel.mode === 'error') {
    return `Supabase reference read warning: ${readModel.message}`;
  }
  return readModel.message;
}

function StatusBanner({ admin, readModel, onSignOut }: { admin: AppAdminRow; readModel: SupabaseReadModel | null; onSignOut: () => Promise<void> }) {
  return (
    <div style={bannerStyle}>
      <span>
        Supabase session verified: <strong>{admin.role}</strong> access for {admin.email}. {describeReadModel(readModel)}
      </span>
      <button type="button" onClick={onSignOut}>
        Sign out
      </button>
    </div>
  );
}

function LocalOnlyBanner({ reasons }: { reasons: string[] }) {
  return (
    <div style={bannerStyle} className="ql270-config-banner" role="status">
      <strong>● PREVIEW MODE</strong>
      <span>Disabled preview — local samples only. Supabase login/reference reads
        {' '}are intentionally off. No live calls, customer records or six-app connections.</span>
      {import.meta.env.VITE_ENABLE_MASTER_OWNER_LOGIN === 'true' &&
        <a href="#/master" style={{ color: '#dcc5ff', fontWeight: 700 }}>Ree / Jack owner sign-in →</a>}
      {reasons.length>0&&<details>
        <summary>ⓘ Why the Supabase settings say “missing” · setup help</summary>
        <p><strong>No key is needed for the six-app proof handoff.</strong> These notices explain why optional admin login is OFF, not an error with the public proof review. Keep both enable flags false for the current disabled preview.</p>
        <ul aria-label="Current optional login configuration">{reasons.map(reason=><li key={reason}><code>{reason}</code></li>)}</ul>
        <p><strong>Where to put settings only if a later, separately approved login build needs them:</strong></p>
        <ol>
          <li><strong>Local development:</strong> create <code>app/.env.local</code> beside the app's <code>vite.config.ts</code>, add the four <code>VITE_</code> names, and restart Vite. Use <code>false</code> for both flags now; URL/key may stay blank.</li>
          <li><strong>Cloudflare production build:</strong> Workers &amp; Pages → <code>rosevear-comms-hub</code> → Settings → Builds → Build variables and secrets. These are build-time browser values, not the Worker runtime Variables page.</li>
          <li><strong>GitHub Pages preview (separate):</strong> repository Settings → Secrets and variables → Actions → Variables. This does not configure Cloudflare.</li>
        </ol>
        <p>Only with separate approval would an operator set both flags to <code>true</code>, add the public Supabase project URL, and copy a <em>publishable</em> key from Supabase Dashboard → Project Settings → API Keys. Never enter a secret/service-role key, signed source key, password or private token into a <code>VITE_</code> variable.</p>
        <a href="https://github.com/RosevearCreations/rosevear-comms-hub/blob/main/docs/QL-311_NAVIGATION_AND_OPTIONAL_SUPABASE_SETUP.md" target="_blank" rel="noopener noreferrer">Read the full QL-311 setup and navigation guide ↗</a>
      </details>}
    </div>
  );
}

export function AdminSessionGate({ children }: AdminSessionGateProps) {
  const configStatus = useMemo(() => getSupabaseClientConfigStatus(), []);
  const supabase = useMemo(() => getSupabaseClient(), []);
  const [status, setStatus] = useState<AuthGateStatus>(configStatus.ready && supabase ? 'checking' : 'local_only');
  const [session, setSession] = useState<Session | null>(null);
  const [admin, setAdmin] = useState<AppAdminRow | null>(null);
  const [readModel, setReadModel] = useState<SupabaseReadModel | null>(
    configStatus.ready && supabase ? null : createLocalFallbackReadModel(configStatus.reasons.join(' '))
  );
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');

  const verifySession = useCallback(async () => {
    if (!supabase) {
      setReadModel(createLocalFallbackReadModel(configStatus.reasons.join(' ')));
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
      setReadModel(null);
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
      setReadModel(null);
      setStatus('blocked');
      return;
    }

    const nextAdmin = data as AppAdminRow;
    setAdmin(nextAdmin);
    setReadModel(await loadSupabaseReadModel(supabase, userEmail));
    setStatus('allowed');
  }, [supabase, configStatus.reasons]);

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
    setReadModel(null);
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
        <StatusBanner admin={admin} readModel={readModel} onSignOut={handleSignOut} />
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
          QL-011 verifies a Supabase Auth session, checks the signed-in email against the app admin allowlist, and loads safe reference data only.
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
          Real customer data, live writes, phone/SMS, and AI auto-send remain disabled. Only brand/reference reads are allowed after admin verification.
        </p>
      </section>
    </div>
  );
}

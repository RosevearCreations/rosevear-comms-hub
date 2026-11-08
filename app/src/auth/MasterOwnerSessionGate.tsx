import { type FormEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { getOwnerAuthClient, getOwnerPortalConfig } from '../supabase/ql367OwnerClient';
import { verifyOriginalOwner, type OwnerIdentityGateway, type OwnerVerification } from './ql367OwnerIdentity';
import './ql367MasterOwner.css';

type DisplayState = 'CHECKING' | 'SIGNED_OUT' | 'PENDING' | 'ENROLLED' | 'DENIED' | 'ERROR';

export function MasterOwnerSessionGate() {
  const config = useMemo(() => getOwnerPortalConfig(), []);
  const client = useMemo(() => getOwnerAuthClient(), []);
  const requestId = useRef(0);
  const [state, setState] = useState<DisplayState>('CHECKING');
  const [verification, setVerification] = useState<OwnerVerification | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const verify = useCallback(async () => {
    if (!client) return;
    const request = ++requestId.current;
    const outcome = await verifyOriginalOwner(client as unknown as OwnerIdentityGateway);
    if (request !== requestId.current) return;
    setVerification(outcome);
    setState(outcome.state);
    setMessage(outcome.message);
  }, [client]);

  useEffect(() => {
    if (!client) return;
    void verify();
    const { data } = client.auth.onAuthStateChange(() => {
      // Supabase Auth recommends deferring other auth calls outside this callback.
      queueMicrotask(() => { void verify(); });
    });
    return () => {
      ++requestId.current;
      data.subscription.unsubscribe();
    };
  }, [client, verify]);

  async function signIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!client || submitting) return;
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !password) {
      setMessage('Enter the email and password for your own verified owner account.');
      return;
    }
    setSubmitting(true);
    setMessage('Verifying owner credentials…');
    const { error } = await client.auth.signInWithPassword({ email: cleanEmail, password });
    setPassword('');
    setSubmitting(false);
    if (error) {
      setMessage('Sign-in failed. Check your credentials and try again.');
      setState('SIGNED_OUT');
      return;
    }
    setState('CHECKING');
    await verify();
  }

  async function signOut() {
    if (!client) return;
    ++requestId.current;
    setState('CHECKING');
    setVerification(null);
    const { error } = await client.auth.signOut();
    if (error) {
      setState('ERROR');
      setMessage('Sign-out could not be confirmed. This portal remains locked; close the browser and try again.');
      return;
    }
    setEmail('');
    setPassword('');
    setState('SIGNED_OUT');
    setMessage('Signed out.');
  }

  const identity = verification && 'identity' in verification ? verification.identity : null;
  return (
    <main className="ql367-screen">
      <section className="ql367-card" aria-label="Rosevear Creations master owner sign-in">
        <div className="ql367-topline"><span>ROSEVEAR CREATIONS</span><a href="#/">← Public preview</a></div>
        <p className="ql367-overline">Rosevear Comms Hub · QL-367</p>
        <h1>Master Owner Portal</h1>
        <p>Individual, authenticated access for Ree and Jack. Rosevear Creations is the organization, not a shared user account.</p>

        {!config.ready && <div className="ql367-notice" role="alert">{config.reason} All access remains disabled.</div>}

        {config.ready && state === 'CHECKING' && <div role="status" className="ql367-notice">Verifying your authenticated session…</div>}

        {config.ready && state === 'SIGNED_OUT' && (
          <form onSubmit={signIn} className="ql367-form">
            <label htmlFor="ql367-email">Owner email address</label>
            <input id="ql367-email" type="email" name="email" autoComplete="username" required
              value={email} onChange={e => setEmail(e.target.value)} disabled={submitting} />
            <label htmlFor="ql367-password">Password</label>
            <input id="ql367-password" type="password" name="password" autoComplete="current-password" required
              value={password} onChange={e => setPassword(e.target.value)} disabled={submitting} />
            <button type="submit" disabled={submitting}>{submitting ? 'Signing in…' : 'Sign in securely'}</button>
          </form>
        )}

        {config.ready && identity && (state === 'PENDING' || state === 'ENROLLED') && (
          <section className="ql367-identity" aria-label="Verified owner identity" role="status">
            <h2>Authenticated: {identity.ownerRole === 'source' ? 'Ree' : 'Jack'}</h2>
            <p><strong>Account:</strong> {identity.email}</p>
            <p><strong>Organization:</strong> Rosevear Creations</p>
            <p><strong>Owner role:</strong> {identity.ownerRole}</p>
            <p><strong>Enrollment:</strong> {state === 'ENROLLED' ? 'Verified' : 'Pending original-owner approval'}</p>
            <p>All six application connections remain <strong>DISCONNECTED / HOLD</strong>. No customer data, external source operations or persistent access is enabled by sign-in.</p>
          </section>
        )}

        {config.ready && message && state !== 'CHECKING' && (
          <p className="ql367-notice" role={state === 'ERROR' || state === 'DENIED' ? 'alert' : 'status'}>{message}</p>
        )}

        {config.ready && state !== 'SIGNED_OUT' && state !== 'CHECKING' &&
          <button className="ql367-signout" type="button" onClick={() => { void signOut(); }}>Sign out</button>}

        <footer>Authentication verifies identity only. Dual-owner signed enrollment and each application's source-specific approval remain separate requirements.</footer>
      </section>
    </main>
  );
}

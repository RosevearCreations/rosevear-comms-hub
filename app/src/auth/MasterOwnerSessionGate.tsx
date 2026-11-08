import { type FormEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { getOwnerAuthClient, getOwnerPortalConfig } from '../supabase/ql367OwnerClient';
import { verifyOriginalOwner, type OwnerIdentityGateway, type OwnerVerification } from './ql367OwnerIdentity';
import { inspectOwnerMfa, isValidTotpCode, safeTotpQrSource, type OwnerMfaGateway, type OwnerMfaState } from './ql368OwnerMfa';
import {activateDualOwnerFromFiles,attestOwnerMfa,QL369_SHA256,type OwnerCeremonyGateway} from './ql369OwnerEnrollment';
import {OwnerProgressDashboard} from './OwnerProgressDashboard';
import './ql367MasterOwner.css';

type DisplayState = 'CHECKING' | 'SIGNED_OUT' | 'PENDING' | 'ENROLLED' | 'DENIED' | 'ERROR';
type TotpSetup = { factorId: string; qr: string | null; secret: string };
const recoveryMarker = () => new URLSearchParams(window.location.search).get('owner_recovery') === '1';

function clearRecoveryMarker() {
  if (!recoveryMarker()) return;
  // A completed callback should leave no short-lived Auth code or recovery flag
  // in the browser address/history; this route does not use query parameters.
  window.history.replaceState(window.history.state, '', window.location.pathname + window.location.hash);
}

function recoveryRedirect() {
  // No user-controlled redirect or foreign origin.
  return `${window.location.origin}/?owner_recovery=1#/master`;
}

export function MasterOwnerSessionGate() {
  const config = useMemo(() => getOwnerPortalConfig(), []);
  const client = useMemo(() => getOwnerAuthClient(), []);
  const requestId = useRef(0);
  const [state, setState] = useState<DisplayState>('CHECKING');
  const [verification, setVerification] = useState<OwnerVerification | null>(null);
  const [mfa, setMfa] = useState<OwnerMfaState | null>(null);
  const [setup, setSetup] = useState<TotpSetup | null>(null);
  const [mfaCode, setMfaCode] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [recoveryRequest, setRecoveryRequest] = useState(false);
  const [recoveryReturn, setRecoveryReturn] = useState(recoveryMarker);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [enrollmentIntentSha, setEnrollmentIntentSha] = useState('');
  const [ownerMfaAttestedUntil, setOwnerMfaAttestedUntil] = useState('');
  const [signedPacketFile, setSignedPacketFile] = useState<File | null>(null);
  const [sourceCandidateFile, setSourceCandidateFile] = useState<File | null>(null);
  const [masterCandidateFile, setMasterCandidateFile] = useState<File | null>(null);
  const [progressRefresh, setProgressRefresh] = useState(0);
  const [ceremonyReset, setCeremonyReset] = useState(0);

  const verify = useCallback(async () => {
    if (!client) return;
    const request = ++requestId.current;
    const outcome = await verifyOriginalOwner(client as unknown as OwnerIdentityGateway);
    if (request !== requestId.current) return;
    if (outcome.state !== 'PENDING' && outcome.state !== 'ENROLLED') {
      setMfa(null);
      setSetup(null);
      setMfaCode('');
      setOwnerMfaAttestedUntil('');
      setVerification(outcome);
      setState(outcome.state);
      setMessage(outcome.message);
      return;
    }

    const mfaOutcome = await inspectOwnerMfa(client as unknown as OwnerMfaGateway);
    if (request !== requestId.current) return;
    setVerification(outcome);
    setMfa(mfaOutcome);
    setState(outcome.state);
    setMessage(outcome.message);
  }, [client]);

  useEffect(() => {
    if (!client) return;
    void verify();
    const { data } = client.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setRecoveryReturn(true);
      // Defer all other Auth calls outside Supabase's change callback.
      queueMicrotask(() => { void verify(); });
    });
    return () => {
      ++requestId.current;
      data.subscription.unsubscribe();
    };
  }, [client, verify]);

  async function signIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!client || busy) return;
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !password) {
      setMessage('Enter the email and password for your own verified owner account.');
      return;
    }
    setBusy(true);
    setMessage('Verifying owner credentials…');
    let signInError = true;
    try {
      const { error } = await client.auth.signInWithPassword({ email: cleanEmail, password });
      signInError = Boolean(error);
    } catch { /* Do not expose network/Auth internals or claim a session. */ }
    finally { setPassword(''); setBusy(false); }
    if (signInError) {
      setMessage('Sign-in failed. Check your credentials and try again.');
      setState('SIGNED_OUT');
      return;
    }
    setState('CHECKING');
    await verify();
  }

  async function requestPasswordRecovery(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!client || busy || !email.trim()) return;
    setBusy(true);
    try {
      await client.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
        redirectTo: recoveryRedirect()
      });
    } catch { /* The external failure must not reveal whether this email exists. */ }
    finally { setBusy(false); setRecoveryRequest(false); }
    // The same response for known, unknown, rate-limited and unavailable
    // accounts prevents the UI from becoming an email-enumeration oracle.
    setMessage('If this address has an eligible account, a recovery email may arrive. Check the inbox and spam folder; retry later if needed.');
  }

  async function completePasswordRecovery(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!client || busy || (state !== 'PENDING' && state !== 'ENROLLED') || !recoveryReturn) return;
    if (newPassword.length < 12 || newPassword !== confirmPassword) {
      setMessage('Use at least 12 characters, and enter the same password twice.');
      return;
    }
    setBusy(true);
    let updateError = true;
    try {
      const { error } = await client.auth.updateUser({ password: newPassword });
      updateError = Boolean(error);
    } catch { /* An unconfirmed password change must fail closed. */ }
    finally { setNewPassword(''); setConfirmPassword(''); }
    if (updateError) {
      setBusy(false);
      setMessage('Password update failed. No change was confirmed. Request a fresh recovery email and retry.');
      return;
    }
    clearRecoveryMarker();
    setRecoveryReturn(false);
    await signOut('Password updated. Sign in again with your new password.');
    setBusy(false);
  }

  async function beginTotpEnrollment() {
    if (!client || busy || mfa?.kind !== 'ENROLL' || !identity) return;
    setBusy(true);
    let data: Awaited<ReturnType<typeof client.auth.mfa.enroll>>['data'] = null;
    let error = true;
    try {
      const response = await client.auth.mfa.enroll({
        factorType: 'totp', friendlyName: `Rosevear Creations ${identity.ownerRole} owner`
      });
      data = response.data;
      error = Boolean(response.error);
    } catch { /* Keep the setup secret and member state locked. */ }
    finally { setBusy(false); }
    if (error || !data?.id || !data.totp?.secret) {
      setMessage('Authenticator setup could not start. Access remains limited. Please retry.');
      return;
    }
    setSetup({ factorId: data.id, qr: safeTotpQrSource(data.totp.qr_code), secret: data.totp.secret });
    setMfaCode('');
    setMessage('Add this account in your authenticator app, then enter its six-digit code.');
  }

  async function confirmTotp(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const factorId = setup?.factorId ?? (mfa?.kind === 'CHALLENGE' ? mfa.factorId : null);
    if (!client || busy || !identity || !factorId) return;
    if (!isValidTotpCode(mfaCode)) {
      setMessage('Enter the six digits displayed in your authenticator app.');
      return;
    }
    setBusy(true);
    let error = true;
    try {
      const response = await client.auth.mfa.challengeAndVerify({ factorId, code: mfaCode.trim() });
      error = Boolean(response.error);
    } catch { /* An unverified code is not a verified AAL2 session. */ }
    finally { setMfaCode(''); setBusy(false); }
    if (error) {
      setMessage('The authenticator code was not accepted. Check the current code and retry.');
      return;
    }
    setSetup(null);
    await verify(); // Recheck AAL2 after a successful challenge; no enrollment writes.
  }

  async function signOut(note = 'Signed out.') {
    if (!client) return;
    ++requestId.current;
    setState('CHECKING');
    setVerification(null);
    setMfa(null);
    setSetup(null);
    setMfaCode('');
    setEnrollmentIntentSha('');
    setOwnerMfaAttestedUntil('');
    setSignedPacketFile(null);
    setSourceCandidateFile(null);
    setMasterCandidateFile(null);
    setProgressRefresh(0);
    setCeremonyReset(x=>x+1);
    let error = true;
    try {
      const response = await client.auth.signOut();
      error = Boolean(response.error);
    } catch { /* Treat uncertain sign-out as locked, never success. */ }
    if (error) {
      setState('ERROR');
      setMessage('Sign-out could not be confirmed. Access remains locked. Close the browser and try again.');
      return;
    }
    clearRecoveryMarker();
    setRecoveryReturn(false);
    setRecoveryRequest(false);
    setEmail('');
    setPassword('');
    setState('SIGNED_OUT');
    setMessage(note);
  }

  async function attestMfaForIntent(event:FormEvent<HTMLFormElement>){
    event.preventDefault();
    if(!client||busy||!identity||mfa?.kind!=='VERIFIED'||state!=='PENDING')return;
    const intent=enrollmentIntentSha.trim().toLowerCase();
    if(!QL369_SHA256.test(intent)){
      setMessage('Enter the exact SHA-256 printed by Ree’s original-device enrollment intent.');
      return;
    }
    setBusy(true);
    const result=await attestOwnerMfa(client as unknown as OwnerCeremonyGateway,intent);
    setBusy(false);
    if(result.ok&&!result.activated){
      setOwnerMfaAttestedUntil(result.expiresAt??'');
      setMessage('This account’s MFA session was confirmed by the server. The other original owner must independently attest the same intent within 30 minutes.');
    }else setMessage('The server did not confirm the MFA attestation. No owner membership changed.');
    setProgressRefresh(x=>x+1);
  }

  async function activateSignedEnrollment(event:FormEvent<HTMLFormElement>){
    event.preventDefault();
    if(!client||busy||identity?.ownerRole!=='source'||mfa?.kind!=='VERIFIED'||state!=='PENDING')return;
    if(!window.confirm('Ree: send the QL-369 packet with TWO explicit original activation decisions and pinned public candidates to the private verification endpoint? This may activate the two owner memberships only, never any application connection.'))return;
    setBusy(true);
    const result=await activateDualOwnerFromFiles(client as unknown as OwnerCeremonyGateway,
      signedPacketFile,sourceCandidateFile,masterCandidateFile);
    setBusy(false);
    setSignedPacketFile(null);setSourceCandidateFile(null);setMasterCandidateFile(null);
    setCeremonyReset(x=>x+1);
    setProgressRefresh(x=>x+1);
    if(result.ok&&result.activated){
      setMessage('Server confirmed both original signatures and current MFA sessions. Rechecking the two memberships…');
      await verify(); // RLS self-read verifies the committed result; no client grants.
    }else setMessage('The server did not activate the memberships. Check both fresh MFA attestations, the original signed packet, and its 24-hour expiry. All six applications remain on HOLD.');
  }

  const identity = verification && 'identity' in verification ? verification.identity : null;
  const authenticatedOwner = Boolean(identity && (state === 'PENDING' || state === 'ENROLLED'));
  return (
    <main className="ql367-screen">
      <section className="ql367-card" aria-label="Rosevear Creations master owner sign-in">
        <div className="ql367-topline"><span>ROSEVEAR CREATIONS</span><a href="#/">← Public preview</a></div>
        <p className="ql367-overline">Rosevear Comms Hub · QL-370</p>
        <h1>Master Owner Portal</h1>
        <p>Personal authentication and two-owner enrollment readiness for Ree and Jack. Rosevear Creations is the organization, not a shared user account.</p>

        {!config.ready && <div className="ql367-notice" role="alert">{config.reason} All access remains disabled.</div>}
        {config.ready && state === 'CHECKING' && <div role="status" className="ql367-notice">Checking for a saved sign-in session…</div>}
        {config.ready && state === 'SIGNED_OUT' && recoveryReturn &&
          <p role="alert" className="ql367-notice">The recovery link has not established a verified owner session. If it expired, request a new email below.</p>}

        {config.ready && state === 'SIGNED_OUT' && !recoveryRequest && (
          <form onSubmit={signIn} className="ql367-form">
            <label htmlFor="ql367-email">Owner email address</label>
            <input id="ql367-email" type="email" name="email" autoComplete="username" required value={email}
              onChange={e => setEmail(e.target.value)} disabled={busy} />
            <label htmlFor="ql367-password">Password</label>
            <input id="ql367-password" type="password" name="password" autoComplete="current-password" required
              value={password} onChange={e => setPassword(e.target.value)} disabled={busy} />
            <button type="submit" disabled={busy}>{busy ? 'Signing in…' : 'Sign in securely'}</button>
            <button className="ql368-link-button" type="button" disabled={busy} onClick={() => { setRecoveryRequest(true); setMessage(''); }}>
              Forgot password? Secure recovery
            </button>
          </form>
        )}

        {config.ready && state === 'SIGNED_OUT' && recoveryRequest && (
          <form onSubmit={requestPasswordRecovery} className="ql367-form" aria-label="Request secure account recovery">
            <h2>Recover owner password</h2>
            <p>An email recovery link is required. We never send or display passwords.</p>
            <label htmlFor="ql368-recovery-email">Account email address</label>
            <input id="ql368-recovery-email" type="email" autoComplete="email" required value={email}
              onChange={e => setEmail(e.target.value)} disabled={busy} />
            <button type="submit" disabled={busy}>Request recovery email</button>
            <button className="ql368-link-button" type="button" onClick={() => setRecoveryRequest(false)}>Back to sign-in</button>
          </form>
        )}

        {config.ready && authenticatedOwner && identity && (
          <section className="ql367-identity" aria-label="Verified owner identity" role="status">
            <h2>Authenticated: {identity.ownerRole === 'source' ? 'Ree' : 'Jack'}</h2>
            <p><strong>Account:</strong> {identity.email}</p>
            <p><strong>Organization:</strong> Rosevear Creations</p>
            <p><strong>Owner role:</strong> {identity.ownerRole}</p>
            <p><strong>Enrollment:</strong> {state === 'ENROLLED' ? 'Verified owner record' : 'Pending original-owner approval'}</p>
            <p>All six application connections remain <strong>DISCONNECTED / HOLD</strong>. No customer data or source operations have been enabled.</p>
          </section>
        )}

        {config.ready && authenticatedOwner && recoveryReturn && (
          <form className="ql367-form ql368-security" onSubmit={completePasswordRecovery} aria-label="Complete password recovery">
            <h2>Set a new password</h2>
            <label htmlFor="ql368-new-password">New password (12 or more characters)</label>
            <input id="ql368-new-password" type="password" minLength={12} autoComplete="new-password" required value={newPassword}
              onChange={e => setNewPassword(e.target.value)} disabled={busy} />
            <label htmlFor="ql368-confirm-password">Confirm new password</label>
            <input id="ql368-confirm-password" type="password" minLength={12} autoComplete="new-password" required value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)} disabled={busy} />
            <button type="submit" disabled={busy}>Update password and sign out</button>
          </form>
        )}

        {config.ready && authenticatedOwner && !recoveryReturn && (
          <section className="ql368-security" aria-label="Multi-factor authentication">
            <h2>Account protection</h2>
            {!mfa && <p role="status">Checking authenticator status…</p>}
            {mfa?.kind === 'ERROR' && <p role="alert">{mfa.message}</p>}
            {mfa?.kind === 'VERIFIED' && <p className="ql368-good" role="status">MFA verified (AAL2). This does not activate enrollment.</p>}
            {mfa?.kind === 'ENROLL' && !setup && <>
              <p>{mfa.message}</p>
              <button type="button" disabled={busy} onClick={() => { void beginTotpEnrollment(); }}>Set up authenticator</button>
            </>}
            {setup && <div className="ql368-totp-setup">
              <p>Keep this authenticator secret private. Use the QR code or enter the key manually in your authenticator app.</p>
              {setup.qr && <img className="ql368-qr" src={setup.qr} alt="Authenticator setup QR code" />}
              <p><strong>Manual setup key:</strong> <code>{setup.secret}</code></p>
            </div>}
            {(setup || mfa?.kind === 'CHALLENGE') && <form className="ql367-form" onSubmit={confirmTotp}>
              <label htmlFor="ql368-totp-code">Six-digit authenticator code</label>
              <input id="ql368-totp-code" inputMode="numeric" pattern="[0-9]{6}" maxLength={6} autoComplete="one-time-code"
                required value={mfaCode} onChange={e => setMfaCode(e.target.value)} disabled={busy} />
              <button type="submit" disabled={busy}>Verify authenticator code</button>
            </form>}
          </section>
        )}

        {config.ready && authenticatedOwner && !recoveryReturn && <section className="ql368-security" aria-label="Dual-owner enrollment readiness">
          <h2>Dual-owner enrollment</h2>
          <ol className="ql368-steps">
            <li>Individual Supabase identity: <strong>verified</strong>.</li>
            <li>Current session MFA: <strong>{mfa?.kind === 'VERIFIED' ? 'verified' : 'required'}</strong>.</li>
            <li>Ree’s original-device signature: <strong>independent approval required</strong>.</li>
            <li>Jack’s original-device signature: <strong>independent approval required</strong>.</li>
            <li>Signed owner membership: <strong>{state === 'ENROLLED' ? 'owner record verified; application HOLD remains' : 'pending / inactive'}</strong>.</li>
          </ol>
          <p className="ql368-help">MFA never signs for the other owner, activates membership or releases a source connection. Only the original-device, dual-signature approval process can satisfy those steps.</p>
        </section>}

        {config.ready && authenticatedOwner && identity && !recoveryReturn && (
          <OwnerProgressDashboard
            gateway={client as unknown as OwnerCeremonyGateway}
            ownerRole={identity.ownerRole}
            mfaVerified={mfa?.kind==='VERIFIED'}
            intentSha256={enrollmentIntentSha}
            refreshSequence={progressRefresh}
            onClearLocal={()=>{
              setEnrollmentIntentSha('');
              setOwnerMfaAttestedUntil('');
              setSignedPacketFile(null);
              setSourceCandidateFile(null);
              setMasterCandidateFile(null);
              setCeremonyReset(x=>x+1);
              setMessage('Only this browser’s ceremony inputs were cleared. The server did not revoke any enrollment evidence or activate membership.');
            }}
          />
        )}

        {config.ready && authenticatedOwner && !recoveryReturn && state==='PENDING' && (
          <section className="ql368-security" aria-label="QL-369 verified owner enrollment ceremony">
            <h2>Verified owner enrollment ceremony</h2>
            <p>Ree first creates the offline 24-hour enrollment intent on Ree’s original computer and shares its SHA-256 with Jack. Each owner signs in on their own computer, completes MFA, and submits the <strong>same</strong> intent hash here. This is not approval of any source connection.</p>
            <form className="ql367-form" onSubmit={attestMfaForIntent}>
              <label htmlFor="ql369-intent-sha">Original enrollment intent SHA-256</label>
              <input id="ql369-intent-sha" type="text" spellCheck={false} autoComplete="off" maxLength={64}
                pattern="[a-fA-F0-9]{64}" required value={enrollmentIntentSha}
                onChange={e=>setEnrollmentIntentSha(e.target.value)} disabled={busy} />
              <button disabled={busy||mfa?.kind!=='VERIFIED'} type="submit">Verify my current MFA session with the server</button>
            </form>
            {mfa?.kind!=='VERIFIED'&&<p role="status">An authenticator-verified AAL2 session is required before this button becomes available.</p>}
            {ownerMfaAttestedUntil&&<p className="ql368-good" role="status">Server attestation recorded; expires {ownerMfaAttestedUntil}. A new intent or expired session requires fresh attestation.</p>}
            {identity?.ownerRole==='source'&&<form key={ceremonyReset} className="ql367-form" onSubmit={activateSignedEnrollment}>
              <h3>Final original-signature review — Ree only</h3>
              <p>After both MFA attestations, the QL-368 evidence-only signatures, and TWO new explicit QL-369 original-device activation signatures, choose these THREE JSON files. Nothing is sent until we press the explicit activation button and confirm.</p>
              <label htmlFor="ql369-signed">QL-369 signed activation packet (contains reviewed QL-368 evidence)</label>
              <input id="ql369-signed" type="file" accept=".json,application/json" required
                onChange={e=>setSignedPacketFile(e.target.files?.[0]??null)} disabled={busy} />
              <label htmlFor="ql369-source-public">Ree’s original public candidate</label>
              <input id="ql369-source-public" type="file" accept=".json,application/json" required
                onChange={e=>setSourceCandidateFile(e.target.files?.[0]??null)} disabled={busy} />
              <label htmlFor="ql369-master-public">Jack’s original public candidate</label>
              <input id="ql369-master-public" type="file" accept=".json,application/json" required
                onChange={e=>setMasterCandidateFile(e.target.files?.[0]??null)} disabled={busy} />
              <button type="submit" disabled={busy||mfa?.kind!=='VERIFIED'||!signedPacketFile||!sourceCandidateFile||!masterCandidateFile}>
                Review and activate TWO owner memberships once
              </button>
            </form>}
            <p className="ql368-help">The server must recheck both genuine AAL2 sessions, both independently signed original keys, the exact Auth UUIDs, and the unused intent. Replayed, expired or incomplete evidence is denied. Every application connection stays DISCONNECTED / HOLD.</p>
          </section>
        )}

        {config.ready && message && state !== 'CHECKING' &&
          <p className="ql367-notice" role={state === 'ERROR' || state === 'DENIED' ? 'alert' : 'status'}>{message}</p>}

        {config.ready && state !== 'SIGNED_OUT' && state !== 'CHECKING' &&
          <button className="ql367-signout" type="button" onClick={() => { void signOut(); }}>Sign out</button>}

        <footer>Identity, MFA and independently signed enrollment are separate security gates. Every application remains DISCONNECTED / HOLD until explicitly approved.</footer>
      </section>
    </main>
  );
}

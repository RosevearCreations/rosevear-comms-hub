import { useState, type Dispatch, type SetStateAction, type FormEvent } from 'react';
import type { OperatorOrganization, OperatorWorkspace } from './ql191Organizations';
import type { Ql239Ledger } from './ql239GatewayProofReview';
import type { Ql240Ledger } from './ql240PilotDecision';
import type { Ql241Ledger } from './ql241ExternalProofReadiness';
import { QL181_PREREQUISITES } from './ql181PrivacyPilotGate';
import {
  QL242_RELEASE, type Ql242Ledger, ql242Portfolio, ql242CurrentStatus,
  recordQl242Report, advanceQl242Rehearsal, resetQl242Company
} from './ql242OwnerSignedRollout';
import './ql242-owner-signed-rollout.css';

export function Ql242OwnerSignedRollout({ organization, source, audit, external, ledger, setLedger, onNavigate }: {
  organization: OperatorOrganization;
  source: Ql239Ledger;
  audit: Ql240Ledger;
  external: Ql241Ledger;
  ledger: Ql242Ledger;
  setLedger: Dispatch<SetStateAction<Ql242Ledger>>;
  onNavigate: (workspace: OperatorWorkspace) => void;
}) {
  const [help, setHelp] = useState(false);
  const [holds, setHolds] = useState(false);
  const [json, setJson] = useState('');
  const [reviewer, setReviewer] = useState('');
  const [message, setMessage] = useState('');
  const company = organization.id;
  const entry = ledger[company];
  const status = ql242CurrentStatus(entry, company, source, audit, external);
  const prepared = entry?.stage === 'REVIEW_PREPARED_HELD' && status !== 'SOURCE_DRIFT_HELD';
  const canPrepare = company === 'devilndove' &&
    status === 'SIGNED_REFERENCES_CLAIMED_UNATTESTED_HELD' && entry?.stage === 'NOT_PREPARED';

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      if (json.length > 8192) throw new Error('oversized');
      const parsed = JSON.parse(json);
      setLedger((old) => recordQl242Report(old, parsed, company, source, audit, external));
      setMessage('Only restricted audit/owner reference fields were inspected. This pasted report is NOT an independent identity or authorization attestation.');
    } catch {
      setMessage('Invalid or oversized JSON. Only use sanitized QL-242 CLI output without --rehearse-and-rollback. Never paste signing keys, credentials or customer information.');
    }
    setJson('');
  }

  function advance(action: 'prepare' | 'simulate' | 'rollback') {
    setLedger((old) => advanceQl242Rehearsal(old, company, action, reviewer.trim(), source, audit, external));
  }

  function reset() {
    setLedger((old) => resetQl242Company(old, company));
    setJson(''); setReviewer(''); setMessage('This company’s QL-242 local rehearsal was reset. No real server was changed.');
  }

  return <section className="ql242-screen" data-ql242-release={QL242_RELEASE} data-company={company} aria-labelledby="ql242-title">
    <header className="ql242-header"><div><p className="ql191-eyebrow">QL-242 · Independent audit and reversible rollout · DISABLED PREVIEW</p>
      <h3 id="ql242-title">Gateway audit, owner decision receipt &amp; reversible rehearsal</h3>
      <p>Reconcile two separately pinned signatures, prepare a hypothetical read-only state and prove the local rollback path.</p>
    </div><button type="button" aria-expanded={help} aria-controls="ql242-help" onClick={() => setHelp((open) => !open)}>ⓘ Audit &amp; rollback help</button></header>

    <p className="ql242-warning" role="note"><strong>ACTUAL CONNECTION: DISCONNECTED. ALL 12 REAL PILOT HOLDS REMAIN.</strong> Signed sample documents and this screen cannot prove real owner identity, independently stored gateway records, consent or deployment authority. No calls, SMS, provider dispatch, backend writes, Etsy changes or real pilot release.</p>
    {help && <div className="ql242-help" id="ql242-help">
      <p>Obtain a gateway audit packet and a separate owner-decision <em>review request</em> from independently trusted sources, each with an Ed25519 public-key fingerprint through a different trusted channel. The offline command <code>node scripts/ql242-verify-audit-owner.mjs --packet ./local-nonsecret-signed-packet.json --gateway-pin-sha256 &lt;gateway-hash&gt; --owner-pin-sha256 &lt;owner-hash&gt;</code> compares signatures and receipt IDs. For a Node-only rehearsal, add <code>--rehearse-and-rollback</code>; for browser intake omit that flag.</p>
      <p>The CLI is offline, browser checks are unverified claims, and the actual owner must separately authorize any future server-held read-only pilot. Do not provide private signing keys, tokens, customer records or live messaging content.</p>
    </div>}

    <section className="ql242-panel" aria-labelledby="ql242-matrix"><h4 id="ql242-matrix">Four-company decision and rollback watch</h4>
      <div className="ql242-scroll"><table><caption>Every company is disconnected; only Devil n Dove may rehearse a session-local read-only state.</caption>
        <thead><tr><th scope="col">Business</th><th scope="col">Audit / owner evidence</th><th scope="col">Rehearsal</th><th scope="col">Real connection</th><th scope="col">Actual release holds</th></tr></thead>
        <tbody>{ql242Portfolio(ledger, source, audit, external).map((item) => <tr key={item.company}>
          <th scope="row">{item.company === 'devilndove' ? 'Devil n Dove' : item.company === 'rosiedazzlers' ? 'Rosie Dazzlers' : item.company === 'icamp' ? 'iCamp' : 'Yard Workers'}</th>
          <td>{item.status}</td><td>{item.stage}</td><td><strong>{item.actualConnection}</strong></td>
          <td><strong>{item.realPilotHolds}/12 HELD</strong></td></tr>)}</tbody>
      </table></div>
    </section>

    <section className="ql242-panel" aria-labelledby="ql242-proof"><h4 id="ql242-proof">{organization.name} · Audit-to-owner signature comparison intake</h4>
      <p>QL-241 report: <strong>{external[company]?.status ?? 'NOT RECEIVED'}</strong> · Owner review request: <strong>{external[company]?.request ?? 'NONE'}</strong>.</p>
      <div className="ql242-meta"><span>Source commit: <strong>{source[company]?.proof?.sourceRevision ?? 'MISSING'}</strong></span>
        <span>Gateway audit ID: <strong>{audit[company]?.claim?.gatewayAuditId ?? 'MISSING'}</strong></span>
        <span>Health receipt: <strong>{external[company]?.report?.healthReceiptId ?? 'MISSING'}</strong></span>
        <span>Capabilities receipt: <strong>{external[company]?.report?.capabilitiesReceiptId ?? 'MISSING'}</strong></span></div>
      <button type="button" onClick={() => onNavigate('external_proof_readiness')}>Open QL-241 gateway GET evidence</button>
      <form onSubmit={submit} className="ql242-form"><label htmlFor="ql242-report">Sanitized QL-242 CLI result (no real signatures, full packet or private keys)
        <textarea id="ql242-report" rows={5} required maxLength={8192} value={json}
          onChange={(event) => setJson(event.target.value)} placeholder="Paste the small, no-rehearsal QL-242 JSON result" /></label>
        <button type="submit" disabled={company !== 'devilndove'}>Reconcile signed receipt references · HELD</button></form>
      {message && <p role="status" className="ql242-message">{message}</p>}
      <div className="ql242-result" role="status" aria-live="polite"><strong>{status}</strong>
        <p>{status === 'SOURCE_DRIFT_HELD' ? 'Frozen: upstream source, gateway audit, signature fingerprint or receipts changed.' : entry?.reason ?? 'No independently witnessed gateway audit and owner-decision proof has been received.'}</p>
        <p>Reported gateway public key: <strong>{status === 'SIGNED_REFERENCES_CLAIMED_UNATTESTED_HELD' ? entry?.reference?.gatewayKeyFingerprint : 'NOT ACCEPTED'}</strong></p>
        <p>Reported owner public key: <strong>{status === 'SIGNED_REFERENCES_CLAIMED_UNATTESTED_HELD' ? entry?.reference?.ownerKeyFingerprint : 'NOT ACCEPTED'}</strong></p>
        <p>Real owner authorization: NO · Independently confirmed identities: NO · Actual connection: DISCONNECTED.</p></div>
    </section>

    <section className="ql242-panel" aria-labelledby="ql242-rehearsal"><h4 id="ql242-rehearsal">Devil n Dove · reversible read-only rollout rehearsal</h4>
      <p>Scope is only <code>read_product_reference</code> and <code>read_listing_reference</code>. No Etsy draft writes, photo changes, sales, customer messages or provider actions. These controls change <strong>session-local simulation state only</strong>.</p>
      <div className="ql242-actions"><label>Additional independent reviewer alias
        <input value={reviewer} maxLength={32} onChange={(event) => setReviewer(event.target.value)} placeholder="rollout_reviewer_6" /></label>
        <button type="button" disabled={!canPrepare || !reviewer.trim()} onClick={() => advance('prepare')}>Prepare held rollout review</button>
        <button type="button" disabled={!prepared} onClick={() => advance('simulate')}>Simulate read-only scope · NO CONNECT</button>
        <button type="button" disabled={entry?.stage !== 'SIMULATED_READ_ONLY_HELD'} onClick={() => advance('rollback')}>Roll back simulation</button>
        <button type="button" onClick={reset}>Reset company rehearsal</button></div>
      <div className="ql242-result"><strong>{status === 'SOURCE_DRIFT_HELD' ? 'FROZEN_HELD' : entry?.stage ?? 'NOT_PREPARED'}</strong>
        <p>Reviewer: {entry?.separateReviewerAlias ?? 'NOT RECORDED'} · Rollback receipt reference: {entry?.reference?.rollbackReceiptId ?? 'MISSING'}</p>
        <p>Server writes: 0 · SMS: 0 · Calls: 0 · Dispatch: 0 · Real rollout: NOT AUTHORIZED.</p></div>
      <button type="button" aria-expanded={holds} aria-controls="ql242-holds" onClick={() => setHolds((open) => !open)}>{holds ? 'Hide' : 'Show'} QL-181 release prerequisites</button>
      {holds && <ol id="ql242-holds">{QL181_PREREQUISITES.map((item) => <li key={item.id}>{item.title}: <strong>{item.state}</strong></li>)}</ol>}
    </section>
  </section>;
}

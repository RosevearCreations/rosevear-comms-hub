import { useState, type Dispatch, type FormEvent, type SetStateAction } from 'react';
import type { OperatorOrganization, OperatorWorkspace } from './ql191Organizations';
import { QL181_PREREQUISITES } from './ql181PrivacyPilotGate';
import type { Ql239Ledger } from './ql239GatewayProofReview';
import {
  QL240_RELEASE, QL240_CHECKS, type Ql240Check, type Ql240Ledger,
  ql240EligibleSource, ql240CurrentStatus, ql240Portfolio,
  recordQl240Claim, independentlyReviewQl240, decideQl240HeldPilot, resetQl240Company
} from './ql240PilotDecision';
import './ql240-pilot-decision.css';

const checkDescriptions: Record<Ql240Check, string> = {
  sourceCommitIndependentlyChecked: 'Source commit and run link independently inspected',
  healthSignatureIndependentlyChecked: 'Held health receipt signature checked against a trusted public key',
  capabilitiesSignatureIndependentlyChecked: 'Held capabilities receipt signature checked',
  gatewayIssuerPinned: 'AI Data Platform gateway issuer and key ID pinned out of band',
  businessAndTenantDeniedCrossScope: 'Foreign business, company and campground tenants denied',
  revokedPreviousKeyRejected: 'Old key rejected after rotation / revocation',
  replayAndExpiryDenied: 'Replayed and stale receipts rejected',
  immutableGatewayAuditReceiptChecked: 'Gateway audit record traced to both receipt IDs',
  readOnlyNoDispatchVerified: 'Read-only allowlist, no database writes, no calls, SMS or dispatch'
};
const emptyChecks = () => Object.fromEntries(QL240_CHECKS.map((name) => [name, false])) as Record<Ql240Check, boolean>;

export function Ql240PilotDecision({ organization, sourceLedger, ledger, setLedger, onNavigate }: {
  organization: OperatorOrganization;
  sourceLedger: Ql239Ledger;
  ledger: Ql240Ledger;
  setLedger: Dispatch<SetStateAction<Ql240Ledger>>;
  onNavigate: (workspace: OperatorWorkspace) => void;
}) {
  const [helpOpen, setHelpOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [gatewayAuditId, setGatewayAuditId] = useState('');
  const [currentKeyId, setCurrentKeyId] = useState('');
  const [revokedKeyId, setRevokedKeyId] = useState('');
  const [inspectorAlias, setInspectorAlias] = useState('');
  const [reviewerAlias, setReviewerAlias] = useState('');
  const [checks, setChecks] = useState<Record<Ql240Check, boolean>>(emptyChecks);
  const [message, setMessage] = useState('');
  const source = sourceLedger[organization.id];
  const entry = ledger[organization.id];
  const eligible = ql240EligibleSource(source);
  const actualStatus = ql240CurrentStatus(entry, source);
  const candidates = ql240Portfolio(ledger, sourceLedger);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const proof = source?.proof;
    if (!proof) { setMessage('Source claim not present: request a QL-239 handoff first.'); return; }
    const candidate = {
      company: organization.id,
      sourceEvidenceId: proof.evidenceId,
      healthReceiptId: proof.healthReceiptId,
      capabilitiesReceiptId: proof.capabilitiesReceiptId,
      gatewayAuditId: gatewayAuditId.trim(), currentKeyId: currentKeyId.trim(),
      revokedKeyId: revokedKeyId.trim(), inspectorAlias: inspectorAlias.trim(),
      observedAt: new Date().toISOString(), checks: { ...checks }
    };
    setLedger((prior) => recordQl240Claim(prior, sourceLedger, organization.id, candidate));
    setMessage('Reference reconciliation attempted locally. A passing form cannot verify live server keys or deployed responses.');
  }

  function reset() {
    setLedger((prior) => resetQl240Company(prior, organization.id));
    setChecks(emptyChecks()); setGatewayAuditId(''); setCurrentKeyId('');
    setRevokedKeyId(''); setInspectorAlias(''); setReviewerAlias('');
    setMessage('Cleared this company’s QL-240 local evidence only.');
  }

  return <section className="ql240-screen" data-ql240-release={QL240_RELEASE} data-company={organization.id} aria-labelledby="ql240-title">
    <header className="ql240-header"><div><p className="ql191-eyebrow">QL-240 · Nonproduction receipt verification gate · Disabled preview</p>
      <h3 id="ql240-title">Independent gateway receipt review & owner-safe pilot decision</h3>
      <p>Reconcile health/capability receipt references, tenant boundaries and rotation evidence. Keep every decision HELD.</p>
    </div><button type="button" aria-expanded={helpOpen} aria-controls="ql240-help" onClick={() => setHelpOpen((open) => !open)}>ⓘ Verification help</button></header>
    <p className="ql240-warning" role="note"><strong>ALL REAL GATEWAY CONNECTIONS DISCONNECTED.</strong> The browser cannot verify genuine signatures, CI runs, reviewer identities, pinned keys or gateway audit storage. The QL-240 Node-only verifier validates isolated Ed25519 test receipts with ephemeral keys; it is not a deployed connection. No live calls, SMS, customer transfers, provider dispatch or actual owner approvals. All 12 QL-181 live-pilot holds remain.</p>
    {helpOpen && <div className="ql240-help" id="ql240-help">The independent reviewer must inspect each application’s actual GitHub source/run, pin gateway public keys from a trusted separate channel, verify the signed nonproduction health and capabilities receipts, confirm exact business/tenant and revoked key, and match a durable gateway audit record. Our form records only these <strong>unverified claims</strong>; it never fetches or authenticates their sources. Don’t paste cryptographic key material, tokens, customer information, full request/response bodies or phone messages.</div>}
    <section className="ql240-panel" aria-labelledby="ql240-matrix-title"><h4 id="ql240-matrix-title">Four-company receipt decision matrix</h4>
      <div className="ql240-table-scroll"><table><caption>All status labels are local planning drafts. No external connection is verified.</caption>
        <thead><tr><th scope="col">Business</th><th scope="col">Claim review</th><th scope="col">Independent check</th><th scope="col">Pilot decision</th><th scope="col">Actual state</th><th scope="col">Live holds</th></tr></thead>
        <tbody>{candidates.map((item) => <tr key={item.company}><th scope="row">{item.company === 'devilndove' ? 'Devil n Dove' : item.company === 'rosiedazzlers' ? 'Rosie Dazzlers' : item.company === 'icamp' ? 'iCamp' : 'Yard Workers'}</th>
          <td>{item.reconciliation}</td><td>{item.independent}</td><td>{item.decision}</td><td><strong>{item.actualConnection}</strong></td><td><strong>{item.pilotHolds}/12 HELD</strong></td></tr>)}</tbody>
      </table></div>
    </section>
    <section className="ql240-panel" aria-labelledby="ql240-source-title"><h4 id="ql240-source-title">{organization.name} · Source-to-receipt reconciliation</h4>
      <p>QL-239 external proof handoff: <strong>{eligible ? 'CLAIMED / UNVERIFIED' : 'MISSING OR DEMO ONLY'}</strong>. Fictional sample evidence never satisfies this gate.</p>
      <div className="ql240-meta"><span>Source evidence ID: <strong>{source?.proof?.evidenceId ?? 'NOT RECEIVED'}</strong></span>
        <span>Health receipt: <strong>{source?.proof?.healthReceiptId ?? 'NOT RECEIVED'}</strong></span>
        <span>Capabilities receipt: <strong>{source?.proof?.capabilitiesReceiptId ?? 'NOT RECEIVED'}</strong></span></div>
      <button type="button" onClick={() => onNavigate('gateway_proof_review')}>Open QL-239 proof intake</button>
      <form className="ql240-form" onSubmit={submit}>
        <div className="ql240-fields"><label>Gateway audit receipt ID <small>Non-personal opaque identifier</small>
          <input required value={gatewayAuditId} onChange={(event) => setGatewayAuditId(event.target.value)} maxLength={64} placeholder="audit-receipt-001" /></label>
          <label>Current pinned nonproduction key ID <small>Example: np-app-current-001 (no secret)</small>
            <input required value={currentKeyId} onChange={(event) => setCurrentKeyId(event.target.value)} maxLength={64} placeholder="np-app-current-001" /></label>
          <label>Previously revoked key ID
            <input required value={revokedKeyId} onChange={(event) => setRevokedKeyId(event.target.value)} maxLength={64} placeholder="np-app-old-001" /></label>
          <label>Independent inspector alias <small>Different from QL-239 submitter and reviewer</small>
            <input required value={inspectorAlias} onChange={(event) => setInspectorAlias(event.target.value)} maxLength={32} placeholder="inspector_team_3" /></label></div>
        <fieldset className="ql240-checks"><legend>Independent evidence checks claimed by the application team</legend>
          {QL240_CHECKS.map((check) => <label key={check}><input type="checkbox" checked={checks[check]}
            onChange={(event) => setChecks((prior) => ({ ...prior, [check]: event.target.checked }))} />{checkDescriptions[check]}</label>)}</fieldset>
        <button type="submit" disabled={!eligible}>Reconcile source claims · remain HELD</button>
      </form>
      {message && <p className="ql240-message" role="status">{message}</p>}
      <div className="ql240-result" role="status" aria-live="polite"><strong>{actualStatus}</strong><p>{entry?.reason ?? 'Awaiting independently sourced, nonproduction gateway and business application receipts.'}</p>
        <p>Real signature verification: NO · Actual connection: DISCONNECTED · Owner approval: NO.</p></div>
    </section>
    <section className="ql240-panel" aria-labelledby="ql240-decision-title"><h4 id="ql240-decision-title">Independent second review & pilot decision · no release authority</h4>
      <p>Another reviewer can prepare a local audit note only. A read-only pilot candidate is available only for Devil n Dove and remains HELD until genuine external verification and separate owner authorization.</p>
      <div className="ql240-actions"><label>Separate reviewer alias
          <input value={reviewerAlias} onChange={(event) => setReviewerAlias(event.target.value)} maxLength={32} placeholder="reviewer_team_4" /></label>
        <button type="button" disabled={actualStatus !== 'NONPRODUCTION_CLAIMS_RECONCILED_HELD' || !reviewerAlias.trim()}
          onClick={() => setLedger((prior) => independentlyReviewQl240(prior, sourceLedger, organization.id, reviewerAlias.trim()))}>Prepare separate review · HELD</button>
        <button type="button" disabled={entry?.independentReview !== 'SEPARATE_REVIEW_DRAFT_HELD' || actualStatus !== 'NONPRODUCTION_CLAIMS_RECONCILED_HELD'}
          onClick={() => setLedger((prior) => decideQl240HeldPilot(prior, sourceLedger, organization.id, 'REQUEST_REAL_VERIFICATION_HELD'))}>Request genuine proof · HELD</button>
        <button type="button" disabled={organization.id !== 'devilndove' || entry?.independentReview !== 'SEPARATE_REVIEW_DRAFT_HELD' || actualStatus !== 'NONPRODUCTION_CLAIMS_RECONCILED_HELD'}
          onClick={() => setLedger((prior) => decideQl240HeldPilot(prior, sourceLedger, organization.id, 'READ_ONLY_CANDIDATE_HELD'))}>Mark future read-only candidate · HELD</button>
        <button type="button" onClick={reset}>Reset this company’s QL-240 draft</button></div>
      <div className="ql240-result"><strong>{actualStatus === 'SOURCE_DRIFT_HELD' ? 'HOLD · SOURCE CHANGED' : entry?.decision ?? 'HOLD'}</strong>
        <p>Separate review: {entry?.independentReview ?? 'NOT_REVIEWED'} · Alias: {entry?.independentReviewerAlias ?? 'NOT ASSIGNED'} · Twelve actual release prerequisites: HELD_UNVERIFIED.</p></div>
      <button type="button" aria-expanded={detailsOpen} aria-controls="ql240-holds" onClick={() => setDetailsOpen((open) => !open)}>{detailsOpen ? 'Hide' : 'Show'} twelve QL-181 release prerequisites</button>
      {detailsOpen && <ol id="ql240-holds">{QL181_PREREQUISITES.map((item) => <li key={item.id}><strong>{item.title}</strong> — {item.state}</li>)}</ol>}
      <p className="ql240-help">Next required outside this browser: real AI Data Platform nonproduction gateway receipts, independently pinned public keys, source run logs, tenant denial and rotation audit results, a verified owner-signed read-only scope decision, and reversible server rollout. QL-240 does not perform or authorize them.</p>
    </section>
  </section>;
}

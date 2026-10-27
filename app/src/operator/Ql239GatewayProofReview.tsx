import { useRef, useState, type Dispatch, type FormEvent, type SetStateAction } from 'react';
import type { OperatorOrganization, OperatorWorkspace } from './ql191Organizations';
import { QL181_PREREQUISITES } from './ql181PrivacyPilotGate';
import {
  QL239_RELEASE, QL239_CHECKS, type Ql239Check, type Ql239Ledger,
  ql239SyntheticProof, intakeQl239Proof, markQl239RotationChecklist,
  independentlyReviewQl239, resetQl239Company, ql239Portfolio
} from './ql239GatewayProofReview';
import './ql239-gateway-proof-review.css';

const labels: Record<Ql239Check, string> = {
  signedHealth: 'Health server signature claimed verified',
  signedCapabilities: 'Capabilities server signature claimed verified',
  wrongBusinessDenied: 'Cross-business rejected',
  wrongTenantDenied: 'Foreign company/campground tenant rejected',
  expiredDenied: 'Expired signature rejected',
  replayDenied: 'Replayed request rejected',
  revokedKeyDenied: 'Revoked key rejected',
  writeDenied: 'Write and dispatch commands rejected',
  rotationNewKeyHeld: 'New test key accepted only for held GET',
  oldKeyRejectedAfterRotation: 'Old test key rejected after rotation'
};
const blankChecks = (): Record<Ql239Check, boolean> => Object.fromEntries(
  QL239_CHECKS.map((check) => [check, false])
) as Record<Ql239Check, boolean>;

export function Ql239GatewayProofReview({ organization, ledger, setLedger, onNavigate }: {
  organization: OperatorOrganization;
  ledger: Ql239Ledger;
  setLedger: Dispatch<SetStateAction<Ql239Ledger>>;
  onNavigate: (workspace: OperatorWorkspace) => void;
}) {
  const [helpOpen, setHelpOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [sourceUrl, setSourceUrl] = useState('');
  const [revision, setRevision] = useState('');
  const [evidenceId, setEvidenceId] = useState('');
  const [healthReceiptId, setHealthReceiptId] = useState('');
  const [capabilitiesReceiptId, setCapabilitiesReceiptId] = useState('');
  const [evidenceCapturedAt, setEvidenceCapturedAt] = useState('');
  const [submitterAlias, setSubmitterAlias] = useState('');
  const [reviewerAlias, setReviewerAlias] = useState('');
  const [checks, setChecks] = useState<Record<Ql239Check, boolean>>(blankChecks);
  const [feedback, setFeedback] = useState('');
  const sampleSerial = useRef(0);
  const entry = ledger[organization.id];
  const portfolio = ql239Portfolio(ledger);

  function sample() {
    sampleSerial.current += 1;
    const now = new Date();
    const proof = {
      ...ql239SyntheticProof(organization.id, now),
      evidenceId: `demo-${organization.id}-${now.getTime()}-${sampleSerial.current}`
    };
    setLedger((prior) => intakeQl239Proof(prior, proof, organization.id, now));
    setFeedback('Demo sample recorded as HELD. This is not evidence from another application.');
  }

  function intakeExternal(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const now = new Date();
    const proof = {
      ...ql239SyntheticProof(organization.id, now),
      kind: 'EXTERNAL_CLAIM_UNVERIFIED' as const,
      evidenceId: evidenceId.trim(), sourceUrl: sourceUrl.trim(),
      sourceRevision: revision.trim(), submitterAlias: submitterAlias.trim(),
      healthReceiptId: healthReceiptId.trim(), capabilitiesReceiptId: capabilitiesReceiptId.trim(),
      capturedAt: evidenceCapturedAt.trim(),
      checks: { ...checks }
    };
    setLedger((prior) => intakeQl239Proof(prior, proof, organization.id, now));
    setFeedback('Source claim reviewed for form, scope and completeness only. No link was fetched or cryptographically verified.');
  }

  function reset() {
    setLedger((prior) => resetQl239Company(prior, organization.id));
    setChecks(blankChecks()); setSourceUrl(''); setRevision(''); setEvidenceId(''); setEvidenceCapturedAt('');
    setHealthReceiptId(''); setCapabilitiesReceiptId('');
    setSubmitterAlias(''); setReviewerAlias(''); setFeedback('Only this company’s session evidence was cleared.');
  }

  return <section className="ql239-screen" data-ql239-release={QL239_RELEASE} data-company={organization.id} aria-labelledby="ql239-title">
    <header className="ql239-header"><div>
      <p className="ql191-eyebrow">QL-239 · Contract v1 proof intake · Disabled preview</p>
      <h3 id="ql239-title">Read-only gateway proof & independent review</h3>
      <p>Log source references returned by each application, dry-run credential rotation and prepare an independent HELD review.</p>
    </div><button type="button" onClick={() => setHelpOpen((open) => !open)} aria-controls="ql239-help" aria-expanded={helpOpen}>ⓘ Proof intake help</button></header>
    <p className="ql239-warning" role="note"><strong>NO REAL INTEGRATION ACTIVE.</strong> All four applications remain DISCONNECTED here. This browser-only intake does not fetch URLs, verify remote signatures, store credentials, connect databases or send calls/SMS. Every review stays HELD; the twelve QL-181 pilot prerequisites remain unchanged.</p>
    {helpOpen && <div className="ql239-help" id="ql239-help"><p>When the other application provides build proof, record a GitHub source artifact, exact commit and a unique evidence ID. Check only the tests that application actually reports. A completed form is still an <strong>unverified claim</strong>. The independent reviewer must validate the referenced build, server responses, signing keys, negative tests and audit receipts outside this preview. Never paste actual keys, tokens, messages, names, customer data or API response bodies.</p><p>“Run credential rotation checklist” is a local status rehearsal. The separate Node-only test harness exercises invented ephemeral HMAC keys in CI; neither authenticates a deployed endpoint.</p></div>}
    <section className="ql239-panel" aria-labelledby="ql239-matrix-title"><h4 id="ql239-matrix-title">Four-company connection evidence</h4>
      <div className="ql239-table-scroll"><table><caption>Evidence records are session-local and unverified. Actual connections are always disconnected.</caption>
        <thead><tr><th scope="col">Business</th><th scope="col">Intake</th><th scope="col">Rotation</th><th scope="col">Independent review</th><th scope="col">Actual connection</th><th scope="col">Live pilot</th></tr></thead>
        <tbody>{portfolio.map((item) => <tr key={item.company}><th scope="row">{item.company === 'devilndove' ? 'Devil n Dove' : item.company === 'rosiedazzlers' ? 'Rosie Dazzlers' : item.company === 'icamp' ? 'iCamp' : 'Yard Workers'}</th>
          <td>{item.proof}</td><td>{item.rotation}</td><td>{item.independentReview}</td><td><strong>{item.actualConnection}</strong></td><td><strong>{item.realPilotHolds}/12 HELD</strong></td></tr>)}</tbody>
      </table></div>
    </section>
    <section className="ql239-panel" aria-labelledby="ql239-intake-title"><h4 id="ql239-intake-title">{organization.name} · Evidence source intake</h4>
      <p>We accept one company-scoped read-only proof reference at a time. This is an audit preparation form, <strong>not a connection test</strong>.</p>
      <div className="ql239-actions"><button type="button" onClick={sample}>Rehearse fictional proof only</button><button type="button" onClick={() => onNavigate('handshake_readiness')}>Review QL-238 handshake</button></div>
      <form onSubmit={intakeExternal} className="ql239-form">
        <div className="ql239-fields">
          <label>GitHub source artifact URL <small>RosevearCreations commit, PR, or Actions run only</small>
            <input type="url" required value={sourceUrl} onChange={(event) => setSourceUrl(event.target.value)} placeholder="https://github.com/RosevearCreations/repo/pull/123" /></label>
          <label>Exact source commit <small>40 lowercase hexadecimal characters</small>
            <input required value={revision} onChange={(event) => setRevision(event.target.value)} maxLength={40} placeholder="Full 40-character commit SHA" /></label>
          <label>Unique non-personal evidence ID
            <input required value={evidenceId} onChange={(event) => setEvidenceId(event.target.value)} maxLength={64} placeholder="receipt-reference-001" /></label>
          <label>Signed health receipt ID <small>Identifier only; no response body</small>
            <input required value={healthReceiptId} onChange={(event) => setHealthReceiptId(event.target.value)} maxLength={64} placeholder="health-receipt-001" /></label>
          <label>Signed capabilities receipt ID <small>Different from health receipt</small>
            <input required value={capabilitiesReceiptId} onChange={(event) => setCapabilitiesReceiptId(event.target.value)} maxLength={64} placeholder="capabilities-receipt-001" /></label>
          <label>Evidence capture timestamp <small>Exact UTC ISO time from source, within seven days</small>
            <input required value={evidenceCapturedAt} onChange={(event) => setEvidenceCapturedAt(event.target.value)} maxLength={24} placeholder="2026-10-27T14:00:00.000Z" /></label>
          <label>Submitter alias <small>No real customer or personal details</small>
            <input required value={submitterAlias} onChange={(event) => setSubmitterAlias(event.target.value)} maxLength={32} placeholder="operator_team_1" /></label>
        </div>
        <fieldset className="ql239-checks"><legend>Claims reported by the other application's tests</legend>
          {QL239_CHECKS.map((check) => <label key={check}><input type="checkbox" checked={checks[check]}
            onChange={(event) => setChecks((prior) => ({ ...prior, [check]: event.target.checked }))} />{labels[check]}</label>)}
        </fieldset>
        <button type="submit">Intake claims · stay HELD</button>
      </form>
      {feedback && <p className="ql239-feedback" role="status">{feedback}</p>}
      <div className="ql239-result" role="status" aria-live="polite"><strong>{entry?.disposition ?? 'NO EVIDENCE RECEIVED'}</strong>
        <p>{entry?.reason ?? 'Waiting for application build evidence; no remote verification has occurred.'}</p>
        {entry && <p>Origin: {entry.proof?.kind ?? 'REJECTED / NOT STORED'} · Evidence ID: {entry.proof?.evidenceId ?? 'REDACTED'} · Health receipt: {entry.proof?.healthReceiptId ?? 'NOT RETAINED'} · Capabilities receipt: {entry.proof?.capabilitiesReceiptId ?? 'NOT RETAINED'} · Reviewer: {entry.reviewerAlias ?? 'NOT ASSIGNED'} · Connection: <strong>{entry.actualConnection}</strong>.</p>}
      </div>
    </section>
    <section className="ql239-panel" aria-labelledby="ql239-review-title"><h4 id="ql239-review-title">Credential rotation & independent decision · HOLD</h4>
      <p>Step 1: mark the claimed rotation checks for review. Step 2: a different reviewer alias may prepare a HELD review draft. The Node CI harness separately tests invented keys. Neither browser action validates real keys or releases an integration.</p>
      <div className="ql239-actions"><button type="button" disabled={entry?.disposition !== 'PROOF_CLAIM_HELD'}
        onClick={() => setLedger((prior) => markQl239RotationChecklist(prior, organization.id))}>Mark rotation review checklist · HELD</button>
        <label className="ql239-reviewer">Reviewer alias
          <input value={reviewerAlias} onChange={(event) => setReviewerAlias(event.target.value)} maxLength={32} placeholder="different_reviewer" /></label>
        <button type="button" disabled={!entry?.proof || entry.disposition !== 'PROOF_CLAIM_HELD' || entry.credentialRun !== 'SYNTHETIC_ROTATION_CHECKLIST_HELD' || !reviewerAlias.trim() || reviewerAlias.toLowerCase() === entry.proof.submitterAlias.toLowerCase()}
          onClick={() => setLedger((prior) => independentlyReviewQl239(prior, organization.id, reviewerAlias.trim()))}>Prepare independent review · HELD</button>
        <button type="button" onClick={reset}>Reset this company's evidence</button></div>
      <div className="ql239-result"><strong>{entry?.review ?? 'NOT_REVIEWED'}</strong><p>Credential rehearsal: {entry?.credentialRun ?? 'NOT_RUN'} · Actual owner approval: NO · Real signed endpoint proof: NOT VERIFIED · Live dispatch: DISABLED.</p></div>
      <button type="button" aria-controls="ql239-prerequisites" aria-expanded={detailOpen} onClick={() => setDetailOpen((open) => !open)}>{detailOpen ? 'Hide' : 'Show'} all 12 real release holds</button>
      {detailOpen && <ol id="ql239-prerequisites">{QL181_PREREQUISITES.map((item) => <li key={item.id}>{item.title} — <strong>{item.state}</strong></li>)}</ol>}
      <p className="ql239-help">To move beyond this gate, AI Data Platform must authenticate actual health/capabilities responses, independently verify per-business and per-tenant policies, prove credential rotation/rollback on a real test server, and issue tamper-evident audited receipts. A separately authorized owner decision is still required before any connection or communication is enabled.</p>
    </section>
  </section>;
}

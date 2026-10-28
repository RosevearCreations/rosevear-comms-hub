import { useState, type Dispatch, type SetStateAction, type FormEvent } from 'react';
import type { OperatorOrganization, OperatorWorkspace } from './ql191Organizations';
import type { Ql239Ledger } from './ql239GatewayProofReview';
import type { Ql240Ledger } from './ql240PilotDecision';
import { QL181_PREREQUISITES } from './ql181PrivacyPilotGate';
import {
  QL241_RELEASE, QL241_CHECKS, type Ql241Check, type Ql241Ledger,
  recordQl241Report, ql241CurrentStatus, ql241PrepareOwnerReview,
  ql241Portfolio, resetQl241Company
} from './ql241ExternalProofReadiness';
import './ql241-external-proof-readiness.css';

const reviewLabels: Record<Ql241Check, string> = {
  outOfBandPinProvenanceChecked: 'Trusted second channel supplies the SPKI fingerprint (not just the response itself)',
  sourceAndCiRunIndependentlyRetrieved: 'Separate reviewer opened the real source commit and passing CI run',
  gatewayAuditIndependentlyRetrieved: 'Gateway durable audit references separately retrieved and reconciled',
  foreignTenantAndRevokedKeyDenied: 'Foreign tenant, revoked key, tamper and replay negatives independently witnessed',
  rollbackAndExpiryReviewed: 'Reversible nonproduction configuration, revocation and expiry verified',
  separateOwnerScopeDecisionRequested: 'Owner asked to review the exact Devil n Dove read-only scope; no approval asserted'
};
const defaultChecks = () => Object.fromEntries(QL241_CHECKS.map((key) => [key, false])) as Record<Ql241Check, boolean>;

export function Ql241ExternalProofReadiness({ organization, sourceLedger, auditLedger, ledger, setLedger, onNavigate }: {
  organization: OperatorOrganization;
  sourceLedger: Ql239Ledger;
  auditLedger: Ql240Ledger;
  ledger: Ql241Ledger;
  setLedger: Dispatch<SetStateAction<Ql241Ledger>>;
  onNavigate: (workspace: OperatorWorkspace) => void;
}) {
  const [help, setHelp] = useState(false);
  const [holds, setHolds] = useState(false);
  const [rawReport, setRawReport] = useState('');
  const [reviewer, setReviewer] = useState('');
  const [checks, setChecks] = useState<Record<Ql241Check, boolean>>(defaultChecks);
  const [message, setMessage] = useState('');
  const entry = ledger[organization.id];
  const source = sourceLedger[organization.id];
  const audit = auditLedger[organization.id];
  const status = ql241CurrentStatus(entry, organization.id, auditLedger, sourceLedger);
  const readyForRequest = organization.id === 'devilndove' && status === 'EXTERNAL_REPORT_RECEIVED_UNATTESTED_HELD' &&
    QL241_CHECKS.every((key) => checks[key]) && reviewer.trim().length >= 3;

  function intake(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      if (rawReport.length > 4096) throw new Error('Report exceeds safe size limit.');
      const sanitized = JSON.parse(rawReport);
      setLedger((old) => recordQl241Report(old, sanitized, organization.id, auditLedger, sourceLedger));
      setMessage('Only safe report references were inspected and retained in memory. This is NOT a verified gateway connection.');
    } catch {
      setMessage('Invalid JSON or oversized report. Paste only the small sanitized Node verifier result, never a response body, token or customer record.');
    }
    setRawReport('');
  }

  function reset() {
    setLedger((old) => resetQl241Company(old, organization.id));
    setRawReport(''); setReviewer(''); setChecks(defaultChecks());
    setMessage('Removed only this company’s session-local QL-241 draft.');
  }

  return <section className="ql241-screen" data-ql241-release={QL241_RELEASE} data-company={organization.id} aria-labelledby="ql241-title">
    <header className="ql241-header"><div><p className="ql191-eyebrow">QL-241 · External nonproduction evidence · DISABLED PREVIEW</p>
      <h3 id="ql241-title">Pinned-key GET receipts &amp; owner authorization readiness</h3>
      <p>Inspect the separate Node verifier’s sanitized report, then prepare a held owner review for Devil n Dove only.</p>
    </div><button type="button" aria-controls="ql241-help" aria-expanded={help} onClick={() => setHelp((open) => !open)}>ⓘ Evidence help</button></header>

    <p className="ql241-warning" role="note"><strong>ALL FOUR COMPANIES: DISCONNECTED · 12/12 REAL PILOT HOLDS.</strong> An operator-entered JSON report or checklist cannot authenticate its own source, public-key provenance, CI run, audit store or owner identity. No browser fetches, provider credentials, actual approvals, data transfers, calls, SMS or dispatch.</p>
    {help && <div className="ql241-help" id="ql241-help">
      <p>The nonproduction developer CLI is <code>node scripts/ql241-retrieve-proofs.mjs --config ./local-nonsecret-config.json --pin-sha256 &lt;fingerprint-from-separate-channel&gt; --allow-nonproduction-https-get</code>. Only two direct, credential-free HTTPS GETs are attempted; authentication-protected endpoints correctly remain blocked until secure server-side provisioning.</p>
      <p>Accept only a sanitised result. Independently obtain the source commit and CI run, pin the public key through a separate trusted channel, inspect the gateway audit and negative tests, and have the owner decide future scope separately. Never paste private keys, tokens, phone numbers, customer records, complete gateway responses or messages here.</p>
    </div>}

    <section className="ql241-panel" aria-labelledby="ql241-matrix"><h4 id="ql241-matrix">Four-company external proof matrix</h4>
      <div className="ql241-table-scroll"><table><caption>Evidence intake is session-only and UNATTESTED; no connection is enabled.</caption>
        <thead><tr><th scope="col">Business</th><th scope="col">External report</th><th scope="col">Owner request</th><th scope="col">Connection</th><th scope="col">Live holds</th></tr></thead>
        <tbody>{ql241Portfolio(ledger, auditLedger, sourceLedger).map((item) => <tr key={item.company}>
          <th scope="row">{item.company === 'devilndove' ? 'Devil n Dove' : item.company === 'rosiedazzlers' ? 'Rosie Dazzlers' : item.company === 'icamp' ? 'iCamp' : 'Yard Workers'}</th>
          <td>{item.evidence}</td><td>{item.request}</td><td><strong>{item.connection}</strong></td><td><strong>{item.holds}/12 HELD</strong></td></tr>)}</tbody>
      </table></div>
    </section>

    <section className="ql241-panel" aria-labelledby="ql241-intake"><h4 id="ql241-intake">{organization.name} · External GET proof intake</h4>
      <p>Upstream QL-239 external source: <strong>{source?.proof?.kind ?? 'NOT RECEIVED'}</strong> · QL-240: <strong>{audit?.status ?? 'NOT REVIEWED'}</strong> · Independent draft: <strong>{audit?.independentReview ?? 'NOT REVIEWED'}</strong>.</p>
      <div className="ql241-meta"><span>Source: <strong>{source?.proof?.evidenceId ?? 'MISSING'}</strong></span>
        <span>Health: <strong>{audit?.claim?.healthReceiptId ?? 'MISSING'}</strong></span>
        <span>Capabilities: <strong>{audit?.claim?.capabilitiesReceiptId ?? 'MISSING'}</strong></span>
        <span>Active key: <strong>{audit?.claim?.currentKeyId ?? 'MISSING'}</strong></span></div>
      <div className="ql241-actions"><button type="button" onClick={() => onNavigate('gateway_proof_review')}>QL-239 source intake</button>
        <button type="button" onClick={() => onNavigate('receipt_pilot_gate')}>QL-240 receipt audit</button></div>
      <form onSubmit={intake} className="ql241-form"><label htmlFor="ql241-report">Sanitized QL-241 CLI report JSON (no original responses)
        <textarea id="ql241-report" rows={5} required maxLength={4096} value={rawReport}
          onChange={(event) => setRawReport(event.target.value)} placeholder="Paste the sanitized held GET verifier JSON result…" /></label>
        <button type="submit">Inspect external report references · stay HELD</button></form>
      {message && <p className="ql241-message" role="status">{message}</p>}
      <div className="ql241-result" role="status" aria-live="polite"><strong>{status}</strong>
        <p>{status === 'SOURCE_DRIFT_HELD' ? 'Upstream source or receipt identity changed. Recheck externally and reset this QL-241 draft.' : entry?.reason ?? 'No externally verified QL-241 gateway evidence received.'}</p>
        <p>Public key fingerprint: <strong>{status === 'EXTERNAL_REPORT_RECEIVED_UNATTESTED_HELD' ? entry?.report?.publicKeyFingerprintSha256 : 'NOT ACCEPTED'}</strong></p>
        <p>Actual gateway attestation: NOT ESTABLISHED · Real owner authorization: NO · Connection: DISCONNECTED.</p></div>
    </section>

    <section className="ql241-panel" aria-labelledby="ql241-owner"><h4 id="ql241-owner">Devil n Dove · owner-safe read-only pilot review request</h4>
      <p>This is a <strong>request for a separate authorization decision</strong>, never authorization itself. Scope would be limited to read-only product/listing references (including Product #53) through AI Data Platform; no Etsy or inventory writes, and no customer messaging.</p>
      <fieldset className="ql241-checks" disabled={organization.id !== 'devilndove' || status !== 'EXTERNAL_REPORT_RECEIVED_UNATTESTED_HELD'}>
        <legend>Independently witnessed checks (local declarations only)</legend>
        {QL241_CHECKS.map((key) => <label key={key}><input type="checkbox" checked={checks[key]}
          onChange={(event) => setChecks((old) => ({ ...old, [key]: event.target.checked }))} />{reviewLabels[key]}</label>)}
      </fieldset>
      <div className="ql241-actions"><label>Additional independent reviewer alias
          <input value={reviewer} maxLength={32} onChange={(event) => setReviewer(event.target.value)} placeholder="owner_review_team_5" /></label>
        <button type="button" disabled={!readyForRequest} onClick={() => setLedger((old) =>
          ql241PrepareOwnerReview(old, organization.id, auditLedger, sourceLedger, reviewer.trim(), checks))}>
          Prepare owner decision request · NO APPROVAL</button>
        <button type="button" onClick={reset}>Reset QL-241 company draft</button></div>
      <div className="ql241-result"><strong>{status === 'SOURCE_DRIFT_HELD' ? 'HOLD · SOURCE DRIFT' : entry?.request ?? 'NONE'}</strong>
        <p>Independent reviewer alias: {entry?.independentReviewerAlias ?? 'NOT RECORDED'} · Verified owner signature: NONE · Authorization: NOT GIVEN · Provider state: DISCONNECTED.</p></div>
      <button type="button" aria-expanded={holds} aria-controls="ql241-holds" onClick={() => setHolds((open) => !open)}>{holds ? 'Hide' : 'Show'} all twelve unchanged QL-181 prerequisites</button>
      {holds && <ol id="ql241-holds">{QL181_PREREQUISITES.map((item) => <li key={item.id}>{item.title}: <strong>{item.state}</strong></li>)}</ol>}
    </section>
  </section>;
}

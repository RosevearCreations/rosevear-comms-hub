import { useState, type Dispatch, type FormEvent, type SetStateAction } from 'react';
import type { OperatorOrganization, OperatorWorkspace } from './ql191Organizations';
import type { Ql239Ledger } from './ql239GatewayProofReview';
import type { Ql240Ledger } from './ql240PilotDecision';
import type { Ql241Ledger } from './ql241ExternalProofReadiness';
import type { Ql242Ledger } from './ql242OwnerSignedRollout';
import type { Ql243Ledger } from './ql243ConnectionTesting';
import { QL244_RELEASE, QL244_BLOCKERS, QL244_SOURCES, type Ql244Ledger,
  inspectQl244Report, ql244CurrentStatus, ql244Portfolio } from './ql244WitnessedHandshake';
import './ql244-witnessed-handshake.css';

export function Ql244WitnessedHandshake({ organization, source, audit, external,
  ownerRollout, connectionTests, ledger, setLedger, onNavigate }: {
  organization: OperatorOrganization; source: Ql239Ledger; audit: Ql240Ledger;
  external: Ql241Ledger; ownerRollout: Ql242Ledger; connectionTests: Ql243Ledger;
  ledger: Ql244Ledger; setLedger: Dispatch<SetStateAction<Ql244Ledger>>;
  onNavigate: (workspace: OperatorWorkspace) => void;
}) {
  const [showHelp, setShowHelp] = useState(false);
  const [showBlockers, setShowBlockers] = useState(false);
  const [json, setJson] = useState('');
  const [message, setMessage] = useState('');
  const company = organization.id;
  const status = ql244CurrentStatus(ledger[company], company, source, audit,
    external, ownerRollout, connectionTests);
  const reference = status === 'SOURCE_DRIFT_HELD' ? null : ledger[company]?.reference;

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      if (json.length > 8192) throw new Error('oversize');
      const report: unknown = JSON.parse(json);
      setLedger(old => ({ ...old, [company]: inspectQl244Report(report, company,
        source, audit, external, ownerRollout, connectionTests) }));
      setMessage('Public receipt IDs and six non-secret key IDs were compared. No signatures or real-world identities were verified by this browser.');
    } catch {
      setMessage('Rejected oversized/invalid JSON. Never paste real HMAC secrets, private keys, bearer tokens, owner identity records or customer data.');
    }
    setJson('');
  }
  function reset() {
    setLedger(old => { const next = { ...old }; delete next[company]; return next; });
    setJson(''); setMessage('Only this company’s local review was cleared; no server connection or decision was changed.');
  }

  return <section className="ql244-screen" data-ql244-release={QL244_RELEASE}
    data-company={company} aria-labelledby="ql244-title">
    <header className="ql244-header"><div>
      <p className="ql191-eyebrow">QL-244 · Six-app witnessed handshake and conditional review · DISABLED PREVIEW</p>
      <h3 id="ql244-title">Independent handshake evidence &amp; owner-safe pilot decision</h3>
      <p>Reconcile source-linked nonproduction test claims, separate public-key witness signatures and per-app credential metadata.</p>
    </div><button type="button" aria-controls="ql244-help" aria-expanded={showHelp}
      onClick={() => setShowHelp(x => !x)}>ⓘ Witness &amp; credential help</button></header>

    <p className="ql244-warning" role="note"><strong>OWNER AUTHORIZATION: NOT GIVEN. ACTUAL CONNECTION: DISCONNECTED.</strong> All four business pilots remain held, with 12/12 real communications prerequisites unverified. No gateway request, credential provisioning, customer record, Etsy write, phone call, SMS or provider dispatch occurs here.</p>
    {showHelp && <aside className="ql244-help" id="ql244-help">
      <p>Give the six applications the QL-244 continuation in <code>docs/ROSEVEAR_INTEGRATION_V1_QL244_WITNESSED_HANDSHAKE_HANDOFF.md</code>. Request their non-secret credential registry receipts, exact source/CI runs, signed negative-test results and real independent reviewer evidence.</p>
      <p>Use the server-only, offline CLI <code>node scripts/ql244-verify-conditional-review.mjs</code> with four separately obtained public-key fingerprints: gateway, owner, identity witness and handshake assessor. Do not run it with private keys.</p>
      <p>Cryptographically matching an assessor signature and a signed owner <em>request to review</em> is not independent real-world attestation or consent. The actual owner must explicitly authorize a specific read-only pilot through a separate verified process.</p>
    </aside>}

    <section className="ql244-panel" aria-labelledby="ql244-matrix"><h4 id="ql244-matrix">Four-company held pilot decision matrix</h4>
      <div className="ql244-scroll"><table><caption>All companies disconnected; no signed request can automatically authorize a pilot.</caption>
        <thead><tr><th scope="col">Company</th><th scope="col">Evidence status</th><th scope="col">Connection</th><th scope="col">Owner permission</th><th scope="col">Live holds</th></tr></thead>
        <tbody>{ql244Portfolio(ledger, source, audit, external, ownerRollout, connectionTests).map(row => <tr key={row.company}>
          <th scope="row">{row.company === 'devilndove' ? 'Devil n Dove' : row.company === 'rosiedazzlers' ?
            'Rosie Dazzlers' : row.company === 'icamp' ? 'iCamp' : 'Yard Workers'}</th>
          <td>{row.status}</td><td><strong>{row.connection}</strong></td>
          <td>{row.ownerPermission}</td><td><strong>{row.pilotHolds}/12 HELD</strong></td>
        </tr>)}</tbody>
      </table></div>
    </section>

    <section className="ql244-panel" aria-labelledby="ql244-registry"><h4 id="ql244-registry">Six-app credential-exchange metadata review</h4>
      <p>Only key IDs and public receipt references are displayed. Every business uses a different server-side credential, not a shared gateway password. Signer/provisioner claims require independent verification.</p>
      <div className="ql244-scroll"><table><caption>Actual credential exchange and owner approval are not recorded by this UI.</caption>
        <thead><tr><th scope="col">Application</th><th scope="col">Held key ID</th><th scope="col">Metadata receipt</th><th scope="col">Real authorization</th></tr></thead>
        <tbody>{QL244_SOURCES.map((system, index) => {
          const row = reference?.credentialMetadata[index];
          return <tr key={system}><th scope="row">{system}</th>
            <td>{row?.system === system ? row.keyId : 'NOT VERIFIED'}</td>
            <td>{row?.system === system ? row.receiptId : 'NOT RECEIVED'}</td><td>NOT GIVEN</td></tr>;
        })}</tbody>
      </table></div>
    </section>

    <section className="ql244-panel" aria-labelledby="ql244-review"><h4 id="ql244-review">{organization.name} · Conditional review proof intake</h4>
      <p>QL-243 source status: <strong>{connectionTests[company]?.status ?? 'MISSING'}</strong> · Prior gateway audit: <strong>{connectionTests[company]?.reference?.gatewayAuditId ?? 'MISSING'}</strong>.</p>
      <button type="button" onClick={() => onNavigate('connection_testing')}>Open QL-243 connection-test evidence</button>
      <form onSubmit={submit} className="ql244-form"><label htmlFor="ql244-report">Sanitized QL-244 CLI summary (no signing keys, actual credentials or owner approvals)
        <textarea id="ql244-report" rows={5} maxLength={8192} required value={json}
          onChange={event => setJson(event.target.value)} placeholder="Only the CLI's small, non-secret HELD result JSON" />
      </label><div className="ql244-actions"><button type="submit" disabled={company !== 'devilndove'}>Compare signed review claims · HOLD</button>
        <button type="button" onClick={reset}>Clear local review</button></div></form>
      {message && <p role="status" className="ql244-message">{message}</p>}
      <div className="ql244-result" role="status" aria-live="polite"><strong>{status}</strong>
        <p>{status === 'SOURCE_DRIFT_HELD' ? 'Frozen: a prior source revision, audit, identity receipt or public pin has changed.' :
          ledger[company]?.reason ?? 'No real independently witnessed handshake or owner decision evidence has been received.'}</p>
        <p>Assessor receipt: <strong>{reference?.assessorReceiptId ?? 'NOT RECEIVED'}</strong></p>
        <p>Actual owner consent: NO · Real gateway connection: DISCONNECTED · Writes/calls/SMS/dispatch: 0.</p>
      </div>
    </section>

    <section className="ql244-panel" aria-labelledby="ql244-blockers"><h4 id="ql244-blockers">Conditional read-only pilot release blockers</h4>
      <button type="button" aria-controls="ql244-blockers-list" aria-expanded={showBlockers}
        onClick={() => setShowBlockers(v => !v)}>{showBlockers ? 'Hide' : 'Show'} open blockers ({QL244_BLOCKERS.length})</button>
      {showBlockers && <ol id="ql244-blockers-list">{QL244_BLOCKERS.map(b => <li key={b}>{b} · <strong>HELD / INDEPENDENT PROOF REQUIRED</strong></li>)}</ol>}
      <p>Conditional review is <strong>not</strong> conditional authorization. No production integration, server configuration change or external action is made by this page.</p>
    </section>
  </section>;
}

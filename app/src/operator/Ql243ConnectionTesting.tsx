import { useState, type Dispatch, type SetStateAction, type FormEvent } from 'react';
import type { OperatorOrganization, OperatorWorkspace } from './ql191Organizations';
import type { Ql239Ledger } from './ql239GatewayProofReview';
import type { Ql240Ledger } from './ql240PilotDecision';
import type { Ql241Ledger } from './ql241ExternalProofReadiness';
import type { Ql242Ledger } from './ql242OwnerSignedRollout';
import { QL243_RELEASE, QL243_BLOCKERS, QL243_SIX_APPS, type Ql243Ledger,
  inspectQl243Report, ql243CurrentStatus, ql243Portfolio } from './ql243ConnectionTesting';
import './ql243-connection-testing.css';

export function Ql243ConnectionTesting({ organization, source, audit, external, ownerRollout,
  ledger, setLedger, onNavigate }: {
  organization: OperatorOrganization; source: Ql239Ledger; audit: Ql240Ledger;
  external: Ql241Ledger; ownerRollout: Ql242Ledger; ledger: Ql243Ledger;
  setLedger: Dispatch<SetStateAction<Ql243Ledger>>;
  onNavigate: (workspace: OperatorWorkspace) => void;
}) {
  const [showHelp, setShowHelp] = useState(false);
  const [showBlockers, setShowBlockers] = useState(false);
  const [json, setJson] = useState('');
  const [notice, setNotice] = useState('');
  const company = organization.id;
  const status = ql243CurrentStatus(ledger[company], company, source, audit, external, ownerRollout);
  const reference = status === 'SOURCE_DRIFT_HELD' ? null : ledger[company]?.reference;

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      if (json.length > 8192) throw new Error('oversized');
      const parsed: unknown = JSON.parse(json);
      setLedger(old => ({ ...old, [company]: inspectQl243Report(parsed, company, source, audit, external, ownerRollout) }));
      setNotice('Only public, sanitized receipt references were compared. This browser has NOT checked independent source evidence or authenticated any owner.');
    } catch {
      setNotice('Invalid sanitized JSON. Never enter HMAC keys, tokens, owner credentials, public-key PEM blocks, customer records or messages.');
    }
    setJson('');
  }

  function reset() {
    setLedger(old => { const next = { ...old }; delete next[company]; return next; });
    setJson(''); setNotice('Only this company’s local QL-243 review was cleared. No remote connection changed.');
  }

  return <section className="ql243-screen" data-ql243-release={QL243_RELEASE} data-company={company} aria-labelledby="ql243-title">
    <header className="ql243-header"><div>
      <p className="ql191-eyebrow">QL-243 · Six-app secure connection test preparation · DISABLED PREVIEW</p>
      <h3 id="ql243-title">Owner identity, gateway audit GET &amp; pilot release blockers</h3>
      <p>Reconcile separate witness claims and a server-only authenticated read-only gateway test. Nothing here starts a connection.</p>
    </div><button type="button" aria-controls="ql243-help" aria-expanded={showHelp} onClick={() => setShowHelp(v => !v)}>ⓘ Connection-test help</button></header>

    <p className="ql243-warning" role="note"><strong>PRODUCTION: GREEN DOES NOT MEAN CONNECTED.</strong> All four business connections remain DISCONNECTED and all 12 communications-pilot prerequisites remain HELD. This screen never sends network traffic, reads real customer records, enables a connector, signs an owner approval, sends SMS or dispatches calls.</p>
    {showHelp && <aside className="ql243-help" id="ql243-help">
      <p>Share <code>docs/ROSEVEAR_INTEGRATION_V1_CONNECTION_TEST_HANDOFF_QL243.md</code> with all six companion applications. Each app must configure its own server-only nonproduction credential with AI Data Platform; do not send any secrets to Comms Hub or paste them here.</p>
      <p>On an authorized backend test machine, run <code>node scripts/ql243-test-connection.mjs</code> with a local non-secret evidence bundle and three separate public-key fingerprints. The offline mode checks witness signatures; authenticated mode requires an explicit nonproduction GET flag and a 32-byte server-only HMAC key from the environment.</p>
      <p>A valid signature proves possession of a signing key, not real-world identity, durable audit storage or owner permission. Independent attestation, backend audit review and a new explicit owner release decision are still required.</p>
    </aside>}

    <section className="ql243-panel" aria-labelledby="ql243-apps"><h4 id="ql243-apps">Six-app gateway coordination</h4>
      <p>AI Data Platform is the only gateway. Each of the six other apps supplies its own exact source revision, nonproduction endpoint, permission scope, and denied-negative evidence. No direct app-to-app database connection.</p>
      <div className="ql243-chips">{QL243_SIX_APPS.map(app => <span key={app}>{app} · TEST EVIDENCE PENDING</span>)}</div>
      <p>Comms Hub's first read-only candidate: <strong>AI Data Platform ↔ Devil n Dove</strong>. Rosie Dazzlers, Yard Workers, iCamp and Rosevear AI Hub stay on HOLD while this candidate is reviewed.</p>
    </section>

    <section className="ql243-panel" aria-labelledby="ql243-portfolio"><h4 id="ql243-portfolio">Four-company release-blocker matrix</h4>
      <div className="ql243-scroll"><table><caption>Every business remains disconnected regardless of reported signatures or GET results.</caption>
        <thead><tr><th scope="col">Business</th><th scope="col">Claim review</th><th scope="col">Real connection</th><th scope="col">Communications pilot</th></tr></thead><tbody>
          {ql243Portfolio(ledger, source, audit, external, ownerRollout).map(item => <tr key={item.company}>
            <th scope="row">{item.company === 'devilndove' ? 'Devil n Dove' : item.company === 'rosiedazzlers' ? 'Rosie Dazzlers' : item.company === 'icamp' ? 'iCamp' : 'Yard Workers'}</th>
            <td>{item.status}</td><td><strong>{item.connection}</strong></td><td><strong>{item.pilotHolds}/12 HELD</strong></td>
          </tr>)}
        </tbody></table></div>
    </section>

    <section className="ql243-panel" aria-labelledby="ql243-evidence"><h4 id="ql243-evidence">{organization.name} · Sanitized nonproduction receipt review</h4>
      <p>QL-242 upstream: <strong>{ownerRollout[company]?.status ?? 'MISSING'}</strong>. Gateway audit: <strong>{ownerRollout[company]?.reference?.gatewayAuditId ?? 'MISSING'}</strong>.</p>
      <button type="button" onClick={() => onNavigate('owner_signed_rollout')}>Open QL-242 evidence chain</button>
      <form onSubmit={submit} className="ql243-form"><label htmlFor="ql243-report">Paste QL-243 CLI's sanitized JSON summary only
        <textarea id="ql243-report" rows={5} maxLength={8192} required value={json} onChange={event => setJson(event.target.value)} placeholder="No private keys, tokens, owner identity documents or gateway response bodies" />
      </label><div className="ql243-actions"><button type="submit" disabled={company !== 'devilndove'}>Reconcile report · STAY HELD</button>
        <button type="button" onClick={reset}>Clear local review</button></div></form>
      {notice && <p role="status" className="ql243-notice">{notice}</p>}
      <div className="ql243-result" role="status" aria-live="polite"><strong>{status}</strong>
        <p>{status === 'SOURCE_DRIFT_HELD' ? 'Upstream source or signature reference changed. Evidence is frozen and must be rechecked.' : ledger[company]?.reason ?? 'No independent identity, durable gateway audit and owner authorization evidence has been received.'}</p>
        <p>Identity attestation reference: <strong>{reference?.identityAttestationId ?? 'MISSING'}</strong> · Authenticated GETs reported: <strong>{reference?.getAttempts ?? 0}</strong></p>
        <p>Owner identity independently confirmed: NO · Durable audit independently confirmed: NO · Actual owner pilot authorization: NO.</p>
      </div>
    </section>

    <section className="ql243-panel" aria-labelledby="ql243-blockers"><h4 id="ql243-blockers">Independent release-blocker checklist · all open</h4>
      <button type="button" aria-expanded={showBlockers} aria-controls="ql243-blocker-list" onClick={() => setShowBlockers(v => !v)}>{showBlockers ? 'Hide' : 'Show'} unresolved release blockers ({QL243_BLOCKERS.length})</button>
      {showBlockers && <ol id="ql243-blocker-list">{QL243_BLOCKERS.map(item => <li key={item}>{item} · <strong>HELD / NOT VERIFIED</strong></li>)}</ol>}
      <p>Manual independent review and a separate owner decision remain mandatory. No automatic release, no provider dispatch and no cross-app mutation is possible from this page.</p>
    </section>
  </section>;
}

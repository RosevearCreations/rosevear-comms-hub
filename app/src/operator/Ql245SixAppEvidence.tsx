import { useState, type Dispatch, type FormEvent, type SetStateAction } from 'react';
import type { OperatorOrganization, OperatorWorkspace } from './ql191Organizations';
import type { Ql239Ledger } from './ql239GatewayProofReview';
import type { Ql240Ledger } from './ql240PilotDecision';
import type { Ql241Ledger } from './ql241ExternalProofReadiness';
import type { Ql242Ledger } from './ql242OwnerSignedRollout';
import type { Ql243Ledger } from './ql243ConnectionTesting';
import type { Ql244Ledger } from './ql244WitnessedHandshake';
import { QL245_RELEASE, QL245_SOURCE_CLAIMS, QL245_SUMMARY_ORIGIN,
  QL245_BLOCKERS, type Ql245Ledger, inspectQl245Summary,
  ql245CurrentStatus, ql245Portfolio } from './ql245SixAppEvidence';
import { QL247_RELEASE, QL247_OBSERVED, QL247_SOURCE_CENSUS,
  QL247_DECISION } from './ql247SourceCensus';
import './ql245-six-app-evidence.css';

export function Ql245SixAppEvidence({ organization, source, audit, external,
  ownerRollout, connectionTests, witnessed, ledger, setLedger, onNavigate }: {
  organization: OperatorOrganization; source: Ql239Ledger; audit: Ql240Ledger;
  external: Ql241Ledger; ownerRollout: Ql242Ledger;
  connectionTests: Ql243Ledger; witnessed: Ql244Ledger;
  ledger: Ql245Ledger; setLedger: Dispatch<SetStateAction<Ql245Ledger>>;
  onNavigate: (workspace:OperatorWorkspace)=>void;
}) {
  const [showHelp,setShowHelp]=useState(false);
  const [showBlockers,setShowBlockers]=useState(false);
  const [reportText,setReportText]=useState('');
  const [message,setMessage]=useState('');
  const company=organization.id;
  const status=ql245CurrentStatus(ledger[company],company,source,audit,external,
    ownerRollout,connectionTests,witnessed);
  const reference=status==='SOURCE_DRIFT_HELD'?null:ledger[company]?.reference;

  function intake(event:FormEvent<HTMLFormElement>){
    event.preventDefault();
    try{
      if(reportText.length>16384)throw new Error('oversized report');
      const parsed:unknown=JSON.parse(reportText);
      const record=inspectQl245Summary(parsed,company,source,audit,external,
        ownerRollout,connectionTests,witnessed);
      setLedger(previous=>({...previous,[company]:record}));
      setMessage(record.status==='SIGNED_SOURCE_CLAIMS_RECONCILED_HELD'
        ? 'Signed-return metadata reconciled locally only. Real-world evidence and owner approval remain unverified.'
        : 'HELD: '+record.reason);
    }catch{
      setMessage('Rejected invalid/oversized report. Do not enter credentials, owner identity documents, private keys, customer data or contact details.');
    }
    setReportText('');
  }
  function reset(){
    setLedger(previous=>{const next={...previous};delete next[company];return next;});
    setReportText('');setMessage('Cleared this company’s temporary review. No credential or connection was changed.');
  }
  const labels:Record<string,string>={devilndove:'Devil n Dove',
    rosiedazzlers:'Rosie Dazzlers',yw:'Yard Workers',icamp:'iCamp'};
  return <section className="ql245-screen" data-ql245-release={QL245_RELEASE}
    data-company={company} aria-labelledby="ql245-title">
    <header className="ql245-header">
      <div>
        <p className="ql191-eyebrow">QL-245 · six-app source returns · DISABLED PREVIEW</p>
        <h3 id="ql245-title">Six-app proof intake &amp; read-only pilot decision blockers</h3>
        <p>Owner-supplied implementation updates have been received from all six companion apps.
          Their original source receipts and independent test provenance remain outstanding.</p>
      </div>
      <button type="button" aria-controls="ql245-help" aria-expanded={showHelp}
        onClick={()=>setShowHelp(v=>!v)}>ⓘ Independent evidence help</button>
    </header>
    <p role="note" className="ql245-warning"><strong>6/6 HANDOFF SUMMARIES RECEIVED; 0/6 INDEPENDENT CONNECTIONS VERIFIED.</strong>
      {' '}OWNER APPROVAL NOT GIVEN. Four company integrations remain DISCONNECTED, 12/12 communications
      prerequisites HELD. No secrets, live GETs, external writes, phone/SMS or provider dispatch occur here.</p>
    <section className="ql245-panel" data-ql247-release={QL247_RELEASE}
      aria-labelledby="ql247-census-title">
      <h4 id="ql247-census-title">QL-247 · Independent six-repository source census</h4>
      <p>GitHub source snapshot observed {QL247_OBSERVED}. The latest attachment includes five
        application updates; AI Data Platform was checked separately in GitHub. All six
        required public QL-246 source-proof files were <strong>missing (404)</strong> at the
        observed commits. These commit IDs may change with later builds.</p>
      <div className="ql245-scroll"><table>
        <caption>Public GitHub code provenance only — no runtime request, signing-key trust or pilot release.</caption>
        <thead><tr><th scope="col">Source</th><th scope="col">Repo / SHA prefix</th>
          <th scope="col">Signed public proof</th><th scope="col">Next blocker</th></tr></thead>
        <tbody>{QL247_SOURCE_CENSUS.map(row=><tr key={row.repository}>
          <th scope="row">{row.system}</th>
          <td><a href={`https://github.com/RosevearCreations/${row.repository}/commit/${row.mainSha}`}
            target="_blank" rel="noopener noreferrer">{row.repository} · {row.mainSha.slice(0, 12)}</a></td>
          <td><strong>MISSING / HOLD</strong></td><td>{row.blocker}</td>
        </tr>)}</tbody>
      </table></div>
      <p>Actual connections: <strong>{QL247_DECISION.actualConnection}</strong>.
        {' '}Owner pilot authorization: <strong>{QL247_DECISION.actualOwnerApproval}</strong>.
        {' '}Independently verified public signatures: <strong>{QL247_DECISION.independentlyVerifiedSignatures}/6</strong>.
        {' '}Real communications prerequisites: <strong>{QL247_DECISION.livePilotHolds}/12 HELD</strong>.</p>
      <p>Next handoff: <code>docs/ROSEVEAR_QL247_SIX_APP_CONNECTION_TEST_HANDOFF.md</code>.
        Separate per-app credentials and independently witnessed nonproduction-only GETs are
        required; sharing a GitHub owner does not create trusted connections.</p>
    </section>
    {showHelp&&<aside id="ql245-help" className="ql245-help">
      <p>Source: {QL245_SUMMARY_ORIGIN} Source-code changes and a GREEN CI pipeline do not
        independently prove a deployed endpoint, credential exchange, gateway signature
        or durable audit receipt.</p>
      <p>Give each companion app <code>docs/ROSEVEAR_INTEGRATION_V1_QL245_EVIDENCE_RETURN_HANDOFF.md</code>.
        For signed public metadata, use the offline <code>ql245-verify-six-app-evidence.mjs</code>
        with seven distinctly obtained public SPKI SHA-256 pins.</p>
      <p>A matched signature is still a held claim until the original source revisions, real
        authenticated nonproduction GETs, key ownership and independent assessor observations
        have been checked separately. A signed review request is never owner consent.</p>
    </aside>}
    <section className="ql245-panel" aria-labelledby="ql245-sources">
      <h4 id="ql245-sources">Six source implementation claims &amp; missing proof</h4>
      <div className="ql245-scroll"><table>
        <caption>All six summaries were transcribed from the owner's supplied RTF and remain unverified implementation claims.</caption>
        <thead><tr><th scope="col">Source</th><th scope="col">What is reported</th>
          <th scope="col">Evidence gap</th><th scope="col">Release</th></tr></thead>
        <tbody>{QL245_SOURCE_CLAIMS.map(row=><tr key={row.system}>
          <th scope="row">{row.name}</th><td>{row.claim}</td><td>{row.gap}</td>
          <td><strong>UNVERIFIED / HOLD</strong></td>
        </tr>)}</tbody>
      </table></div>
    </section>
    <section className="ql245-panel" aria-labelledby="ql245-companies">
      <h4 id="ql245-companies">Four-company owner pilot gate</h4>
      <div className="ql245-scroll"><table><caption>Software build green never means a real company integration has been approved.</caption>
        <thead><tr><th scope="col">Company</th><th scope="col">Review status</th>
          <th scope="col">Gateway</th><th scope="col">Owner permission</th><th scope="col">Live holds</th></tr></thead>
        <tbody>{ql245Portfolio(ledger,source,audit,external,ownerRollout,connectionTests,witnessed)
          .map(row=><tr key={row.company}><th scope="row">{labels[row.company]}</th>
            <td>{row.status}</td><td><strong>{row.connection}</strong></td>
            <td>{row.ownerPermission}</td><td>{row.pilotHolds}/12 HELD</td>
          </tr>)}</tbody>
      </table></div>
    </section>
    <section className="ql245-panel" aria-labelledby="ql245-intake">
      <h4 id="ql245-intake">{organization.name} · signed-return reconciliation</h4>
      <p>QL-244 witness source: <strong>{witnessed[company]?.status??'MISSING'}</strong>.
        {' '}This page cannot turn a signed packet into a real owner decision.</p>
      <button type="button" onClick={()=>onNavigate('witnessed_handshake_review')}>
        Open QL-244 separately signed review
      </button>
      <form className="ql245-form" onSubmit={intake}>
        <label htmlFor="ql245-report">Sanitized HELD output from offline QL-245 verifier only
          <textarea id="ql245-report" rows={5} maxLength={16384} required value={reportText}
            onChange={event=>setReportText(event.target.value)}
            placeholder="Paste only public metadata (never HMAC keys or private records)" />
        </label>
        <div className="ql245-actions">
          <button type="submit" disabled={company!=='devilndove'}>Reconcile public source claims · HOLD</button>
          <button type="button" onClick={reset}>Clear temporary review</button>
        </div>
      </form>
      {message&&<p role="status" className="ql245-message">{message}</p>}
      <div className="ql245-result" role="status" aria-live="polite">
        <strong>{status}</strong>
        <p>{status==='SOURCE_DRIFT_HELD'
          ? 'Prior assessor receipt or signed-source revision has changed. The candidate is frozen.'
          : ledger[company]?.reason??'No genuine signed six-app proof has been reconciled.'}</p>
        <p>Local signed-source metadata references: <strong>{reference?.credentialMetadata.length??0}/6</strong>.
          {' '}Independent live gateway evidence: <strong>NOT VERIFIED</strong>.</p>
        <p>Assessor receipt: <strong>{reference?.reviewReceiptId??'NOT RECEIVED'}</strong>.</p>
        <p>Actual owner authorization: <strong>NOT GIVEN</strong>. Connection: <strong>DISCONNECTED</strong>.
          {' '}Writes, calls, SMS, dispatch: <strong>0</strong>.</p>
      </div>
    </section>
    <section className="ql245-panel" aria-labelledby="ql245-decisions">
      <h4 id="ql245-decisions">Owner-safe release decision &amp; exception triage</h4>
      <p>No owner approval button is present. Separate real-world source verification and
        authenticated owner authorization are required before any nonproduction pilot.</p>
      <button type="button" aria-controls="ql245-blockers" aria-expanded={showBlockers}
        onClick={()=>setShowBlockers(v=>!v)}>
        {showBlockers?'Hide':'Show'} six independent release blockers
      </button>
      {showBlockers&&<ol id="ql245-blockers">{QL245_BLOCKERS.map(blocker=>
        <li key={blocker}>{blocker} · <strong>OPEN / HOLD</strong></li>)}</ol>}
      <p>Explicitly prohibited at this stage: live customer records, Etsy writes, booking
        changes, payroll, campground gates, home devices, real telephony or any cross-tenant transfer.</p>
    </section>
  </section>;
}

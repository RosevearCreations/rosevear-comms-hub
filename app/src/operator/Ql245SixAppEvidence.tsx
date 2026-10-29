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
import { QL248_RELEASE, QL248_STAGES, QL248_HOLD } from './ql248ProofCommitReadiness';
import { QL249_RELEASE, QL249_OBSERVED, QL249_SOURCE_SNAPSHOT,
  QL249_TEST_SLOT_GATE } from './ql249OriginRetest';
import { QL250_RELEASE, QL250_OBSERVED, QL250_SOURCE_REFRESH,
  QL250_READ_ONLY_GATES } from './ql250CustodyWindowReview';
import { QL251_RELEASE, QL251_OBSERVED, QL251_SIX_APP_PROOF_SNAPSHOT,
  QL251_TEST_GATE } from './ql251WitnessTestReview';
import { QL252_RELEASE, QL252_OBSERVED, QL252_PUBLIC_PROOF_PATH,
  QL252_SIX_APP_SOURCE_ESCALATION, QL252_REVIEW_GATES } from './ql252ProofEscalationReview';
import { QL253_RELEASE, QL253_OBSERVED, QL253_PUBLIC_PROOF_PATH,
  QL253_SIX_APP_ORIGIN_RECHECK, QL253_TRUST_AND_TEST_GATES } from './ql253ProofOriginReview';
import { QL254_RELEASE, QL254_OBSERVED, QL254_PUBLIC_PROOF_PATH,
  QL254_SIX_APP_FOLLOWUP, QL254_GATES } from './ql254ProofFollowupReview';
import { QL255_RELEASE, QL255_OBSERVED, QL255_PROOF_PATH,
  QL255_RESPONSE_DISPOSITIONS, QL255_OWNER_RELAY_GATES } from './ql255ProofDispositionReview';
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
    <section className="ql245-panel" data-ql248-release={QL248_RELEASE}
      aria-labelledby="ql248-proof-commit-title">
      <h4 id="ql248-proof-commit-title">QL-248 · Proof-commit reconciliation &amp; independently pinned source review</h4>
      <p>A signed proof cannot contain the SHA of the same Git commit that contains
        the proof file. The corrected handoff tracks <strong>two immutable commits</strong>:
        the audited source revision, then a later proof-bearing revision.
        The proof payload signs the first; the operator independently pins both.</p>
      <ol>{QL248_STAGES.map(stage=><li key={stage.title}>
        <strong>{stage.title}:</strong> {stage.evidence}
      </li>)}</ol>
      <p>QL-248 offline verification command: <code>node scripts/ql248-verify-source-proof-bundle.mjs</code>.
        This screen does not read local files, contact companion applications,
        accept owner signatures or provision keys.</p>
      <p>At the latest independently reviewed source snapshot: <strong>{QL248_HOLD.offlineSignedProofsAvailable}/6</strong> independently collected signed proofs,
        <strong> {QL248_HOLD.independentlyAuthenticatedPins}/6</strong> independently authenticated key pins,
        <strong> {QL248_HOLD.independentlyVerifiedGateways}/6</strong> real source gateway checks.
        Actual connections <strong>{QL248_HOLD.connection}</strong>; owner pilot authorization
        <strong> {QL248_HOLD.ownerAuthorization}</strong>; <strong>{QL248_HOLD.realPilotHolds}/12</strong> live
        prerequisites HELD. No writes, calls, SMS or dispatch.</p>
      <p>Next handoff: <code>docs/ROSEVEAR_QL248_PROOF_COMMIT_AMENDMENT_HANDOFF.md</code>.
        No current six-app source proof has been accepted by this offline-only preview.</p>
    </section>
    <section className="ql245-panel" data-ql249-release={QL249_RELEASE}
      aria-labelledby="ql249-github-origin-title">
      <h4 id="ql249-github-origin-title">QL-249 · Immutable GitHub proof retest &amp; nonproduction GET schedule gate</h4>
      <p>Independently checked the six companion GitHub <code>main</code> revisions on
        {' '}{QL249_OBSERVED}. Their code has advanced, but the required public signed
        proof path still returned <strong>404 for all six</strong> at these immutable
        revisions. This is a dated observation while the companion builds are underway,
        not a claim about future updates.</p>
      <div className="ql245-scroll"><table>
        <caption>Source GitHub snapshots only; no gateway or home-network connection made.</caption>
        <thead><tr><th scope="col">App</th><th scope="col">Observed main SHA</th>
          <th scope="col">Proof file at SHA</th><th scope="col">Test slot</th></tr></thead>
        <tbody>{QL249_SOURCE_SNAPSHOT.map(row=><tr key={row.repository}>
          <th scope="row">{row.system}</th>
          <td><a href={`https://github.com/RosevearCreations/${row.repository}/commit/${row.mainSha}`}
            target="_blank" rel="noopener noreferrer">{row.mainSha.slice(0, 12)}</a></td>
          <td><strong>{row.proof}</strong></td><td>NOT SCHEDULED / HOLD</td>
        </tr>)}</tbody>
      </table></div>
      <p>Public-only retest command: <code>node scripts/ql249-retest-six-app-public-github.mjs --public-get</code>.
        A real proof would trigger independent GitHub source-commit, proof ancestry and exact-CI
        verification. Even then a self-signed public key is <strong>not</strong> an independently
        authenticated key pin or evidence that the seven gateway denials really occurred.</p>
      <p>Test scheduling: <strong>{QL249_TEST_SLOT_GATE.status}</strong>;
        owner-scoped test authorization: <strong>{QL249_TEST_SLOT_GATE.ownerTestAuthorization}</strong>;
        GitHub source/CI proofs confirmed: <strong>{QL249_TEST_SLOT_GATE.githubOriginAndCiConfirmed}/6</strong>;
        actual authenticated gateway GETs: <strong>{QL249_TEST_SLOT_GATE.actualGatewayTests}/6</strong>.
        Every application remains <strong>{QL249_TEST_SLOT_GATE.connectionState}</strong>;
        {QL249_TEST_SLOT_GATE.realPilotHolds}/12 real communications pilot prerequisites HELD.</p>
      <p>Next handoff: <code>docs/ROSEVEAR_QL249_SIX_APP_ORIGIN_RETEST_AND_OWNER_TEST_SLOT_HANDOFF.md</code>.
        No endpoint, time window, credentials or owner consent have been inferred from a build.</p>
    </section>
    <section className="ql245-panel" data-ql250-release={QL250_RELEASE}
      aria-labelledby="ql250-source-custody-title">
      <h4 id="ql250-source-custody-title">QL-250 · Six-app proof refresh, key custody challenge &amp; proposed GET witnessing</h4>
      <p>Fresh, independently retrieved public GitHub source snapshot: <strong>{QL250_OBSERVED}</strong>.
        All six repositories have now advanced since the QL-249 snapshot.
        The exact signed public proof path was <strong>404 in all six at the listed revisions</strong>.
        Other teams may publish newer evidence after this snapshot.</p>
      <div className="ql245-scroll"><table>
        <caption>Public GitHub observations only — no gateway, owner identity or signing-key custody verified.</caption>
        <thead><tr><th scope="col">Application</th><th scope="col">Observed main SHA</th>
          <th scope="col">Since QL-249</th><th scope="col">QL-246 proof</th><th scope="col">Test window</th></tr></thead>
        <tbody>{QL250_SOURCE_REFRESH.map(row=><tr key={row.repository}>
          <th scope="row">{row.system}</th>
          <td><a href={`https://github.com/RosevearCreations/${row.repository}/commit/${row.mainSha}`}
            target="_blank" rel="noopener noreferrer">{row.mainSha.slice(0, 12)}</a></td>
          <td>{row.changedSinceQl249?'Advanced':'Same SHA'}</td>
          <td><strong>{row.proof} / HOLD</strong></td>
          <td>NOT SCHEDULED</td>
        </tr>)}</tbody>
      </table></div>
      <p>The new <code>ql250-pin-custody-window-witness.mjs</code> offline checker verifies an
        Ed25519 response to a short-lived nonce tied to source SHA, proof SHA, business and
        tenant. It <strong>does not independently attest who owns the key</strong>. A proposed
        nonproduction window must be future UTC, at most 30 minutes and limited to the two
        documented GET paths. Even a signed-looking owner test receipt stays an unverified
        claim until authenticated independently. No timer, gateway request or approval action
        exists in this preview.</p>
      <p>Public proofs: <strong>{QL250_READ_ONLY_GATES.publicProofsPresent}/6</strong>;
        independently witnessed signer custody: <strong>{QL250_READ_ONLY_GATES.independentlyPinnedSignerCustody}/6</strong>;
        authenticated owner test decisions: <strong>{QL250_READ_ONLY_GATES.authenticatedTestOnlyOwnerDecisions}/6</strong>;
        test windows scheduled: <strong>{QL250_READ_ONLY_GATES.gatewayGetWindowsScheduled}</strong>;
        witnessed real gateway GETs: <strong>{QL250_READ_ONLY_GATES.independentlyWitnessedGatewayGets}</strong>.
        All connections <strong>{QL250_READ_ONLY_GATES.connectionState}</strong>;
        <strong> {QL250_READ_ONLY_GATES.realPilotHolds}/12</strong> live communications gates HELD.</p>
      <p>Companion handoff: <code>docs/ROSEVEAR_QL250_CUSTODY_CHALLENGE_AND_NONPRODUCTION_WINDOW_HANDOFF.md</code>.
        A successful source build is not owner test consent and is not owner pilot consent.</p>
    </section>
    <section className="ql245-panel" data-ql251-release={QL251_RELEASE}
      aria-labelledby="ql251-witness-test-title">
      <h4 id="ql251-witness-test-title">QL-251 · Signed source proof recheck &amp; separate witness/test permission review</h4>
      <p>Independently rechecked all six public GitHub <code>main</code> revisions on
        {' '}{QL251_OBSERVED}. All six companion repos have newer source SHAs than the QL-250
        snapshot, but the immutable QL-246 proof URL still returned <strong>404 for every
        checked SHA</strong>. No real original signed proof, source CI chain, witness identity
        or test authorization was accepted.</p>
      <div className="ql245-scroll"><table>
        <caption>Dated GitHub public source check; signed proof and independent custody proof remain absent.</caption>
        <thead><tr><th scope="col">Application</th><th scope="col">Main revision</th>
          <th scope="col">Since QL-250</th><th scope="col">Public proof</th>
          <th scope="col">External GET test</th></tr></thead>
        <tbody>{QL251_SIX_APP_PROOF_SNAPSHOT.map(s=><tr key={s.repository}>
          <th scope="row">{s.system}</th>
          <td><a href={`https://github.com/RosevearCreations/${s.repository}/commit/${s.mainSha}`}
            target="_blank" rel="noopener noreferrer">{s.mainSha.slice(0, 12)}</a></td>
          <td>{s.advanced?'Advanced':'Same SHA'}</td>
          <td><strong>{s.publicProof} / HOLD</strong></td><td>NOT AUTHORIZED / NOT SCHEDULED</td>
        </tr>)}</tbody>
      </table></div>
      <p>The new QL-251 offline witness-return verifier binds a separate witness
        signature to a valid QL-250 custody challenge, exact source/proof SHAs, tenant and
        custody response digest. Its signed test-review form is explicitly a <strong>request
        for independent owner review</strong>, never owner approval. Matching two public
        signatures cannot prove real-world identity or authorize a gateway request.
        This preview contains <strong>no live fetch, approval button or scheduler</strong>.</p>
      <p>Original public signed proofs: <strong>{QL251_TEST_GATE.publishedSignedSourceProofs}/6</strong>;
        independently authenticated custody witnesses: <strong>{QL251_TEST_GATE.originalCustodyWitnessesIndependentlyAttested}/6</strong>;
        authenticated owner test decisions: <strong>{QL251_TEST_GATE.authenticatedOwnerNonproductionTestDecisions}</strong>;
        scheduled windows: <strong>{QL251_TEST_GATE.windowsScheduled}</strong>;
        real authenticated GET pairs: <strong>{QL251_TEST_GATE.authenticatedGatewayGetPairs}</strong>.
        All integrations <strong>{QL251_TEST_GATE.connectionState}</strong>;
        <strong> {QL251_TEST_GATE.realPilotHolds}/12</strong> live communications gates HELD.</p>
      <p>Six-app handoff: <code>docs/ROSEVEAR_QL251_SOURCE_WITNESS_TEST_AUTHORIZATION_HANDOFF.md</code>.
        Actual test approval and later read-only pilot approval are separate decisions.</p>
    </section>
    <section className="ql245-panel" data-ql252-release={QL252_RELEASE}
      aria-labelledby="ql252-proof-escalation-title">
      <h4 id="ql252-proof-escalation-title">QL-252 · Publication escalation, independent pin custody &amp; TEST-only owner review (HELD)</h4>
      <p>New public GitHub recheck on <strong>{QL252_OBSERVED}</strong>: the six applications
        have again advanced, but the required <code>{QL252_PUBLIC_PROOF_PATH}</code> is still
        <strong> missing (404)</strong> at all six checked main revisions. This does not
        mean their application builds failed: their source proof publication is a separate
        prerequisite. The results below are a dated snapshot, not live status.</p>
      <div className="ql245-scroll"><table>
        <caption>Actionable per-app source-proof publication queue; no gateway calls or credentials.</caption>
        <thead><tr><th scope="col">Application</th><th scope="col">GitHub main SHA</th>
          <th scope="col">Proof</th><th scope="col">Next required action</th></tr></thead>
        <tbody>{QL252_SIX_APP_SOURCE_ESCALATION.map(s=><tr key={s.repository}>
          <th scope="row">{s.system}</th>
          <td><a href={`https://github.com/RosevearCreations/${s.repository}/commit/${s.mainSha}`}
            target="_blank" rel="noopener noreferrer">{s.mainSha.slice(0, 12)}</a></td>
          <td><strong>{s.publicProof} / HOLD</strong></td>
          <td>Publish authentic signed QL-246 proof; verify exact source SHA and CI first</td>
        </tr>)}</tbody>
      </table></div>
      <p>Source proof first; then confirm independent signer-key custody and a distinct
        reviewer outside GitHub. QL-252 checks an offline custody provenance record and a
        signed <strong>test-only owner decision claim</strong> against the QL-251 witness
        and narrowly scoped GET request. Even internally matching signatures and a
        claimed out-of-band channel do <strong>not</strong> authenticate the owner or
        authorize any request. No approval control, key provisioning, scheduler or
        gateway fetch exists in this preview.</p>
      <p>Published proofs at this snapshot: <strong>{QL252_REVIEW_GATES.sourceProofsAtObservedMain}/6</strong>;
        independently verified custodian pins: <strong>{QL252_REVIEW_GATES.independentlyTrustedCustodyPins}/6</strong>;
        verified owner test approvals: <strong>{QL252_REVIEW_GATES.independentlyVerifiedOwnerDecisions}</strong>;
        original gateway GETs: <strong>{QL252_REVIEW_GATES.originalAuthenticatedGatewayGets}</strong>;
        scheduled windows: <strong>{QL252_REVIEW_GATES.scheduledGatewayGetWindows}</strong>.
        All connections <strong>{QL252_REVIEW_GATES.connectionState}</strong>;
        <strong> {QL252_REVIEW_GATES.realPilotHolds}/12</strong> live prerequisites HELD.</p>
      <p>Forward <code>docs/ROSEVEAR_QL252_PUBLICATION_ESCALATION_AND_OWNER_TEST_HANDOFF.md</code>
        to each app. Public GitHub-only checker: <code>node scripts/ql252-publication-escalation.mjs --public-get</code>.
        A future authenticated owner TEST decision is <em>not</em> pilot release.</p>
    </section>
    <section className="ql245-panel" data-ql253-release={QL253_RELEASE}
      aria-labelledby="ql253-pin-registry-title">
      <h4 id="ql253-pin-registry-title">QL-253 · Six-app proof origin, independent pin registry &amp; owner TEST-only exception (HELD)</h4>
      <p>Independent <strong>public GitHub only</strong> check: <strong>{QL253_OBSERVED}</strong>.
        At the six observed <code>main</code> SHAs, <code>{QL253_PUBLIC_PROOF_PATH}</code>
        {' '}was <strong>404 for every application</strong>. This is not a statement about newer
        commits or application deployment health. A passing build does not supply an
        authentic signed source proof.</p>
      <div className="ql245-scroll"><table>
        <caption>Immutable public GitHub file results; no signed-key pin, owner permission or private server request.</caption>
        <thead><tr><th scope="col">Application</th><th scope="col">Observed main SHA</th>
          <th scope="col">Signed proof</th><th scope="col">Exception owner</th></tr></thead>
        <tbody>{QL253_SIX_APP_ORIGIN_RECHECK.map(row=><tr key={row.repository}>
          <th scope="row">{row.system}</th>
          <td><a href={`https://github.com/RosevearCreations/${row.repository}/commit/${row.mainSha}`}
            target="_blank" rel="noopener noreferrer">{row.mainSha.slice(0,12)}</a></td>
          <td><strong>{row.publicProof} / HELD</strong></td>
          <td>Source app: publish real A/B signed proof, exact CI and independently verifiable provenance</td>
        </tr>)}</tbody>
      </table></div>
      <p>After an original proof is published, the offline pin-registry renewal checker
        binds source A, proof B, business/tenant, matching public SPKI fingerprint, a
        five-minute nonce and three distinct receipt IDs. <strong>Matching metadata
        is not independent key custody.</strong> It still requires a separately trusted
        out-of-band registry and witness. The TEST-only exception intake will accept
        only a request for private owner review, never an approval claim or a live GET.</p>
      <p>Published proofs: <strong>{QL253_TRUST_AND_TEST_GATES.publishedProofsAtSnapshot}/6</strong>;
        independent pins: <strong>{QL253_TRUST_AND_TEST_GATES.independentlyPinnedKeys}/6</strong>;
        verified custody witnesses: <strong>{QL253_TRUST_AND_TEST_GATES.independentCustodyWitnesses}/6</strong>;
        owner TEST-only approvals: <strong>{QL253_TRUST_AND_TEST_GATES.authenticatedOwnerTestApprovals}</strong>;
        real authenticated GETs: <strong>{QL253_TRUST_AND_TEST_GATES.authenticatedGatewayGets}</strong>.
        Connection <strong>{QL253_TRUST_AND_TEST_GATES.connectionState}</strong>;
        <strong> {QL253_TRUST_AND_TEST_GATES.realPilotHolds}/12</strong> live pilot conditions HELD.</p>
      <p><strong>Rosevear AI Hub PC:</strong> {QL253_TRUST_AND_TEST_GATES.miniServerRole}.
        An eventual always-on connector could use existing private Tailscale/LAN routing
        and outbound-only requests; no public inbound port, home vault/camera exposure,
        credential exchange, connector or daemon is enabled here.</p>
      <p>Forward <code>docs/ROSEVEAR_QL253_SIX_APP_PROOF_ORIGIN_PIN_REGISTRY_OWNER_TEST_HANDOFF.md</code>.
        Public-only opt-in: <code>npm run integration:ql253-public-proof -- --public-get</code>.
        Offline safeguard tests: <code>npm run verify:ql253</code>. Owner TEST approval
        and subsequent pilot release remain separate, independently authenticated acts.</p>
    </section>
    <section className="ql245-panel" data-ql254-release={QL254_RELEASE}
      aria-labelledby="ql254-private-witness-relay-title">
      <h4 id="ql254-private-witness-relay-title">QL-254 · Original proof follow-up, independent pin witness &amp; reversible private relay (HELD)</h4>
      <p>Latest dated <strong>public GitHub-only</strong> follow-up: <strong>{QL254_OBSERVED}</strong>.
        All six companion apps advanced their main commits since QL-253, but
        {' '}<code>{QL254_PUBLIC_PROOF_PATH}</code> still returned <strong>HTTP 404 at every
        observed SHA</strong>. These checks concern original signed proof publication,
        not application deployment health. Each new commit needs its own independent check.</p>
      <div className="ql245-scroll"><table>
        <caption>Public immutable source-code observations only; no authenticated gateway connection.</caption>
        <thead><tr><th scope="col">Application</th><th scope="col">Observed main SHA</th>
          <th scope="col">QL-246 proof</th><th scope="col">Next action</th></tr></thead>
        <tbody>{QL254_SIX_APP_FOLLOWUP.map(r=><tr key={r.repository}>
          <th scope="row">{r.system}</th>
          <td><a href={`https://github.com/RosevearCreations/${r.repository}/commit/${r.mainSha}`}
            target="_blank" rel="noopener noreferrer">{r.mainSha.slice(0,12)}</a></td>
          <td><strong>{r.proof} / HELD</strong></td>
          <td>Genuine source A, exact GREEN CI, signed proof descendant B, public raw proof bytes digest</td>
        </tr>)}</tbody>
      </table></div>
      <p>The new offline checker links a signed witness claim to a renewed five-minute
        pin challenge, exact A/B source, tenant, registry snapshot digest and distinct
        Ed25519 witness key. Even valid cryptography remains <strong>independently
        unverified</strong> until a separate custodian authenticates the witness and
        public key privately. A chat reply or a GitHub merge is not owner TEST permission.</p>
      <p><strong>Rosevear AI Hub 24/7 relay:</strong> {QL254_GATES.privateRelayRehearsal}.
        A reversible four-step sequence (disabled baseline, simulated enable,
        simulated stop, confirmed disabled) can be checked without accessing the PC.
        An eventual relay would use private Tailscale/LAN or outbound-only routing,
        isolate tenants, and have no public inbound port or vault/camera permissions.
        No service, credential exchange or gateway is enabled by this build.</p>
      <p>Original published proofs: <strong>{QL254_GATES.publicOriginalProofs}/6</strong>;
        independently trusted pins: <strong>{QL254_GATES.independentlyTrustedPins}/6</strong>;
        verified independent witnesses: <strong>{QL254_GATES.independentlyVerifiedWitnesses}/6</strong>;
        real GET pairs: <strong>{QL254_GATES.verifiedGatewayGetPairs}</strong>.
        TEST permission <strong>{QL254_GATES.ownerTestAuthorization}</strong>;
        connections <strong>{QL254_GATES.connectionState}</strong>;
        <strong> {QL254_GATES.livePilotHolds}/12</strong> live prerequisites HELD.</p>
      <p>Companion handoff: <code>docs/ROSEVEAR_QL254_SIX_APP_ORIGINAL_PROOF_WITNESS_PRIVATE_RELAY_HANDOFF.md</code>.
        Offline safeguards: <code>npm run verify:ql254</code>.
        Opt-in <em>public GitHub only</em> check:
        {' '}<code>npm run integration:ql254-public-proof -- --public-get</code>.
        No owner pilot, private runner, scheduling, calls, SMS or external writes.</p>
    </section>
    <section className="ql245-panel" data-ql255-release={QL255_RELEASE}
      aria-labelledby="ql255-six-app-disposition-title">
      <h4 id="ql255-six-app-disposition-title">QL-255 · Owner-received six-app responses, custody exception &amp; mini-server TEST preparation (HELD)</h4>
      <p>The six source-team responses were reconciled against independent <strong>public
        GitHub-only</strong> retrieval on <strong>{QL255_OBSERVED}</strong>. Every checked
        immutable <code>main</code> SHA still returned <strong>HTTP 404</strong> for
        {' '}<code>{QL255_PROOF_PATH}</code>. Their messages indicate application-build
        progress, not original signed source-proof publication, trusted signing-key
        custody or authenticated owner consent. This is a dated snapshot.</p>
      <div className="ql245-scroll"><table>
        <caption>Owner-reported state compared with independent GitHub proof path; no source runtime contacted.</caption>
        <thead><tr><th scope="col">Source</th><th scope="col">Immutable main SHA</th>
          <th scope="col">Source report</th><th scope="col">Proof</th></tr></thead>
        <tbody>{QL255_RESPONSE_DISPOSITIONS.map(row=><tr key={row.repository}>
          <th scope="row">{row.system}</th>
          <td><a href={`https://github.com/RosevearCreations/${row.repository}/commit/${row.mainSha}`}
            target="_blank" rel="noopener noreferrer">{row.mainSha.slice(0,12)}</a></td>
          <td>{row.response}</td><td><strong>{row.proof} / HOLD</strong></td>
        </tr>)}</tbody>
      </table></div>
      <p><strong>One concrete blocker:</strong> each source app needs genuine source A
        and matching GREEN CI, an authentic Ed25519 envelope in descendant proof
        commit B, and an independently pinned signer and different private witness.
        QL-255 accepts a separately reviewed custody exception only as a
        <strong> private review request</strong>, not completed signer ownership.
        It rejects cross-tenant, duplicate receipt, expired and self-approved claims.</p>
      <p><strong>24/7 Rosevear AI Hub mini-server:</strong> {QL255_OWNER_RELAY_GATES.stopAndRollback}.
        We can prepare an offline request for one owner-scoped nonproduction GET window
        of at most 30 minutes. A dedicated service account, isolated tenant, no public
        inbound ports and documented stop/rollback are mandatory. A signed-looking
        request, general GitHub change permission or a simulated rollback is
        <strong> not</strong> real TEST authorization. Nothing has been installed
        or started on the PC.</p>
      <p>Original signed proofs: <strong>{QL255_OWNER_RELAY_GATES.originalSignedProofs}/6</strong>;
        independently pinned signers: <strong>{QL255_OWNER_RELAY_GATES.independentlyPinnedSigners}/6</strong>;
        real-world verified custody witnesses: <strong>{QL255_OWNER_RELAY_GATES.independentlyAuthenticatedWitnesses}/6</strong>;
        original GETs: <strong>{QL255_OWNER_RELAY_GATES.actualGatewayGets}</strong>;
        owner TEST decision: <strong>{QL255_OWNER_RELAY_GATES.ownerTestAuthorization}</strong>;
        connection: <strong>{QL255_OWNER_RELAY_GATES.connections}</strong>;
        <strong> {QL255_OWNER_RELAY_GATES.livePilotHolds}/12</strong> safeguards HELD.</p>
      <p>Updated owner handoff:
        {' '}<code>docs/ROSEVEAR_QL255_SIX_APP_SIGNER_CUSTODY_OWNER_TEST_ACTION_SHEET.md</code>.
        Offline tests: <code>npm run verify:ql255</code>.
        Explicit public-only check:
        {' '}<code>npm run integration:ql255-public-proof -- --public-get</code>.
        Never enable a private gateway, owner trial, Etsy writes, calls or SMS here.</p>
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

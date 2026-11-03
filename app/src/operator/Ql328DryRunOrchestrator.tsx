import {useState} from 'react';
import {QL327_SOURCE_MATRIX} from './ql327ContractCompatibility';
import {QL328_BOUNDARY,QL328_PHASES,QL328_SCENARIOS,ql328FailureMatrix,
  ql328Orchestrate,ql328RetryLocally,type Ql328Scenario} from './ql328DryRunOrchestrator';
import './ql328-dry-run-orchestrator.css';

const SUMMARY=ql328FailureMatrix();

export function Ql328DryRunOrchestrator(){
  const [source,setSource]=useState<string>(QL327_SOURCE_MATRIX[0].id);
  const [scenario,setScenario]=useState<Ql328Scenario>('baseline');
  const [attempt,setAttempt]=useState(1);
  const [run,setRun]=useState(false);
  const [showPacket,setShowPacket]=useState(false);
  const current=QL327_SOURCE_MATRIX.find(row=>row.id===source)??QL327_SOURCE_MATRIX[0];
  const request={sourceId:current.id,scenario,tenantAlias:current.fixtureAlias,attempt};
  const outcome=run?ql328RetryLocally(request):ql328Orchestrate(request);
  const changeSource=(value:string)=>{setSource(value);setAttempt(1);setRun(false);setShowPacket(false);};
  const changeScenario=(value:Ql328Scenario)=>{setScenario(value);setAttempt(1);setRun(false);setShowPacket(false);};
  const reset=()=>{setSource(QL327_SOURCE_MATRIX[0].id);setScenario('baseline');setAttempt(1);
    setRun(false);setShowPacket(false);};

  return <section className="ql328" data-ql328-release="local-only-no-go-orchestrator-v1" aria-labelledby="ql328-title">
    <header className="ql328-header"><div><p className="ql271-eyebrow">QL-328 · I.T. Command · Nonproduction rehearsal</p>
      <h3 id="ql328-title">Dry-run sequence, failure matrix &amp; reversible NO-GO</h3>
      <p>Rehearse source proof, independent authority, tenant scope, contract shape and a proposed read-only GET. These are <strong>local fictional signals</strong>, never private TEST calls. Every rehearsal ends in an UNSENT NO-GO packet.</p></div>
      <strong className="ql328-hold">6 / 6 DISCONNECTED · HOLD</strong></header>
    <div className="ql328-stats" aria-label="Dry-run boundaries">
      <article><span>Independent sources</span><strong>4 + 2</strong><small>Four business tenants; two tenantless supports</small></article>
      <article><span>Deterministic cases</span><strong>{SUMMARY.cases}</strong><small>{SUMMARY.failureSignals} signals × {SUMMARY.sourceCount} source roles</small></article>
      <article><span>UNSENT NO-GO packets</span><strong>{SUMMARY.noGo}</strong><small>Simulated results, not dispatched packets</small></article>
      <article><span>Actual GET / writes</span><strong>0 / 0</strong><small>No provider, customer or private relay access</small></article>
    </div>
    <p className="ql328-warning" role="note"><strong>Software preview only.</strong> Source-signed Proof-B, independent custody, owner TEST approval, real tenant consent and gateway authentication are unavailable. Even the valid v1 fixture is NOT authorized. Buttons change in-memory display only; no network, storage, keys, calls, messages, ACK, remote retry or rollback.</p>
    <section className="ql328-panel" aria-labelledby="ql328-control-title">
      <h4 id="ql328-control-title">Local scenario controls</h4>
      <div className="ql328-controls"><label htmlFor="ql328-source">Source identity
        <select id="ql328-source" value={current.id} onChange={e=>changeSource(e.currentTarget.value)}>
          {QL327_SOURCE_MATRIX.map(row=><option key={row.id} value={row.id}>{row.label} · {row.role}</option>)}</select></label>
        <label htmlFor="ql328-scenario">Fictional signal
        <select id="ql328-scenario" value={scenario} onChange={e=>changeScenario(e.currentTarget.value as Ql328Scenario)}>
          {QL328_SCENARIOS.map(item=><option key={item.id} value={item.id}>{item.label}</option>)}</select></label></div>
      <div className="ql328-actions"><button type="button" onClick={()=>{setRun(true);setAttempt(1);}}>Rehearse locally</button>
        <button type="button" onClick={()=>{setRun(true);setAttempt(x=>Math.min(x+1,3));}}>Repeat same mock packet</button>
        <button type="button" onClick={()=>changeScenario('cancel')}>Cancel local preview</button>
        <button type="button" onClick={reset}>Reset to safe fixture</button></div>
      <div className="ql328-receipt" role="status" aria-live="polite">
        <strong>{run?'LOCAL REHEARSAL · NO-GO':'PREVIEW ONLY · NO-GO'}</strong>
        <span>Signal: {outcome.packet.signal} · Decision: {outcome.packet.reason} · Attempt readback: {outcome.attempt} / 3</span>
        <span>Idempotency key: <code>{outcome.packet.idempotencyKey}</code></span>
        <small>Repeat does not create a second packet or perform a request; cancellation is an UNSENT local disposition.</small>
      </div>
    </section>
    <section className="ql328-panel" aria-labelledby="ql328-stages-title">
      <h4 id="ql328-stages-title">Proposed flow · no step is actually executed</h4>
      <p>The order shows proof → authority → scope → contract → GET plan → fallback. A signal can be injected at any named step for review, but it never bypasses the earlier missing proof and permission gates.</p>
      <ol className="ql328-phases">{outcome.phases.map((phase,i)=><li key={phase.id} className={phase.status==='SIMULATED_STOP'?'ql328-stop':''}>
        <span>{i+1}. {phase.label}</span><strong>{phase.status}</strong><small>{phase.note}</small></li>)}</ol>
      <div className="ql328-decision"><div><strong>NO-GO · UNSENT</strong><p>Selected source: {current.label} · {current.role==='business'?'independent business tenant':'support, never a customer tenant'}</p><p>Fictional scope: <code>{current.fixtureAlias??'NONE'}</code> · Local contract check: <code>{outcome.fixtureDecision}</code></p></div>
      <div><strong>Reversible locally, never remotely</strong><ol>{outcome.packet.rollbackSteps.map(step=><li key={step}>{step}</li>)}</ol><small>Remote rollbacks: 0 · retries: 0 · signed decisions: 0</small></div></div>
    </section>
    <section className="ql328-panel" aria-labelledby="ql328-matrix-title"><h4 id="ql328-matrix-title">Six-source failure matrix</h4>
      <p>Each of the {SUMMARY.failureSignals} scenarios is evaluated for each source: {SUMMARY.cases} deterministic outcomes, all UNSENT and held. These HTTP codes are <em>hypothetical labels</em>, not responses observed from external systems.</p>
      <div className="ql328-table-wrap" role="region" tabIndex={0} aria-label="Scrollable synthetic failure table">
        <table><caption>Fictional stop signals and safe dispositions; zero requests</caption><thead><tr><th scope="col">Signal</th><th scope="col">Simulated stop stage</th><th scope="col">Packet reason</th><th scope="col">Outcome</th></tr></thead>
        <tbody>{QL328_SCENARIOS.map(item=><tr key={item.id}><th scope="row">{item.label}<small>{item.signal}</small></th><td>{item.phase}</td><td>{item.reason}</td><td>NO-GO · UNSENT · no automatic retry</td></tr>)}</tbody></table>
      </div></section>
    <section className="ql328-panel" aria-labelledby="ql328-packet-title"><h4 id="ql328-packet-title">Reversible NO-GO packet · display only</h4>
      <p>Packet identifiers are deterministic local labels, not signed receipts or server records. Use this as an UNSENT human-review checklist; no export, delivery or persistence occurs.</p>
      <button type="button" className="ql328-reveal" aria-expanded={showPacket} aria-controls="ql328-packet-data" onClick={()=>setShowPacket(x=>!x)}>
        {showPacket?'Hide':'Show'} local UNSENT packet</button>
      {showPacket&&<div id="ql328-packet-data" className="ql328-json"><pre><code>{JSON.stringify(outcome.packet,null,2)}</code></pre></div>}
      <p className="ql328-note">Source-linked operator guide: <code>docs/QL-328-NONPRODUCTION-DRY-RUN-NO-GO-GUIDE.md</code>. A real signed issuer receipt, custodian verification, exact owner authorization and separate nonproduction gateway trial are still required.</p>
    </section>
    <footer>Safety readback: {QL328_PHASES.length} descriptive stages · {QL328_BOUNDARY.privateGETs} private GETs · {QL328_BOUNDARY.sourceWrites} writes · {QL328_BOUNDARY.credentialsRead} credentials · {QL328_BOUNDARY.sentPackets} sent packets · {QL328_BOUNDARY.realRollbacks} remote rollbacks · {QL328_BOUNDARY.connected} connected · Windows relay {QL328_BOUNDARY.windowsRelay} · ACK {QL328_BOUNDARY.ack}. Manual device acceptance remains pending.</footer>
  </section>;
}

import {useState} from 'react';
import {QL329_BOUNDS,QL329_COMMS,QL329_LEGACY_FIXTURE_NOTE,QL329_MASTER,
  QL329_SCENARIOS,QL329_SHELLS,QL329_SUPPORT,ql329EvaluatePlan,
  ql329IntegrityReadback,type Ql329Scenario} from './ql329MasterShellTruth';
import './ql329-master-shell-truth.css';

const READBACK=ql329IntegrityReadback();

export function Ql329MasterShellTruth(){
  const [shellId,setShellId]=useState<string>(QL329_SHELLS[0].id);
  const [scenario,setScenario]=useState<Ql329Scenario>('shell_connection');
  const [showChild,setShowChild]=useState(false);
  const [showReview,setShowReview]=useState(false);
  const chosen=QL329_SHELLS.find(x=>x.id===shellId)??QL329_SHELLS[0];
  const output=ql329EvaluatePlan({masterId:QL329_MASTER.id,sourceId:chosen.id,
    layer:scenario==='child_as_connector'?'child':'master',scenario,
    childFixture:scenario==='wrong_shell_child'?
      QL329_SHELLS.find(x=>x.id!==chosen.id)!.childFixture:
      scenario==='review_child_context'?chosen.childFixture:undefined});
  function reset(){setShellId(QL329_SHELLS[0].id);setScenario('shell_connection');setShowChild(false);setShowReview(false);}

  return <section className="ql329" data-ql329-release="master-shell-child-truth-v2" aria-labelledby="ql329-title">
    <header className="ql329-heading"><div><p className="ql271-eyebrow">QL-329 · I.T. Command · Architectural Source of Truth v2</p>
      <h3 id="ql329-title">Master → application shell → child businesses</h3>
      <p>We integrate at the <strong>application-shell level</strong>. Campgrounds, landscaping companies, auto detailers and maker shops belong <em>under</em> their own shells, not beside the master as independent connectors.</p></div>
      <strong className="ql329-held">0 / 6 CONNECTED · HOLD</strong></header>
    <div className="ql329-stats"><article><span>Master control plane at QL-329 snapshot</span><strong>PLANNED</strong><small>Historical only; the newer personal owner portal exists</small></article><article><span>Application shells</span><strong>{QL329_BOUNDS.shells}</strong><small>2 existing platform models + 2 future multi-child shells</small></article><article><span>Supporting services</span><strong>{QL329_BOUNDS.support}</strong><small>Broker + private AI Hub, no customer tenants</small></article><article><span>Independent source calls</span><strong>0</strong><small>Architecture view; never a live connector</small></article></div>
    <p role="note" className="ql329-warning"><strong>Archived architecture, dated 3 Nov 2026.</strong> The earlier “no sessions yet” statement was superseded by the QL-367–374 personal Auth and MFA portal. This snapshot remains useful for hierarchy tests, never as an active login prerequisite or authorization for customer records. All six external interfaces remain on HOLD.</p>
    <section className="ql329-panel" aria-labelledby="ql329-topology"><h4 id="ql329-topology">Canonical hierarchy · text and diagram</h4>
      <div className="ql329-top"><div><strong>{QL329_MASTER.label}</strong><small>Architectural parent · NOT DEPLOYED</small></div><div><strong>{QL329_COMMS.label}</strong><small>Communications service · disabled preview</small></div></div>
      <p className="ql329-arrow" aria-label="Proposed parent-to-shell relationships">Master authority, when implemented, would scope four application shells. Comms Hub is a service, not a child business.</p>
      <div className="ql329-shell-grid">{QL329_SHELLS.map(shell=><article key={shell.id}>
        <strong>{shell.label}</strong><small>{shell.shellState.replaceAll('_',' ')}</small>
        <p>Connector identity: <code>{shell.id}</code> · <strong>SHELL LEVEL</strong></p>
        <div className="ql329-child"><span>Owned/default child example</span><strong>{shell.ownerChild}</strong><small>Illustrative fixture only · not a provisioned tenant</small></div>
        <p>{shell.childPolicy.replaceAll('_',' ').toLowerCase()}</p>
        <small className="ql329-hold">DISCONNECTED / HOLD</small></article>)}</div>
      <div className="ql329-support">{QL329_SUPPORT.map(service=><article key={service.id}>
        <strong>{service.label}</strong><small>{service.role.replaceAll('_',' ')}</small>
        <p>{service.transport}</p><small>Supporting service · no customer tenant</small></article>)}</div>
      <p className="ql329-legacy">{QL329_LEGACY_FIXTURE_NOTE}</p>
    </section>
    <section className="ql329-panel" aria-labelledby="ql329-registry"><h4 id="ql329-registry">Source-owned contract / adapter matrix</h4>
      <div className="ql329-table-wrap" role="region" tabIndex={0} aria-label="Scrollable shell and supporting service registry">
        <table><caption>Six source repositories, proposed shell-level identities; no authenticated connection</caption>
          <thead><tr><th scope="col">Shell / support</th><th scope="col">Existing endpoint / broker</th><th scope="col">Identity boundary</th><th scope="col">Current proof</th></tr></thead>
          <tbody>{QL329_SHELLS.map(shell=><tr key={shell.id}><th scope="row"><strong>{shell.label}</strong><small>{shell.repository}</small></th>
            <td><code>{shell.integrationEndpoint}</code><small>{shell.transport}</small></td>
            <td><strong>{shell.tenantScope}</strong><small>Example child: {shell.ownerChild}</small></td>
            <td>Code path exists; peer authentication NOT VERIFIED · HOLD</td></tr>)}
            {QL329_SUPPORT.map(service=><tr key={service.id}><th scope="row"><strong>{service.label}</strong><small>{service.repository}</small></th>
              <td>{service.role}</td><td>{service.tenantKind}</td><td>Connection not authorized · HOLD</td></tr>)}</tbody></table></div>
    </section>
    <section className="ql329-panel" aria-labelledby="ql329-check"><h4 id="ql329-check">Shell / child isolation rehearsal</h4>
      <p>Switch a shell and a mistaken access pattern. These calculations demonstrate what must be denied; no source, database, credential or tenant is contacted.</p>
      <div className="ql329-controls"><label htmlFor="ql329-shell">Selected application shell
        <select id="ql329-shell" value={chosen.id} onChange={e=>{setShellId(e.currentTarget.value);setShowChild(false);}}>
        {QL329_SHELLS.map(x=><option value={x.id} key={x.id}>{x.label}</option>)}</select></label>
        <label htmlFor="ql329-case">Local scope scenario
        <select id="ql329-case" value={scenario} onChange={e=>setScenario(e.currentTarget.value as Ql329Scenario)}>
          {QL329_SCENARIOS.map(x=><option value={x.id} key={x.id}>{x.label}</option>)}</select></label></div>
      <div className="ql329-outcome" role="status" aria-live="polite"><strong>{output.decision}</strong>
        <p>{output.detail}</p><small>Resolved identity: {output.resolvedShell??'NONE'} · Real source GET: {output.privateGets} · Authorizations: {output.ownerApprovals} · Status: {output.status}</small></div>
      <div className="ql329-actions"><button type="button" onClick={()=>setShowChild(x=>!x)} aria-expanded={showChild} aria-controls="ql329-child-preview">Inspect demo child</button>
        <button type="button" onClick={()=>setShowReview(x=>!x)} aria-expanded={showReview} aria-controls="ql329-review">Review regression boundaries</button>
        <button type="button" onClick={reset}>Reset scope</button></div>
      {showChild&&<p id="ql329-child-preview" className="ql329-reveal">Example <strong>{chosen.ownerChild}</strong>, key <code>{chosen.childFixture}</code>. This is NOT an actual tenant ID or a permission grant. {chosen.childPolicy.replaceAll('_',' ').toLowerCase()}.</p>}
      {showReview&&<div id="ql329-review" className="ql329-reveal"><p>Automated pure-model cases: {READBACK.cases} · mapped sources: {READBACK.uniqueSources} · all held: {READBACK.allHeld?'YES':'NO'}. 320–1440 viewport checks are DOM/style checks, not physical-device or screenshot sign-off.</p><p>Performance: release CI measures actual JS/CSS and gzip bytes against recorded budgets. Any over-budget output fails the release instead of being called optimized.</p></div>}
    </section>
    <footer>Live source access {QL329_BOUNDS.privateGets} · secrets read {QL329_BOUNDS.secretReads} · child grants {QL329_BOUNDS.childTenantGrants} · writes {QL329_BOUNDS.sourceWrites} · authenticated master sessions {QL329_BOUNDS.masterSessions} · Windows relay {QL329_BOUNDS.windowsRelay} · ACK {QL329_BOUNDS.ack}. Human device and cross-project integration acceptance are outstanding.</footer>
  </section>;
}

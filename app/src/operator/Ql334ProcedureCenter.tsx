import {useState} from 'react';
import {QL334_CONNECTIONS,QL334_PUBLIC_READBACK,QL334_STAGES} from './ql334ProcedureTruth';
import './ql334-procedure-center.css';

const help='https://github.com/RosevearCreations/rosevear-comms-hub/blob/main/docs/build-records/QL-334_DATABASE_PROCEDURE_ENGINE_RELEASE.md';
const master='https://rosevear-comms-hub.devilndovelive.workers.dev/';

/** Public read-only operational guide; actual private procedures live behind FORCE RLS. */
export function Ql334ProcedureCenter(){
  const [selectedId,setSelectedId]=useState('yw');
  const [showSteps,setShowSteps]=useState(false);
  const selected=QL334_CONNECTIONS.find(x=>x.id===selectedId)??QL334_CONNECTIONS[0];
  return <section className="ql334" data-ql334-status="db-procedure-drafts-private-connections-held"
    aria-labelledby="ql334-title">
    <header className="ql334-head">
      <div><p className="ql271-eyebrow">QL-334 · Database-driven procedures &amp; six-app connection centre</p>
        <h3 id="ql334-title">Connect the Rosevear suite</h3>
        <p>Every application now has a versioned public contract and a source-owned link. Protected procedures, approvals, retries and audit records live in the master database. Authenticated source access remains locked until its original trust proof is verified.</p>
      </div>
      <strong className="ql334-hold">6 SOURCES DISCOVERED · 0 AUTHENTICATED</strong>
    </header>
    <div className="ql334-metrics">
      <article><small>Source manifest pins</small><strong>{QL334_PUBLIC_READBACK.observedSourceManifests} / 6</strong><span>Public metadata only</span></article>
      <article><small>Database procedures</small><strong>{QL334_PUBLIC_READBACK.procedureTemplates}</strong><span>Six shells × three DRAFT templates</span></article>
      <article><small>Scheduled private jobs</small><strong>{QL334_PUBLIC_READBACK.privateJobsQueued}</strong><span>0 active schedules · no workload</span></article>
      <article><small>Private connections</small><strong>{QL334_PUBLIC_READBACK.activePrivateConnections}</strong><span>Require independent signed approval</span></article>
    </div>
    <section className="ql334-panel" aria-labelledby="ql334-sources-title">
      <h4 id="ql334-sources-title">Application connection links</h4>
      <p>Choose an app to open its actual public integration descriptor. This checks which software belongs to the suite; it does not send messages or expose customers.</p>
      <div className="ql334-sources" role="group" aria-label="Choose source application">
        {QL334_CONNECTIONS.map(s=><button key={s.id} type="button"
          className={selected.id===s.id?'ql334-active':''} aria-pressed={selected.id===s.id}
          onClick={()=>setSelectedId(s.id)}>{s.name}</button>)}
      </div>
      <div className="ql334-focus" aria-live="polite">
        <div><small>{selected.kind==='business'?'Business application':'Supporting application'}</small>
          <h5>{selected.name}</h5><p>{selected.description}</p>
          <p><strong>Identity:</strong> <code>{selected.id}</code> → issuer <code>{selected.sourceIssuer}</code></p>
          <p><span className="ql334-ready">PUBLIC DESCRIPTOR OBSERVED</span> <span className="ql334-pending">PRIVATE CONNECTION HOLD</span></p>
        </div>
        <div className="ql334-links">
          <a href={selected.manifestUrl} target="_blank" rel="noopener noreferrer">View source-owned manifest</a>
          {selected.appUrl&&<a href={selected.appUrl} target="_blank" rel="noopener noreferrer">Open application</a>}
          {selected.integrationUrl&&<a href={selected.integrationUrl} target="_blank" rel="noopener noreferrer">Open application’s connection page</a>}
          <a href={master} target="_blank" rel="noopener noreferrer">Open Rosevear Comms Hub</a>
        </div>
      </div>
    </section>
    <section className="ql334-panel" aria-labelledby="ql334-workflow-title">
      <h4 id="ql334-workflow-title">Automated connection procedure</h4>
      <p>The eight mandatory database steps cannot be removed by an operator. A reviewer must differ from the author; signed owner and source proofs are separate requirements. A failed step pauses its source and retains an audit receipt.</p>
      <button className="ql334-details-button" type="button" aria-expanded={showSteps} aria-controls="ql334-stages"
        onClick={()=>setShowSteps(v=>!v)}>{showSteps?'Hide':'Show'} workflow steps and HOLD reasons</button>
      {showSteps&&<ol id="ql334-stages" className="ql334-steps">{QL334_STAGES.map(step=><li key={step.id}>
        <span className={step.state==='OBSERVED'?'ql334-ready':'ql334-pending'}>{step.state}</span>
        <strong>{step.label}</strong><small>{step.detail}</small></li>)}</ol>}
      <p className="ql334-inform"><strong>Why no private connections yet?</strong> The master has zero independently verified workload identities and zero independently verified peer signers. Database configuration cannot manufacture these approvals. The existing six public manifests are available now.</p>
    </section>
    <footer>Master database: six source pins observed · 18 unapproved DRAFTs · zero approved procedures, private jobs or sent communications · Windows relay {QL334_PUBLIC_READBACK.windowsRelay} · <a href={help} target="_blank" rel="noopener noreferrer">QL-334 setup and verification guide</a>. Snapshot: {QL334_PUBLIC_READBACK.observedDate}.</footer>
  </section>;
}

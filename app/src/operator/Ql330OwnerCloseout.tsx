import {useState} from 'react';
import {QL330_PORTAL_EVENTS,QL330_PROCEDURES,QL330_REPORTS,QL330_REVISION_OPTIONS,
  QL330_SHELLS,QL330_STATUS,QL330_SUPPORT,QL330_STEP_LIBRARY,
  ql330InitialDraft,ql330ProposeRevision,ql330Readback,ql330ReviewScope,
  type Ql330ProcedureDraft,type Ql330ProcedureId} from './ql330OwnerCloseout';
import './ql330-owner-closeout.css';

const SUMMARY=ql330Readback();
const sourceUrl='docs/ROSEVEAR_MASTER_CONNECTION_CONTROL_PLANE_V1.md';

export function Ql330OwnerCloseout({mode='it_command'}:{mode?:'it_command'|'management'|'analytics'|'system_status'}){
  const [procedureId,setProcedureId]=useState<Ql330ProcedureId>('connect-readonly');
  const [draft,setDraft]=useState<Ql330ProcedureDraft>(()=>ql330InitialDraft('connect-readonly'));
  const [reviewed,setReviewed]=useState<Readonly<Record<string,boolean>>>({});
  const [selectedRevision,setSelectedRevision]=useState<typeof QL330_REVISION_OPTIONS[number]['id']>('add_review');
  const [revisionError,setRevisionError]=useState('');
  const [showChecklist,setShowChecklist]=useState(false);
  const [showReceipt,setShowReceipt]=useState(false);
  const selected=QL330_PROCEDURES.find(p=>p.id===procedureId)!;
  const audiencePreview=ql330ReviewScope({
    sourceId:'icamp',audience:'child',childId:'camp-rosevear-demo',
    masterSessionVerified:false,ownerGrantVerified:false,sourceProofVerified:false
  });
  const isFull=mode==='it_command';
  const steps=QL330_STEP_LIBRARY.filter(s=>draft.steps.includes(s.id));
  const checkList=[
    {id:'desktop',label:'Check Windows desktop navigation, keyboard and 200% zoom'},
    {id:'tablet',label:'Check tablet portrait/landscape and focus order'},
    {id:'mobile',label:'Check phone touch controls and no sideways clipping'},
    {id:'help',label:'Read I.T., Management, Analytics and Status contextual help'},
    {id:'source',label:'Review Source of Truth and six disconnected source gates'},
    {id:'authority',label:'Collect authentic source-signed proof and independent owner TEST authorization'},
    {id:'tenant',label:'Confirm shell-first YW/iCamp and future Rosie/Devil child isolation'},
    {id:'report',label:'Define portal consent, report access, privacy and retention'}
  ];
  const checked=checkList.filter(item=>reviewed[item.id]).length;
  function choose(id:string){
    const cast=id as Ql330ProcedureId;
    if(!QL330_PROCEDURES.some(p=>p.id===cast))return;
    setProcedureId(cast);setDraft(ql330InitialDraft(cast));setRevisionError('');
  }
  function revise(option:string){
    try{const next=ql330ProposeRevision(draft,option as typeof QL330_REVISION_OPTIONS[number]['id']);setDraft(next);setRevisionError('');}
    catch(error){setRevisionError(error instanceof Error?error.message:'INVALID_PROCEDURE');}
  }
  return <section className="ql330" data-ql330-release="reconciliation-and-control-plane-blueprint-v1" aria-labelledby="ql330-title">
    <header className="ql330-heading">
      <div><p className="ql271-eyebrow">QL-330 · Final setup &amp; future connection control</p>
        <h3 id="ql330-title">Owner handoff, encrypted connection blueprint &amp; managed procedures</h3>
        <p>Versioned shell-level workflows, future client-portal tracking, reporting definitions and independent proof gates. This remains a <strong>disabled-preview software release</strong>, not an activated database control plane or six connected applications.</p></div>
      <strong className="ql330-status">0 / 6 CONNECTED · HOLD</strong>
    </header>
    <div className="ql330-stats">
      <article><span>Previously verified</span><strong>{QL330_STATUS.previousVerified} / 20</strong><small>QL-330 is counted only after release receipt</small></article>
      <article><span>Source roles</span><strong>{SUMMARY.fourShells} + {SUMMARY.twoSupports}</strong><small>Application shells and supports</small></article>
      <article><span>Managed procedure designs</span><strong>{SUMMARY.procedures}</strong><small>Draft only · zero deployed versions</small></article>
      <article><span>Live data/report facts</span><strong>0</strong><small>No customer, portal or reporting data accessed</small></article>
    </div>
    <p role="note" className="ql330-warning"><strong>Database-led without browser secrets.</strong> The design stores configurable profiles, steps, portal-event contracts and report definitions in protected tables, with <em>opaque references</em> to keys in a managed encrypted vault/KMS. It never stores plaintext passwords, a decrypting root key, or secret values in these pages. No master identity, database migration, key ceremony or external connection has been deployed by this build.</p>
    {isFull&&<>
      <section className="ql330-panel" aria-labelledby="ql330-proc-title"><h4 id="ql330-proc-title">Procedure version designer · local proposed changes only</h4>
        <p>A future verified master operator can propose a new procedure version without changing application code. Mandatory proof, authority and signed receipt steps cannot be removed or bypassed. This screen previews revisions; it does not write to a database.</p>
        <div className="ql330-controls"><label htmlFor="ql330-procedure">Procedure template
          <select id="ql330-procedure" value={procedureId} onChange={e=>choose(e.currentTarget.value)}>
            {QL330_PROCEDURES.map(p=><option key={p.id} value={p.id}>{p.label}</option>)}</select></label>
          <label htmlFor="ql330-revision">Safe addition
          <select id="ql330-revision" value={selectedRevision} onChange={e=>setSelectedRevision(e.currentTarget.value as typeof QL330_REVISION_OPTIONS[number]['id'])}>
            {QL330_REVISION_OPTIONS.map(x=><option key={x.id} value={x.id}>{x.label}</option>)}</select></label></div>
        <div className="ql330-actions"><button type="button" onClick={()=>{
          revise(selectedRevision);
        }}>Preview next version</button>
          <button type="button" onClick={()=>{setDraft(ql330InitialDraft(procedureId));setRevisionError('');}}>Revert local draft</button></div>
        <div className="ql330-outcome" role="status" aria-live="polite">{revisionError&&<p>Not changed: {revisionError}</p>}<strong>{selected.label} · proposed v{draft.version} · DRAFT / UNSENT</strong>
          <p>{draft.changeReason}. Mandatory gates remain pinned; approved: NO · persisted: NO · connection activated: NO.</p></div>
        <ol className="ql330-steps">{steps.map(step=><li key={step.id}>
          <strong>{step.label}</strong><span>{step.automation.replaceAll('_',' ')}</span><small>Gate: {step.gate}</small></li>)}</ol>
      </section>
      <section className="ql330-panel" aria-labelledby="ql330-source-title"><h4 id="ql330-source-title">Canonical six-source connection inventory</h4>
        <div className="ql330-scroll" role="region" aria-label="Scrollable six-source registry" tabIndex={0}><table><caption>Four application-shell connectors and two supporting services, all held</caption>
          <thead><tr><th scope="col">Source</th><th scope="col">Connector scope</th><th scope="col">Secret storage</th><th scope="col">Gate status</th></tr></thead>
          <tbody>{QL330_SHELLS.map(s=><tr key={s.id}><th scope="row">{s.label}<small>{s.sourceRepository}</small></th><td>Shell, never child business</td><td>{s.vaultHandle}</td><td>{s.status} · {s.proof}</td></tr>)}
          {QL330_SUPPORT.map(s=><tr key={s.id}><th scope="row">{s.label}</th><td>{s.scope}</td><td>{s.secretHandle}</td><td>{s.status}</td></tr>)}</tbody></table></div>
        <p>Sample child portal access attempt: <strong>{audiencePreview.decision}</strong> · no permission inherited merely from a master shell.</p>
      </section>
    </>}
    {(mode==='it_command'||mode==='management')&&<section className="ql330-panel" aria-labelledby="ql330-portal-title"><h4 id="ql330-portal-title">Client portal activity · schema planning</h4>
      <p>These are proposed source-owned event types. No actual sign-in, booking, client message or customer record has been observed, stored or shared.</p>
      <div className="ql330-chip-grid">{QL330_PORTAL_EVENTS.map(ev=><article key={ev.kind}><strong>{ev.kind.replaceAll('_',' ')}</strong><small>{ev.requires.replaceAll('_',' ')}</small></article>)}</div>
    </section>}
    {(mode==='it_command'||mode==='analytics')&&<section className="ql330-panel" aria-labelledby="ql330-report-title"><h4 id="ql330-report-title">Reporting modules · zero live facts</h4>
      <div className="ql330-scroll" role="region" aria-label="Scrollable reporting catalog" tabIndex={0}><table>
        <caption>Proposed reports requiring individually authorized source lineage</caption>
        <thead><tr><th scope="col">Report</th><th scope="col">Aggregation grain</th><th scope="col">Prerequisite</th></tr></thead><tbody>
        {QL330_REPORTS.map(rep=><tr key={rep.id}><th scope="row">{rep.label}</th><td>{rep.grain}</td><td>{rep.required.replaceAll('_',' ')}</td></tr>)}</tbody></table></div>
    </section>}
    {(mode==='it_command'||mode==='system_status')&&<section className="ql330-panel" aria-labelledby="ql330-accept-title"><h4 id="ql330-accept-title">Owner walkthrough and unresolved authority</h4>
      <p>Ticking a box is a local review aid, <strong>not</strong> evidence of device inspection or proof of outside approval. It neither persists nor changes release status.</p>
      <button type="button" className="ql330-reveal-button" aria-expanded={showChecklist} aria-controls="ql330-checklist" onClick={()=>setShowChecklist(x=>!x)}>
        {showChecklist?'Hide':'Show'} owner walkthrough ({checked} / {checkList.length} checked locally)</button>
      {showChecklist&&<div id="ql330-checklist" className="ql330-checklist">{checkList.map(item=><label key={item.id}>
        <input type="checkbox" checked={!!reviewed[item.id]} onChange={e=>{const checked=e.currentTarget.checked;setReviewed(before=>({...before,[item.id]:checked}));}}/>
        <span>{item.label}</span></label>)}</div>}
      <p>Original source-signed Proof-B, independent custodian, source-owner TEST, audited master identity, per-child grants, vault key custody and Windows relay remain unverified or OFF.</p>
    </section>}
    <section className="ql330-panel" aria-labelledby="ql330-guides"><h4 id="ql330-guides">Reconciliation and next work</h4>
      <p>Batch QL-311–329 has independently verified disabled-preview software receipts. QL-330 adds this final review and an editable-by-version future control-plane specification. No post-330 build is launched automatically.</p>
      <button type="button" className="ql330-reveal-button" aria-expanded={showReceipt} aria-controls="ql330-evidence" onClick={()=>setShowReceipt(x=>!x)}>
        {showReceipt?'Hide':'Show'} source and migration evidence map</button>
      {showReceipt&&<div id="ql330-evidence" className="ql330-reveal"><p>Authoritative source: <code>docs/ROSEVEAR_SOURCE_OF_TRUTH_V2_2026-11-03.md</code></p>
        <p>Procedure/schema blueprint: <code>{sourceUrl}</code></p>
        <p>Proposed SQL only, NOT applied: <code>database/proposals/ql330_master_connection_control_plane.sql</code></p>
        <p>Queue and verified receipts: <code>docs/QL-311-330-FINAL-SETUP-VISUAL-CONNECTION-QUEUE.md</code></p></div>}
    </section>
    <footer>Master provisioned NO · six DISCONNECTED / HOLD · vault handles available 0 · private GET {QL330_STATUS.privateGets} · writes {QL330_STATUS.sourceWrites} · real customer events {QL330_STATUS.portalEvents} · source reports {QL330_STATUS.reportingFactRows} · Windows relay {QL330_STATUS.windowsRelay} · ACK {QL330_STATUS.ack}. All procedural revisions shown here are local drafts only.</footer>
  </section>;
}

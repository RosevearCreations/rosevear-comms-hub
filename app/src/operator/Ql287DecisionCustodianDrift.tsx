import {useState} from 'react';
import {QL270_SOURCES,type Ql270SourceId} from './ql270ConnectionCentre';
import type {Ql279ArrivalClaim} from './ql279ReviewerCustodyEscalation';
import type {Ql286OutcomeComparison,Ql286ConflictFollowup,Ql286AgingFollowup} from './ql286AuthorityOutcomeConflictAging';
import {QL287_OBSERVED_AT,QL287_DECISION_REFERENCE_TYPES,QL287_CUSTODIAN_DISPOSITIONS,
  ql287PrepareDecisionReadback,ql287PrepareCustodianQueue,ql287PrepareDriftFollowup,
  ql287PinnedProofUrl,ql287SourceDrift,ql287AuditPacket,type Ql287DecisionReferenceType,
  type Ql287CustodianDispositionType,type Ql287DecisionReadback,type Ql287CustodianQueue,
  type Ql287DriftFollowup} from './ql287DecisionCustodianDrift';
import './ql277-drift-review.css';
import './ql278-followup-desk.css';
import './ql280-receipt-reconciliation.css';
import './ql281-signature-proof-custody.css';
import './ql282-issuer-publication.css';
import './ql283-issuer-trust-followup.css';
import './ql284-reviewer-crosscheck.css';
import './ql285-authority-provenance.css';
import './ql286-outcome-aging.css';
import './ql287-decision-custodian.css';

type Topic='reviewer'|'custodian'|'refresh';
type Filter='all'|'moved'|'unchanged';
const nameFor=(id:Ql270SourceId)=>QL270_SOURCES.find(row=>row.id===id)?.label??id;

export function Ql287DecisionCustodianDrift({authorityOutcomes,custodianConflicts,sourceAging,
  arrivalClaims,onOpenQl286,onOpenEvidence}:{
  authorityOutcomes:readonly Ql286OutcomeComparison[];custodianConflicts:readonly Ql286ConflictFollowup[];
  sourceAging:readonly Ql286AgingFollowup[];arrivalClaims:readonly Ql279ArrivalClaim[];
  onOpenQl286:()=>void;onOpenEvidence:()=>void;
}){
  const [topic,setTopic]=useState<Topic>('reviewer');
  const [filter,setFilter]=useState<Filter>('all');
  const [selectedOutcome,setSelectedOutcome]=useState('');
  const [decisionType,setDecisionType]=useState<Ql287DecisionReferenceType>('CLAIMED_ISSUER_DECISION_REFERENCE');
  const [decisionRef,setDecisionRef]=useState('');
  const [decisionDrafts,setDecisionDrafts]=useState<Ql287DecisionReadback[]>([]);
  const [selectedConflict,setSelectedConflict]=useState<Ql270SourceId>('rosiedazzlers');
  const [queueReason,setQueueReason]=useState<Ql287CustodianDispositionType>('ORIGINAL_ARTIFACT_STILL_MISSING');
  const [custodianRef,setCustodianRef]=useState('');
  const [custodianDrafts,setCustodianDrafts]=useState<Ql287CustodianQueue[]>([]);
  const [selectedRefresh,setSelectedRefresh]=useState<Ql270SourceId>('rosiedazzlers');
  const [refreshRef,setRefreshRef]=useState('');
  const [refreshDrafts,setRefreshDrafts]=useState<Ql287DriftFollowup[]>([]);
  const [asOf,setAsOf]=useState(()=>new Date());
  const [feedback,setFeedback]=useState('QL-287 public-only source refresh: six SHA pins moved; all six immutable original Proof-B paths still HTTP 404. ACK evidence remains Under Review and parked.');
  const drift=ql287SourceDrift(asOf,arrivalClaims,sourceAging);
  const visible=drift.rows.filter(row=>filter==='all'||(filter==='moved'?row.moved:!row.moved));
  const outcome=authorityOutcomes.find(row=>row.checkId===selectedOutcome)??authorityOutcomes[0];
  const conflict=custodianConflicts.find(row=>row.source===selectedConflict)??custodianConflicts[0];
  const followup=sourceAging.find(row=>row.source===selectedRefresh)??sourceAging[0];
  const packet=ql287AuditPacket(decisionDrafts,custodianDrafts,refreshDrafts,asOf,arrivalClaims,sourceAging);

  function prepareDecision(){
    if(!outcome){setFeedback('Create a QL-286 pending reviewer outcome comparison first.');return;}
    const result=ql287PrepareDecisionReadback(outcome,decisionRef,decisionType,new Date());
    if(!result.ok){setFeedback(result.reason);return;}
    setDecisionDrafts(old=>[...old.filter(row=>row.checkId!==result.draft.checkId),result.draft]);
    setDecisionRef('');setFeedback('Reviewer decision REFERENCE READBACK prepared locally. No original signature or independent decision was received.');
  }
  function prepareCustodian(){
    if(!conflict){setFeedback('Create a QL-286 unresolved Proof-B conflict first.');return;}
    const result=ql287PrepareCustodianQueue(conflict,custodianRef,queueReason,new Date());
    if(!result.ok){setFeedback(result.reason);return;}
    setCustodianDrafts(old=>[...old.filter(row=>row.source!==result.draft.source),result.draft]);
    setCustodianRef('');setFeedback('Custodian disposition queued in this session only. Nothing was sent, received or resolved.');
  }
  function prepareRefresh(){
    if(!followup){setFeedback('Create a QL-286 unexecuted local source aging item first.');return;}
    const result=ql287PrepareDriftFollowup(followup,refreshRef,new Date());
    if(!result.ok){setFeedback(result.reason);return;}
    setRefreshDrafts(old=>[...old.filter(row=>row.source!==result.draft.source),result.draft]);
    setRefreshRef('');setFeedback('Local refresh follow-up prepared; no new GET scheduled or executed.');
  }
  async function copyPacket(){
    try{if(!navigator.clipboard?.writeText)throw Error('Clipboard unavailable');
      await navigator.clipboard.writeText(packet);setFeedback('QL-287 unverified local packet copied; no external transmission.');}
    catch{setFeedback('Clipboard unavailable. Copy from the read-only packet manually; nothing was sent.');}
  }
  return <section className="ql277-review ql280-desk ql281-desk ql282-desk ql283-desk ql284-desk ql285-desk ql286-desk ql287-desk" data-ql287-desk aria-labelledby="ql287-title">
    <header className="ql277-heading"><div><p className="ql271-eyebrow">QL-287 · Independent decision evidence and six-source refresh</p>
      <h4 id="ql287-title">Reviewer decision readback · Custodian conflict queue · Public source drift follow-up</h4>
      <p>Read back only unverified references, review unresolved original custody conflicts, and track newly pinned source changes. No external receipt or decision is accepted by these controls.</p>
    </div><span>INTEGRATIONS DISCONNECTED / HOLD</span></header>
    <div className="ql277-stats" aria-label="QL-287 reviewer, custodian and public source status">
      <div><small>Independent decisions authenticated</small><strong>0</strong><em>{decisionDrafts.length} local readback(s)</em></div>
      <div><small>Source SHA changes</small><strong>{drift.moved} / 6</strong><em>{drift.unchanged} unchanged since QL-286</em></div>
      <div><small>Original Proof-B still absent</small><strong>{drift.missing} / 6</strong><em>Exact immutable HTTP 404</em></div>
      <div><small>ACK delivery evidence</small><strong className="ql282-review-value">Under Review</strong><em>Parked · no action</em></div>
    </div>
    <nav className="ql277-tabs" aria-label="QL-287 independent evidence review workstreams">
      <button type="button" className={topic==='reviewer'?'active':''} aria-current={topic==='reviewer'?'page':undefined} onClick={()=>setTopic('reviewer')}>01 Reviewer decisions</button>
      <button type="button" className={topic==='custodian'?'active':''} aria-current={topic==='custodian'?'page':undefined} onClick={()=>setTopic('custodian')}>02 Custodian dispositions</button>
      <button type="button" className={topic==='refresh'?'active':''} aria-current={topic==='refresh'?'page':undefined} onClick={()=>setTopic('refresh')}>03 Six-app source drift</button>
    </nav>
    {topic==='reviewer'&&<section className="ql277-card" aria-labelledby="ql287-reviewer-title">
      <h5 id="ql287-reviewer-title">Independent reviewer authority decision evidence readback <span>NO AUTHENTICATED DECISION</span></h5>
      <p>QL-286 outcome comparisons remain local and unattested. Select only a nonsecret claimed reference; no real issuer decision, reviewer signature, witnessed trust anchor or owner TEST authorization has been delivered here.</p>
      {authorityOutcomes.length===0?<div className="ql279-empty"><strong>No QL-286 pending reviewer outcome in this session.</strong><p>Open QL-286 and prepare a local outcome comparison first. This panel does not manufacture an independent decision.</p></div>:null}
      <div className="ql277-form-grid"><label htmlFor="ql287-outcome">QL-286 pending reviewer outcome reference
        <select id="ql287-outcome" disabled={!outcome} value={outcome?.checkId??''} onChange={e=>setSelectedOutcome(e.target.value)}>
          {!outcome?<option value="">No local outcome</option>:authorityOutcomes.map(row=><option key={row.checkId} value={row.checkId}>{row.checkId} · {row.reference}</option>)}</select></label>
        <label htmlFor="ql287-decision-type">Claimed external evidence type (not accepted)
          <select id="ql287-decision-type" value={decisionType} onChange={e=>setDecisionType(e.target.value as Ql287DecisionReferenceType)}>
            {QL287_DECISION_REFERENCE_TYPES.map(row=><option key={row.value} value={row.value}>{row.label}</option>)}</select></label>
        <label htmlFor="ql287-decision-ref">Nonsecret decision evidence case reference
          <input id="ql287-decision-ref" maxLength={32} value={decisionRef} onChange={e=>setDecisionRef(e.target.value)} placeholder="DECISION-287-CASE" /></label></div>
      <div className="ql286-status-list"><span>Independent decision: NOT RECEIVED</span><span>Reviewer and issuer: NOT AUTHENTICATED</span><span>Original signed receipt: NOT VERIFIED</span><span>Owner TEST approval: NOT GIVEN</span></div>
      <div className="ql277-actions"><button type="button" disabled={!outcome} onClick={prepareDecision}>Prepare unverified decision readback</button><button type="button" className="secondary" onClick={onOpenQl286}>Open QL-286 outcome comparison</button></div>
      <div className="ql277-results">{decisionDrafts.map(row=><article key={row.checkId}><strong>{row.checkId} · {row.reference}</strong><span>{row.claimedEvidence.replaceAll('_',' ')} · {row.disposition.replaceAll('_',' ')}</span><small>Prior QL-286 {row.previousCase} · {row.preparedAt}</small><p>Accepted NO · independent decision NOT RECEIVED · original signature NOT VERIFIED.</p></article>)}</div>
      <p className="ql277-warning">A case reference is not a signature. No challenge exchange, private signer, reviewer authentication, or real owner permission is performed.</p>
    </section>}
    {topic==='custodian'&&<section className="ql277-card" aria-labelledby="ql287-custodian-title">
      <h5 id="ql287-custodian-title">Original Proof-B custodian conflict disposition queue <span>LOCAL · UNSENT</span></h5>
      <p>Carry an unresolved quarantined QL-286 provenance conflict into a local disposition review. A queue item never authenticates a custodian, routes a receipt, or resolves a source publication exception.</p>
      {custodianConflicts.length===0?<div className="ql279-empty"><strong>No QL-286 quarantined conflict in this session.</strong><p>Open the previous conflict review first. Original Proof-B receipts remain absent.</p></div>:null}
      <div className="ql277-form-grid"><label htmlFor="ql287-conflict">QL-286 unresolved custodian conflict
        <select id="ql287-conflict" disabled={!conflict} value={conflict?.source??''} onChange={e=>setSelectedConflict(e.target.value as Ql270SourceId)}>
          {!conflict?<option value="">No local conflict</option>:custodianConflicts.map(row=><option key={row.source} value={row.source}>{nameFor(row.source)} · {row.reference}</option>)}</select></label>
        <label htmlFor="ql287-queue-reason">Disposition reason (pending independent evidence)
          <select id="ql287-queue-reason" value={queueReason} onChange={e=>setQueueReason(e.target.value as Ql287CustodianDispositionType)}>
            {QL287_CUSTODIAN_DISPOSITIONS.map(row=><option key={row.value} value={row.value}>{row.label}</option>)}</select></label>
        <label htmlFor="ql287-custodian-ref">Nonsecret custodian queue case reference
          <input id="ql287-custodian-ref" maxLength={32} value={custodianRef} onChange={e=>setCustodianRef(e.target.value)} placeholder="CUSTODY-287-CASE" /></label></div>
      <div className="ql277-actions"><button type="button" disabled={!conflict} onClick={prepareCustodian}>Prepare unsent disposition queue item</button><button type="button" className="secondary" onClick={onOpenQl286}>Open QL-286 conflict</button><button type="button" className="secondary" onClick={onOpenEvidence}>Inspect original source evidence</button></div>
      <div className="ql277-results">{custodianDrafts.map(row=><article key={row.source}><strong>{nameFor(row.source)} · {row.reference}</strong><span>{row.queueReason.replaceAll('_',' ')} · {row.disposition.replaceAll('_',' ')}</span><small>QL-286 {row.previousCase} · {row.previousSha.slice(0,12)} → {row.latestSha.slice(0,12)}</small><p>Custodian NOT AUTHENTICATED · sent NO · delivered NO · resolved NO.</p></article>)}</div>
      <p className="ql277-warning">Use only nonsecret synthetic references. Do not paste original private signatures, personal information or credentials.</p>
    </section>}
    {topic==='refresh'&&<section className="ql277-card" aria-labelledby="ql287-drift-title">
      <h5 id="ql287-drift-title">Six-app source refresh and drift follow-up <span>{drift.freshness.replaceAll('_',' ')}</span></h5>
      <p>Actual public-only GitHub main and immutable Proof-B GETs at <time dateTime={QL287_OBSERVED_AT}>{QL287_OBSERVED_AT}</time>. All {drift.moved} source pins changed since QL-286; all {drift.missing} exact original Proof-B files remain HTTP 404. No source application or authenticated gateway was contacted.</p>
      <div className="ql283-timestamp-strip"><span><strong>Current pin age</strong>{drift.ageHours===null?'Clock review':`${drift.ageHours} hour(s)`}</span><span><strong>Next independent recheck due</strong>{drift.nextRecheckAt}</span><span><strong>New notices after snapshot</strong>{drift.rows.reduce((sum,row)=>sum+row.postSnapshotClaims,0)}</span><span><strong>Stale notice pins</strong>{drift.rows.reduce((sum,row)=>sum+row.stalePinClaims,0)}</span></div>
      <div className="ql282-filter-row" role="group" aria-label="Filter QL-287 source refresh drift"><button type="button" aria-pressed={filter==='all'} onClick={()=>setFilter('all')}>All sources ({drift.rows.length})</button><button type="button" aria-pressed={filter==='moved'} onClick={()=>setFilter('moved')}>Changed pins ({drift.moved})</button><button type="button" aria-pressed={filter==='unchanged'} onClick={()=>setFilter('unchanged')}>Unchanged pins ({drift.unchanged})</button></div>
      <div className="ql283-source-list" role="table" aria-label="QL-287 source refresh drift ledger"><div className="ql283-source-row heading" role="row"><span role="columnheader">Source app</span><span role="columnheader">QL-286 → QL-287 pin</span><span role="columnheader">Unresolved exception</span><span role="columnheader">Public original</span></div>
        {visible.map(row=><div className="ql283-source-row" role="row" key={row.source}><strong role="cell">{nameFor(row.source)}</strong><code role="cell" title={`${row.previousSha} → ${row.sha}`}>{row.previousSha?.slice(0,9)} → {row.sha.slice(0,9)}</code><span role="cell"><b>{row.moved?'SHA moved':'SHA unchanged'}</b> · HTTP {row.http}<small>{row.localRecheckDrafts} linked local draft(s) · {row.claims} unverified notices</small></span><a role="cell" href={ql287PinnedProofUrl(row.source)} target="_blank" rel="noopener noreferrer">Pinned public GET ↗</a></div>)}</div>
      <div className="ql284-subsection"><h6>Optional manual source drift follow-up</h6>
        {sourceAging.length===0?<p className="ql284-secondary-copy">All six public exceptions remain visible. A linked follow-up requires a QL-286 unscheduled local recheck-aging item from this session.</p>:null}
        <div className="ql277-form-grid"><label htmlFor="ql287-refresh-source">QL-286 unexecuted source aging item
          <select id="ql287-refresh-source" disabled={!followup} value={followup?.source??''} onChange={e=>setSelectedRefresh(e.target.value as Ql270SourceId)}>{!followup?<option value="">No local aging draft</option>:sourceAging.map(row=><option key={row.source} value={row.source}>{nameFor(row.source)} · {row.reference}</option>)}</select></label>
          <label htmlFor="ql287-refresh-ref">Nonsecret source drift follow-up case<input id="ql287-refresh-ref" maxLength={32} value={refreshRef} onChange={e=>setRefreshRef(e.target.value)} placeholder="REFRESH-287-CASE" /></label></div>
        <div className="ql277-actions"><button type="button" disabled={!followup} onClick={prepareRefresh}>Prepare unscheduled local drift follow-up</button><button type="button" className="secondary" onClick={()=>{setAsOf(new Date());setFeedback('Only the snapshot age changed. No GET was re-executed.');}}>Recalculate age only</button><button type="button" className="secondary" onClick={onOpenQl286}>Open QL-286 aging queue</button></div>
        <div className="ql277-results">{refreshDrafts.map(row=><article key={row.source}><strong>{nameFor(row.source)} · {row.reference}</strong><span>{row.state.replaceAll('_',' ')} · {row.sourceMoved?'SHA moved':'SHA unchanged'}</span><small>QL-286 {row.previousCase} · {row.priorSha.slice(0,12)} → {row.currentSha.slice(0,12)}</small><p>Scheduled NO · executed NO · original accepted NO.</p></article>)}</div></div>
      <p className="ql277-warning">A new SHA or 24-hour snapshot age requires a separately authorized independent public GET, never automatic gateway polling. HTTP 200 alone would not authenticate an original signer.</p>
    </section>}
    <section className="ql277-card ql283-parked-note" aria-labelledby="ql287-ack-title"><h5 id="ql287-ack-title">Six-App Acknowledgement Delivery Evidence Preconditions <span className="ql282-under-review">UNDER REVIEW</span></h5><p><strong>Parked for later.</strong> No ACK delivery receipt, notification, escalation or routing is advanced. Source integrations remain DISCONNECTED / HOLD pending genuine original Proof-B, independent authorization and owner TEST approval.</p></section>
    <section className="ql277-card" aria-labelledby="ql287-packet-title"><h5 id="ql287-packet-title">QL-287 reviewer, custodian and source drift packet <span>LOCAL · NOT SENT</span></h5><label className="ql277-note-label" htmlFor="ql287-packet">Read-only unverified references and genuine public source pins<textarea id="ql287-packet" readOnly rows={11} value={packet}/></label>
      <div className="ql277-actions"><button type="button" onClick={()=>void copyPacket()}>Copy QL-287 local packet</button><button type="button" className="secondary" onClick={()=>{setDecisionDrafts([]);setCustodianDrafts([]);setRefreshDrafts([]);setFeedback('QL-287 local drafts cleared; actual public evidence and ACK status unchanged.');}}>Clear QL-287 local drafts</button></div><p role="status" aria-live="polite" className="ql287-feedback">{feedback}</p></section>
  </section>;
}

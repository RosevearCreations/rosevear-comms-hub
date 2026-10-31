import {useState,type Dispatch,type SetStateAction} from 'react';
import {QL270_SOURCES,type Ql270SourceId} from './ql270ConnectionCentre';
import type {Ql287DecisionReadback,Ql287CustodianQueue,Ql287DriftFollowup} from './ql287DecisionCustodianDrift';
import {QL288_OBSERVED_AT,QL288_REVIEWER_GAPS,QL288_CUSTODIAN_PREFLIGHT_GAPS,
  ql288PrepareReviewerIndependence,ql288PrepareCustodianResolution,ql288PrepareImmutableQueue,
  ql288ImmutableExceptions,ql288PinnedProofUrl,ql288AuditPacket,
  type Ql288ReviewerGap,type Ql288CustodianGap,type Ql288ReviewerIndependenceAudit,
  type Ql288CustodianResolutionPreflight,type Ql288ImmutableExceptionQueue} from './ql288ReceiptCustodianSourceQueue';
import './ql287-decision-custodian.css';
import './ql288-receipt-custodian-source.css';

type Workstream='independence'|'custodian'|'source';
type Filter='all'|'moved'|'stable';
const nameFor=(id:Ql270SourceId)=>QL270_SOURCES.find(row=>row.id===id)?.label??id;

export function Ql288ReceiptCustodianSourceQueue({decisionReadbacks,custodianDispositions,sourceRefreshes,
  reviewerAudits,setReviewerAudits,custodianPreflights,setCustodianPreflights,
  immutableQueue,setImmutableQueue,onOpenQl287,onOpenEvidence}:{
  decisionReadbacks:readonly Ql287DecisionReadback[];custodianDispositions:readonly Ql287CustodianQueue[];
  sourceRefreshes:readonly Ql287DriftFollowup[];
  reviewerAudits:Ql288ReviewerIndependenceAudit[];
  setReviewerAudits:Dispatch<SetStateAction<Ql288ReviewerIndependenceAudit[]>>;
  custodianPreflights:Ql288CustodianResolutionPreflight[];
  setCustodianPreflights:Dispatch<SetStateAction<Ql288CustodianResolutionPreflight[]>>;
  immutableQueue:Ql288ImmutableExceptionQueue[];
  setImmutableQueue:Dispatch<SetStateAction<Ql288ImmutableExceptionQueue[]>>;
  onOpenQl287:()=>void;onOpenEvidence:()=>void;
}){
  const [workstream,setWorkstream]=useState<Workstream>('independence');
  const [filter,setFilter]=useState<Filter>('all');
  const [selectedDecision,setSelectedDecision]=useState('');
  const [reviewerRef,setReviewerRef]=useState('');
  const [issuerRef,setIssuerRef]=useState('');
  const [reviewerGap,setReviewerGap]=useState<Ql288ReviewerGap>('INDEPENDENT_REVIEWER_RECEIPT_ABSENT');
  const [selectedCustody,setSelectedCustody]=useState<Ql270SourceId>('rosiedazzlers');
  const [custodyRef,setCustodyRef]=useState('');
  const [custodyGap,setCustodyGap]=useState<Ql288CustodianGap>('ORIGINAL_SIGNED_ARTIFACT_ABSENT');
  const [selectedSource,setSelectedSource]=useState<Ql270SourceId>('rosiedazzlers');
  const [queueRef,setQueueRef]=useState('');
  const [asOf,setAsOf]=useState(()=>new Date());
  const [feedback,setFeedback]=useState('Public QL-288 source recheck: five moved pins, one unchanged pin and six missing original Proof-B paths. No authenticated GET, custodian delivery or reviewer decision.');
  const report=ql288ImmutableExceptions(asOf,sourceRefreshes);
  const visible=report.rows.filter(row=>filter==='all'||(filter==='moved'?row.moved:!row.moved));
  const decision=decisionReadbacks.find(row=>row.checkId===selectedDecision)??decisionReadbacks[0];
  const custody=custodianDispositions.find(row=>row.source===selectedCustody)??custodianDispositions[0];
  const source=sourceRefreshes.find(row=>row.source===selectedSource)??sourceRefreshes[0];
  const packet=ql288AuditPacket(reviewerAudits,custodianPreflights,immutableQueue,asOf,sourceRefreshes);

  function prepareReviewer(){
    if(!decision){setFeedback('Prepare an unattested QL-287 decision readback first.');return;}
    const result=ql288PrepareReviewerIndependence(decision,reviewerRef,issuerRef,reviewerGap,new Date());
    if(!result.ok){setFeedback(result.reason);return;}
    setReviewerAudits(rows=>[...rows.filter(row=>row.checkId!==result.draft.checkId),result.draft]);
    setReviewerRef('');setIssuerRef('');
    setFeedback('Independent receipt gap audit recorded locally. Separate references do not authenticate independent people, a signature or an authority decision.');
  }
  function prepareCustody(){
    if(!custody){setFeedback('Prepare an unresolved QL-287 custodian disposition first.');return;}
    const result=ql288PrepareCustodianResolution(custody,custodyRef,custodyGap,new Date());
    if(!result.ok){setFeedback(result.reason);return;}
    setCustodianPreflights(rows=>[...rows.filter(row=>row.source!==result.draft.source),result.draft]);
    setCustodyRef('');setFeedback('Original custody resolution PRE-FLIGHT ONLY prepared. No original delivered, no signature verified and no conflict resolved.');
  }
  function prepareRecheck(){
    if(!source){setFeedback('Prepare a QL-287 unexecuted local refresh follow-up first.');return;}
    const result=ql288PrepareImmutableQueue(source,queueRef,new Date());
    if(!result.ok){setFeedback(result.reason);return;}
    setImmutableQueue(rows=>[...rows.filter(row=>row.source!==result.draft.source),result.draft]);
    setQueueRef('');setFeedback('Immutable source exception queued locally. No GET was scheduled, sent or executed.');
  }
  async function copyPacket(){
    try{if(!navigator.clipboard?.writeText)throw Error('Clipboard unavailable');
      await navigator.clipboard.writeText(packet);setFeedback('Unverified QL-288 local audit packet copied. No network transmission.');}
    catch{setFeedback('Clipboard unavailable. Read-only packet remains on screen; nothing was sent.');}
  }
  return <section className="ql277-review ql280-desk ql281-desk ql282-desk ql283-desk ql284-desk ql285-desk ql286-desk ql287-desk ql288-desk" data-ql288-desk aria-labelledby="ql288-title">
    <header className="ql277-heading"><div><p className="ql271-eyebrow">QL-288 · Independent receipt and original custody safeguards</p>
      <h4 id="ql288-title">Reviewer receipt independence · Original custodian resolution preflight · Six-app immutable source queue</h4>
      <p>Compare nonsecret reference gaps and triage source exceptions against observed immutable pins. These are local review aids—not genuine external custody, signer or approval evidence.</p>
    </div><span>DISCONNECTED / HOLD</span></header>
    <div className="ql277-stats" aria-label="QL-288 verified outcomes and source exceptions">
      <div><small>Authenticated independent receipts</small><strong>0</strong><em>{reviewerAudits.length} local gap audit(s)</em></div>
      <div><small>Original custody resolutions</small><strong>0</strong><em>{custodianPreflights.length} unverified preflight(s)</em></div>
      <div><small>Moved / stable source pins</small><strong>{report.moved} / {report.unchanged}</strong><em>{report.missing} immutable Proof-B 404s</em></div>
      <div><small>ACK delivery evidence</small><strong className="ql282-review-value">Under Review</strong><em>Parked for later</em></div>
    </div>
    <nav className="ql277-tabs" aria-label="QL-288 review workstreams">
      <button type="button" className={workstream==='independence'?'active':''} aria-current={workstream==='independence'?'page':undefined} onClick={()=>setWorkstream('independence')}>01 Reviewer independence</button>
      <button type="button" className={workstream==='custodian'?'active':''} aria-current={workstream==='custodian'?'page':undefined} onClick={()=>setWorkstream('custodian')}>02 Original custody preflight</button>
      <button type="button" className={workstream==='source'?'active':''} aria-current={workstream==='source'?'page':undefined} onClick={()=>setWorkstream('source')}>03 Immutable source exceptions</button>
    </nav>
    {workstream==='independence'&&<section className="ql277-card" aria-labelledby="ql288-reviewer-title">
      <h5 id="ql288-reviewer-title">Independent reviewer decision receipt gap audit <span>NOT AUTHENTICATED</span></h5>
      <p>Compare distinct claimed reviewer receipt and issuer authority case references to the QL-287 decision readback. Distinct strings never establish independent identities, a signature chain, or a genuine issuer decision.</p>
      {decisionReadbacks.length===0?<div className="ql279-empty"><strong>No QL-287 decision readbacks in this session.</strong><p>Open QL-287 first to prepare an explicitly unverified local reference; external evidence is not inferred.</p></div>:null}
      <div className="ql277-form-grid"><label htmlFor="ql288-decision">QL-287 unverified decision case
        <select id="ql288-decision" disabled={!decision} value={decision?.checkId??''} onChange={e=>setSelectedDecision(e.target.value)}>{!decision?<option value="">No local decision</option>:decisionReadbacks.map(row=><option key={row.checkId} value={row.checkId}>{row.checkId} · {row.reference}</option>)}</select></label>
        <label htmlFor="ql288-reviewer-ref">Claimed reviewer receipt case (nonsecret)
          <input id="ql288-reviewer-ref" maxLength={32} value={reviewerRef} onChange={e=>setReviewerRef(e.target.value)} placeholder="REVIEWER-288-CASE"/></label>
        <label htmlFor="ql288-issuer-ref">Separate claimed issuer authority case (nonsecret)
          <input id="ql288-issuer-ref" maxLength={32} value={issuerRef} onChange={e=>setIssuerRef(e.target.value)} placeholder="ISSUER-288-CASE"/></label>
        <label htmlFor="ql288-reviewer-gap">Open independence gap
          <select id="ql288-reviewer-gap" value={reviewerGap} onChange={e=>setReviewerGap(e.target.value as Ql288ReviewerGap)}>{QL288_REVIEWER_GAPS.map(row=><option key={row.value} value={row.value}>{row.label}</option>)}</select></label></div>
      <div className="ql286-status-list"><span>Independent reviewer: NOT ESTABLISHED</span><span>Original receipt: NOT RECEIVED</span><span>Issuer: NOT AUTHENTICATED</span><span>Owner TEST approval: NOT GIVEN</span></div>
      <div className="ql277-actions"><button type="button" disabled={!decision} onClick={prepareReviewer}>Prepare independence gap audit</button><button type="button" className="secondary" onClick={onOpenQl287}>Open QL-287 readback</button></div>
      <div className="ql277-results">{reviewerAudits.map(row=><article key={row.checkId}><strong>{row.checkId} · {row.reviewerReceiptReference} / {row.issuerAuthorityReference}</strong><span>{row.gap.replaceAll('_',' ')} · {row.state.replaceAll('_',' ')}</span><small>QL-287 {row.previousCase} · {row.preparedAt}</small><p>Independent identity NOT ESTABLISHED · decision accepted NO · external review executed NO.</p></article>)}</div>
      <p className="ql277-warning">ⓘ Never paste signatures, credentials, personal identity data or raw protected receipts. A new case reference is not independent evidence.</p>
    </section>}
    {workstream==='custodian'&&<section className="ql277-card" aria-labelledby="ql288-custodian-title">
      <h5 id="ql288-custodian-title">Original Proof-B resolution evidence preflight <span>CONFLICT OPEN</span></h5>
      <p>Prepare a local checklist for the unresolved QL-287 custodian disposition. Original signed artifact, custodian/witness identity, chain-of-custody and independent resolution authority remain unverified.</p>
      {custodianDispositions.length===0?<div className="ql279-empty"><strong>No QL-287 custodian dispositions in this session.</strong><p>Open QL-287 to prepare an unsent local conflict before assessing resolution preconditions.</p></div>:null}
      <div className="ql277-form-grid"><label htmlFor="ql288-custody-source">QL-287 open custodian case
        <select id="ql288-custody-source" disabled={!custody} value={custody?.source??''} onChange={e=>setSelectedCustody(e.target.value as Ql270SourceId)}>{!custody?<option value="">No local custody case</option>:custodianDispositions.map(row=><option key={row.source} value={row.source}>{nameFor(row.source)} · {row.reference}</option>)}</select></label>
        <label htmlFor="ql288-custody-gap">Unmet original resolution precondition
          <select id="ql288-custody-gap" value={custodyGap} onChange={e=>setCustodyGap(e.target.value as Ql288CustodianGap)}>{QL288_CUSTODIAN_PREFLIGHT_GAPS.map(row=><option key={row.value} value={row.value}>{row.label}</option>)}</select></label>
        <label htmlFor="ql288-custody-ref">Local preflight case (nonsecret)
          <input id="ql288-custody-ref" maxLength={32} value={custodyRef} onChange={e=>setCustodyRef(e.target.value)} placeholder="PREFLIGHT-288-CASE"/></label></div>
      <div className="ql288-checkpoints" aria-label="Original Proof-B resolution prerequisites"><span><b>01</b> Signed original <em>ABSENT</em></span><span><b>02</b> Custodian / witness <em>UNVERIFIED</em></span><span><b>03</b> Resolution authority <em>UNVERIFIED</em></span><span><b>04</b> External delivery <em>NOT EXECUTED</em></span></div>
      <div className="ql277-actions"><button type="button" disabled={!custody} onClick={prepareCustody}>Prepare unresolved custody preflight</button><button type="button" className="secondary" onClick={onOpenQl287}>Open QL-287 custodian queue</button><button type="button" className="secondary" onClick={onOpenEvidence}>Inspect public source evidence</button></div>
      <div className="ql277-results">{custodianPreflights.map(row=><article key={row.source}><strong>{nameFor(row.source)} · {row.reference}</strong><span>{row.gap.replaceAll('_',' ')} · {row.state.replaceAll('_',' ')}</span><small>QL-287 {row.previousCase} · {row.priorSha.slice(0,10)} → {row.currentSha.slice(0,10)}</small><p>Original NOT VERIFIED · resolution receipt NOT RECEIVED · accepted NO · resolved NO.</p></article>)}</div>
      <p className="ql277-warning">ⓘ A preflight checklist neither requests nor acknowledges an original custody artifact. No Proof-B publication conflict is closed here.</p>
    </section>}
    {workstream==='source'&&<section className="ql277-card" aria-labelledby="ql288-source-title">
      <h5 id="ql288-source-title">Six-app immutable original source exception queue <span>{report.freshness.replaceAll('_',' ')}</span></h5>
      <p>Public-only `main` SHA lookup and exact immutable `docs/integration/ql246-source-proof.json` check at <time dateTime={QL288_OBSERVED_AT}>{QL288_OBSERVED_AT}</time>. {report.moved} pins moved, {report.unchanged} stayed unchanged, all {report.missing} returned HTTP 404. No authenticated gateway GET or automatic polling was performed.</p>
      <div className="ql283-timestamp-strip"><span><strong>Snapshot age</strong>{report.ageHours===null?'Clock review':`${report.ageHours} hour(s)`}</span><span><strong>Next 24-hour recheck due</strong>{report.nextRecheckAt}</span><span><strong>Local unsent recheck cases</strong>{immutableQueue.length}</span><span><strong>Verified originals</strong>0</span></div>
      <div className="ql282-filter-row" role="group" aria-label="Filter QL-288 source exceptions"><button type="button" aria-pressed={filter==='all'} onClick={()=>setFilter('all')}>All sources ({report.rows.length})</button><button type="button" aria-pressed={filter==='moved'} onClick={()=>setFilter('moved')}>Changed pins ({report.moved})</button><button type="button" aria-pressed={filter==='stable'} onClick={()=>setFilter('stable')}>Stable pins ({report.unchanged})</button></div>
      <div className="ql283-source-list" role="table" aria-label="QL-288 immutable source exception ledger"><div className="ql283-source-row heading" role="row"><span role="columnheader">Source app</span><span role="columnheader">QL-287 → QL-288 pin</span><span role="columnheader">Original exception</span><span role="columnheader">Public immutable path</span></div>
        {visible.map(row=><div className="ql283-source-row" role="row" key={row.source}><strong role="cell">{nameFor(row.source)}</strong><code role="cell" title={`${row.priorSha} → ${row.sha}`}>{row.priorSha?.slice(0,9)} → {row.sha.slice(0,9)}</code><span role="cell"><b>{row.moved?'SHA changed':'SHA stable'}</b> · HTTP {row.http}<small>{row.linkedDrafts} predecessor draft(s) · ORIGINAL MISSING</small></span><a role="cell" href={ql288PinnedProofUrl(row.source)} target="_blank" rel="noopener noreferrer">Pinned GET ↗</a></div>)}</div>
      <div className="ql284-subsection"><h6>Optional local immutable source recheck work item</h6>
        {sourceRefreshes.length===0?<p className="ql284-secondary-copy">All six observed exceptions remain visible. Queue creation requires a QL-287 unexecuted follow-up in this session.</p>:null}
        <div className="ql277-form-grid"><label htmlFor="ql288-recheck-source">QL-287 unscheduled source follow-up
          <select id="ql288-recheck-source" disabled={!source} value={source?.source??''} onChange={e=>setSelectedSource(e.target.value as Ql270SourceId)}>{!source?<option value="">No local predecessor</option>:sourceRefreshes.map(row=><option key={row.source} value={row.source}>{nameFor(row.source)} · {row.reference}</option>)}</select></label>
          <label htmlFor="ql288-recheck-ref">Distinct nonsecret recheck queue reference<input id="ql288-recheck-ref" maxLength={32} value={queueRef} onChange={e=>setQueueRef(e.target.value)} placeholder="RECHECK-288-CASE"/></label></div>
        <div className="ql277-actions"><button type="button" disabled={!source} onClick={prepareRecheck}>Prepare unsent immutable recheck item</button><button type="button" className="secondary" onClick={()=>{setAsOf(new Date());setFeedback('Only the elapsed snapshot age was refreshed; no new GET performed.');}}>Recalculate snapshot age</button><button type="button" className="secondary" onClick={onOpenQl287}>Open QL-287 follow-ups</button></div>
        <div className="ql277-results">{immutableQueue.map(row=><article key={row.source}><strong>{nameFor(row.source)} · {row.reference}</strong><span>{row.pinMoved?'Changed pin':'Stable pin'} · {row.state.replaceAll('_',' ')}</span><small>QL-287 {row.previousCase} · {row.previousSha.slice(0,10)} → {row.currentSha.slice(0,10)}</small><p>Queued externally NO · scheduled NO · independent GET NOT EXECUTED · accepted original NO.</p></article>)}</div></div>
      <p className="ql277-warning">ⓘ Even a new HTTP 200 response cannot establish the original signer or independent custody; any live GET requires a separate explicit gate.</p>
    </section>}
    <section className="ql277-card ql283-parked-note" aria-labelledby="ql288-ack-title"><h5 id="ql288-ack-title">Six-App Acknowledgement Delivery Evidence Preconditions <span className="ql282-under-review">UNDER REVIEW</span></h5><p><strong>Parked for later.</strong> No delivery receipt, acknowledgement, routing, alert or follow-up has been started. All six integrations remain DISCONNECTED / HOLD, pending genuine independently verifiable original Proof-B and owner TEST permission.</p></section>
    <section className="ql277-card" aria-labelledby="ql288-packet-title"><h5 id="ql288-packet-title">QL-288 local audit packet <span>UNVERIFIED · NOT SENT</span></h5><label className="ql277-note-label" htmlFor="ql288-packet">Read-only public pins and local precondition references<textarea id="ql288-packet" readOnly rows={10} value={packet}/></label>
      <div className="ql277-actions"><button type="button" onClick={()=>void copyPacket()}>Copy QL-288 local packet</button><button type="button" className="secondary" onClick={()=>{setReviewerAudits([]);setCustodianPreflights([]);setImmutableQueue([]);setFeedback('Only QL-288 local drafts cleared. Public source observations and parked ACK status are unchanged.');}}>Clear QL-288 local drafts</button></div><p className="ql287-feedback" role="status" aria-live="polite">{feedback}</p></section>
  </section>;
}

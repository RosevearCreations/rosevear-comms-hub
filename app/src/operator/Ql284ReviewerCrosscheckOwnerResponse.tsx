import {useState,type Dispatch,type SetStateAction} from 'react';
import {QL270_SOURCES,type Ql270SourceId} from './ql270ConnectionCentre';
import type {Ql279ArrivalClaim} from './ql279ReviewerCustodyEscalation';
import type {Ql283TrustReference,Ql283OwnerFollowup,Ql283RecheckDraft} from './ql283IssuerTrustOwnerFollowup';
import {QL284_OBSERVED_AT,QL284_REVIEWER_CROSSCHECK_GATES,QL284_OWNER_RESPONSE_CLAIM_TYPES,
  ql284AuditPacket,ql284PinnedProofUrl,ql284PrepareCrossCheck,ql284PrepareOwnerResponse,
  ql284PrepareSourceFollowup,ql284SourceRevalidation,
  type Ql284OwnerResponseType,type Ql284ReviewerCrossCheck,type Ql284OwnerResponse,type Ql284SourceFollowup}
  from './ql284ReviewerCrosscheckOwnerResponse';
import './ql277-drift-review.css';
import './ql278-followup-desk.css';
import './ql280-receipt-reconciliation.css';
import './ql281-signature-proof-custody.css';
import './ql282-issuer-publication.css';
import './ql283-issuer-trust-followup.css';
import './ql284-reviewer-crosscheck.css';

type Topic='reviewer'|'response'|'revalidation';
type Filter='all'|'moved'|'unchanged';
const nameFor=(id:Ql270SourceId)=>QL270_SOURCES.find(row=>row.id===id)?.label??id;

export function Ql284ReviewerCrosscheckOwnerResponse({trustDrafts,ownerDrafts,recheckDrafts,arrivalClaims,reviews,setReviews,responses,setResponses,followups,setFollowups,onOpenQl283,onOpenEvidence}:{
  trustDrafts:readonly Ql283TrustReference[];ownerDrafts:readonly Ql283OwnerFollowup[];
  recheckDrafts:readonly Ql283RecheckDraft[];arrivalClaims:readonly Ql279ArrivalClaim[];
  reviews:Ql284ReviewerCrossCheck[];setReviews:Dispatch<SetStateAction<Ql284ReviewerCrossCheck[]>>;
  responses:Ql284OwnerResponse[];setResponses:Dispatch<SetStateAction<Ql284OwnerResponse[]>>;
  followups:Ql284SourceFollowup[];setFollowups:Dispatch<SetStateAction<Ql284SourceFollowup[]>>;
  onOpenQl283:()=>void;onOpenEvidence:()=>void;
}) {
  const [topic,setTopic]=useState<Topic>('reviewer');
  const [filter,setFilter]=useState<Filter>('all');
  const [selectedTrust,setSelectedTrust]=useState('');
  const [reviewRef,setReviewRef]=useState('');
  const [selectedOwner,setSelectedOwner]=useState<Ql270SourceId>('rosiedazzlers');
  const [responseRef,setResponseRef]=useState('');
  const [responseType,setResponseType]=useState<Ql284OwnerResponseType>('ORIGINAL_PUBLICATION_PENDING');
  const [selectedRecheck,setSelectedRecheck]=useState<Ql270SourceId>('rosiedazzlers');
  const [followupRef,setFollowupRef]=useState('');
  const [asOf,setAsOf]=useState(()=>new Date());
  const [feedback,setFeedback]=useState('QL-284 public revalidation: four SHAs changed, two unchanged, all six original Proof-B paths HTTP 404. ACK delivery evidence stays Under Review — parked.');
  const revalidation=ql284SourceRevalidation(asOf,arrivalClaims);
  const visible=revalidation.rows.filter(row=>filter==='all'||(filter==='moved'?row.moved:!row.moved));
  const trust=trustDrafts.find(row=>row.checkId===selectedTrust)??trustDrafts[0];
  const owner=ownerDrafts.find(row=>row.source===selectedOwner)??ownerDrafts[0];
  const recheck=recheckDrafts.find(row=>row.source===selectedRecheck)??recheckDrafts[0];
  const packet=ql284AuditPacket(reviews,responses,followups,asOf,arrivalClaims);

  function prepareCrossCheck(){
    if(!trust){setFeedback('Prepare a QL-283 issuer trust-reference draft to establish predecessor context.');return;}
    const result=ql284PrepareCrossCheck(trust,reviewRef,new Date());
    if(!result.ok){setFeedback(result.reason);return;}
    setReviews(old=>[...old.filter(row=>row.checkId!==result.draft.checkId),result.draft]);
    setReviewRef('');setFeedback('Independent reviewer CROSS-CHECK REQUEST drafted locally. No reviewer or original trust evidence was authenticated.');
  }
  function prepareResponse(){
    if(!owner){setFeedback('Prepare a QL-283 unresolved publication owner follow-up before recording a response claim.');return;}
    const result=ql284PrepareOwnerResponse(owner,responseRef,responseType,new Date());
    if(!result.ok){setFeedback(result.reason);return;}
    setResponses(old=>[...old.filter(row=>row.source!==result.draft.source),result.draft]);
    setResponseRef('');setFeedback('Unverified owner RESPONSE CLAIM recorded locally. No owner authentication, delivery or publication verification occurred.');
  }
  function prepareSourceFollowup(){
    if(!recheck){setFeedback('Prepare a QL-283 manual recheck draft before creating a revalidation follow-up.');return;}
    const result=ql284PrepareSourceFollowup(recheck,followupRef,new Date());
    if(!result.ok){setFeedback(result.reason);return;}
    setFollowups(old=>[...old.filter(row=>row.source!==result.draft.source),result.draft]);
    setFollowupRef('');setFeedback('Manual source revalidation follow-up prepared locally. No new GET or external job was executed.');
  }
  async function copyPacket(){
    try {if(!navigator.clipboard?.writeText)throw Error('Clipboard unavailable');
      await navigator.clipboard.writeText(packet);setFeedback('QL-284 local packet copied; no external action taken.');}
    catch {setFeedback('Clipboard unavailable; select the read-only packet to copy manually. Nothing was sent.');}
  }

  return <section className="ql277-review ql280-desk ql281-desk ql282-desk ql283-desk ql284-desk" data-ql284-desk aria-labelledby="ql284-title">
    <header className="ql277-heading"><div>
      <p className="ql271-eyebrow">QL-284 · Independent review continuity</p>
      <h4 id="ql284-title">Reviewer trust cross-check · Owner response intake · Proof-B revalidation</h4>
      <p>Trace prior unverified references, record local claims without assigning external authority, and inspect freshly pinned public originals across all six source applications.</p>
    </div><span>INTEGRATIONS DISCONNECTED / HOLD</span></header>

    <div className="ql277-stats" aria-label="QL-284 verification and parked workstream status">
      <div><small>Independently verified reviewers</small><strong>0</strong><em>{reviews.length} local pending cross-check(s)</em></div>
      <div><small>Source main SHAs moved</small><strong>{revalidation.moved} / 6</strong><em>{revalidation.unchanged} unchanged since QL-283</em></div>
      <div><small>Original signed Proof-B missing</small><strong>{revalidation.missing} / 6</strong><em>Exact public immutable HTTP 404</em></div>
      <div><small>ACK delivery evidence</small><strong className="ql282-review-value">Under Review</strong><em>Parked for later · no action</em></div>
    </div>

    <nav className="ql277-tabs" aria-label="QL-284 review topics">
      <button type="button" className={topic==='reviewer'?'active':''} aria-current={topic==='reviewer'?'page':undefined} onClick={()=>setTopic('reviewer')}>01 Reviewer trust cross-check</button>
      <button type="button" className={topic==='response'?'active':''} aria-current={topic==='response'?'page':undefined} onClick={()=>setTopic('response')}>02 Publication owner response</button>
      <button type="button" className={topic==='revalidation'?'active':''} aria-current={topic==='revalidation'?'page':undefined} onClick={()=>setTopic('revalidation')}>03 Six-app Proof-B revalidation</button>
    </nav>

    {topic==='reviewer'&&<section className="ql277-card" aria-labelledby="ql284-reviewer-title">
      <h5 id="ql284-reviewer-title">Independent reviewer trust-reference cross-check <span>0 / {QL284_REVIEWER_CROSSCHECK_GATES.length} VERIFIED</span></h5>
      <p>A QL-283 reference is a predecessor claim, not an authenticated reviewer or trusted key. Seven independent trust, signature, custody and TEST-authorization gates must be met externally before any verified conclusion.</p>
      {trustDrafts.length===0?<div className="ql279-empty"><strong>No QL-283 trust-reference draft in this session.</strong><p>Use the prior issuer trust panel to create a nonsecret predecessor reference. Neither panel can authenticate a reviewer.</p></div>:
        <div className="ql281-source-grid">{trustDrafts.map(row=><article key={row.checkId}><strong>{row.checkId}</strong><span>{row.trustReference}</span><small>Issuer {row.issuer.replaceAll('_',' ')} · key {row.keyPin.replaceAll('_',' ')}</small></article>)}</div>}
      <div className="ql277-form-grid"><label htmlFor="ql284-trust-source">QL-283 unverified trust reference
        <select id="ql284-trust-source" disabled={!trust} value={trust?.checkId??''} onChange={event=>setSelectedTrust(event.target.value)}>
          {!trust?<option value="">No local reference</option>:trustDrafts.map(row=><option key={row.checkId} value={row.checkId}>{row.checkId} · {row.trustReference}</option>)}</select></label>
        <label htmlFor="ql284-review-ref">Independent cross-check case reference CLAIM (nonsecret)
          <input id="ql284-review-ref" maxLength={32} value={reviewRef} onChange={event=>setReviewRef(event.target.value)} placeholder="Example: CROSSCHECK-284-CASE" /></label></div>
      <ol className="ql278-gate-list" aria-label="Seven independent reviewer cross-check gates">{QL284_REVIEWER_CROSSCHECK_GATES.map(gate=><li key={gate.id}>
        <span aria-hidden="true">!</span><div><strong>{gate.label}</strong><small>{gate.status.replaceAll('_',' ')} · NOT SATISFIED</small></div></li>)}</ol>
      <div className="ql277-actions"><button type="button" disabled={!trust} onClick={prepareCrossCheck}>Prepare independent cross-check request</button>
        <button type="button" className="secondary" onClick={onOpenQl283}>Open QL-283 trust source</button></div>
      <div className="ql277-results">{reviews.map(row=><article key={row.checkId}><strong>{row.checkId} · {row.caseReference}</strong>
        <span>{row.disposition.replaceAll('_',' ')} · {row.state.replaceAll('_',' ')}</span><small>QL-283 trust: {row.trustReference} · {row.preparedAt}</small>
        <p>Reviewer NOT AUTHENTICATED · issuer NOT AUTHENTICATED · key NOT VERIFIED · signature NOT VERIFIED.</p></article>)}</div>
      <p className="ql277-warning">No independent reviewer or original challenge signer has been authenticated by this UI. A local string is never proof of issuer trust.</p>
    </section>}

    {topic==='response'&&<section className="ql277-card" aria-labelledby="ql284-owner-title">
      <h5 id="ql284-owner-title">Source-publication owner response intake <span>UNVERIFIED CLAIMS ONLY</span></h5>
      <p>Capture a nonsecret reference and the *claimed* response category from an existing QL-283 local owner follow-up. This does not send an inquiry, verify the claimed speaker or accept an original signed Proof-B.</p>
      {ownerDrafts.length===0?<div className="ql279-empty"><strong>No QL-283 publication owner follow-up in this session.</strong><p>Open QL-283 and prepare a local follow-up from a genuine QL-282 publication exception first.</p></div>:
        <div className="ql281-source-grid">{ownerDrafts.map(row=><article key={row.source}><strong>{nameFor(row.source)}</strong><span>{row.reference}</span><small>Prior pin {row.currentSourceSha.slice(0,12)} · owner contacted NO</small></article>)}</div>}
      <div className="ql277-form-grid"><label htmlFor="ql284-owner-source">Unresolved QL-283 publication owner follow-up
        <select id="ql284-owner-source" disabled={!owner} value={owner?.source??''} onChange={event=>setSelectedOwner(event.target.value as Ql270SourceId)}>
          {!owner?<option value="">No local follow-up</option>:ownerDrafts.map(row=><option key={row.source} value={row.source}>{nameFor(row.source)} · {row.reference}</option>)}</select></label>
        <label htmlFor="ql284-owner-response-type">Unverified owner response category
          <select id="ql284-owner-response-type" value={responseType} onChange={event=>setResponseType(event.target.value as Ql284OwnerResponseType)}>
            {QL284_OWNER_RESPONSE_CLAIM_TYPES.map(row=><option key={row.value} value={row.value}>{row.label}</option>)}</select></label>
        <label htmlFor="ql284-owner-ref">Nonsecret owner response reference CLAIM
          <input id="ql284-owner-ref" maxLength={32} value={responseRef} onChange={event=>setResponseRef(event.target.value)} placeholder="Example: RESPONSE-284-CASE" /></label></div>
      <div className="ql277-actions"><button type="button" disabled={!owner} onClick={prepareResponse}>Record unverified response claim</button>
        <button type="button" className="secondary" onClick={onOpenQl283}>Open QL-283 owner source</button>
        <button type="button" className="secondary" onClick={onOpenEvidence}>Open original source evidence</button></div>
      <div className="ql277-results">{responses.map(row=><article key={row.source}><strong>{nameFor(row.source)} · {row.responseReference}</strong>
        <span>{row.responseType.replaceAll('_',' ')} · {row.state.replaceAll('_',' ')}</span>
        <small>QL-283 follow-up {row.followupReference} · pinned {row.followupSourceSha.slice(0,12)} → {row.observedSourceSha.slice(0,12)}</small>
        <p>Owner identity NOT AUTHENTICATED · response receipt NOT VERIFIED · routed NO · resolved NO.</p></article>)}</div>
      <p className="ql277-warning">The response type is a user-supplied claim, not a confirmed owner communication. No delivery evidence, source write or publication exception closure occurs.</p>
    </section>}

    {topic==='revalidation'&&<section className="ql277-card" aria-labelledby="ql284-proof-title">
      <h5 id="ql284-proof-title">Six-app immutable Proof-B source revalidation <span>{revalidation.freshness.replaceAll('_',' ')}</span></h5>
      <p>Independent GitHub public main/source GETs at <time dateTime={QL284_OBSERVED_AT}>{QL284_OBSERVED_AT}</time>, compared to QL-283 at {revalidation.previousObservedAt}. Four moved, two unchanged. All six exact immutable original paths still return HTTP 404; no signed proof accepted.</p>
      <div className="ql283-timestamp-strip"><span><strong>Snapshot age</strong>{revalidation.ageHours===null?'Clock review':`${revalidation.ageHours} hour(s)`}</span>
        <span><strong>Next public GET due</strong>{revalidation.nextRecheckAt}</span>
        <span><strong>Later source notices</strong>{revalidation.rows.reduce((sum,row)=>sum+row.postSnapshotNotices,0)}</span>
        <span><strong>Outdated pinned notices</strong>{revalidation.rows.reduce((sum,row)=>sum+row.stalePinNotices,0)}</span></div>
      <div className="ql282-filter-row" role="group" aria-label="Filter public Proof-B revalidation by source SHA drift">
        <button type="button" aria-pressed={filter==='all'} onClick={()=>setFilter('all')}>All six ({revalidation.rows.length})</button>
        <button type="button" aria-pressed={filter==='moved'} onClick={()=>setFilter('moved')}>Changed ({revalidation.moved})</button>
        <button type="button" aria-pressed={filter==='unchanged'} onClick={()=>setFilter('unchanged')}>Unchanged ({revalidation.unchanged})</button></div>
      <div className="ql283-source-list" role="table" aria-label="QL-284 immutable original Proof-B source revalidation ledger">
        <div className="ql283-source-row heading" role="row"><span role="columnheader">Source</span><span role="columnheader">QL-283 → QL-284 SHA</span><span role="columnheader">Original proof</span><span role="columnheader">Immutable GET</span></div>
        {visible.map(row=><div className="ql283-source-row" role="row" key={row.source}>
          <strong role="cell">{nameFor(row.source)}</strong><code role="cell" title={`${row.previousSha} → ${row.sha}`}>{row.previousSha?.slice(0,9)} → {row.sha.slice(0,9)}</code>
          <span role="cell"><b>{row.moved?'SHA changed':'SHA unchanged'}</b> · HTTP {row.http}<small>Original publication exception OPEN · {row.notices} notice(s)</small></span>
          <a role="cell" href={ql284PinnedProofUrl(row.source)} target="_blank" rel="noopener noreferrer">Pinned public original ↗</a></div>)}</div>
      <div className="ql284-subsection"><h6>Manual revalidation follow-up from QL-283</h6>
        {recheckDrafts.length===0?<p className="ql284-secondary-copy">No QL-283 manual recheck worklist item is in this session. Public source observations above are real; this separate operator follow-up requires its own predecessor draft.</p>:null}
        <div className="ql277-form-grid"><label htmlFor="ql284-recheck-source">QL-283 unexecuted manual recheck request
          <select id="ql284-recheck-source" disabled={!recheck} value={recheck?.source??''} onChange={event=>setSelectedRecheck(event.target.value as Ql270SourceId)}>
            {!recheck?<option value="">No local manual request</option>:recheckDrafts.map(row=><option key={row.source} value={row.source}>{nameFor(row.source)} · {row.reference}</option>)}</select></label>
          <label htmlFor="ql284-recheck-ref">Nonsecret revalidation follow-up reference
            <input id="ql284-recheck-ref" maxLength={32} value={followupRef} onChange={event=>setFollowupRef(event.target.value)} placeholder="Example: REVALIDATE-284-CASE" /></label></div>
        <div className="ql277-actions"><button type="button" disabled={!recheck} onClick={prepareSourceFollowup}>Prepare manual source follow-up</button>
          <button type="button" className="secondary" onClick={()=>{setAsOf(new Date());setFeedback('Snapshot age recalculated locally; no new public or private GET was executed.');}}>Recalculate snapshot age only</button>
          <button type="button" className="secondary" onClick={onOpenQl283}>Open QL-283 recheck source</button></div>
        <div className="ql277-results">{followups.map(row=><article key={row.source}><strong>{nameFor(row.source)} · {row.reference}</strong>
          <span>{row.state.replaceAll('_',' ')} · {row.manualCaseReference}</span><small>Immutable {row.previousSha.slice(0,12)} → {row.observedSha.slice(0,12)}</small>
          <p>Follow-up scheduled NO · executed NO · original accepted NO.</p></article>)}</div></div>
      <p className="ql277-warning">A source change, later claim or 24-hour age requires another independent public GET. These controls do not poll, authenticate signed originals or reconnect integrations.</p>
    </section>}

    <section className="ql277-card ql283-parked-note" aria-labelledby="ql284-ack-title"><h5 id="ql284-ack-title">Six-App Acknowledgement Delivery Evidence Preconditions <span className="ql282-under-review">UNDER REVIEW</span></h5>
      <p><strong>Parked for later.</strong> No new ACK evidence collection, delivery claims, follow-up aging, notifications, messages or escalations are being advanced. The separate authenticated integration security gates remain DISCONNECTED / HOLD.</p></section>

    <section className="ql277-card" aria-labelledby="ql284-packet-title"><h5 id="ql284-packet-title">QL-284 independent review and source revalidation packet <span>LOCAL · NOT SENT</span></h5>
      <label className="ql277-note-label" htmlFor="ql284-packet">Read-only pinned public results, unverified review and owner claims, and parked ACK decision
        <textarea id="ql284-packet" readOnly rows={11} value={packet}/></label>
      <div className="ql277-actions"><button type="button" onClick={()=>void copyPacket()}>Copy QL-284 local review packet</button>
        <button type="button" className="secondary" onClick={()=>{setReviews([]);setResponses([]);setFollowups([]);
          setReviewRef('');setResponseRef('');setFollowupRef('');setFeedback('QL-284 local drafts cleared. QL-283 references, pinned public observation and parked ACK status were preserved.');}}>Clear QL-284 local drafts</button></div>
      <p className="ql277-feedback" role="status" aria-live="polite">{feedback}</p></section>
  </section>;
}

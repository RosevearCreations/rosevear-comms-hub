import {useState,type Dispatch,type SetStateAction} from 'react';
import {QL270_SOURCES,type Ql270SourceId} from './ql270ConnectionCentre';
import type {Ql279ArrivalClaim} from './ql279ReviewerCustodyEscalation';
import type {Ql285AuthorityAudit,Ql285ProvenanceReview,Ql285DeltaWorkItem} from './ql285IssuerAuthorityProvenanceDelta';
import {QL286_OBSERVED_AT,QL286_REVIEW_OUTCOMES,QL286_PROVENANCE_CONFLICTS,
  ql286AuditPacket,ql286CompareAuthorityOutcome,ql286PrepareConflictFollowup,
  ql286PrepareAgingFollowup,ql286ExceptionAging,ql286PinnedProofUrl,
  type Ql286ReviewOutcome,type Ql286ProvenanceConflictType,type Ql286OutcomeComparison,
  type Ql286ConflictFollowup,type Ql286AgingFollowup} from './ql286AuthorityOutcomeConflictAging';
import './ql277-drift-review.css';
import './ql278-followup-desk.css';
import './ql280-receipt-reconciliation.css';
import './ql281-signature-proof-custody.css';
import './ql282-issuer-publication.css';
import './ql283-issuer-trust-followup.css';
import './ql284-reviewer-crosscheck.css';
import './ql285-authority-provenance.css';
import './ql286-outcome-aging.css';

type Topic='outcomes'|'conflicts'|'aging';
type Filter='all'|'moved'|'unchanged';
const nameFor=(id:Ql270SourceId)=>QL270_SOURCES.find(row=>row.id===id)?.label??id;

export function Ql286AuthorityOutcomeConflictAging({authorityAudits,provenanceReviews,deltaWorkItems,
  outcomeDrafts,setOutcomeDrafts,conflictDrafts,setConflictDrafts,agingDrafts,setAgingDrafts,
  arrivalClaims,onOpenQl285,onOpenEvidence}:{
  authorityAudits:readonly Ql285AuthorityAudit[];provenanceReviews:readonly Ql285ProvenanceReview[];
  deltaWorkItems:readonly Ql285DeltaWorkItem[];arrivalClaims:readonly Ql279ArrivalClaim[];
  outcomeDrafts:Ql286OutcomeComparison[];setOutcomeDrafts:Dispatch<SetStateAction<Ql286OutcomeComparison[]>>;
  conflictDrafts:Ql286ConflictFollowup[];setConflictDrafts:Dispatch<SetStateAction<Ql286ConflictFollowup[]>>;
  agingDrafts:Ql286AgingFollowup[];setAgingDrafts:Dispatch<SetStateAction<Ql286AgingFollowup[]>>;
  onOpenQl285:()=>void;onOpenEvidence:()=>void;
}) {
  const [topic,setTopic]=useState<Topic>('outcomes');
  const [filter,setFilter]=useState<Filter>('all');
  const [selectedAudit,setSelectedAudit]=useState('');
  const [outcome,setOutcome]=useState<Ql286ReviewOutcome>('AUTHORITY_CHAIN_UNCORROBORATED');
  const [outcomeRef,setOutcomeRef]=useState('');
  const [selectedProvenance,setSelectedProvenance]=useState<Ql270SourceId>('rosiedazzlers');
  const [conflict,setConflict]=useState<Ql286ProvenanceConflictType>('SOURCE_PIN_CHANGED');
  const [conflictRef,setConflictRef]=useState('');
  const [selectedDelta,setSelectedDelta]=useState<Ql270SourceId>('rosiedazzlers');
  const [agingRef,setAgingRef]=useState('');
  const [asOf,setAsOf]=useState(()=>new Date());
  const [feedback,setFeedback]=useState('QL-286 public observation: five source pins moved, one unchanged, and six original Proof-B paths remain HTTP 404. ACK delivery evidence stays parked Under Review.');
  const aging=ql286ExceptionAging(asOf,arrivalClaims,deltaWorkItems);
  const visible=aging.rows.filter(row=>filter==='all'||(filter==='moved'?row.moved:!row.moved));
  const audit=authorityAudits.find(row=>row.checkId===selectedAudit)??authorityAudits[0];
  const priorProvenance=provenanceReviews.find(row=>row.source===selectedProvenance)??provenanceReviews[0];
  const delta=deltaWorkItems.find(row=>row.source===selectedDelta)??deltaWorkItems[0];
  const packet=ql286AuditPacket(outcomeDrafts,conflictDrafts,agingDrafts,asOf,arrivalClaims,deltaWorkItems);

  function compare(){
    if(!audit){setFeedback('Create a QL-285 local authority audit before comparing reviewer outcomes.');return;}
    const result=ql286CompareAuthorityOutcome(audit,outcomeRef,outcome,new Date());
    if(!result.ok){setFeedback(result.reason);return;}
    setOutcomeDrafts(old=>[...old.filter(row=>row.checkId!==result.draft.checkId),result.draft]);
    setOutcomeRef('');setFeedback('Pending reviewer outcome compared locally. No independent review or issuer authority verified.');
  }
  function followConflict(){
    if(!priorProvenance){setFeedback('Create a QL-285 quarantined provenance reference before reviewing a conflict.');return;}
    const result=ql286PrepareConflictFollowup(priorProvenance,conflictRef,conflict,new Date());
    if(!result.ok){setFeedback(result.reason);return;}
    setConflictDrafts(old=>[...old.filter(row=>row.source!==result.draft.source),result.draft]);
    setConflictRef('');setFeedback('Original Proof-B provenance conflict kept open. No custodian contacted or receipt accepted.');
  }
  function followAging(){
    if(!delta){setFeedback('Create a QL-285 local source delta item before adding an aging follow-up.');return;}
    const result=ql286PrepareAgingFollowup(delta,agingRef,new Date());
    if(!result.ok){setFeedback(result.reason);return;}
    setAgingDrafts(old=>[...old.filter(row=>row.source!==result.draft.source),result.draft]);
    setAgingRef('');setFeedback('Exception aging follow-up prepared locally only. No GET scheduled, executed or authenticated.');
  }
  async function copyPacket(){
    try{if(!navigator.clipboard?.writeText)throw Error('Clipboard unavailable');
      await navigator.clipboard.writeText(packet);setFeedback('QL-286 unverified local packet copied; no evidence transmitted.');}
    catch{setFeedback('Clipboard unavailable. Select the read-only packet to copy manually; nothing was sent.');}
  }
  return <section className="ql277-review ql280-desk ql281-desk ql282-desk ql283-desk ql284-desk ql285-desk ql286-desk"
    data-ql286-desk aria-labelledby="ql286-title">
    <header className="ql277-heading"><div>
      <p className="ql271-eyebrow">QL-286 · Original evidence comparison and exception aging</p>
      <h4 id="ql286-title">Reviewer authority outcomes · Proof-B conflicts · Six-source recheck aging</h4>
      <p>Compare what remains unverified, keep original provenance conflicts visible, and age actual public source observations. Session-only drafts cannot attest or route evidence.</p>
    </div><span>INTEGRATIONS DISCONNECTED / HOLD</span></header>
    <div className="ql277-stats" aria-label="QL-286 public proof and authority status">
      <div><small>Authority outcomes independently verified</small><strong>0</strong><em>{outcomeDrafts.length} pending local comparisons</em></div>
      <div><small>Source main SHAs moved</small><strong>{aging.moved} / 6</strong><em>{aging.unchanged} unchanged since QL-285</em></div>
      <div><small>Original Proof-B missing</small><strong>{aging.missing} / 6</strong><em>Unresolved pinned public HTTP 404</em></div>
      <div><small>ACK delivery evidence</small><strong className="ql282-review-value">Under Review</strong><em>Parked for later · untouched</em></div>
    </div>
    <nav className="ql277-tabs" aria-label="QL-286 review workstreams">
      <button type="button" className={topic==='outcomes'?'active':''} aria-current={topic==='outcomes'?'page':undefined} onClick={()=>setTopic('outcomes')}>01 Reviewer outcomes</button>
      <button type="button" className={topic==='conflicts'?'active':''} aria-current={topic==='conflicts'?'page':undefined} onClick={()=>setTopic('conflicts')}>02 Proof-B conflicts</button>
      <button type="button" className={topic==='aging'?'active':''} aria-current={topic==='aging'?'page':undefined} onClick={()=>setTopic('aging')}>03 Six-app exception aging</button>
    </nav>

    {topic==='outcomes'&&<section className="ql277-card" aria-labelledby="ql286-outcome-title">
      <h5 id="ql286-outcome-title">Issuer authority review outcome comparison <span>0 VERIFIED</span></h5>
      <p>Compare the unfulfilled QL-285 challenge gates with a local reviewer status category. A comparison is not an independently signed decision; the issuer, reviewer, key and original challenge return remain unverified.</p>
      {authorityAudits.length===0?<div className="ql279-empty"><strong>No QL-285 authority audit in this session.</strong><p>Open the preceding authority panel and prepare an unverified audit from a QL-284 cross-check first.</p></div>:null}
      <div className="ql277-form-grid">
        <label htmlFor="ql286-audit-source">QL-285 pending issuer authority audit
          <select id="ql286-audit-source" disabled={!audit} value={audit?.checkId??''} onChange={e=>setSelectedAudit(e.target.value)}>
            {!audit?<option value="">No local authority audit</option>:authorityAudits.map(row=><option key={row.checkId} value={row.checkId}>{row.checkId} · {row.authorityCase}</option>)}</select></label>
        <label htmlFor="ql286-outcome-type">Local outcome category (not independently attested)
          <select id="ql286-outcome-type" value={outcome} onChange={e=>setOutcome(e.target.value as Ql286ReviewOutcome)}>
            {QL286_REVIEW_OUTCOMES.map(row=><option key={row.value} value={row.value}>{row.label}</option>)}</select></label>
        <label htmlFor="ql286-outcome-ref">Nonsecret outcome comparison case reference
          <input id="ql286-outcome-ref" maxLength={32} value={outcomeRef} onChange={e=>setOutcomeRef(e.target.value)} placeholder="OUTCOME-286-CASE" /></label>
      </div>
      <div className="ql286-status-list"><span>Issuer authority: NOT AUTHENTICATED</span><span>Original challenge: NOT ISSUED</span>
        <span>Signed reviewer return: NOT VERIFIED</span><span>Seven QL-285 challenge gates: NOT SATISFIED</span></div>
      <div className="ql277-actions"><button type="button" disabled={!audit} onClick={compare}>Prepare pending reviewer outcome comparison</button>
        <button type="button" className="secondary" onClick={onOpenQl285}>Open QL-285 authority audit</button></div>
      <div className="ql277-results">{outcomeDrafts.map(row=><article key={row.checkId}><strong>{row.checkId} · {row.reference}</strong>
        <span>{row.outcome.replaceAll('_',' ')} · {row.state.replaceAll('_',' ')}</span>
        <small>QL-285 audit {row.previousCase} · {row.unmetGates} gates still unmet · {row.preparedAt}</small>
        <p>Verified changes 0 · independently reviewed NO · original challenge NOT ISSUED.</p></article>)}</div>
    </section>}

    {topic==='conflicts'&&<section className="ql277-card" aria-labelledby="ql286-conflict-title">
      <h5 id="ql286-conflict-title">Original Proof-B provenance conflict follow-up <span>QUARANTINED · OPEN</span></h5>
      <p>Inspect claims inherited from QL-285 without authenticating their owner or receipt. Even a source SHA change does not establish a custodian chain; the original file is absent at all six checked pins.</p>
      {provenanceReviews.length===0?<div className="ql279-empty"><strong>No QL-285 quarantined provenance claim in this session.</strong><p>Open the QL-285 provenance panel first; this view does not fabricate an original receipt.</p></div>:null}
      <div className="ql277-form-grid"><label htmlFor="ql286-provenance-source">Unverified QL-285 provenance source
        <select id="ql286-provenance-source" disabled={!priorProvenance} value={priorProvenance?.source??''} onChange={e=>setSelectedProvenance(e.target.value as Ql270SourceId)}>
          {!priorProvenance?<option value="">No local provenance claim</option>:provenanceReviews.map(row=><option key={row.source} value={row.source}>{nameFor(row.source)} · {row.reference}</option>)}</select></label>
        <label htmlFor="ql286-conflict-type">Original provenance conflict category
          <select id="ql286-conflict-type" value={conflict} onChange={e=>setConflict(e.target.value as Ql286ProvenanceConflictType)}>
            {QL286_PROVENANCE_CONFLICTS.map(row=><option key={row.value} value={row.value}>{row.label}</option>)}</select></label>
        <label htmlFor="ql286-conflict-ref">Nonsecret conflict follow-up reference
          <input id="ql286-conflict-ref" maxLength={32} value={conflictRef} onChange={e=>setConflictRef(e.target.value)} placeholder="CONFLICT-286-CASE" /></label></div>
      <div className="ql277-actions"><button type="button" disabled={!priorProvenance} onClick={followConflict}>Prepare quarantined conflict follow-up</button>
        <button type="button" className="secondary" onClick={onOpenQl285}>Open QL-285 provenance claim</button>
        <button type="button" className="secondary" onClick={onOpenEvidence}>Inspect source evidence</button></div>
      <div className="ql277-results">{conflictDrafts.map(row=><article key={row.source}><strong>{nameFor(row.source)} · {row.reference}</strong>
        <span>{row.conflict.replaceAll('_',' ')} · {row.disposition.replaceAll('_',' ')}</span>
        <small>QL-285 {row.previousCase} · {row.priorSha.slice(0,12)} → {row.latestSha.slice(0,12)}</small>
        <p>Owner NOT AUTHENTICATED · original receipt NOT VERIFIED · routed NO · resolved NO.</p></article>)}</div>
      <p className="ql277-warning">Do not paste raw signatures, tokens, private receipts or personal identifiers. Only synthetic, nonsecret case references belong in this session.</p>
    </section>}

    {topic==='aging'&&<section className="ql277-card" aria-labelledby="ql286-aging-title">
      <h5 id="ql286-aging-title">Six-app public source exception recheck and aging <span>{aging.freshness.replaceAll('_',' ')}</span></h5>
      <p>Actual public-only GitHub `main` and immutable `docs/integration/ql246-source-proof.json` GETs at <time dateTime={QL286_OBSERVED_AT}>{QL286_OBSERVED_AT}</time>. Compared with QL-285: {aging.moved} SHA changes, {aging.unchanged} unchanged, all {aging.missing} Proof-B paths still HTTP 404. No authenticated gateway GET was attempted.</p>
      <div className="ql283-timestamp-strip"><span><strong>Current snapshot age</strong>{aging.ageHours===null?'Clock review':`${aging.ageHours} hour(s)`}</span>
        <span><strong>Next manual public recheck due</strong>{aging.nextRecheckAt}</span>
        <span><strong>Post-snapshot notices</strong>{aging.rows.reduce((sum,row)=>sum+row.postSnapshotNotices,0)}</span>
        <span><strong>Stale notice pins</strong>{aging.rows.reduce((sum,row)=>sum+row.stalePinNotices,0)}</span></div>
      <div className="ql282-filter-row" role="group" aria-label="Filter QL-286 public exception aging">
        <button type="button" aria-pressed={filter==='all'} onClick={()=>setFilter('all')}>All sources ({aging.rows.length})</button>
        <button type="button" aria-pressed={filter==='moved'} onClick={()=>setFilter('moved')}>Changed pins ({aging.moved})</button>
        <button type="button" aria-pressed={filter==='unchanged'} onClick={()=>setFilter('unchanged')}>Unchanged pins ({aging.unchanged})</button></div>
      <div className="ql283-source-list" role="table" aria-label="QL-286 source exception aging ledger">
        <div className="ql283-source-row heading" role="row"><span role="columnheader">Source application</span><span role="columnheader">QL-285 → QL-286 pin</span><span role="columnheader">Exception aging</span><span role="columnheader">Original public pin</span></div>
        {visible.map(row=><div className="ql283-source-row" role="row" key={row.source}>
          <strong role="cell">{nameFor(row.source)}</strong>
          <code role="cell" title={`${row.previousSha} → ${row.sha}`}>{row.previousSha?.slice(0,9)} → {row.sha.slice(0,9)}</code>
          <span role="cell"><b>{row.moved?'SHA moved':'SHA unchanged'}</b> · HTTP {row.http}
            <small>{row.bucket.replaceAll('_',' ')} · {row.linkedManualItems} local QL-285 item(s) · {row.notices} unverified notices</small></span>
          <a role="cell" href={ql286PinnedProofUrl(row.source)} target="_blank" rel="noopener noreferrer">Pinned public GET ↗</a></div>)}</div>
      <div className="ql284-subsection"><h6>Local source recheck-aging handoff</h6>
        {deltaWorkItems.length===0?<p className="ql284-secondary-copy">All six exceptions are always shown. A linked aging draft requires a prior QL-285 local publication delta item from this session.</p>:null}
        <div className="ql277-form-grid"><label htmlFor="ql286-delta-source">Unexecuted QL-285 delta work item
          <select id="ql286-delta-source" disabled={!delta} value={delta?.source??''} onChange={e=>setSelectedDelta(e.target.value as Ql270SourceId)}>
            {!delta?<option value="">No previous local item</option>:deltaWorkItems.map(row=><option key={row.source} value={row.source}>{nameFor(row.source)} · {row.reference}</option>)}</select></label>
          <label htmlFor="ql286-aging-ref">Nonsecret recheck-aging case reference
            <input id="ql286-aging-ref" maxLength={32} value={agingRef} onChange={e=>setAgingRef(e.target.value)} placeholder="RECHECK-286-CASE" /></label></div>
        <div className="ql277-actions"><button type="button" disabled={!delta} onClick={followAging}>Prepare local aging follow-up</button>
          <button type="button" className="secondary" onClick={()=>{setAsOf(new Date());setFeedback('Age recalculated locally; no new GET was performed.');}}>Recalculate age only</button>
          <button type="button" className="secondary" onClick={onOpenQl285}>Open QL-285 source delta</button></div>
        <div className="ql277-results">{agingDrafts.map(row=><article key={row.source}><strong>{nameFor(row.source)} · {row.reference}</strong>
          <span>{row.state.replaceAll('_',' ')} · {row.sourceChanged?'SHA moved':'SHA unchanged'}</span>
          <small>QL-285 {row.previousCase} · {row.priorSha.slice(0,12)} → {row.currentSha.slice(0,12)}</small>
          <p>Scheduled NO · executed NO · original accepted NO.</p></article>)}</div></div>
      <p className="ql277-warning">The 24-hour clock and new notices are reminders for an independent public GET, never an automatic source call. A future HTTP 200 alone would not verify signer authority or original custody.</p>
    </section>}

    <section className="ql277-card ql283-parked-note" aria-labelledby="ql286-ack-title"><h5 id="ql286-ack-title">Six-App Acknowledgement Delivery Evidence Preconditions <span className="ql282-under-review">UNDER REVIEW</span></h5>
      <p><strong>Parked for later.</strong> No ACK delivery receipts, escalations, notifications or follow-up aging are advanced. Source integrations remain separately DISCONNECTED / HOLD until original signed Proof-B, authenticated read-only GET identities, independent witnesses and owner TEST-only approval genuinely exist.</p></section>
    <section className="ql277-card" aria-labelledby="ql286-packet-title"><h5 id="ql286-packet-title">QL-286 comparison, conflict and aging packet <span>LOCAL · NOT SENT</span></h5>
      <label className="ql277-note-label" htmlFor="ql286-packet">Read-only public pins and unresolved case comparisons
        <textarea id="ql286-packet" readOnly rows={11} value={packet}/></label>
      <div className="ql277-actions"><button type="button" onClick={()=>void copyPacket()}>Copy local QL-286 packet</button>
        <button type="button" className="secondary" onClick={()=>{setOutcomeDrafts([]);setConflictDrafts([]);setAgingDrafts([]);setFeedback('QL-286 session-only drafts cleared. External evidence and ACK state unchanged.');}}>Clear QL-286 local drafts</button></div>
      <p role="status" aria-live="polite" className="ql286-feedback">{feedback}</p>
    </section>
  </section>;
}

import {useState} from 'react';
import {QL270_SOURCES,type Ql270SourceId} from './ql270ConnectionCentre';
import type {Ql279ArrivalClaim} from './ql279ReviewerCustodyEscalation';
import type {Ql284ReviewerCrossCheck,Ql284OwnerResponse,Ql284SourceFollowup} from './ql284ReviewerCrosscheckOwnerResponse';
import {QL285_OBSERVED_AT,QL285_AUTHORITY_CHALLENGE_GATES,QL285_PROVENANCE_CLAIM_TYPES,
  ql285AuditPacket,ql285PinnedProofUrl,ql285PrepareAuthorityAudit,ql285PrepareProvenance,
  ql285PrepareDeltaWorkItem,ql285PublicationDelta,type Ql285AuthorityAudit,type Ql285ProvenanceType,
  type Ql285ProvenanceReview,type Ql285DeltaWorkItem} from './ql285IssuerAuthorityProvenanceDelta';
import './ql277-drift-review.css';
import './ql278-followup-desk.css';
import './ql280-receipt-reconciliation.css';
import './ql281-signature-proof-custody.css';
import './ql282-issuer-publication.css';
import './ql283-issuer-trust-followup.css';
import './ql284-reviewer-crosscheck.css';
import './ql285-authority-provenance.css';

type Topic='authority'|'provenance'|'delta';
type DeltaFilter='all'|'moved'|'unchanged';
const nameFor=(id:Ql270SourceId)=>QL270_SOURCES.find(row=>row.id===id)?.label??id;

export function Ql285IssuerAuthorityProvenanceDelta({reviewerCrossChecks,ownerResponseClaims,sourceFollowups,
  arrivalClaims,onOpenQl284,onOpenEvidence}:{
  reviewerCrossChecks:readonly Ql284ReviewerCrossCheck[];ownerResponseClaims:readonly Ql284OwnerResponse[];
  sourceFollowups:readonly Ql284SourceFollowup[];arrivalClaims:readonly Ql279ArrivalClaim[];
  onOpenQl284:()=>void;onOpenEvidence:()=>void;
}) {
  const [topic,setTopic]=useState<Topic>('authority');
  const [filter,setFilter]=useState<DeltaFilter>('all');
  const [selectedCrosscheck,setSelectedCrosscheck]=useState('');
  const [authorityRef,setAuthorityRef]=useState('');
  const [authorityDrafts,setAuthorityDrafts]=useState<Ql285AuthorityAudit[]>([]);
  const [selectedOwner,setSelectedOwner]=useState<Ql270SourceId>('rosiedazzlers');
  const [provenanceType,setProvenanceType]=useState<Ql285ProvenanceType>('OWNER_SOURCE_REFERENCE');
  const [provenanceRef,setProvenanceRef]=useState('');
  const [provenanceDrafts,setProvenanceDrafts]=useState<Ql285ProvenanceReview[]>([]);
  const [selectedSource,setSelectedSource]=useState<Ql270SourceId>('rosiedazzlers');
  const [deltaRef,setDeltaRef]=useState('');
  const [deltaDrafts,setDeltaDrafts]=useState<Ql285DeltaWorkItem[]>([]);
  const [asOf,setAsOf]=useState(()=>new Date());
  const [feedback,setFeedback]=useState('QL-285 public source delta: five main SHAs changed, one unchanged, six immutable original Proof-B paths HTTP 404. ACK delivery evidence stays Under Review and parked.');
  const delta=ql285PublicationDelta(asOf,arrivalClaims);
  const visible=delta.rows.filter(row=>filter==='all'||(filter==='moved'?row.moved:!row.moved));
  const crosscheck=reviewerCrossChecks.find(row=>row.checkId===selectedCrosscheck)??reviewerCrossChecks[0];
  const owner=ownerResponseClaims.find(row=>row.source===selectedOwner)??ownerResponseClaims[0];
  const source=sourceFollowups.find(row=>row.source===selectedSource)??sourceFollowups[0];
  const packet=ql285AuditPacket(authorityDrafts,provenanceDrafts,deltaDrafts,asOf,arrivalClaims);

  function prepareAuthority(){
    if(!crosscheck){setFeedback('Prepare an unverified QL-284 reviewer cross-check before adding authority audit context.');return;}
    const result=ql285PrepareAuthorityAudit(crosscheck,authorityRef,new Date());
    if(!result.ok){setFeedback(result.reason);return;}
    setAuthorityDrafts(old=>[...old.filter(row=>row.checkId!==result.draft.checkId),result.draft]);
    setAuthorityRef('');setFeedback('Local issuer AUTHORITY AUDIT prepared. No real challenge was issued or reviewer/issuer authenticated.');
  }
  function prepareProvenance(){
    if(!owner){setFeedback('Prepare a QL-284 unverified owner response claim before reviewing its provenance.');return;}
    const result=ql285PrepareProvenance(owner,provenanceRef,provenanceType,new Date());
    if(!result.ok){setFeedback(result.reason);return;}
    setProvenanceDrafts(old=>[...old.filter(row=>row.source!==result.draft.source),result.draft]);
    setProvenanceRef('');setFeedback('Provenance reference QUARANTINED as a local unverified claim. No original receipt was accepted.');
  }
  function prepareDelta(){
    if(!source){setFeedback('Prepare a QL-284 manual source revalidation follow-up to attach a local delta work item.');return;}
    const result=ql285PrepareDeltaWorkItem(source,deltaRef,new Date());
    if(!result.ok){setFeedback(result.reason);return;}
    setDeltaDrafts(old=>[...old.filter(row=>row.source!==result.draft.source),result.draft]);
    setDeltaRef('');setFeedback('Publication exception delta work item prepared locally; not scheduled or executed externally.');
  }
  async function copyPacket(){
    try{if(!navigator.clipboard?.writeText)throw Error('Clipboard unavailable');
      await navigator.clipboard.writeText(packet);setFeedback('QL-285 local audit packet copied. No network, challenge or owner action occurred.');}
    catch{setFeedback('Clipboard unavailable. Select the read-only packet to copy manually; nothing was sent.');}
  }

  return <section className="ql277-review ql280-desk ql281-desk ql282-desk ql283-desk ql284-desk ql285-desk" data-ql285-desk aria-labelledby="ql285-title">
    <header className="ql277-heading"><div>
      <p className="ql271-eyebrow">QL-285 · Authority, provenance &amp; six-source publication deltas</p>
      <h4 id="ql285-title">Issuer challenge audit · Owner provenance review · Publication exception worklist</h4>
      <p>Examine prerequisite authority, reconcile only the provenance of unverified owner claims and track immutable public source changes. All operator input remains a nonsecret local draft.</p>
    </div><span>INTEGRATIONS DISCONNECTED / HOLD</span></header>

    <div className="ql277-stats" aria-label="QL-285 reviewer authority and publication delta status">
      <div><small>Issuer challenges authenticated</small><strong>0</strong><em>{authorityDrafts.length} unverified local audit(s)</em></div>
      <div><small>Source SHA changes</small><strong>{delta.moved} / 6</strong><em>{delta.unchanged} unchanged since QL-284</em></div>
      <div><small>Proof-B originals still missing</small><strong>{delta.missing} / 6</strong><em>Exact immutable HTTP 404</em></div>
      <div><small>ACK delivery evidence</small><strong className="ql282-review-value">Under Review</strong><em>Parked for later · no action</em></div>
    </div>

    <nav className="ql277-tabs" aria-label="QL-285 audit workstreams">
      <button type="button" className={topic==='authority'?'active':''} aria-current={topic==='authority'?'page':undefined} onClick={()=>setTopic('authority')}>01 Issuer authority challenge</button>
      <button type="button" className={topic==='provenance'?'active':''} aria-current={topic==='provenance'?'page':undefined} onClick={()=>setTopic('provenance')}>02 Owner response provenance</button>
      <button type="button" className={topic==='delta'?'active':''} aria-current={topic==='delta'?'page':undefined} onClick={()=>setTopic('delta')}>03 Six-app publication deltas</button>
    </nav>

    {topic==='authority'&&<section className="ql277-card" aria-labelledby="ql285-authority-title">
      <h5 id="ql285-authority-title">Original reviewer issuer trust-authority challenge audit <span>0 / {QL285_AUTHORITY_CHALLENGE_GATES.length} VERIFIED</span></h5>
      <p>No challenge issuance or trusted authority decision can be simulated by entering a reference. Original issuer authority, reviewer role, witnessed public key, signed return, custody and owner TEST-only approval must be independently validated.</p>
      {reviewerCrossChecks.length===0?<div className="ql279-empty"><strong>No QL-284 reviewer trust cross-check available in this session.</strong><p>Open QL-284 to prepare a pending reviewer cross-check from the preceding QL-283 trust reference.</p></div>:
        <div className="ql281-source-grid">{reviewerCrossChecks.map(row=><article key={row.checkId}><strong>{row.checkId}</strong><span>{row.caseReference}</span><small>Reviewer {row.reviewer.replaceAll('_',' ')} · signature {row.signature.replaceAll('_',' ')}</small></article>)}</div>}
      <div className="ql277-form-grid"><label htmlFor="ql285-crosscheck">QL-284 pending cross-check reference
        <select id="ql285-crosscheck" disabled={!crosscheck} value={crosscheck?.checkId??''} onChange={event=>setSelectedCrosscheck(event.target.value)}>
          {!crosscheck?<option value="">No local cross-check</option>:reviewerCrossChecks.map(row=><option key={row.checkId} value={row.checkId}>{row.checkId} · {row.caseReference}</option>)}</select></label>
        <label htmlFor="ql285-authority-ref">Nonsecret issuer authority challenge audit case CLAIM
          <input id="ql285-authority-ref" maxLength={32} value={authorityRef} onChange={event=>setAuthorityRef(event.target.value)} placeholder="Example: AUTHORITY-285-CASE" /></label></div>
      <ol className="ql278-gate-list" aria-label="Seven original issuer authority challenge preconditions">{QL285_AUTHORITY_CHALLENGE_GATES.map(gate=><li key={gate.id}>
        <span aria-hidden="true">!</span><div><strong>{gate.label}</strong><small>{gate.status.replaceAll('_',' ')} · NOT SATISFIED</small></div></li>)}</ol>
      <div className="ql277-actions"><button type="button" disabled={!crosscheck} onClick={prepareAuthority}>Prepare authority challenge audit</button>
        <button type="button" className="secondary" onClick={onOpenQl284}>Open QL-284 cross-check source</button></div>
      <div className="ql277-results">{authorityDrafts.map(row=><article key={row.checkId}><strong>{row.checkId} · {row.authorityCase}</strong>
        <span>{row.disposition.replaceAll('_',' ')} · {row.state.replaceAll('_',' ')}</span><small>Predecessor {row.crosscheckReference} · {row.preparedAt}</small>
        <p>Issuer NOT AUTHENTICATED · reviewer NOT AUTHENTICATED · challenge NOT ISSUED · signature NOT VERIFIED.</p></article>)}</div>
      <p className="ql277-warning">No nonce, cryptographic challenge, private signer, reviewer transport, owner approval or external API is invoked by this review.</p>
    </section>}

    {topic==='provenance'&&<section className="ql277-card" aria-labelledby="ql285-provenance-title">
      <h5 id="ql285-provenance-title">Proof-B owner response provenance reconciliation <span>ORIGINAL NOT VERIFIED</span></h5>
      <p>QL-284 owner responses are local unverified claims. Select a nonsecret claimed provenance reference to quarantine for independent comparison. None of the three categories authenticates an owner, custodian, witness or original artifact.</p>
      {ownerResponseClaims.length===0?<div className="ql279-empty"><strong>No QL-284 owner-response claim in this session.</strong><p>Open QL-284 to prepare an unverified source owner response from a QL-283 publication follow-up first.</p></div>:
        <div className="ql281-source-grid">{ownerResponseClaims.map(row=><article key={row.source}><strong>{nameFor(row.source)}</strong><span>{row.responseReference}</span><small>{row.responseType.replaceAll('_',' ')} · owner {row.ownerIdentity.replaceAll('_',' ')}</small></article>)}</div>}
      <div className="ql277-form-grid"><label htmlFor="ql285-owner-source">QL-284 unverified owner response source
        <select id="ql285-owner-source" disabled={!owner} value={owner?.source??''} onChange={event=>setSelectedOwner(event.target.value as Ql270SourceId)}>
          {!owner?<option value="">No local owner claim</option>:ownerResponseClaims.map(row=><option key={row.source} value={row.source}>{nameFor(row.source)} · {row.responseReference}</option>)}</select></label>
        <label htmlFor="ql285-provenance-type">Claimed provenance category — not authenticated
          <select id="ql285-provenance-type" value={provenanceType} onChange={event=>setProvenanceType(event.target.value as Ql285ProvenanceType)}>
            {QL285_PROVENANCE_CLAIM_TYPES.map(row=><option key={row.value} value={row.value}>{row.label}</option>)}</select></label>
        <label htmlFor="ql285-provenance-ref">Nonsecret provenance case reference CLAIM
          <input id="ql285-provenance-ref" maxLength={32} value={provenanceRef} onChange={event=>setProvenanceRef(event.target.value)} placeholder="Example: PROVENANCE-285-CASE" /></label></div>
      <div className="ql277-actions"><button type="button" disabled={!owner} onClick={prepareProvenance}>Prepare quarantined provenance review</button>
        <button type="button" className="secondary" onClick={onOpenQl284}>Open QL-284 owner response</button>
        <button type="button" className="secondary" onClick={onOpenEvidence}>Open original source evidence</button></div>
      <div className="ql277-results">{provenanceDrafts.map(row=><article key={row.source}><strong>{nameFor(row.source)} · {row.reference}</strong>
        <span>{row.provenanceType.replaceAll('_',' ')} · {row.disposition.replaceAll('_',' ')}</span>
        <small>QL-284 response {row.ownerResponseReference} · {row.priorSha.slice(0,12)} → {row.latestSha.slice(0,12)}</small>
        <p>Owner NOT AUTHENTICATED · original receipt NOT VERIFIED · independent provenance UNAVAILABLE · routed NO · resolved NO.</p></article>)}</div>
      <p className="ql277-warning">A claimed reference is neither a signed original nor an owner confirmation. Publication exceptions stay open until independent evidence genuinely arrives.</p>
    </section>}

    {topic==='delta'&&<section className="ql277-card" aria-labelledby="ql285-delta-title">
      <h5 id="ql285-delta-title">Six-app immutable publication exception delta worklist <span>{delta.freshness.replaceAll('_',' ')}</span></h5>
      <p>Real public GitHub main and immutable Proof-B GETs checked at <time dateTime={QL285_OBSERVED_AT}>{QL285_OBSERVED_AT}</time>, compared with QL-284 at {delta.previousObservedAt}. Five main refs moved, one stayed fixed. All six exact original Proof-B paths returned HTTP 404.</p>
      <div className="ql283-timestamp-strip" aria-label="Publication source observation and freshness"><span><strong>Snapshot age</strong>{delta.ageHours===null?'Clock review':`${delta.ageHours} hour(s)`}</span>
        <span><strong>Next public recheck due</strong>{delta.nextRecheckAt}</span>
        <span><strong>Notices after snapshot</strong>{delta.rows.reduce((sum,row)=>sum+row.postSnapshotNotices,0)}</span>
        <span><strong>Outdated pinned notices</strong>{delta.rows.reduce((sum,row)=>sum+row.stalePinNotices,0)}</span></div>
      <div className="ql282-filter-row" role="group" aria-label="Filter QL-285 public source exception deltas">
        <button type="button" aria-pressed={filter==='all'} onClick={()=>setFilter('all')}>All sources ({delta.rows.length})</button>
        <button type="button" aria-pressed={filter==='moved'} onClick={()=>setFilter('moved')}>SHA moved ({delta.moved})</button>
        <button type="button" aria-pressed={filter==='unchanged'} onClick={()=>setFilter('unchanged')}>SHA unchanged ({delta.unchanged})</button></div>
      <div className="ql283-source-list" role="table" aria-label="QL-285 immutable publication exception delta ledger">
        <div className="ql283-source-row heading" role="row"><span role="columnheader">Source application</span><span role="columnheader">QL-284 → QL-285 SHA</span><span role="columnheader">Publication exception</span><span role="columnheader">Pinned original</span></div>
        {visible.map(row=><div className="ql283-source-row" role="row" key={row.source}>
          <strong role="cell">{nameFor(row.source)}</strong><code role="cell" title={`${row.previousSha} → ${row.sha}`}>{row.previousSha?.slice(0,9)} → {row.sha.slice(0,9)}</code>
          <span role="cell"><b>{row.moved?'SHA moved':'SHA unchanged'}</b> · HTTP {row.http}<small>Original Proof-B missing · {row.notices} unverified notice(s)</small></span>
          <a role="cell" href={ql285PinnedProofUrl(row.source)} target="_blank" rel="noopener noreferrer">Pinned public GET ↗</a></div>)}</div>
      <div className="ql284-subsection"><h6>Optional local exception delta worklist handoff</h6>
        {sourceFollowups.length===0?<p className="ql284-secondary-copy">All six current source exceptions are shown above. A linked local worklist item requires a QL-284 unexecuted source follow-up from this session.</p>:null}
        <div className="ql277-form-grid"><label htmlFor="ql285-delta-source">QL-284 manual source follow-up reference
          <select id="ql285-delta-source" disabled={!source} value={source?.source??''} onChange={event=>setSelectedSource(event.target.value as Ql270SourceId)}>
            {!source?<option value="">No local source follow-up</option>:sourceFollowups.map(row=><option key={row.source} value={row.source}>{nameFor(row.source)} · {row.reference}</option>)}</select></label>
          <label htmlFor="ql285-delta-ref">Nonsecret publication exception delta case
            <input id="ql285-delta-ref" maxLength={32} value={deltaRef} onChange={event=>setDeltaRef(event.target.value)} placeholder="Example: DELTA-285-CASE" /></label></div>
        <div className="ql277-actions"><button type="button" disabled={!source} onClick={prepareDelta}>Prepare local delta review item</button>
          <button type="button" className="secondary" onClick={()=>{setAsOf(new Date());setFeedback('Snapshot age recalculated locally. No public or private GET was re-executed.');}}>Recalculate age only</button>
          <button type="button" className="secondary" onClick={onOpenQl284}>Open QL-284 source follow-up</button></div>
        <div className="ql277-results">{deltaDrafts.map(row=><article key={row.source}><strong>{nameFor(row.source)} · {row.reference}</strong>
          <span>{row.state.replaceAll('_',' ')} · {row.previousCase}</span><small>{row.priorSha.slice(0,12)} → {row.observedSha.slice(0,12)} · {row.sourceChanged?'SHA moved':'SHA unchanged'}</small>
          <p>Review scheduled NO · executed NO · original accepted NO.</p></article>)}</div></div>
      <p className="ql277-warning">Future source drift, notices or 24-hour age require a new independent GET. This local queue does not authenticate any original signer or trigger external work.</p>
    </section>}

    <section className="ql277-card ql283-parked-note" aria-labelledby="ql285-ack-title"><h5 id="ql285-ack-title">Six-App Acknowledgement Delivery Evidence Preconditions <span className="ql282-under-review">UNDER REVIEW</span></h5>
      <p><strong>Parked for later.</strong> No acknowledgement delivery evidence, notifications, follow-up aging, escalations or routing is being advanced. Separate source integrations remain DISCONNECTED / HOLD without original signed Proof-B, authenticated GET identity and owner TEST-only approval.</p></section>

    <section className="ql277-card" aria-labelledby="ql285-packet-title"><h5 id="ql285-packet-title">QL-285 authority, provenance &amp; publication delta packet <span>LOCAL · NOT SENT</span></h5>
      <label className="ql277-note-label" htmlFor="ql285-packet">Read-only original source pin diff, unverified authority/provenance and parked ACK decision
        <textarea id="ql285-packet" readOnly rows={11} value={packet}/></label>
      <div className="ql277-actions"><button type="button" onClick={()=>void copyPacket()}>Copy QL-285 local audit packet</button>
        <button type="button" className="secondary" onClick={()=>{setAuthorityDrafts([]);setProvenanceDrafts([]);setDeltaDrafts([]);
          setAuthorityRef('');setProvenanceRef('');setDeltaRef('');setFeedback('QL-285 local drafts cleared. QL-284 predecessors, immutable observations and parked ACK decision were preserved.');}}>Clear QL-285 local drafts</button></div>
      <p className="ql277-feedback" role="status" aria-live="polite">{feedback}</p></section>
  </section>;
}

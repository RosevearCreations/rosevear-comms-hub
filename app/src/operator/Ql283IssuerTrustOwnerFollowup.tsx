import {useState} from 'react';
import {QL270_SOURCES,type Ql270SourceId} from './ql270ConnectionCentre';
import type {Ql279ArrivalClaim} from './ql279ReviewerCustodyEscalation';
import type {Ql282IssuerRequest,Ql282ExceptionDraft} from './ql282IssuerPublicationReview';
import {QL283_OBSERVED_AT,QL283_ISSUER_TRUST_GATES,ql283AuditPacket,ql283PinnedProofUrl,
  ql283PrepareManualRecheck,ql283PrepareOwnerFollowup,ql283PrepareTrustReference,ql283SourceQueue,
  type Ql283TrustReference,type Ql283OwnerFollowup,type Ql283RecheckDraft} from './ql283IssuerTrustOwnerFollowup';
import './ql277-drift-review.css';
import './ql278-followup-desk.css';
import './ql280-receipt-reconciliation.css';
import './ql281-signature-proof-custody.css';
import './ql282-issuer-publication.css';
import './ql283-issuer-trust-followup.css';

type Topic='trust'|'owner'|'sources';
const label=(id:Ql270SourceId)=>QL270_SOURCES.find(row=>row.id===id)?.label??id;

export function Ql283IssuerTrustOwnerFollowup({issuerRequests,exceptions,arrivalClaims,onOpenQl282,onOpenEvidence}:{
  issuerRequests:readonly Ql282IssuerRequest[];exceptions:readonly Ql282ExceptionDraft[];
  arrivalClaims:readonly Ql279ArrivalClaim[];onOpenQl282:()=>void;onOpenEvidence:()=>void;
}) {
  const [topic,setTopic]=useState<Topic>('trust');
  const [selectedIssuer,setSelectedIssuer]=useState('');
  const [trustRef,setTrustRef]=useState('');
  const [trustDrafts,setTrustDrafts]=useState<Ql283TrustReference[]>([]);
  const [selectedException,setSelectedException]=useState<Ql270SourceId>('rosiedazzlers');
  const [ownerRef,setOwnerRef]=useState('');
  const [ownerDrafts,setOwnerDrafts]=useState<Ql283OwnerFollowup[]>([]);
  const [selectedSource,setSelectedSource]=useState<Ql270SourceId>('rosiedazzlers');
  const [recheckRef,setRecheckRef]=useState('');
  const [recheckDrafts,setRecheckDrafts]=useState<Ql283RecheckDraft[]>([]);
  const [asOf,setAsOf]=useState(()=>new Date());
  const [feedback,setFeedback]=useState('Public-source recheck: all six main SHAs moved; all six original Proof-B paths returned HTTP 404. ACK delivery evidence remains Under Review and parked.');
  const queue=ql283SourceQueue(asOf,arrivalClaims);
  const issuer=issuerRequests.find(row=>row.checkId===selectedIssuer)??issuerRequests[0];
  const exception=exceptions.find(row=>row.source===selectedException)??exceptions[0];
  const packet=ql283AuditPacket(trustDrafts,ownerDrafts,recheckDrafts,asOf,arrivalClaims);

  function prepareTrust(){
    if(!issuer){setFeedback('Prepare an unverified QL-282 issuer readiness reference first.');return;}
    const result=ql283PrepareTrustReference(issuer,trustRef,new Date());
    if(!result.ok){setFeedback(result.reason);return;}
    setTrustDrafts(old=>[...old.filter(row=>row.checkId!==result.draft.checkId),result.draft]);
    setTrustRef('');setFeedback('Local trust REFERENCE draft prepared. No issuer, key pin, signer, nonce or owner approval was authenticated.');
  }
  function prepareOwner(){
    if(!exception){setFeedback('Prepare a QL-282 missing-publication exception to supply a source owner follow-up reference.');return;}
    const result=ql283PrepareOwnerFollowup(exception,ownerRef,new Date());
    if(!result.ok){setFeedback(result.reason);return;}
    setOwnerDrafts(old=>[...old.filter(row=>row.source!==result.draft.source),result.draft]);
    setOwnerRef('');setFeedback('Source owner follow-up drafted locally; nothing was routed or sent. Original Proof-B remains absent.');
  }
  function prepareRecheck(){
    const result=ql283PrepareManualRecheck(selectedSource,recheckRef,new Date());
    if(!result.ok){setFeedback(result.reason);return;}
    setRecheckDrafts(old=>[...old.filter(row=>row.source!==result.draft.source),result.draft]);
    setRecheckRef('');setFeedback('Manual public source recheck added to the local queue. No recheck was scheduled or executed by this control.');
  }
  async function copyPacket(){
    try {if(!navigator.clipboard?.writeText)throw Error('Clipboard unavailable');await navigator.clipboard.writeText(packet);
      setFeedback('QL-283 local packet copied; no message sent or source system accessed.');}
    catch {setFeedback('Clipboard unavailable; select the read-only packet to copy manually. Nothing was sent.');}
  }

  return <section className="ql277-review ql280-desk ql281-desk ql282-desk ql283-desk" data-ql283-desk aria-labelledby="ql283-title">
    <header className="ql277-heading"><div>
      <p className="ql271-eyebrow">QL-283 · Independent evidence continuity</p>
      <h4 id="ql283-title">Issuer trust · Proof-B owner follow-up · Source SHA queue</h4>
      <p>Review a claimed issuer trust reference, trace an unresolved source-publication exception to a local owner follow-up, and compare fresh immutable public source pins. Each action prepares a nonsecret draft only.</p>
    </div><span>INTEGRATIONS DISCONNECTED / HOLD</span></header>

    <div className="ql277-stats" aria-label="QL-283 verified source and parked workstream status">
      <div><small>Trusted issuers verified</small><strong>0</strong><em>{trustDrafts.length} local reference review(s)</em></div>
      <div><small>Source SHAs changed</small><strong>{queue.moved} / 6</strong><em>Compared with QL-282</em></div>
      <div><small>Original Proof-B paths missing</small><strong>{queue.missing} / 6</strong><em>Immutable HTTP 404 observations</em></div>
      <div><small>ACK delivery evidence</small><strong className="ql282-review-value">Under Review</strong><em>Parked for later · no active actions</em></div>
    </div>

    <nav className="ql277-tabs" aria-label="QL-283 operator review topics">
      <button type="button" className={topic==='trust'?'active':''} aria-current={topic==='trust'?'page':undefined} onClick={()=>setTopic('trust')}>01 Issuer trust references</button>
      <button type="button" className={topic==='owner'?'active':''} aria-current={topic==='owner'?'page':undefined} onClick={()=>setTopic('owner')}>02 Publication owner follow-up</button>
      <button type="button" className={topic==='sources'?'active':''} aria-current={topic==='sources'?'page':undefined} onClick={()=>setTopic('sources')}>03 Six-app SHA recheck queue</button>
    </nav>

    {topic==='trust'&&<section className="ql277-card" aria-labelledby="ql283-trust-title">
      <h5 id="ql283-trust-title">Original reviewer issuer trust-reference review <span>0 / {QL283_ISSUER_TRUST_GATES.length} VERIFIED</span></h5>
      <p>Reference entry does not validate a certificate, trust anchor, reviewer signature or original issuer identity. Each independent trust gate remains unsatisfied until externally examined by authorized people and systems.</p>
      {issuerRequests.length===0?<div className="ql279-empty"><strong>No QL-282 issuer review claim in this session.</strong><p>Open the previous review to prepare an unverified reference from an unsigned QL-281 challenge request.</p></div>:
        <div className="ql281-source-grid">{issuerRequests.map(row=><article key={row.checkId}><strong>{row.checkId}</strong><span>{row.issuerReadinessReference}</span><small>{row.issuer.replaceAll('_',' ')} · {row.state.replaceAll('_',' ')}</small></article>)}</div>}
      <div className="ql277-form-grid"><label htmlFor="ql283-issuer">QL-282 issuer readiness reference
        <select id="ql283-issuer" value={issuer?.checkId??''} disabled={!issuer} onChange={event=>setSelectedIssuer(event.target.value)}>
          {!issuer?<option value="">No local request</option>:issuerRequests.map(row=><option key={row.checkId} value={row.checkId}>{row.checkId} · {row.issuerReadinessReference}</option>)}</select></label>
        <label htmlFor="ql283-trust-ref">Nonsecret independent trust-review case reference CLAIM
          <input id="ql283-trust-ref" maxLength={32} value={trustRef} onChange={event=>setTrustRef(event.target.value)} placeholder="Example: TRUST-283-CASE" /></label></div>
      <ol className="ql278-gate-list" aria-label="Seven independent issuer trust-reference preconditions">{QL283_ISSUER_TRUST_GATES.map(gate=><li key={gate.id}>
        <span aria-hidden="true">!</span><div><strong>{gate.label}</strong><small>{gate.status.replaceAll('_',' ')} · NOT SATISFIED</small></div></li>)}</ol>
      <div className="ql277-actions"><button type="button" disabled={!issuer} onClick={prepareTrust}>Prepare trust reference review</button>
        <button type="button" className="secondary" onClick={onOpenQl282}>Open QL-282 issuer source</button></div>
      <div className="ql277-results" aria-label="QL-283 unsent issuer trust reference reviews">{trustDrafts.map(row=><article key={row.checkId}><strong>{row.checkId} · {row.trustReference}</strong>
        <span>{row.disposition.replaceAll('_',' ')} · {row.state.replaceAll('_',' ')}</span><small>Inherited QL-282 case: {row.issuerReadinessReference} · {row.preparedAt}</small>
        <p>Issuer NOT AUTHENTICATED · key pin NOT VERIFIED · challenge NOT ISSUED · owner approval NOT GIVEN.</p></article>)}</div>
    </section>}

    {topic==='owner'&&<section className="ql277-card" aria-labelledby="ql283-owner-title">
      <h5 id="ql283-owner-title">Proof-B publication exception owner follow-up <span>NOT SENT</span></h5>
      <p>Follow-up requires a matching QL-282 local exception. The six original paths are still missing at the QL-283 immutable pins, regardless of a main SHA change. Owner contact is a future manual action outside this interface.</p>
      {exceptions.length===0?<div className="ql279-empty"><strong>No QL-282 source publication exception in this session.</strong><p>Open QL-282 publication triage to create an unverified, source-specific exception before drafting an owner follow-up.</p></div>:
        <div className="ql281-source-grid">{exceptions.map(row=><article key={row.source}><strong>{label(row.source)}</strong><span>{row.reference}</span><small>Prior immutable pin {row.sourceSha.slice(0,12)} · unresolved</small></article>)}</div>}
      <div className="ql277-form-grid"><label htmlFor="ql283-owner-source">Unresolved QL-282 source publication exception
        <select id="ql283-owner-source" value={exception?.source??''} disabled={!exception} onChange={event=>setSelectedException(event.target.value as Ql270SourceId)}>
          {!exception?<option value="">No local exception</option>:exceptions.map(row=><option key={row.source} value={row.source}>{label(row.source)} · {row.reference}</option>)}</select></label>
        <label htmlFor="ql283-owner-ref">Nonsecret follow-up reference (local draft only)
          <input id="ql283-owner-ref" maxLength={32} value={ownerRef} onChange={event=>setOwnerRef(event.target.value)} placeholder="Example: OWNER-283-FOLLOWUP" /></label></div>
      <div className="ql277-actions"><button type="button" disabled={!exception} onClick={prepareOwner}>Prepare unsent owner follow-up</button>
        <button type="button" className="secondary" onClick={onOpenQl282}>Open QL-282 publication exception</button>
        <button type="button" className="secondary" onClick={onOpenEvidence}>Open source evidence</button></div>
      <div className="ql277-results">{ownerDrafts.map(row=><article key={row.source}><strong>{label(row.source)} · {row.reference}</strong>
        <span>Local follow-up · {row.state.replaceAll('_',' ')}</span><small>Prior {row.originalSourceSha.slice(0,12)} → current {row.currentSourceSha.slice(0,12)} · {row.preparedAt}</small>
        <p>Original Proof-B HTTP 404 · owner contacted NO · routed NO · resolved NO.</p></article>)}</div>
      <p className="ql277-warning">No owner notification, external routing, publication write, exception closure or authenticated original artifact receipt is performed.</p>
    </section>}

    {topic==='sources'&&<section className="ql277-card" aria-labelledby="ql283-source-title">
      <h5 id="ql283-source-title">Six-app immutable source SHA drift &amp; manual recheck queue <span>{queue.freshness.replaceAll('_',' ')}</span></h5>
      <p>Independent public GitHub read at <time dateTime={QL283_OBSERVED_AT}>{QL283_OBSERVED_AT}</time>, compared with QL-282 at {queue.previousObservedAt}. All six main refs moved and all six exact original Proof-B publication paths returned HTTP 404. Links open the pinned public API path only on your request.</p>
      <div className="ql283-timestamp-strip" aria-label="Recheck freshness and worklist status"><span><strong>Snapshot age</strong>{queue.ageHours===null?'Clock review':`${queue.ageHours} hour(s)`}</span>
        <span><strong>Independent source GET due</strong>{queue.nextRecheckAt}</span>
        <span><strong>After-snapshot notices</strong>{queue.rows.reduce((sum,row)=>sum+row.postSnapshotNotices,0)}</span>
        <span><strong>Outdated pinned notices</strong>{queue.rows.reduce((sum,row)=>sum+row.stalePinNotices,0)}</span></div>
      <div className="ql283-source-list" role="table" aria-label="All six source SHA changes and immutable Proof-B results">
        <div className="ql283-source-row heading" role="row"><span role="columnheader">Source</span><span role="columnheader">QL-282 → QL-283 SHA</span><span role="columnheader">Evidence status</span><span role="columnheader">Original pinned path</span></div>
        {queue.rows.map(row=><div className="ql283-source-row" role="row" key={row.source}>
          <strong role="cell">{label(row.source)}</strong><code role="cell" title={`${row.previousSha} → ${row.sha}`}>{row.previousSha?.slice(0,9)} → {row.sha.slice(0,9)}</code>
          <span role="cell"><b>SHA changed</b> · HTTP {row.http}<small>{row.status.replaceAll('_',' ')} · {row.notices} unverified notice(s)</small></span>
          <a role="cell" href={ql283PinnedProofUrl(row.source)} target="_blank" rel="noopener noreferrer">Public immutable GET ↗</a></div>)}</div>
      <div className="ql277-form-grid"><label htmlFor="ql283-recheck-source">Source for manual public recheck worklist
        <select id="ql283-recheck-source" value={selectedSource} onChange={event=>setSelectedSource(event.target.value as Ql270SourceId)}>
          {QL270_SOURCES.map(row=><option key={row.id} value={row.id}>{row.label}</option>)}</select></label>
        <label htmlFor="ql283-recheck-ref">Nonsecret manual recheck reference
          <input id="ql283-recheck-ref" maxLength={32} value={recheckRef} onChange={event=>setRecheckRef(event.target.value)} placeholder="Example: RECHECK-283-CASE" /></label></div>
      <div className="ql277-actions"><button type="button" onClick={prepareRecheck}>Add to local manual recheck queue</button>
        <button type="button" className="secondary" onClick={()=>{setAsOf(new Date());setFeedback('Snapshot age updated locally. No new GET, automatic poll or external task was executed.');}}>Recalculate age only</button></div>
      <div className="ql277-results" aria-label="Unsent manual source recheck worklist">{recheckDrafts.map(row=><article key={row.source}><strong>{label(row.source)} · {row.reference}</strong>
        <span>Local recheck queue · {row.state.replaceAll('_',' ')}</span><small>Immutable SHA {row.sourceSha.slice(0,12)} · {row.preparedAt}</small>
        <p>Scheduled NO · executed NO · no source authenticated · original Proof-B not accepted.</p></article>)}</div>
      <p className="ql277-warning">Source drift, 24-hour age or a new claim requires an independent later GET. A link click is not a verified Proof-B receipt; source integrations remain DISCONNECTED / HOLD.</p>
    </section>}

    <section className="ql277-card ql283-parked-note" aria-labelledby="ql283-ack-title"><h5 id="ql283-ack-title">Six-App Acknowledgement Delivery Evidence Preconditions <span className="ql282-under-review">UNDER REVIEW</span></h5>
      <p><strong>Parked for later.</strong> No ACK collection, delivery, notifications, escalation aging or follow-up is being performed in QL-283. Existing historical claims are not verified delivery receipts. The independent integration security gates remain DISCONNECTED / HOLD.</p></section>

    <section className="ql277-card" aria-labelledby="ql283-packet-title"><h5 id="ql283-packet-title">QL-283 issuer trust, owner follow-up &amp; public source queue packet <span>LOCAL · NOT SENT</span></h5>
      <label className="ql277-note-label" htmlFor="ql283-packet">Read-only evidence packet — source pins, incomplete gates, local drafts and parked ACK decision
        <textarea id="ql283-packet" readOnly rows={11} value={packet}/></label>
      <div className="ql277-actions"><button type="button" onClick={()=>void copyPacket()}>Copy QL-283 local review packet</button>
        <button type="button" className="secondary" onClick={()=>{setTrustDrafts([]);setOwnerDrafts([]);setRecheckDrafts([]);
          setTrustRef('');setOwnerRef('');setRecheckRef('');setFeedback('QL-283 local drafts cleared. QL-282 source claims and the parked ACK decision remain untouched.');}}>Clear QL-283 local drafts</button></div>
      <p className="ql277-feedback" role="status" aria-live="polite">{feedback}</p></section>
  </section>;
}

import {useState} from 'react';
import {QL270_SOURCES,type Ql270SourceId} from './ql270ConnectionCentre';
import type {Ql279ArrivalClaim} from './ql279ReviewerCustodyEscalation';
import type {Ql280AckClaim} from './ql280ReceiptReconciliation';
import type {Ql281ChallengeRequest} from './ql281SignatureProofCustody';
import {QL282_OBSERVED_AT,QL282_ISSUER_READINESS_GATES,QL282_ACK_WORKSTREAM,
  ql282AckParking,ql282AuditPacket,ql282PinnedProofUrl,ql282PrepareException,ql282PrepareIssuerReview,
  ql282PublicationTriage,type Ql282IssuerRequest,type Ql282ExceptionDraft} from './ql282IssuerPublicationReview';
import './ql277-drift-review.css';
import './ql278-followup-desk.css';
import './ql280-receipt-reconciliation.css';
import './ql281-signature-proof-custody.css';
import './ql282-issuer-publication.css';

type Topic='issuer'|'publication'|'ack';
type Filter='all'|'moved'|'unchanged';
const label=(id:Ql270SourceId)=>QL270_SOURCES.find(row=>row.id===id)?.label??id;

export function Ql282IssuerPublicationReview({challengeRequests,arrivalClaims,ackClaims,onOpenQl281,onOpenEvidence}:{
  challengeRequests:readonly Ql281ChallengeRequest[];arrivalClaims:readonly Ql279ArrivalClaim[];
  ackClaims:readonly Ql280AckClaim[];onOpenQl281:()=>void;onOpenEvidence:()=>void;
}) {
  const [topic,setTopic]=useState<Topic>('issuer');
  const [selectedChallenge,setSelectedChallenge]=useState('');
  const [issuerReference,setIssuerReference]=useState('');
  const [issuerRequests,setIssuerRequests]=useState<Ql282IssuerRequest[]>([]);
  const [source,setSource]=useState<Ql270SourceId>('rosiedazzlers');
  const [exceptionReference,setExceptionReference]=useState('');
  const [exceptions,setExceptions]=useState<Ql282ExceptionDraft[]>([]);
  const [filter,setFilter]=useState<Filter>('all');
  const [asOf,setAsOf]=useState(()=>new Date());
  const [feedback,setFeedback]=useState('No original challenge issuer authenticated; six publication exceptions open. Acknowledgement delivery evidence is under review and parked.');
  const proof=ql282PublicationTriage(asOf,arrivalClaims);
  const visible=proof.rows.filter(row=>filter==='all'||(filter==='moved'?row.moved:!row.moved));
  const challenge=challengeRequests.find(row=>row.checkId===selectedChallenge)??challengeRequests[0];
  const packet=ql282AuditPacket(issuerRequests,exceptions,ackClaims,asOf);
  const parking=ql282AckParking(ackClaims);

  function prepareIssuer() {
    if(!challenge){setFeedback('Open QL-281 and prepare a nonsecret unsigned challenge request first.');return;}
    const result=ql282PrepareIssuerReview(challenge,issuerReference,new Date());
    if(!result.ok){setFeedback(result.reason);return;}
    setIssuerRequests(old=>[...old.filter(row=>row.checkId!==result.request.checkId),result.request]);
    setIssuerReference('');
    setFeedback('Issuer readiness REFERENCE REVIEW prepared; no issuer was authenticated, challenge issued or owner approval granted.');
  }

  function prepareException() {
    const result=ql282PrepareException(source,exceptionReference,new Date());
    if(!result.ok){setFeedback(result.reason);return;}
    setExceptions(old=>[...old.filter(row=>row.source!==result.draft.source),result.draft]);
    setExceptionReference('');
    setFeedback('Local publication exception TRIAGE draft prepared; no source team was notified and the original Proof-B remains missing.');
  }

  async function copyPacket() {
    try {
      if(!navigator.clipboard?.writeText)throw Error('Clipboard unavailable');
      await navigator.clipboard.writeText(packet);
      setFeedback('QL-282 local source and issuer packet copied. No external routing, challenge or acknowledgement action occurred.');
    } catch {setFeedback('Clipboard unavailable. Select the read-only packet to copy manually; no data was sent.');}
  }

  return <section className="ql277-review ql280-desk ql281-desk ql282-desk" data-ql282-desk aria-labelledby="ql282-title">
    <header className="ql277-heading"><div>
      <p className="ql271-eyebrow">QL-282 · Issuer readiness &amp; source publication triage</p>
      <h4 id="ql282-title">Reviewer challenge issuer · Proof-B exceptions</h4>
      <p>Recorded public source observations, traceable original challenge prerequisites and practical publication triage. We have parked the acknowledgement delivery evidence workstream under review for later, as requested.</p>
    </div><span>INTEGRATIONS DISCONNECTED / HOLD</span></header>
    <div className="ql277-stats" aria-label="QL-282 evidence and workstream status">
      <div><small>Original challenge issuers verified</small><strong>0</strong><em>{issuerRequests.length} reference-only review(s)</em></div>
      <div><small>Proof-B publication exceptions</small><strong>{proof.missing} / 6</strong><em>Exact immutable origin HTTP 404</em></div>
      <div><small>Source SHAs moved</small><strong>{proof.moved} / 6</strong><em>{proof.unchanged} unchanged since QL-281</em></div>
      <div><small>ACK delivery evidence workstream</small><strong className="ql282-review-value">Under Review</strong><em>Parked for later · no active action</em></div>
    </div>
    <nav className="ql277-tabs" aria-label="QL-282 operator review topics">
      <button type="button" className={topic==='issuer'?'active':''} aria-current={topic==='issuer'?'page':undefined} onClick={()=>setTopic('issuer')}>01 Issuer readiness</button>
      <button type="button" className={topic==='publication'?'active':''} aria-current={topic==='publication'?'page':undefined} onClick={()=>setTopic('publication')}>02 Proof-B publication exceptions</button>
      <button type="button" className={topic==='ack'?'active':''} aria-current={topic==='ack'?'page':undefined} onClick={()=>setTopic('ack')}>03 ACK delivery evidence · Under Review</button>
    </nav>

    {topic==='issuer'&&<section className="ql277-card" aria-labelledby="ql282-issuer-title">
      <h5 id="ql282-issuer-title">Original independent challenge issuer readiness <span>0 / {QL282_ISSUER_READINESS_GATES.length} VERIFIED</span></h5>
      <p>An externally issued original challenge cannot be simulated by entering a reference. Issuer identity, relying-party authority, separately pinned key, unpredictable nonce, expiry, owner TEST consent and independent review of the original response must precede any trusted claim.</p>
      {challengeRequests.length===0?<div className="ql279-empty"><strong>No QL-281 unsigned challenge request in this session.</strong><p>Open QL-281 to prepare an external reference-only request based on a QL-280 reviewer claim. No challenge is issued by these screens.</p></div>:
        <div className="ql281-source-grid">{challengeRequests.map(row=><article key={row.checkId}><strong>{row.checkId}</strong><span>{row.challengeRequestReferenceClaim}</span><small>{row.status.replaceAll('_',' ')} · {row.challenge.replaceAll('_',' ')}</small></article>)}</div>}
      <div className="ql277-form-grid"><label htmlFor="ql282-challenge">QL-281 challenge request reference
        <select id="ql282-challenge" disabled={!challenge} value={challenge?.checkId??''} onChange={event=>setSelectedChallenge(event.target.value)}>
          {challengeRequests.length===0?<option value="">No local request</option>:challengeRequests.map(row=><option key={row.checkId} value={row.checkId}>{row.checkId} · {row.challengeRequestReferenceClaim}</option>)}</select></label>
        <label htmlFor="ql282-issuer-ref">External issuer readiness case reference CLAIM
          <input id="ql282-issuer-ref" maxLength={32} value={issuerReference} onChange={event=>setIssuerReference(event.target.value)} placeholder="Nonsecret case identifier only" /></label></div>
      <ol className="ql278-gate-list" aria-label="Seven independent challenge issuer readiness gates">{QL282_ISSUER_READINESS_GATES.map(row=><li key={row.id}>
        <span aria-hidden="true">!</span><div><strong>{row.label}</strong><small>{row.state.replaceAll('_',' ')} · NOT SATISFIED</small></div></li>)}</ol>
      <div className="ql277-actions"><button type="button" disabled={!challenge} onClick={prepareIssuer}>Prepare issuer readiness review claim</button>
        <button type="button" className="secondary" onClick={onOpenQl281}>Open QL-281 challenge source</button></div>
      <div className="ql277-results">{issuerRequests.map(row=><article key={row.checkId}><strong>{row.checkId} · {row.issuerReadinessReference}</strong>
        <span>{row.disposition.replaceAll('_',' ')} · {row.state.replaceAll('_',' ')}</span><small>Original QL-281 request {row.challengeRequestClaim} · {row.preparedAt}</small>
        <p>Issuer {row.issuer.replaceAll('_',' ')}; nonce {row.nonce.replaceAll('_',' ')}; owner authorization {row.ownerApproval.replaceAll('_',' ')}.</p></article>)}</div>
      <p className="ql277-warning">No nonce generation, challenge transport, private signer access, key provisioning, real reviewer authentication or original evidence acceptance happens here.</p>
    </section>}

    {topic==='publication'&&<section className="ql277-card" aria-labelledby="ql282-publication-title">
      <h5 id="ql282-publication-title">Proof-B source publication exception triage <span>{proof.freshness.replaceAll('_',' ')}</span></h5>
      <p>Read-only GitHub check at {QL282_OBSERVED_AT}, compared with QL-281 at {proof.previousObservedAt}. Four source revisions changed; two did not. Every original required path was absent at its exact immutable pin. These are actionable local review categories, not resolved custody claims.</p>
      <div className="ql282-filter-row" role="group" aria-label="Filter source publication exceptions">
        <button type="button" aria-pressed={filter==='all'} onClick={()=>setFilter('all')}>All six ({proof.rows.length})</button>
        <button type="button" aria-pressed={filter==='moved'} onClick={()=>setFilter('moved')}>SHA changed ({proof.moved})</button>
        <button type="button" aria-pressed={filter==='unchanged'} onClick={()=>setFilter('unchanged')}>SHA unchanged ({proof.unchanged})</button>
      </div>
      <div className="ql278-aging-list" role="table" aria-label="QL-282 original Proof-B publication exception source diff">
        <div className="ql278-aging-row head" role="row"><span role="columnheader">Application</span><span role="columnheader">QL-281 → QL-282</span><span role="columnheader">Exception</span><span role="columnheader">Original path</span></div>
        {visible.map(row=><div className="ql278-aging-row" role="row" key={row.source}>
          <strong role="cell">{label(row.source)}</strong><code role="cell" title={`${row.previousSha} -> ${row.sha}`}>{row.previousSha?.slice(0,9)} → {row.sha.slice(0,9)}</code>
          <span role="cell">{row.reason.replaceAll('_',' ')} · HTTP {row.http} · {row.notices} notice(s)</span>
          <a role="cell" href={ql282PinnedProofUrl(row.source)} target="_blank" rel="noopener noreferrer">Pinned source ↗</a></div>)}</div>
      <div className="ql281-source-grid" aria-label="Publication exception timing">
        <article><strong>Snapshot age</strong><span>{proof.ageHours??'Clock review'} {proof.ageHours===null?'':'hour(s)'}</span><small>Recheck due {proof.nextRecheckAt}</small></article>
        <article><strong>Notices after public snapshot</strong><span>{proof.rows.reduce((count,row)=>count+row.postSnapshotNotices,0)}</span><small>Require a newer independent original-source GET</small></article>
        <article><strong>Outdated source-pinned notices</strong><span>{proof.rows.reduce((count,row)=>count+row.stalePinNotices,0)}</span><small>Never accepted as original Proof-B</small></article>
      </div>
      <div className="ql277-form-grid"><label htmlFor="ql282-source">Source with open publication exception
        <select id="ql282-source" value={source} onChange={event=>setSource(event.target.value as Ql270SourceId)}>
          {QL270_SOURCES.map(row=><option key={row.id} value={row.id}>{row.label}</option>)}</select></label>
        <label htmlFor="ql282-exception-ref">Nonsecret local triage case reference
          <input id="ql282-exception-ref" maxLength={32} value={exceptionReference} onChange={event=>setExceptionReference(event.target.value)} placeholder="Example: REVIEW-282-CASE" /></label></div>
      <div className="ql277-actions"><button type="button" onClick={prepareException}>Prepare local source publication triage</button>
        <button type="button" className="secondary" onClick={()=>{setAsOf(new Date());setFeedback('Snapshot age recalculated locally; no new public or private GET was sent.');}}>Refresh snapshot age only</button>
        <button type="button" className="secondary" onClick={onOpenEvidence}>Open original six-app evidence</button></div>
      <div className="ql277-results">{exceptions.map(row=><article key={row.source}><strong>{label(row.source)} · {row.reference}</strong>
        <span>{row.reason.replaceAll('_',' ')} · {row.state.replaceAll('_',' ')}</span>
        <small>Immutable source {row.sourceSha.slice(0,12)} · observed {row.observedAt}</small>
        <p>Local review only. External routing NO; original proof accepted NO; publication exception resolved NO.</p></article>)}</div>
      <p className="ql277-warning">Public HTTP 404 shows absence only at the checked immutable path/time. This UI does not write to any source repository or authenticate an original signer, custodian or TEST tenant.</p>
    </section>}

    {topic==='ack'&&<section className="ql277-card ql282-parked" aria-labelledby="ql282-ack-title">
      <h5 id="ql282-ack-title">Six-App Acknowledgement Delivery Evidence Preconditions <span className="ql282-under-review">UNDER REVIEW</span></h5>
      <div className="ql282-pause-banner" role="status"><strong>Workstream parked for later</strong>
        <p>Per our current direction, this activity is marked <strong>Under Review</strong> and set aside for a later build. We are not collecting new delivery evidence, requesting acknowledgements, routing messages or advancing a deadline in this build.</p></div>
      <p>Existing QL-279/280 acknowledgement reference drafts are retained in memory when available, but remain unverified historical claims. The separate security prerequisites that keep source integrations disconnected have not been waived.</p>
      <div className="ql281-source-grid" aria-label="Parked six-app acknowledgement delivery evidence queue">{parking.map(row=><article key={row.source}>
        <strong>{row.label}</strong><span>UNDER REVIEW · PARKED</span><small>{row.legacyUnverifiedReferences} previous unverified reference(s) · no active follow-up · no authenticated delivery</small></article>)}</div>
      <p className="ql282-pause-note">Recorded decision: {QL282_ACK_WORKSTREAM.disposition.replaceAll('_',' ')} · actions disabled · return to this workstream only when separately requested.</p>
    </section>}

    <section className="ql277-card" aria-labelledby="ql282-packet-title"><h5 id="ql282-packet-title">QL-282 reviewer and publication packet <span>LOCAL DRAFT · NOT SENT</span></h5>
      <label className="ql277-note-label" htmlFor="ql282-packet">Read-only issuer readiness, public source exceptions and parked workstream decision
        <textarea id="ql282-packet" readOnly rows={11} value={packet}/></label>
      <div className="ql277-actions"><button type="button" onClick={()=>void copyPacket()}>Copy QL-282 review packet</button>
        <button type="button" className="secondary" onClick={()=>{setIssuerRequests([]);setExceptions([]);setIssuerReference('');setExceptionReference('');setFeedback('QL-282 local review drafts cleared. QL-279/280/281 reference sources and parked acknowledgement decision were preserved.');}}>Clear QL-282 local drafts</button></div>
      <p className="ql277-feedback" role="status" aria-live="polite">{feedback}</p>
      <p className="ql277-warning">Software-only review: no original reviewer challenge was issued; original Proof-B remains absent; no source gateway or live communication is permitted. Integrations remain DISCONNECTED / HOLD, independently of the parked ACK workstream label.</p>
    </section>
  </section>;
}

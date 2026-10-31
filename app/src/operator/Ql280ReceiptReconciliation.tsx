import { useState,type Dispatch,type SetStateAction } from 'react';
import { QL270_SOURCES,type Ql270SourceId } from './ql270ConnectionCentre';
import { QL275_OWNER_CHECKS } from './ql275OperatorWalkthrough';
import { type Ql279ArrivalClaim,type Ql279EscalationDraft,type Ql279ReviewerDraft } from './ql279ReviewerCustodyEscalation';
import { QL280_OBSERVED_AT,QL280_REVIEWER_RECEIPT_PRECONDITIONS,ql280AckAging,ql280AuditPacket,
  ql280PinnedProofUrl,ql280PrepareAckClaim,ql280PrepareReviewerReceipt,ql280ProofReturns,ql280ReconcileArrival,
  type Ql280AckClaim,type Ql280ArrivalReconciliation,type Ql280ReviewerReceiptClaim } from './ql280ReceiptReconciliation';
import './ql277-drift-review.css';
import './ql278-followup-desk.css';
import './ql279-reviewer-custody-escalation.css';
import './ql280-receipt-reconciliation.css';

type Topic='reviewer'|'returns'|'ack';
const escalationKey=(row:Ql279EscalationDraft)=>`${row.source}|${row.reason}`;

export function Ql280ReceiptReconciliation({reviewerDrafts,arrivalClaims,escalations,reviewerReceipts,setReviewerReceipts,
  reconciliations,setReconciliations,ackClaims,setAckClaims,onOpenQl279,onOpenEvidence}: {
  reviewerDrafts:readonly Ql279ReviewerDraft[];arrivalClaims:readonly Ql279ArrivalClaim[];
  escalations:readonly Ql279EscalationDraft[];onOpenQl279:()=>void;onOpenEvidence:()=>void;
  reviewerReceipts:Ql280ReviewerReceiptClaim[];setReviewerReceipts:Dispatch<SetStateAction<Ql280ReviewerReceiptClaim[]>>;
  reconciliations:Ql280ArrivalReconciliation[];setReconciliations:Dispatch<SetStateAction<Ql280ArrivalReconciliation[]>>;
  ackClaims:Ql280AckClaim[];setAckClaims:Dispatch<SetStateAction<Ql280AckClaim[]>>;
}) {
  const [topic,setTopic]=useState<Topic>('reviewer');
  const [selectedCheck,setSelectedCheck]=useState<Ql279ReviewerDraft['checkId']>('keyboard');
  const [reviewerRef,setReviewerRef]=useState('');
  const [selectedSource,setSelectedSource]=useState<Ql270SourceId>('rosiedazzlers');
  const [selectedEscalation,setSelectedEscalation]=useState('');
  const [ackReference,setAckReference]=useState('');
  const [asOf,setAsOf]=useState(()=>new Date());
  const [feedback,setFeedback]=useState('No original reviewer receipt accepted, no Proof-B returned and no real escalation acknowledgement verified.');
  const report=ql280ProofReturns(asOf,arrivalClaims);
  const reviewer=reviewerDrafts.find(row=>row.checkId===selectedCheck)??reviewerDrafts[0];
  const activeArrivals=arrivalClaims.filter(row=>row.source===selectedSource);
  const escalation=escalations.find(row=>escalationKey(row)===selectedEscalation)??escalations[0];
  const packet=ql280AuditPacket(reviewerReceipts,reconciliations,ackClaims,escalations,asOf);

  function prepareReviewer() {
    if(!reviewer){setFeedback('Open QL-279 and prepare a genuine local reviewer disposition draft first.');return;}
    const result=ql280PrepareReviewerReceipt(reviewer,reviewerRef,new Date());
    if(!result.ok){setFeedback(result.reason);return;}
    setReviewerReceipts(old=>[...old.filter(item=>item.checkId!==result.claim.checkId),result.claim]);
    setReviewerRef('');
    setFeedback('Reviewer receipt REFERENCE CLAIM prepared; all original identity, signature, witness and owner prerequisites remain NOT VERIFIED.');
  }

  function reconcileArrival(claim:Ql279ArrivalClaim) {
    const result=ql280ReconcileArrival(claim,new Date());
    if(!result.ok){setFeedback(result.reason);return;}
    setReconciliations(old=>[...old.filter(item=>item.source!==result.record.source||item.kind!==result.record.kind),result.record]);
    setFeedback(`${result.record.relation.replaceAll('_',' ')}. Historical public HTTP 404 cannot authenticate original custody or later notices.`);
  }

  function prepareAck() {
    if(!escalation){setFeedback('Open QL-279 and prepare an escalation draft first.');return;}
    const result=ql280PrepareAckClaim(escalation,ackReference,new Date());
    if(!result.ok){setFeedback(result.reason);return;}
    setAckClaims(old=>[...old.filter(item=>item.source!==result.claim.source||item.escalationReason!==result.claim.escalationReason),result.claim]);
    setAckReference('');
    setFeedback('External acknowledgement reference CLAIM added. No message was actually sent or independently acknowledged.');
  }

  async function copyPacket() {
    try {
      if(!navigator.clipboard?.writeText)throw Error('Clipboard unavailable');
      await navigator.clipboard.writeText(packet);
      setFeedback('Local review packet copied only; no reviewer receipt, source proof or acknowledgement was transmitted.');
    } catch {setFeedback('Clipboard unavailable. Select the read-only packet to copy manually; nothing was transmitted.');}
  }

  return <section className="ql277-review ql280-desk" data-ql280-desk aria-labelledby="ql280-title">
    <header className="ql277-heading"><div>
      <p className="ql271-eyebrow">QL-280 · Original evidence receipt reconciliation</p>
      <h4 id="ql280-title">Reviewer receipt gates · Proof-B returns · acknowledgement aging</h4>
      <p>A concise next-step audit using the current session's QL-279 drafts and actual pinned public source results. It cannot authenticate original reviewer receipts, source signatures, delivery or owner approval.</p>
    </div><span>DISCONNECTED / HOLD</span></header>
    <div className="ql277-stats" aria-label="QL-280 receipt and proof return status">
      <div><small>Original reviewer receipts</small><strong>0</strong><em>Reference claims: {reviewerReceipts.length}</em></div>
      <div><small>Proof-B still missing</small><strong>{report.missing} / 6</strong><em>HTTP 404 at pinned main</em></div>
      <div><small>Source SHA drift</small><strong>{report.changed} / 6</strong><em>{report.unchanged} unchanged since QL-279</em></div>
      <div><small>Real acknowledgements</small><strong>0</strong><em>Unverified claims: {ackClaims.length}</em></div>
    </div>
    <nav className="ql277-tabs" aria-label="QL-280 held review topics">
      <button type="button" className={topic==='reviewer'?'active':''} aria-current={topic==='reviewer'?'page':undefined} onClick={()=>setTopic('reviewer')}>01 Reviewer receipt preconditions</button>
      <button type="button" className={topic==='returns'?'active':''} aria-current={topic==='returns'?'page':undefined} onClick={()=>setTopic('returns')}>02 Original Proof-B return reconciliation</button>
      <button type="button" className={topic==='ack'?'active':''} aria-current={topic==='ack'?'page':undefined} onClick={()=>setTopic('ack')}>03 Escalation acknowledgement aging</button>
    </nav>

    {topic==='reviewer'&&<section className="ql277-card" aria-labelledby="ql280-reviewer-title">
      <h5 id="ql280-reviewer-title">Authentic reviewer receipt prerequisites <span>0 / {QL280_REVIEWER_RECEIPT_PRECONDITIONS.length} VERIFIED</span></h5>
      <p>Choose a local QL-279 proposed reviewer disposition. An external reference claim may help coordinate a human request, but this desk cannot log in as a reviewer, obtain an original signed record, validate a key or accept a retest.</p>
      {reviewerDrafts.length===0?<div className="ql279-empty"><strong>No QL-279 reviewer draft in this session.</strong><p>Open the prior reviewer desk and create an evidence-incomplete or retest-required proposal for a genuine QL-278 ticket.</p></div>:
        <div className="ql279-ticket-strip" aria-label="Shared local QL-279 reviewer drafts">{reviewerDrafts.map(row=><div key={row.checkId}>
          <strong>{QL275_OWNER_CHECKS.find(check=>check.id===row.checkId)?.label}</strong>
          <span>{row.decision.replaceAll('_',' ')} · OPEN</span><small>External reviewer reference {row.reviewerReferenceClaim} / NOT AUTHENTICATED</small></div>)}</div>}
      <div className="ql277-actions"><button type="button" className="secondary" onClick={onOpenQl279}>Open QL-279 source drafts</button></div>
      <div className="ql277-form-grid"><label htmlFor="ql280-reviewer-case">Reviewer disposition case
        <select id="ql280-reviewer-case" disabled={!reviewer} value={reviewer?.checkId??''} onChange={event=>setSelectedCheck(event.target.value as Ql279ReviewerDraft['checkId'])}>
          {reviewerDrafts.length===0?<option value="">No local reviewer claim</option>:reviewerDrafts.map(row=><option key={row.checkId} value={row.checkId}>{QL275_OWNER_CHECKS.find(check=>check.id===row.checkId)?.label}</option>)}</select></label>
        <label htmlFor="ql280-reviewer-ref">Original reviewer receipt external reference CLAIM
          <input id="ql280-reviewer-ref" maxLength={32} value={reviewerRef} onChange={event=>setReviewerRef(event.target.value)} placeholder="Nonsecret reference, not a signature" /></label></div>
      <ol className="ql278-gate-list" aria-label="Six original reviewer receipt verification preconditions">{QL280_REVIEWER_RECEIPT_PRECONDITIONS.map(gate=><li key={gate.key}>
        <span aria-hidden="true">!</span><div><strong>{gate.label}</strong><small>{gate.state.replaceAll('_',' ')} · NOT SATISFIED</small></div></li>)}</ol>
      <div className="ql277-actions"><button type="button" disabled={!reviewer} onClick={prepareReviewer}>Prepare original reviewer receipt request claim</button></div>
      <div className="ql277-results">{reviewerReceipts.map(row=><article key={row.checkId}><strong>{QL275_OWNER_CHECKS.find(check=>check.id===row.checkId)?.label}</strong>
        <span>{row.acceptance.replaceAll('_',' ')} · {row.state.replaceAll('_',' ')}</span>
        <small>Reviewer claim {row.reviewerReferenceClaim} · receipt ref {row.receiptReferenceClaim} · {row.preparedAt}</small>
        <p>{row.verified}/{row.preconditions.length} verified. Reviewer authentication NOT PERFORMED, original signature NOT RECEIVED, owner acceptance NOT GIVEN.</p></article>)}</div>
      <p className="ql277-warning">An external reference, checkbox or local copy is never an authenticated reviewer receipt, independent witness approval or signed accessibility closure. All original proof preconditions remain hard gates.</p>
    </section>}

    {topic==='returns'&&<section className="ql277-card" aria-labelledby="ql280-returns-title">
      <h5 id="ql280-returns-title">Pinned six-app original Proof-B returns <span>{report.freshness.replaceAll('_',' ')}</span></h5>
      <p>QL-280 genuine public GitHub recheck {QL280_OBSERVED_AT}. Three source `main` SHAs moved and three were unchanged; all six exact original proof targets returned HTTP 404. A later arrival claim requires a newer independent public check, even if a historical SHA remains unchanged.</p>
      <div className="ql278-aging-list" role="table" aria-label="QL-280 six-app source proof and original arrival reconciliation ledger">
        <div className="ql278-aging-row head" role="row"><span role="columnheader">Application</span><span role="columnheader">QL-279 → QL-280</span><span role="columnheader">Original</span><span role="columnheader">Proof</span></div>
        {report.rows.map(row=><div className="ql278-aging-row" role="row" key={row.source}>
          <strong role="cell">{QL270_SOURCES.find(app=>app.id===row.source)?.label}</strong>
          <code role="cell" title={`${row.previousSha} -> ${row.sha}`}>{row.previousSha?.slice(0,9)} → {row.sha.slice(0,9)}</code>
          <span role="cell">{row.moved?'SHA MOVED':'SAME SHA'} · HTTP {row.http} · {row.unverifiedArrivalClaims} claimed notice(s)</span>
          <a role="cell" href={ql280PinnedProofUrl(row.source)} target="_blank" rel="noopener noreferrer">Pinned proof ↗</a></div>)}</div>
      <div className="ql277-form-grid"><label htmlFor="ql280-source">Source for QL-279 arrival-notice reconciliation
        <select id="ql280-source" value={selectedSource} onChange={event=>setSelectedSource(event.target.value as Ql270SourceId)}>
          {QL270_SOURCES.map(app=><option key={app.id} value={app.id}>{app.label}</option>)}</select></label></div>
      {activeArrivals.length===0?<div className="ql279-empty"><strong>No original-arrival notice claim for this source.</strong><p>There is no original Proof-B artifact here to reconcile. Use the QL-279 watch only for a genuine, nonsecret external notice reference.</p></div>:
        <div className="ql277-results">{activeArrivals.map(claim=><article key={claim.kind}><strong>{claim.kind.replaceAll('_',' ')}</strong>
          <span>CLAIMED NOT CONFIRMED · original source HTTP 404</span>
          <small>Reference {claim.referenceClaim} · pinned QL-279 SHA {claim.sha.slice(0,12)} · {claim.preparedAt}</small>
          <div className="ql277-actions"><button type="button" onClick={()=>reconcileArrival(claim)}>Reconcile this unverified notice</button></div></article>)}</div>}
      <div className="ql277-actions"><button type="button" className="secondary" onClick={onOpenQl279}>Open QL-279 arrival watch</button>
        <button type="button" className="secondary" onClick={onOpenEvidence}>Open original six-app evidence</button></div>
      <div className="ql277-results">{reconciliations.map(row=><article key={`${row.source}-${row.kind}`}><strong>{QL270_SOURCES.find(app=>app.id===row.source)?.label}</strong>
        <span>{row.relation.replaceAll('_',' ')} · {row.disposition.replaceAll('_',' ')}</span>
        <small>Claimed SHA {row.claimedSha.slice(0,12)} → current snapshot SHA {row.currentSha.slice(0,12)} · HTTP {row.currentHttp}</small>
        <p>Original accepted: NO. Later claims are not retrospectively verified by earlier public GETs. Independent raw-proof, signer, custody and witness verification is still absent.</p></article>)}</div>
      <p className="ql277-warning">A 404 confirms absence at the checked immutable path/time only. Do not call an externally claimed arrival verified or run private gateway GETs until fresh genuine original evidence and owner TEST approval exist.</p>
    </section>}

    {topic==='ack'&&<section className="ql277-card" aria-labelledby="ql280-ack-title">
      <h5 id="ql280-ack-title">Escalation acknowledgement aging <span>UNSENT · NO VERIFIED ACK</span></h5>
      <p>QL-279 escalations are **local drafts**, never dispatched. Their age is measured from draft creation, not from an imagined delivery or SLA. Even a separately supplied acknowledgement reference stays unverified until the original delivery and independently authenticated response exist.</p>
      {escalations.length===0?<div className="ql279-empty"><strong>No QL-279 escalation draft in this session.</strong><p>Prepare a source-specific human follow-up draft in the QL-279 desk. This screen does not send it automatically.</p></div>:
        <div className="ql280-ack-grid" aria-label="Six-app escalation draft aging review">{escalations.map(row=>{
          const age=ql280AckAging(row,asOf);
          return <article key={escalationKey(row)}><strong>{QL270_SOURCES.find(app=>app.id===row.source)?.label}</strong>
            <span>{age.priority.replaceAll('_',' ')} · {age.draftAgeHours??'clock review'}h</span>
            <small>{row.reason.replaceAll('_',' ')} / DRAFT NOT SENT / ACK NOT VERIFIED</small></article>;
        })}</div>}
      <div className="ql277-form-grid"><label htmlFor="ql280-escalation">Source-specific unsent escalation draft
        <select id="ql280-escalation" disabled={!escalation} value={escalation?escalationKey(escalation):''} onChange={event=>setSelectedEscalation(event.target.value)}>
          {escalations.length===0?<option value="">No local escalation</option>:escalations.map(row=><option key={escalationKey(row)} value={escalationKey(row)}>{QL270_SOURCES.find(app=>app.id===row.source)?.label} · {row.reason.replaceAll('_',' ')}</option>)}</select></label>
        <label htmlFor="ql280-ack-ref">External acknowledgement receipt reference CLAIM
          <input id="ql280-ack-ref" maxLength={32} value={ackReference} onChange={event=>setAckReference(event.target.value)} placeholder="Nonsecret reference; no delivery evidence" /></label></div>
      <div className="ql277-actions"><button type="button" disabled={!escalation} onClick={prepareAck}>Prepare unverified acknowledgement claim</button>
        <button type="button" className="secondary" onClick={onOpenQl279}>Open QL-279 escalation drafts</button>
        <button type="button" className="secondary" onClick={()=>{setAsOf(new Date());setFeedback('Local draft-age display refreshed; no message dispatched or public source queried.');}}>Refresh draft age only</button></div>
      <div className="ql277-results">{ackClaims.map(row=><article key={`${row.source}-${row.escalationReason}`}><strong>{QL270_SOURCES.find(app=>app.id===row.source)?.label}</strong>
        <span>{row.acknowledgement.replaceAll('_',' ')} · {row.state.replaceAll('_',' ')}</span>
        <small>External claim {row.receiptReferenceClaim} · {row.preparedAt}</small>
        <p>Actual delivery NOT RECORDED; acknowledgement NOT VERIFIED; owner TEST approval NOT GIVEN.</p></article>)}</div>
      <p className="ql277-warning">No notification, GitHub issue, email, phone, SMS, custodian callback or private relay is triggered. An unsent draft cannot have a verified response SLA or a confirmed acknowledgement.</p>
    </section>}

    <section className="ql277-card" aria-labelledby="ql280-packet-title"><h5 id="ql280-packet-title">QL-280 original-proof review packet <span>LOCAL DRAFT · NOT SENT</span></h5>
      <label className="ql277-note-label" htmlFor="ql280-packet">Read-only reviewer receipt, source return and acknowledgement comparison
        <textarea id="ql280-packet" rows={10} readOnly value={packet} /></label>
      <div className="ql277-actions"><button type="button" onClick={()=>void copyPacket()}>Copy QL-280 audit packet</button>
        <button type="button" className="secondary" onClick={()=>{setReviewerReceipts([]);setReconciliations([]);setAckClaims([]);setReviewerRef('');setAckReference('');setFeedback('All local QL-280 claims cleared; QL-279 source drafts and QL-278 retest tickets were preserved.');}}>Clear QL-280 drafts</button></div>
      <p className="ql277-feedback" role="status" aria-live="polite">{feedback}</p>
      <p className="ql277-warning">All QL-280 work is session-only, not a durable or authenticated audit trail. No original receipt acceptance, storage write, customer records, signer key handling, tenant authorization, authenticated gateway GET or live communication is enabled. Six-app integrations remain DISCONNECTED / HOLD.</p>
    </section>
  </section>;
}

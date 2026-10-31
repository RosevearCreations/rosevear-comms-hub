import { useState,type Dispatch,type SetStateAction } from 'react';
import { QL270_SOURCES,type Ql270SourceId } from './ql270ConnectionCentre';
import { QL275_OWNER_CHECKS } from './ql275OperatorWalkthrough';
import type { Ql279ArrivalClaim,Ql279EscalationDraft } from './ql279ReviewerCustodyEscalation';
import type { Ql280ReviewerReceiptClaim,Ql280AckClaim } from './ql280ReceiptReconciliation';
import { QL281_OBSERVED_AT,QL281_REVIEWER_CHALLENGE_GATES,QL281_ACK_CUSTODY_GATES,
  ql281AuditPacket,ql281CustodyQueue,ql281PinnedProofUrl,ql281PrepareAckCustody,
  ql281PrepareChallengeRequest,ql281PublicationDiff,
  type Ql281ChallengeRequest,type Ql281AckCustodyRequest } from './ql281SignatureProofCustody';
import './ql277-drift-review.css';
import './ql278-followup-desk.css';
import './ql280-receipt-reconciliation.css';
import './ql281-signature-proof-custody.css';

type Topic='signature'|'proof'|'custody';
const appLabel=(source:Ql270SourceId)=>QL270_SOURCES.find(row=>row.id===source)?.label??source;

export function Ql281SignatureProofCustody({reviewerReceipts,arrivalClaims,ackClaims,escalations,challengeRequests,setChallengeRequests,
  onOpenQl280,onOpenQl279,onOpenEvidence}:{
  reviewerReceipts:readonly Ql280ReviewerReceiptClaim[];arrivalClaims:readonly Ql279ArrivalClaim[];
  ackClaims:readonly Ql280AckClaim[];escalations:readonly Ql279EscalationDraft[];
  challengeRequests:Ql281ChallengeRequest[];setChallengeRequests:Dispatch<SetStateAction<Ql281ChallengeRequest[]>>;
  onOpenQl280:()=>void;onOpenQl279:()=>void;onOpenEvidence:()=>void;
}) {
  const [topic,setTopic]=useState<Topic>('signature');
  const [chosenReceipt,setChosenReceipt]=useState('');
  const [challengeReference,setChallengeReference]=useState('');
  const [chosenAck,setChosenAck]=useState('');
  const [custodyReference,setCustodyReference]=useState('');
  const [custodyRequests,setCustodyRequests]=useState<Ql281AckCustodyRequest[]>([]);
  const [asOf,setAsOf]=useState(()=>new Date());
  const [feedback,setFeedback]=useState('No reviewer challenge issued, no Proof-B verified and no escalation acknowledgement accepted.');

  const proof=ql281PublicationDiff(asOf,arrivalClaims);
  const selectedReceipt=reviewerReceipts.find(row=>row.checkId===chosenReceipt)??reviewerReceipts[0];
  const ackKey=(row:Ql280AckClaim)=>`${row.source}|${row.escalationReason}`;
  const selectedAck=ackClaims.find(row=>ackKey(row)===chosenAck)??ackClaims[0];
  const custodyQueue=ql281CustodyQueue(ackClaims,escalations);
  const packet=ql281AuditPacket(challengeRequests,custodyRequests,ackClaims,escalations,asOf);

  function prepareChallenge() {
    if(!selectedReceipt){setFeedback('Open QL-280 to prepare a local reviewer receipt reference first.');return;}
    const result=ql281PrepareChallengeRequest(selectedReceipt,challengeReference,new Date());
    if(!result.ok){setFeedback(result.reason);return;}
    setChallengeRequests(old=>[...old.filter(row=>row.checkId!==result.request.checkId),result.request]);
    setChallengeReference('');
    setFeedback('Signature CHALLENGE REQUEST reference prepared. No nonce was issued and no original signature was checked.');
  }

  function prepareCustody() {
    if(!selectedAck){setFeedback('Open QL-280 to prepare an unverified external acknowledgement reference claim first.');return;}
    const result=ql281PrepareAckCustody(selectedAck,custodyReference,new Date());
    if(!result.ok){setFeedback(result.reason);return;}
    setCustodyRequests(old=>[...old.filter(row=>row.source!==result.request.source||row.escalationReason!==result.request.escalationReason),result.request]);
    setCustodyReference('');
    setFeedback('Acknowledgement CUSTODY REQUEST reference prepared. Original delivery, recipient and response remain NOT VERIFIED.');
  }

  async function copyPacket() {
    try {
      if(!navigator.clipboard?.writeText)throw Error('Clipboard unavailable');
      await navigator.clipboard.writeText(packet);
      setFeedback('QL-281 local reference-only audit packet copied. No external message sent or original accepted.');
    } catch {setFeedback('Clipboard unavailable. Select the read-only audit text to copy manually; no data was sent.');}
  }

  return <section className="ql277-review ql280-desk ql281-desk" data-ql281-desk aria-labelledby="ql281-title">
    <header className="ql277-heading"><div>
      <p className="ql271-eyebrow">QL-281 · Independent source trust and custody audit</p>
      <h4 id="ql281-title">Reviewer signature challenges · Proof-B freshness · ACK custody</h4>
      <p>Operator review of six real pinned public GitHub results and existing in-session QL-279/280 reference drafts. No original reviewer, signer, custodian or delivery service is authenticated in this preview.</p>
    </div><span>DISCONNECTED / HOLD</span></header>
    <div className="ql277-stats" aria-label="QL-281 release blockers">
      <div><small>Reviewer signatures verified</small><strong>0</strong><em>{challengeRequests.length} unsigned challenge request(s)</em></div>
      <div><small>Original Proof-B missing</small><strong>{proof.missing} / 6</strong><em>HTTP 404 at pinned source</em></div>
      <div><small>Moved source refs</small><strong>{proof.moved} / 6</strong><em>{proof.unchanged} unchanged · compared with QL-280</em></div>
      <div><small>Authenticated ACK custody</small><strong>0</strong><em>{custodyRequests.length} unverified custody request(s)</em></div>
    </div>
    <nav className="ql277-tabs" aria-label="QL-281 held audit topics">
      <button type="button" className={topic==='signature'?'active':''} aria-current={topic==='signature'?'page':undefined} onClick={()=>setTopic('signature')}>01 Signature challenge preconditions</button>
      <button type="button" className={topic==='proof'?'active':''} aria-current={topic==='proof'?'page':undefined} onClick={()=>setTopic('proof')}>02 Publication freshness diff</button>
      <button type="button" className={topic==='custody'?'active':''} aria-current={topic==='custody'?'page':undefined} onClick={()=>setTopic('custody')}>03 Escalation ACK custody</button>
    </nav>

    {topic==='signature'&&<section className="ql277-card" aria-labelledby="ql281-signature-title">
      <h5 id="ql281-signature-title">Independent reviewer challenge prerequisites <span>0 / {QL281_REVIEWER_CHALLENGE_GATES.length} VERIFIED</span></h5>
      <p>A signed original reviewer disposition is necessary but not sufficient: an independent, fresh single-use challenge must be issued by the authorized relying party and cryptographically verified against the independently pinned reviewer key and case. This UI can only prepare a reference request; it generates no nonce or signature.</p>
      {reviewerReceipts.length===0?<div className="ql279-empty"><strong>No QL-280 reviewer receipt reference in this session.</strong><p>Prepare a proposed receipt reference from a genuine open QL-279 reviewer draft, then return here. No signed reviewer original has been received.</p></div>:
        <div className="ql281-source-grid">{reviewerReceipts.map(row=><article key={row.checkId}><strong>{QL275_OWNER_CHECKS.find(check=>check.id===row.checkId)?.label??row.checkId}</strong><span>{row.receiptReferenceClaim}</span><small>0/6 original receipt gates satisfied · signature NOT VERIFIED</small></article>)}</div>}
      <div className="ql277-form-grid"><label htmlFor="ql281-reviewer">Unverified QL-280 reviewer receipt
        <select id="ql281-reviewer" value={selectedReceipt?.checkId??''} disabled={!selectedReceipt} onChange={event=>setChosenReceipt(event.target.value)}>
          {reviewerReceipts.length===0?<option value="">No session receipt claim</option>:reviewerReceipts.map(row=><option key={row.checkId} value={row.checkId}>{row.checkId} · {row.receiptReferenceClaim}</option>)}</select></label>
        <label htmlFor="ql281-challenge-reference">External challenge request reference CLAIM
          <input id="ql281-challenge-reference" maxLength={32} value={challengeReference} onChange={event=>setChallengeReference(event.target.value)} placeholder="Nonsecret request identifier only" /></label></div>
      <ol className="ql278-gate-list" aria-label="Seven independent reviewer challenge verification gates">{QL281_REVIEWER_CHALLENGE_GATES.map(row=><li key={row.id}><span aria-hidden="true">!</span><div><strong>{row.label}</strong><small>{row.status.replaceAll('_',' ')} · NOT SATISFIED</small></div></li>)}</ol>
      <div className="ql277-actions"><button type="button" disabled={!selectedReceipt} onClick={prepareChallenge}>Prepare signature challenge request claim</button><button type="button" className="secondary" onClick={onOpenQl280}>Open QL-280 receipt desk</button></div>
      <div className="ql277-results">{challengeRequests.map(row=><article key={row.checkId}><strong>{row.checkId} · {row.challengeRequestReferenceClaim}</strong>
        <span>{row.status.replaceAll('_',' ')} · {row.state.replaceAll('_',' ')}</span><small>Original reviewer ref {row.originalReceiptReferenceClaim} · {row.preparedAt}</small>
        <p>Challenge {row.challenge.replaceAll('_',' ')}; signature {row.signature.replaceAll('_',' ')}; owner approval {row.ownerAcceptance.replaceAll('_',' ')}.</p></article>)}</div>
      <p className="ql277-warning">Never paste private keys, challenge-response secrets, personal identity documents or signature bytes into these fields. Reference claims do not issue challenges or clear accessibility findings.</p>
    </section>}

    {topic==='proof'&&<section className="ql277-card" aria-labelledby="ql281-proof-title">
      <h5 id="ql281-proof-title">QL-280 → QL-281 immutable publication freshness diff <span>{proof.freshness.replaceAll('_',' ')}</span></h5>
      <p>Public read-only check at {QL281_OBSERVED_AT}, compared against QL-280 at {proof.priorObservedAt}. Source revisions may move while the original Proof-B path remains absent. A newer notice or a source SHA change never substitutes for an original signed proof or independent witness.</p>
      <div className="ql278-aging-list" role="table" aria-label="Six-app immutable Proof-B publication comparison">
        <div className="ql278-aging-row head" role="row"><span role="columnheader">Application</span><span role="columnheader">QL-280 → QL-281</span><span role="columnheader">Publication status</span><span role="columnheader">Original URL</span></div>
        {proof.rows.map(row=><div className="ql278-aging-row" role="row" key={row.source}>
          <strong role="cell">{appLabel(row.source)}</strong><code role="cell" title={`${row.previousSha} -> ${row.sha}`}>{row.previousSha?.slice(0,9)} → {row.sha.slice(0,9)}</code>
          <span role="cell">{row.shaMoved?'SHA MOVED':'SHA UNCHANGED'} · HTTP {row.previousHttp} → {row.http} · {row.noticeCount} unverified notice(s)</span>
          <a role="cell" href={ql281PinnedProofUrl(row.source)} target="_blank" rel="noopener noreferrer">Pinned source ↗</a></div>)}</div>
      <div className="ql281-source-grid" aria-label="Freshness and arrival watch summaries">
        <article><strong>Snapshot age</strong><span>{proof.snapshotAgeHours??'Clock review'} {proof.snapshotAgeHours===null?'':'hour(s)'}</span><small>Recheck due: {proof.nextRecheckAt}</small></article>
        <article><strong>Newer-than-snapshot notices</strong><span>{proof.rows.reduce((sum,row)=>sum+row.postSnapshotNotices,0)}</span><small>Require a new independently observed public GET</small></article>
        <article><strong>Notices pinned to older SHA</strong><span>{proof.rows.reduce((sum,row)=>sum+row.obsoleteNotices,0)}</span><small>Still NOT original signed Proof-B</small></article>
      </div>
      <div className="ql277-actions"><button type="button" className="secondary" onClick={()=>{setAsOf(new Date());setFeedback('Freshness age recalculated locally; no source was queried by this button.');}}>Recalculate snapshot age</button><button type="button" className="secondary" onClick={onOpenEvidence}>Open six-app evidence</button></div>
      <p className="ql277-warning">Six original paths returned HTTP 404 at the recorded immutable commits. This is a timestamped historical observation, not a live automatic poll or a signature verification.</p>
    </section>}

    {topic==='custody'&&<section className="ql277-card" aria-labelledby="ql281-custody-title">
      <h5 id="ql281-custody-title">Six-app escalation acknowledgement custody <span>0 / 6 AUTHENTICATED</span></h5>
      <p>Original outbound delivery, a separately authenticated recipient, signed response and chronological message linkage are required before an acknowledgement can be accepted. QL-279 escalations were never sent; QL-280 acknowledgement references are local, unverified claims only.</p>
      <div className="ql281-source-grid" aria-label="Six-app acknowledgement custody queue">{custodyQueue.map(row=><article key={row.source}>
        <strong>{appLabel(row.source)}</strong><span>{row.status.replaceAll('_',' ')}</span><small>{row.unsentEscalations} unsent draft(s) · {row.ackReferenceClaims} ACK reference claim(s) · 0 authenticated</small></article>)}</div>
      <div className="ql277-form-grid"><label htmlFor="ql281-ack-source">Unverified QL-280 acknowledgement reference
        <select id="ql281-ack-source" disabled={!selectedAck} value={selectedAck?ackKey(selectedAck):''} onChange={event=>setChosenAck(event.target.value)}>
          {ackClaims.length===0?<option value="">No session acknowledgement claim</option>:ackClaims.map(row=><option key={ackKey(row)} value={ackKey(row)}>{appLabel(row.source)} · {row.receiptReferenceClaim}</option>)}</select></label>
        <label htmlFor="ql281-custody-reference">External custody review reference CLAIM
          <input id="ql281-custody-reference" maxLength={32} value={custodyReference} onChange={event=>setCustodyReference(event.target.value)} placeholder="Nonsecret case identifier only" /></label></div>
      <ol className="ql278-gate-list" aria-label="Six original acknowledgement custody verification gates">{QL281_ACK_CUSTODY_GATES.map(row=><li key={row.id}><span aria-hidden="true">!</span><div><strong>{row.label}</strong><small>{row.status.replaceAll('_',' ')} · NOT SATISFIED</small></div></li>)}</ol>
      <div className="ql277-actions"><button type="button" disabled={!selectedAck} onClick={prepareCustody}>Prepare acknowledgement custody review claim</button><button type="button" className="secondary" onClick={onOpenQl280}>Open QL-280 acknowledgement desk</button><button type="button" className="secondary" onClick={onOpenQl279}>Open QL-279 escalation source</button></div>
      <div className="ql277-results">{custodyRequests.map(row=><article key={`${row.source}|${row.escalationReason}`}><strong>{appLabel(row.source)} · {row.custodyReferenceClaim}</strong>
        <span>{row.acceptance.replaceAll('_',' ')} · {row.state.replaceAll('_',' ')}</span><small>ACK reference {row.acknowledgementReferenceClaim} · {row.preparedAt}</small>
        <p>{row.verified}/{row.gates.length} authenticated. Original outbound {row.delivery.replaceAll('_',' ')}; response {row.response.replaceAll('_',' ')}.</p></article>)}</div>
      <p className="ql277-warning">A local reference is never an original acknowledgement. No email, phone/SMS, webhook, GitHub issue, private relay or source gateway GET was sent.</p>
    </section>}

    <section className="ql277-card" aria-labelledby="ql281-packet-title"><h5 id="ql281-packet-title">QL-281 source and custody review packet <span>LOCAL DRAFT · NOT SENT</span></h5>
      <label className="ql277-note-label" htmlFor="ql281-packet">Read-only reference claim and public proof comparison
        <textarea id="ql281-packet" readOnly rows={11} value={packet}/></label>
      <div className="ql277-actions"><button type="button" onClick={()=>void copyPacket()}>Copy QL-281 audit packet</button>
        <button type="button" className="secondary" onClick={()=>{setChallengeRequests([]);setCustodyRequests([]);setChallengeReference('');setCustodyReference('');setFeedback('Only QL-281 local request claims cleared. QL-279 and QL-280 source drafts remain in this session.');}}>Clear QL-281 local requests</button></div>
      <p className="ql277-feedback" role="status" aria-live="polite">{feedback}</p>
      <p className="ql277-warning">Session-only preview; never a verified original, a durable ledger, real signer challenge or owner TEST approval. DISCONNECTED / HOLD across all six apps.</p>
    </section>
  </section>;
}

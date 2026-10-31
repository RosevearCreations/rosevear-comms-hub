import { useState } from 'react';
import { QL270_SOURCES, type Ql270SourceId } from './ql270ConnectionCentre';
import { QL275_OWNER_CHECKS } from './ql275OperatorWalkthrough';
import { QL278_CUSTODY_PRECONDITIONS, type Ql278RetestTicket } from './ql278FollowupDesk';
import { QL279_OBSERVED_AT, ql279AuditPacket, ql279PinnedProofUrl,
  ql279PrepareArrivalClaim, ql279PrepareEscalation, ql279PrepareReviewerDraft,
  ql279SourceWatch, type Ql279ArrivalClaim, type Ql279ArrivalKind, type Ql279EscalationDraft,
  type Ql279EscalationReason, type Ql279ReviewerDecision, type Ql279ReviewerDraft }
  from './ql279ReviewerCustodyEscalation';
import './ql277-drift-review.css';
import './ql278-followup-desk.css';
import './ql279-reviewer-custody-escalation.css';

type Topic='reviewer'|'arrival'|'escalation';

/** QL-279 never authenticates a reviewer, custodian, signed artifact or TEST approval.
 * All operator drafts are memory-only and only copied by direct user action. */
export function Ql279ReviewerCustodyEscalation({tickets,onOpenRetests,onOpenEvidence}: {
  tickets:readonly Ql278RetestTicket[];onOpenRetests:()=>void;onOpenEvidence:()=>void;
}) {
  const [topic,setTopic]=useState<Topic>('reviewer');
  const [selectedCheck,setSelectedCheck]=useState<Ql278RetestTicket['checkId']>('keyboard');
  const [reviewerReference,setReviewerReference]=useState('');
  const [reviewerDecision,setReviewerDecision]=useState<Ql279ReviewerDecision>('EVIDENCE_INCOMPLETE');
  const [reviewerNote,setReviewerNote]=useState('');
  const [reviewerDrafts,setReviewerDrafts]=useState<Ql279ReviewerDraft[]>([]);
  const [source,setSource]=useState<Ql270SourceId>('rosiedazzlers');
  const [arrivalKind,setArrivalKind]=useState<Ql279ArrivalKind>('CUSTODIAN_ORIGINAL_RETURN_NOTICE');
  const [arrivalReference,setArrivalReference]=useState('');
  const [arrivalClaims,setArrivalClaims]=useState<Ql279ArrivalClaim[]>([]);
  const [reason,setReason]=useState<Ql279EscalationReason>('PROOF_STILL_404');
  const [escalations,setEscalations]=useState<Ql279EscalationDraft[]>([]);
  const [asOf,setAsOf]=useState(()=>new Date());
  const [feedback,setFeedback]=useState('No reviewer decision authenticated, no original artifact verified and no escalation sent.');
  const report=ql279SourceWatch(asOf);
  const ticket=tickets.find(item=>item.checkId===selectedCheck)??tickets[0];
  const packet=ql279AuditPacket(reviewerDrafts,arrivalClaims,escalations,asOf);

  function draftReviewer() {
    if (!ticket) {setFeedback('Open a genuine local QL-278 retest case first.');return;}
    const result=ql279PrepareReviewerDraft(ticket,reviewerReference,reviewerDecision,reviewerNote,new Date());
    if(!result.ok){setFeedback(result.reason);return;}
    setReviewerDrafts(old=>[...old.filter(item=>item.checkId!==result.draft.checkId),result.draft]);
    setReviewerNote('');
    setFeedback('Unverified reviewer reference and proposed disposition recorded in memory only. Ticket stays OPEN; external authentication and independent review remain required.');
  }

  function draftArrival() {
    const result=ql279PrepareArrivalClaim(source,arrivalKind,arrivalReference,new Date());
    if(!result.ok){setFeedback(result.reason);return;}
    setArrivalClaims(old=>[...old.filter(item=>item.source!==source||item.kind!==arrivalKind),result.claim]);
    setArrivalReference('');
    setFeedback('Arrival notice CLAIM prepared. No source artifact, signed receipt, key or witness was actually received or verified.');
  }

  function draftEscalation() {
    const draft=ql279PrepareEscalation(source,reason,new Date());
    setEscalations(old=>[...old.filter(item=>item.source!==source||item.reason!==reason),draft]);
    setFeedback('Source-specific escalation prepared as DRAFT_NOT_SENT. No message, issue or gateway call was dispatched.');
  }

  async function copyPacket() {
    try {
      if(!navigator.clipboard?.writeText)throw Error('Clipboard unavailable');
      await navigator.clipboard.writeText(packet);
      setFeedback('Read-only QL-279 packet copied locally; no real reviewer decision or receipt was delivered.');
    }catch {setFeedback('Clipboard unavailable. Select the read-only packet to copy manually; nothing was sent.');}
  }

  return <section className="ql277-review ql279-desk" data-ql279-desk aria-labelledby="ql279-title">
    <header className="ql277-heading"><div>
      <p className="ql271-eyebrow">QL-279 · Review dispositions and original evidence arrival</p>
      <h4 id="ql279-title">Reviewer retests · custody arrival watch · source escalation</h4>
      <p>A practical human follow-up desk sharing this session's QL-278 retest tickets. Local reviewer and receipt references are claims, not authenticated signatures or approved custody.</p>
    </div><span>DISCONNECTED / HOLD</span></header>
    <div className="ql277-stats" aria-label="Unverified QL-279 review metrics">
      <div><small>Open owner retests</small><strong>{tickets.length}</strong><em>Reviewer drafts: {reviewerDrafts.length}</em></div>
      <div><small>Original proof missing</small><strong>{report.missing} / 6</strong><em>0 accepted receipts</em></div>
      <div><small>Source SHAs moved</small><strong>{report.changed} / 6</strong><em>{report.unchanged} unchanged since QL-278</em></div>
      <div><small>Escalations sent</small><strong>0</strong><em>Drafts: {escalations.length}</em></div>
    </div>
    <nav className="ql277-tabs" aria-label="QL-279 review topics">
      <button type="button" className={topic==='reviewer'?'active':''} aria-current={topic==='reviewer'?'page':undefined} onClick={()=>setTopic('reviewer')}>01 Independent reviewer disposition</button>
      <button type="button" className={topic==='arrival'?'active':''} aria-current={topic==='arrival'?'page':undefined} onClick={()=>setTopic('arrival')}>02 Original custody arrival watch</button>
      <button type="button" className={topic==='escalation'?'active':''} aria-current={topic==='escalation'?'page':undefined} onClick={()=>setTopic('escalation')}>03 Six-app escalation follow-up</button>
    </nav>

    {topic==='reviewer'&&<section className="ql277-card" aria-labelledby="ql279-reviewer-title">
      <h5 id="ql279-reviewer-title">Accessibility retest disposition intake <span>REVIEWER CLAIM · UNVERIFIED</span></h5>
      <p>Use an actual open QL-278 regression ticket; the case persists only while this command-help session is mounted. This screen cannot identify a reviewer, independently witness a device, or close the ticket. Request the authentic external reviewer record separately.</p>
      {tickets.length===0?<div className="ql279-empty"><strong>No local retest ticket is open.</strong><p>Capture a fresh, real baseline → recheck → retest in the QL-278 queue first. Closed previous browser sessions cannot be silently recovered.</p></div>:
        <div className="ql279-ticket-strip" aria-label="Available QL-278 in-memory cases">{tickets.map(item=><div key={item.checkId}><strong>{QL275_OWNER_CHECKS.find(check=>check.id===item.checkId)?.label}</strong>
          <span>{item.priority.replaceAll('_',' ')} · OPEN</span><small>Retest: {item.retest?.outcome??'NOT RECORDED'} · independently unverified</small></div>)}</div>}
      <div className="ql277-actions"><button type="button" className="secondary" onClick={onOpenRetests}>Open QL-278 retest queue</button></div>
      <div className="ql277-form-grid"><label htmlFor="ql279-ticket">Open reviewer case
        <select id="ql279-ticket" value={ticket?.checkId??''} disabled={!ticket} onChange={event=>setSelectedCheck(event.target.value as Ql278RetestTicket['checkId'])}>
          {tickets.length===0?<option value="">No local case</option>:tickets.map(item=><option key={item.checkId} value={item.checkId}>{QL275_OWNER_CHECKS.find(check=>check.id===item.checkId)?.label} · {item.priority.replaceAll('_',' ')}</option>)}</select></label>
        <label htmlFor="ql279-reviewer-ref">External non-secret reviewer record reference CLAIM
          <input id="ql279-reviewer-ref" maxLength={32} value={reviewerReference} onChange={event=>setReviewerReference(event.target.value)} placeholder="5–32 letters/digits; not an ID credential" /></label>
        <label htmlFor="ql279-reviewer-decision">Proposed non-accepting disposition
          <select id="ql279-reviewer-decision" value={reviewerDecision} onChange={event=>setReviewerDecision(event.target.value as Ql279ReviewerDecision)}>
            <option value="EVIDENCE_INCOMPLETE">Evidence incomplete</option><option value="RETEST_REQUIRED">Comparable retest required</option>
            <option value="NO_ISSUE_CLAIM_NEEDS_WITNESS">No issue reported; witness still required</option></select></label></div>
      <label className="ql277-note-label" htmlFor="ql279-reviewer-note">Non-sensitive reason (8–240 characters)
        <textarea id="ql279-reviewer-note" rows={3} maxLength={240} value={reviewerNote} onChange={event=>setReviewerNote(event.target.value)} placeholder="Why is independent acceptance still pending? Avoid personal, secret or customer information." /></label>
      <div className="ql277-actions"><button type="button" disabled={!ticket} onClick={draftReviewer}>Prepare reviewer disposition draft</button></div>
      <div className="ql277-results">{reviewerDrafts.map(item=><article key={item.checkId}><strong>{QL275_OWNER_CHECKS.find(check=>check.id===item.checkId)?.label}</strong>
        <span>{item.decision.replaceAll('_',' ')} · {item.closure} · {item.state.replaceAll('_',' ')}</span>
        <small>Reviewer reference claim {item.reviewerReferenceClaim} · {item.preparedAt}</small>
        <p>{item.sanitizedNote} · Reviewer authentication NOT PERFORMED; owner and witness signatures NOT VERIFIED; no accessibility acceptance.</p></article>)}</div>
      <p className="ql277-warning">A drafted reviewer disposition is not an independent signed record. Neither a reported no-issue retest nor an entered reference can resolve an open QL-278 regression.</p>
    </section>}

    {topic==='arrival'&&<section className="ql277-card" aria-labelledby="ql279-arrival-title">
      <h5 id="ql279-arrival-title">Original proof, custodian and witness arrival watch <span>0 / 6 VERIFIED</span></h5>
      <p>Latest actual public source observation {QL279_OBSERVED_AT}. Each pinned original Proof-B path returned HTTP 404. A separately reported publication, original custodian return or witness return can be noted by a non-secret claim reference, but this UI never receives or cryptographically validates the original itself.</p>
      <div className="ql277-form-grid"><label htmlFor="ql279-arrival-source">Source application
        <select id="ql279-arrival-source" value={source} onChange={event=>{setSource(event.target.value as Ql270SourceId);setArrivalReference('');}}>{QL270_SOURCES.map(item=><option key={item.id} value={item.id}>{item.label}</option>)}</select></label>
        <label htmlFor="ql279-arrival-type">Claimed external arrival type
          <select id="ql279-arrival-type" value={arrivalKind} onChange={event=>setArrivalKind(event.target.value as Ql279ArrivalKind)}>
            <option value="SOURCE_PUBLICATION_NOTICE">Source-published original proof notice</option>
            <option value="CUSTODIAN_ORIGINAL_RETURN_NOTICE">Independent original custodian receipt notice</option>
            <option value="WITNESS_ORIGINAL_RETURN_NOTICE">Independent original witness receipt notice</option></select></label>
        <label htmlFor="ql279-arrival-ref">Non-secret external notice reference CLAIM
          <input id="ql279-arrival-ref" maxLength={32} value={arrivalReference} onChange={event=>setArrivalReference(event.target.value)} placeholder="Not the document, signature or credential" /></label></div>
      <div className="ql277-actions"><button type="button" onClick={draftArrival}>Record unverified arrival notice</button>
        <button type="button" className="secondary" onClick={onOpenEvidence}>Open original six-app evidence</button>
        <a className="ql278-inline-link" href={ql279PinnedProofUrl(source)} target="_blank" rel="noopener noreferrer">Open pinned Proof-B HTTP 404 ↗</a></div>
      <ol className="ql278-gate-list" aria-label="Seven evidence prerequisites still not independently verified">{QL278_CUSTODY_PRECONDITIONS.map(gate=><li key={gate.key}><span aria-hidden="true">!</span><div><strong>{gate.label}</strong><small>{gate.status.replaceAll('_',' ')} · NOT SATISFIED</small></div></li>)}</ol>
      <div className="ql277-results">{arrivalClaims.map(item=><article key={`${item.source}-${item.kind}`}>
        <strong>{QL270_SOURCES.find(app=>app.id===item.source)?.label}</strong><span>{item.notice.replaceAll('_',' ')} · {item.state.replaceAll('_',' ')}</span>
        <small>{item.kind.replaceAll('_',' ')} · {item.referenceClaim} · {item.preparedAt}</small>
        <p>Original verification: NO · immutable SHA {item.sha.slice(0,12)} · pinned source HTTP 404. The notice is an unverified reference claim only.</p></article>)}</div>
      <p className="ql277-warning">No real receipt upload, signer pin, Ed25519 verification, witness disposition, authenticated owner approval, tenant connection or gateway GET happens in this watch.</p>
    </section>}

    {topic==='escalation'&&<section className="ql277-card" aria-labelledby="ql279-escalation-title">
      <h5 id="ql279-escalation-title">Six-app escalation follow-up <span>{report.escalation.replaceAll('_',' ')}</span></h5>
      <p>QL-279 pinned public recheck {QL279_OBSERVED_AT}; {report.changed} changed, {report.unchanged} unchanged and {report.missing} original proofs missing. Tracking begins with QL-277, now {report.trackedHours??'clock review'} hour(s), and the current snapshot is {report.observedAgeHours??'clock review'} hour(s) old. Next independent public check due {report.nextPublicCheckDueAt}. This is not background polling.</p>
      <div className="ql278-aging-list" role="table" aria-label="Six-source QL-279 public proof and escalation ledger">
        <div className="ql278-aging-row head" role="row"><span role="columnheader">Application</span><span role="columnheader">QL-278 → QL-279</span><span role="columnheader">Review state</span><span role="columnheader">Original proof</span></div>
        {report.rows.map(item=><div className="ql278-aging-row" role="row" key={item.source}>
          <strong role="cell">{QL270_SOURCES.find(app=>app.id===item.source)?.label}</strong>
          <code role="cell" title={`${item.previousSha} -> ${item.sha}`}>{item.previousSha?.slice(0,9)} → {item.sha.slice(0,9)}</code>
          <span role="cell">{item.moved?'SHA MOVED':'SAME SHA'} · {item.escalation.replaceAll('_',' ')} · HTTP {item.http}</span>
          <a role="cell" href={ql279PinnedProofUrl(item.source)} rel="noopener noreferrer" target="_blank">Pinned proof ↗</a></div>)}</div>
      <div className="ql277-form-grid"><label htmlFor="ql279-escalation-source">Source for manual escalation draft
        <select id="ql279-escalation-source" value={source} onChange={event=>setSource(event.target.value as Ql270SourceId)}>{QL270_SOURCES.map(item=><option key={item.id} value={item.id}>{item.label}</option>)}</select></label>
        <label htmlFor="ql279-escalation-reason">Follow-up blocker
          <select id="ql279-escalation-reason" value={reason} onChange={event=>setReason(event.target.value as Ql279EscalationReason)}>
            <option value="PROOF_STILL_404">Original source Proof-B still 404</option><option value="ORIGINAL_CUSTODY_UNVERIFIED">Independent custody/witness originals missing</option>
            <option value="REVIEWER_DISPOSITION_PENDING">Accessibility reviewer disposition pending</option></select></label></div>
      <div className="ql277-actions"><button type="button" onClick={draftEscalation}>Prepare unsent escalation draft</button>
        <button type="button" className="secondary" onClick={()=>{setAsOf(new Date());setFeedback('Local elapsed-time display refreshed; no source was queried.');}}>Refresh time only</button></div>
      <div className="ql277-results">{escalations.map(item=><article key={`${item.source}-${item.reason}`}><strong>{QL270_SOURCES.find(app=>app.id===item.source)?.label}</strong>
        <span>{item.reason.replaceAll('_',' ')} · {item.state.replaceAll('_',' ')}</span>
        <small>Priority {item.priority.replaceAll('_',' ')} · {item.preparedAt} · {item.currentSha.slice(0,12)}</small>
        <p>Suggested human handoff: source maintainer + independent custodian, through separately authorized channels. Actual deliveries: 0. TEST approval NOT GIVEN.</p></article>)}</div>
      <p className="ql277-warning">Even a newer source SHA or a copyable escalation cannot replace original signed Proof-B, independent custody, witness and separate owner TEST authorization. No delivery mechanism is enabled.</p>
    </section>}

    <section className="ql277-card" aria-labelledby="ql279-packet-title"><h5 id="ql279-packet-title">Consolidated QL-279 local packet <span>NOT SENT</span></h5>
      <label className="ql277-note-label" htmlFor="ql279-packet">Read-only reviewer, arrival and escalation draft audit
        <textarea id="ql279-packet" rows={10} readOnly value={packet} /></label>
      <div className="ql277-actions"><button type="button" onClick={()=>void copyPacket()}>Copy QL-279 draft packet</button>
        <button type="button" className="secondary" onClick={()=>{setReviewerDrafts([]);setArrivalClaims([]);setEscalations([]);setReviewerReference('');setReviewerNote('');setArrivalReference('');setFeedback('QL-279 local reviewer, arrival and escalation drafts cleared. QL-278 open retests were preserved.');}}>Clear QL-279 drafts</button></div>
      <p className="ql277-feedback" role="status" aria-live="polite">{feedback}</p>
      <p className="ql277-warning">Memory-only, no authentic reviewer account or original artifact intake, no automatic notice/issue/email, no secrets or storage, no TEST owner authorization, no gateway GET, no customer data, live communication or SMS. All six sources remain DISCONNECTED / HOLD.</p>
    </section>
  </section>;
}

import {QL375_SHELLS} from './ql375OwnerStatus';
import {QL409_DEMO_CAPTURED,QL409_DEMO_EVENTS,reviewQl409AuditDecisions}
  from './ql409AuditDecisionReview';
import type {QL405SourceId} from './ql405AcknowledgementLedger';

export default function QL409AuditDecisionPanel({sourceId}:{sourceId:QL405SourceId}){
  const review=reviewQl409AuditDecisions(sourceId,
    QL409_DEMO_EVENTS.filter(event=>event.sourceId===sourceId),Date.now());
  const shell=QL375_SHELLS.find(item=>item.id===sourceId);
  return <section className="ql409-audit-panel" aria-labelledby="ql409-title">
    <h4 id="ql409-title">QL-409 · Source audit timeline and receiver-OFF recovery</h4>
    <p><strong>INERT DEMO · HOLD.</strong> {shell?.name} only. These references are invented examples, never original decisions or signed receipts.</p>
    <p role="status">Receiver OFF · One-TEST HOLD · {review.worklist.length} demo exception(s) · {review.stale?'Snapshot stale':'Demo snapshot recent'}.</p>
    <div className="ql409-scroll"><table><caption>Source-scoped example decision history</caption>
      <thead><tr><th scope="col">Time</th><th scope="col">Gate</th><th scope="col">Claimed role</th><th scope="col">Demo decision</th></tr></thead>
      <tbody>{review.timeline.map(item=><tr key={item.eventId}><td><time dateTime={item.observedAt}>{item.observedAt}</time></td>
        <th scope="row">{item.gate}</th><td>{item.actorRole}</td><td>{item.decision}</td></tr>)}
        {!review.timeline.length&&<tr><td colSpan={4}>No illustrative records for this shell. No live status is implied.</td></tr>}</tbody>
    </table></div>
    <div className="ql409-scroll"><table><caption>Independent operator exception worklist · illustrative only</caption>
      <thead><tr><th scope="col">Case</th><th scope="col">Priority</th><th scope="col">Independent route</th></tr></thead>
      <tbody>{review.worklist.map(item=><tr key={item.eventId}><th scope="row">{item.caseId}</th>
        <td>{item.priority}</td><td>{item.route}</td></tr>)}
        {!review.worklist.length&&<tr><td colSpan={3}>Await protected, independently authenticated original review.</td></tr>}</tbody>
    </table></div>
    <p>Recovery remains read-only: independently confirm custody, source/reviewer/master signatures, consent, receiver enrollment and replay safety before a separately authorized one-TEST ceremony.</p>
    <a href="https://github.com/RosevearCreations/rosevear-comms-hub/blob/dev/docs/handoffs/QL409_AUDIT_TIMELINE_EXCEPTION_RECOVERY.md" target="_blank" rel="noopener noreferrer">QL-409 owner handoff</a>
  </section>;
}

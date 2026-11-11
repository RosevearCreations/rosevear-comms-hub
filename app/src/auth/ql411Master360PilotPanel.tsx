import type {QL405SourceId} from './ql405AcknowledgementLedger';

export default function QL411Master360PilotPanel({sourceId}:{sourceId:QL405SourceId}){
  return <section className="ql411-master-pilot" aria-labelledby="ql411-master-title">
    <h4 id="ql411-master-title">QL-417 · Three-Master protected evidence discrepancies</h4>
    <p role="status"><strong>HOLD · NOT CONNECTED</strong> — source {sourceId}. No authenticated original-Ree runtime evidence has been imported into this owner screen.</p>
    <dl className="ql412-master-readiness">
      <div><dt>Ree's original Windows host</dt><dd>DESKTOP-AE894KC · installed release unverified</dd></div>
      <div><dt>AI Data Platform sampled uptime</dt><dd>UNKNOWN · awaiting genuine source-signed samples</dd></div>
      <div><dt>Comms incident correlation</dt><dd>HOLD · supervised acceptance required</dd></div>
      <div><dt>Independent source and receiver signer custody</dt><dd>HOLD · original owner/reviewer evidence outstanding</dd></div>
      <div><dt>Protected durable replay ledger</dt><dd>HOLD · runtime episode not independently confirmed</dd></div>
      <div><dt>Signed source one-TEST and receiver ACK</dt><dd>HOLD · no authenticated operational chain</dd></div>
      <div><dt>Evidence discrepancy worklist</dt><dd>CODE READY · no protected runtime rows to display</dd></div>
      <div><dt>Episode age and freshness</dt><dd>UNKNOWN · no independently timestamped runtime receipt</dd></div>
      <div><dt>Owner decision continuity</dt><dd>HOLD · independent accept/reopen review required</dd></div>
      <div><dt>Receiver / connection / slave onboarding</dt><dd>OFF / HOLD / HOLD</dd></div>
    </dl>
    <p>QL-417 can sort authenticated signature, replay, receiver-ACK, freshness and owner-review discrepancies. It does not confirm uptime from a code release or authorize Windows recovery. Actual source-side evidence must first be accepted by the protected runtime.</p>
    <a href="https://github.com/RosevearCreations/rosevear-comms-hub/blob/main/docs/handoffs/QL417_MASTER360_DISCREPANCY_WORKLIST.md" target="_blank" rel="noopener noreferrer">QL-417 protected worklist and AI Data Platform handoff</a>
  </section>;
}

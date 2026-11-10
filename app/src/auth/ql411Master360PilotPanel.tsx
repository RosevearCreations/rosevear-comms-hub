import type {QL405SourceId} from './ql405AcknowledgementLedger';

export default function QL411Master360PilotPanel({sourceId}:{sourceId:QL405SourceId}){
  return <section className="ql411-master-pilot" aria-labelledby="ql411-master-title">
    <h4 id="ql411-master-title">QL-411 · Master 360 protected telemetry pilot</h4>
    <p role="status"><strong>HOLD · NOT CONNECTED</strong> — source {sourceId}. No original-host signed telemetry or protected replay-store acknowledgement has been imported into this browser.</p>
    <p>AI Data Platform: uptime aggregation <strong>UNKNOWN</strong>. Comms Hub: incident correlation <strong>AWAITING VERIFIED FEED</strong>. Ree's AI Hub: original-host runtime <strong>NOT VERIFIED HERE</strong>.</p>
    <p>The independent server adapter checks pinned Ed25519 signatures, original host and source revision, five-minute freshness, sample identifiers, replay episodes and bounded uptime. It cannot send messages, repair Windows services, start the receiver or grant a TEST.</p>
    <a href="https://github.com/RosevearCreations/rosevear-comms-hub/blob/main/docs/handoffs/QL411_MASTER360_PROTECTED_TELEMETRY_PILOT.md" target="_blank" rel="noopener noreferrer">Master 360 QL-411 integration and owner handoff</a>
  </section>;
}

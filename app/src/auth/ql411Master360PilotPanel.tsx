import type {QL405SourceId} from './ql405AcknowledgementLedger';

export default function QL411Master360PilotPanel({sourceId}:{sourceId:QL405SourceId}){
  return <section className="ql411-master-pilot" aria-labelledby="ql411-master-title">
    <h4 id="ql411-master-title">QL-414 · Original-Ree one-TEST and signed receiver acknowledgement</h4>
    <p role="status"><strong>HOLD · NOT CONNECTED</strong> — source {sourceId}. Original-Ree server telemetry and persistent replay evidence have not been authenticated into this owner screen.</p>
    <dl className="ql412-master-readiness">
      <div><dt>Ree's original Windows host</dt><dd>DESKTOP-AE894KC · runtime unverified</dd></div>
      <div><dt>AI Data Platform uptime</dt><dd>UNKNOWN · awaiting signed samples</dd></div>
      <div><dt>Comms incident correlation</dt><dd>HOLD · supervised acceptance required</dd></div>
      <div><dt>Independent signer enrollment</dt><dd>HOLD · owner-approved public pin needed</dd></div>
      <div><dt>Durable replay ledger</dt><dd>HOLD · protected host deployment needed</dd></div>
      <div><dt>Receiver / slave onboarding</dt><dd>OFF / HOLD</dd></div>
      <div><dt>AI Data Platform protected receipt</dt><dd>HOLD · no independent live receipt</dd></div>
      <div><dt>Comms Hub protected receipt</dt><dd>HOLD · no authenticated receiver ACK</dd></div>
      <div><dt>AI Hub original-host receipt</dt><dd>HOLD · Build 305 runtime not verified</dd></div>
      <div><dt>Owner-supervised one-TEST</dt><dd>HOLD · no authorized source-side execution</dd></div>
      <div><dt>Receiver signature and decision</dt><dd>HOLD · no genuine signed receiver ACK</dd></div>
    </dl>
    <p>QL-414 adds a server-side read-only one-TEST handler with authenticated transport and owner/reviewer prerequisites, durable replay checks, and independently verifiable signed receiver ACK generation. No listener, Windows recovery execution, automatic connection grant or production private-key provisioning is included.</p>
    <a href="https://github.com/RosevearCreations/rosevear-comms-hub/blob/main/docs/handoffs/QL414_MASTER360_ONE_TEST_ACK_HANDOFF.md" target="_blank" rel="noopener noreferrer">Master 360 QL-414 protected one-TEST and signed ACK handoff</a>
  </section>;
}

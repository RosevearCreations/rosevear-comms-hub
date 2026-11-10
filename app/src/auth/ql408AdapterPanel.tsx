import {reviewQl408AdapterContract} from './ql408ProtectedAdapterContract';
import type {QL405SourceId} from './ql405AcknowledgementLedger';

export default function QL408AdapterPanel({sourceId}:{sourceId:QL405SourceId}){
  const adapterReview=reviewQl408AdapterContract(sourceId,null,Date.now());
  return <section className="ql408-adapter-review" aria-labelledby="ql408-review-title">
    <h4 id="ql408-review-title">QL-408 · Authenticated adapter contract and receiver audit readiness</h4>
    <p><strong>Adapter OFF · one-TEST HOLD.</strong> Shell: <code>{adapterReview.sourceId}</code>.</p>
    <p role="status"><strong>{adapterReview.contractState}</strong> · Receiver OFF · {adapterReview.exceptions.join(' · ')}.</p>
    <div className="ql408-review-scroll"><table><caption>Seven separate receiver-side audit mappings · no original record imported</caption>
      <thead><tr><th scope="col">Protected gate</th><th scope="col">Independent custodian</th><th scope="col">Required audit mapping</th><th scope="col">State</th></tr></thead>
      <tbody>{adapterReview.gateMap.map(gate=><tr key={gate.code}>
        <th scope="row"><code>{gate.code}</code></th><td>{gate.owner}</td><td>{gate.audit}</td><td><strong>{gate.state}</strong></td>
      </tr>)}</tbody>
    </table></div>
    <a href="https://github.com/RosevearCreations/rosevear-comms-hub/blob/dev/docs/handoffs/QL408_AUTHENTICATED_ADAPTER_RECEIVER_AUDIT_ONE_TEST.md" target="_blank" rel="noopener noreferrer">Read the QL-408 protected adapter contract and owner handoff</a>
  </section>;
}

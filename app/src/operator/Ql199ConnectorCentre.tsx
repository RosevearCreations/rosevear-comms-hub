import { useState } from 'react';
import type { OperatorOrganization } from './ql191Organizations';
import { connectorContracts, eligibleConnectorSamples, previewConnectorMapping, type ConnectorOperation, type ConnectorMockPreview } from './ql199ConnectorContracts';
import { Ql200RosieQuoteBooking } from './Ql200RosieQuoteBooking';
import { Ql201MakerCommission } from './Ql201MakerCommission';
import { Ql202CampGuestReservation } from './Ql202CampGuestReservation';
import { Ql203YwServiceInquiry } from './Ql203YwServiceInquiry';
import './ql199-connector-centre.css';

export function Ql199ConnectorCentre({ organization, onOpenThread }: { organization: OperatorOrganization; onOpenThread: (threadId: string) => void }) {
  const contract = connectorContracts[organization.id];
  const samples = eligibleConnectorSamples(organization.id);
  const [operation, setOperation] = useState<ConnectorOperation>('intake_preview');
  const [sourceId, setSourceId] = useState(samples[0]?.id ?? '');
  const [preview, setPreview] = useState<ConnectorMockPreview | null>(null);
  const [showHelp, setShowHelp] = useState(false);
  const [showGates, setShowGates] = useState(false);

  function inspect() {
    const result = previewConnectorMapping(organization.id, contract, operation, sourceId);
    setPreview(result.ok ? result.preview : null);
  }

  return <section className="ql199-centre" data-ql199-release="ql199-mock-connector-contracts-v1" data-organization={organization.id} aria-labelledby="ql199-title">
    <header className="ql199-heading"><div><p className="ql191-eyebrow">QL-199 · Integration contracts</p><h3 id="ql199-title">{organization.name} · Connector centre</h3><p>Review an isolated, mock-only connector contract and sample mapping before any real integration is authorized.</p></div>
      <button type="button" className="ql191-help-button" aria-expanded={showHelp} aria-controls="ql199-help" onClick={() => setShowHelp((shown) => !shown)}>ⓘ Help</button>
    </header>
    <p className="ql199-warning" role="note">NOT CONNECTED · No website, booking, order, campground, PMS, telephony, or SMS provider is linked. These mappings use fictional samples only.</p>
    {showHelp && <p id="ql199-help" className="ql199-help" role="note">Select a provided fictional event, choose an allowed preview operation, and inspect its normalized fields. This does not import data. Connection and authorization require a private server-side implementation, independently tested tenant permissions, and owner approval. Switching companies clears the sample preview.</p>}
    <div className="ql199-layout">
      <section className="ql199-card" aria-labelledby="ql199-contract-heading">
        <h4 id="ql199-contract-heading">Contract: {contract.label}</h4>
        <dl><div><dt>Source system</dt><dd>{contract.upstreamSystem}</dd></div><div><dt>Connection</dt><dd>Mock only · no live client</dd></div><div><dt>Tenant boundary</dt><dd>{contract.tenantBoundary}</dd></div><div><dt>Planned implementation</dt><dd>{contract.nextBuild}</dd></div></dl>
        <button type="button" aria-expanded={showGates} aria-controls="ql199-gates" onClick={() => setShowGates((shown) => !shown)}>{showGates ? 'Hide required approval gates' : 'Show required approval gates'}</button>
        {showGates && <ol id="ql199-gates">{contract.requiredGates.map((gate) => <li key={gate}>{gate}</li>)}</ol>}
      </section>
      <section className="ql199-card" aria-labelledby="ql199-preview-heading">
        <h4 id="ql199-preview-heading">Fixture mapping rehearsal</h4>
        <label htmlFor="ql199-sample">Synthetic source record</label>
        <select id="ql199-sample" value={sourceId} onChange={(event) => { setSourceId(event.target.value); setPreview(null); }}>
          {samples.map((sample) => <option key={sample.id} value={sample.id}>{sample.label}</option>)}
        </select>
        <label htmlFor="ql199-operation">Allowed operation</label>
        <select id="ql199-operation" value={operation} onChange={(event) => { setOperation(event.target.value as ConnectorOperation); setPreview(null); }}>
          {contract.allowedOperations.map((name) => <option key={name} value={name}>{name === 'intake_preview' ? 'Preview incoming inquiry' : 'Preview status summary'}</option>)}
        </select>
        <button type="button" onClick={inspect} disabled={!sourceId}>Inspect fictional mapping</button>
        <div aria-live="polite" className="ql199-result">
          {preview ? <div role="status"><strong>Valid sample mapping · no transfer</strong><dl><div><dt>Reference</dt><dd>{preview.reference}</dd></div><div><dt>Type</dt><dd>{preview.normalizedKind}</dd></div><div><dt>Subject</dt><dd>{preview.subject}</dd></div><div><dt>Safety</dt><dd>Fictional · unconnected</dd></div></dl></div> : <p>No sample mapping inspected yet.</p>}
        </div>
      </section>
    </div>
    {organization.id === 'rosiedazzlers' && <Ql200RosieQuoteBooking onOpenThread={onOpenThread} />}
    {organization.id === 'devilndove' && <Ql201MakerCommission onOpenThread={onOpenThread} />}
    {organization.id === 'icamp' && <Ql202CampGuestReservation onOpenThread={onOpenThread} />}
    {organization.id === 'yw' && <Ql203YwServiceInquiry onOpenThread={onOpenThread} />}
    <p className="ql199-footer">Connection, authorization, data synchronization, live customer reads, webhooks, credential entry and outbound delivery stay disabled. QL-200–203 are separate company integration builds.</p>
  </section>;
}

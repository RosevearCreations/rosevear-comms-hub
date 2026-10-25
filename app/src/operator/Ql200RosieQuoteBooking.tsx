import { useState } from 'react';
import { connectorContracts } from './ql199ConnectorContracts';
import { previewRosieHandoff, rosieIntakeFixtures, type RosieHandoffPreview } from './ql200RosieConnector';
import './ql200-rosie-connector.css';

export function Ql200RosieQuoteBooking({ onOpenThread }: { onOpenThread: (threadId: string) => void }) {
  const [sampleId, setSampleId] = useState(rosieIntakeFixtures[0].id);
  const [preview, setPreview] = useState<RosieHandoffPreview | null>(null);
  const [helpOpen, setHelpOpen] = useState(false);
  const selected = rosieIntakeFixtures.find((item) => item.id === sampleId);
  function inspect() {
    const result = previewRosieHandoff('rosiedazzlers', connectorContracts.rosiedazzlers, sampleId);
    setPreview(result.ok ? result.preview : null);
  }
  return <section className="ql200-rosie" data-ql200-release="ql200-rosie-quote-booking-mock-v1" aria-labelledby="ql200-title">
    <div className="ql200-top"><div><p className="ql191-eyebrow">QL-200 · Rosie Dazzlers mock connector</p><h4 id="ql200-title">Quote and booking handoff rehearsal</h4><p>Inspect a fictional request and its proposed internal fields. No quote or reservation is submitted.</p></div><button type="button" className="ql191-help-button" aria-expanded={helpOpen} aria-controls="ql200-help" onClick={() => setHelpOpen((open) => !open)}>ⓘ Help</button></div>
    <p role="note" className="ql200-alert">SOURCE DISCONNECTED · Pricing, available dates, deposits, and package eligibility must be verified inside Rosie Dazzlers before accepting any real appointment.</p>
    {helpOpen && <p id="ql200-help" className="ql200-help" role="note">Select one of two made-up quote/booking examples. The mapping preview copies only built-in sample descriptions. Opening its source conversation navigates to a fabricated inbox thread. No customer names, booking slots, Stripe deposits, or database records are read or created.</p>}
    <div className="ql200-form"><label htmlFor="ql200-sample">Fictional Rosie inquiry</label><select id="ql200-sample" value={sampleId} onChange={(event) => { setSampleId(event.target.value); setPreview(null); }}>{rosieIntakeFixtures.map((item) => <option key={item.id} value={item.id}>{item.kind === 'quote_request' ? 'Quote request' : 'Booking question'} · {item.service}</option>)}</select><button type="button" onClick={inspect} disabled={!selected}>Preview handoff fields</button></div>
    {preview ? <div className="ql200-review" role="status" aria-live="polite"><h5>Proposed internal handoff — review required</h5><dl>
      <div><dt>Demo reference</dt><dd>{preview.reference}</dd></div><div><dt>Type</dt><dd>{preview.intakeKind === 'quote_request' ? 'Quote inquiry' : 'Booking question'}</dd></div><div><dt>Source</dt><dd>{preview.sourceSubject}</dd></div><div><dt>Service</dt><dd>{preview.service}</dd></div><div><dt>Vehicle</dt><dd>{preview.vehicleGroup}</dd></div><div><dt>Preferred time</dt><dd>{preview.preferredWindow}</dd></div><div><dt>Operator review</dt><dd>{preview.additionalDetails}</dd></div>
      <div><dt>Price</dt><dd>Not quoted</dd></div><div><dt>Availability</dt><dd>Not checked</dd></div><div><dt>Booking</dt><dd>Not created</dd></div><div><dt>Deposit</dt><dd>Not requested</dd></div><div><dt>Message</dt><dd>Not sent</dd></div>
    </dl><button type="button" onClick={() => onOpenThread(preview.sourceId)}>View fictional source conversation</button></div> : <p className="ql200-empty" role="status">Choose a sample and preview the mapping. No handoff has been created.</p>}
  </section>;
}

import { useRef, useState } from 'react';
import type { OperatorOrganization } from './ql191Organizations';
import { QL237_COMPANY_CONTRACTS, QL237_OPTIONS, QL237_RELEASE, ROSEVEAR_INTEGRATION_CONTRACT,
  inspectQl237Event, ql237Fixture, type Ql237PreviewEvent, type Ql237PreviewReceipt } from './ql237IntegrationReadiness';
import './ql237-integration-options.css';

export function Ql237IntegrationOptions({ organization }: { organization: OperatorOrganization }) {
  const [helpOpen, setHelpOpen] = useState(false);
  const [eventType, setEventType] = useState(QL237_COMPANY_CONTRACTS[organization.id].events[0]);
  const [receipt, setReceipt] = useState<Ql237PreviewReceipt | null>(null);
  const last = useRef<Ql237PreviewEvent | null>(null);
  const sequence = useRef(0);
  const seen = useRef(new Set<string>());
  const company = QL237_COMPANY_CONTRACTS[organization.id];

  function simulate(scenario: 'current' | 'replay' | 'cross-business' | 'tenant' | 'direct' | 'stale' | 'command') {
    let event: Ql237PreviewEvent;
    if (scenario === 'replay' && last.current) {
      event = last.current;
    } else {
      sequence.current += 1;
      event = { ...ql237Fixture(organization.id, String(sequence.current)), event_type: eventType };
      if (scenario === 'cross-business') event = { ...event, business_id: organization.id === 'icamp' ? 'yw' : 'icamp' };
      if (scenario === 'tenant') event = { ...event, tenant_id: company.tenantRequired ? null : 'demo-other-tenant' };
      if (scenario === 'direct') event = { ...event, destination_system: 'rosevear-comms-hub' };
      if (scenario === 'stale') event = { ...event, occurred_at: '2020-01-01T00:00:00.000Z' };
      if (scenario === 'command') event = { ...event, event_type: 'product.update_command' };
      if (scenario === 'current') last.current = event;
    }
    setReceipt(inspectQl237Event(event, organization.id, seen.current));
  }

  return <section className="ql237-screen" data-ql237-release={QL237_RELEASE} data-company={organization.id} aria-labelledby="ql237-title">
    <header className="ql237-heading"><div><p className="ql191-eyebrow">QL-237 · Free communications options &amp; common integration v1</p>
      <h3 id="ql237-title">Connect our businesses safely</h3>
      <p>Compare genuinely no-cost approaches and rehearse a shared, reference-only integration contract.</p></div>
      <button type="button" aria-expanded={helpOpen} aria-controls="ql237-help" onClick={() => setHelpOpen((value) => !value)}>ⓘ Help</button>
    </header>
    <p className="ql237-hold" role="note"><strong>DISABLED PREVIEW — NO PROVIDER CONNECTED.</strong> This is research and a local contract demonstration. All 12 real QL-181 pilot prerequisites remain <strong>HELD_UNVERIFIED</strong>. No purchase, new number, port, forwarding change, actual call, SMS, authentication, customer-data transfer or remote write.</p>
    {helpOpen && <div id="ql237-help" className="ql237-note" role="note">An existing business number may already be covered by our plan, but automatic business calling/texting is not made free by installing software. The green-looking mock event result below means it passed only fictional identity checks; it is still HELD. Choose one company, simulate an event through AI Data Platform and try replay/cross-business/tenant mismatches. For a real connection, share the QL-237 integration handoff specification with each application's developers and approve the server-only gateway stages separately.</div>}

    <section className="ql237-panel" aria-labelledby="ql237-options"><h4 id="ql237-options">What can we do free or with no new phone number?</h4>
      <p className="ql237-subtle">Researched 27 October 2026. Free trials are not free production service; provider limits and fees can change.</p>
      <div className="ql237-option-grid">{QL237_OPTIONS.map((option) => <article key={option.id} className="ql237-option">
        <h5>{option.label}</h5><span className="ql237-pill">{option.costClass.replaceAll('-', ' ')}</span>
        <p>{option.advantage}</p><p className="ql237-boundary">Limit: {option.boundary}</p>
        <a href={option.source} target="_blank" rel="noopener noreferrer">Official source / verify terms</a>
      </article>)}</div>
      <p className="ql237-note"><strong>Suggested first step:</strong> keep current business phone plans, add a safe website/email intake route, then test a separate VoIP number only if our actual call/SMS needs justify its cost. Asterisk can reduce software fees, but cannot make Canadian carrier calls or SMS free. Linphone's personal free SIP accounts are not a substitute for shared commercial numbers.</p>
    </section>

    <section className="ql237-panel" aria-labelledby="ql237-contract"><h4 id="ql237-contract">Rosevear Integration Contract v1 · six spoke applications</h4>
      <p><strong>Hub:</strong> AI Data Platform. <strong>Spokes:</strong> Devil n Dove, Rosie Dazzlers, Yard Workers, iCamp, Comms Hub, Rosevear AI Hub.</p>
      <ol className="ql237-steps"><li>Each business keeps ownership of its products, bookings, jobs or reservations.</li>
        <li>Each application adds server-only health and capability endpoints first.</li>
        <li>AI Data Platform alone brokers signed, tenant-scoped, replay-protected events.</li>
        <li>Comms Hub displays references and creates approval-held handoff drafts, never direct database edits.</li>
        <li>Real commands, provider delivery and owner approvals stay off until separately verified.</li></ol>
      <div className="ql237-scroll"><table><caption>First read-only integration scope per owning business; none are connected yet.</caption>
        <thead><tr><th scope="col">Owning application</th><th scope="col">Reference</th><th scope="col">Events for later review</th><th scope="col">Tenant</th></tr></thead>
        <tbody>{Object.values(QL237_COMPANY_CONTRACTS).map((entry) => <tr key={entry.system}>
          <th scope="row">{entry.owner}</th><td>{entry.entity} reference only</td><td>{entry.events.join(', ')}</td>
          <td>{entry.tenantRequired ? 'Required · isolated' : 'Business-scoped'}</td>
        </tr>)}</tbody></table></div>
      <p className="ql237-subtle">AI Hub exposes restricted device health, not customer data. The gateway owns transfer receipts, not source records. No shared passwords or direct database credentials.</p>
    </section>

    <section className="ql237-panel" aria-labelledby="ql237-fixture"><h4 id="ql237-fixture">{organization.name} · Safe event preflight</h4>
      <p>This demonstrates the proposed event format without a request being sent. A positive mock check is never a live authorization.</p>
      <div className="ql237-fixture-fields"><div><label htmlFor="ql237-event">Sample business event</label>
        <select id="ql237-event" value={company.events.includes(eventType) ? eventType : company.events[0]}
          onChange={(event) => { setEventType(event.target.value); setReceipt(null); last.current = null; }}>
          {company.events.map((event) => <option key={event} value={event}>{event}</option>)}</select></div>
        <div><span className="ql237-field-label">Safe route</span><strong>{organization.id} → AI Data Platform → review only</strong></div>
        <div><span className="ql237-field-label">Contract version</span><strong>{ROSEVEAR_INTEGRATION_CONTRACT}</strong></div></div>
      <div className="ql237-actions"><button type="button" onClick={() => simulate('current')}>Inspect fictional reference event</button>
        <button type="button" onClick={() => simulate('replay')} disabled={!last.current}>Repeat same event · replay denied</button>
        <button type="button" onClick={() => simulate('cross-business')}>Try wrong business</button>
        <button type="button" onClick={() => simulate('tenant')}>Try wrong tenant</button>
        <button type="button" onClick={() => simulate('direct')}>Try direct app route</button>
        <button type="button" onClick={() => simulate('command')}>Try unauthorized command</button>
        <button type="button" onClick={() => simulate('stale')}>Try stale event</button></div>
      <div className="ql237-receipt" role="status" aria-live="polite">{receipt ? <>
        <strong>{receipt.disposition}</strong><p>{receipt.explanation}</p>
        <p>Real calls {receipt.liveCalls} · SMS {receipt.liveSms} · dispatch {receipt.providerDispatch} · remote writes {receipt.remoteWrites} · real pilot holds {receipt.realPilotHolds}/12</p>
      </> : <p>No simulated gateway receipt yet.</p>}</div>
      <p className="ql237-subtle">Demo only: not a real signature verifier, not a network endpoint, not a stored replay ledger. Actual server HMAC/OIDC, cross-tenant policy, revocation, auditing and owner review must be implemented and independently tested.</p>
    </section>

    <section className="ql237-panel" aria-labelledby="ql237-handoff"><h4 id="ql237-handoff">What to give the other application builds</h4>
      <p>Use the checked-in document <strong>docs/ROSEVEAR_INTEGRATION_CONTRACT_V1_HANDOFF.md</strong> with the shared contract, owner responsibilities, security checks and each app's acceptance tests.</p>
      <div className="ql237-copy"><p><strong>Paste into each other application's build request:</strong></p>
        <textarea readOnly aria-label="Copyable Integration Contract v1 build instruction" rows={6}
          value={'Implement Rosevear Integration Contract v1 with AI Data Platform as the sole Integration Gateway. Add server-only /api/integration/v1/health and /capabilities, explicit operation allowlists, per-app signed authentication, business/tenant authorization, timestamp and idempotency/replay checks, denial audit receipts, and negative cross-tenant tests. Keep business data authoritative locally; send only minimum entity references. No direct database access between apps, no remote commands, customer data, real phone/SMS, or production connection until owner authorization and independently verified gateway rollout. Start with health and capabilities only.'} /></div>
      <p className="ql237-note">Recommended first live *data* connection after security review: <strong>AI Data Platform ↔ Devil n Dove</strong> for health, capabilities and product ID / SKU / slug / Etsy listing-ID read-only references; not Etsy edits.</p>
    </section>
  </section>;
}

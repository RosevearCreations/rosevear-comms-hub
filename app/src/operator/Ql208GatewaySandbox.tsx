import { useMemo, useState } from 'react';
import type { OrganizationId } from './ql191Organizations';
import { connectorContracts } from './ql199ConnectorContracts';
import { buildMockReviewQueue } from './ql204HandoffReviewQueue';
import { mockOperatorProfiles } from './ql206SecureOperations';
import { MockGatewayPreviewWorkbench, mockGatewayCases, QL208_PREVIEW_VERSION,
  type MockGatewayCase, type MockGatewayPreviewResult } from './ql208GatewayPreview';
import './ql208-gateway-sandbox.css';

const defaultPersona: Record<OrganizationId, string> = {
  rosiedazzlers: 'rosie-reviewer', devilndove: 'dnd-reviewer',
  icamp: 'camp-rosevear-reviewer', yw: 'yw-rosevear-manager'
};

export function Ql208GatewaySandbox({ organizationId }: { organizationId: OrganizationId }) {
  const [lab] = useState(() => new MockGatewayPreviewWorkbench());
  const queue = useMemo(() => buildMockReviewQueue(organizationId, connectorContracts[organizationId]), [organizationId]);
  const items = queue.ok ? queue.items : [];
  lab.setAllowlistedItems(organizationId, items);
  const [profileId, setProfileId] = useState(defaultPersona[organizationId]);
  const [itemId, setItemId] = useState('');
  const [scenario, setScenario] = useState<MockGatewayCase>('fresh');
  const [result, setResult] = useState<MockGatewayPreviewResult | null>(null);
  const [revision, setRevision] = useState(0);
  const [showHelp, setShowHelp] = useState(false);
  const item = items.find((entry) => entry.id === itemId) ?? items[0];
  const profile = mockOperatorProfiles.find((entry) => entry.id === profileId) ?? mockOperatorProfiles[0];
  const visible = lab.visible(organizationId, profile);
  void revision;

  function simulate(selectedCase: MockGatewayCase) {
    if (!item) return;
    setResult(lab.run({ organizationId, contract: connectorContracts[organizationId], profile, item, scenario: selectedCase }));
    setRevision((current) => current + 1);
  }
  function reset() { lab.clear(); setResult(null); setRevision((current) => current + 1); }

  return <section className="ql208-lab" data-ql208-release={QL208_PREVIEW_VERSION} aria-labelledby="ql208-title">
    <header className="ql208-head"><div><p className="ql191-eyebrow">QL-208 · Provider gateway safety</p>
      <h4 id="ql208-title">Webhook &amp; messaging gateway sandbox</h4>
      <p>Rehearse signed inbound notices, route isolation, replay holds and permanently disabled outgoing delivery.</p></div>
      <button type="button" className="ql191-help-button" aria-expanded={showHelp} aria-controls="ql208-help" onClick={() => setShowHelp((value) => !value)}>ⓘ Help</button>
    </header>
    <p className="ql208-caution" role="note"><strong>SIMULATION ONLY · PROVIDERS DISCONNECTED.</strong> Browser scenarios project the decisions of a separately tested Node-only synthetic HMAC gateway. No signature is checked in the browser, no HTTP endpoint receives calls, no actual messages enter the queue and nothing can be sent.</p>
    {showHelp && <div id="ql208-help" className="ql208-help" role="note">Choose a fictional operator and a safe connector handoff. Run a fresh inbound scenario, then duplicate it to see replay suppression. Try company/tenant/property mismatch, invalid signature and stale timestamp scenarios to inspect expected holds. The independent QL-208 Node test suite verifies invented HMAC signatures using ephemeral keys and exact raw bytes; it is not a real provider integration, login or security certification. Nothing here authorizes a live phone/SMS pilot.</div>}
    {item ? <>
      <div className="ql208-controls">
        <div><label htmlFor="ql208-profile">Fictional operator</label><select id="ql208-profile" value={profileId} onChange={(event) => { setProfileId(event.target.value); setResult(null); }}>
          {mockOperatorProfiles.map((person) => <option key={person.id} value={person.id}>{person.label}</option>)}
        </select></div>
        <div><label htmlFor="ql208-item">Mock inbox handoff</label><select id="ql208-item" value={item.id} onChange={(event) => { setItemId(event.target.value); setResult(null); }}>
          {items.map((entry) => <option key={entry.id} value={entry.id}>{entry.reference} · {entry.category}</option>)}
        </select></div>
        <div><label htmlFor="ql208-scenario">Gateway test case</label><select id="ql208-scenario" value={scenario} onChange={(event) => { setScenario(event.target.value as MockGatewayCase); setResult(null); }}>
          {mockGatewayCases.filter((entry) => !entry.for || entry.for.includes(organizationId)).map((entry) => <option key={entry.id} value={entry.id}>{entry.label}</option>)}
        </select></div>
      </div>
      <div className="ql208-actions"><button type="button" onClick={() => simulate(scenario)}>Run fictional gateway case</button>
        <button type="button" onClick={() => simulate('duplicate')}>Replay same fictional event</button>
        <button type="button" onClick={() => simulate('outbound')}>Try outgoing delivery · blocked</button>
        <button type="button" onClick={reset}>Clear browser receipts</button></div>
      <div className="ql208-decision" role="status" aria-live="polite">
        {result ? <><strong>{result.disposition}</strong><p>{result.explanation}</p><small>Provider authenticated: no · External writes: {result.externalWrites} · SMS sent: {result.messagesSent} · Calls placed: {result.callsPlaced}</small></>
          : <p>No gateway rehearsal run yet.</p>}
      </div>
      <section className="ql208-receipts" aria-label="Accessible fictional gateway receipts"><h5>Review-only synthetic receipts ({visible.length})</h5>
        {visible.length ? <ul>{visible.map((receipt) => <li key={receipt.key}>{receipt.reference} · <strong>HELD FOR HUMAN REVIEW</strong> · company scoped</li>)}</ul>
          : <p>None visible to this fictional operator.</p>}
      </section>
    </> : <p role="alert">No approved fictional connector samples are available.</p>}
    <p className="ql208-foot">Before any real provider rollout: choose and approve the provider, implement its official server-side signature format, authenticate operators and tenants, securely rotate secrets, persist atomic replay receipts, confirm consent/privacy and independently authorize a limited pilot. The provider send queue is still absent.</p>
  </section>;
}

import { useRef, useState, type Dispatch, type SetStateAction } from 'react';
import type { OperatorOrganization, OperatorWorkspace } from './ql191Organizations';
import { QL181_PREREQUISITES } from './ql181PrivacyPilotGate';
import {
  QL238_RELEASE, QL238_PREVIEW_ENV, type Ql238Ledger, type Ql238Kind, type Ql238Request,
  inspectQl238Fixture, ql238RequestFixture, ql238Portfolio, ql238EvidenceReady,
  recordQl238Evidence, acknowledgeQl238Evidence, prepareQl238HeldPacket, resetQl238Company
} from './ql238HandshakeReadiness';
import './ql238-handshake-readiness.css';

type Scenario = 'normal' | 'replay' | 'other-business' | 'other-tenant'
  | 'production' | 'write' | 'direct' | 'stale' | 'extra-field';

export function Ql238HandshakeReadiness({ organization, ledger, setLedger, onNavigate }: {
  organization: OperatorOrganization;
  ledger: Ql238Ledger;
  setLedger: Dispatch<SetStateAction<Ql238Ledger>>;
  onNavigate: (workspace: OperatorWorkspace) => void;
}) {
  const [kind, setKind] = useState<Ql238Kind>('health');
  const [helpOpen, setHelpOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const seen = useRef(new Set<string>());
  const serial = useRef(0);
  const last = useRef<Ql238Request | null>(null);
  const portfolio = ql238Portfolio(ledger);
  const evidence = ledger[organization.id];
  const ready = ql238EvidenceReady(evidence);
  const latest = kind === 'health' ? evidence?.health : evidence?.capabilities;

  function simulate(scenario: Scenario) {
    let request: Ql238Request;
    if (scenario === 'replay' && last.current) request = last.current;
    else {
      serial.current += 1;
      request = ql238RequestFixture(organization.id, kind, 'mock-' + serial.current);
      if (scenario === 'other-business') request = {
        ...request, business_id: organization.id === 'icamp' ? 'yw' : 'icamp'
      };
      if (scenario === 'other-tenant') request = {
        ...request, tenant_id: organization.tenantModel === 'multi-tenant-planned' ? 'demo-foreign-tenant' : 'demo-unexpected-tenant'
      };
      if (scenario === 'production') request = {
        ...request, environment: 'production' as typeof QL238_PREVIEW_ENV
      };
      if (scenario === 'write') request = {
        ...request, requested_capabilities: ['update_product', 'send_sms']
      };
      if (scenario === 'direct') request = {
        ...request, gateway_id: 'rosevear-comms-hub' as Ql238Request['gateway_id']
      };
      if (scenario === 'stale') request = {
        ...request, issued_at: '2020-01-01T00:00:00Z'
      };
      if (scenario === 'extra-field') request = {
        ...request, privateMessage: 'Do not collect'
      } as Ql238Request;
      if (scenario === 'normal') last.current = request;
    }
    setLedger((previous) => recordQl238Evidence(
      previous, inspectQl238Fixture(request, organization.id, seen.current)
    ));
  }

  function reset() {
    seen.current.clear(); last.current = null; serial.current = 0;
    setLedger((previous) => resetQl238Company(previous, organization.id));
  }

  return <section className="ql238-screen" data-ql238-release={QL238_RELEASE} data-company={organization.id} aria-labelledby="ql238-title">
    <header className="ql238-header"><div><p className="ql191-eyebrow">QL-238 · Health/Capabilities contract v1 · Disabled preview</p>
      <h3 id="ql238-title">Four-business gateway handshake readiness</h3>
      <p>Rehearse the first two signed server endpoints and review held evidence with no network connection.</p></div>
      <button type="button" aria-expanded={helpOpen} aria-controls="ql238-help" onClick={() => setHelpOpen((open) => !open)}>ⓘ Handshake help</button>
    </header>
    <p className="ql238-warning" role="note"><strong>ALL ACTUAL CONNECTIONS DISCONNECTED.</strong> This browser screen makes no authenticated requests and cannot enable a phone provider or any other application. It shows fictional, session-only receipts; all 12 QL-181 pilot gates remain HELD_UNVERIFIED. Separate server credentials, gateway deployment, privacy review and owner approval are still required.</p>
    {helpOpen && <p className="ql238-info" id="ql238-help">Start with fictional health and then capabilities for one company. A mock result of HELD_UNVERIFIED means only that its shape and selected scope match our proposed v1 contract. Try a wrong business, campground/company tenant, production environment, direct route, stale nonce, replay and write capability; these should fail closed. The separate Node-only CI harness verifies invented HMAC bytes, key revocation and rotation, but has no listener and authenticates no real business. After both checks pass, acknowledge the local evidence only and prepare a held packet. Neither action grants a real connection or pilot release.</p>}
    <section className="ql238-panel" aria-labelledby="ql238-matrix-title"><h4 id="ql238-matrix-title">Four-company handshake readiness matrix</h4>
      <div className="ql238-table-scroll"><table><caption>Session-local, fictional preflight only. No app has a live authenticated gateway connection.</caption>
        <thead><tr><th scope="col">Business</th><th scope="col">Health</th><th scope="col">Capabilities</th><th scope="col">Evidence</th><th scope="col">Actual connection</th><th scope="col">Live pilot</th></tr></thead>
        <tbody>{portfolio.map((item) => <tr key={item.company}>
          <th scope="row">{item.company === 'devilndove' ? 'Devil n Dove' : item.company === 'rosiedazzlers' ? 'Rosie Dazzlers' : item.company === 'icamp' ? 'iCamp' : 'Yard Workers'}</th>
          <td>{item.health}</td><td>{item.capabilities}</td><td>{item.phase === 'LOCAL_PACKET_PREPARED_HELD' ? 'Local HELD packet' : 'Review only'}</td>
          <td><strong>{item.actualConnection}</strong></td><td><strong>{item.realPilotHolds}/12 HELD</strong></td>
        </tr>)}</tbody></table></div>
    </section>
    <section className="ql238-panel" aria-labelledby="ql238-case-title"><h4 id="ql238-case-title">{organization.name} · Fictional handshake tests</h4>
      <p>Step 1: inspect <strong>GET /api/integration/v1/health</strong>. Step 2: inspect <strong>GET /api/integration/v1/capabilities</strong>. No customer information is part of either response.</p>
      <div className="ql238-controls"><div><label htmlFor="ql238-kind">Endpoint</label>
        <select id="ql238-kind" value={kind} onChange={(event) => { setKind(event.target.value as Ql238Kind); last.current = null; }}>
          <option value="health">Health · no customer data</option>
          <option value="capabilities">Capabilities · read-only allowlist</option>
        </select></div><div><span>Connection environment</span><strong>disabled-preview only</strong></div>
        <div><span>Tenant boundary</span><strong>{organization.tenantModel === 'multi-tenant-planned' ? 'Company/campground tenant required' : 'Single business scope'}</strong></div></div>
      <div className="ql238-actions"><button type="button" onClick={() => simulate('normal')}>Inspect fictional GET</button>
        <button type="button" disabled={!last.current} onClick={() => simulate('replay')}>Replay nonce · deny</button>
        <button type="button" onClick={() => simulate('other-business')}>Wrong business · deny</button>
        <button type="button" onClick={() => simulate('other-tenant')}>Wrong tenant · deny</button>
        <button type="button" onClick={() => simulate('production')}>Production mismatch · deny</button>
        <button type="button" onClick={() => simulate('write')}>Write capability · deny</button>
        <button type="button" onClick={() => simulate('direct')}>Direct route · deny</button>
        <button type="button" onClick={() => simulate('stale')}>Expired nonce · deny</button>
        <button type="button" onClick={() => simulate('extra-field')}>Extra private field · deny</button></div>
      <div className="ql238-result" role="status" aria-live="polite">{latest ? <>
        <strong>{latest.disposition}</strong><p>{latest.reason}</p>
        {latest.response && <p>Fictional response: {latest.response.application_id} · {latest.response.contract_version} · status <strong>{latest.response.connection_status}</strong>{latest.response.capabilities ? ' · read-only: ' + latest.response.capabilities.join(', ') : ''}</p>}
        <p>Network requests {latest.sentRequests} · remote writes {latest.externalWrites} · calls {latest.liveCalls} · SMS {latest.liveSms} · actual status <strong>{latest.actualConnection}</strong>.</p>
      </> : <p>No {kind} test recorded for this business.</p>}</div>
    </section>
    <section className="ql238-panel" aria-labelledby="ql238-packet-title"><h4 id="ql238-packet-title">Owner-safe evidence gate · no authorization</h4>
      <p>Both simulated endpoints must pass their local preflight before we can acknowledge an <em>unverified</em> packet. The packet cannot enable the gateway or lift any QL-181 hold.</p>
      <div className="ql238-actions"><button type="button" disabled={!ready || evidence?.acknowledgement === 'ACKNOWLEDGED_UNVERIFIED'}
        onClick={() => setLedger((previous) => acknowledgeQl238Evidence(previous, organization.id))}>Acknowledge locally · UNVERIFIED</button>
        <button type="button" disabled={!ready || evidence?.acknowledgement !== 'ACKNOWLEDGED_UNVERIFIED' || evidence.phase === 'LOCAL_PACKET_PREPARED_HELD'}
          onClick={() => setLedger((previous) => prepareQl238HeldPacket(previous, organization.id))}>Prepare local packet · HELD</button>
        <button type="button" onClick={reset}>Reset this business's fictional evidence only</button>
        <button type="button" onClick={() => onNavigate('integration_options')}>Open QL-237 integration contract</button></div>
      <div className="ql238-result" role="status"><strong>{evidence?.phase === 'LOCAL_PACKET_PREPARED_HELD' ? 'LOCAL PACKET PREPARED · STILL HELD' : 'NO HELD PACKET PREPARED'}</strong>
        <p>Local acknowledgement: {evidence?.acknowledgement ?? 'NOT_REVIEWED'} · real owner approval: NO · real gateway connection: DISCONNECTED.</p></div>
      <button type="button" aria-expanded={detailsOpen} aria-controls="ql238-held-detail" onClick={() => setDetailsOpen((open) => !open)}>
        {detailsOpen ? 'Hide' : 'Show'} all 12 unchanged actual QL-181 prerequisites</button>
      {detailsOpen && <ol id="ql238-held-detail" className="ql238-prerequisites">{QL181_PREREQUISITES.map((item) =>
        <li key={item.id}><strong>{item.title}</strong> — {item.state}</li>)}</ol>}
      <p className="ql238-info">After this release, the AI Data Platform and each application still need separately implemented server-only health/capabilities endpoints, authenticated credentials, tenant policy, audit receipts, rotation and independent acceptance. First real read-only reference pilot: Devil n Dove, only after explicit owner authorization.</p>
    </section>
  </section>;
}

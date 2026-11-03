import { useState } from 'react';
import type { OperatorWorkspace } from './ql191Organizations';
import { QL323_DEPENDENCIES, QL323_RELEASE_EVIDENCE, QL323_SCENARIOS, ql323Assess, ql323SourceEvidence, type Ql323Scenario } from './ql323SystemHealth';
import { ql303ImmutableProofUrl } from './ql303CapabilityReadiness';
import type { Ql270SourceId } from './ql270ConnectionCentre';
import './ql323-system-health.css';

export function Ql323SystemHealth({ onNavigate }: { onNavigate: (workspace: OperatorWorkspace) => void }) {
  const [source, setSource] = useState<Ql270SourceId>('rosiedazzlers');
  const [scenario, setScenario] = useState<Ql323Scenario>('unobserved');
  const [reviewClock] = useState(() => new Date());
  const assessment = ql323Assess(scenario);
  const evidence = ql323SourceEvidence(reviewClock);
  const current = evidence.find(item => item.id === source)!;
  const stale = evidence.filter(item => item.freshness.startsWith('STALE')).length;
  const releaseHref = `https://github.com/RosevearCreations/rosevear-comms-hub/blob/${QL323_RELEASE_EVIDENCE.sourceCommit}/${QL323_RELEASE_EVIDENCE.receiptPath}`;
  return <section className="ql323" data-ql323-release="honest-status-dependency-recovery-v1" aria-labelledby="ql323-title">
    <header className="ql323-heading"><div><p className="ql271-eyebrow">QL-323 · System Status Command</p><h3 id="ql323-title">Dependency health & guided recovery</h3><p>Separate verified release paperwork, dated public proof, and simulated failures from live infrastructure health. No source polling occurs in this screen.</p></div><strong className="ql323-hold">0 CONNECTED · OPERATIONAL HOLD</strong></header>
    <div className="ql323-status" aria-label="System health evidence summary">
      <article><span>Application release evidence</span><strong>DOCUMENTED</strong><small>QL-322 main source receipt · historical only</small></article>
      <article><span>Preview in this browser</span><strong>RENDERED</strong><small>Visible UI loaded · not an endpoint health probe</small></article>
      <article><span>Build and deployment checks</span><strong>RECEIPT ONLY</strong><small>QL-322 exact-main checks · not continuously monitored</small></article>
      <article><span>External source health</span><strong>UNKNOWN</strong><small>0 verified live health probes</small></article>
      <article><span>Held integrations</span><strong>6 / 6 HOLD</strong><small>Four businesses · two supporting services</small></article>
      <article><span>Public proof freshness</span><strong>{stale} / 6 stale</strong><small>Historical immutable HTTP observations; no auto recheck</small></article>
    </div>
    <div className="ql323-release" role="note"><strong>Software release ≠ live system health</strong><p>We can reference the QL-322 verified release receipt and load this preview, but no authenticated health API, deployment telemetry, six-app feed, Windows relay or real-device acceptance is connected. An old HTTP 404 remains a dated proof result, not proof of today’s outage.</p><a href={releaseHref} target="_blank" rel="noopener noreferrer">Inspect exact verified QL-322 release receipt</a> <code>{QL323_RELEASE_EVIDENCE.sourceCommit.slice(0,12)}</code></div>
    <section className="ql323-dependencies" aria-labelledby="ql323-map-title"><h4 id="ql323-map-title">Proposed dependency map · every link on HOLD</h4><p>These are planned relationships for a future scoped integration, not an operating network or evidence that two tenants share data.</p>
      <div className="ql323-map" aria-label="Proposed six-source dependency arrangement">
        <div className="ql323-map-group"><h5>Four independent business sources</h5>{QL323_DEPENDENCIES.filter(item => item.kind === 'Business app').map(item => <div key={item.id}><strong>{item.label}</strong><small>Separate tenant · NOT CONNECTED</small></div>)}</div>
        <div className="ql323-map-core"><strong>Rosevear Comms Hub</strong><span>Disabled operator preview</span><b>NO PROVIDER REQUESTS</b><small>All connections held</small></div>
        <div className="ql323-map-group"><h5>Two supporting services</h5>{QL323_DEPENDENCIES.filter(item => item.kind !== 'Business app').map(item => <div key={item.id}><strong>{item.label}</strong><small>{item.kind === 'Private edge service' ? 'Private Windows relay OFF' : 'Reporting feed NOT CONNECTED'}</small></div>)}</div>
      </div>
      <div className="ql323-table-wrap" tabIndex={0} role="region" aria-label="Scrollable dependency map table"><table><caption>Exact text equivalent of the proposed dependency map: no active connections</caption><thead><tr><th scope="col">Source / role</th><th scope="col">Proposed boundary</th><th scope="col">Current state</th></tr></thead><tbody>{QL323_DEPENDENCIES.map(item => <tr key={item.id}><th scope="row">{item.label}<small>{item.kind}</small></th><td>{item.via}</td><td>{item.link}</td></tr>)}</tbody></table></div>
    </section>
    <section className="ql323-proof" aria-labelledby="ql323-proof-title"><div className="ql323-section-heading"><h4 id="ql323-proof-title">Source status and evidence freshness</h4><button type="button" onClick={() => onNavigate('it_command')}>Open I.T. diagnostics</button><button type="button" onClick={() => onNavigate('six_app_evidence')}>Review six-app proof evidence</button></div><p>All observations below are historical public immutable-file checks. A dated 404 is missing proof, not a measured application outage. Unknown means not monitored.</p>
      <div className="ql323-table-wrap" tabIndex={0} role="region" aria-label="Scrollable source evidence status"><table><caption>Six held sources · last observed public proof versus unknown live service health</caption><thead><tr><th scope="col">Source</th><th scope="col">Last public proof observation</th><th scope="col">Evidence age</th><th scope="col">Live health</th><th scope="col">Source receipt</th></tr></thead><tbody>{evidence.map(row => <tr key={row.id}><th scope="row">{row.label}<small>{row.kind}</small></th><td><strong>{row.originalProof}</strong><time dateTime={row.observedAt}>{row.observedAt.replace('T', ' ').replace('Z', ' UTC')}</time></td><td>{row.freshness}<small>{row.age}</small></td><td>{row.health}<small>{row.connection}</small></td><td><a href={ql303ImmutableProofUrl(row.id)} target="_blank" rel="noopener noreferrer">Pinned public proof URL</a></td></tr>)}</tbody></table></div>
    </section>
    <section className="ql323-recovery" aria-labelledby="ql323-recovery-title"><div><p className="ql271-eyebrow">Credential-free simulator · no network calls</p><h4 id="ql323-recovery-title">Guided failure recovery</h4><p>Pick a held source and a fabricated failure. This changes the explanation in this tab only; no system health state, deployment, connection or Windows service is changed.</p></div>
      <div className="ql323-controls"><label htmlFor="ql323-source">Affected example source<select id="ql323-source" value={source} onChange={event => { setSource(event.currentTarget.value as Ql270SourceId); setScenario('unobserved'); }}>{evidence.map(row => <option value={row.id} key={row.id}>{row.label}</option>)}</select></label><label htmlFor="ql323-scenario">Failure rehearsal<select id="ql323-scenario" value={scenario} onChange={event => setScenario(event.currentTarget.value as Ql323Scenario)}>{QL323_SCENARIOS.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}</select></label></div>
      <div className="ql323-outcome" aria-live="polite" role="status"><span className="ql323-state">{assessment.label}</span><h5>{current.label} · {assessment.outcome}</h5><p>{assessment.explanation}</p><p className="ql323-readback">Observed source health: <strong>UNKNOWN</strong> · Public proof: <strong>{current.originalProof}</strong> · Provider requests: <strong>{assessment.providerRequests}</strong> · Automatic restarts: <strong>{assessment.autoRestartAttempts}</strong></p></div>
      <div className="ql323-actions"><h5>Safe review steps — recommendations only</h5><ol>{assessment.actions.map(action => <li key={action}>{action}</li>)}</ol><div className="ql323-action-buttons"><button type="button" onClick={() => setScenario('fixture_recovered')}>Rehearse fixture recovery · NO RESTART</button><button type="button" onClick={() => setScenario('unobserved')}>Reset to UNKNOWN</button><button type="button" onClick={() => onNavigate('connections')}>Open held connection plan</button></div></div>
    </section>
    <p className="ql323-footnote" role="note">No active provider status, real incident closure, private endpoint, secret telemetry, automatic retry/restart, live call/SMS, dispatched ACK, tenant grant or Windows relay installation is claimed or performed. Six integrations: <strong>DISCONNECTED / HOLD</strong>. ACK evidence: <strong>UNDER_REVIEW / PARKED_FOR_LATER</strong>.</p>
  </section>;
}

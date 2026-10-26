import { useState, type Dispatch, type SetStateAction } from 'react';
import type { OperatorOrganization, OperatorWorkspace } from './ql191Organizations';
import { evaluateQl211Portfolio, observationFor, ql211CompanyReceipt, recordQl211Observation,
  scenariosForCompany, QL211_RELEASE, type Ql211Area, type Ql211Ledger,
  type Ql211Outcome, type Ql211ScenarioId, type Ql211Severity } from './ql211OwnerTrial';
import './ql211-owner-observed-trial.css';

const outcomes: readonly [Ql211Outcome, string][] = [
  ['not_run', 'Not run'], ['observed_pass', 'Observed pass (self-reported)'],
  ['observed_gap', 'Observed gap'], ['blocked', 'Could not complete']
];
const areas: readonly Ql211Area[] = ['usability', 'accessibility', 'workflow', 'isolation', 'safety'];
const severities: readonly Ql211Severity[] = ['critical', 'high', 'medium', 'low'];

export function Ql211OwnerObservedTrial({ organization, ledger, setLedger, onNavigate }: {
  organization: OperatorOrganization;
  ledger: Ql211Ledger;
  setLedger: Dispatch<SetStateAction<Ql211Ledger>>;
  onNavigate: (workspace: OperatorWorkspace) => void;
}) {
  const scenarios = scenariosForCompany(organization.id);
  const [activeId, setActiveId] = useState<Ql211ScenarioId>('inbox');
  const [showHelp, setShowHelp] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const portfolio = evaluateQl211Portfolio(ledger);
  const company = portfolio.companies.find((entry) => entry.organizationId === organization.id)!;
  const activeScenario = scenarios.find((entry) => entry.id === activeId)!;
  const current = observationFor(ledger, organization.id, activeId);
  const change = (patch: Parameters<typeof recordQl211Observation>[3]) =>
    setLedger((previous) => recordQl211Observation(previous, organization.id, activeId, patch));

  return <section className="ql211-trial" data-ql211-release={QL211_RELEASE} data-organization={organization.id} aria-labelledby="ql211-title">
    <header className="ql211-header"><div>
      <p className="ql191-eyebrow">QL-211 · Manual preview trial</p>
      <h3 id="ql211-title">Owner-observed four-company trial &amp; readiness gap triage</h3>
      <p>Walk through each fictional workflow on your own device. Record what you actually see; this application does not observe your device or verify the operator's identity.</p>
    </div><button type="button" aria-expanded={showHelp} aria-controls="ql211-help" onClick={() => setShowHelp((value) => !value)}>ⓘ Trial help</button></header>
    <p className="ql211-warning" role="note"><strong>DISABLED PREVIEW · NO LIVE PILOT.</strong> All {portfolio.heldPrerequisites.length} independent prerequisites remain HELD_UNVERIFIED. No calls, SMS, provider dispatch, customer data, authorization, formal signoff or owner identity verification. Observation entries are self-reported, exist only in this open app session and are lost on reload. Do not enter real names, phone numbers or other personal information.</p>
    {showHelp && <div id="ql211-help" className="ql211-help" role="note">
      <strong>How to run a trial:</strong> Pick a company and one scenario, open its workspace, perform the listed steps, then return and choose an observation state. Use a gap or blocked result to create a triage item and set an impact; a pass is only your unverified preview note. Repeat on a narrow screen, with keyboard navigation and at 200% zoom. Notes are never sent or stored. The portable summary intentionally omits all free-text notes.
    </div>}
    <div className="ql211-metrics" aria-label="Session trial counts">
      <div><small>QL-210 automated checks</small><strong>{portfolio.ql210SyntheticPasses}/{portfolio.ql210SyntheticChecks}</strong><span>Synthetic only</span></div>
      <div><small>Manual observations across four companies</small><strong>{portfolio.observed}/{portfolio.total}</strong><span>{portfolio.notRun} not run</span></div>
      <div><small>Open gap / blocked triage</small><strong>{portfolio.gaps}</strong><span>Session-only, not independently confirmed</span></div>
      <div><small>Real pilot gate</small><strong className="ql211-held">HELD</strong><span>{portfolio.heldPrerequisites.length} unverified prerequisites</span></div>
    </div>
    <section className="ql211-portfolio" aria-labelledby="ql211-portfolio-title"><h4 id="ql211-portfolio-title">Four-company trial coverage</h4>
      <div className="ql211-table-scroll"><table><caption>Only explicitly entered on-screen observations count. Zero is expected before an owner trial.</caption>
        <thead><tr><th scope="col">Company</th><th scope="col">Pass noted</th><th scope="col">Gaps</th><th scope="col">Blocked</th><th scope="col">Not run</th><th scope="col">Live status</th></tr></thead>
        <tbody>{portfolio.companies.map((entry) => <tr key={entry.organizationId}><th scope="row">{entry.organizationId === organization.id ? <strong>{entry.organizationId === 'yw' ? 'YW · Property Maintenance' : organization.name}</strong> : entry.organizationId === 'devilndove' ? 'Devil n Dove' : entry.organizationId === 'icamp' ? 'iCamp' : entry.organizationId === 'yw' ? 'YW · Property Maintenance' : 'Rosie Dazzlers'}</th>
          <td>{entry.observedPass}</td><td>{entry.observedGaps}</td><td>{entry.blocked}</td><td>{entry.notRun}</td><td>HELD</td></tr>)}</tbody>
      </table></div>
    </section>
    <div className="ql211-grid">
      <section className="ql211-scenarios" aria-labelledby="ql211-scenarios-title"><h4 id="ql211-scenarios-title">{organization.name} · 10 guided scenarios</h4>
        <p>Choose a test to inspect its steps and record an observation.</p>
        <div role="group" aria-label="Select trial scenario">{scenarios.map((scenario, index) => {
          const observed = observationFor(ledger, organization.id, scenario.id);
          return <button key={scenario.id} type="button" className={scenario.id === activeId ? 'ql211-scenario active' : 'ql211-scenario'} aria-pressed={scenario.id === activeId} onClick={() => setActiveId(scenario.id)}>
            <span><strong>{index + 1}. {scenario.title}</strong><small>{scenario.workspace}</small></span>
            <em>{outcomes.find((entry) => entry[0] === observed.outcome)?.[1]}</em>
          </button>;
        })}</div>
      </section>
      <section className="ql211-observe" aria-labelledby="ql211-observe-title"><h4 id="ql211-observe-title">{activeScenario.title}</h4>
        <div className="ql211-step"><strong>Try this in the preview</strong><p>{activeScenario.steps}</p></div>
        <div className="ql211-step"><strong>Expected safe behaviour</strong><p>{activeScenario.expected}</p></div>
        <button type="button" className="ql211-open-workspace" onClick={() => onNavigate(activeScenario.workspace)}>Open {activeScenario.workspace} workspace</button>
        <p className="ql211-return-hint">Return to “Owner trial &amp; gap triage” after observing the screen. Your draft remains in memory while this app stays open.</p>
        <div className="ql211-form">
          <label htmlFor="ql211-outcome">What did you observe?</label>
          <select id="ql211-outcome" value={current.outcome} onChange={(event) => change({ outcome: event.target.value as Ql211Outcome,
            ...(event.target.value === 'not_run' ? { note: '' } : {}) })}>
            {outcomes.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
          {(current.outcome === 'observed_gap' || current.outcome === 'blocked') && <div className="ql211-triage-inputs">
            {current.outcome === 'observed_gap' && <><label htmlFor="ql211-severity">Impact if reproduced</label>
              <select id="ql211-severity" value={current.severity} onChange={(event) => change({ severity: event.target.value as Ql211Severity })}>
                {severities.map((value) => <option key={value} value={value}>{value}</option>)}
              </select></>}
            <label htmlFor="ql211-area">Likely repair area</label>
            <select id="ql211-area" value={current.area} onChange={(event) => change({ area: event.target.value as Ql211Area })}>
              {areas.map((value) => <option key={value} value={value}>{value}</option>)}
            </select>
          </div>}
          {current.outcome !== 'not_run' && <><label htmlFor="ql211-note">Fixture-only observation note (optional; max 240 characters)</label>
            <textarea id="ql211-note" rows={3} maxLength={240} placeholder="Example: At 200% zoom, the mock inbox filter overlaps the button. No personal details." value={current.note} onChange={(event) => change({ note: event.target.value })} />
            <small>{current.note.length}/240 · Not included in the portable receipt.</small></>}
        </div>
      </section>
    </div>
    <section className="ql211-triage" aria-labelledby="ql211-triage-title"><h4 id="ql211-triage-title">{organization.name} · Readiness gap triage ({company.findings.length})</h4>
      {company.findings.length === 0 ? <p>No gap or blocker has been reported for this company in the current browser session. <strong>This does not mean the company has been tested or approved.</strong></p>
        : <ol>{company.findings.map((finding) => <li key={finding.id}>
          <div><strong>{finding.title}</strong> <span className="ql211-priority">{finding.priority} · {finding.outcome === 'blocked' ? 'Blocked' : 'Observed gap'} · {finding.area}</span></div>
          {finding.note && <p className="ql211-note">Fixture-only note: {finding.note}</p>}
          <p>Suggested next action: {finding.nextAction}</p>
          <small>Open preview finding · repair and retest required; this screen cannot close or approve it</small>
        </li>)}</ol>}
    </section>
    <section className="ql211-receipt" aria-labelledby="ql211-receipt-title"><h4 id="ql211-receipt-title">Session summary and reset</h4>
      <div className="ql211-actions"><button type="button" aria-expanded={showReceipt} aria-controls="ql211-receipt-data" onClick={() => setShowReceipt((value) => !value)}>{showReceipt ? 'Hide' : 'Show'} PII-minimized company receipt</button>
        <button type="button" aria-expanded={confirmReset} aria-controls="ql211-reset-confirmation" onClick={() => setConfirmReset((value) => !value)}>Reset this company's trial draft</button></div>
      {showReceipt && <div id="ql211-receipt-data"><p>Copy only if you wish to preserve the fixture-only status summary. No notes, personal information, identity attestation or real approval is included.</p><textarea readOnly aria-label="Fixture-only company trial receipt" rows={13} value={ql211CompanyReceipt(ledger, organization.id)} /></div>}
      {confirmReset && <div id="ql211-reset-confirmation" className="ql211-reset"><p>Clear all ten local observation drafts for {organization.name}? This cannot be undone in this session. Other company drafts remain unchanged.</p>
        <button type="button" onClick={() => { setLedger((previous) => { const next = { ...previous }; delete next[organization.id]; return next; }); setConfirmReset(false); }}>Confirm reset for this company</button>
        <button type="button" onClick={() => setConfirmReset(false)}>Cancel</button>
      </div>}
    </section>
    <p className="ql211-foot">Preview acceptance, a self-reported observation, an open-gap review and a production build are different things. This release does not attest independent accessibility testing, tenant security, provider configuration, real customer consent or owner release approval. The pilot remains HELD.</p>
  </section>;
}

import { useMemo, useState } from 'react';
import type { OperatorOrganization, OperatorWorkspace } from './ql191Organizations';
import { evaluateQl210Portfolio, QL210_RELEASE } from './ql210ApplicationAcceptance';
import type { Ql181Category } from './ql181PrivacyPilotGate';
import './ql210-application-acceptance.css';

const holdCategories: readonly (Ql181Category | 'All')[] = [
  'All', 'Identity & roles', 'Consent & privacy', 'Provider & infrastructure', 'Owner governance'
];

export function Ql210ApplicationAcceptance({ organization, onNavigate }: {
  organization: OperatorOrganization;
  onNavigate: (target: OperatorWorkspace) => void;
}) {
  const [runNumber, setRunNumber] = useState(1);
  const [showHelp, setShowHelp] = useState(false);
  const [showPortfolio, setShowPortfolio] = useState(false);
  const [showHolds, setShowHolds] = useState(false);
  const [holdCategory, setHoldCategory] = useState<Ql181Category | 'All'>('All');
  const result = useMemo(() => evaluateQl210Portfolio(), [runNumber]);
  const current = result.organizations.find((item) => item.organizationId === organization.id);
  const visibleHolds = result.heldPrerequisites.filter((hold) => holdCategory === 'All' || hold.category === holdCategory);

  return <section className="ql210-acceptance" aria-labelledby="ql210-title" data-ql210-release={QL210_RELEASE} data-organization={organization.id}>
    <header className="ql210-head"><div><p className="ql191-eyebrow">QL-210 · Release acceptance</p>
      <h3 id="ql210-title">Four-company application acceptance &amp; release readiness</h3>
      <p>Run a fixed, non-network acceptance exercise across the existing operator workspaces, connector boundaries and disabled communication policies.</p></div>
      <button type="button" className="ql191-help-button" aria-expanded={showHelp} aria-controls="ql210-help" onClick={() => setShowHelp((open) => !open)}>ⓘ Help</button>
    </header>
    <p className="ql210-warning" role="note"><strong>DISABLED PREVIEW ONLY.</strong> These automated checks exercise canonical fictional data and in-memory policy models, not production authentication, real Supabase RLS, telecom callbacks, browsers/devices outside this test, measured accessibility, or human owner acceptance. All live-pilot prerequisites remain held.</p>
    <p className="ql210-warning" role="note">Earlier two-brand preview records do not approve iCamp or YW tenants. All twelve real-pilot requirements remain held for every company, regardless of synthetic results.</p>
    {showHelp && <p id="ql210-help" className="ql210-help" role="note">Use Run synthetic acceptance to repeat the four-company checks; no record is saved and no new authority is granted. Each PASS means a known in-process fixture scenario behaved as expected, not that a live integration is ready. Inspect the blockers before scheduling separate operator trials, accessibility review, independently verified authorization/consent, chosen provider testing and owner signoff. This page cannot sign off a release or enable sending.</p>}
    <div className="ql210-statuses" role="status" aria-live="polite">
      <div><span>Four-company synthetic suite</span><strong>{result.passed}/{result.totalChecks} passed</strong><small>{result.previewChecksReady ? 'Ready for owner-observed preview trial' : 'Synthetic acceptance failures require repair'}</small></div>
      <div><span>Live communications pilot</span><strong className="ql210-held">HELD · NOT AUTHORIZED</strong><small>{result.heldPrerequisites.length} independently unverified prerequisites</small></div>
      <div><span>External evidence</span><strong>NOT ATTESTED</strong><small>No real operator identity, human review, provider, or customer data</small></div>
    </div>
    <div className="ql210-actions">
      <button type="button" onClick={() => setRunNumber((value) => value + 1)}>Run synthetic acceptance again</button>
      <button type="button" aria-expanded={showPortfolio} aria-controls="ql210-portfolio" onClick={() => setShowPortfolio((value) => !value)}>{showPortfolio ? 'Hide' : 'Show'} four-company summary</button>
      <button type="button" aria-expanded={showHolds} aria-controls="ql210-holds" onClick={() => setShowHolds((value) => !value)}>{showHolds ? 'Hide' : 'Review'} live-pilot holds</button>
    </div>
    <p className="ql210-ran">Review run #{runNumber} · Results exist only in this page session · External writes: {result.externalWrites} · Calls: {result.callsPlaced} · Messages: {result.messagesSent}</p>
    <section className="ql210-matrix" aria-labelledby="ql210-current-heading"><h4 id="ql210-current-heading">{organization.name} · Synthetic acceptance results</h4>
      {current ? <table><caption>Programmatic checks of demo models only; these are not production certifications</caption>
        <thead><tr><th scope="col">Workflow / boundary</th><th scope="col">Result</th><th scope="col">What was exercised</th></tr></thead>
        <tbody>{current.checks.map((item) => <tr key={item.id}><th scope="row">{item.label}</th><td><strong className={item.state === 'PASS_SYNTHETIC' ? 'ql210-pass' : 'ql210-fail'}>{item.state === 'PASS_SYNTHETIC' ? 'PASS · DEMO' : 'FAIL · HOLD'}</strong></td><td>{item.evidence}</td></tr>)}</tbody>
      </table> : <p role="alert">Company not found in canonical acceptance registry; all readiness remains held.</p>}
    </section>
    {showPortfolio && <section id="ql210-portfolio" className="ql210-summary" aria-labelledby="ql210-portfolio-title"><h4 id="ql210-portfolio-title">Four-company acceptance matrix</h4>
      <table><caption>Counts of synthetic policy checks by company; no customer data included</caption><thead><tr><th scope="col">Company</th><th scope="col">Passed</th><th scope="col">Failed</th><th scope="col">Preview state</th><th scope="col">Live pilot</th></tr></thead>
        <tbody>{result.organizations.map((entry) => <tr key={entry.organizationId}><th scope="row">{entry.companyName}</th><td>{entry.passed}</td><td>{entry.failed}</td><td>{entry.previewChecksReady ? 'Synthetic checks passed' : 'Repair required'}</td><td>HELD</td></tr>)}</tbody>
      </table></section>}
    <section className="ql210-required" aria-labelledby="ql210-gates-heading"><h4 id="ql210-gates-heading">Unverified prerequisites before any real pilot: {result.heldPrerequisites.length}</h4>
      <p>Every requirement is deliberately <strong>HELD_UNVERIFIED</strong>. Passing sample checks does not change a gate or capture an approval.</p>
      {showHolds && <div id="ql210-holds"><label htmlFor="ql210-category">Filter prerequisite category</label>
        <select id="ql210-category" value={holdCategory} onChange={(event) => setHoldCategory(event.target.value as Ql181Category | 'All')}>{holdCategories.map((category) => <option key={category} value={category}>{category}</option>)}</select>
        <ol>{visibleHolds.map((hold) => <li key={hold.id}><strong>{hold.title}</strong> <span>HELD_UNVERIFIED</span><p>{hold.requiredBeforePilot}</p><small>Independent reviewer: {hold.reviewer}</small></li>)}</ol>
      </div>}
    </section>
    <div className="ql210-workspace-links" aria-label="Open demonstration workspace for manual trial">
      <button type="button" onClick={() => onNavigate('inbox')}>Review sample inbox</button>
      <button type="button" onClick={() => onNavigate('queue')}>Review task queue</button>
      <button type="button" onClick={() => onNavigate('reports')}>Review scoped analytics</button>
      <button type="button" onClick={() => onNavigate('connectors')}>Review connector safety</button>
    </div>
    <p className="ql210-foot">A Production GREEN build confirms build/deployment checks for this disabled-preview application only. A real-world pilot requires separate authenticated staging, multi-device and assistive-technology tests, private tenant/RLS review, provider selection, legally appropriate consent, cost confirmation, independent signoff, and an explicit new owner-authorized implementation release.</p>
  </section>;
}

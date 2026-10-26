import { useState, type Dispatch, type SetStateAction } from 'react';
import type { OperatorOrganization, OperatorWorkspace } from './ql191Organizations';
import type { Ql211ScenarioId } from './ql211OwnerTrial';
import type { Ql214GapCategory } from './ql214ReviewIntake';
import { QL220_RELEASE, QL220_CHECKS, ql220CompanyMonitoring, ql220Portfolio, ql220CompanyReceipt,
  beginQl220Reopen, recordQl220Exception, advanceQl220Cycle, acknowledgeQl220Check, prepareQl220FollowUpAudit,
  type Ql220Sources, type Ql220Ledger, type Ql220Disposition, type Ql220NextStep } from './ql220ReopenMonitoring';
import './ql220-reopen-monitor.css';

const sourceLabels: Record<string, string> = {
  AWAITING_PREPARED_QL219: 'Awaiting prepared fictional QL-219 review',
  SOURCE_CURRENT: 'QL-219 source matches local monitoring',
  CLOSURE_SOURCE_REVISED: 'FROZEN · QL-219 packet changed',
  UPSTREAM_STALE: 'FROZEN · prior evidence no longer current'
};

export function Ql220ReopenMonitor({ organization, sources, ledger, setLedger, onNavigate }: {
  organization: OperatorOrganization;
  sources: Ql220Sources;
  ledger: Ql220Ledger;
  setLedger: Dispatch<SetStateAction<Ql220Ledger>>;
  onNavigate: (workspace: OperatorWorkspace) => void;
}) {
  const [selected, setSelected] = useState<Ql211ScenarioId | null>(null);
  const [category, setCategory] = useState<Ql214GapCategory | ''>('');
  const [reopenReason, setReopenReason] = useState('');
  const [disposition, setDisposition] = useState<Ql220Disposition>('REOPEN_EXCEPTION_DRAFT');
  const [nextStep, setNextStep] = useState<Ql220NextStep>('MAINTAIN_HOLD_DRAFT');
  const [note, setNote] = useState('');
  const [help, setHelp] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const portfolio = ql220Portfolio(sources, ledger);
  const company = ql220CompanyMonitoring(sources, ledger, organization.id);
  const item = company.cases.find((entry) => entry.scenario === selected) ?? company.cases[0];
  const selectedCategory = category && item?.gaps.some((gap) => gap.category === category) ? category : item?.gaps[0]?.category;

  function change(operation: (previous: Ql220Ledger, scenario: Ql211ScenarioId) => Ql220Ledger) {
    if (item) setLedger((previous) => operation(previous, item.scenario));
  }

  return <section className="ql218-workbench ql220-workbench" data-ql220-release={QL220_RELEASE} data-organization={organization.id} aria-labelledby="ql220-title">
    <header className="ql218-header"><div><p className="ql191-eyebrow">QL-220 · Reopen and owner follow-up · Disabled preview</p>
      <h3 id="ql220-title">Four-company independent-review outcome reopen &amp; closure exception monitoring</h3>
      <p>Track invented reopened outcomes against QL-219, monitor follow-up aging, and prepare an owner-safe audit for future human review.</p></div>
      <button type="button" aria-expanded={help} aria-controls="ql220-help" onClick={() => setHelp((value) => !value)}>ⓘ Reopen audit help</button></header>
    <div className="ql218-warning" role="note"><strong>RELEASE HOLD REMAINS IN FORCE.</strong> All {portfolio.prerequisites.length} QL-181 requirements are HELD_UNVERIFIED. Reopening, review, aging and packet preparation here are browser-session simulations only. No real reviewer is contacted, no actual owner approval is recorded, no case is independently closed, and phone/SMS stay disabled.</div>
    {help && <p className="ql218-help" id="ql220-help">First prepare a current fictional QL-219 packet. Start a local reopen with an invented reason, classify each gap and select an unsent next step. Recurring exceptions require a draft independent-review escalation. Simulated aging reaches overdue at three cycles; refresh the fictional follow-up to clear that simulated overdue status. Acknowledge the three local audit checks to prepare a status-only packet. Source changes freeze this case until explicitly reset, never removing release holds.</p>}
    <div className="ql218-metrics" role="status"><div><small>QL-219 packets eligible</small><strong>{portfolio.eligible}</strong><span>Four-company scope</span></div>
      <div><small>Follow-ups overdue</small><strong>{portfolio.overdue}</strong><span>Simulated 3+ cycles</span></div>
      <div><small>Local audits prepared</small><strong>{portfolio.prepared}</strong><span>Not actual closure</span></div>
      <div><small>Frozen source records</small><strong>{portfolio.stale}</strong><span>Stale or withdrawn</span></div></div>
    <section className="ql218-panel" aria-labelledby="ql220-portfolio"><h4 id="ql220-portfolio">Four-company reopened exception and follow-up register</h4>
      <div className="ql218-scroll"><table><caption>Status-only, simulated browser-session counts; companies cannot edit each other’s cases.</caption>
        <thead><tr><th scope="col">Company</th><th scope="col">Eligible</th><th scope="col">Tracked</th><th scope="col">Undecided</th><th scope="col">Escalation drafts due</th><th scope="col">Overdue</th><th scope="col">Prepared</th><th scope="col">Stale</th><th scope="col">Real release holds</th></tr></thead>
        <tbody>{portfolio.companies.map((row) => <tr key={row.company}><th scope="row">{row.company === 'rosiedazzlers' ? 'Rosie Dazzlers' : row.company === 'devilndove' ? 'Devil n Dove' : row.company === 'icamp' ? 'iCamp' : 'YW · Property Maintenance'}</th>
          <td>{row.eligible}</td><td>{row.tracked}</td><td>{row.undecided}</td><td>{row.escalationsDue}</td><td>{row.overdue}</td><td>{row.prepared}</td><td>{row.stale}</td><td>{row.holdAudit.held}/12 HELD</td></tr>)}</tbody></table></div>
    </section>
    <div className="ql218-grid"><section className="ql218-panel" aria-labelledby="ql220-cases"><h4 id="ql220-cases">{organization.name} · Fictional review cases</h4>
      {company.cases.length === 0 ? <p>No fictional QL-211 finding exists for this company. <button type="button" onClick={() => onNavigate('trial')}>Open owner trial</button></p> :
        <div role="group" aria-label="Select reopened exception case">{company.cases.map((candidate) => <button type="button" key={candidate.scenario}
          className={candidate.scenario === item?.scenario ? 'ql218-case active' : 'ql218-case'} aria-pressed={candidate.scenario === item?.scenario}
          onClick={() => { setSelected(candidate.scenario); setCategory(''); setNote(''); setReopenReason(''); setConfirmReset(false); }}>
          <strong>{candidate.title}</strong><span>{candidate.priority} · {sourceLabels[candidate.sourceStatus]} · {candidate.due} overdue</span></button>)}</div>}
      {company.orphaned > 0 && <p role="alert" className="ql218-warning">{company.orphaned} orphaned local reopen record(s) are frozen, not closed.</p>}
    </section>
    {item && <section className="ql218-panel" aria-labelledby="ql220-selected"><h4 id="ql220-selected">{item.title} · Reopen follow-up audit</h4>
      <p className="ql218-source">Source: <strong>{sourceLabels[item.sourceStatus]}</strong>. Prepared QL-219: <strong>{item.prepared ? 'yes · fictional only' : 'no'}</strong>.</p>
      {!item.eligible && <div className="ql218-warning">Current, locally prepared QL-219 closure-readiness evidence is required. <button type="button" onClick={() => onNavigate('closure')}>Inspect QL-219 source</button></div>}
      {item.eligible && !item.record && <div className="ql218-form"><label htmlFor="ql220-reason">Invented reopen-review reason (8–180 characters)</label>
        <textarea id="ql220-reason" rows={2} maxLength={180} value={reopenReason} onChange={(event) => setReopenReason(event.target.value)} placeholder="Fictional exception reason; no customer names or private evidence." />
        <button type="button" disabled={reopenReason.trim().length < 8} onClick={() => { change((previous, id) => beginQl220Reopen(sources, previous, organization.id, id, reopenReason)); setReopenReason(''); }}>Start local reopen monitoring · NO LIVE ACTION</button></div>}
      {item.record && item.sourceStatus !== 'SOURCE_CURRENT' && <div role="alert" className="ql218-warning"><strong>Local reopen record frozen.</strong> Changes to QL-219 or upstream source prohibit further edits.
        {item.eligible && <><button type="button" aria-expanded={confirmReset} aria-controls="ql220-reset" onClick={() => setConfirmReset((value) => !value)}>Reconcile revised QL-219 source</button>
          {confirmReset && <div id="ql220-reset"><p>Reset only this case’s fictional reopen reason, gap decisions, aging cycles, checklist and prepared packet? Other companies and cases remain unchanged.</p>
            <label htmlFor="ql220-reset-reason">New invented reopen reason</label><textarea id="ql220-reset-reason" rows={2} maxLength={180} value={reopenReason} onChange={(event) => setReopenReason(event.target.value)} />
            <button type="button" disabled={reopenReason.trim().length < 8} onClick={() => { change((previous, id) => beginQl220Reopen(sources, previous, organization.id, id, reopenReason)); setReopenReason(''); setConfirmReset(false); }}>Confirm case-only source reset</button>
            <button type="button" onClick={() => setConfirmReset(false)}>Cancel reset</button></div>}</>}
      </div>}
      {item.record && item.sourceStatus === 'SOURCE_CURRENT' && <>
        <p className="ql220-cycle" role="status">Fictional review cycle: <strong>{item.record.cycle}/12</strong> · Undecided: <strong>{item.undecided}</strong> · Overdue: <strong>{item.due}</strong> · Recurrence escalation drafts due: <strong>{item.escalationGaps}</strong>.</p>
        <section aria-labelledby="ql220-gaps"><h5 id="ql220-gaps">Open exception monitor ({item.gaps.length})</h5>
          {item.gaps.map((gap) => <article className="ql218-gap" key={gap.category}><h6>{gap.category.replaceAll('_', ' ')} · {gap.priority}</h6>
            <p>QL-219 outcome: <strong>{gap.outcome.replaceAll('_', ' ')}</strong> · Recurrence: <strong>{gap.recurrenceCount}</strong>.</p>
            <p>Reopen classification: <strong>{gap.reopenDisposition.replaceAll('_', ' ')}</strong> · Unsent follow-up: <strong>{gap.ownerFollowUp.replaceAll('_', ' ')}</strong>.</p>
            <p>Fictional follow-up age: <strong>{gap.followUpAge === null ? 'NOT TRACKED' : `${gap.followUpAge} cycle(s)`}</strong>{gap.followUpOverdue && <strong className="ql219-due"> OVERDUE · update draft before preparation</strong>}.</p>
            {gap.independentEscalationNeeded && gap.ownerFollowUp !== 'INDEPENDENT_REVIEW_ESCALATION_DRAFT' && <p className="ql219-due">Recurring exception requires a drafted independent-review escalation.</p>}
            <p>Real independent evidence: <strong>UNVERIFIED</strong> · Closure: <strong>BLOCKED</strong>.</p></article>)}
        </section>
        {item.record.phase === 'reopen_monitoring_draft' ? <>
          <div className="ql218-form"><label htmlFor="ql220-gap">Select open evidence gap</label>
            <select id="ql220-gap" value={selectedCategory ?? ''} onChange={(event) => { setCategory(event.target.value as Ql214GapCategory); setNote(''); }}>
              {item.gaps.map((gap) => <option key={gap.category} value={gap.category}>{gap.category.replaceAll('_', ' ')} · recurrence {gap.recurrenceCount}</option>)}</select>
            <label htmlFor="ql220-disposition">Fictional independent-review reopen classification</label>
            <select id="ql220-disposition" value={disposition} onChange={(event) => setDisposition(event.target.value as Ql220Disposition)}>
              <option value="REOPEN_EXCEPTION_DRAFT">Reopen exception for review · draft</option>
              <option value="MONITOR_OPEN_HOLD_DRAFT">Continue monitoring open hold · draft</option>
              <option value="NO_NEW_EVIDENCE_UNVERIFIED">No new evidence · unverified</option></select>
            <label htmlFor="ql220-step">Owner-safe follow-up · unsent</label>
            <select id="ql220-step" value={nextStep} onChange={(event) => setNextStep(event.target.value as Ql220NextStep)}>
              <option value="MAINTAIN_HOLD_DRAFT">Maintain existing release hold</option>
              <option value="OWNER_EVIDENCE_REQUEST_DRAFT">Owner evidence request · draft</option>
              <option value="INDEPENDENT_REVIEW_ESCALATION_DRAFT">Independent-review escalation · draft</option></select>
            <label htmlFor="ql220-note">Fictional exception monitoring note (8–180 characters)</label>
            <textarea id="ql220-note" rows={3} maxLength={180} value={note} onChange={(event) => setNote(event.target.value)} placeholder="Invented circumstances only; never enter customer data or signatures." />
            <button type="button" disabled={!selectedCategory || note.trim().length < 8} onClick={() => { if (selectedCategory) change((previous, id) => recordQl220Exception(sources, previous, organization.id, id, selectedCategory, disposition, nextStep, note)); setNote(''); }}>Record local exception &amp; unsent follow-up</button>
            <button type="button" disabled={item.record.cycle >= 12} onClick={() => change((previous, id) => advanceQl220Cycle(sources, previous, organization.id, id))}>Advance simulated review cycle (+1)</button>
            <small>Three simulated cycles without refreshing an exception draft counts as overdue. No real-world time or notification is used.</small></div>
          <section className="ql219-checklist" aria-labelledby="ql220-checks"><h5 id="ql220-checks">Independent closure exception audit checklist · local-only</h5>
            {QL220_CHECKS.map((check) => <article className="ql219-check" key={check.id}><div><strong>{check.label}</strong><p>{check.description}</p></div>
              <button type="button" disabled={item.record?.checks[check.id] === 'ACKNOWLEDGED_UNVERIFIED'}
                onClick={() => change((previous, id) => acknowledgeQl220Check(sources, previous, organization.id, id, check.id))}>
                {item.record?.checks[check.id] === 'ACKNOWLEDGED_UNVERIFIED' ? 'Acknowledged locally · UNVERIFIED' : 'Acknowledge local audit · UNVERIFIED'}</button></article>)}
          </section>
          <button type="button" disabled={!item.readyForLocalAudit} onClick={() => change((previous, id) => prepareQl220FollowUpAudit(sources, previous, organization.id, id))}>Prepare owner follow-up exception audit · NO CLOSURE</button>
        </> : <p className="ql218-prepared" role="status">Local owner follow-up exception audit prepared. No independent reviewer or owner has authenticated or approved closure, and release remains BLOCKED.</p>}
      </>}
      <div className="ql218-actions"><button type="button" onClick={() => onNavigate('closure')}>Inspect QL-219 readiness</button>
        <button type="button" onClick={() => onNavigate('recurrence')}>Inspect QL-218 recurrence</button></div>
    </section>}</div>
    <section className="ql218-panel" aria-labelledby="ql220-holds"><h4 id="ql220-holds">Read-only real-pilot release holds</h4>
      <p>Expected <strong>{company.holdAudit.expected}</strong> · Observed <strong>{company.holdAudit.observed}</strong> · HELD_UNVERIFIED <strong>{company.holdAudit.held}</strong> · Conditional release <strong>BLOCKED</strong>.</p>
      <div className="ql218-scroll"><table><thead><tr><th scope="col">Prerequisite</th><th scope="col">Real evidence still required</th><th scope="col">Actual state</th></tr></thead>
        <tbody>{portfolio.prerequisites.map((hold) => <tr key={hold.id}><th scope="row">{hold.title}</th><td>{hold.requiredBeforePilot}</td><td>{hold.state}</td></tr>)}</tbody></table></div>
    </section>
    <section className="ql218-panel" aria-labelledby="ql220-receipt-title"><h4 id="ql220-receipt-title">Redacted, status-only reopen and owner follow-up receipt</h4>
      <button type="button" aria-expanded={showReceipt} aria-controls="ql220-receipt" onClick={() => setShowReceipt((value) => !value)}>{showReceipt ? 'Hide' : 'Show'} local QL-220 audit receipt</button>
      {showReceipt && <div id="ql220-receipt"><p>No free-text reasons, notes, source tokens, reviewer identities or customer details.</p>
        <textarea readOnly rows={15} aria-label="Fixture-only QL-220 reopen audit receipt" value={ql220CompanyReceipt(sources, ledger, organization.id)} /></div>}
    </section>
    <p className="ql218-foot">Production GREEN means software deployed, not a real independent closure or live phone/SMS pilot approval.</p>
  </section>;
}

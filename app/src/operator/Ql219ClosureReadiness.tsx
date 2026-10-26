import { useState, type Dispatch, type SetStateAction } from 'react';
import type { OperatorOrganization, OperatorWorkspace } from './ql191Organizations';
import type { Ql211ScenarioId } from './ql211OwnerTrial';
import type { Ql214GapCategory } from './ql214ReviewIntake';
import { QL219_RELEASE, QL219_REVIEW_CHECKS, ql219CompanyReconciliation, ql219Portfolio,
  ql219CompanyReceipt, beginQl219Reconciliation, recordQl219Outcome,
  acknowledgeQl219Check, prepareQl219Review,
  type Ql219Ledger, type Ql219Sources, type Ql219Outcome, type Ql219FollowUp } from './ql219OutcomeReconciliation';
import './ql219-closure-readiness.css';

const sourceLabels: Record<string, string> = {
  AWAITING_PREPARED_FOLLOWUP: 'Awaiting local QL-218 prepared hold audit',
  SOURCE_CURRENT: 'QL-218 prepared source matches',
  RECURRENCE_SOURCE_REVISED: 'FROZEN · QL-218 recurrence source revised',
  UPSTREAM_STALE: 'FROZEN · upstream evidence is stale'
};

export function Ql219ClosureReadiness({ organization, sources, ledger, setLedger, onNavigate }: {
  organization: OperatorOrganization;
  sources: Ql219Sources;
  ledger: Ql219Ledger;
  setLedger: Dispatch<SetStateAction<Ql219Ledger>>;
  onNavigate: (workspace: OperatorWorkspace) => void;
}) {
  const [selected, setSelected] = useState<Ql211ScenarioId | null>(null);
  const [category, setCategory] = useState<Ql214GapCategory | ''>('');
  const [outcome, setOutcome] = useState<Ql219Outcome>('OPEN_EXCEPTION_RECONFIRMED');
  const [followUp, setFollowUp] = useState<Ql219FollowUp>('MAINTAIN_HOLD_DRAFT');
  const [note, setNote] = useState('');
  const [help, setHelp] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const portfolio = ql219Portfolio(sources, ledger);
  const company = ql219CompanyReconciliation(sources, ledger, organization.id);
  const item = company.cases.find((candidate) => candidate.scenario === selected) ?? company.cases[0];
  const selectedCategory = category && item?.gaps.some((gap) => gap.category === category) ? category : item?.gaps[0]?.category;

  function change(operation: (previous: Ql219Ledger, id: Ql211ScenarioId) => Ql219Ledger) {
    if (item) setLedger((previous) => operation(previous, item.scenario));
  }

  return <section className="ql218-workbench ql219-workbench" data-ql219-release={QL219_RELEASE} data-organization={organization.id} aria-labelledby="ql219-title">
    <header className="ql218-header"><div><p className="ql191-eyebrow">QL-219 · Outcome reconciliation · Disabled preview</p>
      <h3 id="ql219-title">Four-company recurrence outcomes &amp; independent closure readiness</h3>
      <p>Compare prepared fictional QL-218 follow-up, document each still-open outcome, and organize a packet for future independent human inspection.</p></div>
      <button type="button" aria-expanded={help} aria-controls="ql219-help" onClick={() => setHelp((open) => !open)}>ⓘ Closure readiness help</button></header>
    <div className="ql218-warning" role="note"><strong>NO ACTUAL CLOSURE OR RELEASE.</strong> All {portfolio.prerequisites.length} QL-181 requirements remain HELD_UNVERIFIED. A local readiness packet never verifies source evidence, authenticates a reviewer, approves an owner, lifts a hold, transmits a packet, or sends phone/SMS messages.</div>
    {help && <p className="ql218-help" id="ql219-help">Prepare QL-218 with a current QL-217 reassessment. Record a fictional outcome and unsent follow-up for every open evidence gap. Recurring exceptions require a draft independent-review escalation. Explicitly acknowledge all three local checklist items, then prepare a status-only human-review packet. No independent closure is issued. If the QL-218 source changes, this local record freezes until an explicit case-only reset.</p>}
    <div className="ql218-metrics" role="status"><div><small>Eligible prepared QL-218 cases</small><strong>{portfolio.eligible}</strong><span>Four-company scope</span></div>
      <div><small>Recurrence escalations due</small><strong>{portfolio.recurrenceEscalationDue}</strong><span>Invented follow-up</span></div>
      <div><small>Local packets prepared</small><strong>{portfolio.prepared}</strong><span>Not actual closure</span></div>
      <div><small>Stale outcome records</small><strong>{portfolio.stale}</strong><span>Source comparison</span></div></div>
    <section className="ql218-panel" aria-labelledby="ql219-portfolio-title"><h4 id="ql219-portfolio-title">Four-company outcome reconciliation</h4>
      <div className="ql218-scroll"><table><caption>Only browser-session fictional counts are compared. No customer notes, actual decisions or approval credentials are shared.</caption>
        <thead><tr><th scope="col">Company</th><th scope="col">Eligible</th><th scope="col">Tracked</th><th scope="col">Open outcomes</th><th scope="col">Escalation due</th><th scope="col">Prepared</th><th scope="col">Stale</th><th scope="col">Release holds</th></tr></thead>
        <tbody>{portfolio.companies.map((row) => <tr key={row.company}><th scope="row">{row.company === 'rosiedazzlers' ? 'Rosie Dazzlers' : row.company === 'devilndove' ? 'Devil n Dove' : row.company === 'icamp' ? 'iCamp' : 'YW · Property Maintenance'}</th>
          <td>{row.eligible}</td><td>{row.tracking}</td><td>{row.unresolvedOutcomes}</td><td>{row.recurrenceEscalationDue}</td><td>{row.prepared}</td><td>{row.stale}</td><td>{row.holdAudit.held}/12 HELD</td></tr>)}</tbody></table></div>
    </section>
    <div className="ql218-grid"><section className="ql218-panel" aria-labelledby="ql219-cases-title"><h4 id="ql219-cases-title">{organization.name} · Open owner cases</h4>
      {company.cases.length === 0 ? <p>No QL-211 fictional finding exists for this organization. No outcomes or independent approval are fabricated. <button type="button" onClick={() => onNavigate('trial')}>Open owner trial</button></p> :
        <div role="group" aria-label="Select closure readiness case">{company.cases.map((candidate) => <button type="button" key={candidate.scenario} className={candidate.scenario === item?.scenario ? 'ql218-case active' : 'ql218-case'} aria-pressed={candidate.scenario === item?.scenario}
          onClick={() => { setSelected(candidate.scenario); setCategory(''); setNote(''); setConfirmReset(false); }}>
          <strong>{candidate.title}</strong><span>{candidate.priority} · {sourceLabels[candidate.sourceStatus]} · {candidate.unresolvedOutcomes} unresolved outcome(s)</span></button>)}</div>}
      {company.orphaned > 0 && <p role="alert" className="ql218-warning">{company.orphaned} removed source case(s) have orphaned local outcome records, never independent closure.</p>}
    </section>
    {item && <section className="ql218-panel" aria-labelledby="ql219-selected-title"><h4 id="ql219-selected-title">{item.title} · Outcome and readiness review</h4>
      <p className="ql218-source">Source: <strong>{sourceLabels[item.sourceStatus]}</strong>. Prepared QL-218: <strong>{item.preparedFollowUp ? 'yes · fictional only' : 'no'}</strong>.</p>
      {!item.eligible && <div className="ql218-warning">This case requires a current and locally prepared QL-218 recurrence hold audit. <button type="button" onClick={() => onNavigate('recurrence')}>Inspect QL-218 source</button></div>}
      {item.eligible && !item.record && <button type="button" onClick={() => change((previous, id) => beginQl219Reconciliation(sources, previous, organization.id, id))}>Begin fictional outcome reconciliation</button>}
      {item.record && item.sourceStatus !== 'SOURCE_CURRENT' && <div className="ql218-warning" role="alert"><strong>Outcome record frozen.</strong> Its QL-218 evidence is revised or no longer current, so old outcome claims cannot advance.
        {item.eligible && <><button type="button" aria-expanded={confirmReset} aria-controls="ql219-reset" onClick={() => setConfirmReset((open) => !open)}>Reconcile changed QL-218 source</button>
          {confirmReset && <div id="ql219-reset"><p>Discard only this case’s invented outcomes, acknowledgments and prepared packet to restart with the new QL-218 baseline? Other companies and cases remain unchanged.</p>
            <button type="button" onClick={() => { change((previous, id) => beginQl219Reconciliation(sources, previous, organization.id, id)); setConfirmReset(false); setNote(''); }}>Confirm new local source baseline</button>
            <button type="button" onClick={() => setConfirmReset(false)}>Cancel</button></div>}</>}
      </div>}
      {item.record && item.sourceStatus === 'SOURCE_CURRENT' && <>
        <section aria-labelledby="ql219-gap-title"><h5 id="ql219-gap-title">Open evidence gap outcome comparison ({item.gaps.length})</h5>
          {item.gaps.map((gap) => <article className="ql218-gap" key={gap.category}><h6>{gap.category.replaceAll('_', ' ')} · {gap.priority}</h6>
            <p>QL-218 recurrence count: <strong>{gap.recurrenceCount}</strong> · QL-218 follow-up: {gap.followUp.replaceAll('_', ' ')}.</p>
            <p>Current fictional outcome: <strong>{gap.outcome.replaceAll('_', ' ')}</strong> · Next step: <strong>{gap.closureFollowUp.replaceAll('_', ' ')}</strong>.</p>
            {gap.requiresIndependentEscalation && gap.closureFollowUp !== 'INDEPENDENT_REVIEW_REQUIRED_DRAFT' && <p className="ql219-due">Repeat exception: draft independent-review escalation before packet preparation.</p>}
            <p>Independent evidence: <strong>UNVERIFIED</strong> · Real closure: <strong>NOT AUTHORIZED</strong>.</p></article>)}
        </section>
        {item.record.phase === 'outcome_reconciliation_draft' ? <>
          <div className="ql218-form"><label htmlFor="ql219-gap">Select open evidence gap</label>
            <select id="ql219-gap" value={selectedCategory ?? ''} onChange={(event) => { setCategory(event.target.value as Ql214GapCategory); setNote(''); }}>
              {item.gaps.map((gap) => <option key={gap.category} value={gap.category}>{gap.category.replaceAll('_', ' ')} · recurrence {gap.recurrenceCount}</option>)}</select>
            <label htmlFor="ql219-outcome">Fictional follow-up outcome</label>
            <select id="ql219-outcome" value={outcome} onChange={(event) => setOutcome(event.target.value as Ql219Outcome)}>
              <option value="OPEN_EXCEPTION_RECONFIRMED">Open exception reconfirmed · simulated</option>
              <option value="SOURCE_EVIDENCE_STILL_MISSING">Source evidence missing · simulated</option>
              <option value="FICTIONAL_COMPARISON_STABLE_UNVERIFIED">Fictional comparison stable · not independently verified</option></select>
            <label htmlFor="ql219-followup">Owner-safe conditional hold next step · unsent</label>
            <select id="ql219-followup" value={followUp} onChange={(event) => setFollowUp(event.target.value as Ql219FollowUp)}>
              <option value="MAINTAIN_HOLD_DRAFT">Maintain hold, no approval</option>
              <option value="REQUEST_NEW_EVIDENCE_DRAFT">Request new source evidence · draft only</option>
              <option value="INDEPENDENT_REVIEW_REQUIRED_DRAFT">Independent review required · draft only</option></select>
            <label htmlFor="ql219-note">Fictional reconciliation note (8–180 characters)</label>
            <textarea id="ql219-note" rows={3} maxLength={180} value={note} onChange={(event) => setNote(event.target.value)} placeholder="Use only invented descriptions; never enter personal details or real customer records." />
            <button type="button" disabled={!selectedCategory || note.trim().length < 8} onClick={() => {
              if (selectedCategory) change((previous, id) => recordQl219Outcome(sources, previous, organization.id, id, selectedCategory, outcome, followUp, note));
              setNote(''); }}>Save fictional outcome &amp; next step · NO DISPATCH</button>
            <small>Reconciled means locally classified, not independently closed or verified. Recurring gaps require an independent-review draft.</small></div>
          <section className="ql219-checklist" aria-labelledby="ql219-checks-title"><h5 id="ql219-checks-title">Independent closure readiness checklist · local acknowledgment only</h5>
            {QL219_REVIEW_CHECKS.map((check) => <article className="ql219-check" key={check.id}><div><strong>{check.title}</strong><p>{check.detail}</p></div>
              <button type="button" disabled={item.record?.reviewChecks[check.id] === 'ACKNOWLEDGED_UNVERIFIED'} onClick={() => change((previous, id) => acknowledgeQl219Check(sources, previous, organization.id, id, check.id))}>
                {item.record?.reviewChecks[check.id] === 'ACKNOWLEDGED_UNVERIFIED' ? 'Reviewed locally · UNVERIFIED' : 'Acknowledge local review · UNVERIFIED'}</button></article>)}
          </section>
          <button type="button" disabled={!item.readyForHumanInspection} onClick={() => change((previous, id) => prepareQl219Review(sources, previous, organization.id, id))}>Prepare independent-review readiness packet · NO CLOSURE</button>
          <p>Unreconciled outcomes: <strong>{item.unresolvedOutcomes}</strong> · Recurrence escalations needing draft: <strong>{item.recurrenceEscalationDue}</strong> · Checklist: <strong>{item.reviewChecksComplete ? 'reviewed locally' : 'incomplete'}</strong>.</p>
        </> : <p className="ql218-prepared" role="status">Independent-review readiness packet locally prepared. Actual closure and release remain BLOCKED and unverified.</p>}
      </>}
      <div className="ql218-actions"><button type="button" onClick={() => onNavigate('recurrence')}>Inspect QL-218 recurrence</button>
        <button type="button" onClick={() => onNavigate('reassessment')}>Inspect QL-217 reassessment</button></div>
    </section>}</div>
    <section className="ql218-panel" aria-labelledby="ql219-holds-title"><h4 id="ql219-holds-title">Read-only real-pilot closure and conditional release hold audit</h4>
      <p>Expected <strong>{company.holdAudit.expected}</strong> · Observed <strong>{company.holdAudit.observed}</strong> · HELD_UNVERIFIED <strong>{company.holdAudit.held}</strong> · Conditional release <strong>BLOCKED</strong>.</p>
      <div className="ql218-scroll"><table><thead><tr><th scope="col">QL-181 prerequisite</th><th scope="col">Real independent evidence required</th><th scope="col">Actual state</th></tr></thead>
        <tbody>{portfolio.prerequisites.map((hold) => <tr key={hold.id}><th scope="row">{hold.title}</th><td>{hold.requiredBeforePilot}</td><td>{hold.state}</td></tr>)}</tbody></table></div>
    </section>
    <section className="ql218-panel" aria-labelledby="ql219-receipt-title"><h4 id="ql219-receipt-title">PII-minimized outcome readiness receipt</h4>
      <button type="button" aria-expanded={showReceipt} aria-controls="ql219-receipt" onClick={() => setShowReceipt((open) => !open)}>{showReceipt ? 'Hide' : 'Show'} local closure-readiness receipt</button>
      {showReceipt && <div id="ql219-receipt"><p>Fixed status codes only; no reviewer identity, customer data, private source tokens, free-text notes or real approval claims.</p>
        <textarea readOnly rows={15} aria-label="Fixture-only QL-219 readiness receipt" value={ql219CompanyReceipt(sources, ledger, organization.id)} /></div>}
    </section>
    <p className="ql218-foot">Production GREEN is a software release status only. Real independent review, explicit owner authorization and every QL-181 pilot prerequisite remain outstanding.</p>
  </section>;
}

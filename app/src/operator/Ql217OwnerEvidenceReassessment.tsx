import { useState, type Dispatch, type SetStateAction } from 'react';
import type { OperatorOrganization, OperatorWorkspace } from './ql191Organizations';
import type { Ql211Ledger, Ql211ScenarioId } from './ql211OwnerTrial';
import type { Ql212Ledger } from './ql212RepairQueue';
import type { Ql213Ledger } from './ql213ReviewPreparation';
import type { Ql214GapCategory, Ql214Ledger } from './ql214ReviewIntake';
import type { Ql215Ledger } from './ql215FollowUpAudit';
import type { Ql216Ledger } from './ql216EscalationHandoff';
import { QL217_RELEASE, ql217Portfolio, ql217CompanyReassessment, ql217CompanyReceipt,
  beginQl217Reassessment, advanceQl217DecisionCycle, noteQl217EvidenceReassessment,
  prepareQl217Reassessment, type Ql217EvidenceAction, type Ql217Ledger } from './ql217OwnerReassessment';
import './ql217-owner-evidence-reassessment.css';

const sources: Record<string, string> = {
  AWAITING_PREPARED_HANDOFF: 'Awaiting local QL-216 handoff', SOURCE_CURRENT: 'QL-216 handoff matches',
  HANDOFF_CHANGED: 'FROZEN · QL-216 handoff changed', UPSTREAM_STALE: 'FROZEN · upstream review no longer current'
};
const ages: Record<string, string> = {
  CURRENT_CYCLE: 'Reviewed this fictional cycle', FOLLOWUP_WATCH: 'Watch · unresolved decision aging',
  DECISION_REASSESSMENT_DUE: 'Reassessment due · fictional interval'
};

export function Ql217OwnerEvidenceReassessment({ organization, trial, repair, review, intake, audit,
  handoff, ledger, setLedger, onNavigate }: {
  organization: OperatorOrganization;
  trial: Ql211Ledger;
  repair: Ql212Ledger;
  review: Ql213Ledger;
  intake: Ql214Ledger;
  audit: Ql215Ledger;
  handoff: Ql216Ledger;
  ledger: Ql217Ledger;
  setLedger: Dispatch<SetStateAction<Ql217Ledger>>;
  onNavigate: (workspace: OperatorWorkspace) => void;
}) {
  const [selected, setSelected] = useState<Ql211ScenarioId | null>(null);
  const [category, setCategory] = useState<Ql214GapCategory | ''>('');
  const [action, setAction] = useState<Ql217EvidenceAction>('SOURCE_RECHECK_DRAFTED');
  const [note, setNote] = useState('');
  const [help, setHelp] = useState(false);
  const [confirmRefresh, setConfirmRefresh] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const portfolio = ql217Portfolio(trial, repair, review, intake, audit, handoff, ledger);
  const company = ql217CompanyReassessment(trial, repair, review, intake, audit, handoff, ledger, organization.id);
  const item = company.cases.find((candidate) => candidate.scenario === selected) ?? company.cases[0];
  const selectedCategory = category && item?.gaps.some((gap) => gap.category === category) ? category : item?.gaps[0]?.category;

  function change(operation: (previous: Ql217Ledger, id: Ql211ScenarioId) => Ql217Ledger) {
    if (item) setLedger((previous) => operation(previous, item.scenario));
  }

  return <section className="ql217-workbench" data-ql217-release={QL217_RELEASE} data-organization={organization.id} aria-labelledby="ql217-title">
    <header className="ql217-header"><div><p className="ql191-eyebrow">QL-217 · Owner handoff reconciliation · Disabled preview</p>
      <h3 id="ql217-title">Four-company owner decision aging &amp; independent-evidence reassessment</h3>
      <p>Review current fictional QL-216 handoffs, age unresolved decisions, and prepare source-linked reassessment notes.</p></div>
      <button type="button" aria-expanded={help} aria-controls="ql217-help" onClick={() => setHelp((open) => !open)}>ⓘ Reassessment help</button></header>
    <div className="ql217-warning" role="note"><strong>CONDITIONAL RELEASE HELD.</strong> All {portfolio.prerequisites.length} real-pilot prerequisites remain HELD_UNVERIFIED. Simulated cycles are not calendar days or alerts. Local reassessment does not prove real evidence, authenticate a reviewer, approve an owner, dispatch a packet, or send calls/SMS. Never enter real customer data.</div>
    {help && <p id="ql217-help" className="ql217-help">Start with a prepared QL-216 fictional owner-safe packet. QL-217 compares its source, then permits explicit simulated decision cycles: P0/P1 evidence decisions become due after three unattended cycles; P2/P3 after five. A fictional gap reassessment note resets that gap's aging clock but never resolves it. Every gap needs a fictional plan before local preparation. Changing QL-216 or its upstream source freezes the old record.</p>}
    <div className="ql217-metrics" role="status"><div><small>Prepared QL-216 handoffs</small><strong>{portfolio.eligible}</strong><span>Four-company scope</span></div>
      <div><small>Local reassessments prepared</small><strong>{portfolio.prepared}</strong><span>No reviewer approval</span></div>
      <div><small>Decisions due · simulated</small><strong>{portfolio.decisionDue}</strong><span>Explicit cycles only</span></div>
      <div><small>Stale reassessments</small><strong>{portfolio.stale}</strong><span>Source reconciliation</span></div></div>
    <section className="ql217-panel" aria-labelledby="ql217-portfolio-title"><h4 id="ql217-portfolio-title">Four-company handoff reconciliation</h4>
      <div className="ql217-scroll"><table><caption>Company counts are browser-session fictional records. No cross-company contact data or release approval is shared.</caption>
        <thead><tr><th scope="col">Company</th><th scope="col">Eligible</th><th scope="col">Tracked</th><th scope="col">Decision due</th><th scope="col">Prepared</th><th scope="col">Stale</th><th scope="col">Holds</th></tr></thead>
        <tbody>{portfolio.companies.map((row) => <tr key={row.company}><th scope="row">{row.company === 'rosiedazzlers' ? 'Rosie Dazzlers' : row.company === 'devilndove' ? 'Devil n Dove' : row.company === 'icamp' ? 'iCamp' : 'YW · Property Maintenance'}</th>
          <td>{row.eligible}</td><td>{row.tracking}</td><td>{row.decisionDue}</td><td>{row.prepared}</td><td>{row.stale}</td><td>{row.holdAudit.held}/12 HELD</td></tr>)}</tbody></table></div>
    </section>
    <div className="ql217-grid"><section className="ql217-panel" aria-labelledby="ql217-case-list-title"><h4 id="ql217-case-list-title">{organization.name} · Open scenarios</h4>
      {company.cases.length === 0 ? <p>No QL-211 observed finding exists in this session. No owner decision or independent reassessment is fabricated. <button type="button" onClick={() => onNavigate('trial')}>Open fictional owner trial</button></p> :
        <div role="group" aria-label="Choose owner reassessment case">{company.cases.map((candidate) => <button type="button" key={candidate.scenario}
          aria-pressed={candidate.scenario === item?.scenario} className={candidate.scenario === item?.scenario ? 'ql217-case active' : 'ql217-case'}
          onClick={() => { setSelected(candidate.scenario); setCategory(''); setNote(''); setConfirmRefresh(false); }}>
          <strong>{candidate.title}</strong><span>{candidate.priority} · {candidate.eligible ? 'Prepared QL-216 source' : 'Awaiting current handoff'} · {sources[candidate.sourceStatus]}</span></button>)}</div>}
      {company.orphaned > 0 && <div className="ql217-warning" role="alert">{company.orphaned} removed upstream scenario(s) still have stale local reassessment records. No closure was verified.</div>}
    </section>
    {item && <section className="ql217-panel" aria-labelledby="ql217-case-title"><h4 id="ql217-case-title">{item.title} · Decision and evidence audit</h4>
      <p className="ql217-source">QL-217 source reconciliation: <strong>{sources[item.sourceStatus]}</strong>.</p>
      <p>QL-216 phase: <strong>{item.packet?.phase.replaceAll('_', ' ') ?? 'not prepared'}</strong> · QL-216 escalations due: <strong>{item.replayDue}</strong>.</p>
      {!item.eligible && <div className="ql217-warning">A current, locally prepared QL-216 packet is required. An upstream change invalidates prior drafts; no independent reviewer has signed anything.
        <button type="button" onClick={() => onNavigate('handoff')}>Open QL-216 handoff</button></div>}
      {item.eligible && !item.record && <button type="button" className="ql217-primary" onClick={() => change((previous, id) => beginQl217Reassessment(trial, repair, review, intake, audit, handoff, previous, organization.id, id))}>Start fictional owner reassessment</button>}
      {item.record && item.sourceStatus !== 'SOURCE_CURRENT' && <div className="ql217-warning" role="alert"><strong>Reassessment frozen.</strong> The QL-216 packet or its upstream evidence changed; prior age and evidence decisions cannot be treated as current.
        {item.eligible && <><button type="button" aria-expanded={confirmRefresh} aria-controls="ql217-refresh" onClick={() => setConfirmRefresh((open) => !open)}>Reconcile changed source</button>
          {confirmRefresh && <div id="ql217-refresh"><p>Discard this case’s simulated cycle and fictional reassessment notes? Other cases and companies remain unchanged.</p>
            <button type="button" onClick={() => { change((previous, id) => beginQl217Reassessment(trial, repair, review, intake, audit, handoff, previous, organization.id, id)); setConfirmRefresh(false); setNote(''); }}>Confirm new source baseline</button>
            <button type="button" onClick={() => setConfirmRefresh(false)}>Cancel</button></div>}</>}
      </div>}
      {item.record && item.sourceStatus === 'SOURCE_CURRENT' && <>
        <div className="ql217-cycle"><h5>Explicit fictional decision-aging clock</h5>
          <p>Decision cycle <strong>{item.cycle}</strong> of 20. No real dates, timers or reminders.</p>
          <button type="button" disabled={item.cycle >= 20} onClick={() => change((previous, id) => advanceQl217DecisionCycle(trial, repair, review, intake, audit, handoff, previous, organization.id, id))}>Advance simulated decision cycle (+1)</button></div>
        <section aria-labelledby="ql217-gaps-title"><h5 id="ql217-gaps-title">Independent evidence gaps remain open ({item.gaps.length})</h5>
          {item.gaps.map((gap) => <article className="ql217-gap" key={gap.category}><h6>{gap.category.replaceAll('_', ' ')} · {gap.priority}</h6>
            <p>QL-214 source follow-up: {gap.followUp.replaceAll('_', ' ')}. Local QL-217 decision: <strong>{gap.decisionAction.replaceAll('_', ' ')}</strong>.</p>
            <p>Decision age: <strong>{ages[gap.decisionAge]}</strong> · last fictional reassessment cycle {gap.lastDecisionCycle}. <strong>Independent evidence remains unverified.</strong></p></article>)}
        </section>
        {item.record.phase === 'local_reassessment_draft' ? <div className="ql217-form"><label htmlFor="ql217-gap">Select unresolved evidence gap</label>
          <select id="ql217-gap" value={selectedCategory ?? ''} onChange={(event) => { setCategory(event.target.value as Ql214GapCategory); setNote(''); }}>
            {item.gaps.map((gap) => <option key={gap.category} value={gap.category}>{gap.category.replaceAll('_', ' ')} · {gap.priority}</option>)}</select>
          <label htmlFor="ql217-action">Fictional independent-evidence reassessment plan</label>
          <select id="ql217-action" value={action} onChange={(event) => setAction(event.target.value as Ql217EvidenceAction)}>
            <option value="SOURCE_RECHECK_DRAFTED">Source recheck drafted</option><option value="INDEPENDENT_RETEST_PLANNED">Independent retest planned (unsent)</option>
            <option value="COMPARISON_REPLAY_NOTED_UNVERIFIED">Comparison replay noted · unverified</option></select>
          <label htmlFor="ql217-note">Fictional decision note (8–180 characters)</label>
          <textarea id="ql217-note" rows={3} maxLength={180} value={note} onChange={(event) => setNote(event.target.value)} placeholder="Describe a fabricated reassessment need, never personal/customer information." />
          <button type="button" disabled={!selectedCategory || note.trim().length < 8} onClick={() => {
            if (selectedCategory) change((previous, id) => noteQl217EvidenceReassessment(trial, repair, review, intake, audit, handoff, previous, organization.id, id, selectedCategory, action, note));
            setNote(''); }}>Save fictional evidence decision · NO DISPATCH</button>
          <button type="button" disabled={item.gaps.length === 0 || item.gaps.some((gap) => gap.decisionAction === 'NOT_REASSESSED')}
            onClick={() => change((previous, id) => prepareQl217Reassessment(trial, repair, review, intake, audit, handoff, previous, organization.id, id))}>Prepare local reassessment packet · NO DISPATCH</button>
          <small>All evidence gaps need an unsent fictional action before local preparation. A saved action never verifies or closes a gap.</small>
        </div> : <p className="ql217-prepared" role="status">Local evidence reassessment prepared for future human inspection only. Actual independent review and live-pilot approval are still held.</p>}
      </>}
      <div className="ql217-actions"><button type="button" onClick={() => onNavigate('handoff')}>Inspect QL-216 source packet</button>
        <button type="button" onClick={() => onNavigate('audit')}>Inspect QL-215 aging</button></div>
    </section>}</div>
    <section className="ql217-panel" aria-labelledby="ql217-holds-title"><h4 id="ql217-holds-title">Read-only release hold and independent verification audit</h4>
      <p>Expected <strong>{company.holdAudit.expected}</strong> · Observed <strong>{company.holdAudit.observed}</strong> · Unverified <strong>{company.holdAudit.held}</strong>. Conditional release: <strong>BLOCKED</strong>.</p>
      <div className="ql217-scroll"><table><thead><tr><th scope="col">QL-181 prerequisite</th><th scope="col">Verification required before pilot</th><th scope="col">Actual status</th></tr></thead>
        <tbody>{portfolio.prerequisites.map((hold) => <tr key={hold.id}><th scope="row">{hold.title}</th><td>{hold.requiredBeforePilot}</td><td>HELD_UNVERIFIED</td></tr>)}</tbody></table></div>
    </section>
    <section className="ql217-panel" aria-labelledby="ql217-receipt-title"><h4 id="ql217-receipt-title">Fixed-schema local reassessment receipt</h4>
      <button type="button" aria-expanded={showReceipt} aria-controls="ql217-receipt" onClick={() => setShowReceipt((open) => !open)}>{showReceipt ? 'Hide' : 'Show'} PII-minimized reassessment receipt</button>
      {showReceipt && <div id="ql217-receipt"><p>Status codes only; no free-text decision notes, source tokens, reviewer identity or customer data.</p>
        <textarea aria-label="Fixture-only owner reassessment audit receipt" readOnly rows={14} value={ql217CompanyReceipt(trial, repair, review, intake, audit, handoff, ledger, organization.id)} /></div>}
    </section>
    <p className="ql217-foot">QL-217 cannot contact reviewers or owners, prove independent test results, remove a release hold or enable a live provider. A production GREEN software release does not authorize pilot communications.</p>
  </section>;
}

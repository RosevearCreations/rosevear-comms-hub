import { useState, type Dispatch, type SetStateAction } from 'react';
import type { OperatorOrganization, OperatorWorkspace } from './ql191Organizations';
import type { Ql211Ledger, Ql211ScenarioId } from './ql211OwnerTrial';
import type { Ql212Ledger } from './ql212RepairQueue';
import type { Ql213Ledger } from './ql213ReviewPreparation';
import type { Ql214GapCategory, Ql214Ledger } from './ql214ReviewIntake';
import { QL215_RELEASE, beginQl215Tracking, advanceQl215Cycle, noteQl215FollowUp,
  ql215CompanyAudit, ql215Portfolio, ql215CompanyReceipt, type Ql215Ledger, type Ql215FollowUpAction } from './ql215FollowUpAudit';
import './ql215-followup-hold-audit.css';

const ages: Record<string, string> = {
  CURRENT_CYCLE: 'Current review cycle', WATCH_CYCLES: 'Watch: follow-up aging',
  ESCALATION_REVIEW_DUE: 'Escalation review due · fictional'
};
const sources: Record<string, string> = {
  AWAITING_PREPARED_INTAKE: 'Awaiting QL-214 local handoff', SOURCE_CURRENT: 'Source matched · preview only',
  SOURCE_CHANGED: 'STALE: QL-214 source revised', UPSTREAM_STALE: 'STALE: upstream evidence changed'
};

export function Ql215FollowUpAgingHoldAudit({ organization, trial, repair, review, intake, ledger, setLedger, onNavigate }: {
  organization: OperatorOrganization;
  trial: Ql211Ledger;
  repair: Ql212Ledger;
  review: Ql213Ledger;
  intake: Ql214Ledger;
  ledger: Ql215Ledger;
  setLedger: Dispatch<SetStateAction<Ql215Ledger>>;
  onNavigate: (workspace: OperatorWorkspace) => void;
}) {
  const [selected, setSelected] = useState<Ql211ScenarioId | null>(null);
  const [confirmRefresh, setConfirmRefresh] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [category, setCategory] = useState<Ql214GapCategory | ''>('');
  const [action, setAction] = useState<Ql215FollowUpAction>('FOLLOWUP_DRAFTED');
  const [note, setNote] = useState('');
  const portfolio = ql215Portfolio(trial, repair, review, intake, ledger);
  const company = ql215CompanyAudit(trial, repair, review, intake, ledger, organization.id);
  const item = company.cases.find((entry) => entry.scenario === selected) ?? company.cases[0];
  const selectedCategory = category && item?.gaps.some((gap) => gap.category === category) ? category : item?.gaps[0]?.category;

  function change(operation: (previous: Ql215Ledger, id: Ql211ScenarioId) => Ql215Ledger) {
    if (item) setLedger((previous) => operation(previous, item.scenario));
  }

  return <section className="ql215-audit" aria-labelledby="ql215-title" data-ql215-release={QL215_RELEASE} data-organization={organization.id}>
    <header className="ql215-header"><div><p className="ql191-eyebrow">QL-215 · Reviewer gap follow-up, disabled preview</p>
      <h3 id="ql215-title">Four-company follow-up aging &amp; release hold continuity audit</h3>
      <p>Track fictional review cycles, reconcile the QL-214 source, and inspect unchanged real-pilot holds.</p></div>
      <button type="button" aria-expanded={showHelp} aria-controls="ql215-help" onClick={() => setShowHelp((open) => !open)}>ⓘ Audit help</button>
    </header>
    <p className="ql215-warning" role="note"><strong>LIVE PILOT HELD.</strong> These are simulated review cycles, not elapsed calendar days, scheduled reminders, independent reviews or actual repair evidence. No message, call, notification, carrier action, approval or backend write occurs. All {portfolio.heldPrerequisites.length} QL-181 release prerequisites remain HELD_UNVERIFIED; notes must contain fictional examples only.</p>
    {showHelp && <p id="ql215-help" className="ql215-help">Finish a fictional QL-211 → QL-214 case, including a QL-214 locally prepared handoff, before starting QL-215 tracking. Each click of “Advance simulated review cycle” represents one invented review interval. Priority P0/P1 gaps request an escalation review after three unattended cycles, P2/P3 after five. Logging a fictional follow-up resets the interval counter but does not resolve the gap. Upstream source changes freeze this audit until a confirmed local reset.</p>}
    <div className="ql215-metrics" role="status"><div><small>Tracked cases</small><strong>{portfolio.tracked}</strong><span>Across four companies</span></div>
      <div><small>Escalation review due</small><strong>{portfolio.escalations}</strong><span>Simulated intervals only</span></div>
      <div><small>Stale audit drafts</small><strong>{portfolio.stale}</strong><span>Source/version reconciliation</span></div>
      <div><small>Live-pilot holds</small><strong className="ql215-held">12 HELD</strong><span>No independent sign-off</span></div></div>
    <section className="ql215-panel" aria-labelledby="ql215-coverage-title"><h4 id="ql215-coverage-title">Company-level source reconciliation</h4>
      <div className="ql215-scroll"><table><caption>All figures are fictional browser-session review activity. Production readiness does not lift policy holds.</caption>
        <thead><tr><th scope="col">Company</th><th scope="col">Findings</th><th scope="col">Tracked</th><th scope="col">Escalation due</th><th scope="col">Stale</th><th scope="col">Policy audit</th></tr></thead>
        <tbody>{portfolio.companies.map((row) => <tr key={row.company}><th scope="row">{row.company === 'rosiedazzlers' ? 'Rosie Dazzlers' : row.company === 'devilndove' ? 'Devil n Dove' : row.company === 'icamp' ? 'iCamp' : 'YW · Property Maintenance'}</th>
          <td>{row.openFindings}</td><td>{row.tracked}</td><td>{row.escalations}</td><td>{row.stale}</td><td>{row.holdAudit.held}/{row.holdAudit.expected} HELD</td></tr>)}</tbody>
      </table></div>
    </section>
    <div className="ql215-grid">
      <section className="ql215-panel" aria-labelledby="ql215-cases-title"><h4 id="ql215-cases-title">{organization.name} · Review cases</h4>
        {company.cases.length === 0 ? <p>No QL-211 reported gap exists in this session. No case, independent review or closure has been invented. <button type="button" onClick={() => onNavigate('intake')}>Open QL-214 intake</button></p> :
          <div role="group" aria-label="Choose review case">{company.cases.map((candidate) => <button key={candidate.scenario} type="button" aria-pressed={candidate.scenario === item?.scenario}
            className={candidate.scenario === item?.scenario ? 'ql215-case active' : 'ql215-case'}
            onClick={() => { setSelected(candidate.scenario); setCategory(''); setConfirmRefresh(false); }}>
            <strong>{candidate.title}</strong><span>{candidate.priority} · {sources[candidate.sourceStatus]} · hold HELD</span></button>)}</div>}
        {company.orphaned > 0 && <p className="ql215-warning" role="alert">{company.orphaned} withdrawn source case(s) still have stale review records. Withdrawal is not verified closure.</p>}
      </section>
      {item && <section className="ql215-panel ql215-detail" aria-labelledby="ql215-case-title"><h4 id="ql215-case-title">{item.title} · {item.priority}</h4>
        <p className="ql215-source">Source reconciliation: <strong>{sources[item.sourceStatus]}</strong>.</p>
        {!item.eligible && <div className="ql215-warning">Start QL-215 only after QL-214 has an unchanged, locally prepared fictional handoff with at least one evidence gap. A real reviewer has not been contacted.
          <button type="button" onClick={() => onNavigate('intake')}>Return to QL-214 handoff</button></div>}
        {item.eligible && !item.record && <button type="button" className="ql215-primary" onClick={() => change((previous, id) => beginQl215Tracking(trial, repair, review, intake, previous, organization.id, id))}>Start simulated follow-up tracking</button>}
        {item.record && item.sourceStatus !== 'SOURCE_CURRENT' && <div className="ql215-warning" role="alert"><strong>Audit frozen:</strong> A source or intake version changed. Previous follow-up drafts cannot be counted as current evidence.
          {item.eligible && <><button type="button" aria-expanded={confirmRefresh} aria-controls="ql215-refresh" onClick={() => setConfirmRefresh((open) => !open)}>Refresh stale audit baseline</button>
            {confirmRefresh && <div id="ql215-refresh"><p>Discard this case's simulated review cycles and follow-up notes? No other company records are touched.</p>
              <button type="button" onClick={() => { change((previous, id) => beginQl215Tracking(trial, repair, review, intake, previous, organization.id, id)); setConfirmRefresh(false); }}>Confirm new source baseline</button>
              <button type="button" onClick={() => setConfirmRefresh(false)}>Cancel</button></div>}</>}
        </div>}
        {item.record && item.sourceStatus === 'SOURCE_CURRENT' && <>
          <div className="ql215-cycle"><h5>Explicit simulated review-cycle clock</h5>
            <p>Review cycle: <strong>{item.cycle}</strong> of 20. This counter does not run in the background and does not represent actual dates.</p>
            <button type="button" disabled={item.cycle >= 20} onClick={() => change((previous, id) => advanceQl215Cycle(trial, repair, review, intake, previous, organization.id, id))}>Advance simulated review cycle (+1)</button></div>
          <section className="ql215-gap-section" aria-labelledby="ql215-gaps-title"><h5 id="ql215-gaps-title">Source-linked open evidence gaps ({item.gaps.length})</h5>
            {item.gaps.map((gap) => <article className="ql215-gap" key={gap.category}><h6>{gap.category.replaceAll('_',' ')} · {gap.priority}</h6>
              <p>QL-214 source state: <strong>{gap.followUp.replaceAll('_',' ')}</strong>. QL-215 follow-up: <strong>{gap.action.replaceAll('_',' ')}</strong>.</p>
              <p>Aging: <strong>{ages[gap.ageBand]}</strong> · last local review cycle {gap.lastReviewCycle}. <strong>Still open · unverified.</strong></p>
            </article>)}
            <div className="ql215-form"><label htmlFor="ql215-gap">Choose gap to follow up</label>
              <select id="ql215-gap" value={selectedCategory ?? ''} onChange={(event) => { setCategory(event.target.value as Ql214GapCategory); setNote(''); }}>
                {item.gaps.map((gap) => <option key={gap.category} value={gap.category}>{gap.category.replaceAll('_',' ')} · {gap.priority}</option>)}</select>
              <label htmlFor="ql215-action">Fictional review action</label><select id="ql215-action" value={action} onChange={(event) => setAction(event.target.value as Ql215FollowUpAction)}>
                <option value="FOLLOWUP_DRAFTED">Follow-up drafted</option><option value="REFERENCE_RECHECK_PLANNED">Reference recheck planned</option>
                <option value="ESCALATION_DRAFTED">Escalation drafted</option></select>
              <label htmlFor="ql215-note">Fictional follow-up evidence note (8–180 characters)</label><textarea id="ql215-note" rows={3} maxLength={180} value={note}
                onChange={(event) => setNote(event.target.value)} placeholder="Describe an unsent review plan with no real names or customer data." />
              <button type="button" disabled={!selectedCategory || note.trim().length < 8} onClick={() => {
                if (selectedCategory) change((previous, id) => noteQl215FollowUp(trial, repair, review, intake, previous, organization.id, id, selectedCategory, action, note));
                setNote(''); }}>Save fictional follow-up · NO DISPATCH</button>
              <small>This only resets simulated unattended cycles for that gap. Actual gap closure and independent review remain HELD.</small></div>
          </section>
        </>}
        <div className="ql215-actions"><button type="button" onClick={() => onNavigate('intake')}>Review QL-214 source</button>
          <button type="button" onClick={() => onNavigate('review')}>Review QL-213 comparison</button></div>
      </section>}
    </div>
    <section className="ql215-panel" aria-labelledby="ql215-holds-title"><h4 id="ql215-holds-title">Read-only QL-181 release hold continuity audit</h4>
      <p>Expected: <strong>{company.holdAudit.expected}</strong> · Observed: <strong>{company.holdAudit.observed}</strong> · Still held: <strong>{company.holdAudit.held}</strong>. Conditional release: <strong>BLOCKED</strong>.</p>
      <div className="ql215-scroll"><table><thead><tr><th scope="col">Prerequisite</th><th scope="col">Required independent verification</th><th scope="col">State</th></tr></thead>
        <tbody>{portfolio.heldPrerequisites.map((hold) => <tr key={hold.id}><th scope="row">{hold.title}</th><td>{hold.requiredBeforePilot}</td><td>HELD_UNVERIFIED</td></tr>)}</tbody></table></div>
    </section>
    <section className="ql215-panel" aria-labelledby="ql215-receipt-title"><h4 id="ql215-receipt-title">Fixed-schema session audit receipt</h4>
      <button type="button" aria-expanded={showReceipt} aria-controls="ql215-receipt" onClick={() => setShowReceipt((open) => !open)}>{showReceipt ? 'Hide' : 'Show'} PII-minimized follow-up receipt</button>
      {showReceipt && <div id="ql215-receipt"><p>Only status/aging codes. No review notes, source signatures, reviewer identity, customer details or approval claims.</p>
        <textarea aria-label="Fixture-only follow-up audit receipt" readOnly rows={13} value={ql215CompanyReceipt(trial, repair, review, intake, ledger, organization.id)} /></div>}
    </section>
    <p className="ql215-foot">QL-215 cannot send a reminder, close an evidence gap, authenticate a reviewer, record a real owner decision or release Quo-lite into live communication operations. A green build is not a pilot authorization.</p>
  </section>;
}

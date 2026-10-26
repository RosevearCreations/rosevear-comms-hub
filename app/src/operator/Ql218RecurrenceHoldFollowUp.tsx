import { useState, type Dispatch, type SetStateAction } from 'react';
import type { OperatorOrganization, OperatorWorkspace } from './ql191Organizations';
import type { Ql211ScenarioId } from './ql211OwnerTrial';
import type { Ql214GapCategory } from './ql214ReviewIntake';
import { QL218_RELEASE, ql218CompanyAudit, ql218CompanyReceipt, ql218Portfolio,
  beginQl218Replay, advanceQl218Cycle, recordQl218Replay, prepareQl218HoldAudit,
  type Ql218Disposition, type Ql218FollowUp, type Ql218Ledger, type Ql218Sources } from './ql218RecurrenceAudit';
import './ql218-recurrence-hold-followup.css';

const statusLabels: Record<string, string> = {
  AWAITING_PREPARED_REASSESSMENT: 'Awaiting QL-217 prepared reassessment',
  SOURCE_CURRENT: 'QL-217 evidence source matches',
  REASSESSMENT_CHANGED: 'FROZEN · QL-217 decisions changed',
  UPSTREAM_STALE: 'FROZEN · upstream evidence stale'
};
const ageLabels: Record<string, string> = {
  CURRENT_CYCLE: 'Current fictional cycle', WATCH: 'Follow-up watch',
  FOLLOWUP_DUE: 'Hold follow-up due · fictional cycles'
};

export function Ql218RecurrenceHoldFollowUp({ organization, sources, ledger, setLedger, onNavigate }: {
  organization: OperatorOrganization;
  sources: Ql218Sources;
  ledger: Ql218Ledger;
  setLedger: Dispatch<SetStateAction<Ql218Ledger>>;
  onNavigate: (workspace: OperatorWorkspace) => void;
}) {
  const [selected, setSelected] = useState<Ql211ScenarioId | null>(null);
  const [category, setCategory] = useState<Ql214GapCategory | ''>('');
  const [disposition, setDisposition] = useState<Ql218Disposition>('OWNER_DECISION_REPLAY_DRAFT');
  const [followUp, setFollowUp] = useState<Ql218FollowUp>('HOLD_MONITOR_DRAFT');
  const [note, setNote] = useState('');
  const [help, setHelp] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const portfolio = ql218Portfolio(sources, ledger);
  const company = ql218CompanyAudit(sources, ledger, organization.id);
  const item = company.cases.find((candidate) => candidate.scenario === selected) ?? company.cases[0];
  const selectedCategory = category && item?.gaps.some((gap) => gap.category === category) ? category : item?.gaps[0]?.category;

  function change(operation: (previous: Ql218Ledger, scenario: Ql211ScenarioId) => Ql218Ledger) {
    if (item) setLedger((previous) => operation(previous, item.scenario));
  }

  return <section className="ql218-workbench" data-ql218-release={QL218_RELEASE} data-organization={organization.id} aria-labelledby="ql218-title">
    <header className="ql218-header"><div><p className="ql191-eyebrow">QL-218 · Recurrence and conditional-hold follow-up · Disabled preview</p>
      <h3 id="ql218-title">Four-company exception recurrence &amp; owner decision replay</h3>
      <p>Reconcile QL-217 prepared reassessments, replay unresolved fictional decisions, and draft independent hold follow-up actions.</p></div>
      <button type="button" aria-expanded={help} aria-controls="ql218-help" onClick={() => setHelp((open) => !open)}>ⓘ Recurrence help</button></header>
    <p className="ql218-warning" role="note"><strong>RELEASE HOLD IS UNCHANGED.</strong> All 12 real-pilot requirements stay HELD_UNVERIFIED. Every replay and recurrence here is fabricated and session-only. No actual owner decision, independent evidence review, external packet transmission, call or SMS is authorized.</p>
    {help && <div id="ql218-help" className="ql218-help"><p>Prepare QL-217 first, then start an explicit fictional recurrence replay. Saving a new replay for the same gap after advancing the fictional cycle increments the recurrence counter. A same-cycle duplicate cannot inflate recurrence. Hold follow-up is due after two missed cycles for P0/P1 and four for P2/P3. Notes and actions remain unverified and unsent. Any changed upstream evidence freezes its old QL-218 record until we explicitly confirm a new source baseline.</p></div>}
    <div className="ql218-metrics" role="status"><div><small>Eligible QL-217 packets</small><strong>{portfolio.eligible}</strong><span>Across four companies</span></div>
      <div><small>Fictional recurrences</small><strong>{portfolio.recurrence}</strong><span>Unresolved, never verified</span></div>
      <div><small>Hold follow-ups due</small><strong>{portfolio.followUpDue}</strong><span>Simulated cycles only</span></div>
      <div><small>Prepared local audits</small><strong>{portfolio.prepared}</strong><span>No live authorization</span></div></div>
    <section className="ql218-panel" aria-labelledby="ql218-summary-title"><h4 id="ql218-summary-title">Four-company source and conditional-hold comparison</h4>
      <div className="ql218-scroll"><table><caption>Separate per-company fictional evidence ledgers. Totals convey no shared customer data or approval.</caption>
        <thead><tr><th scope="col">Company</th><th scope="col">Eligible</th><th scope="col">Tracked</th><th scope="col">Recurrences</th><th scope="col">Due</th><th scope="col">Prepared</th><th scope="col">Stale</th><th scope="col">Holds</th></tr></thead>
        <tbody>{portfolio.companies.map((row) => <tr key={row.company}><th scope="row">{row.company === 'rosiedazzlers' ? 'Rosie Dazzlers' : row.company === 'devilndove' ? 'Devil n Dove' : row.company === 'icamp' ? 'iCamp' : 'YW · Property Maintenance'}</th>
          <td>{row.eligible}</td><td>{row.tracking}</td><td>{row.recurrence}</td><td>{row.followUpDue}</td><td>{row.prepared}</td><td>{row.stale}</td><td>{row.releaseAudit.held}/12 HELD</td></tr>)}</tbody></table></div>
    </section>
    <div className="ql218-grid"><section className="ql218-panel" aria-labelledby="ql218-case-list"><h4 id="ql218-case-list">{organization.name} · Evidence cases</h4>
      {company.cases.length === 0 ? <p>No QL-211 fictional finding exists for this company in this session. No recurrence or approval is fabricated. <button type="button" onClick={() => onNavigate('trial')}>Open owner trial</button></p> :
        <div role="group" aria-label="Select fictional recurrence case">{company.cases.map((candidate) => <button key={candidate.scenario} type="button"
          className={candidate.scenario === item?.scenario ? 'ql218-case active' : 'ql218-case'} aria-pressed={candidate.scenario === item?.scenario}
          onClick={() => { setSelected(candidate.scenario); setCategory(''); setNote(''); setConfirmReset(false); }}>
          <strong>{candidate.title}</strong><span>{candidate.priority} · {statusLabels[candidate.sourceStatus]} · {candidate.recurrence} recurrence(s)</span></button>)}</div>}
      {company.orphaned > 0 && <p className="ql218-warning" role="alert">{company.orphaned} removed scenario(s) leave orphaned local audit drafts. Nothing was independently closed.</p>}
    </section>
    {item && <section className="ql218-panel" aria-labelledby="ql218-case-title"><h4 id="ql218-case-title">{item.title} · Decision replay audit</h4>
      <p className="ql218-source">Source: <strong>{statusLabels[item.sourceStatus]}</strong>. QL-217 prepared: <strong>{item.preparedForHumanReview ? 'yes · local only' : 'no'}</strong>.</p>
      {!item.eligible && <p className="ql218-warning">Start with an up-to-date, locally prepared QL-217 reassessment covering its unresolved gaps. <button type="button" onClick={() => onNavigate('reassessment')}>Inspect QL-217 evidence</button></p>}
      {item.eligible && !item.record && <button type="button" className="ql218-primary" onClick={() => change((previous, id) => beginQl218Replay(sources, previous, organization.id, id))}>Begin fictional recurrence replay</button>}
      {item.record && item.sourceStatus !== 'SOURCE_CURRENT' && <div className="ql218-warning" role="alert"><strong>Frozen audit:</strong> Upstream QL-217 evidence or decisions have changed. The previous replay is not current and cannot advance.
        {item.eligible && <><button type="button" aria-expanded={confirmReset} aria-controls="ql218-reset" onClick={() => setConfirmReset((open) => !open)}>Reconcile new QL-217 baseline</button>
          {confirmReset && <div id="ql218-reset"><p>Reset this case’s invented recurrence history, simulated cycles and private drafts to the current QL-217 source? Other cases and companies will not change.</p>
            <button type="button" onClick={() => { change((previous, id) => beginQl218Replay(sources, previous, organization.id, id)); setConfirmReset(false); setNote(''); }}>Confirm local baseline reset</button>
            <button type="button" onClick={() => setConfirmReset(false)}>Cancel</button></div>}</>}
      </div>}
      {item.record && item.sourceStatus === 'SOURCE_CURRENT' && <>
        <div className="ql218-cycle"><h5>Explicit fictional recurrence cycle</h5><p>Cycle <strong>{item.cycle}</strong> of 20. There are no timers, real dates, messages, automatic recurrence events or external notifications.</p>
          <button type="button" disabled={item.cycle >= 20} onClick={() => change((previous, id) => advanceQl218Cycle(sources, previous, organization.id, id))}>Advance fictional follow-up cycle (+1)</button></div>
        <section aria-labelledby="ql218-gaps"><h5 id="ql218-gaps">Unresolved independent evidence gaps ({item.gaps.length})</h5>
          {item.gaps.map((gap) => <article className="ql218-gap" key={gap.category}><h6>{gap.category.replaceAll('_', ' ')} · {gap.priority}</h6>
            <p>Reassessment: {gap.decisionAction.replaceAll('_', ' ')} · Owner replay: <strong>{gap.replayDisposition.replaceAll('_', ' ')}</strong>.</p>
            <p>Replay count: <strong>{gap.replayCount}</strong> · Fictional recurrence count: <strong>{gap.recurrenceCount}</strong> · Last replay cycle: <strong>{gap.lastReplayCycle}</strong>.</p>
            <p>Conditional hold follow-up: <strong>{gap.followUp.replaceAll('_', ' ')}</strong> · {ageLabels[gap.followUpAge]}. <strong>Still unverified.</strong></p></article>)}
        </section>
        {item.record.phase === 'local_replay_draft' ? <div className="ql218-form"><label htmlFor="ql218-gap">Open evidence gap</label>
          <select id="ql218-gap" value={selectedCategory ?? ''} onChange={(event) => { setCategory(event.target.value as Ql214GapCategory); setNote(''); }}>
            {item.gaps.map((gap) => <option key={gap.category} value={gap.category}>{gap.category.replaceAll('_', ' ')} · {gap.priority}</option>)}</select>
          <label htmlFor="ql218-decision">Owner-safe fictional replay disposition</label>
          <select id="ql218-decision" value={disposition} onChange={(event) => setDisposition(event.target.value as Ql218Disposition)}>
            <option value="OWNER_DECISION_REPLAY_DRAFT">Owner decision replay draft · no actual owner input</option>
            <option value="SOURCE_RECHECK_DRAFT">Source recheck draft · unverified</option>
            <option value="INDEPENDENT_EXCEPTION_REVIEW_DRAFT">Independent exception review draft · unsent</option></select>
          <label htmlFor="ql218-followup">Conditional release hold follow-up draft</label>
          <select id="ql218-followup" value={followUp} onChange={(event) => setFollowUp(event.target.value as Ql218FollowUp)}>
            <option value="HOLD_MONITOR_DRAFT">Continue holding for evidence</option><option value="NEW_EVIDENCE_REQUEST_DRAFT">Request missing evidence · draft only</option>
            <option value="INDEPENDENT_REVIEW_ESCALATION_DRAFT">Escalate to human independent review · draft only</option></select>
          <label htmlFor="ql218-note">Fabricated replay note (8–180 characters, no customer data)</label>
          <textarea id="ql218-note" rows={3} maxLength={180} value={note} onChange={(event) => setNote(event.target.value)} placeholder="Describe invented decision follow-up; never enter actual names, contact details or customer records." />
          <button type="button" disabled={!selectedCategory || note.trim().length < 8 || Boolean(item.record.decisions[selectedCategory]?.lastReplayCycle === item.cycle)}
            onClick={() => { if (selectedCategory) change((previous, id) => recordQl218Replay(sources, previous, organization.id, id, selectedCategory, disposition, followUp, note)); setNote(''); }}>Record fictional owner replay &amp; hold follow-up · UNSENT</button>
          <button type="button" disabled={item.gaps.length === 0 || item.gaps.some((gap) => gap.replayDisposition === 'NOT_REPLAYED' || gap.followUpAge === 'FOLLOWUP_DUE')}
            onClick={() => change((previous, id) => prepareQl218HoldAudit(sources, previous, organization.id, id))}>Prepare local conditional hold audit · NO RELEASE</button>
          <small>Every gap needs a fictional replay and a current hold follow-up. Repeat a gap only after advancing the fictional cycle. No gap is closed.</small>
        </div> : <p className="ql218-prepared" role="status">Conditional hold follow-up locally prepared. Release remains BLOCKED: no human decision or independent evidence has been verified.</p>}
      </>}
      <div className="ql218-actions"><button type="button" onClick={() => onNavigate('reassessment')}>Inspect QL-217 reassessment</button>
        <button type="button" onClick={() => onNavigate('handoff')}>Inspect QL-216 handoff</button></div>
    </section>}</div>
    <section className="ql218-panel" aria-labelledby="ql218-holds"><h4 id="ql218-holds">Read-only conditional release hold follow-up audit</h4>
      <p>Expected <strong>{company.releaseAudit.expected}</strong> · Observed <strong>{company.releaseAudit.observed}</strong> · Still held <strong>{company.releaseAudit.held}</strong> · Conditional release <strong>BLOCKED</strong>.</p>
      <div className="ql218-scroll"><table><thead><tr><th scope="col">QL-181 requirement</th><th scope="col">Real-world verification required</th><th scope="col">Current hold</th></tr></thead>
        <tbody>{portfolio.prerequisites.map((hold) => <tr key={hold.id}><th scope="row">{hold.title}</th><td>{hold.requiredBeforePilot}</td><td>{hold.state}</td></tr>)}</tbody></table></div>
    </section>
    <section className="ql218-panel" aria-labelledby="ql218-receipt"><h4 id="ql218-receipt">Fixed-schema PII-minimized recurrence audit receipt</h4>
      <button type="button" aria-expanded={showReceipt} aria-controls="ql218-receipt-body" onClick={() => setShowReceipt((open) => !open)}>{showReceipt ? 'Hide' : 'Show'} local recurrence receipt</button>
      {showReceipt && <div id="ql218-receipt-body"><p>Machine-readable fictional statuses only, no free-text notes, source fingerprints, reviewer names or customer identities.</p>
        <textarea readOnly aria-label="Fixture-only QL-218 recurrence audit receipt" rows={15} value={ql218CompanyReceipt(sources, ledger, organization.id)} /></div>}
    </section>
    <p className="ql218-foot">This is a software rehearsal. GREEN deployment does not mean production telephony is enabled or any independent human decision has occurred.</p>
  </section>;
}

import { useState, type Dispatch, type SetStateAction } from 'react';
import type { OperatorOrganization, OperatorWorkspace } from './ql191Organizations';
import type { Ql211ScenarioId } from './ql211OwnerTrial';
import type { Ql214GapCategory } from './ql214ReviewIntake';
import { QL222_RELEASE, QL222_CHECKS, ql222CompanyRecurrence, ql222Portfolio,
  ql222CompanyReceipt, beginQl222Replay, recordQl222Decision, advanceQl222Cycle,
  acknowledgeQl222Check, prepareQl222HoldRecheck,
  type Ql222Sources, type Ql222Ledger, type Ql222Recurrence, type Ql222Decision } from './ql222ExceptionRecurrence';
import './ql222-owner-decision-audit.css';

const statusText: Record<string, string> = {
  AWAITING_PREPARED_QL221: 'Awaiting prepared fictional QL-221 evidence refresh',
  SOURCE_CURRENT: 'QL-221 refresh source matches',
  EVIDENCE_REFRESH_REVISED: 'FROZEN · QL-221 refresh source changed',
  UPSTREAM_STALE: 'FROZEN · upstream evidence no longer current'
};

export function Ql222OwnerDecisionAudit({ organization, sources, ledger, setLedger, onNavigate }: {
  organization: OperatorOrganization;
  sources: Ql222Sources;
  ledger: Ql222Ledger;
  setLedger: Dispatch<SetStateAction<Ql222Ledger>>;
  onNavigate: (workspace: OperatorWorkspace) => void;
}) {
  const [selected, setSelected] = useState<Ql211ScenarioId | null>(null);
  const [category, setCategory] = useState<Ql214GapCategory | ''>('');
  const [recurrence, setRecurrence] = useState<Ql222Recurrence>('RECONFIRMED_OPEN');
  const [decision, setDecision] = useState<Ql222Decision>('MAINTAIN_HOLD_DRAFT');
  const [note, setNote] = useState('');
  const [help, setHelp] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const portfolio = ql222Portfolio(sources, ledger);
  const company = ql222CompanyRecurrence(sources, ledger, organization.id);
  const item = company.cases.find((entry) => entry.scenario === selected) ?? company.cases[0];
  const selectedCategory = category && item?.gaps.some((gap) => gap.category === category) ? category : item?.gaps[0]?.category;

  function change(operation: (previous: Ql222Ledger, scenario: Ql211ScenarioId) => Ql222Ledger) {
    if (item) setLedger((previous) => operation(previous, item.scenario));
  }

  return <section className="ql218-workbench ql222-workbench" data-ql222-release={QL222_RELEASE} data-organization={organization.id} aria-labelledby="ql222-title">
    <header className="ql218-header"><div><p className="ql191-eyebrow">QL-222 · Recurrence and owner decisions · Disabled preview</p>
      <h3 id="ql222-title">Four-company refreshed evidence exceptions &amp; independent hold recheck</h3>
      <p>Rehearse fictional recurrence after QL-221 refresh, draft owner follow-up choices and inspect unchanged release holds.</p></div>
      <button type="button" aria-expanded={help} aria-controls="ql222-help" onClick={() => setHelp((value) => !value)}>ⓘ Recurrence audit help</button></header>
    <div className="ql218-warning" role="note"><strong>NO REAL APPROVAL OR RELEASE.</strong> All {portfolio.prerequisites.length} QL-181 prerequisites remain HELD_UNVERIFIED. Repeated exceptions and decisions are invented preview entries, not independent findings. No owner authorizes closure; no provider calls, messages, or database writes occur.</div>
    {help && <p className="ql218-help" id="ql222-help">Prepare a current fictional QL-221 evidence refresh, start a local recurrence replay, and record an invented disposition plus unsent owner follow-up for every gap. "Repeated after refresh" increases this gap's synthetic repeat count once per cycle, even if its draft is edited repeatedly. Any recurring gap requires a drafted independent-review escalation. Three simulated cycles without a refreshed decision create an overdue item. Acknowledge the three local hold-recheck checks before preparing a status-only packet; real closure and release are never authorized. Changed source records freeze until explicit case-only reset.</p>}
    <div className="ql218-metrics" role="status"><div><small>Eligible QL-221 cases</small><strong>{portfolio.eligible}</strong><span>Four-company scope</span></div>
      <div><small>Synthetic repeat events</small><strong>{portfolio.repeatEvents}</strong><span>Per cycle and gap</span></div>
      <div><small>Owner packets prepared</small><strong>{portfolio.prepared}</strong><span>Not real closure</span></div>
      <div><small>Stale or orphaned</small><strong>{portfolio.stale}</strong><span>Source integrity</span></div></div>
    <section className="ql218-panel" aria-labelledby="ql222-portfolio"><h4 id="ql222-portfolio">Four-company recurrence, decisions and release holds</h4>
      <div className="ql218-scroll"><table><caption>Invented scenario counts, company scoped. This is not a real independent decision register.</caption>
        <thead><tr><th scope="col">Company</th><th scope="col">Eligible</th><th scope="col">Tracking</th><th scope="col">Undecided</th><th scope="col">Repeat events</th><th scope="col">Escalation due</th><th scope="col">Overdue</th><th scope="col">Prepared</th><th scope="col">Stale</th><th scope="col">Release holds</th></tr></thead>
        <tbody>{portfolio.companies.map((row) => <tr key={row.company}><th scope="row">{row.company === 'rosiedazzlers' ? 'Rosie Dazzlers' : row.company === 'devilndove' ? 'Devil n Dove' : row.company === 'icamp' ? 'iCamp' : 'YW · Property Maintenance'}</th>
          <td>{row.eligible}</td><td>{row.tracking}</td><td>{row.undecided}</td><td>{row.repeatEvents}</td><td>{row.escalationsDue}</td><td>{row.overdue}</td><td>{row.prepared}</td><td>{row.stale}</td><td>{row.holdAudit.held}/12 HELD</td></tr>)}</tbody></table></div>
    </section>
    <div className="ql218-grid"><section className="ql218-panel" aria-labelledby="ql222-cases"><h4 id="ql222-cases">{organization.name} · Reopened fictional cases</h4>
      {company.cases.length === 0 ? <p>No fictional QL-211 finding exists for this organization. <button type="button" onClick={() => onNavigate('trial')}>Open owner trial</button></p> :
        <div role="group" aria-label="Select recurrence decision case">{company.cases.map((candidate) => <button type="button" key={candidate.scenario}
          className={candidate.scenario === item?.scenario ? 'ql218-case active' : 'ql218-case'} aria-pressed={candidate.scenario === item?.scenario}
          onClick={() => { setSelected(candidate.scenario); setCategory(''); setNote(''); setConfirmReset(false); }}>
          <strong>{candidate.title}</strong><span>{candidate.priority} · {statusText[candidate.sourceStatus]} · {candidate.repeatEvents} invented repeat(s)</span></button>)}</div>}
      {company.orphaned > 0 && <p role="alert" className="ql218-warning">{company.orphaned} removed local case record(s) remain orphaned and held, not closed.</p>}
    </section>
    {item && <section className="ql218-panel" aria-labelledby="ql222-selected"><h4 id="ql222-selected">{item.title} · Follow-up decision replay</h4>
      <p className="ql218-source">Source: <strong>{statusText[item.sourceStatus]}</strong>. Prepared QL-221: <strong>{item.prepared ? 'yes · fictional only' : 'no'}</strong>.</p>
      {!item.eligible && <div className="ql218-warning">A current and locally prepared QL-221 refresh is required. <button type="button" onClick={() => onNavigate('refresh')}>Inspect QL-221 source</button></div>}
      {item.eligible && !item.record && <button type="button" onClick={() => change((previous, id) => beginQl222Replay(sources, previous, organization.id, id))}>Begin fictional exception recurrence replay</button>}
      {item.record && item.sourceStatus !== 'SOURCE_CURRENT' && <div role="alert" className="ql218-warning"><strong>Owner decision replay frozen.</strong> QL-221 or its upstream evidence has changed; prior invented decisions cannot advance.
        {item.eligible && <><button type="button" aria-expanded={confirmReset} aria-controls="ql222-reset" onClick={() => setConfirmReset((value) => !value)}>Reconcile revised QL-221 source</button>
          {confirmReset && <div id="ql222-reset"><p>Restart only this selected case with the revised fictional refresh source? Local decisions, cycle counts, repeat events, acknowledgments and packet for this case will reset. Other cases and companies are preserved.</p>
            <button type="button" onClick={() => { change((previous, id) => beginQl222Replay(sources, previous, organization.id, id)); setConfirmReset(false); setNote(''); }}>Confirm case-only source reset</button>
            <button type="button" onClick={() => setConfirmReset(false)}>Cancel reset</button></div>}</>}
      </div>}
      {item.record && item.sourceStatus === 'SOURCE_CURRENT' && <>
        <p className="ql222-cycle" role="status">Synthetic cycle <strong>{item.record.cycle}/12</strong> · Repeat events <strong>{item.repeatEvents}</strong> · Undecided <strong>{item.undecided}</strong> · Overdue <strong>{item.overdue}</strong> · Escalation drafts due <strong>{item.escalationsDue}</strong>.</p>
        <section aria-labelledby="ql222-gaps"><h5 id="ql222-gaps">Open refreshed evidence exceptions ({item.gaps.length})</h5>
          {item.gaps.map((gap) => <article key={gap.category} className="ql218-gap"><h6>{gap.category.replaceAll('_', ' ')} · {gap.priority}</h6>
            <p>QL-221 refresh: <strong>{gap.refresh.replaceAll('_', ' ')}</strong> · Prior recurrence count <strong>{gap.recurrenceCount}</strong>.</p>
            <p>Local recurrence: <strong>{gap.decision.replaceAll('_', ' ')}</strong> · Recorded repeat events <strong>{gap.repeatCount}</strong> · Total fictional recurrences <strong>{gap.totalRecurrence}</strong>.</p>
            <p>Owner decision: <strong>{gap.ownerDecision.replaceAll('_', ' ')}</strong> · Follow-up age <strong>{gap.followUpAge === null ? 'NOT TRACKED' : `${gap.followUpAge} cycle(s)`}</strong>.</p>
            {gap.overdue && <p className="ql219-due">Overdue simulated owner follow-up: refresh the local decision.</p>}
            {gap.escalationRequired && gap.ownerDecision !== 'ESCALATE_INDEPENDENT_DRAFT' && <p className="ql219-due">Recurring exception requires a draft independent-review escalation before local preparation.</p>}
            <p>Independent evidence <strong>UNVERIFIED</strong> · Real closure <strong>BLOCKED</strong>.</p></article>)}
        </section>
        {item.record.phase === 'owner_decision_replay_draft' ? <>
          <div className="ql218-form"><label htmlFor="ql222-gap">Exception gap</label>
            <select id="ql222-gap" value={selectedCategory ?? ''} onChange={(event) => { setCategory(event.target.value as Ql214GapCategory); setNote(''); }}>
              {item.gaps.map((gap) => <option key={gap.category} value={gap.category}>{gap.category.replaceAll('_', ' ')} · {gap.totalRecurrence} fictional recurrence(s)</option>)}</select>
            <label htmlFor="ql222-recurrence">Fictional recurrence after evidence refresh</label>
            <select id="ql222-recurrence" value={recurrence} onChange={(event) => setRecurrence(event.target.value as Ql222Recurrence)}>
              <option value="RECONFIRMED_OPEN">Still open · no new repeat event</option>
              <option value="REPEATED_AFTER_REFRESH">Repeated after refresh · one event this cycle</option>
              <option value="SIMULATED_SOURCE_EXCEPTION">Fictional source exception · unverified</option></select>
            <label htmlFor="ql222-decision">Owner follow-up · unsent draft</label>
            <select id="ql222-decision" value={decision} onChange={(event) => setDecision(event.target.value as Ql222Decision)}>
              <option value="MAINTAIN_HOLD_DRAFT">Maintain hold · no authorization</option>
              <option value="REQUEST_EVIDENCE_DRAFT">Request new evidence · unsent</option>
              <option value="ESCALATE_INDEPENDENT_DRAFT">Escalate for independent review · draft only</option></select>
            <label htmlFor="ql222-note">Fictional owner-decision note (8–180 characters)</label>
            <textarea id="ql222-note" rows={3} maxLength={180} value={note} onChange={(event) => setNote(event.target.value)} placeholder="Enter invented events only; no private customer or reviewer details." />
            <button type="button" disabled={!selectedCategory || note.trim().length < 8} onClick={() => { if (selectedCategory) change((previous, id) => recordQl222Decision(sources, previous, organization.id, id, selectedCategory, recurrence, decision, note)); setNote(''); }}>Record fictional recurrence &amp; owner follow-up · UNSENT</button>
            <button type="button" disabled={item.record.cycle >= 12} onClick={() => change((previous, id) => advanceQl222Cycle(sources, previous, organization.id, id))}>Advance simulated recurrence cycle (+1)</button>
            <small>Repeat events are counted at most once per gap in each fictional cycle. Three simulated cycles without a new decision marks a follow-up overdue; nothing is dispatched.</small></div>
          <section className="ql219-checklist" aria-labelledby="ql222-checks"><h5 id="ql222-checks">Independent release hold recheck · local acknowledgments</h5>
            {QL222_CHECKS.map((check) => <article key={check.id} className="ql219-check"><div><strong>{check.title}</strong><p>{check.detail}</p></div>
              <button type="button" disabled={item.record?.checks[check.id] === 'ACKNOWLEDGED_UNVERIFIED'} onClick={() => change((previous, id) => acknowledgeQl222Check(sources, previous, organization.id, id, check.id))}>
                {item.record?.checks[check.id] === 'ACKNOWLEDGED_UNVERIFIED' ? 'Locally reviewed · UNVERIFIED' : 'Acknowledge hold recheck · UNVERIFIED'}</button></article>)}
          </section>
          <button type="button" disabled={!item.readyForLocalAudit} onClick={() => change((previous, id) => prepareQl222HoldRecheck(sources, previous, organization.id, id))}>Prepare owner-decision &amp; independent hold packet · NO RELEASE</button>
        </> : <p className="ql218-prepared" role="status">Fictional recurrence and independent hold recheck packet prepared locally. Real owner approval, evidence verification, closure and release remain BLOCKED.</p>}
      </>}
      <div className="ql218-actions"><button type="button" onClick={() => onNavigate('refresh')}>Inspect QL-221 refresh</button>
        <button type="button" onClick={() => onNavigate('reopen')}>Inspect QL-220 recurrence</button></div>
    </section>}</div>
    <section className="ql218-panel" aria-labelledby="ql222-holds"><h4 id="ql222-holds">Read-only actual independent release-hold check</h4>
      <p>Expected <strong>{company.holdAudit.expected}</strong> · Observed <strong>{company.holdAudit.observed}</strong> · HELD_UNVERIFIED <strong>{company.holdAudit.held}</strong> · Conditional release <strong>BLOCKED</strong>.</p>
      <div className="ql218-scroll"><table><thead><tr><th scope="col">QL-181 prerequisite</th><th scope="col">Real evidence required</th><th scope="col">Actual state</th></tr></thead>
        <tbody>{portfolio.prerequisites.map((hold) => <tr key={hold.id}><th scope="row">{hold.title}</th><td>{hold.requiredBeforePilot}</td><td>{hold.state}</td></tr>)}</tbody></table></div>
    </section>
    <section className="ql218-panel" aria-labelledby="ql222-receipt-title"><h4 id="ql222-receipt-title">PII-minimized recurrence &amp; hold recheck receipt</h4>
      <button type="button" aria-expanded={showReceipt} aria-controls="ql222-receipt" onClick={() => setShowReceipt((value) => !value)}>{showReceipt ? 'Hide' : 'Show'} local QL-222 audit receipt</button>
      {showReceipt && <div id="ql222-receipt"><p>Fixed status codes only. No source fingerprint, private note, reviewer identity, customer detail or real decision evidence.</p>
        <textarea readOnly rows={15} aria-label="Fixture-only QL-222 recurrence and hold receipt" value={ql222CompanyReceipt(sources, ledger, organization.id)} /></div>}
    </section>
    <p className="ql218-foot">Software Production GREEN is not independent pilot approval. Real QL-181 release holds remain in force; live phone/SMS stay disabled.</p>
  </section>;
}

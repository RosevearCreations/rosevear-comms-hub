import { useState, type Dispatch, type SetStateAction } from 'react';
import type { OperatorOrganization, OperatorWorkspace } from './ql191Organizations';
import type { Ql211ScenarioId } from './ql211OwnerTrial';
import type { Ql214GapCategory } from './ql214ReviewIntake';
import { QL223_RELEASE, QL223_CHECKS, ql223CompanyAging, ql223Portfolio,
  ql223CompanyReceipt, beginQl223FollowUp, recordQl223FollowUp, advanceQl223Cycle,
  acknowledgeQl223Check, prepareQl223HoldOversight,
  type Ql223Sources, type Ql223Ledger, type Ql223Evidence, type Ql223OwnerRoute } from './ql223DecisionAging';
import './ql223-decision-aging-audit.css';

const statusText: Record<string, string> = {
  AWAITING_PREPARED_QL222: 'Awaiting prepared fictional QL-222 owner-decision packet',
  SOURCE_CURRENT: 'Prepared QL-222 source matches',
  QL222_DECISION_REVISED: 'FROZEN · QL-222 decision record changed',
  UPSTREAM_STALE: 'FROZEN · upstream evidence no longer current'
};

export function Ql223DecisionAgingAudit({ organization, sources, ledger, setLedger, onNavigate }: {
  organization: OperatorOrganization;
  sources: Ql223Sources;
  ledger: Ql223Ledger;
  setLedger: Dispatch<SetStateAction<Ql223Ledger>>;
  onNavigate: (workspace: OperatorWorkspace) => void;
}) {
  const [selected, setSelected] = useState<Ql211ScenarioId | null>(null);
  const [category, setCategory] = useState<Ql214GapCategory | ''>('');
  const [evidence, setEvidence] = useState<Ql223Evidence>('REQUEST_PENDING_UNSENT');
  const [route, setRoute] = useState<Ql223OwnerRoute>('CONTINUE_HOLD_DRAFT');
  const [note, setNote] = useState('');
  const [help, setHelp] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const portfolio = ql223Portfolio(sources, ledger);
  const company = ql223CompanyAging(sources, ledger, organization.id);
  const item = company.cases.find((entry) => entry.scenario === selected) ?? company.cases[0];
  const selectedCategory = category && item?.gaps.some((gap) => gap.category === category) ? category : item?.gaps[0]?.category;

  function change(operation: (previous: Ql223Ledger, scenario: Ql211ScenarioId) => Ql223Ledger) {
    if (item) setLedger((previous) => operation(previous, item.scenario));
  }

  return <section className="ql218-workbench ql223-workbench" data-ql223-release={QL223_RELEASE} data-organization={organization.id} aria-labelledby="ql223-title">
    <header className="ql218-header"><div><p className="ql191-eyebrow">QL-223 · Follow-up decision aging · Disabled preview</p>
      <h3 id="ql223-title">Four-company owner decision aging &amp; conditional release hold oversight</h3>
      <p>Rehearse invented evidence follow-ups, see approaching and overdue owner decisions, and prepare a locally held oversight packet.</p></div>
      <button type="button" aria-expanded={help} aria-controls="ql223-help" onClick={() => setHelp((value) => !value)}>ⓘ Owner aging help</button></header>
    <div className="ql218-warning" role="note"><strong>CONDITIONAL RELEASE BLOCKED.</strong> All {portfolio.prerequisites.length} QL-181 real prerequisites stay HELD_UNVERIFIED. Evidence is fictional and never independently verified. No actual owner authorizes closure; no calls, messages, provider dispatch or database writes occur.</div>
    {help && <p className="ql218-help" id="ql223-help">First prepare a current fictional QL-222 exception packet. Begin a separate local QL-223 follow-up and record an invented evidence status with an unsent owner decision for every gap. Two simulated cycles after a decision marks approaching due, and three or more makes it overdue. Recurrent, P0 or newly repeated exceptions need a draft independent referral before preparation. New fictional exceptions count at most once per gap per cycle. Complete all three unverified checks; no action lifts real holds. Changed source records freeze until an explicit case-only reset.</p>}
    <div className="ql218-metrics" role="status">
      <div><small>Eligible QL-222 packets</small><strong>{portfolio.eligible}</strong><span>All four companies</span></div>
      <div><small>Approaching / overdue</small><strong>{portfolio.approaching} / {portfolio.overdue}</strong><span>Simulated cycles only</span></div>
      <div><small>Owner packets prepared</small><strong>{portfolio.prepared}</strong><span>Not real closure</span></div>
      <div><small>Stale / orphaned</small><strong>{portfolio.stale}</strong><span>Frozen until reconciliation</span></div>
    </div>
    <section className="ql218-panel" aria-labelledby="ql223-portfolio"><h4 id="ql223-portfolio">Four-company owner aging and conditional release oversight</h4>
      <div className="ql218-scroll"><table><caption>Invented case counts only; no actual owner decisions or independent closure.</caption>
        <thead><tr><th scope="col">Company</th><th scope="col">Eligible</th><th scope="col">Tracking</th><th scope="col">Undecided</th><th scope="col">Due soon</th><th scope="col">Overdue</th><th scope="col">Referral due</th><th scope="col">Evidence pending</th><th scope="col">Invented recurrence</th><th scope="col">Prepared</th><th scope="col">Stale</th><th scope="col">Release holds</th></tr></thead>
        <tbody>{portfolio.companies.map((row) => <tr key={row.company}><th scope="row">{row.company === 'rosiedazzlers' ? 'Rosie Dazzlers' : row.company === 'devilndove' ? 'Devil n Dove' : row.company === 'icamp' ? 'iCamp' : 'YW · Property Maintenance'}</th>
          <td>{row.eligible}</td><td>{row.tracking}</td><td>{row.undecided}</td><td>{row.approaching}</td><td>{row.overdue}</td><td>{row.referralsDue}</td><td>{row.pendingEvidence}</td><td>{row.exceptionEvents}</td><td>{row.prepared}</td><td>{row.stale}</td><td>{row.holdAudit.held}/12 HELD</td></tr>)}</tbody></table></div>
    </section>
    <div className="ql218-grid"><section className="ql218-panel" aria-labelledby="ql223-cases"><h4 id="ql223-cases">{organization.name} · Follow-up cases</h4>
      {company.cases.length === 0 ? <p>No fictional QL-211 finding exists. <button type="button" onClick={() => onNavigate('trial')}>Open owner trial</button></p> :
        <div role="group" aria-label="Select owner follow-up case">{company.cases.map((candidate) => <button type="button" key={candidate.scenario}
          className={candidate.scenario === item?.scenario ? 'ql218-case active' : 'ql218-case'} aria-pressed={candidate.scenario === item?.scenario}
          onClick={() => { setSelected(candidate.scenario); setCategory(''); setNote(''); setConfirmReset(false); }}>
          <strong>{candidate.title}</strong><span>{candidate.priority} · {statusText[candidate.sourceStatus]} · {candidate.overdue} invented overdue</span></button>)}</div>}
      {company.orphaned > 0 && <p role="alert" className="ql218-warning">{company.orphaned} removed local case record(s) remain orphaned and held, not closed.</p>}
    </section>
    {item && <section className="ql218-panel" aria-labelledby="ql223-selected"><h4 id="ql223-selected">{item.title} · Owner follow-up decisions</h4>
      <p className="ql218-source">Source: <strong>{statusText[item.sourceStatus]}</strong> · Prepared QL-222: <strong>{item.prepared ? 'yes · fictional only' : 'no'}</strong>.</p>
      {!item.eligible && <div className="ql218-warning">A current, locally prepared QL-222 packet is required. <button type="button" onClick={() => onNavigate('exception')}>Inspect QL-222 source</button></div>}
      {item.eligible && !item.record && <button type="button" onClick={() => change((previous, id) => beginQl223FollowUp(sources, previous, organization.id, id))}>Begin fictional owner aging review</button>}
      {item.record && item.sourceStatus !== 'SOURCE_CURRENT' && <div role="alert" className="ql218-warning"><strong>Follow-up review frozen.</strong> QL-222 or its evidence source changed. Previous invented choices cannot advance.
        {item.eligible && <><button type="button" aria-expanded={confirmReset} aria-controls="ql223-reset" onClick={() => setConfirmReset((value) => !value)}>Reconcile revised QL-222 decision source</button>
          {confirmReset && <div id="ql223-reset"><p>Restart only this case? Local follow-ups, event counts, cycles, checks and its prepared packet will reset. Other cases and companies remain unchanged.</p>
            <button type="button" onClick={() => { change((previous, id) => beginQl223FollowUp(sources, previous, organization.id, id)); setConfirmReset(false); setNote(''); }}>Confirm case-only follow-up reset</button>
            <button type="button" onClick={() => setConfirmReset(false)}>Cancel reset</button></div>}</>}
      </div>}
      {item.record && item.sourceStatus === 'SOURCE_CURRENT' && <>
        <p className="ql222-cycle" role="status">Synthetic cycle <strong>{item.record.cycle}/12</strong> · Undecided <strong>{item.undecided}</strong> · Approaching due <strong>{item.approaching}</strong> · Overdue <strong>{item.overdue}</strong> · Referral drafts due <strong>{item.referralsDue}</strong>.</p>
        <section aria-labelledby="ql223-gaps"><h5 id="ql223-gaps">Evidence exception follow-ups ({item.gaps.length})</h5>
          {item.gaps.map((gap) => <article key={gap.category} className="ql218-gap"><h6>{gap.category.replaceAll('_', ' ')} · {gap.priority}</h6>
            <p>QL-222 synthetic recurrence: <strong>{gap.totalRecurrence}</strong> · Follow-up evidence: <strong>{gap.evidence.replaceAll('_', ' ')}</strong>.</p>
            <p>Owner routing: <strong>{gap.ownerRoute.replaceAll('_', ' ')}</strong> · Decision age: <strong>{gap.followUpAge === null ? 'NOT TRACKED' : `${gap.followUpAge} cycle(s)`}</strong> · Due cycle: <strong>{gap.dueAtCycle ?? 'NOT SET'}</strong>.</p>
            {gap.approaching && <p className="ql223-approaching">Approaching follow-up age threshold; refresh the fictional decision soon.</p>}
            {gap.overdue && <p className="ql219-due">Overdue fictional owner decision; local preparation is held pending a refreshed disposition.</p>}
            {gap.referralDue && <p className="ql219-due">Exception recurrence or priority requires an unsent independent referral.</p>}
            <p>New invented exception events: <strong>{gap.exceptionEvents}</strong> · Actual evidence <strong>UNVERIFIED</strong> · Conditional release <strong>BLOCKED</strong>.</p></article>)}
        </section>
        {item.record.phase === 'follow_up_aging_draft' ? <>
          <div className="ql218-form"><label htmlFor="ql223-gap">Evidence exception gap</label>
            <select id="ql223-gap" value={selectedCategory ?? ''} onChange={(event) => { setCategory(event.target.value as Ql214GapCategory); setNote(''); }}>
              {item.gaps.map((gap) => <option key={gap.category} value={gap.category}>{gap.category.replaceAll('_', ' ')} · {gap.priority}</option>)}</select>
            <label htmlFor="ql223-evidence">Fictional evidence follow-up status</label>
            <select id="ql223-evidence" value={evidence} onChange={(event) => setEvidence(event.target.value as Ql223Evidence)}>
              <option value="REQUEST_PENDING_UNSENT">Evidence request pending · unsent</option>
              <option value="FICTIONAL_REFRESH_NOTED">Invented refreshed evidence noted · unverified</option>
              <option value="FICTIONAL_EXCEPTION_RECURRED">Invented exception recurred · unverified</option></select>
            <label htmlFor="ql223-route">Owner follow-up routing · draft only</label>
            <select id="ql223-route" value={route} onChange={(event) => setRoute(event.target.value as Ql223OwnerRoute)}>
              <option value="CONTINUE_HOLD_DRAFT">Continue all holds · unsent</option>
              <option value="REQUEST_MORE_EVIDENCE_DRAFT">Request new evidence · unsent</option>
              <option value="REFER_INDEPENDENT_DRAFT">Refer for independent recheck · draft only</option></select>
            <label htmlFor="ql223-note">Fictional follow-up note (8–180 characters)</label>
            <textarea id="ql223-note" rows={3} maxLength={180} value={note} onChange={(event) => setNote(event.target.value)} placeholder="Invented review descriptions only. No real customer or reviewer details." />
            <button type="button" disabled={!selectedCategory || note.trim().length < 8} onClick={() => { if (selectedCategory) change((previous, id) => recordQl223FollowUp(sources, previous, organization.id, id, selectedCategory, evidence, route, note)); setNote(''); }}>Record fictional evidence follow-up · UNSENT</button>
            <button type="button" disabled={item.record.cycle >= 12} onClick={() => change((previous, id) => advanceQl223Cycle(sources, previous, organization.id, id))}>Advance simulated owner aging cycle (+1)</button>
            <small>Two cycles after a decision is approaching due; three cycles is overdue. No reminder is actually sent. Repeated evidence exceptions count once per gap per cycle.</small></div>
          <section className="ql219-checklist" aria-labelledby="ql223-checks"><h5 id="ql223-checks">Conditional hold oversight · unverified checks</h5>
            {QL223_CHECKS.map((check) => <article key={check.id} className="ql219-check"><div><strong>{check.title}</strong><p>{check.detail}</p></div>
              <button type="button" disabled={item.record?.checks[check.id] === 'ACKNOWLEDGED_UNVERIFIED'} onClick={() => change((previous, id) => acknowledgeQl223Check(sources, previous, organization.id, id, check.id))}>
                {item.record?.checks[check.id] === 'ACKNOWLEDGED_UNVERIFIED' ? 'Locally reviewed · UNVERIFIED' : 'Acknowledge conditional hold · UNVERIFIED'}</button></article>)}
          </section>
          <button type="button" disabled={!item.readyForLocalAudit} onClick={() => change((previous, id) => prepareQl223HoldOversight(sources, previous, organization.id, id))}>Prepare follow-up &amp; conditional hold oversight packet · NO RELEASE</button>
        </> : <p className="ql218-prepared" role="status">Fictional QL-223 owner aging and conditional hold oversight packet prepared locally. No actual owner approval, evidence verification or release.</p>}
      </>}
      <div className="ql218-actions"><button type="button" onClick={() => onNavigate('exception')}>Inspect QL-222 decisions</button>
        <button type="button" onClick={() => onNavigate('refresh')}>Inspect QL-221 refresh</button></div>
    </section>}</div>
    <section className="ql218-panel" aria-labelledby="ql223-holds"><h4 id="ql223-holds">Actual independent pilot release-hold register · read only</h4>
      <p>Expected <strong>{company.holdAudit.expected}</strong> · Observed <strong>{company.holdAudit.observed}</strong> · HELD_UNVERIFIED <strong>{company.holdAudit.held}</strong> · Conditional release <strong>BLOCKED</strong>.</p>
      <div className="ql218-scroll"><table><thead><tr><th scope="col">QL-181 prerequisite</th><th scope="col">Real evidence required</th><th scope="col">Actual status</th></tr></thead>
        <tbody>{portfolio.prerequisites.map((hold) => <tr key={hold.id}><th scope="row">{hold.title}</th><td>{hold.requiredBeforePilot}</td><td>{hold.state}</td></tr>)}</tbody></table></div>
    </section>
    <section className="ql218-panel" aria-labelledby="ql223-receipt-title"><h4 id="ql223-receipt-title">Redacted owner aging &amp; conditional hold receipt</h4>
      <button type="button" aria-expanded={showReceipt} aria-controls="ql223-receipt" onClick={() => setShowReceipt((value) => !value)}>{showReceipt ? 'Hide' : 'Show'} local QL-223 audit receipt</button>
      {showReceipt && <div id="ql223-receipt"><p>Status codes and ages only; no note text, source tokens, reviewer identities or customer information.</p>
        <textarea readOnly rows={15} aria-label="Fixture-only QL-223 aging and hold oversight receipt" value={ql223CompanyReceipt(sources, ledger, organization.id)} /></div>}
    </section>
    <p className="ql218-foot">Software Production GREEN does not mean pilot approval. Live phone/SMS and all real release actions remain disabled.</p>
  </section>;
}

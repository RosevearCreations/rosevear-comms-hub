import { useState, type Dispatch, type SetStateAction } from 'react';
import type { OperatorOrganization, OperatorWorkspace } from './ql191Organizations';
import type { Ql211ScenarioId } from './ql211OwnerTrial';
import type { Ql214GapCategory } from './ql214ReviewIntake';
import { QL226_RELEASE, QL226_CHECKS, ql226CompanyReopens, ql226Portfolio,
  ql226CompanyReceipt, beginQl226Reopen, recordQl226Reopen, advanceQl226Cycle,
  acknowledgeQl226Check, prepareQl226HoldRecheck,
  type Ql226Sources, type Ql226Ledger, type Ql226Outcome, type Ql226Route } from './ql226RecurrenceReopen';
import './ql226-recurrence-reopen-audit.css';

const sourceText: Record<string, string> = {
  AWAITING_PREPARED_QL225: 'Awaiting current, prepared fictional QL-225 evidence disposition',
  SOURCE_CURRENT: 'Prepared QL-225 evidence dispositions match',
  QL225_DISPOSITION_REVISED: 'FROZEN · QL-225 evidence disposition was revised',
  UPSTREAM_STALE: 'FROZEN · upstream independent evidence is no longer current'
};

export function Ql226RecurrenceReopenAudit({ organization, sources, ledger, setLedger, onNavigate }: {
  organization: OperatorOrganization;
  sources: Ql226Sources;
  ledger: Ql226Ledger;
  setLedger: Dispatch<SetStateAction<Ql226Ledger>>;
  onNavigate: (workspace: OperatorWorkspace) => void;
}) {
  const [selected, setSelected] = useState<Ql211ScenarioId | null>(null);
  const [category, setCategory] = useState<Ql214GapCategory | ''>('');
  const [outcome, setOutcome] = useState<Ql226Outcome>('MONITOR_OPEN_UNVERIFIED');
  const [route, setRoute] = useState<Ql226Route>('MAINTAIN_HOLD_DRAFT');
  const [note, setNote] = useState('');
  const [help, setHelp] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const portfolio = ql226Portfolio(sources, ledger);
  const company = ql226CompanyReopens(sources, ledger, organization.id);
  const item = company.cases.find((entry) => entry.scenario === selected) ?? company.cases[0];
  const selectedCategory = category && item?.gaps.some((gap) => gap.category === category) ? category : item?.gaps[0]?.category;
  const selectedGap = item?.gaps.find((gap) => gap.category === selectedCategory);
  function change(operation: (previous: Ql226Ledger, scenario: Ql211ScenarioId) => Ql226Ledger) {
    if (item) setLedger((previous) => operation(previous, item.scenario));
  }

  return <section className="ql218-workbench ql226-workbench" data-ql226-release={QL226_RELEASE} data-organization={organization.id} aria-labelledby="ql226-title">
    <header className="ql218-header"><div><p className="ql191-eyebrow">QL-226 · Independent recurrence &amp; owner follow-up reopen · Disabled preview</p>
      <h3 id="ql226-title">Four-company independent evidence recurrence, owner reopen &amp; held release</h3>
      <p>Rehearse repeated independent evidence exceptions, simulated owner follow-up reopening and unchanged conditional release holds.</p></div>
      <button type="button" aria-expanded={help} aria-controls="ql226-help" onClick={() => setHelp((value) => !value)}>ⓘ Recurrence &amp; reopen help</button></header>
    <div className="ql218-warning" role="note"><strong>NO REAL REOPEN OR RELEASE.</strong> All {portfolio.prerequisites.length} actual QL-181 prerequisites remain HELD_UNVERIFIED. Outcomes, referrals and owner decisions are fictional, untransmitted drafts. No real calls, SMS, provider actions or database writes.</div>
    {help && <p className="ql218-help" id="ql226-help">Start with a current, locally prepared QL-225 evidence disposition packet. Reassess invented outcomes and draft owner follow-ups for every gap. Reopened fictional exceptions increase recurrence history once per gap and simulated cycle, even after follow-up refresh. Two untouched cycles is due soon, three is overdue and requires independent referral to refresh. High-priority, recurrent, historically escalated or reopened evidence requires independent referral for local packet preparation. Source revisions freeze the case until a confirmed case-only reset; none of these actions releases a real pilot hold.</p>}
    <div className="ql218-metrics" role="status">
      <div><small>Eligible QL-225 packets</small><strong>{portfolio.eligible}</strong><span>Four separate companies</span></div>
      <div><small>Invented reopened / historical</small><strong>{portfolio.reopened} / {portfolio.reopenEvents}</strong><span>History retained after refresh</span></div>
      <div><small>Due soon / overdue</small><strong>{portfolio.dueSoon} / {portfolio.overdue}</strong><span>Simulated follow-up cycles</span></div>
      <div><small>Local packets / stale</small><strong>{portfolio.prepared} / {portfolio.stale}</strong><span>All actual holds intact</span></div>
    </div>
    <section className="ql218-panel" aria-labelledby="ql226-portfolio"><h4 id="ql226-portfolio">Four-company independent recurrence &amp; conditional hold overview</h4>
      <div className="ql218-scroll"><table><caption>Invented evidence recurrence and aging only; actual independent closure remains unverified.</caption>
        <thead><tr><th scope="col">Company</th><th scope="col">Eligible</th><th scope="col">Tracking</th><th scope="col">Undecided</th><th scope="col">Reopened</th><th scope="col">Repeat events</th><th scope="col">Due soon</th><th scope="col">Overdue</th><th scope="col">Overdue history</th><th scope="col">Referral due</th><th scope="col">Prepared</th><th scope="col">Stale</th><th scope="col">Holds</th></tr></thead>
        <tbody>{portfolio.companies.map((row) => <tr key={row.company}><th scope="row">{row.company === 'rosiedazzlers' ? 'Rosie Dazzlers' : row.company === 'devilndove' ? 'Devil n Dove' : row.company === 'icamp' ? 'iCamp' : 'YW · Property Maintenance'}</th>
          <td>{row.eligible}</td><td>{row.tracking}</td><td>{row.undecided}</td><td>{row.reopened}</td><td>{row.reopenEvents}</td><td>{row.dueSoon}</td><td>{row.overdue}</td><td>{row.overdueFollowUps}</td><td>{row.referralsDue}</td><td>{row.prepared}</td><td>{row.stale}</td><td>{row.holdAudit.held}/12 HELD</td></tr>)}</tbody></table></div>
    </section>
    <div className="ql218-grid"><section className="ql218-panel" aria-labelledby="ql226-cases"><h4 id="ql226-cases">{organization.name} · Fictional reopened cases</h4>
      {company.cases.length === 0 ? <p>No synthetic trial case exists. <button type="button" onClick={() => onNavigate('trial')}>Open owner trial</button></p> :
        <div role="group" aria-label="Select recurrence and reopen case">{company.cases.map((candidate) => <button type="button" key={candidate.scenario}
          className={candidate.scenario === item?.scenario ? 'ql218-case active' : 'ql218-case'} aria-pressed={candidate.scenario === item?.scenario}
          onClick={() => { setSelected(candidate.scenario); setCategory(''); setNote(''); setConfirmReset(false); }}>
          <strong>{candidate.title}</strong><span>{candidate.priority} · {sourceText[candidate.sourceStatus]} · {candidate.reopenEvents} invented reopen event(s)</span></button>)}</div>}
      {company.orphaned > 0 && <p role="alert" className="ql218-warning">{company.orphaned} orphaned records remain held and cannot be silently closed.</p>}
    </section>
    {item && <section className="ql218-panel" aria-labelledby="ql226-selected"><h4 id="ql226-selected">{item.title} · Owner follow-up reopen audit</h4>
      <p className="ql218-source">Source <strong>{sourceText[item.sourceStatus]}</strong> · Prepared QL-225 <strong>{item.prepared ? 'yes · fictional only' : 'no'}</strong>.</p>
      {!item.eligible && <div className="ql218-warning">A current, locally prepared QL-225 packet is required. <button type="button" onClick={() => onNavigate('disposition')}>Inspect QL-225 source</button></div>}
      {item.eligible && !item.record && <button type="button" onClick={() => change((previous, id) => beginQl226Reopen(sources, previous, organization.id, id))}>Begin fictional recurrence &amp; reopen review</button>}
      {item.record && item.sourceStatus !== 'SOURCE_CURRENT' && <div className="ql218-warning" role="alert"><p>Review frozen: QL-225 or earlier evidence changed. No previous independent result is considered verified.</p>
        <button type="button" aria-expanded={confirmReset} onClick={() => setConfirmReset(true)}>Review case-only recurrence reset</button>
        {confirmReset && <div><p>Replace this one invented QL-226 case and its local history, preserving every other company and case. Requires a current, prepared QL-225 source.</p>
          <button type="button" disabled={!item.eligible} onClick={() => { change((previous, id) => beginQl226Reopen(sources, previous, organization.id, id)); setConfirmReset(false); setNote(''); }}>Confirm case-only recurrence reset</button>
          <button type="button" onClick={() => setConfirmReset(false)}>Cancel reset</button></div>}</div>}
      {item.record && item.sourceStatus === 'SOURCE_CURRENT' && <>
        <p className="ql222-cycle" role="status">Synthetic cycle <strong>{item.record.cycle}/12</strong> · Undecided <strong>{item.undecided}</strong> · Reopened <strong>{item.reopened}</strong> · Overdue <strong>{item.overdue}</strong> · Independent referrals due <strong>{item.referralsDue}</strong>.</p>
        <section aria-labelledby="ql226-gaps"><h5 id="ql226-gaps">Independent disposition gaps ({item.gaps.length})</h5>
          {item.gaps.map((gap) => <article key={gap.category} className="ql218-gap"><h6>{gap.category.replaceAll('_', ' ')} · {gap.priority}</h6>
            <p>QL-225 disposition <strong>{gap.disposition.replaceAll('_', ' ')}</strong> · Reopen outcome <strong>{gap.outcome.replaceAll('_', ' ')}</strong>.</p>
            <p>Unsent follow-up <strong>{gap.reopenRoute.replaceAll('_', ' ')}</strong> · Synthetic age <strong>{gap.followUpAge === null ? 'NOT TRACKED' : `${gap.followUpAge} cycle(s)`}</strong> · Next due <strong>{gap.nextDueCycle ?? 'NOT SET'}</strong>.</p>
            {gap.dueSoon && <p className="ql223-approaching">Simulated owner follow-up approaching deadline.</p>}
            {gap.overdue && <p className="ql219-due">Overdue. Only unsent independent referral can refresh the follow-up; history is preserved.</p>}
            {gap.referralMissing && <p className="ql219-due">Independent draft referral still required for source recurrence or reopened outcome.</p>}
            <p>Fictional reopen events <strong>{gap.reopenEvents}</strong> · Past overdue follow-ups <strong>{gap.overdueFollowUps}</strong> · Real independent result <strong>UNVERIFIED</strong>.</p></article>)}
        </section>
        {item.record.phase === 'independent_recurrence_reopen_draft' ? <>
          <div className="ql218-form"><label htmlFor="ql226-gap">Independent evidence gap</label>
            <select id="ql226-gap" value={selectedCategory ?? ''} onChange={(event) => { setCategory(event.target.value as Ql214GapCategory); setNote(''); }}>
              {item.gaps.map((gap) => <option key={gap.category} value={gap.category}>{gap.category.replaceAll('_', ' ')} · {gap.reopenEvents} reopened event(s)</option>)}</select>
            <label htmlFor="ql226-outcome">Fictional independent evidence recurrence outcome</label>
            <select id="ql226-outcome" value={outcome} onChange={(event) => setOutcome(event.target.value as Ql226Outcome)}>
              <option value="MONITOR_OPEN_UNVERIFIED">Monitor open exception · unverified</option>
              <option value="REOPENED_EXCEPTION_UNVERIFIED">Reopened fictional exception · unverified</option>
              <option value="SIMULATED_RECHECK_RECORDED_UNVERIFIED">Simulated recheck noted · unverified</option></select>
            <label htmlFor="ql226-route">Owner follow-up and independent route · UNSENT</label>
            <select id="ql226-route" value={route} onChange={(event) => setRoute(event.target.value as Ql226Route)}>
              <option value="MAINTAIN_HOLD_DRAFT">Maintain conditional hold · draft</option>
              <option value="REQUEST_EVIDENCE_DRAFT">Request evidence · unsent</option>
              <option value="REFER_INDEPENDENT_DRAFT">Refer independent follow-up · unsent</option></select>
            <label htmlFor="ql226-note">Fictional owner reopen note (8–180 characters)</label>
            <textarea id="ql226-note" rows={3} maxLength={180} value={note} onChange={(event) => setNote(event.target.value)} placeholder="Synthetic examples only; no real names, customer data or reviewer information." />
            <button type="button" disabled={!selectedCategory || note.trim().length < 8 || !!selectedGap?.overdue && route !== 'REFER_INDEPENDENT_DRAFT'}
              onClick={() => { if (selectedCategory) change((previous, id) => recordQl226Reopen(sources, previous, organization.id, id, selectedCategory, outcome, route, note)); setNote(''); }}>Record fictional recurrence &amp; owner reopen · UNSENT</button>
            <button type="button" disabled={item.record.cycle >= 12} onClick={() => change((previous, id) => advanceQl226Cycle(sources, previous, organization.id, id))}>Advance synthetic owner reopen follow-up cycle (+1)</button>
            <small>Reopening events are counted once per gap/cycle. No simulated recheck ever resolves a real QL-181 hold.</small></div>
          <section className="ql219-checklist" aria-labelledby="ql226-checks"><h5 id="ql226-checks">Conditional release hold continuity · local UNVERIFIED checks</h5>
            {QL226_CHECKS.map((check) => <article key={check.id} className="ql219-check"><div><strong>{check.title}</strong><p>{check.detail}</p></div>
              <button type="button" disabled={item.record?.checks[check.id] === 'ACKNOWLEDGED_UNVERIFIED'} onClick={() => change((previous, id) => acknowledgeQl226Check(sources, previous, organization.id, id, check.id))}>
                {item.record?.checks[check.id] === 'ACKNOWLEDGED_UNVERIFIED' ? 'Reviewed locally · UNVERIFIED' : 'Acknowledge conditional hold · UNVERIFIED'}</button></article>)}
          </section>
          <button type="button" disabled={!item.readyForLocalAudit} onClick={() => change((previous, id) => prepareQl226HoldRecheck(sources, previous, organization.id, id))}>Prepare reopened evidence &amp; conditional hold recheck packet · NO RELEASE</button>
        </> : <p className="ql218-prepared" role="status">Fictional QL-226 reopened recurrence and conditional release hold recheck packet prepared locally. No actual evidence closure, independent sign-off or pilot release.</p>}
      </>}
      <div className="ql218-actions"><button type="button" onClick={() => onNavigate('disposition')}>Inspect QL-225 dispositions</button>
        <button type="button" onClick={() => onNavigate('overdue')}>Inspect QL-224 escalations</button></div>
    </section>}</div>
    <section className="ql218-panel" aria-labelledby="ql226-holds"><h4 id="ql226-holds">Actual QL-181 pilot prerequisites · read-only hold recheck</h4>
      <p>Expected <strong>{company.holdAudit.expected}</strong> · Observed <strong>{company.holdAudit.observed}</strong> · HELD_UNVERIFIED <strong>{company.holdAudit.held}</strong> · Conditional release <strong>BLOCKED</strong>.</p>
      <div className="ql218-scroll"><table><thead><tr><th scope="col">QL-181 prerequisite</th><th scope="col">Real evidence still required</th><th scope="col">Actual state</th></tr></thead>
        <tbody>{portfolio.prerequisites.map((hold) => <tr key={hold.id}><th scope="row">{hold.title}</th><td>{hold.requiredBeforePilot}</td><td>{hold.state}</td></tr>)}</tbody></table></div>
    </section>
    <section className="ql218-panel" aria-labelledby="ql226-receipt"><h4 id="ql226-receipt">Redacted independent recurrence and conditional hold receipt</h4>
      <button type="button" aria-expanded={showReceipt} aria-controls="ql226-receipt-data" onClick={() => setShowReceipt((value) => !value)}>{showReceipt ? 'Hide' : 'Show'} local QL-226 audit receipt</button>
      {showReceipt && <div id="ql226-receipt-data"><p>Only coded outcomes, invented cycle ages and counts. No source tokens, reviewer identities or private notes.</p>
        <textarea readOnly rows={15} aria-label="Fixture-only QL-226 recurrence reopen receipt" value={ql226CompanyReceipt(sources, ledger, organization.id)} /></div>}
    </section>
    <p className="ql218-foot">Software production GREEN never means pilot authorization. Real independent review, live calls and SMS remain blocked.</p>
  </section>;
}

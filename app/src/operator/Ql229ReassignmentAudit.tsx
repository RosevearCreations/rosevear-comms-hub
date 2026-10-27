import { useState, type Dispatch, type SetStateAction } from 'react';
import type { OperatorOrganization, OperatorWorkspace } from './ql191Organizations';
import type { Ql211ScenarioId } from './ql211OwnerTrial';
import type { Ql214GapCategory } from './ql214ReviewIntake';
import { QL229_RELEASE, QL229_CHECKS, ql229CompanyReassignment, ql229Portfolio, ql229CompanyReceipt,
  beginQl229Reassessment, recordQl229Reassignment, advanceQl229Cycle, acknowledgeQl229Check,
  prepareQl229HoldReassessment, type Ql229Sources, type Ql229Ledger, type Ql229Outcome,
  type Ql229FollowUp } from './ql229ReassignmentAudit';
import './ql229-reassignment-audit.css';

const sourceDescription: Record<string, string> = {
  AWAITING_PREPARED_QL228: 'Awaiting prepared fictional QL-228 independent handoff packet',
  SOURCE_CURRENT: 'Prepared QL-228 independent handoff source matches',
  QL228_HANDOFF_OUTCOME_REVISED: 'FROZEN · QL-228 reassignment handoff evidence changed',
  UPSTREAM_STALE: 'FROZEN · prior independent handoff no longer current'
};

export function Ql229ReassignmentAudit({ organization, sources, ledger, setLedger, onNavigate }: {
  organization: OperatorOrganization;
  sources: Ql229Sources;
  ledger: Ql229Ledger;
  setLedger: Dispatch<SetStateAction<Ql229Ledger>>;
  onNavigate: (workspace: OperatorWorkspace) => void;
}) {
  const [selected, setSelected] = useState<Ql211ScenarioId | null>(null);
  const [category, setCategory] = useState<Ql214GapCategory | ''>('');
  const [outcome, setOutcome] = useState<Ql229Outcome>('REASSIGNMENT_EVIDENCE_OPEN_UNVERIFIED');
  const [followUp, setFollowUp] = useState<Ql229FollowUp>('MAINTAIN_HELD_REVIEW_DRAFT');
  const [note, setNote] = useState('');
  const [help, setHelp] = useState(false);
  const [reset, setReset] = useState(false);
  const [receiptOpen, setReceiptOpen] = useState(false);
  const portfolio = ql229Portfolio(sources, ledger);
  const company = ql229CompanyReassignment(sources, ledger, organization.id);
  const item = company.cases.find((candidate) => candidate.scenario === selected) ?? company.cases[0];
  const selectedCategory = category && item?.gaps.some((gap) => gap.category === category) ? category : item?.gaps[0]?.category;
  const selectedGap = item?.gaps.find((gap) => gap.category === selectedCategory);
  function change(operation: (previous: Ql229Ledger, scenario: Ql211ScenarioId) => Ql229Ledger) {
    if (item) setLedger((previous) => operation(previous, item.scenario));
  }
  return <section className="ql218-workbench ql229-workbench" data-ql229-release={QL229_RELEASE} data-organization={organization.id} aria-labelledby="ql229-title">
    <header className="ql218-header"><div><p className="ql191-eyebrow">QL-229 · Independent handoff aging &amp; reassignment outcomes · Disabled preview</p>
      <h3 id="ql229-title">Four-company independent handoff aging, reassignment reconciliation &amp; release-hold reassessment</h3>
      <p>Reassess fictional handoff exceptions, record unsent independent decisions, and preserve every real-world release hold.</p></div>
      <button type="button" aria-expanded={help} aria-controls="ql229-help" onClick={() => setHelp((value) => !value)}>ⓘ Reassignment &amp; hold help</button></header>
    <div className="ql218-warning" role="note"><strong>NO REAL INDEPENDENT DECISION OR PROVIDER ACTION.</strong> All {portfolio.prerequisites.length} actual QL-181 prerequisites remain HELD_UNVERIFIED. This session-only review makes no Supabase writes or outbound calls/SMS and contacts no customer or reviewer.</div>
    {help && <p className="ql218-help" id="ql229-help">Start from a current prepared fictional QL-228 handoff continuity packet. Reconcile each simulated reassignment outcome and write an unsent reviewer follow-up. Imagined conflicts count once per gap per cycle; historical episodes persist. Two cycles is approaching, three is overdue and requires an independent recheck referral draft. P0, repeated, disputed and historically overdue handoffs also require an independent recheck. Complete every gap and three local UNVERIFIED checks without overdue/referral debt before preparing a held audit packet. An upstream change freezes this audit until an explicit case-only reset. Real release remains blocked regardless of simulated findings.</p>}
    <div className="ql218-metrics" role="status">
      <div><small>Eligible cases</small><strong>{portfolio.eligible}</strong><span>Four separate company ledgers</span></div>
      <div><small>Reassignment conflicts / events</small><strong>{portfolio.conflicting} / {portfolio.conflictEvents}</strong><span>Synthetic outcomes only</span></div>
      <div><small>Due soon / overdue</small><strong>{portfolio.dueSoon} / {portfolio.overdue}</strong><span>Invented handoff cycles</span></div>
      <div><small>Prepared / stale</small><strong>{portfolio.prepared} / {portfolio.stale}</strong><span>Local held packets only</span></div>
    </div>
    <section className="ql218-panel" aria-labelledby="ql229-portfolio"><h4 id="ql229-portfolio">Four-company reassignment outcome and hold overview</h4>
      <div className="ql218-scroll"><table><caption>Fictional rehearsal counts. No actual reviewer, owner approval or release authorization.</caption>
        <thead><tr><th scope="col">Company</th><th scope="col">Eligible</th><th scope="col">Tracking</th><th scope="col">Unreviewed</th><th scope="col">Due soon</th><th scope="col">Overdue</th><th scope="col">Past overdue</th><th scope="col">Recheck missing</th><th scope="col">Conflicts</th><th scope="col">Prepared</th><th scope="col">Stale</th><th scope="col">Holds</th></tr></thead>
        <tbody>{portfolio.companies.map((row) => <tr key={row.company}><th scope="row">{row.company === 'rosiedazzlers' ? 'Rosie Dazzlers' : row.company === 'devilndove' ? 'Devil n Dove' : row.company === 'icamp' ? 'iCamp' : 'YW · Property Maintenance'}</th>
          <td>{row.eligible}</td><td>{row.tracking}</td><td>{row.unreviewed}</td><td>{row.dueSoon}</td><td>{row.overdue}</td><td>{row.overdueEpisodes}</td><td>{row.rechecksDue}</td><td>{row.conflictEvents}</td><td>{row.prepared}</td><td>{row.stale}</td><td>{row.holdAudit.held}/12 HELD</td></tr>)}</tbody></table></div>
    </section>
    <div className="ql218-grid"><section className="ql218-panel" aria-labelledby="ql229-cases"><h4 id="ql229-cases">{organization.name} · Fictional independent handoff cases</h4>
      {company.cases.length === 0 ? <p>No fictional trial finding exists. <button type="button" onClick={() => onNavigate('trial')}>Open owner trial</button></p> :
        <div role="group" aria-label="Select reassignment follow-up case">{company.cases.map((candidate) => <button type="button" key={candidate.scenario}
          className={candidate.scenario === item?.scenario ? 'ql218-case active' : 'ql218-case'} aria-pressed={candidate.scenario === item?.scenario}
          onClick={() => { setSelected(candidate.scenario); setCategory(''); setNote(''); setReset(false); }}>
          <strong>{candidate.title}</strong><span>{candidate.priority} · {sourceDescription[candidate.sourceStatus]} · {candidate.overdueEpisodes} historical late follow-up(s)</span></button>)}</div>}
      {company.orphaned > 0 && <p className="ql218-warning" role="alert">{company.orphaned} orphaned reassignment case(s) remain held.</p>}
    </section>
    {item && <section className="ql218-panel" aria-labelledby="ql229-selected"><h4 id="ql229-selected">{item.title} · Reassignment reconciliation and independent review</h4>
      <p className="ql218-source">Source: <strong>{sourceDescription[item.sourceStatus]}</strong> · Prepared QL-228: <strong>{item.eligible ? 'yes · fictional only' : 'no'}</strong>.</p>
      {!item.eligible && <div className="ql218-warning">A current prepared QL-228 handoff audit is required. <button type="button" onClick={() => onNavigate('handoff_continuity')}>Inspect QL-228 source</button></div>}
      {item.eligible && !item.record && <button type="button" onClick={() => change((previous, id) => beginQl229Reassessment(sources, previous, organization.id, id))}>Begin fictional reassignment outcome &amp; held-release reassessment</button>}
      {item.record && item.sourceStatus !== 'SOURCE_CURRENT' && <div className="ql218-warning" role="alert"><p>Audit frozen: the independent handoff evidence source changed. No prior reassignment outcome can be accepted as real independent verification.</p>
        <button type="button" aria-expanded={reset} onClick={() => setReset(true)}>Review case-only reassignment reset</button>
        {reset && <div><p>Replace only this QL-229 fictional case with current prepared QL-228 evidence. Other company records are preserved.</p>
          <button type="button" disabled={!item.eligible} onClick={() => { change((previous, id) => beginQl229Reassessment(sources, previous, organization.id, id)); setReset(false); setNote(''); }}>Confirm case-only reassignment reset</button>
          <button type="button" onClick={() => setReset(false)}>Cancel reset</button></div>}</div>}
      {item.record && item.sourceStatus === 'SOURCE_CURRENT' && <>
        <p className="ql222-cycle" role="status">Simulated cycle <strong>{item.record.cycle}/12</strong> · Unreviewed <strong>{item.unreviewed}</strong> · Due soon <strong>{item.dueSoon}</strong> · Overdue <strong>{item.overdue}</strong> · Independent rechecks due <strong>{item.rechecksDue}</strong>.</p>
        <section aria-labelledby="ql229-gaps"><h5 id="ql229-gaps">Reassignment evidence gaps ({item.gaps.length})</h5>
          {item.gaps.map((gap) => <article className="ql218-gap" key={gap.category}><h6>{gap.category.replaceAll('_', ' ')} · {gap.priority}</h6>
            <p>QL-228 handoff <strong>{gap.handoff.replaceAll('_', ' ')}</strong> · Reassignment outcome <strong>{gap.reassignmentOutcome.replaceAll('_', ' ')}</strong>.</p>
            <p>Follow-up route <strong>{gap.reassignmentFollowUp.replaceAll('_', ' ')}</strong> · Age <strong>{gap.followUpAge === null ? 'NOT TRACKED' : `${gap.followUpAge} cycle(s)`}</strong> · Next due cycle <strong>{gap.nextDueCycle ?? 'NOT SET'}</strong>.</p>
            {gap.dueSoon && <p className="ql223-approaching">Imagined handoff decision due soon.</p>}
            {gap.overdue && <p className="ql219-due">Overdue. Refresh requires an unsent independent recheck referral; historical episodes persist.</p>}
            {gap.recheckMissing && <p className="ql219-due">Independent recheck draft required for priority, disputed or repeated handoff evidence.</p>}
            <p>Conflict events <strong>{gap.reassignmentConflicts}</strong> · Historical overdue <strong>{gap.overdueEpisodes}</strong> · Actual reviewer approval <strong>UNVERIFIED</strong>.</p></article>)}
        </section>
        {item.record.phase === 'independent_handoff_exception_reassignment_review_draft' ? <>
          <div className="ql218-form"><label htmlFor="ql229-gap">Handoff gap</label>
            <select id="ql229-gap" value={selectedCategory ?? ''} onChange={(event) => { setCategory(event.target.value as Ql214GapCategory); setNote(''); }}>
              {item.gaps.map((gap) => <option key={gap.category} value={gap.category}>{gap.category.replaceAll('_', ' ')} · {gap.reassignmentConflicts} reassignment conflicts</option>)}</select>
            <label htmlFor="ql229-outcome">Reassignment outcome · fictional/UNVERIFIED</label>
            <select id="ql229-outcome" value={outcome} onChange={(event) => setOutcome(event.target.value as Ql229Outcome)}>
              <option value="REASSIGNMENT_EVIDENCE_OPEN_UNVERIFIED">Reassignment evidence still open · UNVERIFIED</option>
              <option value="SIMULATED_REASSIGNMENT_MATCH_UNVERIFIED">Imagined reassignment match · UNVERIFIED</option>
              <option value="SIMULATED_REASSIGNMENT_CONFLICT_UNVERIFIED">Invented reassignment conflict · UNVERIFIED</option></select>
            <label htmlFor="ql229-followup">Independent reviewer follow-up · UNSENT</label>
            <select id="ql229-followup" value={followUp} onChange={(event) => setFollowUp(event.target.value as Ql229FollowUp)}>
              <option value="MAINTAIN_HELD_REVIEW_DRAFT">Maintain held follow-up · draft</option>
              <option value="REQUEST_REASSIGNMENT_EVIDENCE_DRAFT">Request reassignment evidence · unsent</option>
              <option value="REFER_INDEPENDENT_RECHECK_DRAFT">Refer independent recheck · unsent</option></select>
            <label htmlFor="ql229-note">Fictional reconciliation note (8–180 characters)</label>
            <textarea id="ql229-note" rows={3} maxLength={180} value={note} onChange={(event) => setNote(event.target.value)} placeholder="Synthetic note only; no real customer or independent reviewer information." />
            <button type="button" disabled={!selectedCategory || note.trim().length < 8 || (!!selectedGap?.overdue && followUp !== 'REFER_INDEPENDENT_RECHECK_DRAFT')}
              onClick={() => { if (selectedCategory) change((previous, id) => recordQl229Reassignment(sources, previous, organization.id, id, selectedCategory, outcome, followUp, note)); setNote(''); }}>Record fictional reassignment &amp; independent review · UNSENT</button>
            <button type="button" disabled={item.record.cycle >= 12} onClick={() => change((previous, id) => advanceQl229Cycle(sources, previous, organization.id, id))}>Advance synthetic reassignment aging cycle (+1)</button>
            <small>Two fictional cycles is due soon; three is overdue. Simulated reassignment never proves actual independent disposition.</small></div>
          <section className="ql219-checklist" aria-labelledby="ql229-checks"><h5 id="ql229-checks">Independent reassignment &amp; release hold · local UNVERIFIED checks</h5>
            {QL229_CHECKS.map((check) => <article key={check.id} className="ql219-check"><div><strong>{check.title}</strong><p>{check.detail}</p></div>
              <button type="button" disabled={item.record?.checks[check.id] === 'ACKNOWLEDGED_UNVERIFIED'} onClick={() => change((previous, id) => acknowledgeQl229Check(sources, previous, organization.id, id, check.id))}>
                {item.record?.checks[check.id] === 'ACKNOWLEDGED_UNVERIFIED' ? 'Locally reviewed · UNVERIFIED' : 'Acknowledge reassessment · UNVERIFIED'}</button></article>)}
          </section>
          <button type="button" disabled={!item.readyForLocalAudit} onClick={() => change((previous, id) => prepareQl229HoldReassessment(sources, previous, organization.id, id))}>Prepare reassignment &amp; conditional hold reassessment packet · NO RELEASE</button>
        </> : <p className="ql218-prepared" role="status">QL-229 fictional reassignment and conditional hold reassessment packet prepared locally. Actual independent reviewer disposition and release remain blocked.</p>}
      </>}
      <div className="ql218-actions"><button type="button" onClick={() => onNavigate('handoff_continuity')}>Inspect QL-228 handoff continuity</button>
        <button type="button" onClick={() => onNavigate('evidence_audit')}>Inspect QL-227 evidence audit</button></div>
    </section>}</div>
    <section className="ql218-panel" aria-labelledby="ql229-holds"><h4 id="ql229-holds">Actual QL-181 prerequisites · read-only conditional hold reassessment</h4>
      <p>Expected <strong>{company.holdAudit.expected}</strong> · Observed <strong>{company.holdAudit.observed}</strong> · HELD_UNVERIFIED <strong>{company.holdAudit.held}</strong> · Conditional release <strong>BLOCKED</strong>.</p>
      <div className="ql218-scroll"><table><thead><tr><th scope="col">QL-181 prerequisite</th><th scope="col">Real-world verification required</th><th scope="col">State</th></tr></thead>
        <tbody>{portfolio.prerequisites.map((hold) => <tr key={hold.id}><th scope="row">{hold.title}</th><td>{hold.requiredBeforePilot}</td><td>{hold.state}</td></tr>)}</tbody></table></div>
    </section>
    <section className="ql218-panel" aria-labelledby="ql229-receipt"><h4 id="ql229-receipt">Redacted independent reassignment &amp; held-release receipt</h4>
      <button type="button" aria-expanded={receiptOpen} aria-controls="ql229-receipt-data" onClick={() => setReceiptOpen((open) => !open)}>{receiptOpen ? 'Hide' : 'Show'} local QL-229 reassessment receipt</button>
      {receiptOpen && <div id="ql229-receipt-data"><p>Coded invented outcomes and counts only; no private notes, reviewer names, customers or source revisions.</p>
        <textarea readOnly rows={15} aria-label="Fixture-only QL-229 reassignment receipt" value={ql229CompanyReceipt(sources, ledger, organization.id)} /></div>}
    </section>
    <p className="ql218-foot">A deployed build is not a release decision. Live telephone/SMS, owner authorization and independent pilot activation remain blocked.</p>
  </section>;
}

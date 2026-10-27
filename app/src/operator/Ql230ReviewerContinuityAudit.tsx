import { useState, type Dispatch, type SetStateAction } from 'react';
import type { OperatorOrganization, OperatorWorkspace } from './ql191Organizations';
import type { Ql211ScenarioId } from './ql211OwnerTrial';
import type { Ql214GapCategory } from './ql214ReviewIntake';
import { QL230_RELEASE, QL230_CHECKS, ql230CompanyReview, ql230Portfolio, ql230CompanyReceipt,
  beginQl230ReviewerReview, recordQl230Decision, advanceQl230Cycle, acknowledgeQl230Check,
  prepareQl230HoldAudit, type Ql230Sources, type Ql230Ledger, type Ql230Outcome,
  type Ql230ReviewerDecision } from './ql230ReviewerContinuity';
import './ql230-reviewer-continuity.css';

const sourceDescription: Record<string, string> = {
  AWAITING_PREPARED_QL229: 'Awaiting prepared fictional QL-229 reassignment audit',
  SOURCE_CURRENT: 'QL-229 reassignment source matches',
  QL229_REASSIGNMENT_REVISED: 'FROZEN · QL-229 reassignment evidence revised',
  UPSTREAM_STALE: 'FROZEN · prior reviewer evidence no longer current'
};

export function Ql230ReviewerContinuityAudit({ organization, sources, ledger, setLedger, onNavigate }: {
  organization: OperatorOrganization;
  sources: Ql230Sources;
  ledger: Ql230Ledger;
  setLedger: Dispatch<SetStateAction<Ql230Ledger>>;
  onNavigate: (workspace: OperatorWorkspace) => void;
}) {
  const [selected, setSelected] = useState<Ql211ScenarioId | null>(null);
  const [category, setCategory] = useState<Ql214GapCategory | ''>('');
  const [outcome, setOutcome] = useState<Ql230Outcome>('REASSIGNMENT_FOLLOWUP_OPEN_UNVERIFIED');
  const [decision, setDecision] = useState<Ql230ReviewerDecision>('CONTINUE_REVIEW_HELD_DRAFT');
  const [note, setNote] = useState('');
  const [help, setHelp] = useState(false);
  const [reset, setReset] = useState(false);
  const [receiptOpen, setReceiptOpen] = useState(false);
  const portfolio = ql230Portfolio(sources, ledger);
  const company = ql230CompanyReview(sources, ledger, organization.id);
  const item = company.cases.find((candidate) => candidate.scenario === selected) ?? company.cases[0];
  const selectedCategory = category && item?.gaps.some((gap) => gap.category === category) ? category : item?.gaps[0]?.category;
  const selectedGap = item?.gaps.find((gap) => gap.category === selectedCategory);
  function change(operation: (previous: Ql230Ledger, scenario: Ql211ScenarioId) => Ql230Ledger) {
    if (item) setLedger((previous) => operation(previous, item.scenario));
  }
  return <section className="ql218-workbench ql230-workbench" data-ql230-release={QL230_RELEASE} data-organization={organization.id} aria-labelledby="ql230-title">
    <header className="ql218-header"><div><p className="ql191-eyebrow">QL-230 · Reassignment follow-up recurrence &amp; reviewer aging · Disabled preview</p>
      <h3 id="ql230-title">Four-company reassignment recurrence, independent reviewer decisions &amp; conditional holds</h3>
      <p>Revisit fictional follow-up exceptions, age untransmitted independent-review decisions and preserve real release holds.</p></div>
      <button type="button" aria-expanded={help} aria-controls="ql230-help" onClick={() => setHelp((value) => !value)}>ⓘ Reviewer recurrence help</button></header>
    <div className="ql218-warning" role="note"><strong>NO ACTUAL REVIEWER, OWNER APPROVAL OR PILOT RELEASE.</strong> All {portfolio.prerequisites.length} real QL-181 prerequisites remain HELD_UNVERIFIED. This session-only preview sends no calls, SMS, reviewer requests, customer records, provider changes or Supabase writes.</div>
    {help && <p className="ql218-help" id="ql230-help">Begin from a current, locally prepared fictional QL-229 reassignment packet. For each evidence gap, note an invented follow-up outcome and unsent reviewer decision. Repeated exceptions count once per gap per simulated cycle. After two cycles a reviewer decision is due soon; after three it is overdue and must be refreshed with a separate-reviewer referral draft. P0, disputed, repeated and historically late evidence also requires separate referral. Upstream revisions freeze dependent cases until an explicit case-only reset. Preparation requires all gaps reconciled, no active overdue or referral debt, three UNVERIFIED checklist acknowledgments, and twelve real release holds still intact.</p>}
    <div className="ql218-metrics" role="status">
      <div><small>Eligible cases</small><strong>{portfolio.eligible}</strong><span>Four company boundaries</span></div>
      <div><small>Recurring / historical events</small><strong>{portfolio.recurring} / {portfolio.recurrenceEvents}</strong><span>Synthetic outcomes only</span></div>
      <div><small>Due soon / overdue</small><strong>{portfolio.dueSoon} / {portfolio.overdue}</strong><span>Invented reviewer cycles</span></div>
      <div><small>Prepared / stale</small><strong>{portfolio.prepared} / {portfolio.stale}</strong><span>Never real approval</span></div>
    </div>
    <section className="ql218-panel" aria-labelledby="ql230-portfolio"><h4 id="ql230-portfolio">Four-company independent reviewer recurrence and decision aging</h4>
      <div className="ql218-scroll"><table><caption>Fictional local review counts; no real reviewer verification or release.</caption>
        <thead><tr><th scope="col">Company</th><th scope="col">Eligible</th><th scope="col">Tracking</th><th scope="col">Unreviewed</th><th scope="col">Recurrence events</th><th scope="col">Due soon</th><th scope="col">Overdue</th><th scope="col">Historical overdue</th><th scope="col">Separate review missing</th><th scope="col">Prepared</th><th scope="col">Stale</th><th scope="col">Holds</th></tr></thead>
        <tbody>{portfolio.companies.map((row) => <tr key={row.company}><th scope="row">{row.company === 'rosiedazzlers' ? 'Rosie Dazzlers' : row.company === 'devilndove' ? 'Devil n Dove' : row.company === 'icamp' ? 'iCamp' : 'YW · Property Maintenance'}</th>
          <td>{row.eligible}</td><td>{row.tracking}</td><td>{row.unreviewed}</td><td>{row.recurrenceEvents}</td><td>{row.dueSoon}</td><td>{row.overdue}</td><td>{row.overdueReviewerDecisions}</td><td>{row.separateReviewsDue}</td><td>{row.prepared}</td><td>{row.stale}</td><td>{row.holdAudit.held}/12 HELD</td></tr>)}</tbody></table></div>
    </section>
    <div className="ql218-grid"><section className="ql218-panel" aria-labelledby="ql230-cases"><h4 id="ql230-cases">{organization.name} · Fictional reviewer follow-up cases</h4>
      {company.cases.length === 0 ? <p>No fictional finding exists. <button type="button" onClick={() => onNavigate('trial')}>Open owner trial</button></p> :
        <div role="group" aria-label="Select independent reviewer decision case">{company.cases.map((candidate) => <button type="button" key={candidate.scenario}
          className={candidate.scenario === item?.scenario ? 'ql218-case active' : 'ql218-case'} aria-pressed={candidate.scenario === item?.scenario}
          onClick={() => { setSelected(candidate.scenario); setCategory(''); setNote(''); setReset(false); }}>
          <strong>{candidate.title}</strong><span>{candidate.priority} · {sourceDescription[candidate.sourceStatus]} · {candidate.overdueReviewerDecisions} historical overdue reviewer decision(s)</span></button>)}</div>}
      {company.orphaned > 0 && <p className="ql218-warning" role="alert">{company.orphaned} orphaned synthetic case(s) remain held, not independently closed.</p>}
    </section>
    {item && <section className="ql218-panel" aria-labelledby="ql230-selected"><h4 id="ql230-selected">{item.title} · Evidence recurrence and reviewer aging</h4>
      <p className="ql218-source">Source: <strong>{sourceDescription[item.sourceStatus]}</strong> · Prepared fictional QL-229: <strong>{item.eligible ? 'yes' : 'no'}</strong>.</p>
      {!item.eligible && <div className="ql218-warning">A current prepared QL-229 reassignment audit is required. <button type="button" onClick={() => onNavigate('reassignment_audit')}>Inspect QL-229 source</button></div>}
      {item.eligible && !item.record && <button type="button" onClick={() => change((previous, id) => beginQl230ReviewerReview(sources, previous, organization.id, id))}>Begin fictional reviewer decision aging &amp; recurrence review</button>}
      {item.record && item.sourceStatus !== 'SOURCE_CURRENT' && <div className="ql218-warning" role="alert"><p>Audit frozen: upstream reassignment evidence changed. Earlier local outcomes cannot be accepted as independent verification.</p>
        <button type="button" aria-expanded={reset} onClick={() => setReset(true)}>Review case-only reviewer reset</button>
        {reset && <div><p>Replace only this synthetic QL-230 case; all other company cases remain unchanged.</p>
          <button type="button" disabled={!item.eligible} onClick={() => { change((previous, id) => beginQl230ReviewerReview(sources, previous, organization.id, id)); setReset(false); setNote(''); }}>Confirm case-only reviewer reset</button>
          <button type="button" onClick={() => setReset(false)}>Cancel reset</button></div>}</div>}
      {item.record && item.sourceStatus === 'SOURCE_CURRENT' && <>
        <p className="ql222-cycle" role="status">Simulated cycle <strong>{item.record.cycle}/12</strong> · Unreviewed <strong>{item.unreviewed}</strong> · Due soon <strong>{item.dueSoon}</strong> · Overdue <strong>{item.overdue}</strong> · Separate reviews due <strong>{item.separateReviewsDue}</strong>.</p>
        <section aria-labelledby="ql230-gaps"><h5 id="ql230-gaps">Independent follow-up evidence gaps ({item.gaps.length})</h5>
          {item.gaps.map((gap) => <article className="ql218-gap" key={gap.category}><h6>{gap.category.replaceAll('_', ' ')} · {gap.priority}</h6>
            <p>QL-229 reassignment <strong>{gap.reassignmentOutcome.replaceAll('_', ' ')}</strong> · Follow-up recurrence <strong>{gap.followupOutcome.replaceAll('_', ' ')}</strong>.</p>
            <p>Reviewer decision <strong>{gap.reviewerDecision.replaceAll('_', ' ')}</strong> · Age <strong>{gap.reviewerDecisionAge === null ? 'NOT TRACKED' : `${gap.reviewerDecisionAge} cycle(s)`}</strong> · Next due cycle <strong>{gap.nextDueCycle ?? 'NOT SET'}</strong>.</p>
            {gap.dueSoon && <p className="ql223-approaching">Fictional independent reviewer decision approaching follow-up deadline.</p>}
            {gap.overdue && <p className="ql219-due">Overdue fictional decision. Refresh requires separate-reviewer referral, retaining historical overdue counts.</p>}
            {gap.separateReviewMissing && <p className="ql219-due">Separate-reviewer draft still required for inherited or repeated evidence risk.</p>}
            <p>Recurrence events <strong>{gap.followupRecurrences}</strong> · Historical overdue reviewer decisions <strong>{gap.overdueReviewerDecisions}</strong> · Actual reviewer verification <strong>UNVERIFIED</strong>.</p></article>)}
        </section>
        {item.record.phase === 'reassignment_recurrence_reviewer_decision_draft' ? <>
          <div className="ql218-form"><label htmlFor="ql230-gap">Reassignment follow-up gap</label>
            <select id="ql230-gap" value={selectedCategory ?? ''} onChange={(event) => { setCategory(event.target.value as Ql214GapCategory); setNote(''); }}>
              {item.gaps.map((gap) => <option key={gap.category} value={gap.category}>{gap.category.replaceAll('_', ' ')} · {gap.followupRecurrences} repeat events</option>)}</select>
            <label htmlFor="ql230-outcome">Follow-up evidence outcome · fictional/UNVERIFIED</label>
            <select id="ql230-outcome" value={outcome} onChange={(event) => setOutcome(event.target.value as Ql230Outcome)}>
              <option value="REASSIGNMENT_FOLLOWUP_OPEN_UNVERIFIED">Evidence remains open · UNVERIFIED</option>
              <option value="SIMULATED_FOLLOWUP_MATCH_UNVERIFIED">Imagined evidence match · UNVERIFIED</option>
              <option value="SIMULATED_RECURRENT_FOLLOWUP_UNVERIFIED">Invented recurring exception · UNVERIFIED</option></select>
            <label htmlFor="ql230-decision">Independent reviewer follow-up · UNSENT</label>
            <select id="ql230-decision" value={decision} onChange={(event) => setDecision(event.target.value as Ql230ReviewerDecision)}>
              <option value="CONTINUE_REVIEW_HELD_DRAFT">Maintain held reviewer follow-up · draft</option>
              <option value="REQUEST_REVIEW_EVIDENCE_DRAFT">Request more evidence · unsent draft</option>
              <option value="REFER_SEPARATE_REVIEWER_DRAFT">Refer separate reviewer · unsent draft</option></select>
            <label htmlFor="ql230-note">Fictional review note (8–180 characters)</label>
            <textarea id="ql230-note" rows={3} maxLength={180} value={note} onChange={(event) => setNote(event.target.value)} placeholder="Synthetic notes only; no customer or real reviewer identities." />
            <button type="button" disabled={!selectedCategory || note.trim().length < 8 || (!!selectedGap?.overdue && decision !== 'REFER_SEPARATE_REVIEWER_DRAFT')}
              onClick={() => { if (selectedCategory) change((previous, id) => recordQl230Decision(sources, previous, organization.id, id, selectedCategory, outcome, decision, note)); setNote(''); }}>Record fictional follow-up &amp; reviewer decision · UNSENT</button>
            <button type="button" disabled={item.record.cycle >= 12} onClick={() => change((previous, id) => advanceQl230Cycle(sources, previous, organization.id, id))}>Advance synthetic reviewer aging cycle (+1)</button>
            <small>Two imaginary cycles is due soon; three overdue. A simulated review never satisfies real independent evidence.</small></div>
          <section className="ql219-checklist" aria-labelledby="ql230-checks"><h5 id="ql230-checks">Reviewer aging &amp; conditional hold · UNVERIFIED checks</h5>
            {QL230_CHECKS.map((check) => <article key={check.id} className="ql219-check"><div><strong>{check.title}</strong><p>{check.detail}</p></div>
              <button type="button" disabled={item.record?.checks[check.id] === 'ACKNOWLEDGED_UNVERIFIED'} onClick={() => change((previous, id) => acknowledgeQl230Check(sources, previous, organization.id, id, check.id))}>
                {item.record?.checks[check.id] === 'ACKNOWLEDGED_UNVERIFIED' ? 'Locally reviewed · UNVERIFIED' : 'Acknowledge hold continuity · UNVERIFIED'}</button></article>)}
          </section>
          <button type="button" disabled={!item.readyForLocalAudit} onClick={() => change((previous, id) => prepareQl230HoldAudit(sources, previous, organization.id, id))}>Prepare reviewer decision &amp; hold continuity packet · NO RELEASE</button>
        </> : <p className="ql218-prepared" role="status">QL-230 fictional reviewer decision and conditional hold continuity packet prepared locally. No real independent sign-off, provider release or pilot authorization.</p>}
      </>}
      <div className="ql218-actions"><button type="button" onClick={() => onNavigate('reassignment_audit')}>Inspect QL-229 reassignment audit</button>
        <button type="button" onClick={() => onNavigate('handoff_continuity')}>Inspect QL-228 handoff continuity</button></div>
    </section>}</div>
    <section className="ql218-panel" aria-labelledby="ql230-holds"><h4 id="ql230-holds">Actual QL-181 prerequisites · read-only conditional release hold continuity</h4>
      <p>Expected <strong>{company.holdAudit.expected}</strong> · Observed <strong>{company.holdAudit.observed}</strong> · HELD_UNVERIFIED <strong>{company.holdAudit.held}</strong> · Conditional release <strong>BLOCKED</strong>.</p>
      <div className="ql218-scroll"><table><thead><tr><th scope="col">QL-181 prerequisite</th><th scope="col">Actual verification requirement</th><th scope="col">State</th></tr></thead>
        <tbody>{portfolio.prerequisites.map((hold) => <tr key={hold.id}><th scope="row">{hold.title}</th><td>{hold.requiredBeforePilot}</td><td>{hold.state}</td></tr>)}</tbody></table></div>
    </section>
    <section className="ql218-panel" aria-labelledby="ql230-receipt"><h4 id="ql230-receipt">Redacted reviewer decision &amp; hold continuity receipt</h4>
      <button type="button" aria-expanded={receiptOpen} aria-controls="ql230-receipt-data" onClick={() => setReceiptOpen((open) => !open)}>{receiptOpen ? 'Hide' : 'Show'} local QL-230 continuity receipt</button>
      {receiptOpen && <div id="ql230-receipt-data"><p>Fictional coded status only; no private notes, source revision tokens, reviewer names or customers.</p>
        <textarea readOnly rows={15} aria-label="Fixture-only QL-230 reviewer continuity receipt" value={ql230CompanyReceipt(sources, ledger, organization.id)} /></div>}
    </section>
    <p className="ql218-foot">Production software GREEN is separate from pilot safety. Real calls/SMS and independent approval remain blocked.</p>
  </section>;
}

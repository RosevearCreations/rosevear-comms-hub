import { useState, type Dispatch, type SetStateAction } from 'react';
import type { OperatorOrganization, OperatorWorkspace } from './ql191Organizations';
import type { Ql211ScenarioId } from './ql211OwnerTrial';
import type { Ql214GapCategory } from './ql214ReviewIntake';
import { QL228_RELEASE, QL228_CHECKS, ql228CompanyContinuity, ql228Portfolio,
  ql228CompanyReceipt, beginQl228FollowUp, recordQl228FollowUp, advanceQl228Cycle,
  acknowledgeQl228Check, prepareQl228Continuity,
  type Ql228Sources, type Ql228Ledger, type Ql228Exception, type Ql228Handoff } from './ql228HandoffContinuity';
import './ql228-handoff-continuity.css';

const sourceDescription: Record<string, string> = {
  AWAITING_PREPARED_QL227: 'Awaiting current prepared fictional QL-227 evidence audit',
  SOURCE_CURRENT: 'Prepared QL-227 owner evidence source matches',
  QL227_EVIDENCE_DECISION_REVISED: 'FROZEN · QL-227 evidence or owner decision revised',
  UPSTREAM_STALE: 'FROZEN · independent evidence source no longer current'
};

export function Ql228HandoffContinuityAudit({ organization, sources, ledger, setLedger, onNavigate }: {
  organization: OperatorOrganization;
  sources: Ql228Sources;
  ledger: Ql228Ledger;
  setLedger: Dispatch<SetStateAction<Ql228Ledger>>;
  onNavigate: (workspace: OperatorWorkspace) => void;
}) {
  const [selected, setSelected] = useState<Ql211ScenarioId | null>(null);
  const [category, setCategory] = useState<Ql214GapCategory | ''>('');
  const [exception, setException] = useState<Ql228Exception>('EVIDENCE_EXCEPTION_STILL_OPEN_UNVERIFIED');
  const [handoff, setHandoff] = useState<Ql228Handoff>('MAINTAIN_HELD_HANDOFF_DRAFT');
  const [note, setNote] = useState('');
  const [help, setHelp] = useState(false);
  const [reset, setReset] = useState(false);
  const [receiptOpen, setReceiptOpen] = useState(false);
  const portfolio = ql228Portfolio(sources, ledger);
  const company = ql228CompanyContinuity(sources, ledger, organization.id);
  const item = company.cases.find((candidate) => candidate.scenario === selected) ?? company.cases[0];
  const selectedCategory = category && item?.gaps.some((gap) => gap.category === category) ? category : item?.gaps[0]?.category;
  const selectedGap = item?.gaps.find((gap) => gap.category === selectedCategory);
  function change(operation: (previous: Ql228Ledger, scenario: Ql211ScenarioId) => Ql228Ledger) {
    if (item) setLedger((previous) => operation(previous, item.scenario));
  }

  return <section className="ql218-workbench ql228-workbench" data-ql228-release={QL228_RELEASE} data-organization={organization.id} aria-labelledby="ql228-title">
    <header className="ql218-header"><div><p className="ql191-eyebrow">QL-228 · Evidence recurrence &amp; independent handoff · Disabled preview</p>
      <h3 id="ql228-title">Four-company evidence exception recurrence, independent handoff follow-up &amp; held-release continuity</h3>
      <p>Revisit invented exception evidence, draft untransmitted reviewer handoffs, and verify that conditional release remains blocked.</p></div>
      <button type="button" aria-expanded={help} aria-controls="ql228-help" onClick={() => setHelp((value) => !value)}>ⓘ Exception &amp; handoff help</button></header>
    <div className="ql218-warning" role="note"><strong>NO REAL HANDOFF, OWNER APPROVAL OR RELEASE.</strong> All {portfolio.prerequisites.length} QL-181 prerequisites are HELD_UNVERIFIED. No live calls, SMS, provider actions, Supabase writes, customer records or independent reviewer contact.</div>
    {help && <p className="ql218-help" id="ql228-help">Begin with a prepared fictional QL-227 owner-evidence packet. Classify each invented gap and its unsent independent handoff, including recurrent evidence exceptions. Repeat events count once per gap per simulated cycle; historical counts are retained. At two cycles handoff is due soon, at three overdue; a late refresh must be an unsent independent reassignment. P0, inherited conflicted or overdue cases and repeated evidence require the same independent route. Source changes freeze the dependent audit; confirmed reset clears only the selected QL-228 draft. A local held packet requires all gaps, all three UNVERIFIED checks, zero overdue or missing handoffs, and twelve real release holds still intact.</p>}
    <div className="ql218-metrics" role="status">
      <div><small>Eligible four-company cases</small><strong>{portfolio.eligible}</strong><span>Prepared fictional QL-227</span></div>
      <div><small>Recurring / total events</small><strong>{portfolio.recurring} / {portfolio.recurrenceEvents}</strong><span>Invented exceptions only</span></div>
      <div><small>Due soon / overdue</small><strong>{portfolio.dueSoon} / {portfolio.overdue}</strong><span>Simulated handoff cycles</span></div>
      <div><small>Prepared / stale</small><strong>{portfolio.prepared} / {portfolio.stale}</strong><span>Always held</span></div>
    </div>
    <section className="ql218-panel" aria-labelledby="ql228-portfolio"><h4 id="ql228-portfolio">Four-company exception and independent handoff review</h4>
      <div className="ql218-scroll"><table><caption>Fictional, session-only audit status. No actual independent handoff or evidence verification.</caption>
        <thead><tr><th scope="col">Company</th><th scope="col">Eligible</th><th scope="col">Tracking</th><th scope="col">Unreviewed</th><th scope="col">Recurrence events</th><th scope="col">Due soon</th><th scope="col">Overdue</th><th scope="col">Historical overdue</th><th scope="col">Handoff missing</th><th scope="col">Prepared</th><th scope="col">Stale</th><th scope="col">Holds</th></tr></thead>
        <tbody>{portfolio.companies.map((row) => <tr key={row.company}><th scope="row">{row.company === 'rosiedazzlers' ? 'Rosie Dazzlers' : row.company === 'devilndove' ? 'Devil n Dove' : row.company === 'icamp' ? 'iCamp' : 'YW · Property Maintenance'}</th>
          <td>{row.eligible}</td><td>{row.tracking}</td><td>{row.unreviewed}</td><td>{row.recurrenceEvents}</td><td>{row.dueSoon}</td><td>{row.overdue}</td><td>{row.overdueHandoffs}</td><td>{row.handoffsDue}</td><td>{row.prepared}</td><td>{row.stale}</td><td>{row.holdAudit.held}/12 HELD</td></tr>)}</tbody></table></div>
    </section>
    <div className="ql218-grid"><section className="ql218-panel" aria-labelledby="ql228-cases"><h4 id="ql228-cases">{organization.name} · Reopened evidence cases</h4>
      {company.cases.length === 0 ? <p>No fictional finding exists. <button type="button" onClick={() => onNavigate('trial')}>Open owner trial</button></p> :
        <div role="group" aria-label="Select fictional independent handoff case">{company.cases.map((candidate) => <button type="button" key={candidate.scenario}
          className={candidate.scenario === item?.scenario ? 'ql218-case active' : 'ql218-case'} aria-pressed={candidate.scenario === item?.scenario}
          onClick={() => { setSelected(candidate.scenario); setCategory(''); setNote(''); setReset(false); }}>
          <strong>{candidate.title}</strong><span>{candidate.priority} · {sourceDescription[candidate.sourceStatus]} · {candidate.recurrenceEvents} synthetic recurrence event(s)</span></button>)}</div>}
      {company.orphaned > 0 && <p className="ql218-warning" role="alert">{company.orphaned} orphaned case(s) remain held and not independently resolved.</p>}
    </section>
    {item && <section className="ql218-panel" aria-labelledby="ql228-selected"><h4 id="ql228-selected">{item.title} · Owner evidence exception and handoff</h4>
      <p className="ql218-source">Source: <strong>{sourceDescription[item.sourceStatus]}</strong> · Prepared fictional QL-227: <strong>{item.eligible ? 'yes' : 'no'}</strong>.</p>
      {!item.eligible && <div className="ql218-warning">A current prepared QL-227 evidence audit is required. <button type="button" onClick={() => onNavigate('evidence_audit')}>Inspect QL-227 source</button></div>}
      {item.eligible && !item.record && <button type="button" onClick={() => change((previous, id) => beginQl228FollowUp(sources, previous, organization.id, id))}>Begin fictional evidence exception &amp; handoff follow-up</button>}
      {item.record && item.sourceStatus !== 'SOURCE_CURRENT' && <div className="ql218-warning" role="alert"><p>Audit frozen: earlier evidence changed. Existing unsent decisions cannot be reused as verified handoffs.</p>
        <button type="button" aria-expanded={reset} onClick={() => setReset(true)}>Review case-only handoff reset</button>
        {reset && <div><p>Replace only this fictional QL-228 case and clear its local event history. All other company drafts remain untouched.</p>
          <button type="button" disabled={!item.eligible} onClick={() => { change((previous, id) => beginQl228FollowUp(sources, previous, organization.id, id)); setReset(false); setNote(''); }}>Confirm case-only handoff reset</button>
          <button type="button" onClick={() => setReset(false)}>Cancel reset</button></div>}</div>}
      {item.record && item.sourceStatus === 'SOURCE_CURRENT' && <>
        <p className="ql222-cycle" role="status">Synthetic cycle <strong>{item.record.cycle}/12</strong> · Unreviewed <strong>{item.unreviewed}</strong> · Due soon <strong>{item.dueSoon}</strong> · Overdue <strong>{item.overdue}</strong> · Missing independent handoffs <strong>{item.handoffsDue}</strong>.</p>
        <section aria-labelledby="ql228-gaps"><h5 id="ql228-gaps">Unverified exception and handoff gaps ({item.gaps.length})</h5>
          {item.gaps.map((gap) => <article className="ql218-gap" key={gap.category}><h6>{gap.category.replaceAll('_', ' ')} · {gap.priority}</h6>
            <p>QL-227 reconciliation <strong>{gap.reconciledEvidence.replaceAll('_', ' ')}</strong> · Exception <strong>{gap.exception.replaceAll('_', ' ')}</strong>.</p>
            <p>Handoff route <strong>{gap.handoff.replaceAll('_', ' ')}</strong> · Age <strong>{gap.handoffAge === null ? 'NOT TRACKED' : `${gap.handoffAge} cycle(s)`}</strong> · Next due cycle <strong>{gap.nextDueCycle ?? 'NOT SET'}</strong>.</p>
            {gap.dueSoon && <p className="ql223-approaching">Fictional independent handoff follow-up due soon.</p>}
            {gap.overdue && <p className="ql219-due">Overdue fictional handoff. Refresh requires independent reassignment draft; historical overdue count persists.</p>}
            {gap.handoffMissing && <p className="ql219-due">Unsent independent reassignment required for this inherited or recurrent evidence exception.</p>}
            <p>Recurrence events <strong>{gap.recurrenceEvents}</strong> · Historical overdue handoffs <strong>{gap.overdueHandoffs}</strong> · Actual independent handoff <strong>UNVERIFIED</strong>.</p></article>)}
        </section>
        {item.record.phase === 'independent_handoff_recurrence_follow_up_draft' ? <>
          <div className="ql218-form"><label htmlFor="ql228-gap">Source-linked evidence gap</label>
            <select id="ql228-gap" value={selectedCategory ?? ''} onChange={(event) => { setCategory(event.target.value as Ql214GapCategory); setNote(''); }}>
              {item.gaps.map((gap) => <option key={gap.category} value={gap.category}>{gap.category.replaceAll('_', ' ')} · {gap.recurrenceEvents} repeat events</option>)}</select>
            <label htmlFor="ql228-exception">Simulated evidence exception · UNVERIFIED</label>
            <select id="ql228-exception" value={exception} onChange={(event) => setException(event.target.value as Ql228Exception)}>
              <option value="EVIDENCE_EXCEPTION_STILL_OPEN_UNVERIFIED">Evidence remains open · UNVERIFIED</option>
              <option value="SIMULATED_MATCH_UNVERIFIED">Imagined follow-up match · UNVERIFIED</option>
              <option value="SIMULATED_RECURRENT_EXCEPTION_UNVERIFIED">Fictional recurrent evidence exception · UNVERIFIED</option></select>
            <label htmlFor="ql228-handoff">Independent handoff decision · UNSENT</label>
            <select id="ql228-handoff" value={handoff} onChange={(event) => setHandoff(event.target.value as Ql228Handoff)}>
              <option value="MAINTAIN_HELD_HANDOFF_DRAFT">Maintain held handoff · draft</option>
              <option value="REQUEST_INDEPENDENT_EVIDENCE_DRAFT">Request independent evidence · unsent</option>
              <option value="REASSIGN_INDEPENDENT_HANDOFF_DRAFT">Reassign independent handoff · unsent</option></select>
            <label htmlFor="ql228-note">Fictional follow-up note (8–180 characters)</label>
            <textarea id="ql228-note" rows={3} maxLength={180} value={note} onChange={(event) => setNote(event.target.value)} placeholder="Synthetic notes only; no reviewer or customer details." />
            <button type="button" disabled={!selectedCategory || note.trim().length < 8 || (!!selectedGap?.overdue && handoff !== 'REASSIGN_INDEPENDENT_HANDOFF_DRAFT')}
              onClick={() => { if (selectedCategory) change((previous, id) => recordQl228FollowUp(sources, previous, organization.id, id, selectedCategory, exception, handoff, note)); setNote(''); }}>Record fictional recurrence &amp; independent handoff · UNSENT</button>
            <button type="button" disabled={item.record.cycle >= 12} onClick={() => change((previous, id) => advanceQl228Cycle(sources, previous, organization.id, id))}>Advance synthetic handoff aging cycle (+1)</button>
            <small>Handoff follow-up is due soon after two fictional cycles and overdue after three. No source match lifts any actual hold.</small></div>
          <section className="ql219-checklist" aria-labelledby="ql228-checks"><h5 id="ql228-checks">Fictional recurrence &amp; held-release checks</h5>
            {QL228_CHECKS.map((check) => <article key={check.id} className="ql219-check"><div><strong>{check.title}</strong><p>{check.detail}</p></div>
              <button type="button" disabled={item.record?.checks[check.id] === 'ACKNOWLEDGED_UNVERIFIED'} onClick={() => change((previous, id) => acknowledgeQl228Check(sources, previous, organization.id, id, check.id))}>
                {item.record?.checks[check.id] === 'ACKNOWLEDGED_UNVERIFIED' ? 'Locally reviewed · UNVERIFIED' : 'Acknowledge continuity check · UNVERIFIED'}</button></article>)}
          </section>
          <button type="button" disabled={!item.readyForLocalAudit} onClick={() => change((previous, id) => prepareQl228Continuity(sources, previous, organization.id, id))}>Prepare independent handoff &amp; hold continuity packet · NO RELEASE</button>
        </> : <p className="ql218-prepared" role="status">QL-228 fictional independent handoff and held-release continuity packet prepared locally. Actual independent follow-up and release remain unverified.</p>}
      </>}
      <div className="ql218-actions"><button type="button" onClick={() => onNavigate('evidence_audit')}>Inspect QL-227 evidence audit</button>
        <button type="button" onClick={() => onNavigate('reopen_review')}>Inspect QL-226 reopen review</button></div>
    </section>}</div>
    <section className="ql218-panel" aria-labelledby="ql228-holds"><h4 id="ql228-holds">Actual QL-181 prerequisites · conditional release still held</h4>
      <p>Expected <strong>{company.holdAudit.expected}</strong> · Observed <strong>{company.holdAudit.observed}</strong> · HELD_UNVERIFIED <strong>{company.holdAudit.held}</strong> · Conditional release <strong>BLOCKED</strong>.</p>
      <div className="ql218-scroll"><table><thead><tr><th scope="col">QL-181 prerequisite</th><th scope="col">Required actual verification</th><th scope="col">State</th></tr></thead>
        <tbody>{portfolio.prerequisites.map((hold) => <tr key={hold.id}><th scope="row">{hold.title}</th><td>{hold.requiredBeforePilot}</td><td>{hold.state}</td></tr>)}</tbody></table></div>
    </section>
    <section className="ql218-panel" aria-labelledby="ql228-receipt"><h4 id="ql228-receipt">Redacted recurrence, independent handoff &amp; held-release receipt</h4>
      <button type="button" aria-expanded={receiptOpen} aria-controls="ql228-receipt-data" onClick={() => setReceiptOpen((open) => !open)}>{receiptOpen ? 'Hide' : 'Show'} local QL-228 continuity receipt</button>
      {receiptOpen && <div id="ql228-receipt-data"><p>Only coded fictional outcomes and aggregate counts. No private notes, people, source tokens or actual approvals.</p>
        <textarea readOnly rows={15} aria-label="Fixture-only QL-228 held handoff receipt" value={ql228CompanyReceipt(sources, ledger, organization.id)} /></div>}
    </section>
    <p className="ql218-foot">Production GREEN indicates deployed software only. Real pilot activation, independent handoff, calls and SMS remain blocked.</p>
  </section>;
}

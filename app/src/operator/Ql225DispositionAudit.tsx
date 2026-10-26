import { useState, type Dispatch, type SetStateAction } from 'react';
import type { OperatorOrganization, OperatorWorkspace } from './ql191Organizations';
import type { Ql211ScenarioId } from './ql211OwnerTrial';
import type { Ql214GapCategory } from './ql214ReviewIntake';
import { QL225_RELEASE, QL225_CHECKS, ql225CompanyDispositions, ql225Portfolio,
  ql225CompanyReceipt, beginQl225Disposition, recordQl225Disposition, advanceQl225Cycle,
  acknowledgeQl225Check, prepareQl225HeldReassessment,
  type Ql225Sources, type Ql225Ledger, type Ql225Disposition, type Ql225FollowUp } from './ql225EvidenceDisposition';
import './ql225-disposition-audit.css';

const sourceText: Record<string, string> = {
  AWAITING_PREPARED_QL224: 'Awaiting current, prepared fictional QL-224 escalation packet',
  SOURCE_CURRENT: 'Prepared QL-224 escalation outcomes match',
  QL224_OUTCOME_REVISED: 'FROZEN · QL-224 outcome evidence was revised',
  UPSTREAM_STALE: 'FROZEN · upstream release-hold evidence is no longer current'
};

export function Ql225DispositionAudit({ organization, sources, ledger, setLedger, onNavigate }: {
  organization: OperatorOrganization;
  sources: Ql225Sources;
  ledger: Ql225Ledger;
  setLedger: Dispatch<SetStateAction<Ql225Ledger>>;
  onNavigate: (workspace: OperatorWorkspace) => void;
}) {
  const [selected, setSelected] = useState<Ql211ScenarioId | null>(null);
  const [category, setCategory] = useState<Ql214GapCategory | ''>('');
  const [disposition, setDisposition] = useState<Ql225Disposition>('EVIDENCE_PENDING_UNVERIFIED');
  const [followUp, setFollowUp] = useState<Ql225FollowUp>('CONTINUE_HELD_MONITOR_DRAFT');
  const [note, setNote] = useState('');
  const [help, setHelp] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const portfolio = ql225Portfolio(sources, ledger);
  const company = ql225CompanyDispositions(sources, ledger, organization.id);
  const item = company.cases.find((entry) => entry.scenario === selected) ?? company.cases[0];
  const selectedCategory = category && item?.gaps.some((gap) => gap.category === category) ? category : item?.gaps[0]?.category;
  const selectedGap = item?.gaps.find((gap) => gap.category === selectedCategory);

  function change(operation: (previous: Ql225Ledger, scenario: Ql211ScenarioId) => Ql225Ledger) {
    if (item) setLedger((previous) => operation(previous, item.scenario));
  }

  return <section className="ql218-workbench ql225-workbench" data-ql225-release={QL225_RELEASE} data-organization={organization.id} aria-labelledby="ql225-title">
    <header className="ql218-header"><div><p className="ql191-eyebrow">QL-225 · Evidence disposition &amp; held release · Disabled preview</p>
      <h3 id="ql225-title">Four-company escalation outcome aging &amp; independent evidence disposition</h3>
      <p>Track fictional independent evidence decisions, overdue follow-up and held-release reassessment without enabling any communication.</p></div>
      <button type="button" aria-expanded={help} aria-controls="ql225-help" onClick={() => setHelp((value) => !value)}>ⓘ Evidence disposition help</button></header>
    <div className="ql218-warning" role="note"><strong>NO REAL INDEPENDENT APPROVAL OR PILOT RELEASE.</strong> All {portfolio.prerequisites.length} QL-181 prerequisites remain HELD_UNVERIFIED. Dispositions and owner follow-ups are fictional, unsent drafts. No live calls, SMS, provider operations or Supabase writes.</div>
    {help && <p className="ql218-help" id="ql225-help">Start from a current, locally prepared fictional QL-224 escalation packet. Record a fictional evidence disposition and unsent owner follow-up for every gap. Age two simulated cycles is due soon; age three is overdue. Refreshing overdue outcomes requires an independent draft referral and retains overdue history. P0, recurrent, historically overdue and discrepant evidence also require independent draft referral before preparing a local hold packet. Discrepancy events count once per gap and cycle. A changed source freezes the case until explicit case-only reset; real release prerequisites cannot be cleared here.</p>}
    <div className="ql218-metrics" role="status">
      <div><small>Eligible QL-224 packets</small><strong>{portfolio.eligible}</strong><span>Across four companies</span></div>
      <div><small>Due soon / overdue</small><strong>{portfolio.dueSoon} / {portfolio.overdue}</strong><span>Invented cycles only</span></div>
      <div><small>Unverified evidence discrepancies</small><strong>{portfolio.discrepancies}</strong><span>{portfolio.discrepancyEvents} invented events</span></div>
      <div><small>Local packets / stale</small><strong>{portfolio.prepared} / {portfolio.stale}</strong><span>Holds never cleared</span></div>
    </div>
    <section className="ql218-panel" aria-labelledby="ql225-portfolio"><h4 id="ql225-portfolio">Four-company escalation outcome &amp; independent evidence portfolio</h4>
      <div className="ql218-scroll"><table><caption>Synthetic review counts; no verified evidence or actual independent sign-off.</caption>
        <thead><tr><th scope="col">Company</th><th scope="col">Eligible</th><th scope="col">Tracking</th><th scope="col">Undecided</th><th scope="col">Due soon</th><th scope="col">Overdue</th><th scope="col">Past overdue</th><th scope="col">Referral due</th><th scope="col">Evidence pending</th><th scope="col">Discrepancies</th><th scope="col">Prepared</th><th scope="col">Stale</th><th scope="col">Holds</th></tr></thead>
        <tbody>{portfolio.companies.map((row) => <tr key={row.company}><th scope="row">{row.company === 'rosiedazzlers' ? 'Rosie Dazzlers' : row.company === 'devilndove' ? 'Devil n Dove' : row.company === 'icamp' ? 'iCamp' : 'YW · Property Maintenance'}</th>
          <td>{row.eligible}</td><td>{row.tracking}</td><td>{row.undecided}</td><td>{row.dueSoon}</td><td>{row.overdue}</td><td>{row.overdueEpisodes}</td><td>{row.referralsDue}</td><td>{row.evidencePending}</td><td>{row.discrepancies}</td><td>{row.prepared}</td><td>{row.stale}</td><td>{row.holdAudit.held}/12 HELD</td></tr>)}</tbody></table></div>
    </section>
    <div className="ql218-grid"><section className="ql218-panel" aria-labelledby="ql225-cases"><h4 id="ql225-cases">{organization.name} · Fictional disposition cases</h4>
      {company.cases.length === 0 ? <p>No synthetic trial cases exist. <button type="button" onClick={() => onNavigate('trial')}>Open owner trial</button></p> :
        <div role="group" aria-label="Select evidence disposition case">{company.cases.map((candidate) => <button type="button" key={candidate.scenario}
          className={candidate.scenario === item?.scenario ? 'ql218-case active' : 'ql218-case'} aria-pressed={candidate.scenario === item?.scenario}
          onClick={() => { setSelected(candidate.scenario); setCategory(''); setNote(''); setConfirmReset(false); }}>
          <strong>{candidate.title}</strong><span>{candidate.priority} · {sourceText[candidate.sourceStatus]} · {candidate.overdueEpisodes} simulated overdue outcome(s)</span></button>)}</div>}
      {company.orphaned > 0 && <p role="alert" className="ql218-warning">{company.orphaned} orphaned case(s) remain held, not closed.</p>}
    </section>
    {item && <section className="ql218-panel" aria-labelledby="ql225-selected"><h4 id="ql225-selected">{item.title} · Independent evidence disposition</h4>
      <p className="ql218-source">Source: <strong>{sourceText[item.sourceStatus]}</strong> · Prepared QL-224: <strong>{item.prepared ? 'yes · fictional only' : 'no'}</strong>.</p>
      {!item.eligible && <div className="ql218-warning">A current, locally prepared QL-224 packet is required. <button type="button" onClick={() => onNavigate('overdue')}>Inspect QL-224 source</button></div>}
      {item.eligible && !item.record && <button type="button" onClick={() => change((previous, id) => beginQl225Disposition(sources, previous, organization.id, id))}>Begin fictional independent evidence disposition</button>}
      {item.record && item.sourceStatus !== 'SOURCE_CURRENT' && <div className="ql218-warning" role="alert"><p>Case is frozen after an upstream source change. No prior review is silently marked complete.</p>
        <button type="button" aria-expanded={confirmReset} onClick={() => setConfirmReset(true)}>Review case-only disposition reset</button>
        {confirmReset && <div><p>Reset this one fictional QL-225 case. Previous local disposition history and acknowledgements are replaced; other companies and cases remain untouched.</p>
          <button type="button" disabled={!item.eligible} onClick={() => { change((previous, id) => beginQl225Disposition(sources, previous, organization.id, id)); setConfirmReset(false); setNote(''); }}>Confirm case-only disposition reset</button>
          <button type="button" onClick={() => setConfirmReset(false)}>Cancel reset</button></div>}</div>}
      {item.record && item.sourceStatus === 'SOURCE_CURRENT' && <>
        <p className="ql222-cycle" role="status">Fictional cycle <strong>{item.record.cycle}/12</strong> · Undispositioned <strong>{item.undecided}</strong> · Due soon <strong>{item.dueSoon}</strong> · Overdue <strong>{item.overdue}</strong> · Independent drafts due <strong>{item.referralsDue}</strong>.</p>
        <section aria-labelledby="ql225-gaps"><h5 id="ql225-gaps">Escalation outcome evidence gaps ({item.gaps.length})</h5>
          {item.gaps.map((gap) => <article key={gap.category} className="ql218-gap"><h6>{gap.category.replaceAll('_', ' ')} · {gap.priority}</h6>
            <p>QL-224 outcome <strong>{gap.evidence.replaceAll('_', ' ')}</strong> · Disposition <strong>{gap.disposition.replaceAll('_', ' ')}</strong>.</p>
            <p>Owner follow-up <strong>{gap.dispositionRoute.replaceAll('_', ' ')}</strong> · Simulated age <strong>{gap.followUpAge === null ? 'NOT TRACKED' : `${gap.followUpAge} cycle(s)`}</strong> · Due cycle <strong>{gap.nextDueCycle ?? 'NOT SET'}</strong>.</p>
            {gap.dueSoon && <p className="ql223-approaching">Simulated disposition follow-up approaching deadline.</p>}
            {gap.overdue && <p className="ql219-due">Overdue. Only unsent independent review can refresh this follow-up; the overdue episode remains in history.</p>}
            {gap.referralMissing && <p className="ql219-due">Independent review draft required for this source, recurrence or discrepancy.</p>}
            <p>Past overdue episodes <strong>{gap.overdueEpisodes}</strong> · Invented discrepancy events <strong>{gap.discrepancyEvents}</strong> · Actual independent decision <strong>UNVERIFIED</strong>.</p></article>)}
        </section>
        {item.record.phase === 'escalation_outcome_disposition_draft' ? <>
          <div className="ql218-form"><label htmlFor="ql225-gap">Escalation evidence gap</label>
            <select id="ql225-gap" value={selectedCategory ?? ''} onChange={(event) => { setCategory(event.target.value as Ql214GapCategory); setNote(''); }}>
              {item.gaps.map((gap) => <option key={gap.category} value={gap.category}>{gap.category.replaceAll('_', ' ')} · {gap.overdueEpisodes} overdue episode(s)</option>)}</select>
            <label htmlFor="ql225-disposition">Independent evidence disposition · synthetic and unverified</label>
            <select id="ql225-disposition" value={disposition} onChange={(event) => setDisposition(event.target.value as Ql225Disposition)}>
              <option value="EVIDENCE_PENDING_UNVERIFIED">Evidence pending · UNVERIFIED</option>
              <option value="SIMULATED_REVIEW_NOTED_UNVERIFIED">Fictional review noted · UNVERIFIED</option>
              <option value="SIMULATED_DISCREPANCY_UNVERIFIED">Fictional discrepancy · UNVERIFIED</option></select>
            <label htmlFor="ql225-follow-up">Owner follow-up &amp; reviewer disposition · UNSENT</label>
            <select id="ql225-follow-up" value={followUp} onChange={(event) => setFollowUp(event.target.value as Ql225FollowUp)}>
              <option value="CONTINUE_HELD_MONITOR_DRAFT">Continue held monitoring · draft</option>
              <option value="REQUEST_EVIDENCE_DRAFT">Request evidence · unsent draft</option>
              <option value="REFER_INDEPENDENT_DRAFT">Refer for independent disposition · unsent draft</option></select>
            <label htmlFor="ql225-note">Fictional independent evidence note (8–180 characters)</label>
            <textarea id="ql225-note" rows={3} maxLength={180} value={note} onChange={(event) => setNote(event.target.value)} placeholder="Invented examples only; no real reviewer, customer or source details." />
            <button type="button" disabled={!selectedCategory || note.trim().length < 8 || !!selectedGap?.overdue && followUp !== 'REFER_INDEPENDENT_DRAFT'}
              onClick={() => { if (selectedCategory) change((previous, id) => recordQl225Disposition(sources, previous, organization.id, id, selectedCategory, disposition, followUp, note)); setNote(''); }}>Record fictional evidence disposition · UNSENT</button>
            <button type="button" disabled={item.record.cycle >= 12} onClick={() => change((previous, id) => advanceQl225Cycle(sources, previous, organization.id, id))}>Advance synthetic disposition follow-up cycle (+1)</button>
            <small>Two simulated cycles = due soon; three = overdue. A fictional evidence match never verifies real evidence or authorizes release.</small></div>
          <section className="ql219-checklist" aria-labelledby="ql225-checks"><h5 id="ql225-checks">Held-release reassessment · local UNVERIFIED checks</h5>
            {QL225_CHECKS.map((check) => <article key={check.id} className="ql219-check"><div><strong>{check.title}</strong><p>{check.detail}</p></div>
              <button type="button" disabled={item.record?.checks[check.id] === 'ACKNOWLEDGED_UNVERIFIED'} onClick={() => change((previous, id) => acknowledgeQl225Check(sources, previous, organization.id, id, check.id))}>
                {item.record?.checks[check.id] === 'ACKNOWLEDGED_UNVERIFIED' ? 'Reviewed locally · UNVERIFIED' : 'Acknowledge held reassessment · UNVERIFIED'}</button></article>)}
          </section>
          <button type="button" disabled={!item.readyForLocalAudit} onClick={() => change((previous, id) => prepareQl225HeldReassessment(sources, previous, organization.id, id))}>Prepare independent evidence &amp; held-release reassessment packet · NO RELEASE</button>
        </> : <p className="ql218-prepared" role="status">Fictional QL-225 independent disposition and held-release reassessment packet prepared locally. All actual release prerequisites remain HELD_UNVERIFIED.</p>}
      </>}
      <div className="ql218-actions"><button type="button" onClick={() => onNavigate('overdue')}>Inspect QL-224 outcomes</button>
        <button type="button" onClick={() => onNavigate('aging')}>Inspect QL-223 aging</button></div>
    </section>}</div>
    <section className="ql218-panel" aria-labelledby="ql225-holds"><h4 id="ql225-holds">Actual QL-181 release prerequisites · independent hold continuity</h4>
      <p>Expected <strong>{company.holdAudit.expected}</strong> · Observed <strong>{company.holdAudit.observed}</strong> · HELD_UNVERIFIED <strong>{company.holdAudit.held}</strong> · Conditional release <strong>BLOCKED</strong>.</p>
      <div className="ql218-scroll"><table><thead><tr><th scope="col">QL-181 prerequisite</th><th scope="col">Actual independent evidence still required</th><th scope="col">State</th></tr></thead>
        <tbody>{portfolio.prerequisites.map((hold) => <tr key={hold.id}><th scope="row">{hold.title}</th><td>{hold.requiredBeforePilot}</td><td>{hold.state}</td></tr>)}</tbody></table></div>
    </section>
    <section className="ql218-panel" aria-labelledby="ql225-receipt"><h4 id="ql225-receipt">Redacted independent evidence disposition &amp; held release receipt</h4>
      <button type="button" aria-expanded={showReceipt} aria-controls="ql225-receipt-data" onClick={() => setShowReceipt((value) => !value)}>{showReceipt ? 'Hide' : 'Show'} local QL-225 audit receipt</button>
      {showReceipt && <div id="ql225-receipt-data"><p>Source-linked status codes, synthetic ages and counts only; no personal details, notes or tokens.</p>
        <textarea readOnly rows={15} aria-label="Fixture-only QL-225 evidence disposition receipt" value={ql225CompanyReceipt(sources, ledger, organization.id)} /></div>}
    </section>
    <p className="ql218-foot">Production software checks are not real independent evidence review. Real pilot activation, calls and SMS are still blocked.</p>
  </section>;
}

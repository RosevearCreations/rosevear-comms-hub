import { useState, type Dispatch, type SetStateAction } from 'react';
import type { OperatorOrganization, OperatorWorkspace } from './ql191Organizations';
import type { Ql211ScenarioId } from './ql211OwnerTrial';
import type { Ql214GapCategory } from './ql214ReviewIntake';
import { QL231_RELEASE, QL231_CHECKS, ql231CompanyDisposition, ql231Portfolio, ql231CompanyReceipt,
  beginQl231Disposition, recordQl231Recheck, advanceQl231Cycle, acknowledgeQl231Check,
  prepareQl231Oversight, type Ql231Sources, type Ql231Ledger, type Ql231Evidence,
  type Ql231Disposition, type Ql231Recheck } from './ql231DispositionOversight';
import './ql231-disposition-oversight.css';

const sourceDescription: Record<string, string> = {
  AWAITING_PREPARED_QL230: 'Awaiting prepared fictional QL-230 reviewer continuity packet',
  SOURCE_CURRENT: 'QL-230 reviewer recurrence evidence matches',
  QL230_REVIEWER_OUTCOME_REVISED: 'FROZEN · QL-230 reviewer outcome revised',
  UPSTREAM_STALE: 'FROZEN · prior reviewer evidence no longer current'
};

export function Ql231DispositionOversight({ organization, sources, ledger, setLedger, onNavigate }: {
  organization: OperatorOrganization;
  sources: Ql231Sources;
  ledger: Ql231Ledger;
  setLedger: Dispatch<SetStateAction<Ql231Ledger>>;
  onNavigate: (workspace: OperatorWorkspace) => void;
}) {
  const [selected, setSelected] = useState<Ql211ScenarioId | null>(null);
  const [category, setCategory] = useState<Ql214GapCategory | ''>('');
  const [evidence, setEvidence] = useState<Ql231Evidence>('EVIDENCE_RECHECK_PENDING_UNVERIFIED');
  const [disposition, setDisposition] = useState<Ql231Disposition>('CONTINUE_HELD_REVIEW_DRAFT');
  const [recheck, setRecheck] = useState<Ql231Recheck>('RECHECK_MONITOR_HELD_DRAFT');
  const [note, setNote] = useState('');
  const [help, setHelp] = useState(false);
  const [reset, setReset] = useState(false);
  const [receiptOpen, setReceiptOpen] = useState(false);
  const portfolio = ql231Portfolio(sources, ledger);
  const company = ql231CompanyDisposition(sources, ledger, organization.id);
  const item = company.cases.find((candidate) => candidate.scenario === selected) ?? company.cases[0];
  const selectedCategory = category && item?.gaps.some((gap) => gap.category === category) ? category : item?.gaps[0]?.category;
  const selectedGap = item?.gaps.find((gap) => gap.category === selectedCategory);
  function change(operation: (previous: Ql231Ledger, scenario: Ql211ScenarioId) => Ql231Ledger) {
    if (item) setLedger((previous) => operation(previous, item.scenario));
  }
  return <section className="ql218-workbench ql231-workbench" data-ql231-release={QL231_RELEASE} data-organization={organization.id} aria-labelledby="ql231-title">
    <header className="ql218-header"><div><p className="ql191-eyebrow">QL-231 · Reviewer recurrence disposition &amp; overdue recheck · Disabled preview</p>
      <h3 id="ql231-title">Four-company reviewer dispositions, evidence recheck aging &amp; conditional hold exceptions</h3>
      <p>Track fictional recurrence disposition drafts and overdue independent rechecks while preserving all actual release holds.</p></div>
      <button type="button" aria-expanded={help} aria-controls="ql231-help" onClick={() => setHelp((value) => !value)}>ⓘ Disposition &amp; hold help</button></header>
    <div className="ql218-warning" role="note"><strong>NO REAL REVIEWER DISPOSITION, INDEPENDENT RECHECK OR PILOT RELEASE.</strong> All {portfolio.prerequisites.length} actual QL-181 prerequisites remain HELD_UNVERIFIED. This session-only preview sends no calls, SMS, reviewer requests, provider changes, records or Supabase writes.</div>
    {help && <p className="ql218-help" id="ql231-help">Begin from a current locally prepared fictional QL-230 reviewer continuity packet. Draft a coded evidence-recheck outcome, unsent reviewer disposition and independent recheck action for each gap. Recurrences count once per gap per simulated cycle. Two cycles after the last recheck is due soon; three is overdue, requiring an unsent overdue-recheck escalation draft. P0, inherited recurring or historically late gaps require a separate recheck. Recurring exceptions require reopening or independent referral dispositions. Upstream QL-230 changes freeze the case until an explicit case-only reset. A local packet needs reconciled gaps, no active overdue or missing separate rechecks, three UNVERIFIED acknowledgments and all twelve real holds.</p>}
    <div className="ql218-metrics" role="status">
      <div><small>Eligible cases</small><strong>{portfolio.eligible}</strong><span>Four isolated companies</span></div>
      <div><small>Recurrent / historical events</small><strong>{portfolio.recurring} / {portfolio.recurrenceEvents}</strong><span>Invented outcomes only</span></div>
      <div><small>Due soon / overdue</small><strong>{portfolio.dueSoon} / {portfolio.overdue}</strong><span>Simulated recheck cycles</span></div>
      <div><small>Prepared / stale</small><strong>{portfolio.prepared} / {portfolio.stale}</strong><span>Never pilot release</span></div>
    </div>
    <section className="ql218-panel" aria-labelledby="ql231-portfolio"><h4 id="ql231-portfolio">Four-company independent recurrence disposition and evidence recheck oversight</h4>
      <div className="ql218-scroll"><table><caption>Local fictional counts; no actual evidence approval or release.</caption>
        <thead><tr><th scope="col">Company</th><th scope="col">Eligible</th><th scope="col">Tracking</th><th scope="col">Unreviewed</th><th scope="col">Recurrence</th><th scope="col">Due soon</th><th scope="col">Overdue</th><th scope="col">Historical overdue</th><th scope="col">Separate rechecks</th><th scope="col">Disposition gaps</th><th scope="col">Prepared</th><th scope="col">Stale</th><th scope="col">Holds</th></tr></thead>
        <tbody>{portfolio.companies.map((row) => <tr key={row.company}><th scope="row">{row.company === 'rosiedazzlers' ? 'Rosie Dazzlers' : row.company === 'devilndove' ? 'Devil n Dove' : row.company === 'icamp' ? 'iCamp' : 'YW · Property Maintenance'}</th>
          <td>{row.eligible}</td><td>{row.tracking}</td><td>{row.unreviewed}</td><td>{row.recurrenceEvents}</td><td>{row.dueSoon}</td><td>{row.overdue}</td><td>{row.overdueRecheckEpisodes}</td><td>{row.separateRechecksDue}</td><td>{row.dispositionExceptions}</td><td>{row.prepared}</td><td>{row.stale}</td><td>{row.holdAudit.held}/12 HELD</td></tr>)}</tbody></table></div>
    </section>
    <div className="ql218-grid"><section className="ql218-panel" aria-labelledby="ql231-cases"><h4 id="ql231-cases">{organization.name} · Fictional disposition cases</h4>
      {company.cases.length === 0 ? <p>No fictional finding exists. <button type="button" onClick={() => onNavigate('trial')}>Open owner trial</button></p> :
        <div role="group" aria-label="Select reviewer disposition case">{company.cases.map((candidate) => <button type="button" key={candidate.scenario}
          className={candidate.scenario === item?.scenario ? 'ql218-case active' : 'ql218-case'} aria-pressed={candidate.scenario === item?.scenario}
          onClick={() => { setSelected(candidate.scenario); setCategory(''); setNote(''); setReset(false); }}>
          <strong>{candidate.title}</strong><span>{candidate.priority} · {sourceDescription[candidate.sourceStatus]} · {candidate.overdueRecheckEpisodes} historical overdue recheck(s)</span></button>)}</div>}
      {company.orphaned > 0 && <p className="ql218-warning" role="alert">{company.orphaned} orphaned fictional case(s) remain held, not independently closed.</p>}
    </section>
    {item && <section className="ql218-panel" aria-labelledby="ql231-selected"><h4 id="ql231-selected">{item.title} · Reviewer disposition and evidence recheck aging</h4>
      <p className="ql218-source">Source: <strong>{sourceDescription[item.sourceStatus]}</strong> · Prepared fictional QL-230: <strong>{item.eligible ? 'yes' : 'no'}</strong>.</p>
      {!item.eligible && <div className="ql218-warning">A current prepared QL-230 review is required. <button type="button" onClick={() => onNavigate('reviewer_continuity')}>Inspect QL-230 source</button></div>}
      {item.eligible && !item.record && <button type="button" onClick={() => change((previous, id) => beginQl231Disposition(sources, previous, organization.id, id))}>Begin fictional recurrence disposition &amp; overdue evidence recheck</button>}
      {item.record && item.sourceStatus !== 'SOURCE_CURRENT' && <div className="ql218-warning" role="alert"><p>Audit frozen: upstream QL-230 reviewer evidence changed. Local findings do not constitute real independent verification.</p>
        <button type="button" aria-expanded={reset} onClick={() => setReset(true)}>Review case-only disposition reset</button>
        {reset && <div><p>Replace only this fictional QL-231 case; other companies remain unchanged.</p>
          <button type="button" disabled={!item.eligible} onClick={() => { change((previous, id) => beginQl231Disposition(sources, previous, organization.id, id)); setReset(false); setNote(''); }}>Confirm case-only disposition reset</button>
          <button type="button" onClick={() => setReset(false)}>Cancel reset</button></div>}</div>}
      {item.record && item.sourceStatus === 'SOURCE_CURRENT' && <>
        <p className="ql222-cycle" role="status">Simulated cycle <strong>{item.record.cycle}/12</strong> · Unreviewed <strong>{item.unreviewed}</strong> · Due soon <strong>{item.dueSoon}</strong> · Overdue <strong>{item.overdue}</strong> · Separate rechecks due <strong>{item.separateRechecksDue}</strong>.</p>
        <section aria-labelledby="ql231-gaps"><h5 id="ql231-gaps">Reviewer disposition and independent recheck gaps ({item.gaps.length})</h5>
          {item.gaps.map((gap) => <article className="ql218-gap" key={gap.category}><h6>{gap.category.replaceAll('_', ' ')} · {gap.priority}</h6>
            <p>QL-230 reviewer decision <strong>{gap.reviewerDecision.replaceAll('_', ' ')}</strong> · QL-231 evidence recheck <strong>{gap.evidence.replaceAll('_', ' ')}</strong>.</p>
            <p>Disposition <strong>{gap.disposition.replaceAll('_', ' ')}</strong> · Recheck action <strong>{gap.recheck.replaceAll('_', ' ')}</strong> · Age <strong>{gap.age === null ? 'NOT TRACKED' : `${gap.age} cycle(s)`}</strong>.</p>
            {gap.dueSoon && <p className="ql223-approaching">Fictional independent recheck approaching overdue threshold.</p>}
            {gap.overdue && <p className="ql219-due">Overdue fictional evidence recheck: escalation draft required; historical lateness is retained.</p>}
            {gap.missingSeparateRecheck && <p className="ql219-due">Separate-recheck referral required for inherited or recurring evidence risk.</p>}
            {gap.missingDisposition && <p className="ql219-due">Recurring evidence requires reopening or an independent-review referral disposition.</p>}
            <p>Recurring events <strong>{gap.recheckRecurrences}</strong> · Historical overdue rechecks <strong>{gap.overdueRecheckEpisodes}</strong> · Actual independent verification <strong>UNVERIFIED</strong>.</p></article>)}
        </section>
        {item.record.phase === 'reviewer_recurrence_disposition_recheck_draft' ? <>
          <div className="ql218-form"><label htmlFor="ql231-gap">Evidence gap to recheck</label>
            <select id="ql231-gap" value={selectedCategory ?? ''} onChange={(event) => { setCategory(event.target.value as Ql214GapCategory); setNote(''); }}>
              {item.gaps.map((gap) => <option key={gap.category} value={gap.category}>{gap.category.replaceAll('_', ' ')} · {gap.recheckRecurrences} recurrence events</option>)}</select>
            <label htmlFor="ql231-evidence">Fictional evidence recheck outcome · UNVERIFIED</label>
            <select id="ql231-evidence" value={evidence} onChange={(event) => setEvidence(event.target.value as Ql231Evidence)}>
              <option value="EVIDENCE_RECHECK_PENDING_UNVERIFIED">Evidence recheck pending · UNVERIFIED</option>
              <option value="SIMULATED_RECHECK_MATCH_UNVERIFIED">Imagined recheck match · UNVERIFIED</option>
              <option value="SIMULATED_RECHECK_EXCEPTION_UNVERIFIED">Imagined recurring recheck exception · UNVERIFIED</option></select>
            <label htmlFor="ql231-disposition">Independent reviewer disposition · UNSENT</label>
            <select id="ql231-disposition" value={disposition} onChange={(event) => setDisposition(event.target.value as Ql231Disposition)}>
              <option value="CONTINUE_HELD_REVIEW_DRAFT">Continue held reviewer follow-up · draft</option>
              <option value="REFER_FURTHER_INDEPENDENT_REVIEW_DRAFT">Refer independent reviewer · unsent draft</option>
              <option value="REOPEN_EVIDENCE_EXCEPTION_DRAFT">Reopen fictional evidence exception · draft</option></select>
            <label htmlFor="ql231-recheck">Evidence recheck follow-up · UNSENT</label>
            <select id="ql231-recheck" value={recheck} onChange={(event) => setRecheck(event.target.value as Ql231Recheck)}>
              <option value="RECHECK_MONITOR_HELD_DRAFT">Monitor held recheck · draft</option>
              <option value="REFER_SEPARATE_RECHECK_DRAFT">Refer separate evidence recheck · unsent draft</option>
              <option value="ESCALATE_OVERDUE_RECHECK_DRAFT">Escalate overdue recheck · unsent draft</option></select>
            <label htmlFor="ql231-note">Fictional evidence note (8–180 characters)</label>
            <textarea id="ql231-note" rows={3} maxLength={180} value={note} onChange={(event) => setNote(event.target.value)} placeholder="Synthetic notes only; never enter a real reviewer or customer identity." />
            <button type="button" disabled={!selectedCategory || note.trim().length < 8 ||
              (!!selectedGap?.overdue && recheck !== 'ESCALATE_OVERDUE_RECHECK_DRAFT') ||
              (evidence === 'SIMULATED_RECHECK_EXCEPTION_UNVERIFIED' && disposition === 'CONTINUE_HELD_REVIEW_DRAFT')}
              onClick={() => { if (selectedCategory) change((previous, id) => recordQl231Recheck(sources, previous,
                organization.id, id, selectedCategory, evidence, disposition, recheck, note)); setNote(''); }}>Record fictional disposition &amp; evidence recheck · UNSENT</button>
            <button type="button" disabled={item.record.cycle >= 12} onClick={() => change((previous, id) => advanceQl231Cycle(sources, previous, organization.id, id))}>Advance synthetic evidence recheck cycle (+1)</button>
            <small>Two fictional cycles is due soon, three overdue. Recheck drafts do not verify independent evidence.</small></div>
          <section className="ql219-checklist" aria-labelledby="ql231-checks"><h5 id="ql231-checks">Independent reviewer &amp; conditional hold exception oversight · UNVERIFIED checks</h5>
            {QL231_CHECKS.map((check) => <article key={check.id} className="ql219-check"><div><strong>{check.title}</strong><p>{check.detail}</p></div>
              <button type="button" disabled={item.record?.checks[check.id] === 'ACKNOWLEDGED_UNVERIFIED'} onClick={() => change((previous, id) => acknowledgeQl231Check(sources, previous, organization.id, id, check.id))}>
                {item.record?.checks[check.id] === 'ACKNOWLEDGED_UNVERIFIED' ? 'Locally reviewed · UNVERIFIED' : 'Acknowledge disposition hold · UNVERIFIED'}</button></article>)}
          </section>
          <button type="button" disabled={!item.readyForLocalAudit} onClick={() => change((previous, id) => prepareQl231Oversight(sources, previous, organization.id, id))}>Prepare disposition &amp; hold exception oversight packet · NO RELEASE</button>
        </> : <p className="ql218-prepared" role="status">QL-231 fictional reviewer disposition and held-release exception oversight packet prepared locally. No actual independent sign-off or pilot approval.</p>}
      </>}
      <div className="ql218-actions"><button type="button" onClick={() => onNavigate('reviewer_continuity')}>Inspect QL-230 reviewer continuity</button>
        <button type="button" onClick={() => onNavigate('reassignment_audit')}>Inspect QL-229 reassignment audit</button></div>
    </section>}</div>
    <section className="ql218-panel" aria-labelledby="ql231-holds"><h4 id="ql231-holds">Actual QL-181 prerequisites · conditional hold exception oversight (read only)</h4>
      <p>Expected <strong>{company.holdAudit.expected}</strong> · Observed <strong>{company.holdAudit.observed}</strong> · HELD_UNVERIFIED <strong>{company.holdAudit.held}</strong> · Conditional release <strong>BLOCKED</strong>.</p>
      <div className="ql218-scroll"><table><thead><tr><th scope="col">QL-181 prerequisite</th><th scope="col">Actual verification requirement</th><th scope="col">State</th></tr></thead>
        <tbody>{portfolio.prerequisites.map((hold) => <tr key={hold.id}><th scope="row">{hold.title}</th><td>{hold.requiredBeforePilot}</td><td>{hold.state}</td></tr>)}</tbody></table></div>
    </section>
    <section className="ql218-panel" aria-labelledby="ql231-receipt"><h4 id="ql231-receipt">Redacted reviewer recurrence and hold exception oversight receipt</h4>
      <button type="button" aria-expanded={receiptOpen} aria-controls="ql231-receipt-data" onClick={() => setReceiptOpen((open) => !open)}>{receiptOpen ? 'Hide' : 'Show'} local QL-231 oversight receipt</button>
      {receiptOpen && <div id="ql231-receipt-data"><p>Fictional coded status only: no private notes, source change tokens or reviewer identities.</p>
        <textarea readOnly rows={15} aria-label="Fixture-only QL-231 disposition oversight receipt" value={ql231CompanyReceipt(sources, ledger, organization.id)} /></div>}
    </section>
    <p className="ql218-foot">GREEN software deployment is not live pilot approval. All calls/SMS and actual independent authorization remain blocked.</p>
  </section>;
}

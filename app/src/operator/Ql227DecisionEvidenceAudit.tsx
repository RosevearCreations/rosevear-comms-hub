import { useState, type Dispatch, type SetStateAction } from 'react';
import type { OperatorOrganization, OperatorWorkspace } from './ql191Organizations';
import type { Ql211ScenarioId } from './ql211OwnerTrial';
import type { Ql214GapCategory } from './ql214ReviewIntake';
import { QL227_RELEASE, QL227_CHECKS, ql227CompanyDecisions, ql227Portfolio,
  ql227CompanyReceipt, beginQl227Audit, recordQl227Decision, advanceQl227Cycle,
  acknowledgeQl227Check, prepareQl227HeldAudit,
  type Ql227Sources, type Ql227Ledger, type Ql227Evidence, type Ql227Decision } from './ql227DecisionEvidenceAudit';
import './ql227-decision-evidence-audit.css';

const sourceText: Record<string, string> = {
  AWAITING_PREPARED_QL226: 'Awaiting prepared fictional QL-226 reopening packet',
  SOURCE_CURRENT: 'QL-226 reopened outcomes and evidence match',
  QL226_REOPEN_OUTCOME_REVISED: 'FROZEN · QL-226 follow-up evidence changed',
  UPSTREAM_STALE: 'FROZEN · earlier independent follow-up evidence is no longer current'
};

export function Ql227DecisionEvidenceAudit({ organization, sources, ledger, setLedger, onNavigate }: {
  organization: OperatorOrganization;
  sources: Ql227Sources;
  ledger: Ql227Ledger;
  setLedger: Dispatch<SetStateAction<Ql227Ledger>>;
  onNavigate: (workspace: OperatorWorkspace) => void;
}) {
  const [selected, setSelected] = useState<Ql211ScenarioId | null>(null);
  const [category, setCategory] = useState<Ql214GapCategory | ''>('');
  const [evidence, setEvidence] = useState<Ql227Evidence>('EVIDENCE_STILL_OPEN_UNVERIFIED');
  const [decision, setDecision] = useState<Ql227Decision>('CONTINUE_HELD_FOLLOW_UP_DRAFT');
  const [note, setNote] = useState('');
  const [help, setHelp] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const portfolio = ql227Portfolio(sources, ledger);
  const company = ql227CompanyDecisions(sources, ledger, organization.id);
  const item = company.cases.find((entry) => entry.scenario === selected) ?? company.cases[0];
  const selectedCategory = category && item?.gaps.some((gap) => gap.category === category) ? category : item?.gaps[0]?.category;
  const selectedGap = item?.gaps.find((gap) => gap.category === selectedCategory);
  function change(operation: (previous: Ql227Ledger, scenario: Ql211ScenarioId) => Ql227Ledger) {
    if (item) setLedger((previous) => operation(previous, item.scenario));
  }

  return <section className="ql218-workbench ql227-workbench" data-ql227-release={QL227_RELEASE} data-organization={organization.id} aria-labelledby="ql227-title">
    <header className="ql218-header"><div><p className="ql191-eyebrow">QL-227 · Owner decision aging &amp; independent evidence · Disabled preview</p>
      <h3 id="ql227-title">Four-company reopened owner decisions, evidence reconciliation &amp; release holds</h3>
      <p>Review invented reopened exception follow-ups, reconcile fictional independent evidence and keep conditional pilot release blocked.</p></div>
      <button type="button" aria-expanded={help} aria-controls="ql227-help" onClick={() => setHelp((value) => !value)}>ⓘ Owner decision aging help</button></header>
    <div className="ql218-warning" role="note"><strong>NO REAL OWNER OR INDEPENDENT APPROVAL.</strong> All {portfolio.prerequisites.length} actual QL-181 prerequisites remain HELD_UNVERIFIED. Review records are fictional, unsent drafts: no calls, SMS, provider actions, customer records or Supabase writes.</div>
    {help && <p className="ql218-help" id="ql227-help">Start from a current and locally prepared synthetic QL-226 reopening packet. Reconcile every invented independent evidence gap and record an unsent owner follow-up decision. At two simulated cycles a decision is due soon; three or more is overdue and must be refreshed by an independent recheck referral draft. Inherited P0, repeated/reopened, conflicted and historically overdue cases require independent referral. Each invented evidence conflict counts once per gap/cycle. Review cannot prepare unless every gap is classified, all three checks are acknowledged UNVERIFIED, no overdue or independent referral debt remains, and all twelve actual release prerequisites are held. Changes to upstream source freeze the case until explicit case-only reset.</p>}
    <div className="ql218-metrics" role="status">
      <div><small>Eligible QL-226 cases</small><strong>{portfolio.eligible}</strong><span>Four separate companies</span></div>
      <div><small>Due soon / overdue</small><strong>{portfolio.dueSoon} / {portfolio.overdue}</strong><span>Invented owner decision cycles</span></div>
      <div><small>Evidence conflicts / historical</small><strong>{portfolio.conflicts} / {portfolio.conflictEvents}</strong><span>Synthetic events only</span></div>
      <div><small>Prepared / stale</small><strong>{portfolio.prepared} / {portfolio.stale}</strong><span>Never a real pilot release</span></div>
    </div>
    <section className="ql218-panel" aria-labelledby="ql227-portfolio"><h4 id="ql227-portfolio">Four-company owner aging &amp; independent follow-up evidence</h4>
      <div className="ql218-scroll"><table><caption>Fictional review counts only; no actual independent verification or hold closure.</caption>
        <thead><tr><th scope="col">Company</th><th scope="col">Eligible</th><th scope="col">Tracking</th><th scope="col">Undecided</th><th scope="col">Due soon</th><th scope="col">Overdue</th><th scope="col">Past overdue</th><th scope="col">Referral due</th><th scope="col">Evidence open</th><th scope="col">Conflicts</th><th scope="col">Prepared</th><th scope="col">Stale</th><th scope="col">Holds</th></tr></thead>
        <tbody>{portfolio.companies.map((row) => <tr key={row.company}><th scope="row">{row.company === 'rosiedazzlers' ? 'Rosie Dazzlers' : row.company === 'devilndove' ? 'Devil n Dove' : row.company === 'icamp' ? 'iCamp' : 'YW · Property Maintenance'}</th>
          <td>{row.eligible}</td><td>{row.tracking}</td><td>{row.undecided}</td><td>{row.dueSoon}</td><td>{row.overdue}</td><td>{row.overdueDecisions}</td><td>{row.referralsDue}</td><td>{row.evidenceOpen}</td><td>{row.conflicts}</td><td>{row.prepared}</td><td>{row.stale}</td><td>{row.holdAudit.held}/12 HELD</td></tr>)}</tbody></table></div>
    </section>
    <div className="ql218-grid"><section className="ql218-panel" aria-labelledby="ql227-cases"><h4 id="ql227-cases">{organization.name} · Reopened fictional evidence cases</h4>
      {company.cases.length === 0 ? <p>No fictional QL-211 finding exists. <button type="button" onClick={() => onNavigate('trial')}>Open owner trial</button></p> :
        <div role="group" aria-label="Select owner decision and evidence case">{company.cases.map((candidate) => <button type="button" key={candidate.scenario}
          className={candidate.scenario === item?.scenario ? 'ql218-case active' : 'ql218-case'} aria-pressed={candidate.scenario === item?.scenario}
          onClick={() => { setSelected(candidate.scenario); setCategory(''); setNote(''); setConfirmReset(false); }}>
          <strong>{candidate.title}</strong><span>{candidate.priority} · {sourceText[candidate.sourceStatus]} · {candidate.overdueDecisions} fictional overdue owner decision(s)</span></button>)}</div>}
      {company.orphaned > 0 && <p className="ql218-warning" role="alert">{company.orphaned} orphaned review(s) remain held and cannot be treated as closed.</p>}
    </section>
    {item && <section className="ql218-panel" aria-labelledby="ql227-selected"><h4 id="ql227-selected">{item.title} · Evidence reconciliation &amp; owner decision</h4>
      <p className="ql218-source">Source: <strong>{sourceText[item.sourceStatus]}</strong> · Prepared QL-226: <strong>{item.prepared ? 'yes · fictional only' : 'no'}</strong>.</p>
      {!item.eligible && <div className="ql218-warning">A current, locally prepared QL-226 review packet is required. <button type="button" onClick={() => onNavigate('reopen_review')}>Inspect QL-226 source</button></div>}
      {item.eligible && !item.record && <button type="button" onClick={() => change((previous, id) => beginQl227Audit(sources, previous, organization.id, id))}>Begin fictional owner decision &amp; evidence audit</button>}
      {item.record && item.sourceStatus !== 'SOURCE_CURRENT' && <div className="ql218-warning" role="alert"><p>Review frozen: reopened evidence source changed. Previous local decisions remain unverified and are not automatically accepted.</p>
        <button type="button" aria-expanded={confirmReset} onClick={() => setConfirmReset(true)}>Review case-only evidence reset</button>
        {confirmReset && <div><p>Replace only this synthetic QL-227 case with the current prepared QL-226 source, clearing its draft history. Other companies and cases remain unchanged.</p>
          <button type="button" disabled={!item.eligible} onClick={() => { change((previous, id) => beginQl227Audit(sources, previous, organization.id, id)); setConfirmReset(false); setNote(''); }}>Confirm case-only evidence reset</button>
          <button type="button" onClick={() => setConfirmReset(false)}>Cancel reset</button></div>}</div>}
      {item.record && item.sourceStatus === 'SOURCE_CURRENT' && <>
        <p className="ql222-cycle" role="status">Simulated cycle <strong>{item.record.cycle}/12</strong> · Undecided <strong>{item.undecided}</strong> · Due soon <strong>{item.dueSoon}</strong> · Overdue <strong>{item.overdue}</strong> · Independent referrals due <strong>{item.referralsDue}</strong>.</p>
        <section aria-labelledby="ql227-gaps"><h5 id="ql227-gaps">Independent evidence gaps ({item.gaps.length})</h5>
          {item.gaps.map((gap) => <article className="ql218-gap" key={gap.category}><h6>{gap.category.replaceAll('_', ' ')} · {gap.priority}</h6>
            <p>QL-226 reopened outcome <strong>{gap.outcome.replaceAll('_', ' ')}</strong> · Independent evidence reconciliation <strong>{gap.reconciledEvidence.replaceAll('_', ' ')}</strong>.</p>
            <p>Owner decision <strong>{gap.ownerDecision.replaceAll('_', ' ')}</strong> · Simulated age <strong>{gap.decisionAge === null ? 'NOT TRACKED' : `${gap.decisionAge} cycle(s)`}</strong> · Next due cycle <strong>{gap.nextDueCycle ?? 'NOT SET'}</strong>.</p>
            {gap.dueSoon && <p className="ql223-approaching">Invented owner decision approaching follow-up deadline.</p>}
            {gap.overdue && <p className="ql219-due">Overdue. Refresh requires an unsent independent recheck referral; historical overdue counts persist.</p>}
            {gap.referralMissing && <p className="ql219-due">Independent referral draft still required for reopened, conflicted or priority evidence.</p>}
            <p>Historical overdue decisions <strong>{gap.overdueDecisions}</strong> · Synthetic evidence conflicts <strong>{gap.reconciliationConflicts}</strong> · Actual independent verification <strong>UNVERIFIED</strong>.</p></article>)}
        </section>
        {item.record.phase === 'reopened_owner_decision_evidence_reconciliation_draft' ? <>
          <div className="ql218-form"><label htmlFor="ql227-gap">Reopened evidence gap</label>
            <select id="ql227-gap" value={selectedCategory ?? ''} onChange={(event) => { setCategory(event.target.value as Ql214GapCategory); setNote(''); }}>
              {item.gaps.map((gap) => <option key={gap.category} value={gap.category}>{gap.category.replaceAll('_', ' ')} · {gap.overdueDecisions} overdue decisions</option>)}</select>
            <label htmlFor="ql227-evidence">Independent evidence reconciliation · fictional/unverified</label>
            <select id="ql227-evidence" value={evidence} onChange={(event) => setEvidence(event.target.value as Ql227Evidence)}>
              <option value="EVIDENCE_STILL_OPEN_UNVERIFIED">Evidence remains open · UNVERIFIED</option>
              <option value="SIMULATED_MATCH_UNVERIFIED">Invented source match · UNVERIFIED</option>
              <option value="SIMULATED_CONFLICT_UNVERIFIED">Invented source conflict · UNVERIFIED</option></select>
            <label htmlFor="ql227-decision">Owner follow-up decision · UNSENT</label>
            <select id="ql227-decision" value={decision} onChange={(event) => setDecision(event.target.value as Ql227Decision)}>
              <option value="CONTINUE_HELD_FOLLOW_UP_DRAFT">Maintain held owner follow-up · draft</option>
              <option value="REQUEST_OWNER_EVIDENCE_DRAFT">Request new evidence · unsent draft</option>
              <option value="REFER_INDEPENDENT_RECHECK_DRAFT">Refer independent recheck · unsent draft</option></select>
            <label htmlFor="ql227-note">Fictional evidence reconciliation note (8–180 characters)</label>
            <textarea id="ql227-note" rows={3} maxLength={180} value={note} onChange={(event) => setNote(event.target.value)} placeholder="Synthetic note only; no actual customer or reviewer information." />
            <button type="button" disabled={!selectedCategory || note.trim().length < 8 || !!selectedGap?.overdue && decision !== 'REFER_INDEPENDENT_RECHECK_DRAFT'}
              onClick={() => { if (selectedCategory) change((previous, id) => recordQl227Decision(sources, previous, organization.id, id, selectedCategory, evidence, decision, note)); setNote(''); }}>Record fictional owner decision &amp; evidence reconciliation · UNSENT</button>
            <button type="button" disabled={item.record.cycle >= 12} onClick={() => change((previous, id) => advanceQl227Cycle(sources, previous, organization.id, id))}>Advance synthetic owner decision aging cycle (+1)</button>
            <small>Two fictional cycles is due soon; three overdue. Matching imaginary evidence cannot verify actual evidence or clear release holds.</small></div>
          <section className="ql219-checklist" aria-labelledby="ql227-checks"><h5 id="ql227-checks">Independent follow-up &amp; held release · local UNVERIFIED checks</h5>
            {QL227_CHECKS.map((check) => <article key={check.id} className="ql219-check"><div><strong>{check.title}</strong><p>{check.detail}</p></div>
              <button type="button" disabled={item.record?.checks[check.id] === 'ACKNOWLEDGED_UNVERIFIED'} onClick={() => change((previous, id) => acknowledgeQl227Check(sources, previous, organization.id, id, check.id))}>
                {item.record?.checks[check.id] === 'ACKNOWLEDGED_UNVERIFIED' ? 'Locally reviewed · UNVERIFIED' : 'Acknowledge held-release audit · UNVERIFIED'}</button></article>)}
          </section>
          <button type="button" disabled={!item.readyForLocalAudit} onClick={() => change((previous, id) => prepareQl227HeldAudit(sources, previous, organization.id, id))}>Prepare owner evidence reconciliation &amp; held-release audit packet · NO RELEASE</button>
        </> : <p className="ql218-prepared" role="status">QL-227 fictional reopened decision and held-release audit packet prepared locally. No actual owner approval, independent verification or release.</p>}
      </>}
      <div className="ql218-actions"><button type="button" onClick={() => onNavigate('reopen_review')}>Inspect QL-226 reopen audit</button>
        <button type="button" onClick={() => onNavigate('disposition')}>Inspect QL-225 dispositions</button></div>
    </section>}</div>
    <section className="ql218-panel" aria-labelledby="ql227-holds"><h4 id="ql227-holds">Actual QL-181 pilot prerequisites · read-only held-release audit</h4>
      <p>Expected <strong>{company.holdAudit.expected}</strong> · Observed <strong>{company.holdAudit.observed}</strong> · HELD_UNVERIFIED <strong>{company.holdAudit.held}</strong> · Conditional release <strong>BLOCKED</strong>.</p>
      <div className="ql218-scroll"><table><thead><tr><th scope="col">QL-181 prerequisite</th><th scope="col">Real verification required</th><th scope="col">Actual state</th></tr></thead>
        <tbody>{portfolio.prerequisites.map((hold) => <tr key={hold.id}><th scope="row">{hold.title}</th><td>{hold.requiredBeforePilot}</td><td>{hold.state}</td></tr>)}</tbody></table></div>
    </section>
    <section className="ql218-panel" aria-labelledby="ql227-receipt"><h4 id="ql227-receipt">Redacted reopened owner decision &amp; independent evidence receipt</h4>
      <button type="button" aria-expanded={showReceipt} aria-controls="ql227-receipt-data" onClick={() => setShowReceipt((value) => !value)}>{showReceipt ? 'Hide' : 'Show'} local QL-227 audit receipt</button>
      {showReceipt && <div id="ql227-receipt-data"><p>Coded decisions and invented counts only; no private notes, reviewers, customers or source tokens.</p>
        <textarea readOnly rows={15} aria-label="Fixture-only QL-227 independent evidence receipt" value={ql227CompanyReceipt(sources, ledger, organization.id)} /></div>}
    </section>
    <p className="ql218-foot">A passing production build never approves real communications. Live calls, SMS and actual independent release remain blocked.</p>
  </section>;
}

import { useState, type Dispatch, type SetStateAction } from 'react';
import type { OperatorOrganization, OperatorWorkspace } from './ql191Organizations';
import type { Ql211ScenarioId } from './ql211OwnerTrial';
import type { Ql214GapCategory } from './ql214ReviewIntake';
import { QL224_RELEASE, QL224_CHECKS, ql224CompanyEscalations, ql224Portfolio,
  ql224CompanyReceipt, beginQl224Replay, recordQl224Reconciliation, advanceQl224Cycle,
  acknowledgeQl224Check, prepareQl224Continuity,
  type Ql224Sources, type Ql224Ledger, type Ql224Evidence, type Ql224Route } from './ql224OverdueEscalation';
import './ql224-overdue-hold-audit.css';

const sourceText: Record<string, string> = {
  AWAITING_PREPARED_QL223: 'Awaiting prepared fictional QL-223 follow-up packet',
  SOURCE_CURRENT: 'Prepared QL-223 evidence follow-up matches',
  QL223_FOLLOW_UP_REVISED: 'FROZEN · QL-223 follow-up evidence changed',
  UPSTREAM_STALE: 'FROZEN · earlier evidence is no longer current'
};

export function Ql224OverdueHoldAudit({ organization, sources, ledger, setLedger, onNavigate }: {
  organization: OperatorOrganization;
  sources: Ql224Sources;
  ledger: Ql224Ledger;
  setLedger: Dispatch<SetStateAction<Ql224Ledger>>;
  onNavigate: (workspace: OperatorWorkspace) => void;
}) {
  const [selected, setSelected] = useState<Ql211ScenarioId | null>(null);
  const [category, setCategory] = useState<Ql214GapCategory | ''>('');
  const [evidence, setEvidence] = useState<Ql224Evidence>('STILL_OPEN_UNVERIFIED');
  const [route, setRoute] = useState<Ql224Route>('HOLD_AND_MONITOR_DRAFT');
  const [note, setNote] = useState('');
  const [help, setHelp] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const portfolio = ql224Portfolio(sources, ledger);
  const company = ql224CompanyEscalations(sources, ledger, organization.id);
  const item = company.cases.find((entry) => entry.scenario === selected) ?? company.cases[0];
  const selectedCategory = category && item?.gaps.some((gap) => gap.category === category) ? category : item?.gaps[0]?.category;

  function change(operation: (previous: Ql224Ledger, scenario: Ql211ScenarioId) => Ql224Ledger) {
    if (item) setLedger((previous) => operation(previous, item.scenario));
  }

  return <section className="ql218-workbench ql224-workbench" data-ql224-release={QL224_RELEASE} data-organization={organization.id} aria-labelledby="ql224-title">
    <header className="ql218-header"><div><p className="ql191-eyebrow">QL-224 · Overdue escalation replay · Disabled preview</p>
      <h3 id="ql224-title">Four-company overdue follow-up, evidence reconciliation &amp; independent holds</h3>
      <p>Rehearse overdue routing, track invented evidence conflicts and inspect unchanged pilot release holds.</p></div>
      <button type="button" aria-expanded={help} aria-controls="ql224-help" onClick={() => setHelp((value) => !value)}>ⓘ Overdue escalation help</button></header>
    <div className="ql218-warning" role="note"><strong>NO REAL ESCALATION OR RELEASE.</strong> All {portfolio.prerequisites.length} QL-181 prerequisites remain HELD_UNVERIFIED. Owner and independent decisions are fictional, untransmitted drafts; no live calls, SMS, provider operations or database writes are performed.</div>
    {help && <p className="ql218-help" id="ql224-help">Start from a locally prepared and current fictional QL-223 packet. Reconcile every invented evidence gap and select its unsent escalation route. Synthetic age two is due soon; age three or more is overdue and can only be refreshed using a draft independent referral. Each overdue episode remains counted after refresh. Recurrent, P0, historically overdue or conflicting gaps require independent referral before packet preparation. Repeated invented conflicts count once per gap/cycle. Three unverified checks and all twelve real held prerequisites are required. Any QL-223 source revision freezes the review until explicit case-only reset.</p>}
    <div className="ql218-metrics" role="status">
      <div><small>Eligible QL-223 packets</small><strong>{portfolio.eligible}</strong><span>All four companies</span></div>
      <div><small>Due soon / overdue</small><strong>{portfolio.dueSoon} / {portfolio.overdue}</strong><span>Invented cycles</span></div>
      <div><small>Historical overdue escalations</small><strong>{portfolio.historicalEscalations}</strong><span>Never erased by refresh</span></div>
      <div><small>Packets prepared / stale</small><strong>{portfolio.prepared} / {portfolio.stale}</strong><span>No real closure</span></div>
    </div>
    <section className="ql218-panel" aria-labelledby="ql224-portfolio"><h4 id="ql224-portfolio">Four-company overdue escalation &amp; independent hold portfolio</h4>
      <div className="ql218-scroll"><table><caption>Local synthetic follow-up audit counts only, not actual approval or verified evidence.</caption>
        <thead><tr><th scope="col">Company</th><th scope="col">Eligible</th><th scope="col">Tracking</th><th scope="col">Undecided</th><th scope="col">Due soon</th><th scope="col">Overdue</th><th scope="col">Escalated overdue</th><th scope="col">Referral due</th><th scope="col">Evidence open</th><th scope="col">Conflicts</th><th scope="col">Prepared</th><th scope="col">Stale</th><th scope="col">Holds</th></tr></thead>
        <tbody>{portfolio.companies.map((row) => <tr key={row.company}><th scope="row">{row.company === 'rosiedazzlers' ? 'Rosie Dazzlers' : row.company === 'devilndove' ? 'Devil n Dove' : row.company === 'icamp' ? 'iCamp' : 'YW · Property Maintenance'}</th>
          <td>{row.eligible}</td><td>{row.tracking}</td><td>{row.undecided}</td><td>{row.dueSoon}</td><td>{row.overdue}</td><td>{row.historicalEscalations}</td><td>{row.referralsDue}</td><td>{row.openEvidence}</td><td>{row.sourceConflicts}</td><td>{row.prepared}</td><td>{row.stale}</td><td>{row.holdAudit.held}/12 HELD</td></tr>)}</tbody></table></div>
    </section>
    <div className="ql218-grid"><section className="ql218-panel" aria-labelledby="ql224-cases"><h4 id="ql224-cases">{organization.name} · Fictional escalation cases</h4>
      {company.cases.length === 0 ? <p>No fictional QL-211 finding exists for this company. <button type="button" onClick={() => onNavigate('trial')}>Open owner trial</button></p> :
        <div role="group" aria-label="Select overdue escalation case">{company.cases.map((candidate) => <button type="button" key={candidate.scenario}
          className={candidate.scenario === item?.scenario ? 'ql218-case active' : 'ql218-case'} aria-pressed={candidate.scenario === item?.scenario}
          onClick={() => { setSelected(candidate.scenario); setCategory(''); setNote(''); setConfirmReset(false); }}>
          <strong>{candidate.title}</strong><span>{candidate.priority} · {sourceText[candidate.sourceStatus]} · {candidate.historicalEscalations} invented overdue escalation(s)</span></button>)}</div>}
      {company.orphaned > 0 && <p role="alert" className="ql218-warning">{company.orphaned} orphaned local case(s) remain held and cannot be treated as closed.</p>}
    </section>
    {item && <section className="ql218-panel" aria-labelledby="ql224-selected"><h4 id="ql224-selected">{item.title} · Evidence and owner follow-up replay</h4>
      <p className="ql218-source">Source: <strong>{sourceText[item.sourceStatus]}</strong> · Prepared QL-223: <strong>{item.prepared ? 'yes · fictional only' : 'no'}</strong>.</p>
      {!item.eligible && <div className="ql218-warning">A current, locally prepared QL-223 owner aging packet is required. <button type="button" onClick={() => onNavigate('aging')}>Inspect QL-223 source</button></div>}
      {item.eligible && !item.record && <button type="button" onClick={() => change((previous, id) => beginQl224Replay(sources, previous, organization.id, id))}>Begin fictional overdue escalation replay</button>}
      {item.record && item.sourceStatus !== 'SOURCE_CURRENT' && <div role="alert" className="ql218-warning"><strong>Escalation review frozen.</strong> QL-223 or its upstream evidence changed; previous invented reviews cannot advance.
        {item.eligible && <><button type="button" aria-expanded={confirmReset} aria-controls="ql224-reset" onClick={() => setConfirmReset((value) => !value)}>Reconcile revised QL-223 source</button>
          {confirmReset && <div id="ql224-reset"><p>Explicitly reset only this case? Its local history, notes, cycle counts and acknowledgments will be cleared. All other companies and cases remain preserved.</p>
            <button type="button" onClick={() => { change((previous, id) => beginQl224Replay(sources, previous, organization.id, id)); setConfirmReset(false); setNote(''); }}>Confirm case-only escalation reset</button>
            <button type="button" onClick={() => setConfirmReset(false)}>Cancel reset</button></div>}</>}
      </div>}
      {item.record && item.sourceStatus === 'SOURCE_CURRENT' && <>
        <p className="ql222-cycle" role="status">Synthetic cycle <strong>{item.record.cycle}/12</strong> · Undecided <strong>{item.undecided}</strong> · Due soon <strong>{item.dueSoon}</strong> · Overdue <strong>{item.overdue}</strong> · Independent referrals due <strong>{item.referralsDue}</strong>.</p>
        <section aria-labelledby="ql224-gaps"><h5 id="ql224-gaps">Open evidence reconciliation gaps ({item.gaps.length})</h5>
          {item.gaps.map((gap) => <article key={gap.category} className="ql218-gap"><h6>{gap.category.replaceAll('_', ' ')} · {gap.priority}</h6>
            <p>QL-223 evidence: <strong>{gap.ownerRoute.replaceAll('_', ' ')}</strong> · Current invented reconciliation: <strong>{gap.evidence.replaceAll('_', ' ')}</strong>.</p>
            <p>Escalation route: <strong>{gap.route.replaceAll('_', ' ')}</strong> · Synthetic age: <strong>{gap.followUpAge === null ? 'NOT TRACKED' : `${gap.followUpAge} cycle(s)`}</strong> · Due cycle: <strong>{gap.nextDueCycle ?? 'NOT SET'}</strong>.</p>
            {gap.dueSoon && <p className="ql223-approaching">Approaching simulated follow-up deadline.</p>}
            {gap.overdue && <p className="ql219-due">Overdue. Only an unsent independent referral can refresh this decision; the historical count remains.</p>}
            {gap.referralMissing && <p className="ql219-due">An independent referral draft is required for this source, risk or overdue event.</p>}
            <p>Overdue escalations: <strong>{gap.overdueEscalations}</strong> · Invented conflict events: <strong>{gap.conflictEvents}</strong> · Real evidence <strong>UNVERIFIED</strong>.</p></article>)}
        </section>
        {item.record.phase === 'overdue_escalation_replay_draft' ? <>
          <div className="ql218-form"><label htmlFor="ql224-gap">Evidence exception gap</label>
            <select id="ql224-gap" value={selectedCategory ?? ''} onChange={(event) => { setCategory(event.target.value as Ql214GapCategory); setNote(''); }}>
              {item.gaps.map((gap) => <option key={gap.category} value={gap.category}>{gap.category.replaceAll('_', ' ')} · {gap.overdueEscalations} overdue escalation(s)</option>)}</select>
            <label htmlFor="ql224-evidence">Fictional evidence reconciliation</label>
            <select id="ql224-evidence" value={evidence} onChange={(event) => setEvidence(event.target.value as Ql224Evidence)}>
              <option value="STILL_OPEN_UNVERIFIED">Evidence still open · unverified</option>
              <option value="FICTIONAL_EVIDENCE_MATCHED_UNVERIFIED">Invented evidence match · unverified</option>
              <option value="FICTIONAL_SOURCE_CONFLICT">Invented source conflict · unverified</option></select>
            <label htmlFor="ql224-route">Escalation and owner follow-up · unsent</label>
            <select id="ql224-route" value={route} onChange={(event) => setRoute(event.target.value as Ql224Route)}>
              <option value="HOLD_AND_MONITOR_DRAFT">Hold and monitor · draft only</option>
              <option value="REQUEST_NEW_EVIDENCE_DRAFT">Request new evidence · unsent</option>
              <option value="REFER_INDEPENDENT_DRAFT">Refer independent recheck · draft only</option></select>
            <label htmlFor="ql224-note">Fictional reconciliation note (8–180 characters)</label>
            <textarea id="ql224-note" rows={3} maxLength={180} value={note} onChange={(event) => setNote(event.target.value)} placeholder="Only invented findings. No real customer or reviewer details." />
            <button type="button" disabled={!selectedCategory || note.trim().length < 8 || !!item.gaps.find((gap) => gap.category === selectedCategory)?.overdue && route !== 'REFER_INDEPENDENT_DRAFT'} onClick={() => { if (selectedCategory) change((previous, id) => recordQl224Reconciliation(sources, previous, organization.id, id, selectedCategory, evidence, route, note)); setNote(''); }}>Record fictional escalation &amp; evidence reconciliation · UNSENT</button>
            <button type="button" disabled={item.record.cycle >= 12} onClick={() => change((previous, id) => advanceQl224Cycle(sources, previous, organization.id, id))}>Advance synthetic overdue follow-up cycle (+1)</button>
            <small>Due soon at two simulated cycles, overdue at three. Historical overdue escalations remain visible even after a fictional referral draft.</small></div>
          <section className="ql219-checklist" aria-labelledby="ql224-checks"><h5 id="ql224-checks">Independent hold continuity · local UNVERIFIED checks</h5>
            {QL224_CHECKS.map((check) => <article key={check.id} className="ql219-check"><div><strong>{check.title}</strong><p>{check.detail}</p></div>
              <button type="button" disabled={item.record?.checks[check.id] === 'ACKNOWLEDGED_UNVERIFIED'} onClick={() => change((previous, id) => acknowledgeQl224Check(sources, previous, organization.id, id, check.id))}>
                {item.record?.checks[check.id] === 'ACKNOWLEDGED_UNVERIFIED' ? 'Locally reviewed · UNVERIFIED' : 'Acknowledge independent hold · UNVERIFIED'}</button></article>)}
          </section>
          <button type="button" disabled={!item.readyForLocalAudit} onClick={() => change((previous, id) => prepareQl224Continuity(sources, previous, organization.id, id))}>Prepare overdue escalation &amp; hold continuity packet · NO RELEASE</button>
        </> : <p className="ql218-prepared" role="status">Fictional QL-224 overdue escalation and independent hold continuity packet prepared locally. No real owner approval, verified evidence closure or release.</p>}
      </>}
      <div className="ql218-actions"><button type="button" onClick={() => onNavigate('aging')}>Inspect QL-223 aging</button>
        <button type="button" onClick={() => onNavigate('exception')}>Inspect QL-222 decisions</button></div>
    </section>}</div>
    <section className="ql218-panel" aria-labelledby="ql224-holds"><h4 id="ql224-holds">Real QL-181 release prerequisites · read-only continuity</h4>
      <p>Expected <strong>{company.holdAudit.expected}</strong> · Observed <strong>{company.holdAudit.observed}</strong> · HELD_UNVERIFIED <strong>{company.holdAudit.held}</strong> · Conditional release <strong>BLOCKED</strong>.</p>
      <div className="ql218-scroll"><table><thead><tr><th scope="col">QL-181 prerequisite</th><th scope="col">Independent real evidence required</th><th scope="col">Actual state</th></tr></thead>
        <tbody>{portfolio.prerequisites.map((hold) => <tr key={hold.id}><th scope="row">{hold.title}</th><td>{hold.requiredBeforePilot}</td><td>{hold.state}</td></tr>)}</tbody></table></div>
    </section>
    <section className="ql218-panel" aria-labelledby="ql224-receipt-title"><h4 id="ql224-receipt-title">Redacted overdue escalation &amp; independent hold receipt</h4>
      <button type="button" aria-expanded={showReceipt} aria-controls="ql224-receipt" onClick={() => setShowReceipt((value) => !value)}>{showReceipt ? 'Hide' : 'Show'} local QL-224 audit receipt</button>
      {showReceipt && <div id="ql224-receipt"><p>Codes, synthetic ages and counts only. No source fingerprints, private notes, reviewer identities or customer details.</p>
        <textarea readOnly rows={15} aria-label="Fixture-only QL-224 overdue escalation receipt" value={ql224CompanyReceipt(sources, ledger, organization.id)} /></div>}
    </section>
    <p className="ql218-foot">Passing production CI is not live pilot acceptance. Real independent closure, calls and SMS remain blocked.</p>
  </section>;
}

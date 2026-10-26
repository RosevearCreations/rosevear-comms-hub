import { useState, type Dispatch, type SetStateAction } from 'react';
import type { OperatorOrganization, OperatorWorkspace } from './ql191Organizations';
import type { Ql211ScenarioId } from './ql211OwnerTrial';
import type { Ql214GapCategory } from './ql214ReviewIntake';
import { QL221_RELEASE, QL221_CHECKS, ql221CompanyReassessment, ql221Portfolio, ql221CompanyReceipt,
  beginQl221Refresh, recordQl221Refresh, advanceQl221Cycle, acknowledgeQl221Check, prepareQl221ContinuityAudit,
  type Ql221Sources, type Ql221Ledger, type Ql221Refresh, type Ql221EvidenceSource,
  type Ql221Action } from './ql221EvidenceRefresh';
import './ql221-evidence-refresh.css';

const sourceLabels: Record<string, string> = {
  AWAITING_PREPARED_QL220: 'Awaiting prepared fictional QL-220 owner audit',
  SOURCE_CURRENT: 'QL-220 prepared source matches',
  REOPEN_SOURCE_REVISED: 'FROZEN · reopened exception source revised',
  UPSTREAM_STALE: 'FROZEN · upstream review evidence stale'
};

export function Ql221EvidenceRefresh({ organization, sources, ledger, setLedger, onNavigate }: {
  organization: OperatorOrganization;
  sources: Ql221Sources;
  ledger: Ql221Ledger;
  setLedger: Dispatch<SetStateAction<Ql221Ledger>>;
  onNavigate: (workspace: OperatorWorkspace) => void;
}) {
  const [selected, setSelected] = useState<Ql211ScenarioId | null>(null);
  const [category, setCategory] = useState<Ql214GapCategory | ''>('');
  const [refreshValue, setRefreshValue] = useState<Ql221Refresh>('EVIDENCE_GAP_STILL_OPEN');
  const [source, setSource] = useState<Ql221EvidenceSource>('QL220_LOCAL_REPLAY');
  const [action, setAction] = useState<Ql221Action>('MAINTAIN_HOLD_DRAFT');
  const [note, setNote] = useState('');
  const [help, setHelp] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const portfolio = ql221Portfolio(sources, ledger);
  const company = ql221CompanyReassessment(sources, ledger, organization.id);
  const item = company.cases.find((candidate) => candidate.scenario === selected) ?? company.cases[0];
  const selectedCategory = category && item?.gaps.some((gap) => gap.category === category) ? category : item?.gaps[0]?.category;

  function change(operation: (previous: Ql221Ledger, scenario: Ql211ScenarioId) => Ql221Ledger) {
    if (item) setLedger((previous) => operation(previous, item.scenario));
  }

  return <section className="ql218-workbench ql221-workbench" data-ql221-release={QL221_RELEASE} data-organization={organization.id} aria-labelledby="ql221-title">
    <header className="ql218-header"><div><p className="ql191-eyebrow">QL-221 · Evidence refresh · Disabled preview</p>
      <h3 id="ql221-title">Four-company reopened exception reassessment &amp; release hold continuity</h3>
      <p>Review fictional fresh evidence labels against QL-220, rehearse owner follow-up reassessment, and check every real-pilot release hold remains unchanged.</p></div>
      <button type="button" aria-expanded={help} aria-controls="ql221-help" onClick={() => setHelp((value) => !value)}>ⓘ Evidence refresh help</button></header>
    <div className="ql218-warning" role="note"><strong>NO INDEPENDENT VERIFICATION OR RELEASE.</strong> All {portfolio.prerequisites.length} QL-181 prerequisites remain HELD_UNVERIFIED. Fictional evidence references do not mean a real attachment or retest exists. Owner actions stay unsent; independent review, closure, live provider calls and SMS remain disabled.</div>
    {help && <p className="ql218-help" id="ql221-help">Prepare an up-to-date fictional QL-220 owner follow-up audit. Start QL-221 refresh; choose a status-only evidence source and invented reassessment for every gap. Repeated gaps must retain drafted independent-review escalation. Three simulated cycles without a refresh create overdue follow-up. Confirm all three local audit checks before preparing a packet. Changes in QL-220 or its upstream sources freeze this record until an explicit case-only reset.</p>}
    <div className="ql218-metrics" role="status"><div><small>Eligible QL-220 audits</small><strong>{portfolio.eligible}</strong><span>Four companies</span></div>
      <div><small>Unrefreshed exceptions</small><strong>{portfolio.unrefreshed}</strong><span>Simulated evidence review</span></div>
      <div><small>Owner audits prepared</small><strong>{portfolio.prepared}</strong><span>Not actual closure</span></div>
      <div><small>Source-stale records</small><strong>{portfolio.stale}</strong><span>Frozen or orphaned</span></div></div>
    <section className="ql218-panel" aria-labelledby="ql221-portfolio"><h4 id="ql221-portfolio">Four-company evidence refresh and hold continuity</h4>
      <div className="ql218-scroll"><table><caption>Only session-local fictional counts; all real permission gates remain blocked.</caption>
        <thead><tr><th scope="col">Company</th><th scope="col">Eligible</th><th scope="col">Tracked</th><th scope="col">Unrefreshed</th><th scope="col">Escalation drafts due</th><th scope="col">Overdue</th><th scope="col">Prepared</th><th scope="col">Stale</th><th scope="col">Release holds</th></tr></thead>
        <tbody>{portfolio.companies.map((row) => <tr key={row.company}><th scope="row">{row.company === 'rosiedazzlers' ? 'Rosie Dazzlers' : row.company === 'devilndove' ? 'Devil n Dove' : row.company === 'icamp' ? 'iCamp' : 'YW · Property Maintenance'}</th>
          <td>{row.eligible}</td><td>{row.tracking}</td><td>{row.unrefreshed}</td><td>{row.escalationDue}</td><td>{row.overdue}</td><td>{row.prepared}</td><td>{row.stale}</td><td>{row.holdAudit.held}/12 HELD</td></tr>)}</tbody></table></div>
    </section>
    <div className="ql218-grid"><section className="ql218-panel" aria-labelledby="ql221-cases"><h4 id="ql221-cases">{organization.name} · Fictional reopened cases</h4>
      {company.cases.length === 0 ? <p>No fictional QL-211 case exists for this company. <button type="button" onClick={() => onNavigate('trial')}>Open owner trial</button></p> :
        <div role="group" aria-label="Select evidence refresh case">{company.cases.map((candidate) => <button type="button" key={candidate.scenario}
          className={candidate.scenario === item?.scenario ? 'ql218-case active' : 'ql218-case'} aria-pressed={candidate.scenario === item?.scenario}
          onClick={() => { setSelected(candidate.scenario); setCategory(''); setNote(''); setConfirmReset(false); }}>
          <strong>{candidate.title}</strong><span>{candidate.priority} · {sourceLabels[candidate.sourceStatus]} · {candidate.unrefreshed} unrefreshed</span></button>)}</div>}
      {company.orphaned > 0 && <p role="alert" className="ql218-warning">{company.orphaned} orphaned local refresh record(s) remain frozen, never closed.</p>}
    </section>
    {item && <section className="ql218-panel" aria-labelledby="ql221-selected"><h4 id="ql221-selected">{item.title} · Source-linked evidence refresh</h4>
      <p className="ql218-source">Source: <strong>{sourceLabels[item.sourceStatus]}</strong>. Prepared QL-220: <strong>{item.prepared ? 'yes · fictional' : 'no'}</strong>.</p>
      {!item.eligible && <div className="ql218-warning">A current, locally prepared QL-220 case is required. <button type="button" onClick={() => onNavigate('reopen')}>Inspect QL-220 owner audit</button></div>}
      {item.eligible && !item.record && <button type="button" onClick={() => change((previous, id) => beginQl221Refresh(sources, previous, organization.id, id))}>Begin fictional evidence refresh</button>}
      {item.record && item.sourceStatus !== 'SOURCE_CURRENT' && <div className="ql218-warning" role="alert"><strong>Evidence refresh frozen.</strong> QL-220 or its underlying evidence has changed; old local reassessments cannot advance.
        {item.eligible && <><button type="button" aria-expanded={confirmReset} aria-controls="ql221-reset" onClick={() => setConfirmReset((value) => !value)}>Reconcile changed QL-220 source</button>
          {confirmReset && <div id="ql221-reset"><p>Discard this case’s fictional refresh notes, cycle ages, local acknowledgments and prepared packet to use the revised source? Other cases and companies are unaffected.</p>
            <button type="button" onClick={() => { change((previous, id) => beginQl221Refresh(sources, previous, organization.id, id)); setConfirmReset(false); setNote(''); }}>Confirm case-only refresh reset</button>
            <button type="button" onClick={() => setConfirmReset(false)}>Cancel reset</button></div>}</>}
      </div>}
      {item.record && item.sourceStatus === 'SOURCE_CURRENT' && <>
        <p className="ql221-cycle" role="status">Synthetic refresh cycle: <strong>{item.record.cycle}/12</strong> · Unrefreshed <strong>{item.unrefreshed}</strong> · Overdue <strong>{item.overdue}</strong> · Repeat escalations due <strong>{item.escalationDue}</strong>.</p>
        <section aria-labelledby="ql221-gaps"><h5 id="ql221-gaps">Open exception refresh ({item.gaps.length})</h5>
          {item.gaps.map((gap) => <article key={gap.category} className="ql218-gap"><h6>{gap.category.replaceAll('_', ' ')} · {gap.priority}</h6>
            <p>QL-220 status: <strong>{gap.reopenDisposition.replaceAll('_', ' ')}</strong> · Repeats: <strong>{gap.recurrenceCount}</strong>.</p>
            <p>Evidence refresh: <strong>{gap.refresh.replaceAll('_', ' ')}</strong> · Fictional source: <strong>{gap.evidenceSource.replaceAll('_', ' ')}</strong>.</p>
            <p>Owner follow-up: <strong>{gap.ownerAction.replaceAll('_', ' ')}</strong> · Age: <strong>{gap.refreshAge === null ? 'NOT TRACKED' : `${gap.refreshAge} cycle(s)`}</strong>.</p>
            {gap.refreshOverdue && <p className="ql219-due">Overdue local follow-up: update fictional refresh before preparing a packet.</p>}
            {gap.requiresIndependentEscalation && gap.ownerAction !== 'INDEPENDENT_REVIEW_ESCALATION_DRAFT' && <p className="ql219-due">Recurring exception requires a draft independent-review escalation.</p>}
            <p>Independent evidence <strong>UNVERIFIED</strong> · Real closure <strong>BLOCKED</strong>.</p></article>)}
        </section>
        {item.record.phase === 'evidence_refresh_draft' ? <>
          <div className="ql218-form"><label htmlFor="ql221-gap">Evidence gap to reassess</label>
            <select id="ql221-gap" value={selectedCategory ?? ''} onChange={(event) => { setCategory(event.target.value as Ql214GapCategory); setNote(''); }}>
              {item.gaps.map((gap) => <option key={gap.category} value={gap.category}>{gap.category.replaceAll('_', ' ')} · recurrence {gap.recurrenceCount}</option>)}</select>
            <label htmlFor="ql221-refresh">Fictional evidence refresh outcome</label>
            <select id="ql221-refresh" value={refreshValue} onChange={(event) => setRefreshValue(event.target.value as Ql221Refresh)}>
              <option value="EVIDENCE_GAP_STILL_OPEN">Evidence gap still open</option>
              <option value="SOURCE_UNCHANGED_UNVERIFIED">Source unchanged · not verified</option>
              <option value="FICTIONAL_NEW_EVIDENCE_PENDING_REVIEW">New fictional evidence · review pending</option></select>
            <label htmlFor="ql221-source">Source label · synthetic reference only</label>
            <select id="ql221-source" value={source} onChange={(event) => setSource(event.target.value as Ql221EvidenceSource)}>
              <option value="QL220_LOCAL_REPLAY">QL-220 local fictional replay</option>
              <option value="FICTIONAL_OWNER_ATTACHMENT">Invented owner attachment label · no actual file</option>
              <option value="SIMULATED_RETEST_RECORD">Simulated retest record · not proof</option></select>
            <label htmlFor="ql221-action">Owner follow-up reassessment · unsent draft</label>
            <select id="ql221-action" value={action} onChange={(event) => setAction(event.target.value as Ql221Action)}>
              <option value="MAINTAIN_HOLD_DRAFT">Maintain all holds</option>
              <option value="OWNER_RETEST_REQUEST_DRAFT">Request owner retest · unsent</option>
              <option value="INDEPENDENT_REVIEW_ESCALATION_DRAFT">Escalate for independent review · draft</option></select>
            <label htmlFor="ql221-note">Fictional evidence-refresh note (8–180 characters)</label>
            <textarea id="ql221-note" rows={3} maxLength={180} value={note} onChange={(event) => setNote(event.target.value)} placeholder="Invented observations only; do not enter customer data, URLs, or real evidence." />
            <button type="button" disabled={!selectedCategory || note.trim().length < 8} onClick={() => { if (selectedCategory) change((previous, id) => recordQl221Refresh(sources, previous, organization.id, id, selectedCategory, refreshValue, source, action, note)); setNote(''); }}>Save fictional evidence refresh · NO DISPATCH</button>
            <button type="button" disabled={item.record.cycle >= 12} onClick={() => change((previous, id) => advanceQl221Cycle(sources, previous, organization.id, id))}>Advance simulated refresh cycle (+1)</button>
            <small>After three simulated cycles without re-review, a gap is marked overdue. No actual scheduled reminder or outbound message is created.</small></div>
          <section className="ql219-checklist" aria-labelledby="ql221-checks"><h5 id="ql221-checks">Evidence and release-hold continuity · local checks</h5>
            {QL221_CHECKS.map((check) => <article className="ql219-check" key={check.id}><div><strong>{check.title}</strong><p>{check.detail}</p></div>
              <button type="button" disabled={item.record?.checks[check.id] === 'ACKNOWLEDGED_UNVERIFIED'} onClick={() => change((previous, id) => acknowledgeQl221Check(sources, previous, organization.id, id, check.id))}>
                {item.record?.checks[check.id] === 'ACKNOWLEDGED_UNVERIFIED' ? 'Locally reviewed · UNVERIFIED' : 'Acknowledge local hold review · UNVERIFIED'}</button></article>)}
          </section>
          <button type="button" disabled={!item.readyForLocalAudit} onClick={() => change((previous, id) => prepareQl221ContinuityAudit(sources, previous, organization.id, id))}>Prepare evidence refresh &amp; continuity audit · NO RELEASE</button>
        </> : <p className="ql218-prepared" role="status">QL-221 local evidence refresh and hold continuity audit prepared. Actual independent verification, owner authorization, closure and release remain BLOCKED.</p>}
      </>}
      <div className="ql218-actions"><button type="button" onClick={() => onNavigate('reopen')}>Inspect QL-220 exception audit</button>
        <button type="button" onClick={() => onNavigate('closure')}>Inspect QL-219 readiness</button></div>
    </section>}</div>
    <section className="ql218-panel" aria-labelledby="ql221-holds"><h4 id="ql221-holds">Read-only real-pilot release hold continuity audit</h4>
      <p>Expected <strong>{company.holdAudit.expected}</strong> · Observed <strong>{company.holdAudit.observed}</strong> · HELD_UNVERIFIED <strong>{company.holdAudit.held}</strong> · Conditional release <strong>BLOCKED</strong>.</p>
      <div className="ql218-scroll"><table><thead><tr><th scope="col">QL-181 prerequisite</th><th scope="col">Real independent evidence required</th><th scope="col">Actual state</th></tr></thead>
        <tbody>{portfolio.prerequisites.map((hold) => <tr key={hold.id}><th scope="row">{hold.title}</th><td>{hold.requiredBeforePilot}</td><td>{hold.state}</td></tr>)}</tbody></table></div>
    </section>
    <section className="ql218-panel" aria-labelledby="ql221-receipt"><h4 id="ql221-receipt">Redacted four-company evidence refresh receipt</h4>
      <button type="button" aria-expanded={showReceipt} aria-controls="ql221-receipt-data" onClick={() => setShowReceipt((value) => !value)}>{showReceipt ? 'Hide' : 'Show'} local QL-221 continuity receipt</button>
      {showReceipt && <div id="ql221-receipt-data"><p>Fixed codes only: no source tokens, free-text notes, actual attachments, reviewer identities or customer information.</p>
        <textarea readOnly rows={15} aria-label="Fixture-only QL-221 continuity audit receipt" value={ql221CompanyReceipt(sources, ledger, organization.id)} /></div>}
    </section>
    <p className="ql218-foot">Software Production GREEN never grants permission for real communications or independent case closure. All actual pilot requirements remain held.</p>
  </section>;
}

import { useState, type Dispatch, type SetStateAction } from 'react';
import type { OperatorOrganization, OperatorWorkspace } from './ql191Organizations';
import type { Ql211ScenarioId } from './ql211OwnerTrial';
import type { Ql214GapCategory } from './ql214ReviewIntake';
import { QL234_RELEASE, QL234_CHECKS, beginQl234DriftAudit, recordQl234Drift,
  advanceQl234Cycle, acknowledgeQl234Check, prepareQl234HeldRecheck, ql234CompanyContinuity,
  ql234CompanyReceipt, ql234Portfolio, type Ql234Sources, type Ql234Ledger,
  type Ql234Drift, type Ql234Continuity, type Ql234Hold } from './ql234SourceDriftContinuity';
import './ql234-source-drift-continuity.css';

const sourceCopy: Record<string, string> = {
  AWAITING_PREPARED_QL233: 'Awaiting prepared fictional QL-233 held-pilot integrity review',
  SOURCE_CURRENT: 'QL-233 source and actual QL-181 held snapshot current',
  QL233_SOURCE_IDENTITY_REVISED: 'FROZEN · QL-233 source identity drift detected',
  UPSTREAM_STALE: 'FROZEN · upstream evidence no longer prepared',
  ACTUAL_RELEASE_HOLD_REVISED: 'FROZEN · actual release hold snapshot changed'
};

export function Ql234SourceDriftContinuityAudit({ organization, sources, ledger, setLedger, onNavigate }: {
  organization: OperatorOrganization;
  sources: Ql234Sources;
  ledger: Ql234Ledger;
  setLedger: Dispatch<SetStateAction<Ql234Ledger>>;
  onNavigate: (workspace: OperatorWorkspace) => void;
}) {
  const [selected, setSelected] = useState<Ql211ScenarioId | null>(null);
  const [category, setCategory] = useState<Ql214GapCategory | ''>('');
  const [drift, setDrift] = useState<Ql234Drift>('SOURCE_IDENTITY_RECHECK_PENDING_UNVERIFIED');
  const [continuity, setContinuity] = useState<Ql234Continuity>('CONTINUE_INDEPENDENT_HELD_WATCH_DRAFT');
  const [hold, setHold] = useState<Ql234Hold>('CONDITIONAL_HOLD_RECHECK_PENDING_UNVERIFIED');
  const [note, setNote] = useState('');
  const [helpOpen, setHelpOpen] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [receiptOpen, setReceiptOpen] = useState(false);
  const portfolio = ql234Portfolio(sources, ledger);
  const company = ql234CompanyContinuity(sources, ledger, organization.id);
  const item = company.cases.find((candidate) => candidate.scenario === selected) ?? company.cases[0];
  const selectedCategory = category && item?.gaps.some((gap) => gap.category === category) ? category : item?.gaps[0]?.category;
  const selectedGap = item?.gaps.find((gap) => gap.category === selectedCategory);
  const change = (operation: (previous: Ql234Ledger, scenario: Ql211ScenarioId) => Ql234Ledger) => {
    if (item) setLedger((previous) => operation(previous, item.scenario));
  };
  return <section className="ql218-workbench ql234-workbench" data-ql234-release={QL234_RELEASE} data-organization={organization.id} aria-labelledby="ql234-title">
    <header className="ql218-header"><div><p className="ql191-eyebrow">QL-234 · Held-pilot source drift &amp; independent follow-up · Disabled preview</p>
      <h3 id="ql234-title">Four-company evidence drift, reassessment continuity &amp; conditional release integrity</h3>
      <p>Check fictional evidence-source changes and independently review held-pilot continuity without lifting real release holds.</p></div>
      <button type="button" aria-expanded={helpOpen} aria-controls="ql234-help" onClick={() => setHelpOpen((open) => !open)}>ⓘ Source drift &amp; continuity help</button></header>
    <div className="ql218-warning" role="note"><strong>NO ACTUAL SOURCE VERIFICATION, INDEPENDENT DECISION OR PILOT RELEASE.</strong> All {portfolio.prerequisites.length} QL-181 gates remain HELD_UNVERIFIED. Local decisions are fictional, unsent and session-only; no calls, SMS, provider requests or Supabase writes occur.</div>
    {helpOpen && <p id="ql234-help" className="ql218-help">Begin with a current prepared fictional QL-233 audit. A source revision in QL-233 or a changed actual hold snapshot freezes the downstream case and requires an explicit case-only reset. For each fictional evidence gap, record source identity drift or match, an unsent independent follow-up and a held-proof recheck. A drift finding or a hold exception blocks local packet preparation. At two simulated cycles the follow-up is due soon; at three it is overdue and requires a fresh independent referral draft. Repeat drift events count once per gap per cycle. Earlier late or repeated outcomes retain their independent follow-up requirement. Every evidence edit or cycle change resets local check acknowledgements. None of this verifies a real source or authorizes release.</p>}
    <div className="ql218-metrics" role="status">
      <div><small>Eligible / tracking</small><strong>{portfolio.eligible} / {portfolio.tracking}</strong><span>Four company scopes</span></div>
      <div><small>Open / historical drift</small><strong>{portfolio.openDrift} / {portfolio.driftEvents}</strong><span>Fictional source events</span></div>
      <div><small>Due soon / overdue</small><strong>{portfolio.dueSoon} / {portfolio.overdue}</strong><span>Simulated cycles</span></div>
      <div><small>Prepared / stale</small><strong>{portfolio.prepared} / {portfolio.stale}</strong><span>Local integrity packets only</span></div>
    </div>
    <section className="ql218-panel" aria-labelledby="ql234-matrix"><h4 id="ql234-matrix">Four-company source-drift and conditional release hold matrix</h4>
      <div className="ql218-scroll"><table><caption>Only fictional follow-up counts; actual conditional release remains blocked.</caption>
        <thead><tr><th scope="col">Company</th><th scope="col">Eligible</th><th scope="col">Tracking</th><th scope="col">Unreviewed</th><th scope="col">Open drift</th><th scope="col">Drift events</th><th scope="col">Due soon</th><th scope="col">Overdue</th><th scope="col">Historical overdue</th><th scope="col">Follow-ups missing</th><th scope="col">Hold exceptions</th><th scope="col">Prepared</th><th scope="col">Stale</th><th scope="col">Real release holds</th></tr></thead>
        <tbody>{portfolio.companies.map((row) => <tr key={row.company}><th scope="row">{row.company === 'rosiedazzlers' ? 'Rosie Dazzlers' : row.company === 'devilndove' ? 'Devil n Dove' : row.company === 'icamp' ? 'iCamp' : 'YW · Property Maintenance'}</th>
          <td>{row.eligible}</td><td>{row.tracking}</td><td>{row.unreviewed}</td><td>{row.openDrift}</td><td>{row.driftEvents}</td><td>{row.dueSoon}</td><td>{row.overdue}</td><td>{row.overdueFollowUpEpisodes}</td><td>{row.missingFollowUps}</td><td>{row.holdExceptions}</td><td>{row.prepared}</td><td>{row.stale}</td><td>{row.holdAudit.held}/12 HELD</td></tr>)}</tbody></table></div>
    </section>
    <div className="ql218-grid"><section className="ql218-panel" aria-labelledby="ql234-cases"><h4 id="ql234-cases">{organization.name} · Fictional source identity cases</h4>
      {company.cases.length === 0 ? <p>No synthetic finding exists. <button type="button" onClick={() => onNavigate('trial')}>Open owner trial</button></p> :
        <div role="group" aria-label="Select source drift case">{company.cases.map((candidate) => <button type="button" key={candidate.scenario}
          className={candidate.scenario === item?.scenario ? 'ql218-case active' : 'ql218-case'} aria-pressed={candidate.scenario === item?.scenario}
          onClick={() => { setSelected(candidate.scenario); setCategory(''); setResetOpen(false); setNote(''); }}>
          <strong>{candidate.title}</strong><span>{candidate.priority} · {sourceCopy[candidate.sourceStatus]} · {candidate.driftEvents} prior drift events</span></button>)}</div>}
      {company.orphaned > 0 && <p className="ql218-warning" role="alert">{company.orphaned} orphaned synthetic cases remain held and unverified.</p>}
    </section>
    {item && <section className="ql218-panel" aria-labelledby="ql234-selected"><h4 id="ql234-selected">{item.title} · Independent follow-up and source drift continuity</h4>
      <p className="ql218-source">Source <strong>{sourceCopy[item.sourceStatus]}</strong> · Prepared QL-233 <strong>{item.eligible ? 'yes' : 'no'}</strong>.</p>
      {!item.eligible && <div className="ql218-warning">A current prepared fictional QL-233 audit is required. <button type="button" onClick={() => onNavigate('held_integrity')}>Inspect QL-233 source</button></div>}
      {item.eligible && !item.record && <button type="button" onClick={() => change((previous, id) => beginQl234DriftAudit(sources, previous, organization.id, id))}>Begin fictional source drift &amp; held-release recheck</button>}
      {item.record && item.sourceStatus !== 'SOURCE_CURRENT' && <div className="ql218-warning" role="alert"><p>Frozen: upstream QL-233 evidence source identity or actual release hold snapshot changed. Earlier local findings cannot authorize release.</p>
        <button type="button" aria-expanded={resetOpen} onClick={() => setResetOpen(true)}>Review case-only source reset</button>
        {resetOpen && <div><p>Only this scenario's QL-234 fictional review will be reset; no other company is changed.</p>
          <button type="button" disabled={!item.eligible} onClick={() => { change((previous, id) => beginQl234DriftAudit(sources, previous, organization.id, id)); setResetOpen(false); setNote(''); }}>Confirm case-only drift reset</button>
          <button type="button" onClick={() => setResetOpen(false)}>Cancel reset</button></div>}</div>}
      {item.record && item.sourceStatus === 'SOURCE_CURRENT' && <>
        <p className="ql222-cycle" role="status">Simulated cycle <strong>{item.record.cycle}/12</strong> · Unreviewed <strong>{item.unreviewed}</strong> · Due soon <strong>{item.dueSoon}</strong> · Overdue <strong>{item.overdue}</strong> · Independent follow-ups missing <strong>{item.missingFollowUps}</strong>.</p>
        <section aria-labelledby="ql234-gaps"><h5 id="ql234-gaps">Fictional evidence source identity and held release ({item.gaps.length})</h5>
          {item.gaps.map((gap) => <article className="ql218-gap" key={gap.category}><h6>{gap.category.replaceAll('_', ' ')} · {gap.priority}</h6>
            <p>QL-233 reassessment <strong>{gap.reassessment.replaceAll('_', ' ')}</strong> · Source identity <strong>{gap.drift.replaceAll('_', ' ')}</strong>.</p>
            <p>Independent follow-up <strong>{gap.continuity.replaceAll('_', ' ')}</strong> · Held release proof <strong>{gap.hold.replaceAll('_', ' ')}</strong> · Evidence age <strong>{gap.age === null ? 'NOT TRACKED' : `${gap.age} cycle(s)`}</strong>.</p>
            {gap.dueSoon && <p className="ql223-approaching">Independent source follow-up due soon.</p>}
            {gap.overdue && <p className="ql219-due">Overdue source recheck needs a fresh unsent independent referral.</p>}
            {gap.missingIndependentFollowUp && <p className="ql219-due">Inherited or recurring risk requires a separate independent follow-up.</p>}
            {gap.drift === 'SIMULATED_SOURCE_DRIFT_FOUND_UNVERIFIED' && <p className="ql219-due">Open fictional source drift blocks packet preparation.</p>}
            {(gap.inheritedHoldGap || gap.hold === 'CONDITIONAL_HOLD_EXCEPTION_RECONFIRMED_UNVERIFIED') && <p className="ql219-due">Held proof exception blocks local recheck; inherited evidence must be resolved at source.</p>}
            <p>Drift events <strong>{gap.driftEvents}</strong> · Historical overdue <strong>{gap.overdueFollowUpEpisodes}</strong> · Actual release <strong>BLOCKED</strong>.</p></article>)}
        </section>
        {item.record.phase === 'source_drift_reassessment_continuity_draft' ? <>
          <div className="ql218-form"><label htmlFor="ql234-gap">Held evidence gap category</label>
            <select id="ql234-gap" value={selectedCategory ?? ''} onChange={(event) => { setCategory(event.target.value as Ql214GapCategory); setNote(''); }}>
              {item.gaps.map((gap) => <option key={gap.category} value={gap.category}>{gap.category.replaceAll('_', ' ')} · {gap.driftEvents} drift events</option>)}</select>
            <label htmlFor="ql234-drift">Evidence source identity recheck · fictional/UNVERIFIED</label>
            <select id="ql234-drift" value={drift} onChange={(event) => setDrift(event.target.value as Ql234Drift)}>
              <option value="SOURCE_IDENTITY_RECHECK_PENDING_UNVERIFIED">Source identity pending · UNVERIFIED</option>
              <option value="SIMULATED_SOURCE_IDENTITY_MATCH_UNVERIFIED">Imagined source identity matches · UNVERIFIED</option>
              <option value="SIMULATED_SOURCE_DRIFT_FOUND_UNVERIFIED">Imagined source drift detected · UNVERIFIED</option></select>
            <label htmlFor="ql234-continuity">Independent reassessment continuity · UNSENT</label>
            <select id="ql234-continuity" value={continuity} onChange={(event) => setContinuity(event.target.value as Ql234Continuity)}>
              <option value="CONTINUE_INDEPENDENT_HELD_WATCH_DRAFT">Continue independent held watch · draft</option>
              <option value="REFER_FRESH_INDEPENDENT_FOLLOW_UP_DRAFT">Refer fresh independent follow-up · unsent draft</option>
              <option value="REOPEN_SOURCE_DRIFT_EXCEPTION_DRAFT">Reopen source drift exception · draft</option></select>
            <label htmlFor="ql234-hold">Conditional release integrity recheck · fictional/UNVERIFIED</label>
            <select id="ql234-hold" value={hold} onChange={(event) => setHold(event.target.value as Ql234Hold)}>
              <option value="CONDITIONAL_HOLD_RECHECK_PENDING_UNVERIFIED">Conditional hold recheck pending · UNVERIFIED</option>
              <option value="SIMULATED_CONDITIONAL_HOLD_MATCH_UNVERIFIED">Imagined held-release proof matches · UNVERIFIED</option>
              <option value="CONDITIONAL_HOLD_EXCEPTION_RECONFIRMED_UNVERIFIED">Imagined hold exception reconfirmed · UNVERIFIED</option></select>
            <label htmlFor="ql234-note">Fictional source follow-up note (8–180 characters)</label>
            <textarea id="ql234-note" rows={3} maxLength={180} value={note} onChange={(event) => setNote(event.target.value)} placeholder="Synthetic status only. Never enter real customer or reviewer identities." />
            <button type="button" disabled={!selectedCategory || note.trim().length < 8 ||
              (!!selectedGap?.overdue && continuity !== 'REFER_FRESH_INDEPENDENT_FOLLOW_UP_DRAFT') ||
              ((drift === 'SIMULATED_SOURCE_DRIFT_FOUND_UNVERIFIED' || hold === 'CONDITIONAL_HOLD_EXCEPTION_RECONFIRMED_UNVERIFIED') && continuity === 'CONTINUE_INDEPENDENT_HELD_WATCH_DRAFT')}
              onClick={() => { if (selectedCategory) change((previous, id) => recordQl234Drift(sources, previous, organization.id,
                id, selectedCategory, drift, continuity, hold, note)); setNote(''); }}>Record fictional source &amp; continuity recheck · UNSENT</button>
            <button type="button" disabled={item.record.cycle >= 12} onClick={() => change((previous, id) => advanceQl234Cycle(sources, previous, organization.id, id))}>Advance synthetic drift follow-up cycle (+1)</button>
            <small>Two cycles due soon, three overdue. Real release holds remain unchanged.</small></div>
          <section className="ql219-checklist" aria-labelledby="ql234-checks"><h5 id="ql234-checks">Source drift and held-release integrity · UNVERIFIED checks</h5>
            {QL234_CHECKS.map((check) => <article key={check.id} className="ql219-check"><div><strong>{check.title}</strong><p>{check.detail}</p></div>
              <button type="button" disabled={item.record?.checks[check.id] === 'ACKNOWLEDGED_UNVERIFIED'} onClick={() => change((previous, id) => acknowledgeQl234Check(sources, previous, organization.id, id, check.id))}>
                {item.record?.checks[check.id] === 'ACKNOWLEDGED_UNVERIFIED' ? 'Reviewed locally · UNVERIFIED' : 'Acknowledge conditional hold · UNVERIFIED'}</button></article>)}
          </section>
          <button type="button" disabled={!item.readyForLocalAudit} onClick={() => change((previous, id) => prepareQl234HeldRecheck(sources, previous, organization.id, id))}>Prepare source drift &amp; held-release packet · NO RELEASE</button>
        </> : <p className="ql218-prepared" role="status">QL-234 fictional source drift and held-release integrity packet prepared locally. No real independent source verification, owner approval or pilot release.</p>}
      </>}
      <div className="ql218-actions"><button type="button" onClick={() => onNavigate('held_integrity')}>Inspect QL-233 held-pilot source</button>
        <button type="button" onClick={() => onNavigate('escalation_proof')}>Inspect QL-232 escalation proof</button></div>
    </section>}</div>
    <section className="ql218-panel" aria-labelledby="ql234-holds"><h4 id="ql234-holds">QL-181 actual conditional-release proof · read-only</h4>
      <p>Expected <strong>{company.holdAudit.expected}</strong> · Observed <strong>{company.holdAudit.observed}</strong> · HELD_UNVERIFIED <strong>{company.holdAudit.held}</strong> · Conditional release <strong>BLOCKED</strong>.</p>
      <div className="ql218-scroll"><table><thead><tr><th scope="col">Actual release prerequisite</th><th scope="col">Required before live pilot</th><th scope="col">Actual hold state</th></tr></thead>
        <tbody>{portfolio.prerequisites.map((entry) => <tr key={entry.id}><th scope="row">{entry.title}</th><td>{entry.requiredBeforePilot}</td><td>{entry.state}</td></tr>)}</tbody></table></div>
    </section>
    <section className="ql218-panel" aria-labelledby="ql234-receipt"><h4 id="ql234-receipt">Privacy-minimized source-drift and conditional-hold audit receipt</h4>
      <button type="button" aria-expanded={receiptOpen} aria-controls="ql234-receipt-data" onClick={() => setReceiptOpen((open) => !open)}>{receiptOpen ? 'Hide' : 'Show'} local QL-234 held-release receipt</button>
      {receiptOpen && <div id="ql234-receipt-data"><p>Fictional status-only receipt. No notes, reviewer identities or revision fingerprints.</p>
        <textarea readOnly rows={15} aria-label="Fixture-only QL-234 held-release receipt" value={ql234CompanyReceipt(sources, ledger, organization.id)} /></div>}
    </section>
    <p className="ql218-foot">Production software GREEN is not live pilot authorization. Calling, SMS, provider dispatch and actual QL-181 hold clearance remain disabled.</p>
  </section>;
}

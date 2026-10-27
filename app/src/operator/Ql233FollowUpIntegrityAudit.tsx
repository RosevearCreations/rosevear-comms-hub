import { useState, type Dispatch, type SetStateAction } from 'react';
import type { OperatorOrganization, OperatorWorkspace } from './ql191Organizations';
import type { Ql211ScenarioId } from './ql211OwnerTrial';
import type { Ql214GapCategory } from './ql214ReviewIntake';
import { QL233_RELEASE, QL233_CHECKS, beginQl233IntegrityAudit, recordQl233FollowUp,
  advanceQl233Cycle, acknowledgeQl233Check, prepareQl233HeldAudit, ql233CompanyIntegrity,
  ql233CompanyReceipt, ql233Portfolio, type Ql233Sources, type Ql233Ledger,
  type Ql233FollowUp, type Ql233Reassessment, type Ql233Integrity } from './ql233FollowUpIntegrity';
import './ql233-followup-integrity.css';

const sourceCopy: Record<string, string> = {
  AWAITING_PREPARED_QL232: 'Awaiting prepared fictional QL-232 held-proof audit',
  SOURCE_CURRENT: 'QL-232 source and QL-181 held-pilot snapshot current',
  QL232_ESCALATION_PROOF_REVISED: 'FROZEN · QL-232 escalation proof revised',
  UPSTREAM_STALE: 'FROZEN · upstream evidence no longer prepared',
  HELD_PILOT_PROOF_REVISED: 'FROZEN · QL-181 held-pilot proof snapshot changed'
};

export function Ql233FollowUpIntegrityAudit({ organization, sources, ledger, setLedger, onNavigate }: {
  organization: OperatorOrganization;
  sources: Ql233Sources;
  ledger: Ql233Ledger;
  setLedger: Dispatch<SetStateAction<Ql233Ledger>>;
  onNavigate: (workspace: OperatorWorkspace) => void;
}) {
  const [selected, setSelected] = useState<Ql211ScenarioId | null>(null);
  const [category, setCategory] = useState<Ql214GapCategory | ''>('');
  const [followUp, setFollowUp] = useState<Ql233FollowUp>('FOLLOW_UP_PENDING_UNVERIFIED');
  const [reassessment, setReassessment] = useState<Ql233Reassessment>('MAINTAIN_HELD_DECISION_DRAFT');
  const [integrity, setIntegrity] = useState<Ql233Integrity>('HELD_PILOT_PROOF_PENDING_UNVERIFIED');
  const [note, setNote] = useState('');
  const [helpOpen, setHelpOpen] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [receiptOpen, setReceiptOpen] = useState(false);
  const portfolio = ql233Portfolio(sources, ledger);
  const company = ql233CompanyIntegrity(sources, ledger, organization.id);
  const item = company.cases.find((candidate) => candidate.scenario === selected) ?? company.cases[0];
  const selectedCategory = category && item?.gaps.some((gap) => gap.category === category) ? category : item?.gaps[0]?.category;
  const selectedGap = item?.gaps.find((gap) => gap.category === selectedCategory);
  const change = (operation: (previous: Ql233Ledger, scenario: Ql211ScenarioId) => Ql233Ledger) => {
    if (item) setLedger((previous) => operation(previous, item.scenario));
  };
  return <section className="ql218-workbench ql233-workbench" data-ql233-release={QL233_RELEASE} data-organization={organization.id} aria-labelledby="ql233-title">
    <header className="ql218-header"><div><p className="ql191-eyebrow">QL-233 · Escalation proof follow-up &amp; held-pilot integrity · Disabled preview</p>
      <h3 id="ql233-title">Four-company exception follow-up aging, independent reassessment &amp; pilot hold audit</h3>
      <p>Track fictional overdue evidence decisions while confirming that the real pilot release is still blocked.</p></div>
      <button type="button" aria-expanded={helpOpen} aria-controls="ql233-help" onClick={() => setHelpOpen((open) => !open)}>ⓘ Follow-up &amp; integrity help</button></header>
    <div className="ql218-warning" role="note"><strong>HELD PILOT. NO INDEPENDENT VERIFICATION OR OWNER AUTHORIZATION.</strong> All {portfolio.prerequisites.length} actual QL-181 gates remain HELD_UNVERIFIED. This session-only tool sends no follow-ups, calls, SMS, or provider requests, and makes no Supabase writes.</div>
    {helpOpen && <p id="ql233-help" className="ql218-help">Begin only with a current prepared fictional QL-232 proof packet. Recheck each evidence gap using fictional follow-up status, an unsent independent reassessment draft and an unverified held-pilot proof disposition. At two simulated cycles a decision is due soon; at three it is overdue and requires a new independent referral draft. Historical late and repeated exceptions keep requiring independent reassessment. New evidence resets the local acknowledgement checklist; a changed upstream source or actual hold snapshot freezes this case until a confirmed case-only reset. An integrity exception blocks local packet preparation. No draft releases a real QL-181 gate.</p>}
    <div className="ql218-metrics" role="status">
      <div><small>Eligible / tracking</small><strong>{portfolio.eligible} / {portfolio.tracking}</strong><span>Four company scopes</span></div>
      <div><small>Recurring / historical</small><strong>{portfolio.recurring} / {portfolio.historicalOverdueEpisodes}</strong><span>Fictional exception counts</span></div>
      <div><small>Due soon / overdue</small><strong>{portfolio.dueSoon} / {portfolio.overdue}</strong><span>Simulated cycles</span></div>
      <div><small>Prepared / stale</small><strong>{portfolio.prepared} / {portfolio.stale}</strong><span>Local audit packets only</span></div>
    </div>
    <section className="ql218-panel" aria-labelledby="ql233-matrix"><h4 id="ql233-matrix">Four-company escalation follow-up and held-pilot integrity matrix</h4>
      <div className="ql218-scroll"><table><caption>Fictional follow-up and integrity status; no live pilot approvals.</caption>
        <thead><tr><th scope="col">Company</th><th scope="col">Eligible</th><th scope="col">Tracking</th><th scope="col">Unreviewed</th><th scope="col">Repeat events</th><th scope="col">Due soon</th><th scope="col">Overdue</th><th scope="col">Historical overdue</th><th scope="col">Independent reassessments missing</th><th scope="col">Integrity exceptions</th><th scope="col">Prepared</th><th scope="col">Stale</th><th scope="col">Actual release holds</th></tr></thead>
        <tbody>{portfolio.companies.map((row) => <tr key={row.company}><th scope="row">{row.company === 'rosiedazzlers' ? 'Rosie Dazzlers' : row.company === 'devilndove' ? 'Devil n Dove' : row.company === 'icamp' ? 'iCamp' : 'YW · Property Maintenance'}</th>
          <td>{row.eligible}</td><td>{row.tracking}</td><td>{row.unreviewed}</td><td>{row.recurrenceEvents}</td><td>{row.dueSoon}</td><td>{row.overdue}</td><td>{row.historicalOverdueEpisodes}</td><td>{row.missingReassessments}</td><td>{row.integrityExceptions}</td><td>{row.prepared}</td><td>{row.stale}</td><td>{row.holdAudit.held}/12 HELD</td></tr>)}</tbody></table></div>
    </section>
    <div className="ql218-grid"><section className="ql218-panel" aria-labelledby="ql233-cases"><h4 id="ql233-cases">{organization.name} · Fictional reassessment cases</h4>
      {company.cases.length === 0 ? <p>No synthetic finding exists. <button type="button" onClick={() => onNavigate('trial')}>Open owner trial</button></p> :
        <div role="group" aria-label="Select held-pilot integrity case">{company.cases.map((candidate) => <button type="button" key={candidate.scenario}
          className={candidate.scenario === item?.scenario ? 'ql218-case active' : 'ql218-case'} aria-pressed={candidate.scenario === item?.scenario}
          onClick={() => { setSelected(candidate.scenario); setCategory(''); setResetOpen(false); setNote(''); }}>
          <strong>{candidate.title}</strong><span>{candidate.priority} · {sourceCopy[candidate.sourceStatus]} · {candidate.historicalOverdueEpisodes} prior late follow-ups</span></button>)}</div>}
      {company.orphaned > 0 && <p className="ql218-warning" role="alert">{company.orphaned} orphaned fictional cases remain held and unverified.</p>}
    </section>
    {item && <section className="ql218-panel" aria-labelledby="ql233-selected"><h4 id="ql233-selected">{item.title} · Independent reassessment &amp; pilot hold integrity</h4>
      <p className="ql218-source">Source <strong>{sourceCopy[item.sourceStatus]}</strong> · Prepared QL-232 <strong>{item.eligible ? 'yes' : 'no'}</strong>.</p>
      {!item.eligible && <div className="ql218-warning">A current prepared fictional QL-232 proof is required. <button type="button" onClick={() => onNavigate('escalation_proof')}>Inspect QL-232 source</button></div>}
      {item.eligible && !item.record && <button type="button" onClick={() => change((previous, id) => beginQl233IntegrityAudit(sources, previous, organization.id, id))}>Begin fictional exception follow-up &amp; held-pilot audit</button>}
      {item.record && item.sourceStatus !== 'SOURCE_CURRENT' && <div className="ql218-warning" role="alert"><p>Frozen: QL-232 source or actual held-pilot proof changed. Earlier fictional decisions cannot authorize release.</p>
        <button type="button" aria-expanded={resetOpen} onClick={() => setResetOpen(true)}>Review case-only integrity reset</button>
        {resetOpen && <div><p>Only this company and scenario's QL-233 draft is reset; other companies remain untouched.</p>
          <button type="button" disabled={!item.eligible} onClick={() => { change((previous, id) => beginQl233IntegrityAudit(sources, previous, organization.id, id)); setResetOpen(false); setNote(''); }}>Confirm case-only integrity reset</button>
          <button type="button" onClick={() => setResetOpen(false)}>Cancel reset</button></div>}</div>}
      {item.record && item.sourceStatus === 'SOURCE_CURRENT' && <>
        <p className="ql222-cycle" role="status">Simulated cycle <strong>{item.record.cycle}/12</strong> · Unreviewed <strong>{item.unreviewed}</strong> · Due soon <strong>{item.dueSoon}</strong> · Overdue <strong>{item.overdue}</strong> · Independent reassessments missing <strong>{item.missingReassessments}</strong>.</p>
        <section aria-labelledby="ql233-gaps"><h5 id="ql233-gaps">Fictional exception aging and pilot proof ({item.gaps.length})</h5>
          {item.gaps.map((gap) => <article className="ql218-gap" key={gap.category}><h6>{gap.category.replaceAll('_', ' ')} · {gap.priority}</h6>
            <p>QL-232 escalation <strong>{gap.escalation.replaceAll('_', ' ')}</strong> · Follow-up <strong>{gap.followUp.replaceAll('_', ' ')}</strong>.</p>
            <p>Independent decision <strong>{gap.reassessment.replaceAll('_', ' ')}</strong> · Pilot proof <strong>{gap.integrity.replaceAll('_', ' ')}</strong> · Follow-up age <strong>{gap.age === null ? 'NOT TRACKED' : `${gap.age} cycle(s)`}</strong>.</p>
            {gap.dueSoon && <p className="ql223-approaching">Fictional independent reassessment due soon.</p>}
            {gap.overdue && <p className="ql219-due">Overdue follow-up needs a new unsent independent reassessment referral.</p>}
            {gap.missingIndependentDecision && <p className="ql219-due">Fresh independent reassessment required for inherited or recurring risk.</p>}
            {(gap.inheritedIntegrityException || gap.integrity === 'HELD_PILOT_PROOF_EXCEPTION_UNVERIFIED') && <p className="ql219-due">Held-pilot integrity exception prevents local audit preparation. An inherited QL-232 proof gap must be resolved at its source.</p>}
            <p>Repeat events <strong>{gap.reassessmentRecurrences}</strong> · Historical overdue <strong>{gap.historicalOverdueEpisodes}</strong> · Actual pilot release <strong>BLOCKED</strong>.</p></article>)}
        </section>
        {item.record.phase === 'exception_follow_up_integrity_review_draft' ? <>
          <div className="ql218-form"><label htmlFor="ql233-gap">Escalation proof exception category</label>
            <select id="ql233-gap" value={selectedCategory ?? ''} onChange={(event) => { setCategory(event.target.value as Ql214GapCategory); setNote(''); }}>
              {item.gaps.map((gap) => <option key={gap.category} value={gap.category}>{gap.category.replaceAll('_', ' ')} · {gap.reassessmentRecurrences} repeats</option>)}</select>
            <label htmlFor="ql233-followup">Exception follow-up outcome · fictional/UNVERIFIED</label>
            <select id="ql233-followup" value={followUp} onChange={(event) => setFollowUp(event.target.value as Ql233FollowUp)}>
              <option value="FOLLOW_UP_PENDING_UNVERIFIED">Follow-up pending · UNVERIFIED</option>
              <option value="SIMULATED_FOLLOW_UP_RECORDED_UNVERIFIED">Imagined follow-up recorded · UNVERIFIED</option>
              <option value="SIMULATED_EXCEPTION_REOPENED_UNVERIFIED">Imagined exception reopened · UNVERIFIED</option></select>
            <label htmlFor="ql233-reassessment">Independent decision reassessment · UNSENT</label>
            <select id="ql233-reassessment" value={reassessment} onChange={(event) => setReassessment(event.target.value as Ql233Reassessment)}>
              <option value="MAINTAIN_HELD_DECISION_DRAFT">Continue held decision · draft</option>
              <option value="REFER_INDEPENDENT_REASSESSMENT_DRAFT">Refer independent reassessment · unsent draft</option>
              <option value="REOPEN_INDEPENDENT_DECISION_DRAFT">Reopen independent decision · draft</option></select>
            <label htmlFor="ql233-integrity">Held-pilot proof integrity · fictional/UNVERIFIED</label>
            <select id="ql233-integrity" value={integrity} onChange={(event) => setIntegrity(event.target.value as Ql233Integrity)}>
              <option value="HELD_PILOT_PROOF_PENDING_UNVERIFIED">Held pilot proof pending · UNVERIFIED</option>
              <option value="SIMULATED_HELD_PILOT_PROOF_MATCH_UNVERIFIED">Imagined held pilot proof matches · UNVERIFIED</option>
              <option value="HELD_PILOT_PROOF_EXCEPTION_UNVERIFIED">Imagined pilot proof exception · UNVERIFIED</option></select>
            <label htmlFor="ql233-note">Fictional follow-up note (8–180 characters)</label>
            <textarea id="ql233-note" rows={3} maxLength={180} value={note} onChange={(event) => setNote(event.target.value)} placeholder="Synthetic notes only. Do not enter customer or reviewer identities." />
            <button type="button" disabled={!selectedCategory || note.trim().length < 8 ||
              (!!selectedGap?.overdue && reassessment !== 'REFER_INDEPENDENT_REASSESSMENT_DRAFT') ||
              ((followUp === 'SIMULATED_EXCEPTION_REOPENED_UNVERIFIED' || integrity === 'HELD_PILOT_PROOF_EXCEPTION_UNVERIFIED') && reassessment === 'MAINTAIN_HELD_DECISION_DRAFT')}
              onClick={() => { if (selectedCategory) change((previous, id) => recordQl233FollowUp(sources, previous, organization.id,
                id, selectedCategory, followUp, reassessment, integrity, note)); setNote(''); }}>Record fictional follow-up &amp; held integrity · UNSENT</button>
            <button type="button" disabled={item.record.cycle >= 12} onClick={() => change((previous, id) => advanceQl233Cycle(sources, previous, organization.id, id))}>Advance synthetic follow-up cycle (+1)</button>
            <small>Two cycles due soon; three overdue. Any edit resets local checks. Nothing releases a real pilot.</small></div>
          <section className="ql219-checklist" aria-labelledby="ql233-checks"><h5 id="ql233-checks">Independent reassessment &amp; held-pilot integrity · UNVERIFIED checks</h5>
            {QL233_CHECKS.map((check) => <article key={check.id} className="ql219-check"><div><strong>{check.title}</strong><p>{check.detail}</p></div>
              <button type="button" disabled={item.record?.checks[check.id] === 'ACKNOWLEDGED_UNVERIFIED'} onClick={() => change((previous, id) => acknowledgeQl233Check(sources, previous, organization.id, id, check.id))}>
                {item.record?.checks[check.id] === 'ACKNOWLEDGED_UNVERIFIED' ? 'Reviewed locally · UNVERIFIED' : 'Acknowledge held-pilot integrity · UNVERIFIED'}</button></article>)}
          </section>
          <button type="button" disabled={!item.readyForLocalAudit} onClick={() => change((previous, id) => prepareQl233HeldAudit(sources, previous, organization.id, id))}>Prepare fictional held-pilot integrity packet · NO RELEASE</button>
        </> : <p className="ql218-prepared" role="status">QL-233 fictional held-pilot integrity audit packet prepared locally. Real independent approval and live pilot release remain blocked.</p>}
      </>}
      <div className="ql218-actions"><button type="button" onClick={() => onNavigate('escalation_proof')}>Inspect QL-232 escalation proof source</button>
        <button type="button" onClick={() => onNavigate('disposition_oversight')}>Inspect QL-231 disposition evidence</button></div>
    </section>}</div>
    <section className="ql218-panel" aria-labelledby="ql233-holds"><h4 id="ql233-holds">Actual held-pilot integrity · QL-181 read-only prerequisites</h4>
      <p>Expected <strong>{company.holdAudit.expected}</strong> · Observed <strong>{company.holdAudit.observed}</strong> · HELD_UNVERIFIED <strong>{company.holdAudit.held}</strong> · Live pilot <strong>BLOCKED</strong>.</p>
      <div className="ql218-scroll"><table><thead><tr><th scope="col">Actual prerequisite</th><th scope="col">Required before live pilot</th><th scope="col">Current hold state</th></tr></thead>
        <tbody>{portfolio.prerequisites.map((hold) => <tr key={hold.id}><th scope="row">{hold.title}</th><td>{hold.requiredBeforePilot}</td><td>{hold.state}</td></tr>)}</tbody></table></div>
    </section>
    <section className="ql218-panel" aria-labelledby="ql233-receipt"><h4 id="ql233-receipt">Privacy-minimized independent reassessment and pilot hold receipt</h4>
      <button type="button" aria-expanded={receiptOpen} aria-controls="ql233-receipt-data" onClick={() => setReceiptOpen((open) => !open)}>{receiptOpen ? 'Hide' : 'Show'} local QL-233 held-pilot receipt</button>
      {receiptOpen && <div id="ql233-receipt-data"><p>Fictional status fields only. No notes, reviewer identities or revision tokens.</p>
        <textarea readOnly rows={15} aria-label="Fixture-only QL-233 held-pilot receipt" value={ql233CompanyReceipt(sources, ledger, organization.id)} /></div>}
    </section>
    <p className="ql218-foot">Production software GREEN does not imply live pilot authorization. Real calls, SMS, provider dispatch and release hold clearances remain disabled.</p>
  </section>;
}

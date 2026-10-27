import { useState, type Dispatch, type SetStateAction } from 'react';
import type { OperatorOrganization, OperatorWorkspace } from './ql191Organizations';
import type { Ql211ScenarioId } from './ql211OwnerTrial';
import type { Ql214GapCategory } from './ql214ReviewIntake';
import { QL232_RELEASE, QL232_CHECKS, beginQl232ProofReview, recordQl232Outcome, advanceQl232Cycle,
  acknowledgeQl232Check, prepareQl232HeldProof, ql232CompanyProof, ql232CompanyReceipt,
  ql232Portfolio, type Ql232Sources, type Ql232Ledger, type Ql232Escalation,
  type Ql232Disposition, type Ql232Proof } from './ql232EscalationProof';
import './ql232-escalation-proof.css';

const sourceCopy: Record<string, string> = {
  AWAITING_PREPARED_QL231: 'Awaiting prepared fictional QL-231 disposition audit',
  SOURCE_CURRENT: 'QL-231 source and QL-181 hold snapshot current',
  QL231_DISPOSITION_REVISED: 'FROZEN · QL-231 disposition evidence revised',
  UPSTREAM_STALE: 'FROZEN · upstream evidence no longer prepared',
  HOLD_PROOF_REVISED: 'FROZEN · actual hold proof snapshot changed'
};

export function Ql232EscalationProofAudit({ organization, sources, ledger, setLedger, onNavigate }: {
  organization: OperatorOrganization;
  sources: Ql232Sources;
  ledger: Ql232Ledger;
  setLedger: Dispatch<SetStateAction<Ql232Ledger>>;
  onNavigate: (workspace: OperatorWorkspace) => void;
}) {
  const [selected, setSelected] = useState<Ql211ScenarioId | null>(null);
  const [category, setCategory] = useState<Ql214GapCategory | ''>('');
  const [escalation, setEscalation] = useState<Ql232Escalation>('ESCALATION_OUTCOME_PENDING_UNVERIFIED');
  const [disposition, setDisposition] = useState<Ql232Disposition>('MAINTAIN_INDEPENDENT_HOLD_DRAFT');
  const [proof, setProof] = useState<Ql232Proof>('HOLD_PROOF_REVALIDATION_PENDING_UNVERIFIED');
  const [note, setNote] = useState('');
  const [helpOpen, setHelpOpen] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [receiptOpen, setReceiptOpen] = useState(false);
  const portfolio = ql232Portfolio(sources, ledger);
  const company = ql232CompanyProof(sources, ledger, organization.id);
  const item = company.cases.find((candidate) => candidate.scenario === selected) ?? company.cases[0];
  const selectedCategory = category && item?.gaps.some((gap) => gap.category === category) ? category : item?.gaps[0]?.category;
  const selectedGap = item?.gaps.find((gap) => gap.category === selectedCategory);
  const change = (operation: (previous: Ql232Ledger, scenario: Ql211ScenarioId) => Ql232Ledger) => {
    if (item) setLedger((previous) => operation(previous, item.scenario));
  };
  return <section className="ql218-workbench ql232-workbench" data-ql232-release={QL232_RELEASE} data-organization={organization.id} aria-labelledby="ql232-title">
    <header className="ql218-header"><div><p className="ql191-eyebrow">QL-232 · Overdue escalation outcomes &amp; conditional hold proof · Disabled preview</p>
      <h3 id="ql232-title">Four-company escalation dispositions, recurrence &amp; hold proof revalidation</h3>
      <p>Reconcile fictional overdue escalation decisions and independently recheck proof that real release holds remain intact.</p></div>
      <button type="button" aria-expanded={helpOpen} aria-controls="ql232-help" onClick={() => setHelpOpen((value) => !value)}>ⓘ Escalation &amp; proof help</button></header>
    <div className="ql218-warning" role="note"><strong>NO INDEPENDENT VERIFICATION, OWNER APPROVAL OR RELEASE.</strong> All {portfolio.prerequisites.length} actual QL-181 gates remain HELD_UNVERIFIED. This local-only workspace places no calls, sends no SMS or reviewer requests, and makes no provider or Supabase writes.</div>
    {helpOpen && <p id="ql232-help" className="ql218-help">Start with a current, prepared fictional QL-231 disposition packet and its twelve held QL-181 prerequisites. Record an invented overdue escalation outcome, unsent independent disposition and proof-revalidation state for each gap. Repeats count once per gap per simulated cycle. After two cycles an independent disposition is due soon, after three overdue; overdue decisions must be escalated with a fresh independent referral draft. P0, recurring, historically late or proof-gap cases also require a fresh independent disposition. Upstream changes or changed hold proof freeze the case until explicit case-only reset. Preparing a local packet requires all evidence categories, no overdue or missing referrals, three UNVERIFIED checks and all real holds intact. Nothing here clears a live release gate.</p>}
    <div className="ql218-metrics" role="status">
      <div><small>Eligible</small><strong>{portfolio.eligible}</strong><span>Four company scopes</span></div>
      <div><small>Recurring / historical</small><strong>{portfolio.recurring} / {portfolio.recurrenceEvents}</strong><span>Fictional events</span></div>
      <div><small>Due soon / overdue</small><strong>{portfolio.dueSoon} / {portfolio.overdue}</strong><span>Simulated cycles</span></div>
      <div><small>Prepared / stale</small><strong>{portfolio.prepared} / {portfolio.stale}</strong><span>Only local audit packets</span></div>
    </div>
    <section className="ql218-panel" aria-labelledby="ql232-portfolio"><h4 id="ql232-portfolio">Four-company independent disposition recurrence and held-proof matrix</h4>
      <div className="ql218-scroll"><table><caption>Only synthetic reviewer and recheck counts; real pilot holds always remain blocked.</caption>
        <thead><tr><th scope="col">Company</th><th scope="col">Eligible</th><th scope="col">Tracking</th><th scope="col">Unreviewed</th><th scope="col">Recurrence events</th><th scope="col">Due soon</th><th scope="col">Overdue</th><th scope="col">Historical overdue</th><th scope="col">Independent referrals missing</th><th scope="col">Proof gaps</th><th scope="col">Prepared</th><th scope="col">Stale</th><th scope="col">Real holds</th></tr></thead>
        <tbody>{portfolio.companies.map((row) => <tr key={row.company}><th scope="row">{row.company === 'rosiedazzlers' ? 'Rosie Dazzlers' : row.company === 'devilndove' ? 'Devil n Dove' : row.company === 'icamp' ? 'iCamp' : 'YW · Property Maintenance'}</th>
          <td>{row.eligible}</td><td>{row.tracking}</td><td>{row.unreviewed}</td><td>{row.recurrenceEvents}</td><td>{row.dueSoon}</td><td>{row.overdue}</td><td>{row.overdueDispositionEpisodes}</td><td>{row.missingDispositions}</td><td>{row.proofGaps}</td><td>{row.prepared}</td><td>{row.stale}</td><td>{row.holdAudit.held}/12 HELD</td></tr>)}</tbody></table></div>
    </section>
    <div className="ql218-grid"><section className="ql218-panel" aria-labelledby="ql232-cases"><h4 id="ql232-cases">{organization.name} · Fictional escalation cases</h4>
      {company.cases.length === 0 ? <p>No synthetic finding exists. <button type="button" onClick={() => onNavigate('trial')}>Open owner trial</button></p> :
        <div role="group" aria-label="Select escalation proof case">{company.cases.map((candidate) => <button type="button" key={candidate.scenario}
          className={candidate.scenario === item?.scenario ? 'ql218-case active' : 'ql218-case'} aria-pressed={candidate.scenario === item?.scenario}
          onClick={() => { setSelected(candidate.scenario); setCategory(''); setResetOpen(false); setNote(''); }}>
          <strong>{candidate.title}</strong><span>{candidate.priority} · {sourceCopy[candidate.sourceStatus]} · {candidate.overdueDispositionEpisodes} prior overdue disposition(s)</span></button>)}</div>}
      {company.orphaned > 0 && <p className="ql218-warning" role="alert">{company.orphaned} orphaned synthetic cases remain held and unverified.</p>}
    </section>
    {item && <section className="ql218-panel" aria-labelledby="ql232-selected"><h4 id="ql232-selected">{item.title} · Escalation outcomes &amp; held-proof revalidation</h4>
      <p className="ql218-source">Source: <strong>{sourceCopy[item.sourceStatus]}</strong> · Prepared QL-231: <strong>{item.eligible ? 'yes' : 'no'}</strong>.</p>
      {!item.eligible && <div className="ql218-warning">Current prepared fictional QL-231 evidence is required. <button type="button" onClick={() => onNavigate('disposition_oversight')}>Inspect QL-231 source</button></div>}
      {item.eligible && !item.record && <button type="button" onClick={() => change((previous, id) => beginQl232ProofReview(sources, previous, organization.id, id))}>Begin fictional escalation outcome &amp; held proof revalidation</button>}
      {item.record && item.sourceStatus !== 'SOURCE_CURRENT' && <div className="ql218-warning" role="alert"><p>Frozen: upstream independent disposition or hold proof changed. Earlier fictional outcomes cannot authorize release.</p>
        <button type="button" aria-expanded={resetOpen} onClick={() => setResetOpen(true)}>Review case-only proof reset</button>
        {resetOpen && <div><p>Only this company's local QL-232 case will be reset; all others remain untouched.</p>
          <button type="button" disabled={!item.eligible} onClick={() => { change((previous, id) => beginQl232ProofReview(sources, previous, organization.id, id)); setResetOpen(false); setNote(''); }}>Confirm case-only proof reset</button>
          <button type="button" onClick={() => setResetOpen(false)}>Cancel reset</button></div>}</div>}
      {item.record && item.sourceStatus === 'SOURCE_CURRENT' && <>
        <p className="ql222-cycle" role="status">Simulated cycle <strong>{item.record.cycle}/12</strong> · Unreviewed <strong>{item.unreviewed}</strong> · Due soon <strong>{item.dueSoon}</strong> · Overdue <strong>{item.overdue}</strong> · Missing independent dispositions <strong>{item.missingDispositions}</strong>.</p>
        <section aria-labelledby="ql232-gaps"><h5 id="ql232-gaps">Overdue escalation outcomes and independent hold proof ({item.gaps.length})</h5>
          {item.gaps.map((gap) => <article className="ql218-gap" key={gap.category}><h6>{gap.category.replaceAll('_', ' ')} · {gap.priority}</h6>
            <p>QL-231 recheck <strong>{gap.recheck.replaceAll('_', ' ')}</strong> · Escalation <strong>{gap.escalation.replaceAll('_', ' ')}</strong>.</p>
            <p>Independent disposition <strong>{gap.disposition.replaceAll('_', ' ')}</strong> · Hold proof <strong>{gap.proof.replaceAll('_', ' ')}</strong> · Decision age <strong>{gap.age === null ? 'NOT TRACKED' : `${gap.age} cycle(s)`}</strong>.</p>
            {gap.dueSoon && <p className="ql223-approaching">Fictional disposition approaching follow-up deadline.</p>}
            {gap.overdue && <p className="ql219-due">Overdue independent disposition requires fresh unsent referral. Historical overdue events are retained.</p>}
            {gap.missingDisposition && <p className="ql219-due">Independent referral or exception reopen still required for inherited or recurring risk.</p>}
            <p>Recurrence events <strong>{gap.dispositionRecurrences}</strong> · Historical overdue <strong>{gap.overdueDispositionEpisodes}</strong> · Actual hold authorization <strong>UNVERIFIED</strong>.</p></article>)}
        </section>
        {item.record.phase === 'overdue_escalation_disposition_proof_review_draft' ? <>
          <div className="ql218-form"><label htmlFor="ql232-gap">Escalation evidence gap</label>
            <select id="ql232-gap" value={selectedCategory ?? ''} onChange={(event) => { setCategory(event.target.value as Ql214GapCategory); setNote(''); }}>
              {item.gaps.map((gap) => <option key={gap.category} value={gap.category}>{gap.category.replaceAll('_', ' ')} · {gap.dispositionRecurrences} repeated</option>)}</select>
            <label htmlFor="ql232-escalation">Overdue recheck escalation outcome · fictional/UNVERIFIED</label>
            <select id="ql232-escalation" value={escalation} onChange={(event) => setEscalation(event.target.value as Ql232Escalation)}>
              <option value="ESCALATION_OUTCOME_PENDING_UNVERIFIED">Outcome pending · UNVERIFIED</option>
              <option value="SIMULATED_ESCALATION_HANDOFF_UNVERIFIED">Imagined escalation handoff · UNVERIFIED</option>
              <option value="SIMULATED_ESCALATION_EXCEPTION_RECURRED_UNVERIFIED">Imagined repeated escalation · UNVERIFIED</option></select>
            <label htmlFor="ql232-disposition">Independent reviewer disposition · UNSENT</label>
            <select id="ql232-disposition" value={disposition} onChange={(event) => setDisposition(event.target.value as Ql232Disposition)}>
              <option value="MAINTAIN_INDEPENDENT_HOLD_DRAFT">Maintain held disposition · draft</option>
              <option value="REFER_NEW_INDEPENDENT_DISPOSITION_DRAFT">Refer new independent disposition · unsent draft</option>
              <option value="REOPEN_ESCALATION_EXCEPTION_DRAFT">Reopen escalation exception · draft</option></select>
            <label htmlFor="ql232-proof">Conditional hold proof revalidation · fictional/UNVERIFIED</label>
            <select id="ql232-proof" value={proof} onChange={(event) => setProof(event.target.value as Ql232Proof)}>
              <option value="HOLD_PROOF_REVALIDATION_PENDING_UNVERIFIED">Hold proof pending · UNVERIFIED</option>
              <option value="SIMULATED_HELD_PROOF_MATCH_UNVERIFIED">Imagined held proof match · UNVERIFIED</option>
              <option value="HOLD_PROOF_GAP_RECONFIRMED_UNVERIFIED">Imagined hold proof gap reconfirmed · UNVERIFIED</option></select>
            <label htmlFor="ql232-note">Fictional note (8–180 characters)</label>
            <textarea id="ql232-note" rows={3} maxLength={180} value={note} onChange={(event) => setNote(event.target.value)} placeholder="Synthetic notes only. No real customer or reviewer identity." />
            <button type="button" disabled={!selectedCategory || note.trim().length < 8 ||
              (!!selectedGap?.overdue && disposition !== 'REFER_NEW_INDEPENDENT_DISPOSITION_DRAFT') ||
              ((escalation === 'SIMULATED_ESCALATION_EXCEPTION_RECURRED_UNVERIFIED' || proof === 'HOLD_PROOF_GAP_RECONFIRMED_UNVERIFIED') && disposition === 'MAINTAIN_INDEPENDENT_HOLD_DRAFT')}
              onClick={() => { if (selectedCategory) change((previous, id) => recordQl232Outcome(sources, previous, organization.id,
                id, selectedCategory, escalation, disposition, proof, note)); setNote(''); }}>Record fictional escalation &amp; hold proof · UNSENT</button>
            <button type="button" disabled={item.record.cycle >= 12} onClick={() => change((previous, id) => advanceQl232Cycle(sources, previous, organization.id, id))}>Advance synthetic independent disposition cycle (+1)</button>
            <small>Two simulated cycles due soon, three overdue. Local hold proof does not grant live permission.</small></div>
          <section className="ql219-checklist" aria-labelledby="ql232-checks"><h5 id="ql232-checks">Escalation &amp; hold proof oversight · UNVERIFIED checks</h5>
            {QL232_CHECKS.map((check) => <article key={check.id} className="ql219-check"><div><strong>{check.title}</strong><p>{check.detail}</p></div>
              <button type="button" disabled={item.record?.checks[check.id] === 'ACKNOWLEDGED_UNVERIFIED'} onClick={() => change((previous, id) => acknowledgeQl232Check(sources, previous, organization.id, id, check.id))}>
                {item.record?.checks[check.id] === 'ACKNOWLEDGED_UNVERIFIED' ? 'Locally reviewed · UNVERIFIED' : 'Acknowledge held proof · UNVERIFIED'}</button></article>)}
          </section>
          <button type="button" disabled={!item.readyForLocalAudit} onClick={() => change((previous, id) => prepareQl232HeldProof(sources, previous, organization.id, id))}>Prepare escalation &amp; held proof revalidation packet · NO RELEASE</button>
        </> : <p className="ql218-prepared" role="status">QL-232 fictional escalation and held proof audit packet prepared locally. No real independent sign-off or pilot release.</p>}
      </>}
      <div className="ql218-actions"><button type="button" onClick={() => onNavigate('disposition_oversight')}>Inspect QL-231 disposition source</button>
        <button type="button" onClick={() => onNavigate('reviewer_continuity')}>Inspect QL-230 reviewer continuity</button></div>
    </section>}</div>
    <section className="ql218-panel" aria-labelledby="ql232-holds"><h4 id="ql232-holds">QL-181 actual hold proof revalidation · read-only</h4>
      <p>Expected <strong>{company.holdAudit.expected}</strong> · Observed <strong>{company.holdAudit.observed}</strong> · HELD_UNVERIFIED <strong>{company.holdAudit.held}</strong> · Conditional release <strong>BLOCKED</strong>.</p>
      <div className="ql218-scroll"><table><thead><tr><th scope="col">Actual prerequisite</th><th scope="col">Required before live pilot</th><th scope="col">Current hold</th></tr></thead>
        <tbody>{portfolio.prerequisites.map((hold) => <tr key={hold.id}><th scope="row">{hold.title}</th><td>{hold.requiredBeforePilot}</td><td>{hold.state}</td></tr>)}</tbody></table></div>
    </section>
    <section className="ql218-panel" aria-labelledby="ql232-receipt"><h4 id="ql232-receipt">Privacy-minimized held proof revalidation receipt</h4>
      <button type="button" aria-expanded={receiptOpen} aria-controls="ql232-receipt-data" onClick={() => setReceiptOpen((open) => !open)}>{receiptOpen ? 'Hide' : 'Show'} local QL-232 held proof receipt</button>
      {receiptOpen && <div id="ql232-receipt-data"><p>Fictional statuses only. Private notes, reviewer identities and source or proof tokens are excluded.</p>
        <textarea readOnly rows={15} aria-label="Fixture-only QL-232 held proof receipt" value={ql232CompanyReceipt(sources, ledger, organization.id)} /></div>}
    </section>
    <p className="ql218-foot">Production software GREEN is not live pilot authorization. Calls, SMS, independent approval and provider dispatch remain blocked.</p>
  </section>;
}

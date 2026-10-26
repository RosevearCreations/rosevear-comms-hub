import { useState, type Dispatch, type SetStateAction } from 'react';
import type { OperatorOrganization, OperatorWorkspace } from './ql191Organizations';
import type { Ql211Ledger, Ql211ScenarioId } from './ql211OwnerTrial';
import type { Ql212Ledger } from './ql212RepairQueue';
import type { Ql213Ledger } from './ql213ReviewPreparation';
import { QL214_RELEASE, QL214_GAP_CATEGORIES, QL214_REVIEWERS,
  ql214CompanyReview, ql214Portfolio, ql214CompanyReceipt,
  beginQl214Intake, draftQl214Intake, upsertQl214Gap, prepareQl214Handoff,
  type Ql214Ledger, type Ql214GapCategory, type Ql214GapPriority, type Ql214FollowUp,
  type Ql214Reviewer } from './ql214ReviewIntake';
import './ql214-review-intake-holds.css';

export function Ql214ReviewIntakeHoldRegister({ organization, trial, repair, review, ledger, setLedger, onNavigate }: {
  organization: OperatorOrganization;
  trial: Ql211Ledger;
  repair: Ql212Ledger;
  review: Ql213Ledger;
  ledger: Ql214Ledger;
  setLedger: Dispatch<SetStateAction<Ql214Ledger>>;
  onNavigate: (workspace: OperatorWorkspace) => void;
}) {
  const [selected, setSelected] = useState<Ql211ScenarioId | null>(null);
  const [showHelp, setShowHelp] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [replaceConfirm, setReplaceConfirm] = useState(false);
  const [category, setCategory] = useState<Ql214GapCategory>('actual_repair');
  const [priority, setPriority] = useState<Ql214GapPriority>('P1');
  const [followUp, setFollowUp] = useState<Ql214FollowUp>('OPEN_UNVERIFIED');
  const [gapNote, setGapNote] = useState('');
  const portfolio = ql214Portfolio(trial, repair, review, ledger);
  const company = ql214CompanyReview(trial, repair, review, ledger, organization.id);
  const item = company.cases.find((entry) => entry.scenario === selected) ?? company.cases[0];
  const intake = item?.intake && !item.stale ? item.intake : null;
  const editable = intake?.phase === 'intake_draft';

  function update(operation: (previous: Ql214Ledger, id: Ql211ScenarioId) => Ql214Ledger) {
    if (item) setLedger((previous) => operation(previous, item.scenario));
  }

  return <section className="ql214-register" aria-labelledby="ql214-title" data-ql214-release={QL214_RELEASE} data-organization={organization.id}>
    <header className="ql214-header"><div><p className="ql191-eyebrow">QL-214 · Disabled-preview independent-review intake</p>
      <h3 id="ql214-title">Four-company evidence gaps &amp; conditional release hold register</h3>
      <p>Prepare a fictional reviewer handoff with unresolved gap ownership, while preserving all live-pilot release holds.</p></div>
      <button type="button" aria-expanded={showHelp} aria-controls="ql214-help" onClick={() => setShowHelp((open) => !open)}>ⓘ Intake help</button>
    </header>
    <p className="ql214-warning" role="note"><strong>CONDITIONAL RELEASE BLOCKED.</strong> QL-214 only collects fictional session-local preparation notes. Simulated reviewer assignment is not identity verification or independent review. No real owner authorization, sign-off, code repair verification, calls, SMS, carrier activity, customer data or external writes. All {portfolio.heldPrerequisites.length} live-pilot prerequisites remain HELD_UNVERIFIED.</p>
    {showHelp && <p className="ql214-help" id="ql214-help">Record an owner/operator gap in QL-211, a repair and manually noted retest in QL-212, then complete QL-213's fictional comparison and five checklist drafts. Only then can you create a QL-214 intake. Select a *fictional* review role, describe a preview handoff, and record evidence gaps. “Prepare handoff” saves only an in-memory local plan and sends nothing. The release gate stays held in every state.</p>}
    <div className="ql214-metrics" role="status">
      <div><small>Open trial findings</small><strong>{portfolio.openFindings}</strong><span>Self-reported, unverified</span></div>
      <div><small>Review intake drafts</small><strong>{portfolio.drafts}</strong><span>{portfolio.stale} stale/withdrawn</span></div>
      <div><small>Evidence gap records</small><strong>{portfolio.evidenceGaps}</strong><span>{portfolio.locallyPrepared} local handoffs prepared</span></div>
      <div><small>Real-pilot hold</small><strong className="ql214-held">{portfolio.heldPrerequisites.length} HELD</strong><span>No conditional release authorized</span></div>
    </div>
    <section className="ql214-panel" aria-labelledby="ql214-coverage-title"><h4 id="ql214-coverage-title">Company-by-company review intake register</h4>
      <div className="ql214-scroll"><table><caption>Documentation handoff is local and does not reduce required independent evidence.</caption>
        <thead><tr><th scope="col">Company</th><th scope="col">Open findings</th><th scope="col">Intakes</th><th scope="col">Gaps</th><th scope="col">Prepared locally</th><th scope="col">Stale</th><th scope="col">Release</th></tr></thead>
        <tbody>{portfolio.companies.map((row) => <tr key={row.company}><th scope="row">{row.company === 'rosiedazzlers' ? 'Rosie Dazzlers' : row.company === 'devilndove' ? 'Devil n Dove' : row.company === 'icamp' ? 'iCamp' : 'YW · Property Maintenance'}</th>
          <td>{row.openFindings}</td><td>{row.drafts}</td><td>{row.gaps}</td><td>{row.handoffsPrepared}</td><td>{row.stale}</td><td>HELD</td></tr>)}</tbody>
      </table></div>
    </section>
    <div className="ql214-grid">
      <section className="ql214-panel" aria-labelledby="ql214-cases-title"><h4 id="ql214-cases-title">{organization.name} · Findings for intake</h4>
        {company.cases.length === 0 ? <p>No QL-211 trial gaps have been reported here. The case list is correctly empty; it is not proof of testing. <button type="button" onClick={() => onNavigate('trial')}>Open QL-211 trial</button></p> :
          <div role="group" aria-label="Select a finding for intake">{company.cases.map((candidate) => <button type="button" key={candidate.scenario}
            className={candidate.scenario === item?.scenario ? 'ql214-case active' : 'ql214-case'} aria-pressed={candidate.scenario === item?.scenario}
            onClick={() => { setSelected(candidate.scenario); setReplaceConfirm(false); }}>
            <strong>{candidate.title}</strong><span>{candidate.priority} · {candidate.stale ? 'STALE REVIEW' : candidate.intake?.phase.replaceAll('_', ' ') ?? 'No intake'} · release HELD</span></button>)}</div>}
        {company.orphaned > 0 && <p className="ql214-warning" role="alert">{company.orphaned} withdrawn finding(s) still have stale local intake drafts. Removing a QL-211 report cannot close their release risks.</p>}
      </section>
      {item && <section className="ql214-panel ql214-detail" aria-labelledby="ql214-detail-title"><h4 id="ql214-detail-title">{item.title} · {item.priority}</h4>
        <p>QL-213 prerequisite: <strong>{item.upstreamReadiness.replaceAll('_',' ')}</strong>.</p>
        {!item.eligible && <div className="ql214-warning">An intake requires a current QL-213 packet marked <em>prepared for review · unverified</em>, including a later replay and all five checklist drafts. This step does not bypass QL-211 or QL-212.
          <button type="button" onClick={() => onNavigate('review')}>Open QL-213 review prep</button></div>}
        {item.eligible && !item.intake && <button type="button" className="ql214-primary" onClick={() => update((previous, id) => beginQl214Intake(trial, repair, review, previous, organization.id, id))}>Begin fictional independent-review intake</button>}
        {item.stale && <div className="ql214-warning" role="alert"><strong>Upstream evidence changed.</strong> The earlier intake is frozen and cannot be counted as a current reviewer packet.
          {item.eligible && <><button type="button" aria-controls="ql214-replace" aria-expanded={replaceConfirm} onClick={() => setReplaceConfirm((open) => !open)}>Replace stale local intake</button>
            {replaceConfirm && <div id="ql214-replace"><p>Discard this finding's local intake details, simulated assignment and gap notes? Other company cases remain untouched.</p>
              <button type="button" onClick={() => { update((previous, id) => beginQl214Intake(trial, repair, review, previous, organization.id, id)); setReplaceConfirm(false); }}>Confirm reset to current QL-213 source</button>
              <button type="button" onClick={() => setReplaceConfirm(false)}>Cancel</button></div>}</>}
        </div>}
        {intake && <>
          <p className="ql214-status">Intake stage: <strong>{intake.phase.replaceAll('_',' ')}</strong>. Independent review: <strong>NOT PERFORMED</strong>. Release: <strong>HELD.</strong></p>
          <div className="ql214-form"><h5>Fictional reviewer intake</h5>
            <label htmlFor="ql214-reviewer">Illustrative reviewer role (not a real person)</label>
            <select id="ql214-reviewer" value={intake.reviewer} disabled={!editable} onChange={(event) => update((previous, id) => draftQl214Intake(trial, repair, review, previous, organization.id, id, event.target.value as Ql214Reviewer, intake.brief))}>
              {QL214_REVIEWERS.map((role) => <option key={role} value={role}>{role.replaceAll('_',' ')}</option>)}</select>
            <label htmlFor="ql214-brief">Fictional handoff scope or review question (8–200 characters)</label>
            <textarea id="ql214-brief" rows={3} maxLength={200} disabled={!editable} value={intake.brief}
              onChange={(event) => update((previous, id) => draftQl214Intake(trial, repair, review, previous, organization.id, id, intake.reviewer, event.target.value))}
              placeholder="Example: Independent reviewer should inspect the mock focus repair at 200% zoom. No personal data." />
            <small>No notification, review request, or identity verification is performed.</small>
          </div>
          <section className="ql214-gap-section" aria-labelledby="ql214-gaps-title"><h5 id="ql214-gaps-title">Evidence gap and follow-up records ({intake.gaps.length})</h5>
            {intake.gaps.length === 0 ? <p>No gap detail has been drafted in this intake yet. The underlying case and twelve policy holds still remain open.</p> :
              <ul>{intake.gaps.map((gap) => <li key={gap.category}><strong>{QL214_GAP_CATEGORIES.find((entry) => entry.id === gap.category)?.label}</strong>
                <span>{gap.priority} · {gap.followUp.replaceAll('_',' ')}</span><p>Fictional evidence note: {gap.note}</p></li>)}</ul>}
            {editable && <div className="ql214-form"><label htmlFor="ql214-gap-category">Gap category</label>
              <select id="ql214-gap-category" value={category} onChange={(event) => { setCategory(event.target.value as Ql214GapCategory); setGapNote(''); }}>
                {QL214_GAP_CATEGORIES.map((entry) => <option value={entry.id} key={entry.id}>{entry.label}</option>)}</select>
              <label htmlFor="ql214-gap-priority">Impact priority</label><select id="ql214-gap-priority" value={priority} onChange={(event) => setPriority(event.target.value as Ql214GapPriority)}>
                {(['P0','P1','P2','P3'] as const).map((value) => <option key={value} value={value}>{value}</option>)}</select>
              <label htmlFor="ql214-gap-followup">Status (never closed)</label><select id="ql214-gap-followup" value={followUp} onChange={(event) => setFollowUp(event.target.value as Ql214FollowUp)}>
                <option value="OPEN_UNVERIFIED">Open · unverified</option><option value="FOLLOWUP_PLANNED">Follow-up planned</option>
                <option value="REFERENCE_DRAFTED_UNVERIFIED">Reference drafted · unverified</option></select>
              <label htmlFor="ql214-gap-note">Fictional evidence gap note (8–180 characters)</label><textarea id="ql214-gap-note" rows={3} maxLength={180} value={gapNote}
                onChange={(event) => setGapNote(event.target.value)} placeholder="Describe the missing proof or follow-up action; no customer information." />
              <button type="button" disabled={gapNote.trim().length < 8} onClick={() => { update((previous, id) => upsertQl214Gap(trial, repair, review, previous, organization.id, id,
                { category, priority, followUp, note: gapNote })); setGapNote(''); }}>Save gap or update category</button>
              <small>Each category has one current local draft. Replacing it never lifts a hold.</small></div>}
          </section>
          {editable && <button type="button" className="ql214-primary" disabled={intake.reviewer === 'unassigned' || intake.brief.trim().length < 8 || intake.gaps.length === 0 || intake.gaps.some((gap) => gap.followUp === 'OPEN_UNVERIFIED')}
            onClick={() => update((previous, id) => prepareQl214Handoff(trial, repair, review, previous, organization.id, id))}>Prepare local handoff · NO DISPATCH</button>}
          {intake.phase === 'local_handoff_prepared' && <p className="ql214-warning">The fictional handoff packet is assembled locally only. No actual reviewer saw it. All evidence gaps and release controls remain open; a separately authorized real-world review is still required.</p>}
        </>}
        <div className="ql214-actions"><button type="button" onClick={() => onNavigate('review')}>Review QL-213 packet</button>
          <button type="button" onClick={() => onNavigate('repair')}>Review QL-212 replay</button></div>
      </section>}
    </div>
    <section className="ql214-panel" aria-labelledby="ql214-holds-title"><h4 id="ql214-holds-title">Conditional release hold register — twelve unverified prerequisites</h4>
      <p>These source-of-truth QL-181 controls cannot be edited, approved or dismissed from the preview. They apply to every company, even if no trial finding exists.</p>
      <div className="ql214-scroll"><table><thead><tr><th scope="col">Review area</th><th scope="col">Requirement</th><th scope="col">Evidence still needed</th><th scope="col">Gate</th></tr></thead>
        <tbody>{portfolio.heldPrerequisites.map((hold) => <tr key={hold.id}><th scope="row">{hold.category}</th><td>{hold.title}</td><td>{hold.requiredBeforePilot}</td><td><strong>HELD</strong></td></tr>)}</tbody>
      </table></div>
    </section>
    <section className="ql214-panel" aria-labelledby="ql214-receipt-title"><h4 id="ql214-receipt-title">Fixed-schema local review intake receipt</h4>
      <button type="button" aria-expanded={showReceipt} aria-controls="ql214-receipt" onClick={() => setShowReceipt((open) => !open)}>{showReceipt ? 'Hide' : 'Show'} PII-minimized company receipt</button>
      {showReceipt && <div id="ql214-receipt"><p>Copy manually if needed. This excludes fictional free text, reviewer role details, upstream version hashes and any real-world identity or customer data.</p>
        <textarea aria-label="Fixture-only independent review intake receipt" readOnly rows={13} value={ql214CompanyReceipt(trial, repair, review, ledger, organization.id)} /></div>}
    </section>
    <p className="ql214-foot">A production-green software build and a locally assembled fictional review packet do not constitute an independent security review, real owner approval, provider authorization or permission to call/text customers.</p>
  </section>;
}

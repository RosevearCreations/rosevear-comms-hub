import { useState, type Dispatch, type SetStateAction } from 'react';
import type { OperatorOrganization, OperatorWorkspace } from './ql191Organizations';
import type { Ql211Ledger, Ql211ScenarioId } from './ql211OwnerTrial';
import type { Ql212Ledger } from './ql212RepairQueue';
import { QL213_RELEASE, QL213_REVIEW_CHECKS, ql213CompanyReceipt, ql213Portfolio,
  ql213ReviewForCompany, startQl213Comparison, captureQl213After, setQl213Check,
  type Ql213Ledger, type Ql213CheckId, type Ql213CheckState } from './ql213ReviewPreparation';
import './ql213-independent-review-prep.css';

const readinessLabels: Record<string, string> = {
  NOT_PREPARED: 'No review draft', STALE_REPAIR_SOURCE: 'STALE — source changed',
  AFTER_REPLAY_REQUIRED: 'Awaiting new after-replay', RETEST_UNRESOLVED: 'Human retest unresolved',
  CHECKLIST_INCOMPLETE: 'Checklist incomplete', FOLLOWUP_REQUIRED: 'Independent follow-up required',
  PREPARED_FOR_REVIEW_UNVERIFIED: 'Packet prepared · UNVERIFIED'
};

export function Ql213IndependentReviewPrep({ organization, trial, repair, ledger, setLedger, onNavigate }: {
  organization: OperatorOrganization;
  trial: Ql211Ledger;
  repair: Ql212Ledger;
  ledger: Ql213Ledger;
  setLedger: Dispatch<SetStateAction<Ql213Ledger>>;
  onNavigate: (workspace: OperatorWorkspace) => void;
}) {
  const [activeId, setActiveId] = useState<Ql211ScenarioId | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [showHelp, setShowHelp] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [confirmReplace, setConfirmReplace] = useState(false);
  const portfolio = ql213Portfolio(trial, repair, ledger);
  const company = ql213ReviewForCompany(trial, repair, ledger, organization.id);
  const item = company.items.find((entry) => entry.finding.id === activeId) ?? company.items[0];
  const activeDraft = item?.draft && !item.stale ? item.draft : null;

  function change(operation: (previous: Ql213Ledger, id: Ql211ScenarioId) => Ql213Ledger) {
    if (item) setLedger((previous) => operation(previous, item.finding.id));
  }

  function noteKey(checkId: Ql213CheckId) {
    return `${organization.id}:${item?.finding.id ?? 'none'}:${checkId}`;
  }

  function saveCheck(checkId: Ql213CheckId, state: Ql213CheckState) {
    if (!item) return;
    const note = notes[noteKey(checkId)] ?? activeDraft?.checks[checkId]?.note ?? '';
    change((previous, id) => setQl213Check(trial, repair, previous, organization.id, id, checkId, state, note));
  }

  return <section className="ql213-review" aria-labelledby="ql213-title" data-ql213-release={QL213_RELEASE} data-organization={organization.id}>
    <header className="ql213-header"><div><p className="ql191-eyebrow">QL-213 · Independent review preparation · Disabled preview</p>
      <h3 id="ql213-title">Repair retest comparison &amp; independent review preparation</h3>
      <p>Pair an explicitly reported trial finding with a before/after fictional replay and prepare an unresolved independent-review checklist.</p></div>
      <button type="button" aria-expanded={showHelp} aria-controls="ql213-help" onClick={() => setShowHelp((open) => !open)}>ⓘ Comparison help</button>
    </header>
    <p className="ql213-warning" role="note"><strong>NO CLOSURE OR LIVE AUTHORITY.</strong> Both QL-210 replay checks and QL-212 manual retest reports are unverified preview evidence. An unchanged synthetic PASS does not establish that a repair worked. All {portfolio.heldPrerequisites.length} real-pilot prerequisites remain HELD_UNVERIFIED, with no provider calls, SMS, external writes, real owner approval or independent sign-off. Enter fictional notes only; all work disappears on reload.</p>
    {showHelp && <p id="ql213-help" className="ql213-help" role="note">First record a gap in QL-211, queue it and request a retest in QL-212. After noting a human preview retest, capture the latest QL-212 mock replay as the “before” snapshot. Run a new QL-212 safe replay and return to capture its “after” snapshot. Prepare each checklist item as a draft or flag missing evidence. Nothing can close a finding or authorize the real pilot.</p>}
    <div className="ql213-metrics" role="status">
      <div><small>Four-company open findings</small><strong>{portfolio.findings}</strong><span>QL-211 session reports only</span></div>
      <div><small>Review drafts</small><strong>{portfolio.drafted}</strong><span>{portfolio.stale} stale or withdrawn</span></div>
      <div><small>Packets prepared · unverified</small><strong>{portfolio.preparedUnverified}</strong><span>Still need independent review</span></div>
      <div><small>Real-pilot policy</small><strong className="ql213-held">HELD · {portfolio.heldPrerequisites.length}</strong><span>No approval implied</span></div>
    </div>
    <section className="ql213-panel" aria-labelledby="ql213-coverage"><h4 id="ql213-coverage">Four-company review preparation coverage</h4>
      <div className="ql213-table-scroll"><table><caption>Prepared means only that local fictional documentation is assembled, never that a repair was verified.</caption>
        <thead><tr><th scope="col">Company</th><th scope="col">Open findings</th><th scope="col">Drafted</th><th scope="col">Stale</th><th scope="col">Pending</th><th scope="col">Prepared (unverified)</th></tr></thead>
        <tbody>{portfolio.companies.map((row) => <tr key={row.organizationId}><th scope="row">{row.organizationId === 'rosiedazzlers' ? 'Rosie Dazzlers' : row.organizationId === 'devilndove' ? 'Devil n Dove' : row.organizationId === 'icamp' ? 'iCamp' : 'YW · Property Maintenance'}</th>
          <td>{row.findings}</td><td>{row.drafted}</td><td>{row.stale}</td><td>{row.pending}</td><td>{row.preparedUnverified}</td></tr>)}</tbody>
      </table></div>
    </section>
    <div className="ql213-grid">
      <section className="ql213-panel" aria-labelledby="ql213-findings"><h4 id="ql213-findings">{organization.name} · Open cases ({company.items.length})</h4>
        {company.items.length === 0 ? <p>No owner/operator-reported gaps exist for this company in this session. No findings or approvals have been fabricated. <button type="button" onClick={() => onNavigate('trial')}>Open QL-211 trial</button></p> :
          <div role="group" aria-label="Select case for comparison">{company.items.map((candidate) => <button type="button" key={candidate.finding.id}
            className={candidate.finding.id === item?.finding.id ? 'ql213-case active' : 'ql213-case'}
            aria-pressed={candidate.finding.id === item?.finding.id} onClick={() => { setActiveId(candidate.finding.id); setConfirmReplace(false); }}>
            <strong>{candidate.finding.title}</strong><span>{candidate.finding.priority} · {readinessLabels[candidate.readiness]}</span></button>)}</div>}
        {company.orphanedDrafts > 0 && <p className="ql213-warning" role="alert">{company.orphanedDrafts} earlier local draft(s) refer to a withdrawn QL-211 finding. They remain stale; withdrawal is not evidence of resolution.</p>}
      </section>
      {item && <section className="ql213-panel ql213-detail" aria-labelledby="ql213-detail-title"><h4 id="ql213-detail-title">{item.finding.title} · {item.finding.priority}</h4>
        <p>Source: QL-211 <strong>{item.finding.outcome === 'blocked' ? 'Blocked' : 'Observed gap'}</strong>; QL-212 stage: <strong>{item.repair?.phase ?? 'not queued'}</strong>.</p>
        <p className="ql213-result">Preparation state: <strong>{readinessLabels[item.readiness]}</strong>. Independent approval: <strong>HELD</strong>.</p>
        {!item.eligible && <div className="ql213-warning">Start only after a current QL-212 repair draft, mock replay and *human-reported* retest result exist. This is an explicit preview workflow, not a claim that the underlying bug was fixed.
          <button type="button" onClick={() => onNavigate('repair')}>Open QL-212 evidence queue</button></div>}
        {item.eligible && !item.draft && <button type="button" className="ql213-primary" onClick={() => change((previous, id) => startQl213Comparison(trial, repair, previous, organization.id, id))}>Begin comparison with latest QL-212 replay</button>}
        {item.stale && <div className="ql213-warning" role="alert"><strong>Prior comparison is stale.</strong> Source finding or QL-212 repair version changed; previous review notes cannot be treated as current.
          {item.eligible && <><button type="button" aria-expanded={confirmReplace} aria-controls="ql213-replace" onClick={() => setConfirmReplace((open) => !open)}>Replace stale comparison</button>
            {confirmReplace && <div id="ql213-replace"><p>Discard this case's previous local QL-213 comparison and checklist? Other company cases are unaffected.</p>
              <button type="button" onClick={() => { change((previous, id) => startQl213Comparison(trial, repair, previous, organization.id, id)); setConfirmReplace(false); }}>Confirm new baseline</button>
              <button type="button" onClick={() => setConfirmReplace(false)}>Cancel</button></div>}</>}
        </div>}
        {activeDraft && <>
          <section className="ql213-compare" aria-labelledby="ql213-compare-title"><h5 id="ql213-compare-title">Synthetic before / after replay evidence</h5>
            <div className="ql213-pair"><div><small>Before · run {activeDraft.before.sequence}</small><strong>{activeDraft.before.disposition.replaceAll('_',' ')}</strong></div>
              <div><small>After {activeDraft.after ? `· run ${activeDraft.after.sequence}` : '· not captured'}</small><strong>{activeDraft.after?.disposition.replaceAll('_',' ') ?? 'AWAITING NEW RUN'}</strong></div></div>
            <p>Comparison: <strong>{item.comparison.replaceAll('_',' ')}</strong>. This compares mock policy baselines only, not a verified UI fix. Manual-only checks still require real accessibility/device review.</p>
            <div className="ql213-actions"><button type="button" onClick={() => onNavigate('repair')}>Run a NEW QL-212 mock replay</button>
              <button type="button" disabled={!item.repair || item.repair.replays.at(-1)!.sequence <= (activeDraft.after?.sequence ?? activeDraft.before.sequence)}
                onClick={() => change((previous, id) => captureQl213After(trial, repair, previous, organization.id, id))}>Capture latest run as after</button></div>
            {item.repair?.phase !== 'retest_pass_noted' && <p className="ql213-warning">Human retest is failed or blocked. An independent reviewer must resolve that issue; a passing synthetic replay does not override it.</p>}
          </section>
          <section className="ql213-checklist" aria-labelledby="ql213-checklist-title"><h5 id="ql213-checklist-title">Independent review preparation checklist</h5>
            <p>Document questions and missing artifacts for a future independent reviewer. “Drafted” does not mean that reviewer inspected or accepted anything.</p>
            {QL213_REVIEW_CHECKS.map((check) => { const saved = activeDraft.checks[check.id]; const note = notes[noteKey(check.id)] ?? saved?.note ?? '';
              return <div className="ql213-check" key={check.id}><h6>{check.title}</h6><p>{check.help}</p>
                <label htmlFor={`ql213-note-${check.id}`}>Fictional checklist note (8–160 characters to mark drafted/follow-up)</label>
                <textarea id={`ql213-note-${check.id}`} rows={2} maxLength={160} value={note} onChange={(event) => setNotes((previous) => ({ ...previous, [noteKey(check.id)]: event.target.value }))} placeholder="Describe missing evidence, not personal details." />
                <div className="ql213-actions"><button type="button" disabled={note.trim().length < 8} onClick={() => saveCheck(check.id, 'drafted_unverified')}>Save unverified draft</button>
                  <button type="button" disabled={note.trim().length < 8} onClick={() => saveCheck(check.id, 'followup_needed')}>Flag follow-up</button>
                  <button type="button" onClick={() => { setNotes((previous) => ({ ...previous, [noteKey(check.id)]: '' })); saveCheck(check.id, 'not_prepared'); }}>Clear</button></div>
                <small>Recorded: <strong>{(saved?.state ?? 'not_prepared').replaceAll('_',' ')}</strong> · Not an independent sign-off.</small>
              </div>; })}
          </section>
          <div className="ql213-warning"><strong>Closure-risk summary:</strong> {item.readiness === 'PREPARED_FOR_REVIEW_UNVERIFIED' ? 'Documentation prepared for possible independent review. Real repair, user acceptance, security, consent and provider controls remain unverified.' :
            item.readiness === 'RETEST_UNRESOLVED' ? 'Failed or blocked human retest requires further work before review.' :
            item.readiness === 'AFTER_REPLAY_REQUIRED' ? 'A new after-run has not been captured; comparison is incomplete.' :
            item.readiness === 'FOLLOWUP_REQUIRED' ? 'One or more checklist areas require follow-up evidence.' : 'Independent review preparation is incomplete and cannot close this finding.'}</div>
        </>}
        <div className="ql213-actions"><button type="button" onClick={() => onNavigate('trial')}>Review QL-211 source</button>
          <button type="button" onClick={() => onNavigate('repair')}>Review QL-212 repair record</button></div>
      </section>}
    </div>
    <section className="ql213-panel" aria-labelledby="ql213-receipt-title"><h4 id="ql213-receipt-title">PII-minimized review packet preview</h4>
      <p>When a QL-213 packet is locally prepared, open the next fictional independent-review intake and conditional release hold register.</p>
      <button type="button" onClick={() => onNavigate('intake')}>Open QL-214 review intake &amp; holds</button>
      <button type="button" aria-expanded={showReceipt} aria-controls="ql213-receipt-data" onClick={() => setShowReceipt((open) => !open)}>{showReceipt ? 'Hide' : 'Show'} fixed-schema company receipt</button>
      {showReceipt && <div id="ql213-receipt-data"><p>This copyable status receipt excludes source notes, repair plans, reviewer drafts, customer information, source version hashes and identities.</p>
        <textarea aria-label="Fixture-only comparison review receipt" readOnly rows={14} value={ql213CompanyReceipt(trial, repair, ledger, organization.id)} /></div>}
    </section>
    <p className="ql213-foot">QL-213 is preparation for a future independent review. No synthetic “PASS”, drafted checklist or production GREEN status ever marks a case closed, attests an actual owner, or authorizes telephone/SMS service.</p>
  </section>;
}

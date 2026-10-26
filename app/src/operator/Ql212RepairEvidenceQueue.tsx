import { useState, type Dispatch, type SetStateAction } from 'react';
import type { OperatorOrganization, OperatorWorkspace } from './ql191Organizations';
import type { Ql211Ledger, Ql211ScenarioId } from './ql211OwnerTrial';
import { QL212_RELEASE, ql212Portfolio, ql212QueueForCompany, ql212CompanyReceipt,
  queueQl212Finding, replayQl212Finding, writeQl212RepairNote, requestQl212Retest,
  recordQl212Retest, type Ql212Ledger } from './ql212RepairQueue';
import './ql212-repair-evidence-queue.css';

const phaseLabels: Record<string, string> = {
  queued: 'Queued for repair planning', repair_draft: 'Repair evidence draft',
  retest_requested: 'Retest requested', retest_pass_noted: 'Retest pass noted · UNVERIFIED',
  retest_fail_noted: 'Retest failed · still open', retest_blocked: 'Retest blocked · still open'
};

export function Ql212RepairEvidenceQueue({ organization, trial, ledger, setLedger, onNavigate }: {
  organization: OperatorOrganization;
  trial: Ql211Ledger;
  ledger: Ql212Ledger;
  setLedger: Dispatch<SetStateAction<Ql212Ledger>>;
  onNavigate: (workspace: OperatorWorkspace) => void;
}) {
  const [activeId, setActiveId] = useState<Ql211ScenarioId | null>(null);
  const [showHelp, setShowHelp] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [confirmRefresh, setConfirmRefresh] = useState(false);
  const portfolio = ql212Portfolio(trial, ledger);
  const company = ql212QueueForCompany(trial, ledger, organization.id);
  const item = company.items.find((entry) => entry.finding.id === activeId) ?? company.items[0];
  const entry = item?.entry;
  const usableEntry = entry && !item.stale ? entry : null;

  const apply = (operation: (previous: Ql212Ledger, id: Ql211ScenarioId) => Ql212Ledger) => {
    if (item) setLedger((previous) => operation(previous, item.finding.id));
  };

  return <section className="ql212-queue" aria-labelledby="ql212-title" data-ql212-release={QL212_RELEASE} data-organization={organization.id}>
    <header className="ql212-header"><div><p className="ql191-eyebrow">QL-212 · Repair evidence, disabled preview</p>
      <h3 id="ql212-title">Four-company trial finding replay &amp; repair evidence queue</h3>
      <p>Prepare a fictional reproduction baseline, draft a repair plan, and request a manual retest for a QL-211 trial finding.</p></div>
      <button type="button" aria-expanded={showHelp} aria-controls="ql212-help" onClick={() => setShowHelp((value) => !value)}>ⓘ Queue help</button>
    </header>
    <p className="ql212-warning" role="note"><strong>ALL LIVE OPERATIONS HELD.</strong> This queue does not independently observe an owner, repair code, test a real provider, record formal closure, or turn a synthetic contract pass into resolution. The {portfolio.heldPrerequisites.length} QL-181 real-pilot prerequisites remain unverified. All entries are session-only and lost on reload. Use fictional descriptions only; no personal/customer data.</p>
    {showHelp && <div id="ql212-help" className="ql212-help" role="note">Create a repair draft only for a gap explicitly recorded in QL-211. Run the appropriate QL-210 mock policy checker (or receive a manual-required result for keyboard/mobile), describe a proposed fix, request a retest, then separately record an operator-reported retest result. Even a pass leaves the issue open for independent review. Editing the QL-211 source makes a queued draft stale; refreshing it discards the old local repair draft.</div>}
    <div className="ql212-metrics" role="status">
      <div><small>Reported gaps / blocked across four companies</small><strong>{portfolio.reportedFindings}</strong><span>From QL-211 session only</span></div>
      <div><small>Drafts queued for repair</small><strong>{portfolio.queued}</strong><span>{portfolio.stale} stale source drafts</span></div>
      <div><small>Live pilot prerequisites</small><strong className="ql212-held">{portfolio.heldPrerequisites.length} HELD</strong><span>No owner approval or dispatch</span></div>
    </div>
    <section className="ql212-portfolio" aria-labelledby="ql212-portfolio-title"><h4 id="ql212-portfolio-title">Four-company repair queue coverage</h4>
      <div className="ql212-table-scroll"><table><caption>Open issues remain open after synthetic replay or self-reported retest.</caption>
        <thead><tr><th scope="col">Company</th><th scope="col">Reported</th><th scope="col">Queued</th><th scope="col">Unqueued</th><th scope="col">Stale</th><th scope="col">Retest requested</th></tr></thead>
        <tbody>{portfolio.companies.map((row) => <tr key={row.organizationId}><th scope="row">{row.organizationId === 'rosiedazzlers' ? 'Rosie Dazzlers' : row.organizationId === 'devilndove' ? 'Devil n Dove' : row.organizationId === 'icamp' ? 'iCamp' : 'YW · Property Maintenance'}</th>
          <td>{row.observedFindings}</td><td>{row.queued}</td><td>{row.unqueued}</td><td>{row.stale}</td><td>{row.awaitingRetest}</td></tr>)}</tbody>
      </table></div>
    </section>
    <div className="ql212-grid">
      <section className="ql212-list" aria-labelledby="ql212-list-title"><h4 id="ql212-list-title">{organization.name} · Open trial findings ({company.items.length})</h4>
        {company.items.length === 0 ? <div className="ql212-empty"><p>No gap or blocked manual trial has been recorded for this company in this session. The queue is correctly empty; it does not fabricate real findings.</p>
          <button type="button" onClick={() => onNavigate('trial')}>Open QL-211 manual trial</button></div>
          : <div role="group" aria-label="Select reported finding">{company.items.map((candidate) => <button key={candidate.finding.id} type="button" className={candidate.finding.id === item?.finding.id ? 'ql212-item active' : 'ql212-item'} aria-pressed={candidate.finding.id === item?.finding.id} onClick={() => { setActiveId(candidate.finding.id); setConfirmRefresh(false); }}>
            <strong>{candidate.finding.title}</strong><span>{candidate.finding.priority} · {candidate.stale ? 'STALE · review source' : candidate.entry ? phaseLabels[candidate.entry.phase] : 'Not queued'}</span>
          </button>)}</div>}
      </section>
      {item && <section className="ql212-detail" aria-labelledby="ql212-detail-title"><h4 id="ql212-detail-title">{item.finding.title} · {item.finding.priority}</h4>
        <p>Reported as <strong>{item.finding.outcome === 'blocked' ? 'Blocked' : 'Observed gap'}</strong> · likely repair area: {item.finding.area}.</p>
        <p className="ql212-suggestion">Suggested action: {item.finding.nextAction}</p>
        <p>Replay target: <strong>{item.suggestedTest}</strong></p>
        {!entry && <button type="button" className="ql212-primary" onClick={() => apply((previous, id) => queueQl212Finding(trial, previous, organization.id, id))}>Add to repair evidence queue</button>}
        {item.stale && <div className="ql212-stale" role="alert"><strong>Source observation changed.</strong> The old replay/repair draft is no longer current; it cannot advance or be counted as verified evidence.
          <button type="button" aria-expanded={confirmRefresh} aria-controls="ql212-refresh" onClick={() => setConfirmRefresh((value) => !value)}>Refresh stale draft</button>
          {confirmRefresh && <div id="ql212-refresh"><p>Discard the previous local repair plan and replay history for this finding? No other company drafts change.</p>
            <button type="button" onClick={() => { apply((previous, id) => queueQl212Finding(trial, previous, organization.id, id)); setConfirmRefresh(false); }}>Confirm refresh</button>
            <button type="button" onClick={() => setConfirmRefresh(false)}>Cancel</button>
          </div>}</div>}
        {usableEntry && <>
          <p className="ql212-phase">Current preview phase: <strong>{phaseLabels[usableEntry.phase]}</strong>. <strong>Independent closure: HELD.</strong></p>
          <div className="ql212-replay"><h5>Synthetic replay record</h5>
            <button type="button" onClick={() => apply((previous, id) => replayQl212Finding(trial, previous, organization.id, id))}>Run safe replay check</button>
            {usableEntry.replays.length === 0 ? <p>No mock replay has been attempted. A replay is never proof that a visible issue was repaired.</p> :
              <ol>{usableEntry.replays.map((run) => <li key={run.sequence}>Run {run.sequence} · <strong>{run.disposition.replaceAll('_', ' ')}</strong> · {run.contractCheck ?? 'device/assistive-technology review'}</li>)}</ol>}
          </div>
          <div className="ql212-repair"><h5>Repair evidence draft</h5>
            <label htmlFor="ql212-repair-note">Proposed fictional fix or evidence reference (8–240 characters to request retest)</label>
            <textarea id="ql212-repair-note" rows={3} maxLength={240} value={usableEntry.repairNote}
              disabled={usableEntry.phase !== 'queued' && usableEntry.phase !== 'repair_draft'}
              onChange={(event) => apply((previous, id) => writeQl212RepairNote(trial, previous, organization.id, id, event.target.value))}
              placeholder="Example: Adjust the mock filter layout and rerun at 200% zoom. Do not enter real customer details." />
            <small>{usableEntry.repairNote.length}/240 · Draft only; no code fix, ticket or approval is created externally.</small>
            {(usableEntry.phase === 'queued' || usableEntry.phase === 'repair_draft') && <button type="button" disabled={usableEntry.repairNote.trim().length < 8 || usableEntry.replays.length === 0}
              onClick={() => apply((previous, id) => requestQl212Retest(trial, previous, organization.id, id))}>Request manual retest (preview)</button>}
          </div>
          {usableEntry.phase === 'retest_requested' && <div className="ql212-retest"><h5>Record unverified retest observation</h5>
            <p>Only after a person repeats the actual preview steps. Selecting a result does not close the finding.</p>
            <div className="ql212-actions"><button type="button" onClick={() => apply((previous, id) => recordQl212Retest(trial, previous, organization.id, id, 'retest_pass_noted'))}>Pass observed · unverified</button>
              <button type="button" onClick={() => apply((previous, id) => recordQl212Retest(trial, previous, organization.id, id, 'retest_fail_noted'))}>Still fails</button>
              <button type="button" onClick={() => apply((previous, id) => recordQl212Retest(trial, previous, organization.id, id, 'retest_blocked'))}>Retest blocked</button></div>
          </div>}
          {['retest_pass_noted','retest_fail_noted','retest_blocked'].includes(usableEntry.phase) && <p className="ql212-stale">Retest result is a local, unverified note. The original QL-211 gap remains open and requires independent repair/closure evidence.</p>}
        </>}
        <button type="button" className="ql212-back" onClick={() => onNavigate('trial')}>Review original QL-211 observation</button>
      </section>}
    </div>
    <section className="ql212-receipt" aria-labelledby="ql212-receipt-title"><h4 id="ql212-receipt-title">Safe session receipt</h4>
      <button type="button" aria-expanded={showReceipt} aria-controls="ql212-receipt-data" onClick={() => setShowReceipt((value) => !value)}>{showReceipt ? 'Hide' : 'Show'} PII-minimized queue receipt</button>
      {showReceipt && <div id="ql212-receipt-data"><p>Copy manually if needed; this summary excludes observation notes, repair text, signatures, names and independent approval claims.</p>
        <textarea aria-label="Fixture-only repair queue receipt" readOnly rows={11} value={ql212CompanyReceipt(trial, ledger, organization.id)} /></div>}
    </section>
    <p className="ql212-foot">QL-210 synthetic checks, QL-211 self-reported observations and QL-212 replay/repair drafts are separate evidence layers. None grants real owner approval, confirms a code repair, validates a telecom provider or lifts any live-pilot hold.</p>
  </section>;
}

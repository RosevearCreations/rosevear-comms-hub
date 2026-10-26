import { useState, type Dispatch, type SetStateAction } from 'react';
import type { OperatorOrganization, OperatorWorkspace } from './ql191Organizations';
import type { Ql211Ledger, Ql211ScenarioId } from './ql211OwnerTrial';
import type { Ql212Ledger } from './ql212RepairQueue';
import type { Ql213Ledger } from './ql213ReviewPreparation';
import type { Ql214Ledger } from './ql214ReviewIntake';
import type { Ql215Ledger } from './ql215FollowUpAudit';
import { QL216_RELEASE, beginQl216Replay, draftQl216Handoff, prepareQl216Handoff,
  ql216CompanyReplay, ql216CompanyReceipt, ql216Portfolio, type Ql216Disposition, type Ql216Ledger } from './ql216EscalationHandoff';
import './ql216-escalation-handoff.css';

const sources: Record<string, string> = {
  NO_PACKET: 'No review packet has been started', SOURCE_CURRENT: 'QL-215 snapshot matches',
  AUDIT_REVISED: 'FROZEN · QL-215 review changed', UPSTREAM_STALE: 'FROZEN · upstream evidence stale'
};

export function Ql216EscalationHandoffAudit({ organization, trial, repair, review, intake, audit, packets, setPackets, onNavigate }: {
  organization: OperatorOrganization;
  trial: Ql211Ledger;
  repair: Ql212Ledger;
  review: Ql213Ledger;
  intake: Ql214Ledger;
  audit: Ql215Ledger;
  packets: Ql216Ledger;
  setPackets: Dispatch<SetStateAction<Ql216Ledger>>;
  onNavigate: (workspace: OperatorWorkspace) => void;
}) {
  const [selected, setSelected] = useState<Ql211ScenarioId | null>(null);
  const [disposition, setDisposition] = useState<Ql216Disposition>('SOURCE_RECHECK_DRAFT');
  const [note, setNote] = useState('');
  const [showHelp, setShowHelp] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [confirmRefresh, setConfirmRefresh] = useState(false);
  const portfolio = ql216Portfolio(trial, repair, review, intake, audit, packets);
  const company = ql216CompanyReplay(trial, repair, review, intake, audit, packets, organization.id);
  const item = company.cases.find((entry) => entry.scenario === selected) ?? company.cases[0];

  function change(operation: (previous: Ql216Ledger, id: Ql211ScenarioId) => Ql216Ledger) {
    if (item) setPackets((previous) => operation(previous, item.scenario));
  }

  return <section className="ql216-workbench" aria-labelledby="ql216-title" data-ql216-release={QL216_RELEASE} data-organization={organization.id}>
    <header className="ql216-header"><div><p className="ql191-eyebrow">QL-216 · Local escalation review replay · Disabled preview</p>
      <h3 id="ql216-title">Four-company escalation replay &amp; owner-safe handoff packet audit</h3>
      <p>Reconcile current fictional QL-215 escalations, rehearse a packet, and inspect release holds without authorizing contact.</p></div>
      <button type="button" aria-expanded={showHelp} aria-controls="ql216-help" onClick={() => setShowHelp((open) => !open)}>ⓘ Replay help</button></header>
    <div className="ql216-warning" role="note"><strong>LIVE-PILOT HOLD REMAINS ACTIVE.</strong> A prepared packet is only a local fictional draft: no real owner consent, reviewer authentication, independent approval, messages, calls, provider actions, reminders or backend writes. All 12 QL-181 prerequisites remain HELD_UNVERIFIED. Use invented scenarios only.</div>
    {showHelp && <div id="ql216-help" className="ql216-help"><p>Prepare QL-214 handoff, start QL-215 review tracking, then record an escalation draft or age a gap into “escalation review due.” QL-216 can rehearse those explicit source-linked escalations. A later QL-215 cycle or draft update invalidates the old packet; reset requires confirmation. Nothing is sent to an actual owner or reviewer.</p></div>}
    <div className="ql216-metrics" role="status"><div><small>Escalation-ready cases</small><strong>{portfolio.eligible}</strong><span>Four-company source replay</span></div>
      <div><small>Local packets prepared</small><strong>{portfolio.prepared}</strong><span>No dispatch / no sign-off</span></div>
      <div><small>Stale packet baselines</small><strong>{portfolio.stale}</strong><span>Requires source recheck</span></div>
      <div><small>Real-pilot prerequisites</small><strong className="ql216-held">12 HELD</strong><span>Conditional release BLOCKED</span></div></div>
    <section className="ql216-panel" aria-labelledby="ql216-company-title"><h4 id="ql216-company-title">Four-company escalation &amp; packet comparison</h4>
      <div className="ql216-scroll"><table><caption>Session-only fictional review states. Switching companies never changes another company’s packet.</caption>
        <thead><tr><th scope="col">Company</th><th scope="col">Ready</th><th scope="col">Gap escalations due</th><th scope="col">Prepared</th><th scope="col">Stale</th><th scope="col">Release status</th></tr></thead>
        <tbody>{portfolio.companies.map((row) => <tr key={row.company}><th scope="row">{row.company === 'rosiedazzlers' ? 'Rosie Dazzlers' : row.company === 'devilndove' ? 'Devil n Dove' : row.company === 'icamp' ? 'iCamp' : 'YW · Property Maintenance'}</th>
          <td>{row.eligible}</td><td>{row.reviewDue}</td><td>{row.prepared}</td><td>{row.stale}</td><td>12 HELD</td></tr>)}</tbody></table></div>
    </section>
    <div className="ql216-grid"><section className="ql216-panel" aria-labelledby="ql216-cases-title"><h4 id="ql216-cases-title">{organization.name} · Source-linked findings</h4>
      {company.cases.length === 0 ? <p>No QL-211 observed finding has been entered in this browser session. No review, evidence or packet is assumed. <button type="button" onClick={() => onNavigate('trial')}>Open owner trial</button></p> :
        <div role="group" aria-label="Choose escalation case">{company.cases.map((candidate) => <button type="button" key={candidate.scenario}
          aria-pressed={candidate.scenario === item?.scenario} className={candidate.scenario === item?.scenario ? 'ql216-case active' : 'ql216-case'}
          onClick={() => { setSelected(candidate.scenario); setConfirmRefresh(false); setNote(''); }}>
          <strong>{candidate.title}</strong><span>{candidate.priority} · {candidate.eligible ? 'Escalation source available' : 'Source not yet eligible'} · {sources[candidate.sourceStatus]}</span></button>)}</div>}
      {company.orphaned > 0 && <p className="ql216-warning" role="alert">{company.orphaned} withdrawn upstream case(s) have stale local packet records. Withdrawal is not closure.</p>}
    </section>
    {item && <section className="ql216-panel" aria-labelledby="ql216-detail-title"><h4 id="ql216-detail-title">{item.title} · Escalation replay</h4>
      <p className="ql216-source">QL-215 source: <strong>{item.upstreamSourceStatus.replaceAll('_', ' ')}</strong> · QL-216 packet: <strong>{sources[item.sourceStatus]}</strong></p>
      <p>Simulated review cycle <strong>{item.cycle}</strong> · <strong>{item.replayDue}</strong> gap(s) escalation-due · <strong>{item.escalationDrafts}</strong> escalation draft(s).</p>
      <div className="ql216-gap-list" aria-label="Open gap replay">
        {item.gaps.map((gap) => <article key={gap.category}><strong>{gap.category.replaceAll('_', ' ')} · {gap.priority}</strong>
          <p>Age: {gap.ageBand.replaceAll('_', ' ')} · follow-up: {gap.action.replaceAll('_', ' ')}. <strong>Unverified / still open.</strong></p></article>)}
      </div>
      {!item.eligible && <div className="ql216-warning">A current QL-215 escalation is required before beginning this local packet. The upstream review is {item.sourceStatus === 'UPSTREAM_STALE' ? 'stale' : 'not yet escalation-ready'}.
        <button type="button" onClick={() => onNavigate('audit')}>Return to QL-215 aging audit</button></div>}
      {item.eligible && !item.packet && <button type="button" className="ql216-primary" onClick={() => change((previous, id) => beginQl216Replay(trial, repair, review, intake, audit, previous, organization.id, id))}>Begin fictional escalation replay</button>}
      {item.packet && item.sourceStatus !== 'SOURCE_CURRENT' && <div className="ql216-warning" role="alert"><strong>Packet frozen.</strong> Its upstream QL-215 status or simulated cycle changed; the previous draft cannot be represented as current evidence.
        {item.eligible && <><button type="button" aria-expanded={confirmRefresh} aria-controls="ql216-refresh" onClick={() => setConfirmRefresh((open) => !open)}>Review resetting stale packet</button>
          {confirmRefresh && <div id="ql216-refresh"><p>Discard only this fictional packet’s disposition and notes? Other companies remain untouched.</p>
            <button type="button" onClick={() => { change((previous, id) => beginQl216Replay(trial, repair, review, intake, audit, previous, organization.id, id)); setConfirmRefresh(false); setNote(''); }}>Confirm new source baseline</button>
            <button type="button" onClick={() => setConfirmRefresh(false)}>Cancel</button></div>}</>}
      </div>}
      {item.packet && item.sourceStatus === 'SOURCE_CURRENT' && <section className="ql216-local-packet" aria-labelledby="ql216-packet-title"><h5 id="ql216-packet-title">Owner-safe local packet</h5>
        <p>Phase: <strong>{item.packet.phase.replaceAll('_', ' ')}</strong>. This cannot be sent and is not independent review.</p>
        {item.packet.phase === 'review_draft' ? <div className="ql216-form">
          <label htmlFor="ql216-disposition">Fictional escalation replay disposition</label>
          <select id="ql216-disposition" value={disposition} onChange={(event) => setDisposition(event.target.value as Ql216Disposition)}>
            <option value="SOURCE_RECHECK_DRAFT">Draft source recheck</option><option value="OWNER_ESCALATION_DRAFT">Draft owner escalation</option><option value="INDEPENDENT_REVIEW_PACKET_DRAFT">Draft independent-review packet</option></select>
          <label htmlFor="ql216-note">Fictional owner handoff note (8–180 characters)</label>
          <textarea id="ql216-note" rows={3} maxLength={180} value={note} onChange={(event) => setNote(event.target.value)}
            placeholder="Describe an invented review need; do not enter real names or customer data." />
          <button type="button" disabled={note.trim().length < 8} onClick={() => { change((previous, id) => draftQl216Handoff(trial, repair, review, intake, audit, previous, organization.id, id, disposition, note)); setNote(''); }}>Save fictional disposition · NO DISPATCH</button>
          {item.packet.disposition !== 'NOT_SELECTED' && <><p>Saved category: <strong>{item.packet.disposition.replaceAll('_', ' ')}</strong>. Draft text remains in this browser session.</p>
            <button type="button" onClick={() => change((previous, id) => prepareQl216Handoff(trial, repair, review, intake, audit, previous, organization.id, id))}>Prepare local handoff packet · NO DISPATCH</button></>}
        </div> : <p className="ql216-ready" role="status">Locally prepared packet available for owner inspection only. Actual review, delivery, approval, and release remain unverified and blocked.</p>}
      </section>}
      <div className="ql216-actions"><button type="button" onClick={() => onNavigate('audit')}>Inspect QL-215 source</button>
        <button type="button" onClick={() => onNavigate('intake')}>Inspect QL-214 gaps</button></div>
    </section>}</div>
    <section className="ql216-panel" aria-labelledby="ql216-hold-title"><h4 id="ql216-hold-title">Immutable live-pilot hold audit</h4>
      <p>Read-only QL-181 prerequisites: <strong>{portfolio.prerequisites.length}</strong> expected, <strong>{company.held}</strong> HELD_UNVERIFIED. Conditional release remains <strong>BLOCKED</strong>.</p>
      <div className="ql216-scroll"><table><thead><tr><th scope="col">Gate</th><th scope="col">Required verification</th><th scope="col">Status</th></tr></thead>
        <tbody>{portfolio.prerequisites.map((hold) => <tr key={hold.id}><th scope="row">{hold.title}</th><td>{hold.requiredBeforePilot}</td><td>HELD_UNVERIFIED</td></tr>)}</tbody></table></div>
    </section>
    <section className="ql216-panel" aria-labelledby="ql216-receipt-title"><h4 id="ql216-receipt-title">PII-minimized replay &amp; packet audit receipt</h4>
      <button type="button" aria-expanded={showReceipt} aria-controls="ql216-receipt" onClick={() => setShowReceipt((open) => !open)}>{showReceipt ? 'Hide' : 'Show'} fixed-schema local audit receipt</button>
      {showReceipt && <div id="ql216-receipt"><p>For local inspection only. No owner text, reviewer identities, source fingerprints or customer details appear here.</p>
        <textarea aria-label="Fixture-only escalation handoff audit receipt" rows={14} readOnly value={ql216CompanyReceipt(trial, repair, review, intake, audit, packets, organization.id)} /></div>}
    </section>
    <p className="ql216-foot">QL-216 never creates real independent reviews, contacts a reviewer, signs off an owner decision, lifts a hold or activates a provider. GREEN software deployment is not live-pilot permission.</p>
  </section>;
}

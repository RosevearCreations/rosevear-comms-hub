import { useState, type Dispatch, type SetStateAction } from 'react';
import type { OperatorOrganization, OperatorWorkspace } from './ql191Organizations';
import type { Ql211ScenarioId } from './ql211OwnerTrial';
import type { Ql214GapCategory } from './ql214ReviewIntake';
import { QL235_RELEASE, QL235_CHECKS, beginQl235Renewal, recordQl235Renewal,
  advanceQl235Cycle, acknowledgeQl235Check, prepareQl235HeldAudit, ql235CompanyWatch,
  ql235CompanyReceipt, ql235Portfolio, type Ql235Sources, type Ql235Ledger,
  type Ql235Renewal, type Ql235Referral, type Ql235Hold } from './ql235RenewalWatch';
import './ql235-renewal-watch.css';

const statusLabels: Record<string, string> = {
  AWAITING_PREPARED_QL234: 'Awaiting a prepared fictional QL-234 source packet',
  SOURCE_CURRENT: 'Prepared QL-234 source and actual QL-181 holds unchanged',
  UPSTREAM_STALE: 'FROZEN · upstream QL-234 packet no longer prepared',
  QL234_EVIDENCE_REVISED: 'FROZEN · prepared QL-234 source revised',
  ACTUAL_HOLD_REVISED: 'FROZEN · actual QL-181 hold snapshot changed'
};

export function Ql235RenewalWatchAudit({ organization, sources, ledger, setLedger, onNavigate }: {
  organization: OperatorOrganization; sources: Ql235Sources; ledger: Ql235Ledger;
  setLedger: Dispatch<SetStateAction<Ql235Ledger>>;
  onNavigate: (workspace: OperatorWorkspace) => void;
}) {
  const [selected, setSelected] = useState<Ql211ScenarioId | null>(null);
  const [category, setCategory] = useState<Ql214GapCategory | ''>('');
  const [renewal, setRenewal] = useState<Ql235Renewal>('RENEWAL_EVIDENCE_PENDING_UNVERIFIED');
  const [referral, setReferral] = useState<Ql235Referral>('MAINTAIN_HELD_RENEWAL_WATCH_DRAFT');
  const [hold, setHold] = useState<Ql235Hold>('HOLD_RECHECK_PENDING_UNVERIFIED');
  const [note, setNote] = useState('');
  const [resetOpen, setResetOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [receiptOpen, setReceiptOpen] = useState(false);
  const portfolio = ql235Portfolio(sources, ledger);
  const company = ql235CompanyWatch(sources, ledger, organization.id);
  const item = company.cases.find((entry) => entry.scenario === selected) ?? company.cases[0];
  const selectedCategory = item?.gaps.some((gap) => gap.category === category) ? category : item?.gaps[0]?.category;
  const selectedGap = item?.gaps.find((gap) => gap.category === selectedCategory);
  const change = (operation: (previous: Ql235Ledger, scenario: Ql211ScenarioId) => Ql235Ledger) => {
    if (item) setLedger((previous) => operation(previous, item.scenario));
  };
  return <section className="ql218-workbench ql235-workbench" data-ql235-release={QL235_RELEASE} data-organization={organization.id} aria-labelledby="ql235-title">
    <header className="ql218-header"><div><p className="ql191-eyebrow">QL-235 · Reopened evidence drift &amp; independent renewal · Disabled preview</p>
      <h3 id="ql235-title">Four-company source renewal aging &amp; held release watch</h3>
      <p>Reopen fictional source exceptions, age independent renewal drafts and reconcile unchanged pilot holds.</p></div>
      <button type="button" aria-expanded={helpOpen} aria-controls="ql235-help" onClick={() => setHelpOpen((open) => !open)}>ⓘ Renewal watch help</button></header>
    <div className="ql218-warning" role="note"><strong>NO LIVE PILOT AUTHORIZATION.</strong> The twelve actual QL-181 gates remain HELD_UNVERIFIED. All renewal findings are fictional, unsent and session-only; no calls, SMS, provider dispatch or database writes.</div>
    {helpOpen && <p id="ql235-help" className="ql218-help">Start with a prepared, current QL-234 source-drift packet. A revised upstream packet or actual hold snapshot freezes QL-235, requiring an explicit case-only reset. Reopened fictional exceptions and held-proof discrepancies block local audit preparation. Simulated cycle 2 is due soon; cycle 3 is overdue and must be renewed with a fresh independent referral draft. Reopenings count once per gap per cycle and past overdue episodes remain recorded. Every change clears check acknowledgements. Even a prepared local packet never approves live release.</p>}
    <div className="ql218-metrics" role="status">
      <div><small>Eligible / tracking</small><strong>{portfolio.eligible} / {portfolio.tracking}</strong><span>Four independent company scopes</span></div>
      <div><small>Reopened / history</small><strong>{portfolio.reopened} / {portfolio.reopenEvents}</strong><span>Fictional evidence events</span></div>
      <div><small>Due soon / overdue</small><strong>{portfolio.dueSoon} / {portfolio.overdue}</strong><span>Simulated cycles only</span></div>
      <div><small>Prepared / stale</small><strong>{portfolio.prepared} / {portfolio.stale}</strong><span>Local unverified packets</span></div>
    </div>
    <section className="ql218-panel" aria-labelledby="ql235-matrix"><h4 id="ql235-matrix">Four-company independent renewal &amp; conditional hold matrix</h4>
      <div className="ql218-scroll"><table><caption>Fictional renewal watch; actual conditional release remains blocked.</caption><thead><tr>
        <th scope="col">Company</th><th scope="col">Eligible</th><th scope="col">Tracking</th><th scope="col">Unreviewed</th>
        <th scope="col">Reopened</th><th scope="col">Past reopenings</th><th scope="col">Due soon</th><th scope="col">Overdue</th>
        <th scope="col">Past overdue</th><th scope="col">Renewals missing</th><th scope="col">Hold exceptions</th>
        <th scope="col">Prepared</th><th scope="col">Stale</th><th scope="col">Actual holds</th></tr></thead>
        <tbody>{portfolio.companies.map((row) => <tr key={row.company}><th scope="row">{row.company === 'rosiedazzlers' ? 'Rosie Dazzlers' : row.company === 'devilndove' ? 'Devil n Dove' : row.company === 'icamp' ? 'iCamp' : 'YW · Property Maintenance'}</th>
          <td>{row.eligible}</td><td>{row.tracking}</td><td>{row.unreviewed}</td><td>{row.reopened}</td>
          <td>{row.reopenEvents}</td><td>{row.dueSoon}</td><td>{row.overdue}</td><td>{row.overdueEpisodes}</td>
          <td>{row.missingRenewals}</td><td>{row.holdExceptions}</td><td>{row.prepared}</td><td>{row.stale}</td>
          <td>{row.holdAudit.held}/12 HELD</td></tr>)}</tbody></table></div>
    </section>
    <div className="ql218-grid"><section className="ql218-panel" aria-labelledby="ql235-cases"><h4 id="ql235-cases">{organization.name} · Fictional renewal cases</h4>
      {company.cases.length === 0 ? <p>No fictional case exists. <button type="button" onClick={() => onNavigate('trial')}>Open owner trial</button></p> :
        <div role="group" aria-label="Select renewal watch case">{company.cases.map((candidate) => <button key={candidate.scenario} type="button"
          className={item?.scenario === candidate.scenario ? 'ql218-case active' : 'ql218-case'} aria-pressed={item?.scenario === candidate.scenario}
          onClick={() => { setSelected(candidate.scenario); setCategory(''); setNote(''); setResetOpen(false); }}>
          <strong>{candidate.title}</strong><span>{candidate.priority} · {statusLabels[candidate.sourceStatus]} · {candidate.reopenEvents} previous reopenings</span></button>)}</div>}
      {company.orphaned > 0 && <p className="ql218-warning" role="alert">{company.orphaned} orphaned fictional cases remain held.</p>}
    </section>
    {item && <section className="ql218-panel" aria-labelledby="ql235-selected"><h4 id="ql235-selected">{item.title} · Independent renewal follow-up</h4>
      <p className="ql218-source">Source <strong>{statusLabels[item.sourceStatus]}</strong> · QL-234 prepared <strong>{item.eligible ? 'yes' : 'no'}</strong>.</p>
      {!item.eligible && <div className="ql218-warning">A current prepared QL-234 local packet is required. <button type="button" onClick={() => onNavigate('source_drift')}>Inspect QL-234 source</button></div>}
      {item.eligible && !item.record && <button type="button" onClick={() => change((previous, id) => beginQl235Renewal(sources, previous, organization.id, id))}>Begin fictional renewal watch &amp; held recheck</button>}
      {item.record && item.sourceStatus !== 'SOURCE_CURRENT' && <div className="ql218-warning" role="alert"><p>Frozen: the QL-234 evidence packet or held-release snapshot changed. Existing local findings cannot be reused.</p>
        <button type="button" aria-expanded={resetOpen} onClick={() => setResetOpen(true)}>Review case-only renewal reset</button>
        {resetOpen && <div><p>Only this fictional scenario will reset; other companies remain unchanged.</p>
          <button type="button" disabled={!item.eligible} onClick={() => { change((previous, id) => beginQl235Renewal(sources, previous, organization.id, id)); setResetOpen(false); setNote(''); }}>Confirm case-only renewal reset</button>
          <button type="button" onClick={() => setResetOpen(false)}>Cancel reset</button></div>}</div>}
      {item.record && item.sourceStatus === 'SOURCE_CURRENT' && <>
        <p className="ql222-cycle" role="status">Simulated cycle <strong>{item.record.cycle}/12</strong> · Unreviewed <strong>{item.unreviewed}</strong> · Due soon <strong>{item.dueSoon}</strong> · Overdue <strong>{item.overdue}</strong> · Missing independent renewals <strong>{item.missingRenewals}</strong>.</p>
        <section aria-labelledby="ql235-gaps"><h5 id="ql235-gaps">Renewal evidence gaps ({item.gaps.length})</h5>
          {item.gaps.map((gap) => <article className="ql218-gap" key={gap.category}><h6>{gap.category.replaceAll('_', ' ')} · {gap.priority}</h6>
            <p>QL-234 drift history <strong>{gap.driftEvents}</strong> · Renewal <strong>{gap.renewal.replaceAll('_', ' ')}</strong> · Referral <strong>{gap.referral.replaceAll('_', ' ')}</strong>.</p>
            <p>Held-proof recheck <strong>{gap.hold.replaceAll('_', ' ')}</strong> · Age <strong>{gap.age === null ? 'NOT TRACKED' : `${gap.age} cycle(s)`}</strong>.</p>
            {gap.dueSoon && <p className="ql223-approaching">Independent renewal is due soon.</p>}
            {gap.overdue && <p className="ql219-due">Overdue renewal requires a fresh independent draft referral.</p>}
            {gap.missingIndependentRenewal && <p className="ql219-due">Historical or reopened risk requires a separate independent renewal.</p>}
            {gap.renewal === 'SIMULATED_DRIFT_EXCEPTION_REOPENED_UNVERIFIED' && <p className="ql219-due">Reopened fictional drift blocks packet preparation.</p>}
            {(gap.inheritedHoldGap || gap.hold === 'HELD_PROOF_EXCEPTION_UNVERIFIED') && <p className="ql219-due">Unresolved held-proof exception blocks the local packet.</p>}
            <p>Historical reopenings <strong>{gap.reopenEvents}</strong> · Historical overdue <strong>{gap.overdueEpisodes}</strong> · Actual release <strong>BLOCKED</strong>.</p></article>)}
        </section>
        {item.record.phase === 'independent_renewal_watch_draft' ? <>
          <div className="ql218-form"><label htmlFor="ql235-gap">Fictional gap category</label>
            <select id="ql235-gap" value={selectedCategory ?? ''} onChange={(event) => { setCategory(event.target.value as Ql214GapCategory); setNote(''); }}>
              {item.gaps.map((gap) => <option key={gap.category} value={gap.category}>{gap.category.replaceAll('_', ' ')} · {gap.reopenEvents} reopenings</option>)}</select>
            <label htmlFor="ql235-renewal">Evidence renewal · UNVERIFIED</label>
            <select id="ql235-renewal" value={renewal} onChange={(event) => setRenewal(event.target.value as Ql235Renewal)}>
              <option value="RENEWAL_EVIDENCE_PENDING_UNVERIFIED">Renewal pending · UNVERIFIED</option>
              <option value="SIMULATED_RENEWAL_MATCH_UNVERIFIED">Fictional evidence renewed · UNVERIFIED</option>
              <option value="SIMULATED_DRIFT_EXCEPTION_REOPENED_UNVERIFIED">Fictional drift reopened · UNVERIFIED</option></select>
            <label htmlFor="ql235-referral">Independent follow-up · UNSENT</label>
            <select id="ql235-referral" value={referral} onChange={(event) => setReferral(event.target.value as Ql235Referral)}>
              <option value="MAINTAIN_HELD_RENEWAL_WATCH_DRAFT">Maintain held watch · draft</option>
              <option value="REFER_INDEPENDENT_RENEWAL_DRAFT">Refer independent renewal · unsent</option>
              <option value="REOPEN_INDEPENDENT_EXCEPTION_DRAFT">Reopen independent exception · unsent</option></select>
            <label htmlFor="ql235-hold">Held-release proof · UNVERIFIED</label>
            <select id="ql235-hold" value={hold} onChange={(event) => setHold(event.target.value as Ql235Hold)}>
              <option value="HOLD_RECHECK_PENDING_UNVERIFIED">Held proof pending · UNVERIFIED</option>
              <option value="SIMULATED_HELD_PROOF_MATCH_UNVERIFIED">Fictional held proof matches · UNVERIFIED</option>
              <option value="HELD_PROOF_EXCEPTION_UNVERIFIED">Fictional held proof exception · UNVERIFIED</option></select>
            <label htmlFor="ql235-note">Fictional renewal note (8–180 characters)</label>
            <textarea id="ql235-note" rows={3} maxLength={180} value={note} onChange={(event) => setNote(event.target.value)} placeholder="Synthetic scenarios only; no real customer or reviewer details." />
            <button type="button" disabled={!selectedCategory || note.trim().length < 8 ||
              (!!selectedGap?.overdue && referral !== 'REFER_INDEPENDENT_RENEWAL_DRAFT') ||
              ((renewal === 'SIMULATED_DRIFT_EXCEPTION_REOPENED_UNVERIFIED' || hold === 'HELD_PROOF_EXCEPTION_UNVERIFIED') && referral === 'MAINTAIN_HELD_RENEWAL_WATCH_DRAFT')}
              onClick={() => { if (selectedCategory) change((previous, id) => recordQl235Renewal(sources, previous, organization.id, id, selectedCategory, renewal, referral, hold, note)); setNote(''); }}>Record fictional renewal &amp; held proof · UNSENT</button>
            <button type="button" disabled={item.record.cycle >= 12} onClick={() => change((previous, id) => advanceQl235Cycle(sources, previous, organization.id, id))}>Advance synthetic renewal cycle (+1)</button>
            <small>Two cycles due soon, three overdue; all real release holds remain unchanged.</small></div>
          <section className="ql219-checklist" aria-labelledby="ql235-checks"><h5 id="ql235-checks">Independent renewal and held-release checks · UNVERIFIED</h5>
            {QL235_CHECKS.map((check) => <article key={check.id} className="ql219-check"><div><strong>{check.title}</strong><p>{check.detail}</p></div>
              <button type="button" disabled={item.record?.checks[check.id] === 'ACKNOWLEDGED_UNVERIFIED'} onClick={() => change((previous, id) => acknowledgeQl235Check(sources, previous, organization.id, id, check.id))}>
                {item.record?.checks[check.id] === 'ACKNOWLEDGED_UNVERIFIED' ? 'Reviewed locally · UNVERIFIED' : 'Acknowledge renewal check · UNVERIFIED'}</button></article>)}
          </section>
          <button type="button" disabled={!item.ready} onClick={() => change((previous, id) => prepareQl235HeldAudit(sources, previous, organization.id, id))}>Prepare independent renewal &amp; held audit · NO RELEASE</button>
        </> : <p className="ql218-prepared" role="status">QL-235 fictional renewal packet prepared locally. No actual independent review or live-pilot release.</p>}
      </>}
      <div className="ql218-actions"><button type="button" onClick={() => onNavigate('source_drift')}>Inspect QL-234 source</button>
        <button type="button" onClick={() => onNavigate('held_integrity')}>Inspect QL-233 held integrity</button></div>
    </section>}</div>
    <section className="ql218-panel" aria-labelledby="ql235-holds"><h4 id="ql235-holds">QL-181 actual pilot prerequisites · read-only</h4>
      <p>Expected <strong>{company.holdAudit.expected}</strong> · Held <strong>{company.holdAudit.held}</strong> · Conditional release <strong>BLOCKED</strong>.</p>
      <div className="ql218-scroll"><table><thead><tr><th scope="col">Release prerequisite</th><th scope="col">Required before pilot</th><th scope="col">Actual hold</th></tr></thead>
        <tbody>{portfolio.prerequisites.map((entry) => <tr key={entry.id}><th scope="row">{entry.title}</th><td>{entry.requiredBeforePilot}</td><td>{entry.state}</td></tr>)}</tbody></table></div>
    </section>
    <section className="ql218-panel" aria-labelledby="ql235-receipt"><h4 id="ql235-receipt">Privacy-minimized renewal and hold receipt</h4>
      <button type="button" aria-expanded={receiptOpen} aria-controls="ql235-receipt-data" onClick={() => setReceiptOpen((open) => !open)}>{receiptOpen ? 'Hide' : 'Show'} local QL-235 renewal receipt</button>
      {receiptOpen && <div id="ql235-receipt-data"><p>Status only: no notes, identities or local revision fingerprints.</p>
        <textarea readOnly rows={15} aria-label="Fixture-only QL-235 renewal receipt" value={ql235CompanyReceipt(sources, ledger, organization.id)} /></div>}
    </section>
    <p className="ql218-foot">Software deployment status is separate from real pilot approval. Calling, SMS, connector dispatch and actual QL-181 hold clearance remain disabled.</p>
  </section>;
}

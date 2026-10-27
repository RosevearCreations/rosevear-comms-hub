import { useState, type Dispatch, type SetStateAction } from 'react';
import type { OperatorOrganization, OperatorWorkspace } from './ql191Organizations';
import type { Ql211ScenarioId } from './ql211OwnerTrial';
import type { Ql214GapCategory } from './ql214ReviewIntake';
import { QL236_RELEASE, QL236_CHECKS, beginQl236Receipt, recordQl236Receipt,
  advanceQl236Cycle, acknowledgeQl236Check, prepareQl236HeldReceipt,
  ql236CompanyReceipts, ql236CompanyReceipt, ql236Portfolio,
  type Ql236Sources, type Ql236Ledger, type Ql236Receipt,
  type Ql236Handoff, type Ql236Hold } from './ql236ReceiptHandoff';
import './ql236-receipt-handoff.css';

const sourceLabels: Record<string, string> = {
  AWAITING_PREPARED_QL235: 'Awaiting a prepared fictional QL-235 renewal packet',
  SOURCE_CURRENT: 'Prepared QL-235 receipt source and QL-181 holds unchanged',
  UPSTREAM_STALE: 'FROZEN · upstream QL-235 renewal packet no longer prepared',
  QL235_RECEIPT_SOURCE_REVISED: 'FROZEN · prepared QL-235 evidence source revised',
  ACTUAL_HOLD_REVISED: 'FROZEN · actual QL-181 hold snapshot changed'
};

export function Ql236ReceiptHandoffAudit({ organization, sources, ledger, setLedger, onNavigate }: {
  organization: OperatorOrganization; sources: Ql236Sources; ledger: Ql236Ledger;
  setLedger: Dispatch<SetStateAction<Ql236Ledger>>; onNavigate: (workspace: OperatorWorkspace) => void;
}) {
  const [selected, setSelected] = useState<Ql211ScenarioId | null>(null);
  const [category, setCategory] = useState<Ql214GapCategory | ''>('');
  const [receipt, setReceipt] = useState<Ql236Receipt>('INDEPENDENT_RECEIPT_PENDING_UNVERIFIED');
  const [handoff, setHandoff] = useState<Ql236Handoff>('CONTINUE_UNSENT_HELD_FOLLOWUP_DRAFT');
  const [hold, setHold] = useState<Ql236Hold>('CONDITIONAL_PROOF_PENDING_UNVERIFIED');
  const [note, setNote] = useState('');
  const [helpOpen, setHelpOpen] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [receiptOpen, setReceiptOpen] = useState(false);
  const portfolio = ql236Portfolio(sources, ledger);
  const company = ql236CompanyReceipts(sources, ledger, organization.id);
  const item = company.cases.find((entry) => entry.scenario === selected) ?? company.cases[0];
  const selectedCategory = item?.gaps.some((gap) => gap.category === category) ? category : item?.gaps[0]?.category;
  const selectedGap = item?.gaps.find((gap) => gap.category === selectedCategory);
  const change = (operation: (previous: Ql236Ledger, scenario: Ql211ScenarioId) => Ql236Ledger) => {
    if (item) setLedger((previous) => operation(previous, item.scenario));
  };
  return <section className="ql218-workbench ql236-workbench" data-ql236-release={QL236_RELEASE} data-organization={organization.id} aria-labelledby="ql236-title">
    <header className="ql218-header"><div><p className="ql191-eyebrow">QL-236 · Independent receipt handoff &amp; aging · Disabled preview</p>
      <h3 id="ql236-title">Four-company renewal receipt &amp; conditional hold continuity</h3>
      <p>Compare fictional handoff receipts, rehearse overdue independent follow-up and preserve held-pilot proof.</p></div>
      <button type="button" aria-expanded={helpOpen} aria-controls="ql236-help" onClick={() => setHelpOpen((open) => !open)}>ⓘ Receipt handoff help</button></header>
    <div className="ql218-warning" role="note"><strong>NO ACTUAL RECEIPT VERIFICATION OR LIVE PILOT RELEASE.</strong> All 12 QL-181 gates remain HELD_UNVERIFIED. Findings are fictional, unsent and session-only; no calls, SMS, provider dispatch, approval or database writes.</div>
    {helpOpen && <p id="ql236-help" className="ql218-help">Begin with a prepared QL-235 fictional renewal packet. A revised source or changed actual pilot hold freezes the QL-236 case until an explicit case-only reset. For each gap, record an unverified receipt, unsent independent handoff and held-proof recheck. Open receipt exceptions, pending evidence, inherited held-proof gaps and missing independent follow-up block local packet preparation. Receipt age reaches due-soon at two simulated cycles and overdue at three; overdue follow-up requires a fresh independent referral draft. Exception events count once per gap per cycle, while historical overdue episodes remain. Changes clear all local check acknowledgements. Prepared local packets never authorize live calling or messaging.</p>}
    <div className="ql218-metrics" role="status">
      <div><small>Eligible / tracking</small><strong>{portfolio.eligible} / {portfolio.tracking}</strong><span>Four company scopes</span></div>
      <div><small>Open / historical exceptions</small><strong>{portfolio.openExceptions} / {portfolio.exceptionEvents}</strong><span>Fictional receipt history</span></div>
      <div><small>Due soon / overdue</small><strong>{portfolio.dueSoon} / {portfolio.overdue}</strong><span>Simulated cycles</span></div>
      <div><small>Prepared / stale</small><strong>{portfolio.prepared} / {portfolio.stale}</strong><span>Local blocked-release packet</span></div>
    </div>
    <section className="ql218-panel" aria-labelledby="ql236-matrix"><h4 id="ql236-matrix">Four-company independent receipt continuity matrix</h4>
      <div className="ql218-scroll"><table><caption>Local fictional counts only; all real release holds remain in place.</caption>
        <thead><tr><th scope="col">Company</th><th scope="col">Eligible</th><th scope="col">Tracking</th>
          <th scope="col">Unreviewed</th><th scope="col">Open exceptions</th><th scope="col">Exception history</th>
          <th scope="col">Due soon</th><th scope="col">Overdue</th><th scope="col">Historical overdue</th>
          <th scope="col">Missing independent receipts</th><th scope="col">Hold exceptions</th>
          <th scope="col">Prepared</th><th scope="col">Stale</th><th scope="col">Actual holds</th></tr></thead>
        <tbody>{portfolio.companies.map((row) => <tr key={row.company}><th scope="row">{row.company === 'rosiedazzlers' ? 'Rosie Dazzlers' : row.company === 'devilndove' ? 'Devil n Dove' : row.company === 'icamp' ? 'iCamp' : 'YW · Property Maintenance'}</th>
          <td>{row.eligible}</td><td>{row.tracking}</td><td>{row.unreviewed}</td><td>{row.openExceptions}</td>
          <td>{row.exceptionEvents}</td><td>{row.dueSoon}</td><td>{row.overdue}</td><td>{row.overdueEpisodes}</td>
          <td>{row.missingReceipts}</td><td>{row.holdExceptions}</td><td>{row.prepared}</td><td>{row.stale}</td>
          <td>{row.holdAudit.held}/12 HELD</td></tr>)}</tbody></table></div>
    </section>
    <div className="ql218-grid"><section className="ql218-panel" aria-labelledby="ql236-cases"><h4 id="ql236-cases">{organization.name} · Independent handoff cases</h4>
      {company.cases.length === 0 ? <p>No fictional case exists. <button type="button" onClick={() => onNavigate('trial')}>Open owner trial</button></p> :
        <div role="group" aria-label="Select independent receipt case">{company.cases.map((candidate) => <button key={candidate.scenario} type="button"
          className={item?.scenario === candidate.scenario ? 'ql218-case active' : 'ql218-case'} aria-pressed={item?.scenario === candidate.scenario}
          onClick={() => { setSelected(candidate.scenario); setCategory(''); setNote(''); setResetOpen(false); }}>
          <strong>{candidate.title}</strong><span>{candidate.priority} · {sourceLabels[candidate.sourceStatus]} · {candidate.exceptionEvents} prior receipt exceptions</span></button>)}</div>}
      {company.orphaned > 0 && <p className="ql218-warning" role="alert">{company.orphaned} orphaned fictional cases remain held.</p>}
    </section>
    {item && <section className="ql218-panel" aria-labelledby="ql236-selected"><h4 id="ql236-selected">{item.title} · Independent renewal receipt</h4>
      <p className="ql218-source">Source <strong>{sourceLabels[item.sourceStatus]}</strong> · Prepared QL-235 <strong>{item.eligible ? 'yes' : 'no'}</strong>.</p>
      {!item.eligible && <div className="ql218-warning">A current prepared QL-235 renewal packet is required. <button type="button" onClick={() => onNavigate('renewal_watch')}>Inspect QL-235 source</button></div>}
      {item.eligible && !item.record && <button type="button" onClick={() => change((previous, id) => beginQl236Receipt(sources, previous, organization.id, id))}>Begin fictional receipt handoff &amp; hold watch</button>}
      {item.record && item.sourceStatus !== 'SOURCE_CURRENT' && <div className="ql218-warning" role="alert"><p>Frozen: prepared QL-235 evidence or the actual hold snapshot changed. Existing local findings cannot be reused.</p>
        <button type="button" aria-expanded={resetOpen} onClick={() => setResetOpen(true)}>Review case-only receipt reset</button>
        {resetOpen && <div><p>Only this fictional scenario resets; other companies remain unchanged.</p>
          <button type="button" disabled={!item.eligible} onClick={() => { change((previous, id) => beginQl236Receipt(sources, previous, organization.id, id)); setResetOpen(false); setNote(''); }}>Confirm case-only receipt reset</button>
          <button type="button" onClick={() => setResetOpen(false)}>Cancel reset</button></div>}</div>}
      {item.record && item.sourceStatus === 'SOURCE_CURRENT' && <>
        <p className="ql222-cycle" role="status">Simulated cycle <strong>{item.record.cycle}/12</strong> · Unreviewed <strong>{item.unreviewed}</strong> · Due soon <strong>{item.dueSoon}</strong> · Overdue <strong>{item.overdue}</strong> · Missing independent receipts <strong>{item.missingReceipts}</strong>.</p>
        <section aria-labelledby="ql236-gaps"><h5 id="ql236-gaps">Fictional independent receipt findings ({item.gaps.length})</h5>
          {item.gaps.map((gap) => <article className="ql218-gap" key={gap.category}><h6>{gap.category.replaceAll('_', ' ')} · {gap.priority}</h6>
            <p>QL-235 renewal <strong>{gap.renewal.replaceAll('_', ' ')}</strong> · Receipt <strong>{gap.receipt.replaceAll('_', ' ')}</strong>.</p>
            <p>Independent handoff <strong>{gap.handoff.replaceAll('_', ' ')}</strong> · Held proof <strong>{gap.hold.replaceAll('_', ' ')}</strong> · Age <strong>{gap.age === null ? 'NOT TRACKED' : `${gap.age} cycle(s)`}</strong>.</p>
            {gap.dueSoon && <p className="ql223-approaching">Independent receipt follow-up due soon.</p>}
            {gap.overdue && <p className="ql219-due">Overdue receipt requires a new unsent independent referral.</p>}
            {gap.missingIndependentReceipt && <p className="ql219-due">Inherited or recurring risk requires independent receipt follow-up.</p>}
            {gap.receipt === 'SIMULATED_RECEIPT_EXCEPTION_UNVERIFIED' && <p className="ql219-due">Open fictional receipt exception blocks packet preparation.</p>}
            {(gap.inheritedHoldGap || gap.hold === 'CONDITIONAL_PROOF_EXCEPTION_UNVERIFIED') && <p className="ql219-due">Held-proof exception blocks local audit preparation.</p>}
            <p>Receipt exception history <strong>{gap.exceptionEvents}</strong> · Prior overdue <strong>{gap.overdueEpisodes}</strong> · Real release <strong>BLOCKED</strong>.</p></article>)}
        </section>
        {item.record.phase === 'independent_receipt_handoff_draft' ? <>
          <div className="ql218-form"><label htmlFor="ql236-gap">Fictional evidence gap</label>
            <select id="ql236-gap" value={selectedCategory ?? ''} onChange={(event) => { setCategory(event.target.value as Ql214GapCategory); setNote(''); }}>
              {item.gaps.map((gap) => <option key={gap.category} value={gap.category}>{gap.category.replaceAll('_', ' ')} · {gap.exceptionEvents} exceptions</option>)}</select>
            <label htmlFor="ql236-receipt">Independent handoff receipt · UNVERIFIED</label>
            <select id="ql236-receipt" value={receipt} onChange={(event) => setReceipt(event.target.value as Ql236Receipt)}>
              <option value="INDEPENDENT_RECEIPT_PENDING_UNVERIFIED">Receipt pending · UNVERIFIED</option>
              <option value="SIMULATED_INDEPENDENT_RECEIPT_MATCH_UNVERIFIED">Fictional receipt matches · UNVERIFIED</option>
              <option value="SIMULATED_RECEIPT_EXCEPTION_UNVERIFIED">Fictional receipt exception · UNVERIFIED</option></select>
            <label htmlFor="ql236-handoff">Independent follow-up · UNSENT</label>
            <select id="ql236-handoff" value={handoff} onChange={(event) => setHandoff(event.target.value as Ql236Handoff)}>
              <option value="CONTINUE_UNSENT_HELD_FOLLOWUP_DRAFT">Continue held watch · draft</option>
              <option value="REFER_FRESH_INDEPENDENT_RECEIPT_DRAFT">Fresh independent receipt referral · unsent</option>
              <option value="REOPEN_INDEPENDENT_RECEIPT_EXCEPTION_DRAFT">Reopen receipt exception · unsent</option></select>
            <label htmlFor="ql236-hold">Conditional release proof · UNVERIFIED</label>
            <select id="ql236-hold" value={hold} onChange={(event) => setHold(event.target.value as Ql236Hold)}>
              <option value="CONDITIONAL_PROOF_PENDING_UNVERIFIED">Held proof pending · UNVERIFIED</option>
              <option value="SIMULATED_CONDITIONAL_PROOF_MATCH_UNVERIFIED">Fictional held proof matches · UNVERIFIED</option>
              <option value="CONDITIONAL_PROOF_EXCEPTION_UNVERIFIED">Fictional held-proof exception · UNVERIFIED</option></select>
            <label htmlFor="ql236-note">Fictional receipt note (8–180 characters)</label>
            <textarea id="ql236-note" rows={3} maxLength={180} value={note} onChange={(event) => setNote(event.target.value)} placeholder="Fictional scenario only; do not enter real customer or reviewer information." />
            <button type="button" disabled={!selectedCategory || note.trim().length < 8 ||
              (!!selectedGap?.overdue && handoff !== 'REFER_FRESH_INDEPENDENT_RECEIPT_DRAFT') ||
              ((receipt === 'SIMULATED_RECEIPT_EXCEPTION_UNVERIFIED' || hold === 'CONDITIONAL_PROOF_EXCEPTION_UNVERIFIED') && handoff === 'CONTINUE_UNSENT_HELD_FOLLOWUP_DRAFT')}
              onClick={() => { if (selectedCategory) change((previous, id) => recordQl236Receipt(sources, previous, organization.id, id, selectedCategory, receipt, handoff, hold, note)); setNote(''); }}>Record fictional independent receipt · UNSENT</button>
            <button type="button" disabled={item.record.cycle >= 12} onClick={() => change((previous, id) => advanceQl236Cycle(sources, previous, organization.id, id))}>Advance synthetic receipt cycle (+1)</button>
            <small>Two cycles due soon, three overdue. No real release state can change.</small></div>
          <section className="ql219-checklist" aria-labelledby="ql236-checks"><h5 id="ql236-checks">Independent receipt &amp; hold recheck · UNVERIFIED</h5>
            {QL236_CHECKS.map((check) => <article key={check.id} className="ql219-check"><div><strong>{check.title}</strong><p>{check.detail}</p></div>
              <button type="button" disabled={item.record?.checks[check.id] === 'ACKNOWLEDGED_UNVERIFIED'} onClick={() => change((previous, id) => acknowledgeQl236Check(sources, previous, organization.id, id, check.id))}>
                {item.record?.checks[check.id] === 'ACKNOWLEDGED_UNVERIFIED' ? 'Reviewed locally · UNVERIFIED' : 'Acknowledge receipt check · UNVERIFIED'}</button></article>)}
          </section>
          <button type="button" disabled={!item.ready} onClick={() => change((previous, id) => prepareQl236HeldReceipt(sources, previous, organization.id, id))}>Prepare conditional held receipt packet · NO RELEASE</button>
        </> : <p className="ql218-prepared" role="status">QL-236 fictional independent receipt packet prepared locally. Real independent verification and pilot release remain blocked.</p>}
      </>}
      <div className="ql218-actions"><button type="button" onClick={() => onNavigate('renewal_watch')}>Inspect QL-235 renewal source</button>
        <button type="button" onClick={() => onNavigate('source_drift')}>Inspect QL-234 source drift</button></div>
    </section>}</div>
    <section className="ql218-panel" aria-labelledby="ql236-holds"><h4 id="ql236-holds">Actual QL-181 pilot gate register · read-only</h4>
      <p>Expected <strong>{company.holdAudit.expected}</strong> · Held <strong>{company.holdAudit.held}</strong> · Conditional release <strong>BLOCKED</strong>.</p>
      <div className="ql218-scroll"><table><thead><tr><th scope="col">Prerequisite</th><th scope="col">Required before live pilot</th><th scope="col">Actual state</th></tr></thead>
        <tbody>{portfolio.prerequisites.map((entry) => <tr key={entry.id}><th scope="row">{entry.title}</th><td>{entry.requiredBeforePilot}</td><td>{entry.state}</td></tr>)}</tbody></table></div>
    </section>
    <section className="ql218-panel" aria-labelledby="ql236-receipt"><h4 id="ql236-receipt">Privacy-minimized independent receipt audit</h4>
      <button type="button" aria-expanded={receiptOpen} aria-controls="ql236-receipt-data" onClick={() => setReceiptOpen((open) => !open)}>{receiptOpen ? 'Hide' : 'Show'} local QL-236 handoff receipt</button>
      {receiptOpen && <div id="ql236-receipt-data"><p>Fictional status only; no notes, identities or revision fingerprints.</p>
        <textarea readOnly rows={15} aria-label="Fixture-only QL-236 handoff receipt" value={ql236CompanyReceipt(sources, ledger, organization.id)} /></div>}
    </section>
    <p className="ql218-foot">Production GREEN never authorizes real communications. Provider dispatch, calling, SMS, Supabase writes and actual QL-181 hold clearance remain disabled.</p>
  </section>;
}

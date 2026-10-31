import { useState } from 'react';
import { QL270_SOURCES, type Ql270SourceId } from './ql270ConnectionCentre';
import { QL275_OWNER_CHECKS } from './ql275OperatorWalkthrough';
import { ql276CaptureOwnerObservation, type Ql276OwnerEvidenceInput,
  type Ql276OwnerObservation } from './ql276EvidenceIntake';
import { ql277CompareAccessibility, type Ql277Comparison } from './ql277DriftReview';
import { QL278_CUSTODY_PRECONDITIONS, QL278_OBSERVED_AT, ql278CreateRetestTicket,
  ql278FollowupAging, ql278PinnedProofUrl, ql278PrepareCustodyPacket,
  ql278PrepareFollowup, ql278RecordRetest, ql278ReviewPacket,
  type Ql278CustodyPacket, type Ql278FollowupDraft, type Ql278RetestTicket } from './ql278FollowupDesk';
import './ql277-drift-review.css';
import './ql278-followup-desk.css';

type Topic = 'retest' | 'custody' | 'aging';
const initialObservation: Ql276OwnerEvidenceInput = {
  checkId: 'keyboard', outcome: 'issue', device: 'desktop', assistiveMethod: 'keyboard', note: ''
};

export function Ql278FollowupDesk({ onOpenEvidence }: { onOpenEvidence: () => void }) {
  const [topic, setTopic] = useState<Topic>('retest');
  const [observation, setObservation] = useState<Ql276OwnerEvidenceInput>(initialObservation);
  const [baseline, setBaseline] = useState<Ql276OwnerObservation | null>(null);
  const [comparison, setComparison] = useState<Ql277Comparison | null>(null);
  const [tickets, setTickets] = useState<Ql278RetestTicket[]>([]);
  const [source, setSource] = useState<Ql270SourceId>('rosiedazzlers');
  const [reference, setReference] = useState('');
  const [custody, setCustody] = useState<Ql278CustodyPacket[]>([]);
  const [followUps, setFollowUps] = useState<Ql278FollowupDraft[]>([]);
  const [asOf, setAsOf] = useState(() => new Date());
  const [feedback, setFeedback] = useState('No retest has been accepted, no original receipt verified and no notice sent.');
  const report = ql278FollowupAging(asOf);
  const packet = ql278ReviewPacket(tickets, custody, followUps, asOf);
  const ticket = tickets.find(item => item.checkId === observation.checkId);

  function captureBaseline() {
    const result = ql276CaptureOwnerObservation(observation, new Date());
    if (!result.ok) { setFeedback(result.reason); return; }
    setBaseline(result.record); setComparison(null);
    setTickets(old => old.filter(item => item.checkId !== result.record.checkId));
    setObservation(old => ({ ...old, note: '' }));
    setFeedback('New local baseline captured, not independently verified. Record a later observation on the same check.');
  }

  function compareAndQueue() {
    if (!baseline) { setFeedback('Record a real local baseline before comparing.'); return; }
    const result = ql276CaptureOwnerObservation(observation, new Date());
    if (!result.ok) { setFeedback(result.reason); return; }
    if (baseline.checkId !== result.record.checkId) { setFeedback('Baseline and recheck must use the same accessibility check.'); return; }
    const compared = ql277CompareAccessibility(baseline, result.record);
    const queued = ql278CreateRetestTicket(compared);
    setComparison(compared);
    if (queued.ok) {
      setTickets(old => [...old.filter(item => item.checkId !== queued.ticket.checkId), queued.ticket]);
      setFeedback(`${queued.ticket.priority.replaceAll('_', ' ')} added to the local retest queue. Nothing is signed off.`);
    } else {
      setTickets(old => old.filter(item => item.checkId !== compared.baseline.checkId));
      setFeedback(queued.reason);
    }
    setObservation(old => ({ ...old, note: '' }));
  }

  function recordRetest() {
    if (!ticket) { setFeedback('A regression, unresolved issue or comparability exception must first enter the queue.'); return; }
    const result = ql276CaptureOwnerObservation(observation, new Date());
    if (!result.ok) { setFeedback(result.reason); return; }
    const recorded = ql278RecordRetest(ticket, result.record);
    if (!recorded.ok) { setFeedback(`Retest not comparable: ${recorded.reason.replaceAll('_',' ')}. Queue remains open.`); return; }
    setTickets(old => old.map(item => item.checkId === recorded.ticket.checkId ? recorded.ticket : item));
    setObservation(old => ({ ...old, note: '' }));
    setFeedback(`${recorded.finding.replaceAll('_',' ')}. Ticket remains open for independent owner/reviewer disposition.`);
  }

  function prepareCustody() {
    const result = ql278PrepareCustodyPacket(source, reference, new Date());
    if (!result.ok) { setFeedback(result.reason); return; }
    setCustody(old => [...old.filter(item => item.source !== source), result.packet]);
    setFeedback('Local precondition request prepared. Original source proof, independent custody, witness and owner approval remain unverified.');
  }

  function prepareFollowup() {
    const result = ql278PrepareFollowup(source, new Date());
    setFollowUps(old => [...old.filter(item => item.source !== source), result]);
    setFeedback('Six-app drift follow-up drafted locally. No notification was sent; no public source was polled from this UI.');
  }

  async function copyPacket() {
    try {
      if (!navigator.clipboard?.writeText) throw Error('Clipboard unavailable');
      await navigator.clipboard.writeText(packet);
      setFeedback('Local review packet copied. No source notification or approval was transmitted.');
    } catch { setFeedback('Clipboard unavailable. Select the read-only packet manually; nothing was sent.'); }
  }

  return <section className="ql277-review ql278-desk" data-ql278-desk aria-labelledby="ql278-title">
    <header className="ql277-heading"><div>
      <p className="ql271-eyebrow">QL-278 · Owner retests and independent proof follow-up</p>
      <h4 id="ql278-title">Regression retests · original custody gates · six-app aging</h4>
      <p>Review on-device findings and pinned public source exceptions. This operator desk records only non-sensitive, local drafts and cannot close an accessibility issue, verify a custodian or authorize integrations.</p>
    </div><span>DISCONNECTED / HOLD</span></header>
    <div className="ql277-stats" aria-label="QL-278 held verification overview">
      <div><small>Regressions / retest queue</small><strong>{tickets.length}</strong><em>0 independently accepted</em></div>
      <div><small>Original proof missing</small><strong>{report.missing} / 6</strong><em>Public HTTP 404</em></div>
      <div><small>Source SHA movement</small><strong>{report.changed} / 6</strong><em>{report.unchanged} unchanged since QL-277</em></div>
      <div><small>Drift follow-ups sent</small><strong>0</strong><em>{followUps.length} local draft(s)</em></div>
    </div>
    <nav className="ql277-tabs" aria-label="QL-278 operator audit topics">
      <button type="button" className={topic === 'retest' ? 'active' : ''} aria-current={topic === 'retest' ? 'page' : undefined} onClick={() => setTopic('retest')}>01 Owner regression retest</button>
      <button type="button" className={topic === 'custody' ? 'active' : ''} aria-current={topic === 'custody' ? 'page' : undefined} onClick={() => setTopic('custody')}>02 Original custody preconditions</button>
      <button type="button" className={topic === 'aging' ? 'active' : ''} aria-current={topic === 'aging' ? 'page' : undefined} onClick={() => setTopic('aging')}>03 Six-app follow-up aging</button>
    </nav>

    {topic === 'retest' && <section className="ql277-card" aria-labelledby="ql278-retest-title">
      <h5 id="ql278-retest-title">On-device issue → comparable retest queue <span>OWNER-REPORTED / UNVERIFIED</span></h5>
      <p>Capture a fresh baseline, a later same-check observation, then a further retest for a reported regression, unresolved issue or comparability exception. Earlier memory-only sessions cannot be recovered automatically. An apparent improvement still requires independent reviewer/owner disposition.</p>
      <div className="ql277-form-grid">
        <label htmlFor="ql278-check">Accessibility check
          <select id="ql278-check" value={observation.checkId} onChange={event => setObservation(old => ({...old,checkId:event.target.value as Ql276OwnerEvidenceInput['checkId']}))}>{QL275_OWNER_CHECKS.map(check=><option key={check.id} value={check.id}>{check.label}</option>)}</select></label>
        <label htmlFor="ql278-outcome">Observed outcome
          <select id="ql278-outcome" value={observation.outcome} onChange={event=>setObservation(old=>({...old,outcome:event.target.value as Ql276OwnerEvidenceInput['outcome']}))}><option value="issue">Issue observed</option><option value="observed">No issue reported</option></select></label>
        <label htmlFor="ql278-device">Device class
          <select id="ql278-device" value={observation.device} onChange={event=>setObservation(old=>({...old,device:event.target.value as Ql276OwnerEvidenceInput['device']}))}><option value="desktop">Desktop</option><option value="tablet">Tablet</option><option value="mobile">Mobile</option></select></label>
        <label htmlFor="ql278-method">Accessibility method
          <select id="ql278-method" value={observation.assistiveMethod} onChange={event=>setObservation(old=>({...old,assistiveMethod:event.target.value as Ql276OwnerEvidenceInput['assistiveMethod']}))}><option value="keyboard">Keyboard-only</option><option value="screen_reader">Screen reader</option><option value="zoom_contrast">Zoom / contrast</option><option value="touch">Touch accessibility</option></select></label>
      </div>
      <label className="ql277-note-label" htmlFor="ql278-note">Actual non-sensitive observation (8–240 characters)
        <textarea id="ql278-note" rows={3} maxLength={240} value={observation.note} onChange={event=>setObservation(old=>({...old,note:event.target.value}))} placeholder="Describe only real on-device behavior, without people, URLs or credentials." /></label>
      <div className="ql277-actions"><button type="button" onClick={captureBaseline}>Capture fresh baseline</button>
        <button type="button" onClick={compareAndQueue}>Compare &amp; queue if needed</button>
        <button type="button" onClick={recordRetest} disabled={!ticket}>Record comparable retest</button></div>
      <p className="ql277-state-line">{baseline ? `Baseline ${baseline.checkId} / ${baseline.outcome} / ${baseline.device} / ${baseline.assistiveMethod} / ${baseline.recordedAt} · UNVERIFIED` : 'No new local baseline.'} {comparison ? `Comparison: ${comparison.finding.replaceAll('_',' ')} / NOT ACCEPTED.` : ''}</p>
      <div className="ql277-results" aria-label="Open local accessibility retest tickets">{tickets.map(item=><article key={item.checkId}>
        <strong>{QL275_OWNER_CHECKS.find(check=>check.id===item.checkId)?.label}</strong><span>{item.priority.replaceAll('_',' ')} · OPEN</span>
        <small>Recheck {item.comparison.recheck.recordedAt} · Retest {item.retest?.recordedAt ?? 'NOT RECORDED'} · {item.retest?.outcome ?? 'PENDING'}</small>
        <p>Independent reviewer/owner disposition REQUIRED. Retest does not certify WCAG conformance or close an issue.</p>
      </article>)}</div>
      <p className="ql277-warning">Different device/method or non-later timestamps block a comparable retest. A reported no-issue result cannot automatically sign off an original regression.</p>
    </section>}

    {topic === 'custody' && <section className="ql277-card" aria-labelledby="ql278-custody-title">
      <h5 id="ql278-custody-title">Original receipt verification preconditions <span>0 / {QL278_CUSTODY_PRECONDITIONS.length} VERIFIED</span></h5>
      <p>Every gate below requires separately obtained original cryptographic or authenticated evidence. A non-secret custodian reference is a claim only; this page performs no original receipt or signer verification. The latest pinned source proof still returns HTTP 404.</p>
      <div className="ql277-form-grid"><label htmlFor="ql278-source">Application
        <select id="ql278-source" value={source} onChange={event=>{setSource(event.target.value as Ql270SourceId);setReference('');}}>{QL270_SOURCES.map(app=><option key={app.id} value={app.id}>{app.label}</option>)}</select></label>
        <label htmlFor="ql278-reference">Optional non-secret independent receipt reference claim
          <input id="ql278-reference" maxLength={32} value={reference} onChange={event=>setReference(event.target.value)} placeholder="Reference claim, never a credential" /></label></div>
      <ol className="ql278-gate-list" aria-label="Independent original evidence verification requirements">{QL278_CUSTODY_PRECONDITIONS.map(gate=><li key={gate.key}><span aria-hidden="true">!</span><div><strong>{gate.label}</strong><small>{gate.status.replaceAll('_',' ')} · NOT SATISFIED</small></div></li>)}</ol>
      <div className="ql277-actions"><button type="button" onClick={prepareCustody}>Prepare independent-verification request draft</button>
        <button type="button" className="secondary" onClick={onOpenEvidence}>Open six-app original proof evidence</button>
        <a className="ql278-inline-link" href={ql278PinnedProofUrl(source)} target="_blank" rel="noopener noreferrer">Inspect pinned public HTTP 404 ↗</a></div>
      <div className="ql277-results">{custody.map(item=><article key={item.source}><strong>{QL270_SOURCES.find(app=>app.id===item.source)?.label}</strong>
        <span>{item.acceptance.replaceAll('_',' ')} · {item.state.replaceAll('_',' ')}</span>
        <small>Reference claim {item.reference ?? 'NONE'} · SHA {item.sha.slice(0,12)} · {item.preparedAt}</small>
        <p>{item.verified}/{item.checks.length} verified by this application. No original custody, independent signer, witness or owner approval authenticated.</p></article>)}</div>
      <p className="ql277-warning">An externally issued original custodian receipt, pinned Ed25519 SPKI, signed A→B proof, independent witness and TEST-only owner authorization are separate hard preconditions. None can be invented, checked off or bypassed here.</p>
    </section>}

    {topic === 'aging' && <section className="ql277-card" aria-labelledby="ql278-aging-title">
      <h5 id="ql278-aging-title">Six-app source drift follow-up aging <span>{report.aging.replaceAll('_',' ')}</span></h5>
      <p>Fresh historical public GitHub GET observation at {QL278_OBSERVED_AT}; tracking this follow-up from QL-277 ({report.followedHours ?? 'clock review'} elapsed hour(s)). Current snapshot age {report.ageHours ?? 'clock review'} hour(s), state {report.snapshot.replaceAll('_',' ')}. Next 24-hour public recheck due {report.nextPublicCheckDueAt}. The aging clock is a review reminder, not automatic polling.</p>
      <div className="ql278-aging-list" role="table" aria-label="Six-app immutable Proof-B follow-up and aging ledger">
        <div className="ql278-aging-row head" role="row"><span role="columnheader">Source</span><span role="columnheader">QL-277 → QL-278</span><span role="columnheader">Follow-up</span><span role="columnheader">Evidence</span></div>
        {report.rows.map(row=><div key={row.source} className="ql278-aging-row" role="row"><strong role="cell">{QL270_SOURCES.find(app=>app.id===row.source)?.label}</strong>
          <code role="cell" title={`${row.previousSha} -> ${row.sha}`}>{row.previousSha?.slice(0,9)} → {row.sha.slice(0,9)}</code>
          <span role="cell">{row.changed ? 'SHA MOVED' : 'SAME SHA'} · {row.followUp.replaceAll('_',' ')} · HTTP {row.http}</span>
          <a role="cell" href={ql278PinnedProofUrl(row.source)} target="_blank" rel="noopener noreferrer">Pinned proof ↗</a></div>)}</div>
      <div className="ql277-form-grid"><label htmlFor="ql278-aging-source">Source to queue for draft follow-up
        <select id="ql278-aging-source" value={source} onChange={event=>setSource(event.target.value as Ql270SourceId)}>{QL270_SOURCES.map(app=><option key={app.id} value={app.id}>{app.label}</option>)}</select></label></div>
      <div className="ql277-actions"><button type="button" onClick={prepareFollowup}>Prepare local aging follow-up draft</button>
        <button type="button" className="secondary" onClick={()=>{setAsOf(new Date());setFeedback('Local elapsed time refreshed only. GitHub was NOT queried again.');}}>Refresh elapsed time only</button></div>
      <div className="ql277-results">{followUps.map(item=><article key={item.source}><strong>{QL270_SOURCES.find(app=>app.id===item.source)?.label}</strong>
        <span>{item.finding.replaceAll('_',' ')} · {item.state.replaceAll('_',' ')}</span><small>{item.followUp.replaceAll('_',' ')} · {item.preparedAt}</small>
        <p>Human follow-up only through a separately authorized channel. No issue, alert, email or custodian response has been sent or received.</p></article>)}</div>
      <p className="ql277-warning">Public SHA movement neither renews nor satisfies the original Proof-B / signer / custody / witness / TEST-tenant gates. If the pinned snapshot is stale, perform another authorized public recheck before relying on it.</p>
    </section>}

    <section className="ql277-card" aria-labelledby="ql278-packet-title"><h5 id="ql278-packet-title">Consolidated local audit packet <span>DRAFT · NOT SENT</span></h5>
      <label htmlFor="ql278-packet" className="ql277-note-label">Read-only operator retest, custody and source-aging summary
        <textarea id="ql278-packet" rows={9} readOnly value={packet} /></label>
      <div className="ql277-actions"><button type="button" onClick={()=>void copyPacket()}>Copy unsent QL-278 packet</button>
        <button type="button" className="secondary" onClick={()=>{setBaseline(null);setComparison(null);setTickets([]);setCustody([]);setFollowUps([]);setObservation(initialObservation);setReference('');setFeedback('All memory-only QL-278 review drafts cleared.');}}>Clear local drafts</button></div>
      <p className="ql277-feedback" role="status" aria-live="polite">{feedback}</p>
      <p className="ql277-warning">No persistent owner evidence, outside delivery, automatic GitHub polling, stored secrets, actual original custody verification, private gateway GET, production tenants, communications, calls or SMS. Software release ≠ integration authorization.</p>
    </section>
  </section>;
}

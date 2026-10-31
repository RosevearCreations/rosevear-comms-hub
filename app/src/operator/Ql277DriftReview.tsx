import { useState } from 'react';
import { QL270_SOURCES, type Ql270SourceId } from './ql270ConnectionCentre';
import { QL275_OWNER_CHECKS } from './ql275OperatorWalkthrough';
import { ql276CaptureOwnerObservation, type Ql276OwnerEvidenceInput,
  type Ql276OwnerObservation } from './ql276EvidenceIntake';
import { QL277_OBSERVED_AT, ql277CompareAccessibility, ql277CustodianQueue,
  ql277PinnedProofUrl, ql277PrepareNotification, ql277ReviewPacket, ql277SourceDrift,
  type Ql277Comparison, type Ql277CustodianQueueItem, type Ql277NotificationDraft } from './ql277DriftReview';
import './ql277-drift-review.css';

type Topic = 'recheck' | 'custody' | 'drift';

export function Ql277DriftReview({ onOpenEvidence }: { onOpenEvidence: () => void }) {
  const [topic, setTopic] = useState<Topic>('recheck');
  const [observation, setObservation] = useState<Ql276OwnerEvidenceInput>({
    checkId: 'keyboard', outcome: 'issue', device: 'desktop', assistiveMethod: 'keyboard', note: ''
  });
  const [baseline, setBaseline] = useState<Ql276OwnerObservation | null>(null);
  const [comparisons, setComparisons] = useState<Ql277Comparison[]>([]);
  const [source, setSource] = useState<Ql270SourceId>('rosiedazzlers');
  const [reference, setReference] = useState('');
  const [queue, setQueue] = useState<Ql277CustodianQueueItem[]>([]);
  const [notifications, setNotifications] = useState<Ql277NotificationDraft[]>([]);
  const [feedback, setFeedback] = useState('No new owner comparison, custodian receipt or notification has been verified or sent.');
  const report = ql277SourceDrift(new Date());
  const packet = ql277ReviewPacket(comparisons, queue, notifications, new Date());

  function captureBaseline() {
    const result = ql276CaptureOwnerObservation(observation, new Date());
    if (!result.ok) { setFeedback(result.reason); return; }
    setBaseline(result.record);
    setComparisons(current => current.filter(row => row.baseline.checkId !== result.record.checkId));
    setObservation(previous => ({ ...previous, note: '' }));
    setFeedback(`Local baseline captured for ${result.record.checkId}. Enter the later observed recheck on the same device/method; owner identity is not verified.`);
  }

  function captureRecheck() {
    if (!baseline) { setFeedback('Capture a genuine local baseline before comparing a later recheck.'); return; }
    const result = ql276CaptureOwnerObservation(observation, new Date());
    if (!result.ok) { setFeedback(result.reason); return; }
    if (result.record.checkId !== baseline.checkId) { setFeedback('Use the same accessibility check as the baseline.'); return; }
    const compared = ql277CompareAccessibility(baseline, result.record);
    setComparisons(current => [...current.filter(row => row.baseline.checkId !== compared.baseline.checkId), compared]);
    setObservation(previous => ({ ...previous, note: '' }));
    setFeedback('Local self-reported comparison captured. Independent owner/device acceptance remains NOT RECORDED.');
  }

  function queueReference() {
    const result = ql277CustodianQueue(source, reference, new Date());
    if (!result.ok) { setFeedback(result.reason); return; }
    setQueue(current => [...current.filter(item => item.source !== source), result.item]);
    setFeedback('Custodian reference added as a format-only local claim. No original receipt or signature has been validated.');
  }

  function prepareNotice() {
    const draft = ql277PrepareNotification(source, new Date());
    setNotifications(current => [...current.filter(item => item.source !== source), draft]);
    setFeedback('Source-drift notification drafted locally only. It has NOT been sent to an application or reviewer.');
  }

  async function copyPacket() {
    try {
      if (!navigator.clipboard?.writeText) throw Error('Clipboard unavailable');
      await navigator.clipboard.writeText(packet);
      setFeedback('Draft copied locally; no owner report, reference, source notice or authorization was transmitted.');
    } catch {
      setFeedback('Clipboard unavailable. Select the read-only packet to copy manually; nothing was transmitted.');
    }
  }

  return <section className="ql277-review" data-ql277-review aria-labelledby="ql277-title">
    <header className="ql277-heading"><div>
      <p className="ql271-eyebrow">QL-277 · Independent review continuity</p>
      <h4 id="ql277-title">Owner recheck comparison · custody queue · source drift</h4>
      <p>Use real local observations and public GitHub evidence to prepare review work. This desk cannot authenticate an owner, accept Proof-B or send a notification.</p>
    </div><span>DISCONNECTED / HOLD</span></header>
    <div className="ql277-stats" aria-label="Source drift and unverified review metrics">
      <div><small>Changed main SHAs</small><strong>{report.changed} / {report.total}</strong><em>Since QL-276</em></div>
      <div><small>Missing original Proof-B</small><strong>{report.missing} / 6</strong><em>HTTP 404 at pinned commits</em></div>
      <div><small>Owner comparisons</small><strong>{comparisons.length}</strong><em>Locally reported only</em></div>
      <div><small>Notices actually sent</small><strong>0</strong><em>Drafts: {notifications.length}</em></div>
    </div>
    <nav className="ql277-tabs" aria-label="QL-277 review topics">
      <button type="button" className={topic === 'recheck' ? 'active' : ''} aria-current={topic === 'recheck' ? 'page' : undefined} onClick={() => setTopic('recheck')}>01 Accessibility recheck</button>
      <button type="button" className={topic === 'custody' ? 'active' : ''} aria-current={topic === 'custody' ? 'page' : undefined} onClick={() => setTopic('custody')}>02 Custodian reference queue</button>
      <button type="button" className={topic === 'drift' ? 'active' : ''} aria-current={topic === 'drift' ? 'page' : undefined} onClick={() => setTopic('drift')}>03 Source drift notifications</button>
    </nav>

    {topic === 'recheck' && <section className="ql277-card" aria-labelledby="ql277-recheck-title">
      <h5 id="ql277-recheck-title">Baseline → owner recheck <span>SELF-REPORTED / UNVERIFIED</span></h5>
      <p>Record a real baseline, then repeat the same accessibility check. QL-276 observations were intentionally memory-only; closed sessions cannot be silently recalled. Enter observations from your device without identifiers, credentials or customer content. Comparison is meaningful only with matching device and method and a later timestamp.</p>
      <div className="ql277-form-grid">
        <label htmlFor="ql277-check">Accessibility check
          <select id="ql277-check" value={observation.checkId} onChange={event => setObservation(old => ({ ...old, checkId: event.target.value as Ql276OwnerEvidenceInput['checkId'] }))}>{QL275_OWNER_CHECKS.map(check => <option key={check.id} value={check.id}>{check.label}</option>)}</select>
        </label>
        <label htmlFor="ql277-outcome">Observed outcome
          <select id="ql277-outcome" value={observation.outcome} onChange={event => setObservation(old => ({...old,outcome:event.target.value as Ql276OwnerEvidenceInput['outcome']}))}><option value="issue">Issue to retest</option><option value="observed">Observed on device</option></select>
        </label>
        <label htmlFor="ql277-device">Device
          <select id="ql277-device" value={observation.device} onChange={event => setObservation(old => ({...old,device:event.target.value as Ql276OwnerEvidenceInput['device']}))}><option value="desktop">Desktop</option><option value="tablet">Tablet</option><option value="mobile">Mobile</option></select>
        </label>
        <label htmlFor="ql277-method">Access method
          <select id="ql277-method" value={observation.assistiveMethod} onChange={event => setObservation(old => ({...old,assistiveMethod:event.target.value as Ql276OwnerEvidenceInput['assistiveMethod']}))}><option value="keyboard">Keyboard-only</option><option value="screen_reader">Screen reader</option><option value="zoom_contrast">Zoom / contrast</option><option value="touch">Touch accessibility</option></select>
        </label>
      </div>
      <label className="ql277-note-label" htmlFor="ql277-observation">Actual non-sensitive observation · 8–240 characters
        <textarea id="ql277-observation" rows={3} value={observation.note} maxLength={240} onChange={event => setObservation(old => ({...old,note:event.target.value}))} placeholder="Describe only the observed behavior on this device." />
      </label>
      <div className="ql277-actions"><button type="button" onClick={captureBaseline}>Record baseline</button><button type="button" onClick={captureRecheck}>Record later recheck &amp; compare</button></div>
      <p className="ql277-state-line">{baseline ? `Local baseline: ${baseline.checkId} / ${baseline.outcome} / ${baseline.device} / ${baseline.assistiveMethod} / ${baseline.recordedAt} · UNVERIFIED` : 'No local baseline recorded yet.'}</p>
      <div className="ql277-results">{comparisons.map(item => <article key={item.baseline.checkId}>
        <strong>{QL275_OWNER_CHECKS.find(check => check.id === item.baseline.checkId)?.label}</strong><span>{item.finding.replaceAll('_',' ')}</span>
        <small>{item.baseline.outcome} → {item.recheck.outcome} · {item.baseline.recordedAt} → {item.recheck.recordedAt}</small>
        <p>Owner-reported only; independent device/reviewer acceptance and authenticated owner sign-off remain NOT RECORDED.</p>
      </article>)}</div>
      <p className="ql277-warning">A reported improvement is not automatically accepted closure. A regression or environment mismatch needs a fresh comparable test and independent reviewer disposition.</p>
    </section>}

    {topic === 'custody' && <section className="ql277-card" aria-labelledby="ql277-custody-title">
      <h5 id="ql277-custody-title">Independent custodian reference validation queue <span>FORMAT ONLY</span></h5>
      <p>Choose a source and optionally enter a non-secret reference already issued outside this screen. Format validation cannot verify an original signed receipt, signer pin, Ed25519 signature, source ancestry or witness. All sources still have missing original Proof-B.</p>
      <div className="ql277-form-grid"><label htmlFor="ql277-source">Source application
        <select id="ql277-source" value={source} onChange={event=>{setSource(event.target.value as Ql270SourceId);setReference('');}}>{QL270_SOURCES.map(app=><option key={app.id} value={app.id}>{app.label}</option>)}</select></label>
        <label htmlFor="ql277-reference">Optional external receipt reference claim
          <input id="ql277-reference" maxLength={32} placeholder="Non-secret reference only" value={reference} onChange={event=>setReference(event.target.value)} /></label></div>
      <div className="ql277-actions"><button type="button" onClick={queueReference}>Add format-check queue entry</button><button type="button" className="secondary" onClick={onOpenEvidence}>Open original six-app evidence</button></div>
      <div className="ql277-results">{queue.map(item => <article key={item.source}><strong>{QL270_SOURCES.find(app=>app.id===item.source)?.label}</strong>
        <span>{item.format.replaceAll('_',' ')} · CUSTODY UNVERIFIED</span><small>{item.claimedReference ?? 'No external reference supplied'} · {item.preparedAt}</small>
        <p>Source proof HTTP 404 · independent custodian receipt NOT VERIFIED · DRAFT NOT SENT.</p></article>)}</div>
      <p className="ql277-warning">The independent custodian must return a genuine original receipt with cryptographic evidence and an independent SPKI pin. A formatted ID is never sufficient to clear this queue.</p>
    </section>}

    {topic === 'drift' && <section className="ql277-card" aria-labelledby="ql277-drift-title">
      <h5 id="ql277-drift-title">Six-app source drift notification audit <span>{report.age.replaceAll('_',' ')}</span></h5>
      <p>Public GitHub GET recheck at the then-current six main SHAs on {QL277_OBSERVED_AT}; snapshot age {report.elapsedHours} hour(s). All six commits moved since QL-276, all six original proof targets returned HTTP 404. Any further main move or age of 24 hours requires a new public recheck.</p>
      <div className="ql277-source-table" role="table" aria-label="QL-277 immutable six-source drift and notification ledger"><div className="ql277-source-head" role="row">
        <span role="columnheader">Source</span><span role="columnheader">Previous → new SHA</span><span role="columnheader">State</span><span role="columnheader">Public proof</span></div>
        {report.rows.map(row => <div className="ql277-source-row" key={row.source} role="row"><strong role="cell">{QL270_SOURCES.find(app=>app.id===row.source)?.label}</strong>
          <code role="cell" title={`Previous ${row.previousSha} / current ${row.sha}`}>{row.previousSha?.slice(0,9)} → {row.sha.slice(0,9)}</code>
          <span role="cell">{row.changed ? 'SHA CHANGED' : 'SAME SHA'} · HTTP {row.http}</span>
          <a role="cell" href={ql277PinnedProofUrl(row.source)} target="_blank" rel="noopener noreferrer" aria-label={`Open QL-277 pinned Proof-B path for ${row.repo}`}>Check ↗</a></div>)}</div>
      <div className="ql277-form-grid"><label htmlFor="ql277-notify-source">Application for local notification draft
        <select id="ql277-notify-source" value={source} onChange={event=>setSource(event.target.value as Ql270SourceId)}>{QL270_SOURCES.map(app=><option key={app.id} value={app.id}>{app.label}</option>)}</select></label></div>
      <div className="ql277-actions"><button type="button" onClick={prepareNotice}>Prepare notification draft for {QL270_SOURCES.find(app=>app.id===source)?.label}</button></div>
      <div className="ql277-results">{notifications.map(item => <article key={item.source}><strong>{QL270_SOURCES.find(app=>app.id===item.source)?.label}</strong>
        <span>DRAFT NOT SENT</span><small>{item.previousSha.slice(0,12)} → {item.currentSha.slice(0,12)} · {item.preparedAt}</small>
        <p>Notify source maintainer and independent custodian only through separately approved channels. No message was delivered from this page.</p></article>)}</div>
      <p className="ql277-warning">Public source commits and HTTP status do not prove signer trust, independent custody, tenant isolation or owner TEST consent. Drafts are notifications for human follow-up, not a dispatch log.</p>
    </section>}

    <section className="ql277-card" aria-labelledby="ql277-packet-title"><h5 id="ql277-packet-title">Combined local review packet <span>NOT SENT</span></h5>
      <label className="ql277-note-label" htmlFor="ql277-packet">Read-only, copyable summary of public source drift and unverified local observations
        <textarea id="ql277-packet" value={packet} rows={9} readOnly />
      </label><div className="ql277-actions"><button type="button" onClick={() => void copyPacket()}>Copy local review packet</button>
        <button type="button" className="secondary" onClick={()=>{setBaseline(null);setComparisons([]);setQueue([]);setNotifications([]);setReference('');setObservation(old=>({...old,note:''}));setFeedback('All local QL-277 drafts cleared.');}}>Clear local review records</button></div>
      <p className="ql277-feedback" role="status" aria-live="polite">{feedback}</p>
      <p className="ql277-warning">No application writes, outbound notification, customer records, secret, credential, real owner decision, original signature acceptance, tenant access, authenticated GET, private relay, call or SMS is created.</p>
    </section>
  </section>;
}

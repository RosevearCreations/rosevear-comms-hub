import { useState } from 'react';
import { QL270_SOURCES, type Ql270SourceId } from './ql270ConnectionCentre';
import { QL274_PUBLIC_PROOF_RECHECK } from './ql274CommandAudit';
import { QL275_OWNER_CHECKS } from './ql275OperatorWalkthrough';
import { QL276_OBSERVED_AT, QL276_PUBLIC_SOURCE_RECHECK, ql276CaptureOwnerObservation,
  ql276IntakePacket, ql276PinnedProofUrl, ql276PrepareCustodianRoute, ql276SourceSummary,
  type Ql276CustodianRoute, type Ql276OwnerEvidenceInput, type Ql276OwnerObservation } from './ql276EvidenceIntake';
import './ql276-evidence-intake.css';

type Tab = 'owner' | 'custodian' | 'sources';

export function Ql276EvidenceIntake({ onOpenEvidence, onOpenConnections }: {
  onOpenEvidence: () => void;
  onOpenConnections: () => void;
}) {
  const [tab, setTab] = useState<Tab>('owner');
  const [records, setRecords] = useState<Ql276OwnerObservation[]>([]);
  const [form, setForm] = useState<Ql276OwnerEvidenceInput>({
    checkId: 'keyboard', outcome: 'observed', device: 'desktop', assistiveMethod: 'keyboard', note: ''
  });
  const [source, setSource] = useState<Ql270SourceId>('rosiedazzlers');
  const [reference, setReference] = useState('');
  const [route, setRoute] = useState<Ql276CustodianRoute | null>(null);
  const [feedback, setFeedback] = useState('No owner evidence or custody receipt has been authenticated.');
  const summary = ql276SourceSummary(new Date());
  const packet = ql276IntakePacket(records, route, new Date());

  function captureObservation() {
    const result = ql276CaptureOwnerObservation(form, new Date());
    if (!result.ok) { setFeedback(result.reason); return; }
    setRecords(current => [...current.filter(item => item.checkId !== result.record.checkId), result.record]);
    setForm(previous => ({ ...previous, note: '' }));
    setFeedback('Owner-reported observation captured in this open panel only. Identity, device evidence and independent sign-off remain UNVERIFIED.');
  }

  function prepareRoute() {
    const result = ql276PrepareCustodianRoute(source, reference, new Date());
    if (!result.ok) { setFeedback(result.reason); return; }
    setRoute(result.record);
    setFeedback('Local custodian routing draft prepared. No message sent; a claimed reference is not an original custody receipt.');
  }

  async function copyPacket() {
    try {
      if (!navigator.clipboard?.writeText) throw Error('Unavailable');
      await navigator.clipboard.writeText(packet);
      setFeedback('Sanitized local draft copied. It was not transmitted, signed or independently accepted.');
    } catch {
      setFeedback('Clipboard unavailable. Select the read-only packet to copy manually. No network handoff occurred.');
    }
  }

  return <section className="ql276-intake" data-ql276-intake aria-labelledby="ql276-title">
    <header className="ql276-heading"><div>
      <p className="ql271-eyebrow">QL-276 · Owner and independent-custody evidence desk</p>
      <h4 id="ql276-title">On-device observations &amp; Proof-B route receipts</h4>
      <p>Record non-secret accessibility observations, prepare a traceable custodian routing draft and inspect six independently rechecked public sources. No field authenticates an owner or signer.</p>
    </div><span>DISCONNECTED / HOLD</span></header>
    <div className="ql276-stat-strip" aria-label="QL-276 evidence and source status">
      <div><small>Public Proof-B missing</small><strong>{summary.missing}/{summary.total}</strong><em>At immutable GitHub commits</em></div>
      <div><small>New source SHAs</small><strong>{summary.changedSources.length}</strong><em>Compared with QL-274</em></div>
      <div><small>Local owner observations</small><strong>{records.length}/{QL275_OWNER_CHECKS.length}</strong><em>Self-reported / unverified</em></div>
      <div><small>Accepted custody receipts</small><strong>0</strong><em>Independent review pending</em></div>
    </div>
    <nav className="ql276-tabs" aria-label="QL-276 evidence intake sections">
      <button type="button" className={tab === 'owner' ? 'active' : ''} aria-current={tab === 'owner' ? 'page' : undefined} onClick={() => setTab('owner')}>01 Owner observations</button>
      <button type="button" className={tab === 'custodian' ? 'active' : ''} aria-current={tab === 'custodian' ? 'page' : undefined} onClick={() => setTab('custodian')}>02 Custodian route draft</button>
      <button type="button" className={tab === 'sources' ? 'active' : ''} aria-current={tab === 'sources' ? 'page' : undefined} onClick={() => setTab('sources')}>03 Fresh public recheck</button>
    </nav>

    {tab === 'owner' && <section className="ql276-card" aria-labelledby="ql276-owner-title">
      <h5 id="ql276-owner-title">Owner-recorded accessibility evidence <span>UNVERIFIED SELF-REPORT</span></h5>
      <p>Perform a real on-device check, then record what you personally observed. Use only generic device details and non-sensitive descriptions—never a name, email, account, token, URL, password, customer record or private receipt. The notes exist only while this panel is open.</p>
      <div className="ql276-form-grid">
        <label htmlFor="ql276-check">Review step
          <select id="ql276-check" value={form.checkId} onChange={event => setForm(old => ({ ...old, checkId: event.target.value as Ql276OwnerEvidenceInput['checkId'] }))}>
            {QL275_OWNER_CHECKS.map(check => <option key={check.id} value={check.id}>{check.label}</option>)}
          </select>
        </label>
        <label htmlFor="ql276-outcome">Actual observation
          <select id="ql276-outcome" value={form.outcome} onChange={event => setForm(old => ({ ...old, outcome: event.target.value as Ql276OwnerEvidenceInput['outcome'] }))}>
            <option value="observed">Observed on device</option><option value="issue">Issue / retest needed</option>
          </select>
        </label>
        <label htmlFor="ql276-device">Device class
          <select id="ql276-device" value={form.device} onChange={event => setForm(old => ({ ...old, device: event.target.value as Ql276OwnerEvidenceInput['device'] }))}>
            <option value="desktop">Desktop</option><option value="tablet">Tablet</option><option value="mobile">Mobile</option>
          </select>
        </label>
        <label htmlFor="ql276-method">Accessibility method
          <select id="ql276-method" value={form.assistiveMethod} onChange={event => setForm(old => ({ ...old, assistiveMethod: event.target.value as Ql276OwnerEvidenceInput['assistiveMethod'] }))}>
            <option value="keyboard">Keyboard-only</option><option value="screen_reader">Screen reader</option><option value="zoom_contrast">Zoom / contrast</option><option value="touch">Touch accessibility</option>
          </select>
        </label>
      </div>
      <label className="ql276-note-label" htmlFor="ql276-observation">What did you observe? <small>8–240 characters, no sensitive details</small>
        <textarea id="ql276-observation" value={form.note} rows={3} maxLength={240} placeholder="Example: At 200% zoom, the command cards reflowed without horizontal scrolling."
          onChange={event => setForm(old => ({ ...old, note: event.target.value }))} />
      </label>
      <div className="ql276-actions"><button type="button" onClick={captureObservation}>Record local observation</button>
        <button type="button" className="secondary" onClick={() => { setRecords([]); setFeedback('Local observations cleared; nothing was submitted.'); }}>Clear owner observations</button></div>
      <ol className="ql276-observation-list">{records.map(item => <li key={item.checkId}>
        <strong>{QL275_OWNER_CHECKS.find(check => check.id === item.checkId)?.label}</strong>
        <small>{item.outcome.toUpperCase()} · {item.device} · {item.assistiveMethod.replaceAll('_', ' ')} · {item.recordedAt}</small>
        <p>{item.note}</p><em>OWNER REPORTED · UNVERIFIED</em>
      </li>)}</ol>
      <p className="ql276-warning">Even five observations do not establish WCAG certification, authenticated owner sign-off or independent reviewer acceptance. Original device evidence and a separate owner decision are still required.</p>
    </section>}

    {tab === 'custodian' && <section className="ql276-card" aria-labelledby="ql276-custodian-title">
      <h5 id="ql276-custodian-title">Independent Proof-B custodian routing <span>DRAFT · NOT SENT</span></h5>
      <p>Use this only to prepare a source-specific route. Do not paste private Ed25519 keys, signed proofs, SPKI, real tenant identifiers or a witness identity here. A reference entered by an operator remains an <strong>unverified claim</strong>.</p>
      <div className="ql276-form-grid">
        <label htmlFor="ql276-source">Application source
          <select id="ql276-source" value={source} onChange={event => { setSource(event.target.value as Ql270SourceId); setRoute(null); setReference(''); setFeedback('Source changed. Previous routing draft cleared; no receipt accepted.'); }}>
            {QL270_SOURCES.map(app => <option key={app.id} value={app.id}>{app.label}</option>)}
          </select>
        </label>
        <label htmlFor="ql276-reference">Optional non-secret external receipt reference <small>(not validated)</small>
          <input id="ql276-reference" value={reference} maxLength={32} placeholder="External reference only" onChange={event => { setReference(event.target.value); setRoute(null); }} />
        </label>
      </div>
      <div className="ql276-route-chain">
        <div><small>PUBLIC ORIGIN</small><strong>Proof-B HTTP 404</strong><em>Original raw signed source absent</em></div>
        <div><small>NEXT OWNER</small><strong>Independent key custodian</strong><em>Private signature, SPKI, ancestry and receipt review</em></div>
        <div><small>AFTER CUSTODY</small><strong>Witness / owner</strong><em>Separate independent review and TEST-only permission</em></div>
      </div>
      <div className="ql276-actions"><button type="button" onClick={prepareRoute}>Prepare local routing receipt draft</button>
        <button className="secondary" type="button" onClick={onOpenEvidence}>Review existing six-app security evidence</button></div>
      <p className="ql276-state-line">{route ? `Prepared ${route.preparedAt} for ${route.source} at ${route.observedSourceSha.slice(0,12)} · DRAFT NOT SENT · CUSTODY NOT VERIFIED` : 'No custodian routing draft prepared in this panel.'}</p>
      <p className="ql276-warning">Required next real artifact: an independently issued original custodian receipt and verified signer trust. Copying or preparing this draft does not deliver it and cannot lift HOLD.</p>
    </section>}

    {tab === 'sources' && <section className="ql276-card" aria-labelledby="ql276-sources-title">
      <h5 id="ql276-sources-title">Fresh six-source public recheck <span>{summary.age.replaceAll('_',' ')}</span></h5>
      <p>Read-only public GitHub observations at the then-current source <code>main</code> SHAs, collected {QL276_OBSERVED_AT}. Age {summary.elapsedHours} hour(s). Recheck after 24 hours or any newer main commit; these are not an authenticated endpoint heartbeat or cryptographic verification.</p>
      <div className="ql276-source-list" role="table" aria-label="Six immutable GitHub Proof-B exceptions">
        <div className="ql276-source-head" role="row"><span role="columnheader">Source</span><span role="columnheader">Main SHA</span><span role="columnheader">Public result</span><span role="columnheader">Evidence</span></div>
        {QL276_PUBLIC_SOURCE_RECHECK.map(row => {
          const label = QL270_SOURCES.find(app => app.id === row.source)?.label ?? row.repo;
          const changed = QL274_PUBLIC_PROOF_RECHECK.find(item => item.source === row.source)?.sha !== row.sha;
          return <div className="ql276-source-row" role="row" key={row.source}>
            <strong role="cell">{label}</strong><code role="cell" title={row.sha}>{row.sha.slice(0,12)} {changed ? '· NEW SHA' : ''}</code>
            <span role="cell">HTTP {row.http} · HOLD</span>
            <a role="cell" href={ql276PinnedProofUrl(row.source)} target="_blank" rel="noopener noreferrer" aria-label={`Open ${label} QL-276 pinned Proof-B request`}>Inspect source ↗</a>
          </div>;
        })}
      </div>
      <p className="ql276-warning">All six original source proof files were missing at observation. Even a later HTTP 200 would establish only existence, not a genuine signed Proof-B, independently trusted SPKI, witness disposition or owner TEST authorization.</p>
    </section>}

    <section className="ql276-card" aria-labelledby="ql276-packet-title">
      <h5 id="ql276-packet-title">Owner + custodian local packet <span>EXPORT DRAFT</span></h5>
      <label className="ql276-note-label" htmlFor="ql276-packet">Reviewable, sanitized read-only text
        <textarea id="ql276-packet" value={packet} rows={8} readOnly />
      </label>
      <div className="ql276-actions"><button type="button" onClick={() => void copyPacket()}>Copy local packet</button>
        <button type="button" className="secondary" onClick={onOpenConnections}>Open held connection preflight</button>
        <button type="button" className="secondary" onClick={() => { setRecords([]); setRoute(null); setReference(''); setForm(old => ({...old, note:''})); setFeedback('All local QL-276 draft records cleared.'); }}>Clear local draft</button></div>
      <p className="ql276-feedback" role="status" aria-live="polite">{feedback}</p>
      <p className="ql276-warning">No server writes, email, issue creation, token handling, uploaded attachments, live communications, provider callbacks or authenticated GETs. Original owner, custodian and witness evidence must be obtained and verified through the separately authorized process.</p>
    </section>
  </section>;
}

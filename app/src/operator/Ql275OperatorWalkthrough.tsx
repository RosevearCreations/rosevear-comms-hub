import { useState } from 'react';
import type { Ql271CommandMode } from './Ql271CommandSurfaces';
import type { Ql270SourceId } from './ql270ConnectionCentre';
import { QL270_SOURCES } from './ql270ConnectionCentre';
import { QL273_VIEW_HELP } from './ql273CommandHelp';
import { QL275_EXCEPTION_STAGES, QL275_GUIDE_STEPS, QL275_OWNER_CHECKS,
  ql275ExceptionHandoff, ql275GuidePosition, ql275OwnerProgress, ql275ProofException,
  type Ql275OwnerOutcome } from './ql275OperatorWalkthrough';
import './ql275-operator-walkthrough.css';

type Topic = 'guide' | 'accessibility' | 'exceptions';
const topics: readonly { id: Topic; label: string }[] = [
  { id: 'guide', label: 'Guided navigation' },
  { id: 'accessibility', label: 'Owner accessibility walkthrough' },
  { id: 'exceptions', label: 'Proof-B exception routing' }
];

export function Ql275OperatorWalkthrough({ mode, onNavigate, onOpenEvidence, onOpenConnections }: {
  mode: Ql271CommandMode;
  onNavigate: (mode: Ql271CommandMode) => void;
  onOpenEvidence: () => void;
  onOpenConnections: () => void;
}) {
  const [topic, setTopic] = useState<Topic>('guide');
  const [outcomes, setOutcomes] = useState<Record<string, Ql275OwnerOutcome>>({});
  const [source, setSource] = useState<Ql270SourceId>('ai-data-platform');
  const [copyStatus, setCopyStatus] = useState('No handoff sent. Draft visible below for manual review.');
  const position = ql275GuidePosition(mode);
  const progress = ql275OwnerProgress(outcomes);
  const exception = ql275ProofException(source, new Date());
  const handoff = ql275ExceptionHandoff(source, new Date());

  async function copyDraft() {
    try {
      if (!navigator.clipboard?.writeText) throw Error('Clipboard unavailable');
      await navigator.clipboard.writeText(handoff);
      setCopyStatus('Draft copied locally. No message, approval or evidence was submitted.');
    } catch {
      setCopyStatus('Clipboard unavailable. Select the read-only draft text to copy it manually; nothing was submitted.');
    }
  }

  return <section className="ql275-walkthrough" data-ql275-walkthrough aria-labelledby="ql275-title">
    <header className="ql275-heading"><div>
      <p className="ql271-eyebrow">QL-275 · Guided operator assurance</p>
      <h4 id="ql275-title">Learn the controls · rehearse accessibility · route evidence gaps</h4>
      <p>Safe, keyboard-accessible guidance for the four command views. This review does not accept Proof-B, authenticate a human or connect a tenant.</p>
    </div><strong className="ql275-held">DISCONNECTED / HOLD</strong></header>
    <nav className="ql275-topic-tabs" aria-label="Operator walkthrough topics">
      {topics.map(item => <button key={item.id} type="button" aria-current={item.id === topic ? 'page' : undefined}
        className={item.id === topic ? 'active' : ''} onClick={() => setTopic(item.id)}>{item.label}</button>)}
    </nav>

    {topic === 'guide' && <div className="ql275-content" aria-label="Guided command navigation">
      <div className="ql275-progress" role="status">Viewing step <strong>{position.current} of {position.total}</strong> · {QL275_GUIDE_STEPS[position.current - 1].title}</div>
      <ol className="ql275-guide-list">{QL275_GUIDE_STEPS.map(step => <li key={step.id} className={step.id === mode ? 'active' : ''}>
        <div><strong>{step.title}</strong><p>{step.checkpoint}</p><small>{step.id === mode ? 'Current command view' : 'Navigate without changing data'}</small></div>
        <button type="button" disabled={step.id === mode} onClick={() => onNavigate(step.id)}
          aria-label={`Open ${step.title}`}>{step.id === mode ? 'Here now' : 'Open view'}</button>
      </li>)}</ol>
      <div className="ql275-callout"><strong>What to do here</strong><p>{QL273_VIEW_HELP[mode].purpose}</p><strong>Next safe step</strong><p>{position.hint}</p>
        <button type="button" onClick={() => onNavigate(position.next.id)}>Next view: {position.next.title}</button>
      </div>
    </div>}

    {topic === 'accessibility' && <div className="ql275-content" aria-label="Owner accessibility review rehearsal">
      <div className="ql275-progress" role="status">Locally observed <strong>{progress.completed} of {progress.total}</strong> · issues noted {progress.issues} · <strong>Owner sign-off NOT RECORDED</strong></div>
      <p className="ql275-explain">Run these checks on the owner's own device and assistive technology. Choices below are temporary, unsent rehearsal notes—not validated WCAG results, verified identity, an owner signature or approval. They reset on panel exit.</p>
      <div className="ql275-check-list">{QL275_OWNER_CHECKS.map(check => <div key={check.id} className="ql275-check">
        <div><strong>{check.label}</strong><p>{check.instruction}</p></div>
        <label htmlFor={`ql275-check-${check.id}`}>Local observation
          <select id={`ql275-check-${check.id}`} value={outcomes[check.id] ?? 'not_reviewed'}
            onChange={event => setOutcomes(old => ({ ...old, [check.id]: event.target.value as Ql275OwnerOutcome }))}>
            <option value="not_reviewed">Not reviewed</option><option value="observed">Observed locally</option><option value="issue">Issue to retest</option>
          </select>
        </label>
      </div>)}</div>
      <div className="ql275-review-foot"><button type="button" onClick={() => setOutcomes({})}>Clear local observations</button>
        <p>Formal acceptance requires original device/screen-reader evidence, an independently recorded reviewer disposition and an authenticated owner decision outside this interface.</p></div>
    </div>}

    {topic === 'exceptions' && <div className="ql275-content" aria-label="Signed Proof-B exception routing">
      <div className="ql275-exception-summary"><label htmlFor="ql275-source">Source application
        <select id="ql275-source" value={source} onChange={event => {
          setSource(event.target.value as Ql270SourceId);
          setCopyStatus('Source changed; draft updated locally. No handoff sent.');
        }}>{QL270_SOURCES.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}</select>
      </label><div><small>Historical original-proof result</small><strong>HTTP {exception.http} · {exception.queue.replaceAll('_', ' ')}</strong><small>Observed {exception.observedAt} · {exception.elapsedHours} hour(s) elapsed</small></div></div>
      <p className="ql275-explain">The checked commit is <code>{exception.sha}</code>. This is the immutable QL-274 public observation, <strong>not</strong> a current main heartbeat. New commits or age ≥24 hours require an independent public recheck before assessing a source response.</p>
      <a className="ql275-proof-link" href={exception.url} target="_blank" rel="noopener noreferrer">Open pinned original-proof path on GitHub ↗</a>
      <h5>Exception owners and required next evidence</h5>
      <ol className="ql275-exception-stages">{QL275_EXCEPTION_STAGES.map(item => <li key={item.owner}>
        <strong>{item.owner}</strong><p>{item.task}</p><span>UNVERIFIED · no receipt accepted</span>
      </li>)}</ol>
      <label className="ql275-draft-label" htmlFor="ql275-draft">Read-only, sanitized exception handoff draft</label>
      <textarea id="ql275-draft" rows={9} readOnly value={handoff} />
      <div className="ql275-review-foot"><button type="button" onClick={() => void copyDraft()}>Copy handoff draft</button>
        <button type="button" onClick={onOpenEvidence}>Review six-app evidence</button>
        <button type="button" onClick={onOpenConnections}>Open connection preflight</button></div>
      <p role="status" aria-live="polite" className="ql275-copy-status">{copyStatus}</p>
      <p className="ql275-warning">No app connection, Ed25519 signer trust, source signature, independent custody, witness, owner TEST grant, live communications or authenticated gateway GET is established by this screen.</p>
    </div>}
  </section>;
}

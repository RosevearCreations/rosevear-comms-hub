import { useState } from 'react';
import type { OperatorOrganization } from './ql191Organizations';
import { mockKeypress, phoneEntries, phoneLineLabels, type PhoneFilter } from './ql195PhoneDesk';
import './ql195-phone-desk.css';

const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '0', '#'];

export function Ql195PhoneDesk({ organization, onOpenThread, onOpenQueue }: {
  organization: OperatorOrganization;
  onOpenThread: (threadId: string) => void;
  onOpenQueue: (threadId: string) => void;
}) {
  const entries = phoneEntries(organization.id);
  const [digits, setDigits] = useState('');
  const [filter, setFilter] = useState<PhoneFilter>('all');
  const [selectedId, setSelectedId] = useState(entries[0]?.id ?? '');
  const [showHelp, setShowHelp] = useState(false);
  const [showDescription, setShowDescription] = useState(false);
  const [result, setResult] = useState('Ready for a simulated keypad exercise. No call can be placed.');
  const visible = entries.filter((entry) => filter === 'all' || entry.kind === filter);
  const selected = visible.find((entry) => entry.id === selectedId) ?? visible[0];

  return (
    <section className="ql195-phone" data-ql195-release="ql195-phone-desk-v1" data-organization={organization.id} aria-labelledby="ql195-title">
      <header className="ql195-header">
        <div><p className="ql191-eyebrow">QL-195 · Four-company telephone workspace</p><h3 id="ql195-title">{organization.name} · Phone desk</h3>
          <p>Review fictional calls and voicemail placeholders for the selected business line.</p></div>
        <button type="button" className="ql191-help-button" aria-label="Help with the phone desk" aria-expanded={showHelp} aria-controls="ql195-help" onClick={() => setShowHelp((current) => !current)}>ⓘ Help</button>
      </header>
      {showHelp && <p id="ql195-help" className="ql195-note">The keypad is a local visual exercise: it does not accept a pasted number and cannot dial. Select a fictional call to read its description, then open the linked inbox or practice a follow-up. Voicemail descriptions are text fixtures, never playable audio. Switching companies clears keypad state and keeps histories separate.</p>}
      <p role="note" className="ql191-synthetic-banner">DISABLED SYNTHETIC PHONE DESK — no real phone numbers, carrier, Bell Fibe/cell connection, call origination, answering, voicemail audio, recording, playback, transcript, customer data, webhook, provider billing, or browser/server storage writes.</p>
      <div className="ql195-overview" aria-label="Mock phone desk summary">
        <div><span>Selected business line</span><strong>{phoneLineLabels[organization.id]}</strong><small>Label only · unconfigured</small></div>
        <div><span>Missed calls</span><strong>{entries.filter((item) => item.kind === 'missed').length}</strong><small>Fictional</small></div>
        <div><span>Voicemail placeholders</span><strong>{entries.filter((item) => item.kind === 'voicemail').length}</strong><small>No audio exists</small></div>
        <div><span>Live connectivity</span><strong>OFF</strong><small>12 pilot gates held</small></div>
      </div>
      <div className="ql195-layout">
        <section className="ql195-panel" aria-label="Demonstration dial pad">
          <h4>Mock dial pad</h4><p>Key presses change this display only.</p>
          <output className="ql195-digits" aria-label="Sample keypad digits">{digits || 'No digits entered'}</output>
          <div className="ql195-keys" role="group" aria-label="Sample keypad">
            {keys.map((key) => <button key={key} type="button" aria-label={`Mock key ${key}`} onClick={() => setDigits((current) => mockKeypress(current, key))}>{key}</button>)}
          </div>
          <div className="ql195-actions">
            <button type="button" onClick={() => setDigits((current) => current.slice(0, -1))}>Delete last</button>
            <button type="button" onClick={() => { setDigits(''); setResult('Mock keypad cleared. No call activity occurred.'); }}>Clear</button>
          </div>
          <button type="button" className="ql195-blocked" disabled>Place call · disabled</button>
          <p role="status" className="ql195-result">{result}</p>
        </section>
        <section className="ql195-panel" aria-label="Sample call and voicemail history">
          <div className="ql195-history-heading"><h4>Call history</h4><label htmlFor="ql195-filter">Show <select id="ql195-filter" value={filter} onChange={(event) => { setFilter(event.target.value as PhoneFilter); setShowDescription(false); }}><option value="all">All examples</option><option value="missed">Missed calls</option><option value="voicemail">Voicemail</option></select></label></div>
          <p role="status">{visible.length} synthetic records · {phoneLineLabels[organization.id]}</p>
          {visible.length ? <div className="ql195-history">
            <div className="ql195-list" aria-label="Select sample call">
              {visible.map((entry) => <button key={entry.id} type="button" aria-pressed={selected?.id === entry.id} className={selected?.id === entry.id ? 'active' : ''} onClick={() => { setSelectedId(entry.id); setShowDescription(false); }}><small>{entry.kind === 'missed' ? 'Missed call' : 'Voicemail'} · simulated</small><strong>{entry.subject}</strong><span>{entry.contactLabel}</span></button>)}
            </div>
            {selected && <div className="ql195-details"><h5>{selected.subject}</h5><p>{selected.contactLabel} · {selected.kind === 'missed' ? 'No call answered' : 'Voicemail placeholder'}</p>
              <button type="button" aria-expanded={showDescription} aria-controls="ql195-description" onClick={() => setShowDescription((current) => !current)}>{showDescription ? 'Hide' : 'Read'} fictional {selected.kind === 'voicemail' ? 'voicemail description' : 'call note'}</button>
              {showDescription && <p id="ql195-description" className="ql195-note">{selected.description}</p>}
              <p className="ql195-note">Audio player unavailable: there is no recording or transcription file.</p>
              <div className="ql195-actions"><button type="button" onClick={() => onOpenThread(selected.threadId)}>Open inbox source</button><button type="button" onClick={() => onOpenQueue(selected.threadId)}>Review follow-up</button></div>
              <button type="button" disabled>Play voicemail · unavailable</button>
            </div>}
          </div> : <p>No mock calls match this filter. Choose another history category.</p>}
        </section>
      </div>
    </section>
  );
}

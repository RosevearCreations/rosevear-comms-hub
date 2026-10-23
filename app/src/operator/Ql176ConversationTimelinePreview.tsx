import { useEffect, useMemo, useState } from 'react';
import type { BrandId } from '../types';
import { migrateQl173SyntheticFixtures } from '../fixtures/ql173CanonicalSynthetic';
import {
  getQl176BrandThreads, redactQl176Draft, stageQl176Draft, QL176_MAX_DRAFT_LENGTH,
  type Ql176DraftOverlay, type Ql176EventKind
} from './ql176ConversationTimeline';
import './ql176-conversation-timeline.css';

type TimelineFilter = 'all' | Ql176EventKind;

const eventLabels: Record<Ql176EventKind, string> = {
  conversation_opened: 'Opened', inbound_fixture: 'Inbound sample', internal_note: 'Internal note',
  draft_staged: 'Unsent draft', mock_delivery_failure: 'Training: failure example'
};

export function Ql176ConversationTimelinePreview({ brandId }: { brandId: BrandId }) {
  const migration = useMemo(() => migrateQl173SyntheticFixtures(), []);
  const [overlay, setOverlay] = useState<Ql176DraftOverlay>({});
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draftText, setDraftText] = useState('');
  const [filter, setFilter] = useState<TimelineFilter>('all');
  const [status, setStatus] = useState('Drafts are UNSENT / SIMULATED. No customer communication is possible.');
  const threads = useMemo(() => getQl176BrandThreads(migration, brandId, overlay), [migration, brandId, overlay]);
  const selected = threads.find(thread => thread.id === selectedId) ?? threads[0];
  const events = selected?.events.filter(event => filter === 'all' || event.kind === filter) ?? [];

  useEffect(() => {
    setDraftText(selected?.draft.text ?? '');
  }, [selected?.id, selected?.draft.text]);

  useEffect(() => {
    setSelectedId(null);
    setOverlay({});
    setFilter('all');
    setStatus('Brand switched. Staged draft edits and selection were discarded; only verified synthetic fixtures remain.');
  }, [brandId]);

  function stageDraft() {
    if (!selected) return;
    const next = stageQl176Draft(migration, brandId, overlay, selected.id, draftText, 'stage');
    if (next === overlay) {
      setStatus('Draft staging blocked by fixture, brand or operation guard.');
      return;
    }
    setOverlay(next);
    setStatus(`Staged synthetic draft for ${selected.subject}: UNSENT / SIMULATED. Nothing was transmitted, stored or approved.`);
  }

  function discardDraft() {
    if (!selected) return;
    setOverlay(previous => stageQl176Draft(migration, brandId, previous, selected.id, '', 'discard'));
    setDraftText(getQl176BrandThreads(migration, brandId).find(thread => thread.id === selected.id)?.draft.text ?? '');
    setStatus('Local draft discarded; original synthetic fixture restored. No message was transmitted, stored or approved.');
  }

  return (
    <section className="ql176-preview" aria-label="QL-176 synthetic conversation timeline and unsent draft workspace">
      <header className="ql176-heading">
        <div>
          <p className="ql176-eyebrow">QL-176 · timeline and draft laboratory</p>
          <h3>Conversation timeline & unsent drafts</h3>
          <p>Channel-aware sample events, internal notes and clearly illustrative delivery failures, sourced from verified QL-173 fixtures.</p>
        </div>
        <strong className="ql176-lock">DISABLED PREVIEW · NO SEND</strong>
      </header>
      <p className="ql176-warning" role="note">
        Use synthetic text only—never enter customer details, contact information or credentials. Drafts remain in screen memory, with identifiers redacted immediately. There is no send, provider, owner approval, archive, persistence or export path.
      </p>
      {!migration.verified && <p className="ql176-error" role="alert">Source fixture validation failed. Timeline and draft records are blocked pending review.</p>}
      <div className="ql176-grid">
        <section className="ql176-thread-list" aria-label="Synthetic conversation selection">
          <h4>Threads · {brandId === 'rosiedazzlers' ? 'Rosie Dazzlers' : 'Devil n Dove'}</h4>
          <p>{threads.length} canonical sample conversations</p>
          {threads.length === 0 && <p>No verified sample threads available.</p>}
          {threads.map(thread => (
            <button
              key={thread.id}
              type="button"
              className={selected?.id === thread.id ? 'ql176-thread active' : 'ql176-thread'}
              aria-pressed={selected?.id === thread.id}
              onClick={() => { setSelectedId(thread.id); setFilter('all'); }}
            >
              <strong>{thread.subject}</strong>
              <span>{thread.contactLabel}</span>
              <small>{thread.sourceChannel.replaceAll('_', ' ')} · {thread.events.length} events · {thread.draft.text ? 'Draft UNSENT / SIMULATED' : 'No staged fixture draft'}</small>
            </button>
          ))}
        </section>
        <section className="ql176-detail" aria-label="Selected synthetic timeline and draft editor">
          {selected ? (
            <>
              <p className="ql176-eyebrow">Synthetic only · {selected.fixtureLabel}</p>
              <h4>{selected.subject}</h4>
              <p className="ql176-detail-subtitle">{selected.contactLabel} · {selected.sourceChannel.replaceAll('_', ' ')} · no real messages</p>
              <section className="ql176-timeline" aria-label="Synthetic channel-aware events">
                <div className="ql176-section-head">
                  <h5>Event timeline ({events.length})</h5>
                  <label>
                    Event type
                    <select aria-label="Filter synthetic timeline events" value={filter} onChange={event => setFilter(event.target.value as TimelineFilter)}>
                      <option value="all">All events</option>
                      {Object.entries(eventLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                    </select>
                  </label>
                </div>
                {events.length === 0 && <p>No synthetic events match this filter.</p>}
                <ol>
                  {events.map(event => (
                    <li key={event.id} className={event.kind === 'mock_delivery_failure' ? 'ql176-event failure-example' : 'ql176-event'}>
                      <span className="ql176-event-meta"><strong>{eventLabels[event.kind]}</strong><small>{event.occurredAt}</small></span>
                      <p>{event.label}</p>
                      <p>{event.detail}</p>
                      <span className="ql176-event-provenance">Channel: {event.channel.replaceAll('_', ' ')} · State: {event.deliveryState.replaceAll('_', ' ')} · {event.sourceLabel}</span>
                    </li>
                  ))}
                </ol>
              </section>
              <section className="ql176-editor" aria-label="Synthetic unsent draft composition">
                <div className="ql176-section-head">
                  <h5>Draft composition · local demonstration</h5>
                  <strong className="ql176-unsent">UNSENT / SIMULATED</strong>
                </div>
                <p>This text never becomes an outbound message. Redaction replaces recognizable emails, phone numbers, URLs and tokens as you type.</p>
                <label htmlFor="ql176-draft-input">Synthetic draft text — do not enter private information</label>
                <textarea
                  id="ql176-draft-input" aria-describedby="ql176-draft-help"
                  maxLength={QL176_MAX_DRAFT_LENGTH} rows={5} value={draftText}
                  placeholder="Example: We can review synthetic request details during business hours."
                  onChange={event => setDraftText(redactQl176Draft(event.target.value))}
                />
                <p id="ql176-draft-help">{draftText.length}/{QL176_MAX_DRAFT_LENGTH} characters · preview-only, no autosave, no copy/export tool, no approval, no send</p>
                <div className="ql176-actions">
                  <button type="button" className="ql176-stage" onClick={stageDraft}>Stage unsent simulation</button>
                  <button type="button" onClick={discardDraft}>Discard local edit</button>
                </div>
                <p className="ql176-feedback" role="status" aria-live="polite">{status}</p>
              </section>
            </>
          ) : <p>No verified synthetic conversation is selected. Nothing can be sent.</p>}
        </section>
      </div>
    </section>
  );
}

import { useEffect, useMemo, useState } from 'react';
import type { BrandId } from '../types';
import { migrateQl173SyntheticFixtures } from '../fixtures/ql173CanonicalSynthetic';
import {
  QL179_FIXTURE_SET, emptyQl179Replay, getQl179MockScenarios, getQl179OperatorFeed,
  simulateQl179MockReceipt, type Ql179Channel, type Ql179Replay
} from './ql179MockPhoneSms';
import './ql179-mock-phone-sms.css';

type FeedFilter = 'all' | Ql179Channel | 'blocked_or_failed';
const resultLabels: Readonly<Record<Ql179Replay['lastResult'], string>> = {
  READY: 'No events injected. Select a pinned mock receipt to practice the workflow.',
  ACCEPTED_MOCK: 'Mock event accepted into screen memory only. No webhook was received and no customer was contacted.',
  DUPLICATE_IGNORED: 'Idempotency gate: duplicate mock event ignored; operator feed unchanged.',
  REJECTED_MOCK: 'Mock receipt rejected by fixture, brand, version or replay safety checks.'
};

export function Ql179PhoneSmsEventEmulator({ brandId }: { brandId: BrandId }) {
  const migration = useMemo(() => migrateQl173SyntheticFixtures(), []);
  const scenarios = useMemo(() => getQl179MockScenarios(migration, brandId), [migration, brandId]);
  const [selectedId, setSelectedId] = useState('');
  const [history, setHistory] = useState<Ql179Replay>(emptyQl179Replay);
  const [filter, setFilter] = useState<FeedFilter>('all');
  const selected = scenarios.find(row => row.event.id === selectedId) ?? scenarios[0] ?? null;
  const feed = useMemo(() => getQl179OperatorFeed(migration, brandId, history), [migration, brandId, history]);
  const visible = feed.filter(row => filter === 'all' || row.event.channel === filter ||
    (filter === 'blocked_or_failed' && ['BLOCKED_MOCK', 'FAILED_MOCK'].includes(row.event.status)));

  useEffect(() => {
    setSelectedId('');
    setHistory(emptyQl179Replay());
    setFilter('all');
  }, [brandId]);

  function inject() {
    if (selected) setHistory(previous => simulateQl179MockReceipt(migration, brandId, previous, selected));
  }

  function injectAll() {
    setHistory(previous => scenarios.reduce((current, row) => simulateQl179MockReceipt(migration, brandId, current, row), previous));
  }

  return (
    <section className="ql179-emulator" aria-label="QL-179 provider-neutral phone and SMS mock event emulator">
      <header className="ql179-header">
        <div>
          <p className="ql179-eyebrow">QL-179 · pinned provider-neutral mock events</p>
          <h3>Phone & SMS event emulator</h3>
          <p>Explore inbound calls, missed calls, voicemail, inbound SMS and blocked outbound intentions without touching a carrier or customer.</p>
        </div>
        <strong className="ql179-lock">DISABLED PREVIEW · NO PHONE OR SMS</strong>
      </header>
      <p className="ql179-safety" role="note">
        Mock-only contract: {QL179_FIXTURE_SET}. This is not a real webhook endpoint or real signature verification.
        No phone numbers, message text, provider IDs, recordings, credentials, callbacks, live dispatch, browser storage or Supabase writes.
      </p>
      {!migration.verified && <p role="alert">Pinned fixture verification failed. Mock event injection is blocked.</p>}
      <div className="ql179-dashboard">
        <div><span>Brand</span><strong>{brandId === 'rosiedazzlers' ? 'Rosie Dazzlers' : 'Devil n Dove'}</strong></div>
        <div><span>Available fixtures</span><strong>{scenarios.length}</strong></div>
        <div><span>Accepted mock receipts</span><strong>{history.receipts.length}</strong></div>
        <div><span>Outbound dispatched</span><strong>0 · LOCKED</strong></div>
      </div>
      <div className="ql179-layout">
        <section className="ql179-controls" aria-label="Mock-only event injection controls">
          <h4>Inject a checked-in synthetic event</h4>
          <label htmlFor="ql179-fixture">Sample phone/SMS event</label>
          <select id="ql179-fixture" value={selected?.event.id ?? ''} disabled={!selected}
            onChange={event => setSelectedId(event.target.value)}>
            {scenarios.map(row => <option key={row.event.id} value={row.event.id}>{row.event.kind.replaceAll('_', ' ')} · {row.event.label}</option>)}
          </select>
          {selected && (
            <dl className="ql179-contract">
              <div><dt>Channel</dt><dd>{selected.event.channel.toUpperCase()}</dd></div>
              <div><dt>Direction</dt><dd>{selected.event.direction.replaceAll('_', ' ')}</dd></div>
              <div><dt>Status</dt><dd>{selected.event.status}</dd></div>
              <div><dt>Error code</dt><dd>{selected.event.error}</dd></div>
              <div><dt>Receipt mode</dt><dd>{selected.transport} · NO REAL SIGNATURE</dd></div>
              <div><dt>Idempotency key</dt><dd>{selected.event.idempotencyKey}</dd></div>
            </dl>
          )}
          <div className="ql179-buttons">
            <button type="button" disabled={!selected} onClick={inject}>Inject mock receipt</button>
            <button type="button" disabled={!selected} onClick={inject}>Replay selected mock</button>
            <button type="button" disabled={!scenarios.length} onClick={injectAll}>Replay all pinned samples</button>
            <button type="button" onClick={() => setHistory(emptyQl179Replay())}>Reset local receipts</button>
          </div>
          <p role="status" aria-live="polite" className="ql179-result">{resultLabels[history.lastResult]}</p>
          <p className="ql179-boundary">IN-MEMORY CONTRACT CHECK ONLY · NO WEBHOOK LISTENER · NO SIGNATURE VALIDATION · NO SMS SEND · NO CALL ORIGINATION</p>
        </section>
        <section className="ql179-feed" aria-label="Brand-isolated operator mock phone and SMS event feed">
          <div className="ql179-feed-head">
            <div><h4>Operator event feed</h4><p>Linked to verified QL-173 conversations and QL-178 sample follow-up tasks</p></div>
            <label htmlFor="ql179-filter">Show
              <select id="ql179-filter" value={filter} onChange={event => setFilter(event.target.value as FeedFilter)}>
                <option value="all">All mock events</option>
                <option value="voice">Voice</option>
                <option value="sms">SMS</option>
                <option value="blocked_or_failed">Blocked / failure examples</option>
              </select>
            </label>
          </div>
          <p role="status">{visible.length} matching events · {feed.length} accepted · simulated-only</p>
          {visible.length === 0 ? <p className="ql179-empty">No mock receipts match this view. Try one of the pinned scenarios.</p> : (
            <ol className="ql179-events">{visible.map(row => (
              <li key={row.event.id}>
                <div className="ql179-event-top"><strong>{row.sequence}. {row.event.label}</strong><span>{row.event.status}</span></div>
                <p>{row.subject}</p>
                <small>QL-178 follow-up: {row.taskTitle}</small>
                <small>{row.event.channel.toUpperCase()} · {row.event.occurredAt} · error: {row.event.error}</small>
                <strong className="ql179-event-stamp">SIMULATED_ONLY · no provider receipt</strong>
              </li>
            ))}</ol>
          )}
        </section>
      </div>
    </section>
  );
}

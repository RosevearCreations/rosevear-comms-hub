import { useMemo, useState } from 'react';
import type { OperatorOrganization } from './ql191Organizations';
import { inboxChannels, inboxForOrganization, type InboxChannel, type InboxThread } from './ql192InboxFixtures';
import { customerForThread } from './ql193CustomerContexts';
import './ql192-inbox.css';

type ViewFilter = 'all' | 'unread' | 'needs_reply' | 'follow_up';
const viewFilters: ReadonlyArray<{ id: ViewFilter; label: string }> = [
  { id: 'all', label: 'All conversations' },
  { id: 'unread', label: 'Unread' },
  { id: 'needs_reply', label: 'Needs reply' },
  { id: 'follow_up', label: 'Follow-up' }
];

function matchesText(thread: InboxThread, query: string): boolean {
  const text = [thread.contactLabel, thread.subject, thread.summary, thread.channel, thread.context, ...thread.events.map((event) => event.body)].join(' ').toLocaleLowerCase();
  return text.includes(query.trim().toLocaleLowerCase());
}

export function Ql192UnifiedInbox({ organization, initialThreadId, onOpenContact, onOpenQueue }: {
  organization: OperatorOrganization;
  initialThreadId?: string | null;
  onOpenContact?: (contactId: string) => void;
  onOpenQueue?: (threadId: string) => void;
}) {
  const threads = inboxForOrganization(organization.id);
  const [selectedId, setSelectedId] = useState(threads.some((thread) => thread.id === initialThreadId) ? initialThreadId! : (threads[0]?.id ?? ''));
  const [search, setSearch] = useState('');
  const [channel, setChannel] = useState<InboxChannel | 'all'>('all');
  const [view, setView] = useState<ViewFilter>('all');
  const [readOverrides, setReadOverrides] = useState<ReadonlySet<string>>(() => new Set());
  const [followUpOverrides, setFollowUpOverrides] = useState<Readonly<Record<string, boolean>>>({});
  const [showHelp, setShowHelp] = useState(false);

  const isUnread = (thread: InboxThread) => thread.unread && !readOverrides.has(thread.id);
  const isFollowUp = (thread: InboxThread) => followUpOverrides[thread.id] ?? thread.needsFollowUp;
  const filtered = useMemo(() => threads.filter((thread) =>
    (channel === 'all' || thread.channel === channel) && matchesText(thread, search) &&
    (view === 'all' || (view === 'unread' && isUnread(thread)) ||
      (view === 'needs_reply' && thread.status === 'needs_reply') ||
      (view === 'follow_up' && isFollowUp(thread)))
  ), [threads, channel, search, view, readOverrides, followUpOverrides]);
  const selected = filtered.find((thread) => thread.id === selectedId) ?? filtered[0];

  const totals = {
    conversations: threads.length,
    unread: threads.filter(isUnread).length,
    needsReply: threads.filter((thread) => thread.status === 'needs_reply').length,
    followUps: threads.filter(isFollowUp).length
  };

  function markRead(thread: InboxThread) {
    setReadOverrides((previous) => new Set(previous).add(thread.id));
  }

  function toggleFollowUp(thread: InboxThread) {
    setFollowUpOverrides((previous) => ({ ...previous, [thread.id]: !(previous[thread.id] ?? thread.needsFollowUp) }));
  }

  function resetFilters() { setSearch(''); setChannel('all'); setView('all'); }

  return (
    <section className="ql192-inbox" data-ql192-release="ql192-unified-four-company-inbox-v1" data-organization={organization.id} aria-labelledby="ql192-inbox-heading">
      <div className="ql192-inbox-header">
        <div>
          <p className="ql191-eyebrow">QL-192 · Unified communications</p>
          <h3 id="ql192-inbox-heading">{organization.name} inbox</h3>
          <p>Review one fictional timeline across phone, SMS, MMS, voicemail, email, website and internal channels.</p>
        </div>
        <button type="button" className="ql191-help-button" aria-label="Help with unified communications inbox" aria-expanded={showHelp} aria-controls="ql192-inbox-help" onClick={() => setShowHelp((previous) => !previous)}>ⓘ Help</button>
      </div>
      {showHelp && (
        <p id="ql192-inbox-help" className="ql191-help-content" role="note">Use the search box, channel selector and queue filters to find a sample conversation. Select a thread to inspect its timeline. Marking a thread reviewed or flagging a follow-up changes this demonstration screen only; no message is sent and nothing is saved to a server or the browser.</p>
      )}
      <p className="ql191-synthetic-banner" role="note">DISABLED SYNTHETIC INBOX — fictional contacts and events only. No phone/SMS, mailbox, website, booking, tenant, customer or provider connection. Do not enter real personal information.</p>

      <div className="ql192-inbox-stats" aria-label="Synthetic inbox counts">
        <div><strong>{totals.conversations}</strong><span>Demo threads</span></div>
        <div><strong>{totals.unread}</strong><span>Unread examples</span></div>
        <div><strong>{totals.needsReply}</strong><span>Need reply</span></div>
        <div><strong>{totals.followUps}</strong><span>Follow-up flags</span></div>
      </div>

      <div className="ql192-inbox-layout">
        <section className="ql192-list-panel" aria-label="Conversation queue">
          <div className="ql192-inbox-search">
            <label htmlFor="ql192-search">Search sample threads</label>
            <input id="ql192-search" type="search" autoComplete="off" placeholder="Subject, channel or sample text" value={search} onChange={(event) => setSearch(event.target.value)} />
            <label htmlFor="ql192-channel">Channel</label>
            <select id="ql192-channel" value={channel} onChange={(event) => setChannel(event.target.value as InboxChannel | 'all')}>
              {inboxChannels.map((entry) => <option key={entry.id} value={entry.id}>{entry.label}</option>)}
            </select>
          </div>
          <div className="ql192-view-filters" role="group" aria-label="Conversation filters">
            {viewFilters.map((entry) => (
              <button key={entry.id} type="button" aria-pressed={view === entry.id} className={view === entry.id ? 'ql192-view-filter active' : 'ql192-view-filter'} onClick={() => setView(entry.id)}>{entry.label}</button>
            ))}
          </div>
          <p className="ql192-result-count" role="status">{filtered.length} of {threads.length} synthetic conversations</p>
          {filtered.length === 0 ? (
            <div className="ql192-empty"><p>No demonstration conversations match these filters.</p><button type="button" onClick={resetFilters}>Clear filters</button></div>
          ) : (
            <div className="ql192-thread-list" aria-label="Matching conversations">
              {filtered.map((thread) => (
                <button key={thread.id} type="button" className={selected?.id === thread.id ? 'ql192-thread active' : 'ql192-thread'} aria-pressed={selected?.id === thread.id} onClick={() => setSelectedId(thread.id)}>
                  <span className="ql192-thread-top"><span>{thread.sourceLabel}</span>{isUnread(thread) && <strong className="ql192-unread">Unread</strong>}</span>
                  <strong>{thread.subject}</strong>
                  <span>{thread.contactLabel}</span>
                  <small>{thread.summary}</small>
                  <span className="ql192-thread-tags"><span>{thread.status.replaceAll('_', ' ')}</span>{isFollowUp(thread) && <span>Follow-up</span>}{thread.priority === 'high' && <span>Priority</span>}</span>
                </button>
              ))}
            </div>
          )}
        </section>

        <section className="ql192-detail-panel" aria-label="Selected conversation detail">
          {selected ? (
            <>
              <header className="ql192-detail-header">
                <p className="ql191-eyebrow">Selected conversation · synthetic</p>
                <h4>{selected.subject}</h4>
                <p>{selected.contactLabel} · {selected.sourceLabel}</p>
                <p className="ql192-context">{selected.context}</p>
                <div className="ql192-detail-actions">
                  <button type="button" onClick={() => markRead(selected)} disabled={!isUnread(selected)}>{isUnread(selected) ? 'Mark reviewed (demo)' : 'Reviewed in demo'}</button>
                  <button type="button" onClick={() => toggleFollowUp(selected)} aria-pressed={isFollowUp(selected)}>{isFollowUp(selected) ? 'Remove follow-up flag' : 'Flag follow-up (demo)'}</button>
                  {onOpenQueue && <button type="button" onClick={() => onOpenQueue(selected.id)}>Manage follow-up queue</button>}
                </div>
              </header>
              <div className="ql192-consent" role="status">
                <strong>Consent:</strong> {selected.consent === 'opted_out' ? 'Opt-out indicated in test fixture; promotional send prohibited.' : selected.consent === 'service_only' ? 'Service-only demonstration; marketing not authorized.' : 'Unknown; no outbound communication authorized.'}
              </div>
              {(() => {
                const linked = customerForThread(organization.id, selected.id);
                return linked && onOpenContact ? <div className="ql192-contact-link">
                  <strong>Linked fictional contact:</strong> {linked.label}
                  <button type="button" onClick={() => onOpenContact(linked.id)}>Open Customer 360</button>
                </div> : <p className="ql192-nonpersistent">This internal source has no customer profile. No identity is inferred.</p>;
              })()}
              <div className="ql192-timeline" aria-label="Synthetic communication timeline">
                <h5>Conversation timeline</h5>
                <ol>{selected.events.map((event) => (
                  <li key={event.id} className={`ql192-event ql192-${event.kind}`}>
                    <span>{event.timeLabel} · {event.kind.replaceAll('_', ' ')}</span>
                    <p>{event.body}</p>
                  </li>
                ))}</ol>
              </div>
              <div className="ql192-composer" aria-label="Disabled reply composer">
                <label htmlFor="ql192-compose">Reply composer — disabled</label>
                <textarea id="ql192-compose" rows={3} disabled placeholder="Real replies and drafts are disabled until server permissions, consent and provider integration are approved." />
                <button type="button" disabled>Send disabled</button>
              </div>
              <p className="ql192-nonpersistent">Review and follow-up indicators reset when this inbox unmounts. They are not authorizations, assignments, saved messages, or audit records.</p>
            </>
          ) : <p className="ql192-no-selection">Choose a different filter or clear your search to inspect a sample conversation.</p>}
        </section>
      </div>
    </section>
  );
}

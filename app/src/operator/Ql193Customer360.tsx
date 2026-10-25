import { useMemo, useState } from 'react';
import type { OperatorOrganization } from './ql191Organizations';
import { customerChannelCount, customersForOrganization, customerThreads, restrictiveConsent } from './ql193CustomerContexts';
import './ql193-customer-360.css';

type ListFilter = 'all' | 'attention' | 'multi_channel';

export function Ql193Customer360({ organization, initialContactId, onOpenThread, onOpenQueue }: {
  organization: OperatorOrganization;
  initialContactId?: string | null;
  onOpenThread: (threadId: string) => void;
  onOpenQueue?: (threadId: string) => void;
}) {
  const contacts = customersForOrganization(organization.id);
  const [selectedId, setSelectedId] = useState(contacts.some((contact) => contact.id === initialContactId) ? initialContactId : contacts[0]?.id);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<ListFilter>('all');
  const [showHelp, setShowHelp] = useState(false);

  const filtered = useMemo(() => contacts.filter((contact) => {
    const threads = customerThreads(organization.id, contact);
    const haystack = [contact.label, contact.context, ...threads.flatMap((thread) => [thread.subject, thread.summary, thread.channel])].join(' ').toLocaleLowerCase();
    return haystack.includes(search.trim().toLocaleLowerCase()) && (
      filter === 'all' ||
      (filter === 'attention' && threads.some((thread) => thread.status === 'needs_reply' || thread.needsFollowUp)) ||
      (filter === 'multi_channel' && customerChannelCount(threads) > 1)
    );
  }), [contacts, organization.id, search, filter]);
  const selected = filtered.find((contact) => contact.id === selectedId) ?? filtered[0];
  const threads = selected ? customerThreads(organization.id, selected) : [];
  const consent = restrictiveConsent(threads);
  const channels = [...new Set(threads.map((thread) => thread.channel))];
  const needsReply = threads.filter((thread) => thread.status === 'needs_reply').length;
  const followUps = threads.filter((thread) => thread.needsFollowUp).length;

  return (
    <section className="ql193-customer-360" data-ql193-release="ql193-customer-360-cross-channel-v1" data-organization={organization.id} aria-labelledby="ql193-heading">
      <header className="ql193-header">
        <div>
          <p className="ql191-eyebrow">QL-193 · Contact context</p>
          <h3 id="ql193-heading">{organization.name} · Customer 360</h3>
          <p>View explicit sample contact links, source channels and follow-up context in one place.</p>
        </div>
        <button type="button" className="ql191-help-button" aria-expanded={showHelp} aria-controls="ql193-help" aria-label="Help with Customer 360" onClick={() => setShowHelp((previous) => !previous)}>ⓘ Help</button>
      </header>
      {showHelp && <p id="ql193-help" role="note" className="ql193-help">Choose a fictional person, inspect the exact source conversations, and open any source in the unified inbox. Two conversations are linked only when this synthetic fixture explicitly says so. Names are never used for automatic matching. Changing companies discards the view selection. There is no customer database, contact enrichment, merge, send, or synchronization.</p>}
      <p className="ql191-synthetic-banner" role="note">DISABLED CUSTOMER 360 PREVIEW — fabricated identities and links only. Each company is isolated. iCamp tenant and YW company records are not connected. No live customer data, contact matching, outbound messages, server access or storage writes.</p>

      <div className="ql193-summary" aria-label="Customer 360 sample summary">
        <div><strong>{contacts.length}</strong><span>Fictional profiles</span></div>
        <div><strong>{contacts.filter((contact) => customerChannelCount(customerThreads(organization.id, contact)) > 1).length}</strong><span>Cross-channel examples</span></div>
        <div><strong>{contacts.flatMap((contact) => customerThreads(organization.id, contact)).length}</strong><span>Linked conversations</span></div>
      </div>

      <div className="ql193-layout">
        <section className="ql193-directory" aria-label="Fictional contact directory">
          <label htmlFor="ql193-search">Search customer context</label>
          <input id="ql193-search" type="search" autoComplete="off" placeholder="Name, subject or service" value={search} onChange={(event) => setSearch(event.target.value)} />
          <div className="ql193-filters" role="group" aria-label="Contact list filters">
            {([
              ['all', 'All contacts'], ['attention', 'Needs attention'], ['multi_channel', 'Multiple channels']
            ] as const).map(([id, label]) => <button key={id} type="button" aria-pressed={filter === id} className={filter === id ? 'active' : ''} onClick={() => setFilter(id)}>{label}</button>)}
          </div>
          <p className="ql193-count" role="status">{filtered.length} of {contacts.length} fictional contacts</p>
          {filtered.length === 0 ? (
            <div className="ql193-empty"><p>No contacts match these sample filters.</p><button type="button" onClick={() => { setSearch(''); setFilter('all'); }}>Clear contact filters</button></div>
          ) : (
            <div className="ql193-contact-list">
              {filtered.map((contact) => {
                const items = customerThreads(organization.id, contact);
                return <button key={contact.id} type="button" className={selected?.id === contact.id ? 'ql193-contact active' : 'ql193-contact'} aria-pressed={selected?.id === contact.id} onClick={() => setSelectedId(contact.id)}>
                  <strong>{contact.label}</strong>
                  <span>{items.length} {items.length === 1 ? 'conversation' : 'conversations'} · {customerChannelCount(items)} {customerChannelCount(items) === 1 ? 'channel' : 'channels'}</span>
                  <small>{contact.context}</small>
                </button>;
              })}
            </div>
          )}
          <p className="ql193-footnote">Internal staff/team notes are not treated as customers or silently linked to personal profiles.</p>
        </section>

        <section className="ql193-profile" aria-label="Selected fictional customer profile">
          {selected ? (
            <>
              <p className="ql191-eyebrow">Customer context · fixture-only</p>
              <h4>{selected.label}</h4>
              <p>{selected.context}</p>
              <div className="ql193-identity" role="note"><strong>Identity evidence:</strong> Manually linked in the test fixture; not customer-verified, inferred from names, or shared across companies. Real identity verification is required before any future merge.</div>
              <dl className="ql193-profile-stats">
                <div><dt>Conversations</dt><dd>{threads.length}</dd></div>
                <div><dt>Channels</dt><dd>{channels.length}</dd></div>
                <div><dt>Need reply</dt><dd>{needsReply}</dd></div>
                <div><dt>Follow-ups</dt><dd>{followUps}</dd></div>
              </dl>
              <div className="ql193-consent" role="status">
                <strong>Contact-wide consent precaution: </strong>
                {consent === 'opted_out' ? 'A linked channel indicates opt-out. Marketing is prohibited in this example.' :
                  consent === 'service_only' ? 'Only service-purpose fixture context is present. Marketing is not authorized.' :
                    'Unknown or unverified across sources. No outbound messaging is authorized.'}
                <p>Original per-thread statuses remain visible below. An opt-out is never overridden by another channel.</p>
              </div>
              <section className="ql193-linked-sources" aria-labelledby="ql193-sources-heading">
                <h5 id="ql193-sources-heading">Linked channels & source conversations</h5>
                <p>Grouped by explicitly linked source thread, not by verified timestamps. All events are fictional.</p>
                {threads.map((thread) => <article key={thread.id} className="ql193-source" data-thread-id={thread.id}>
                  <header><span className="ql193-channel">{thread.channel.toUpperCase()}</span><span>{thread.status.replaceAll('_', ' ')}</span></header>
                  <h6>{thread.subject}</h6>
                  <p>{thread.sourceLabel} · Consent: {thread.consent.replaceAll('_', ' ')}</p>
                  <ul>{thread.events.map((event) => <li key={event.id}><strong>{event.timeLabel}</strong> · {event.body}</li>)}</ul>
                  <button type="button" onClick={() => onOpenThread(thread.id)}>View in unified inbox: {thread.subject}</button>
                  {onOpenQueue && <button type="button" onClick={() => onOpenQueue(thread.id)}>Manage follow-up: {thread.subject}</button>}
                </article>)}
              </section>
              <div className="ql193-disabled-actions" aria-label="Disabled live customer actions"><button type="button" disabled>Merge contacts disabled</button><button type="button" disabled>Sync customer disabled</button><button type="button" disabled>Send message disabled</button></div>
            </>
          ) : <p className="ql193-empty">Select a fictional contact to see the synthetic source history.</p>}
        </section>
      </div>
    </section>
  );
}

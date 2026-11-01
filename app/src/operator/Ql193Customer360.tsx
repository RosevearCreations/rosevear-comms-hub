import { useMemo, useState, type Dispatch, type SetStateAction } from 'react';
import type { OperatorOrganization } from './ql191Organizations';
import { customerChannelCount, customersForOrganization, customerThreads, restrictiveConsent } from './ql193CustomerContexts';
import { candidateForContact, candidatePeer, duplicateCandidates, ql295ConsentPosture, ql295PermissionGate, ql295TasksForContact, reviewQl295Candidate, type Ql295DuplicateDisposition, type Ql295ReviewState } from './ql295ContactReview';
import { rosterForOrganization, type MockQueueState } from './ql194WorkQueue';
import './ql193-customer-360.css';

type ListFilter = 'all' | 'attention' | 'multi_channel';

export function Ql193Customer360({ organization, initialContactId, onOpenThread, onOpenQueue, queue, reviewState, setReviewState }: {
  organization: OperatorOrganization;
  initialContactId?: string | null;
  onOpenThread: (threadId: string) => void;
  onOpenQueue?: (threadId: string) => void;
  queue: MockQueueState;
  reviewState: Ql295ReviewState;
  setReviewState: Dispatch<SetStateAction<Ql295ReviewState>>;
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
  const posture = ql295ConsentPosture(threads);
  const tasks = selected ? ql295TasksForContact(organization.id, selected, queue) : [];
  const activeTasks = tasks.filter((task) => task.status !== 'done');
  const roster = rosterForOrganization(organization.id);
  const candidate = selected ? candidateForContact(organization.id, selected.id) : undefined;
  const candidatePeerContact = candidate && selected ? candidatePeer(organization.id, candidate, selected.id) : undefined;
  const candidateReview = candidate && reviewState.organizationId === organization.id ? reviewState.reviews.find((review) => review.candidateId === candidate.id) : undefined;

  function disposition(value: Ql295DuplicateDisposition) {
    if (!candidate) return;
    setReviewState((previous) => reviewQl295Candidate(organization.id, previous, candidate.id, value));
  }

  return (
    <section className="ql193-customer-360" data-ql193-release="ql193-customer-360-cross-channel-v1" data-ql295-release="ql295-brand-safe-contact-consent-duplicate-review-v1" data-organization={organization.id} aria-labelledby="ql193-heading">
      <header className="ql193-header">
        <div>
          <p className="ql191-eyebrow">QL-295 · Brand-safe contact workbench</p>
          <h3 id="ql193-heading">{organization.name} · Customer 360</h3>
          <p>Review linked conversations, open assignments, consent sources and possible duplicate examples in one place.</p>
        </div>
        <button type="button" className="ql191-help-button" aria-expanded={showHelp} aria-controls="ql193-help" aria-label="Help with Customer 360" onClick={() => setShowHelp((previous) => !previous)}>ⓘ Help</button>
      </header>
      {showHelp && <p id="ql193-help" role="note" className="ql193-help">Choose a fictional person, inspect linked source conversations and related sample assignments, and open the original inbox or worklist. Two conversations are linked only when this synthetic fixture explicitly says so. Names are never used for automatic matching. Duplicate candidates are authored rehearsal scenarios, never confirmed identities. Marketing consent is never granted by an unknown or service-only source. Changing companies clears local review decisions. There is no customer database, contact enrichment, merge, send, or synchronization.</p>}
      <p className="ql191-synthetic-banner" role="note">DISABLED CUSTOMER 360 PREVIEW — fabricated identities, assignments, consent labels and possible-duplicate cases only. Each company is isolated. iCamp tenant and YW company records are not connected. No live customer data, contact matching, consent updates, outbound messages, server access or storage writes.</p>

      <div className="ql193-summary" aria-label="Customer 360 sample summary">
        <div><strong>{contacts.length}</strong><span>Fictional profiles</span></div>
        <div><strong>{contacts.filter((contact) => customerChannelCount(customerThreads(organization.id, contact)) > 1).length}</strong><span>Cross-channel examples</span></div>
        <div><strong>{contacts.flatMap((contact) => customerThreads(organization.id, contact)).length}</strong><span>Linked conversations</span></div>
        <div><strong>{queue.organizationId === organization.id ? queue.tasks.filter((task) => task.status !== 'done' && task.organizationId === organization.id && contacts.some((contact) => contact.threadIds.includes(task.threadId))).length : 0}</strong><span>Open linked demo tasks</span></div>
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
                  <small>{ql295TasksForContact(organization.id, contact, queue).filter((task) => task.status !== 'done').length} open linked tasks · {ql295ConsentPosture(items).label}</small>
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
              <section className="ql295-preferences" aria-labelledby="ql295-consent-title">
                <div className="ql295-section-heading"><div><p className="ql191-eyebrow">Source-specific permissions · read-only</p><h5 id="ql295-consent-title">Consent &amp; communication preferences</h5></div><span className="ql295-caution">{posture.label}</span></div>
                <p>{posture.reason} No channel has been independently verified as marketing-allowed. The stricter contact-wide posture always wins.</p>
                <ul>{posture.sources.map((source) => <li key={source.threadId}><strong>{source.channel.toUpperCase()}</strong><span>{source.consent === 'opted_out' ? 'Opted out' : source.consent === 'service_only' ? 'Service only' : 'Unknown / unverified'}</span><small>Fixture source: {source.threadId}</small></li>)}</ul>
                <p className="ql295-no-permission" role="note">Marketing permission: NOT VERIFIED · Message delivery remains disabled. A local review cannot change consent.</p>
              </section>
              <section className="ql295-tasks" aria-labelledby="ql295-tasks-title">
                <div className="ql295-section-heading"><div><p className="ql191-eyebrow">QL-294 assignment context</p><h5 id="ql295-tasks-title">Linked operator work</h5></div><span>{activeTasks.length} active / {tasks.length} sample tasks</span></div>
                {tasks.length ? <ul>{tasks.map((task) => <li key={task.id}><div><strong>{task.title}</strong><small>{task.status === 'waiting' ? 'Waiting / blocked' : task.status} · {task.due} example · {roster.find((person) => person.id === task.ownerId)?.label ?? 'Unassigned'}</small></div>{onOpenQueue && <button type="button" onClick={() => onOpenQueue(task.threadId)}>Open assignment</button>}</li>)}</ul> : <p>No explicit task is linked to this fictional contact. This does not prove there is no work in a real CRM.</p>}
              </section>
              <section className="ql295-duplicates" aria-labelledby="ql295-duplicates-title">
                <div className="ql295-section-heading"><div><p className="ql191-eyebrow">Identity review · no automatic matching</p><h5 id="ql295-duplicates-title">Possible duplicate review</h5></div><span>{duplicateCandidates(organization.id).length} fictional candidate / 0 confirmed matches</span></div>
                {candidate && candidatePeerContact ? <>
                  <p><strong>Possible candidate only:</strong> {selected.label} ↔ {candidatePeerContact.label}</p>
                  <p>{candidate.signal}</p>
                  <p className="ql295-caution">No independently verified shared identity, authenticated owner receipt or source record exists. This pairing is NOT a confirmed duplicate.</p>
                  <div className="ql295-review-actions" role="group" aria-label="Local duplicate review disposition">
                    <button type="button" aria-pressed={candidateReview?.disposition === 'needs-independent-check'} onClick={() => disposition('needs-independent-check')}>Needs independent check</button>
                    <button type="button" aria-pressed={candidateReview?.disposition === 'not-duplicate'} onClick={() => disposition('not-duplicate')}>Not duplicate in demo</button>
                    <button type="button" aria-pressed={candidateReview?.disposition === 'deferred'} onClick={() => disposition('deferred')}>Defer review</button>
                  </div>
                  <p role="status">Local review: {candidateReview ? `${candidateReview.disposition.replaceAll('-', ' ')} · demo step ${candidateReview.sequence}` : 'not reviewed'} · UNSIGNED / NOT MERGED</p>
                </> : <p>No candidate is authored for this profile. A name or similar enquiry never creates a matching candidate automatically.</p>}
                <p className="ql295-no-permission">Confirmed identity matches: 0. Merge, consent modification, contact sync and customer export remain disabled.</p>
              </section>
              <div className="ql295-permission-denied" role="note" data-ql295-permission="denied"><strong>ACCESS DENIED · Live contact actions</strong><p>Real contact reads, customer export, identity merge, consent writes and message sending require verified scoped permissions. No such role, tenant or provider capability is present in this preview.</p><small>{Object.values(ql295PermissionGate).filter(Boolean).length} of 5 live capabilities enabled.</small></div>
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

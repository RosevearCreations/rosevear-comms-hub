import { useMemo, useState } from 'react';
import type { OperatorOrganization } from './ql191Organizations';
import { inboxChannels, inboxForOrganization, type InboxChannel, type InboxThread } from './ql192InboxFixtures';
import { customerForThread } from './ql193CustomerContexts';
import {
  defaultInboxTriageFilters, demoOwnerForThread, filterInboxTriage, nextDemoAction,
  recoverInboxTriagePreset, triageLaneForThread, triageLanes, triageOwners, triageSlots,
  type InboxTriageFilters, type InboxTriagePreset, type InboxTriagePresets, type TriageSlot
} from './ql292InboxTriage';
import './ql192-inbox.css';
import './ql292-inbox-triage.css';

type ViewFilter = 'all' | 'unread' | 'needs_reply' | 'follow_up';
const viewFilters: ReadonlyArray<{ id: ViewFilter; label: string }> = [
  { id: 'all', label: 'All conversations' },
  { id: 'unread', label: 'Unread' },
  { id: 'needs_reply', label: 'Needs reply' },
  { id: 'follow_up', label: 'Follow-up' }
];

export function Ql192UnifiedInbox({ organization, initialThreadId, onOpenContact, onOpenQueue, onOpenComposer, presets, onSavePreset }: {
  organization: OperatorOrganization;
  initialThreadId?: string | null;
  onOpenContact?: (contactId: string) => void;
  onOpenQueue?: (threadId: string) => void;
  onOpenComposer?: (threadId: string) => void;
  presets?: InboxTriagePresets;
  onSavePreset?: (slot: TriageSlot, preset: InboxTriagePreset | null) => void;
}) {
  const threads = inboxForOrganization(organization.id);
  const [selectedId, setSelectedId] = useState(threads.some((thread) => thread.id === initialThreadId) ? initialThreadId! : (threads[0]?.id ?? ''));
  const [filters, setFilters] = useState<InboxTriageFilters>(defaultInboxTriageFilters);
  const [slot, setSlot] = useState<TriageSlot>('desk');
  const [presetFeedback, setPresetFeedback] = useState('');
  const [readOverrides, setReadOverrides] = useState<ReadonlySet<string>>(() => new Set());
  const [followUpOverrides, setFollowUpOverrides] = useState<Readonly<Record<string, boolean>>>({});
  const [showHelp, setShowHelp] = useState(false);

  const isUnread = (thread: InboxThread) => thread.unread && !readOverrides.has(thread.id);
  const isFollowUp = (thread: InboxThread) => followUpOverrides[thread.id] ?? thread.needsFollowUp;
  const filtered = useMemo(() => filterInboxTriage(threads, organization.id, filters, isUnread, isFollowUp),
    [threads, organization.id, filters, readOverrides, followUpOverrides]);
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

  function updateFilter<K extends keyof InboxTriageFilters>(name: K, value: InboxTriageFilters[K]) {
    setFilters((previous) => ({ ...previous, [name]: value }));
    setPresetFeedback('');
  }

  function resetFilters() { setFilters(defaultInboxTriageFilters()); setPresetFeedback('Filters cleared to safe defaults.'); }

  function savePreset() {
    onSavePreset?.(slot, { version: 1, organizationId: organization.id, filters: { ...filters } });
    setPresetFeedback(`${triageSlots.find((entry) => entry.id === slot)?.label} saved in this tab only. No browser storage or server write.`);
  }

  function restorePreset() {
    const safe = recoverInboxTriagePreset(presets?.[slot], organization.id);
    if (!safe) { resetFilters(); setPresetFeedback('Saved view unavailable or invalid; safe default filters restored.'); return; }
    setFilters(safe);
    setPresetFeedback(`${triageSlots.find((entry) => entry.id === slot)?.label} restored for ${organization.name} only.`);
  }

  function clearPreset() {
    onSavePreset?.(slot, null);
    setPresetFeedback('Session-only saved view removed.');
  }

  const laneCounts = triageLanes.map((lane) => ({
    ...lane, count: lane.id === 'all' ? threads.length : threads.filter((thread) => triageLaneForThread(thread, isFollowUp(thread)) === lane.id).length
  }));

  return (
    <section className="ql192-inbox ql292-inbox" data-ql192-release="ql192-unified-four-company-inbox-v1" data-ql292-release="ql292-priority-lanes-precise-search-session-presets" data-organization={organization.id} aria-labelledby="ql192-inbox-heading">
      <div className="ql192-inbox-header">
        <div>
          <p className="ql191-eyebrow">QL-292 · Operator inbox command</p>
          <h3 id="ql192-inbox-heading">{organization.name} inbox</h3>
          <p>Review one fictional timeline across phone, SMS, MMS, voicemail, email, website and internal channels.</p>
        </div>
        <button type="button" className="ql191-help-button" aria-label="Help with unified communications inbox" aria-expanded={showHelp} aria-controls="ql192-inbox-help" onClick={() => setShowHelp((previous) => !previous)}>ⓘ Help</button>
      </div>
      {showHelp && (
        <p id="ql192-inbox-help" className="ql191-help-content" role="note">Use priority lanes with channel, owner, status and view filters together. Search uses every word, with quoted phrases or subject:, contact: and channel: field hints. Select a thread to inspect its timeline. Save two named views in this tab only; restore them after navigating away, not after reload or brand switching. Marking a thread reviewed or flagging a follow-up changes this demonstration screen only; no message is sent and nothing is saved to a server or the browser.</p>
      )}
      <p className="ql191-synthetic-banner" role="note">DISABLED SYNTHETIC INBOX — fictional contacts and events only. No phone/SMS, mailbox, website, booking, tenant, customer or provider connection. Do not enter real personal information.</p>

      <div className="ql192-inbox-stats" aria-label="Synthetic inbox counts">
        <div><strong>{totals.conversations}</strong><span>Demo threads</span></div>
        <div><strong>{totals.unread}</strong><span>Unread examples</span></div>
        <div><strong>{totals.needsReply}</strong><span>Need reply</span></div>
        <div><strong>{totals.followUps}</strong><span>Follow-up flags</span></div>
      </div>

      <section className="ql292-lanes" aria-label="Synthetic priority lanes">
        <div className="ql292-lane-heading"><div><p className="ql292-eyebrow">Triage overview · sample data</p><h4>What needs a look?</h4></div><span>Counts recalculate from local demo flags</span></div>
        <div className="ql292-lane-grid">
          {laneCounts.map((lane) => (
            <button key={lane.id} type="button" className={filters.lane === lane.id ? 'ql292-lane active' : 'ql292-lane'} aria-pressed={filters.lane === lane.id} onClick={() => updateFilter('lane', lane.id)}>
              <span className="ql292-lane-count">{lane.count}</span><strong>{lane.label}</strong><small>{lane.description}</small>
            </button>
          ))}
        </div>
      </section>

      <div className="ql192-inbox-layout">
        <section className="ql192-list-panel" aria-label="Conversation queue">
          <div className="ql192-inbox-search">
            <label htmlFor="ql192-search">Search sample threads</label>
            <input id="ql192-search" type="search" autoComplete="off" maxLength={120} placeholder={'e.g. subject:ceramic or "winter salt"'} value={filters.search} onChange={(event) => updateFilter('search', event.target.value)} />
            <p className="ql292-filter-tip">ⓘ All words must match. Use quotes for phrases, or subject:, contact:, channel: for exact-field search.</p>
            <label htmlFor="ql192-channel">Channel</label>
            <select id="ql192-channel" value={filters.channel} onChange={(event) => updateFilter('channel', event.target.value as InboxChannel | 'all')}>
              {inboxChannels.map((entry) => <option key={entry.id} value={entry.id}>{entry.label}</option>)}
            </select>
            <div className="ql292-filter-grid">
              <div><label htmlFor="ql292-priority">Priority</label><select id="ql292-priority" value={filters.priority} onChange={(event) => updateFilter('priority', event.target.value as InboxTriageFilters['priority'])}><option value="all">Any priority</option><option value="high">High priority</option><option value="normal">Normal priority</option></select></div>
              <div><label htmlFor="ql292-owner">Demo owner</label><select id="ql292-owner" value={filters.owner} onChange={(event) => updateFilter('owner', event.target.value as InboxTriageFilters['owner'])}>{triageOwners.map((owner) => <option key={owner.id} value={owner.id}>{owner.label}</option>)}</select></div>
              <div><label htmlFor="ql292-status">Conversation status</label><select id="ql292-status" value={filters.status} onChange={(event) => updateFilter('status', event.target.value as InboxTriageFilters['status'])}><option value="all">Any status</option><option value="new">New</option><option value="needs_reply">Needs reply</option><option value="waiting">Waiting</option><option value="resolved">Resolved</option></select></div>
              <div><label htmlFor="ql292-sort">Sort examples by</label><select id="ql292-sort" value={filters.sort} onChange={(event) => updateFilter('sort', event.target.value as InboxTriageFilters['sort'])}><option value="attention">Attention first</option><option value="subject">Subject A–Z</option><option value="channel">Channel A–Z</option></select></div>
            </div>
          </div>
          <div className="ql192-view-filters" role="group" aria-label="Conversation filters">
            {viewFilters.map((entry) => (
              <button key={entry.id} type="button" aria-pressed={filters.view === entry.id} className={filters.view === entry.id ? 'ql192-view-filter active' : 'ql192-view-filter'} onClick={() => updateFilter('view', entry.id)}>{entry.label}</button>
            ))}
          </div>
          <section className="ql292-presets" aria-label="Session-only saved triage views">
            <div className="ql292-preset-heading"><strong>Saved triage views</strong><span>Tab-only · fictional filters</span></div>
            <label htmlFor="ql292-preset-slot">Preset slot</label>
            <select id="ql292-preset-slot" value={slot} onChange={(event) => { setSlot(event.target.value as TriageSlot); setPresetFeedback(''); }}>{triageSlots.map((entry) => <option key={entry.id} value={entry.id}>{entry.label}</option>)}</select>
            <p className="ql292-preset-status">{recoverInboxTriagePreset(presets?.[slot], organization.id) ? 'Valid saved view available for this business.' : 'No valid view saved in this slot.'}</p>
            <div className="ql292-preset-actions">
              <button type="button" onClick={savePreset} disabled={!onSavePreset}>Save current filters</button>
              <button type="button" onClick={restorePreset}>Restore saved view</button>
              <button type="button" onClick={clearPreset} disabled={!onSavePreset || !presets?.[slot]}>Remove saved view</button>
            </div>
            {presetFeedback && <p className="ql292-preset-feedback" role="status">{presetFeedback}</p>}
          </section>
          <p className="ql192-result-count" role="status">{filtered.length} of {threads.length} synthetic conversations</p>
          {filtered.length === 0 ? (
            <div className="ql192-empty"><p>No demonstration conversations match these filters.</p><p>Try another lane, fewer search terms or a different demo owner.</p><button type="button" onClick={resetFilters}>Clear filters</button></div>
          ) : (
            <div className="ql192-thread-list" aria-label="Matching conversations">
              {filtered.map((thread) => (
                <button key={thread.id} type="button" className={selected?.id === thread.id ? 'ql192-thread active' : 'ql192-thread'} aria-pressed={selected?.id === thread.id} onClick={() => setSelectedId(thread.id)}>
                  <span className="ql192-thread-top"><span>{thread.sourceLabel}</span>{isUnread(thread) && <strong className="ql192-unread">Unread</strong>}</span>
                  <strong>{thread.subject}</strong>
                  <span>{thread.contactLabel}</span>
                  <small>{thread.summary}</small>
                  <span className="ql192-thread-tags"><span>{thread.status.replaceAll('_', ' ')}</span>{isFollowUp(thread) && <span>Follow-up</span>}{thread.priority === 'high' && <span>Priority</span>}</span>
                  <span className="ql292-thread-meta"><span>Owner: {triageOwners.find((owner) => owner.id === demoOwnerForThread(thread))?.label}</span><span>Next: {nextDemoAction(thread)}</span></span>
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
                <p className="ql292-detail-triage">Preview lane: <strong>{triageLanes.find((lane) => lane.id === triageLaneForThread(selected, isFollowUp(selected)))?.label}</strong> · Demo owner: <strong>{triageOwners.find((owner) => owner.id === demoOwnerForThread(selected))?.label}</strong> · Next review: <strong>{nextDemoAction(selected)}</strong></p>
                <div className="ql192-detail-actions">
                  <button type="button" onClick={() => markRead(selected)} disabled={!isUnread(selected)}>{isUnread(selected) ? 'Mark reviewed (demo)' : 'Reviewed in demo'}</button>
                  <button type="button" onClick={() => toggleFollowUp(selected)} aria-pressed={isFollowUp(selected)}>{isFollowUp(selected) ? 'Remove follow-up flag' : 'Flag follow-up (demo)'}</button>
                  {onOpenQueue && <button type="button" onClick={() => onOpenQueue(selected.id)}>Manage follow-up queue</button>}
                  {onOpenComposer && (selected.channel === 'sms' || selected.channel === 'mms') && <button type="button" onClick={() => onOpenComposer(selected.id)}>Open unsent SMS/MMS composer</button>}
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

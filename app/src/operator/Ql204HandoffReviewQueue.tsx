import { useMemo, useState } from 'react';
import type { OrganizationId } from './ql191Organizations';
import { connectorContracts } from './ql199ConnectorContracts';
import { buildMockReviewQueue } from './ql204HandoffReviewQueue';
import { Ql205ReviewDesk } from './Ql205ReviewDesk';
import { emptyMockReviewDraft, type MockReviewDraft } from './ql205ReviewDesk';
import './ql204-handoff-review-queue.css';

type QueueView = 'needs_review' | 'all' | 'high_priority';

export function Ql204HandoffReviewQueue({ organizationId, onOpenThread }: { organizationId: OrganizationId; onOpenThread: (threadId: string) => void }) {
  const result = useMemo(() => buildMockReviewQueue(organizationId, connectorContracts[organizationId]), [organizationId]);
  const [view, setView] = useState<QueueView>('needs_review');
  const [search, setSearch] = useState('');
  const [reviewed, setReviewed] = useState<readonly string[]>([]);
  const [helpOpen, setHelpOpen] = useState(false);
  const [activeReviewId, setActiveReviewId] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Readonly<Record<string, MockReviewDraft>>>({});
  if (!result.ok) return <section className="ql204-queue" role="alert">The mock company review queue is unavailable.</section>;
  const pending = result.items.filter((item) => !reviewed.includes(item.id)).length;
  const visible = result.items.filter((item) => {
    if (view === 'needs_review' && reviewed.includes(item.id)) return false;
    if (view === 'high_priority' && item.priority !== 'high') return false;
    return [item.title, item.subject, item.category, item.reference].some((value) => value.toLocaleLowerCase().includes(search.trim().toLocaleLowerCase()));
  });
  function toggleReviewed(id: string) { setReviewed((ids) => ids.includes(id) ? ids.filter((value) => value !== id) : [...ids, id]); }
  const activeItem = result.items.find((item) => item.id === activeReviewId);
  function updateDraft(id: string, next: MockReviewDraft) { setDrafts((existing) => ({ ...existing, [id]: next })); }

  return <section className="ql204-queue" data-ql204-release="ql204-four-company-handoff-review-mock-v1" aria-labelledby="ql204-title">
    <header className="ql204-header"><div><p className="ql191-eyebrow">QL-204 · Connector workflow</p><h4 id="ql204-title">Handoff review queue</h4><p>One staff-review view of the selected company’s fictional connector inquiries.</p></div><button type="button" className="ql191-help-button" aria-expanded={helpOpen} aria-controls="ql204-help" onClick={() => setHelpOpen((value) => !value)}>ⓘ Help</button></header>
    <p className="ql204-warning" role="note">LOCAL DEMO ONLY · Review flags last for this screen session. No assignment, quote, booking, job, sync, message or other external action occurs.</p>
    {helpOpen && <p id="ql204-help" className="ql204-help" role="note">Choose a filter, search the selected company’s fictional sample inquiries, open a source inbox thread, or mark a row as reviewed in this browser session. Switching companies clears these local review flags. This is not proof of staff approval or a work-order status; real integration requires private-server identity, tenant authorization, audit trails, and owner-approved workflows.</p>}
    <div className="ql204-metrics" aria-label="Fictional queue counts"><p><strong>{result.items.length}</strong><span>Available samples</span></p><p><strong>{pending}</strong><span>Not reviewed here</span></p><p><strong>{result.items.filter((item) => item.priority === 'high').length}</strong><span>High priority samples</span></p><p><strong>{result.heldSamples}</strong><span>Held by connector gate</span></p></div>
    <div className="ql204-controls"><label htmlFor="ql204-view">Queue view</label><select id="ql204-view" value={view} onChange={(event) => setView(event.target.value as QueueView)}><option value="needs_review">Needs review in this session</option><option value="all">All fictional inquiries</option><option value="high_priority">High-priority fictional inquiries</option></select><label htmlFor="ql204-search">Search fictional inquiries</label><input id="ql204-search" type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search reference, service, or subject" /></div>
    <p className="ql204-summary" aria-live="polite">Showing {visible.length} of {result.items.length} available fictional inquiries for this selected company.</p>
    <div className="ql204-items">
      {visible.map((item) => <article key={item.id} className="ql204-item" data-queue-item={item.id}>
        <div className="ql204-item-heading"><div><span className="ql204-kind">{item.category}</span><h5>{item.title}</h5></div><span className="ql204-priority">{item.priority === 'high' ? 'High priority · demo' : 'Normal · demo'}</span></div>
        <p className="ql204-reference">{item.reference} · {item.subject}</p><p>{item.reviewPrompt}</p><p className="ql204-state">{reviewed.includes(item.id) ? 'Reviewed in this browser session only' : 'Staff review required · no external actions'}{drafts[item.id] && (drafts[item.id].note || drafts[item.id].proposedReply || drafts[item.id].steps.length) ? ' · Local review draft present' : ''}</p>
        <div className="ql204-actions"><button type="button" onClick={() => onOpenThread(item.threadId)}>Open fictional inbox source</button><button type="button" onClick={() => toggleReviewed(item.id)}>{reviewed.includes(item.id) ? 'Undo local review flag' : 'Mark reviewed in session'}</button><button type="button" onClick={() => setActiveReviewId(item.id)}>Open review desk</button></div>
      </article>)}
      {visible.length === 0 && <p className="ql204-empty">No fictional inquiries match this view. Change the filter or clear the search.</p>}
    </div>
    {activeItem && <Ql205ReviewDesk key={activeItem.id} organizationId={organizationId} item={activeItem} draft={drafts[activeItem.id] ?? emptyMockReviewDraft} onChange={(next) => updateDraft(activeItem.id, next)} onClose={() => setActiveReviewId(null)} />}
  </section>;
}

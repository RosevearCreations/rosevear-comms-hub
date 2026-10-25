import { useState } from 'react';
import type { OrganizationId } from './ql191Organizations';
import { connectorContracts } from './ql199ConnectorContracts';
import type { MockReviewQueueItem } from './ql204HandoffReviewQueue';
import { eligibleMockReviewDesk, mockReviewReadiness, mockReviewSteps, normalizeMockReviewDraft, type MockReviewDraft } from './ql205ReviewDesk';
import './ql205-review-desk.css';

export function Ql205ReviewDesk({ organizationId, item, draft, onChange, onClose }: {
  organizationId: OrganizationId;
  item: MockReviewQueueItem;
  draft: MockReviewDraft;
  onChange: (next: MockReviewDraft) => void;
  onClose: () => void;
}) {
  const [helpOpen, setHelpOpen] = useState(false);
  const eligibility = eligibleMockReviewDesk(organizationId, connectorContracts[organizationId], item);
  if (!eligibility.ok) return <p role="alert">The selected fictional handoff is not available for this company.</p>;
  const readiness = mockReviewReadiness(draft);
  function update(patch: Partial<MockReviewDraft>) { onChange(normalizeMockReviewDraft({ ...draft, ...patch })); }
  return <section className="ql205-desk" data-ql205-release="ql205-handoff-review-desk-mock-v1" aria-labelledby="ql205-title">
    <header className="ql205-header"><div><p className="ql191-eyebrow">QL-205 · Review desk</p><h5 id="ql205-title">{item.title} · mock review</h5><p>{item.reference} · {item.subject}</p></div><div className="ql205-header-buttons"><button type="button" className="ql191-help-button" aria-expanded={helpOpen} aria-controls="ql205-help" onClick={() => setHelpOpen((open) => !open)}>ⓘ Help</button><button type="button" onClick={onClose}>Close review desk</button></div></header>
    <p className="ql205-warning" role="note">FICTIONAL DRAFT ONLY · Do not enter real customer information. Text and checklist state exist in browser memory for this session, not in a backend. Nothing can be sent, approved, assigned or saved externally.</p>
    {helpOpen && <p className="ql205-help" id="ql205-help" role="note">Review the sample prompt, record demo questions, draft a potential reply, and tick the three rehearsal steps. All text is kept only while this company screen stays open. The completion signal is not a staff sign-off, live authorization or permission to contact anyone.</p>}
    <blockquote className="ql205-context"><strong>Staff follow-up prompt</strong><p>{item.reviewPrompt}</p></blockquote>
    <div className="ql205-fields"><div><label htmlFor="ql205-notes">Internal rehearsal note</label><textarea id="ql205-notes" value={draft.note} maxLength={500} rows={4} placeholder="Questions for a human operator to verify (fictional only)" onChange={(event) => update({ note: event.target.value })} /><small>{draft.note.length}/500 characters</small></div><div><label htmlFor="ql205-reply">Proposed reply · not sent</label><textarea id="ql205-reply" value={draft.proposedReply} maxLength={800} rows={4} placeholder="Compose a mock reply for staff to review (not delivered)" onChange={(event) => update({ proposedReply: event.target.value })} /><small>{draft.proposedReply.length}/800 characters</small></div></div>
    <fieldset className="ql205-checklist"><legend>Fictional review checklist</legend>{mockReviewSteps.map((step) => <label key={step.id}><input type="checkbox" checked={draft.steps.includes(step.id)} onChange={(event) => update({ steps: event.target.checked ? [...draft.steps, step.id] : draft.steps.filter((id) => id !== step.id) })} />{step.label}</label>)}</fieldset>
    <div className="ql205-readiness" role="status" aria-live="polite"><strong>{readiness.prepared ? 'Demo packet prepared — not approved or sent' : 'Demo packet incomplete'}</strong><p>{readiness.prepared ? 'All local checklist steps and both draft fields are present. This remains a rehearsal only.' : `Still needed: ${readiness.missing.join('; ')}.`}</p></div>
    <button className="ql205-clear" type="button" onClick={() => onChange({ note: '', proposedReply: '', steps: [] })}>Clear local draft</button>
  </section>;
}

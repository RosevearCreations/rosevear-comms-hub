import { useState } from 'react';
import type { OperatorOrganization } from './ql191Organizations';
import { draftGate, MAX_DEMO_CHARACTERS, messageTargets, messageTemplates, type AttachmentPlaceholder, type DraftPurpose } from './ql196MessagePolicy';
import { readQl293Draft, safeQl293DraftText, ql293ReplyHelp, type Ql293SessionDrafts } from './ql293ConversationRecovery';
import './ql196-message-composer.css';
import './ql293-conversation-workflow.css';

export function Ql196MessageComposer({ organization, initialThreadId, onOpenThread, sessionDrafts, onStageDraft, onDiscardDraft }: {
  organization: OperatorOrganization;
  initialThreadId?: string | null;
  onOpenThread: (threadId: string) => void;
  sessionDrafts: Ql293SessionDrafts;
  onStageDraft: (draft: { threadId: string; purpose: DraftPurpose; templateId: string; text: string; attachment: AttachmentPlaceholder }) => void;
  onDiscardDraft: (threadId: string) => void;
}) {
  const targets = messageTargets(organization.id);
  const templates = messageTemplates(organization.id);
  const initialTarget = targets.some((thread) => thread.id === initialThreadId) ? initialThreadId! : (targets[0]?.id ?? '');
  const initialSaved = readQl293Draft(sessionDrafts, organization.id, initialTarget);
  const [threadId, setThreadId] = useState(initialTarget);
  const [purpose, setPurpose] = useState<DraftPurpose>(initialSaved?.purpose ?? 'service');
  const [templateId, setTemplateId] = useState(initialSaved?.templateId ?? templates[0]?.id ?? '');
  const [text, setText] = useState(initialSaved?.text ?? templates[0]?.text ?? '');
  const [attachment, setAttachment] = useState<AttachmentPlaceholder>(initialSaved?.attachment ?? 'none');
  const [showHelp, setShowHelp] = useState(false);
  const [showReplyHelp, setShowReplyHelp] = useState(false);
  const [recoveryStatus, setRecoveryStatus] = useState(initialSaved ? 'Recovered an unsent draft from this tab. Nothing was transmitted.' : 'No previous unsent draft for this conversation.');
  const [preview, setPreview] = useState(false);
  const target = targets.find((thread) => thread.id === threadId);
  const gate = draftGate(organization.id, threadId, purpose);

  function stage(next: { threadId: string; purpose: DraftPurpose; templateId: string; text: string; attachment: AttachmentPlaceholder }) {
    onStageDraft(next);
    setRecoveryStatus('Unsent redacted draft kept in this tab only. No delivery, upload or approval.');
    setPreview(false);
  }

  function chooseThread(next: string) {
    const restored = readQl293Draft(sessionDrafts, organization.id, next);
    setThreadId(next);
    setPurpose(restored?.purpose ?? 'service');
    setTemplateId(restored?.templateId ?? templates[0]?.id ?? '');
    setText(restored?.text ?? templates[0]?.text ?? '');
    setAttachment(restored?.attachment ?? 'none');
    setRecoveryStatus(restored ? 'Recovered this fictional thread’s unsent draft.' : 'No previous unsent draft for this conversation.');
    setPreview(false);
    setShowReplyHelp(false);
  }

  function chooseTemplate(next: string) {
    const nextText = templates.find((entry) => entry.id === next)?.text ?? '';
    setTemplateId(next);
    setText(nextText);
    stage({ threadId, purpose, templateId: next, text: nextText, attachment });
  }

  return <section className="ql196-composer ql293-composer" aria-labelledby="ql196-title" data-ql196-release="ql196-sms-mms-composer-v1" data-ql293-release="ql293-unsent-session-recovery-and-help" data-organization={organization.id}>
    <header className="ql196-header"><div><p className="ql191-eyebrow">QL-293 · Unsent communications studio</p><h3 id="ql196-title">{organization.name} · SMS/MMS composer</h3><p>Practice drafting a message for a fictional contact and review the consent boundary.</p></div>
      <button type="button" className="ql191-help-button" aria-expanded={showHelp} aria-controls="ql196-help" aria-label="Help with SMS/MMS composer" onClick={() => setShowHelp((open) => !open)}>ⓘ Help</button></header>
    {showHelp && <p id="ql196-help" className="ql196-note">Select a synthetic conversation, choose a template and edit it locally. Edited text and attachment choices can be recovered after switching views in this tab, but are discarded on reload or business switch. Identifiers are redacted before local React state receives edits. Attachments are descriptions only—no file chooser, uploads or external media. The preview is not approved, scheduled or delivered. Opt-outs on any linked sample contact apply across channels. Nothing here grants consent or live permission.</p>}
    <p role="note" className="ql191-synthetic-banner">DISABLED SYNTHETIC COMPOSER — no real names, numbers, messages or personal information. No SMS/MMS provider, file uploads, media storage, carrier billing, API request, recipient lookup, scheduled send or browser/server persistence. All sending is locked.</p>
    <div className="ql196-metrics"><div><strong>{targets.length}</strong><span>Demo SMS/MMS threads</span></div><div><strong>0</strong><span>Messages delivered</span></div><div><strong>OFF</strong><span>Provider transport</span></div></div>
    <div className="ql196-layout">
      <section className="ql196-panel" aria-label="Unsent sample message controls">
        <div className="ql293-recovery" role="note"><strong>Unsent draft recovery</strong><p role="status">{recoveryStatus}</p><small>Session memory only · resets on reload or business change · no browser storage</small></div>
        <label htmlFor="ql196-target">Fictional conversation</label>
        <select id="ql196-target" value={threadId} onChange={(event) => chooseThread(event.target.value)}>
          {targets.map((thread) => <option key={thread.id} value={thread.id}>{thread.contactLabel} · {thread.channel.toUpperCase()} · {thread.subject}</option>)}
        </select>
        <label htmlFor="ql196-purpose">Message purpose</label>
        <select id="ql196-purpose" value={purpose} onChange={(event) => { const next = event.target.value as DraftPurpose; setPurpose(next); stage({ threadId, purpose: next, templateId, text, attachment }); }}><option value="service">Service response (demo)</option><option value="marketing">Promotional / marketing (demo)</option></select>
        <label htmlFor="ql196-template">Suggested template</label>
        <select id="ql196-template" value={templateId} onChange={(event) => chooseTemplate(event.target.value)}>{templates.map((entry) => <option key={entry.id} value={entry.id}>{entry.title}</option>)}</select>
        <label htmlFor="ql196-text">Unsent demonstration draft</label>
        <textarea id="ql196-text" value={text} maxLength={MAX_DEMO_CHARACTERS} rows={5} onChange={(event) => { const next = safeQl293DraftText(event.target.value); setText(next); stage({ threadId, purpose, templateId, text: next, attachment }); }} />
        <p className="ql196-count" role="status">{text.length}/{MAX_DEMO_CHARACTERS} demo characters · never transmitted</p>
        <label htmlFor="ql196-attachment">MMS attachment description</label>
        <select id="ql196-attachment" value={attachment} onChange={(event) => { const next = event.target.value as AttachmentPlaceholder; setAttachment(next); stage({ threadId, purpose, templateId, text, attachment: next }); }}>
          <option value="none">No attachment</option><option value="sample_photo">Fictional image placeholder</option><option value="sample_document">Fictional document placeholder</option>
        </select>
        <p className="ql196-muted">No real file picker, media upload, attachment URL or photo content.</p>
        <div className="ql196-actions"><button type="button" disabled={!target || !text.trim()} onClick={() => setPreview(true)}>Review unsent preview</button><button type="button" onClick={() => { onDiscardDraft(threadId); setText(''); setAttachment('none'); setPreview(false); setRecoveryStatus('Unsent draft discarded in this tab; no message was sent.'); }}>Clear draft</button></div>
      </section>
      <section className="ql196-panel" aria-label="Consent and unsent delivery review">
        <h4>Consent and release gate</h4>
        <p><strong>Recipient:</strong> {target?.contactLabel ?? 'None'} · fictional, no destination address</p>
        <p><strong>Source:</strong> {target?.subject ?? 'No matching source'} · {target?.channel.toUpperCase() ?? 'N/A'}</p>
        <p className="ql196-gate" role="status"><strong>DELIVERY BLOCKED</strong> — {gate.label}</p>
        <p className="ql196-muted">Fixture consent: {gate.consent ?? 'unknown'}. Sample consent is not verified authorization. Service messages require identity, lawful purpose and an approved provider workflow; promotional messages additionally need independently established consent.</p>
        {target && <section className="ql293-reply-help"><button type="button" aria-expanded={showReplyHelp} aria-controls="ql293-reply-help" onClick={() => setShowReplyHelp((open) => !open)}>ⓘ Why is this reply blocked?</button>{showReplyHelp && <p id="ql293-reply-help" role="note">{ql293ReplyHelp(target, gate.consent ?? 'unknown')} This is a local training draft, not a delivery attempt. {gate.label}.</p>}</section>}
        {target && <button type="button" onClick={() => onOpenThread(target.id)}>Open source in unified inbox</button>}
        {preview && <div className="ql196-preview" aria-label="Unsent draft preview"><h5>Local preview · NOT SENT</h5><p>{text}</p><p>Attachment: {attachment === 'none' ? 'none' : attachment === 'sample_photo' ? 'fictional image placeholder' : 'fictional document placeholder'}</p><small>No delivery receipt, provider event, saved draft or customer timeline entry.</small></div>}
        <div className="ql196-disabled"><button type="button" disabled>Send SMS/MMS disabled</button><button type="button" disabled>Schedule send disabled</button><button type="button" disabled>Upload real file disabled</button></div>
      </section>
    </div>
  </section>;
}

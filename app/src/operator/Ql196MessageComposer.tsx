import { useState } from 'react';
import type { OperatorOrganization } from './ql191Organizations';
import { draftGate, MAX_DEMO_CHARACTERS, messageTargets, messageTemplates, sanitizeDemoDraft, type AttachmentPlaceholder, type DraftPurpose } from './ql196MessagePolicy';
import './ql196-message-composer.css';

export function Ql196MessageComposer({ organization, initialThreadId, onOpenThread }: {
  organization: OperatorOrganization;
  initialThreadId?: string | null;
  onOpenThread: (threadId: string) => void;
}) {
  const targets = messageTargets(organization.id);
  const templates = messageTemplates(organization.id);
  const [threadId, setThreadId] = useState(targets.some((thread) => thread.id === initialThreadId) ? initialThreadId! : (targets[0]?.id ?? ''));
  const [purpose, setPurpose] = useState<DraftPurpose>('service');
  const [templateId, setTemplateId] = useState(templates[0]?.id ?? '');
  const [text, setText] = useState(templates[0]?.text ?? '');
  const [attachment, setAttachment] = useState<AttachmentPlaceholder>('none');
  const [showHelp, setShowHelp] = useState(false);
  const [preview, setPreview] = useState(false);
  const target = targets.find((thread) => thread.id === threadId);
  const gate = draftGate(organization.id, threadId, purpose);

  function chooseTemplate(next: string) {
    setTemplateId(next);
    setText(templates.find((entry) => entry.id === next)?.text ?? '');
    setPreview(false);
  }

  return <section className="ql196-composer" aria-labelledby="ql196-title" data-ql196-release="ql196-sms-mms-composer-v1" data-organization={organization.id}>
    <header className="ql196-header"><div><p className="ql191-eyebrow">QL-196 · Unsent communications studio</p><h3 id="ql196-title">{organization.name} · SMS/MMS composer</h3><p>Practice drafting a message for a fictional contact and review the consent boundary.</p></div>
      <button type="button" className="ql191-help-button" aria-expanded={showHelp} aria-controls="ql196-help" aria-label="Help with SMS/MMS composer" onClick={() => setShowHelp((open) => !open)}>ⓘ Help</button></header>
    {showHelp && <p id="ql196-help" className="ql196-note">Select a synthetic conversation, choose a template and edit it locally. Attachments are descriptions only—no file chooser, uploads or external media. The preview is not saved, approved, scheduled or delivered. Opt-outs on any linked sample contact apply across channels. Nothing here grants consent or live permission.</p>}
    <p role="note" className="ql191-synthetic-banner">DISABLED SYNTHETIC COMPOSER — no real names, numbers, messages or personal information. No SMS/MMS provider, file uploads, media storage, carrier billing, API request, recipient lookup, scheduled send or browser/server persistence. All sending is locked.</p>
    <div className="ql196-metrics"><div><strong>{targets.length}</strong><span>Demo SMS/MMS threads</span></div><div><strong>0</strong><span>Messages delivered</span></div><div><strong>OFF</strong><span>Provider transport</span></div></div>
    <div className="ql196-layout">
      <section className="ql196-panel" aria-label="Unsent sample message controls">
        <label htmlFor="ql196-target">Fictional conversation</label>
        <select id="ql196-target" value={threadId} onChange={(event) => { setThreadId(event.target.value); setPreview(false); }}>
          {targets.map((thread) => <option key={thread.id} value={thread.id}>{thread.contactLabel} · {thread.channel.toUpperCase()} · {thread.subject}</option>)}
        </select>
        <label htmlFor="ql196-purpose">Message purpose</label>
        <select id="ql196-purpose" value={purpose} onChange={(event) => { setPurpose(event.target.value as DraftPurpose); setPreview(false); }}><option value="service">Service response (demo)</option><option value="marketing">Promotional / marketing (demo)</option></select>
        <label htmlFor="ql196-template">Suggested template</label>
        <select id="ql196-template" value={templateId} onChange={(event) => chooseTemplate(event.target.value)}>{templates.map((entry) => <option key={entry.id} value={entry.id}>{entry.title}</option>)}</select>
        <label htmlFor="ql196-text">Unsent demonstration draft</label>
        <textarea id="ql196-text" value={text} maxLength={MAX_DEMO_CHARACTERS} rows={5} onChange={(event) => { setText(sanitizeDemoDraft(event.target.value)); setPreview(false); }} />
        <p className="ql196-count" role="status">{text.length}/{MAX_DEMO_CHARACTERS} demo characters · never transmitted</p>
        <label htmlFor="ql196-attachment">MMS attachment description</label>
        <select id="ql196-attachment" value={attachment} onChange={(event) => { setAttachment(event.target.value as AttachmentPlaceholder); setPreview(false); }}>
          <option value="none">No attachment</option><option value="sample_photo">Fictional image placeholder</option><option value="sample_document">Fictional document placeholder</option>
        </select>
        <p className="ql196-muted">No real file picker, media upload, attachment URL or photo content.</p>
        <div className="ql196-actions"><button type="button" disabled={!target || !text.trim()} onClick={() => setPreview(true)}>Review unsent preview</button><button type="button" onClick={() => { setText(''); setAttachment('none'); setPreview(false); }}>Clear draft</button></div>
      </section>
      <section className="ql196-panel" aria-label="Consent and unsent delivery review">
        <h4>Consent and release gate</h4>
        <p><strong>Recipient:</strong> {target?.contactLabel ?? 'None'} · fictional, no destination address</p>
        <p><strong>Source:</strong> {target?.subject ?? 'No matching source'} · {target?.channel.toUpperCase() ?? 'N/A'}</p>
        <p className="ql196-gate" role="status"><strong>DELIVERY BLOCKED</strong> — {gate.label}</p>
        <p className="ql196-muted">Fixture consent: {gate.consent ?? 'unknown'}. Sample consent is not verified authorization. Service messages require identity, lawful purpose and an approved provider workflow; promotional messages additionally need independently established consent.</p>
        {target && <button type="button" onClick={() => onOpenThread(target.id)}>Open source in unified inbox</button>}
        {preview && <div className="ql196-preview" aria-label="Unsent draft preview"><h5>Local preview · NOT SENT</h5><p>{text}</p><p>Attachment: {attachment === 'none' ? 'none' : attachment === 'sample_photo' ? 'fictional image placeholder' : 'fictional document placeholder'}</p><small>No delivery receipt, provider event, saved draft or customer timeline entry.</small></div>}
        <div className="ql196-disabled"><button type="button" disabled>Send SMS/MMS disabled</button><button type="button" disabled>Schedule send disabled</button><button type="button" disabled>Upload real file disabled</button></div>
      </section>
    </div>
  </section>;
}

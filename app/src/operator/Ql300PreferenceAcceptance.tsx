import { useState } from 'react';
import { inspectQl272LocalLayout } from '../storage/localRepository';
import type { Ql272PreferenceEnvelope } from './ql272LayoutPreferences';
import { QL273_SHORTCUTS } from './ql273CommandHelp';
import { QL300_ACCEPTANCE, ql300Recovery } from './ql300PreferenceAcceptance';
import './ql300-preference-acceptance.css';

export function Ql300PreferenceAcceptance({ onRestore }: { onRestore: (preferences: Ql272PreferenceEnvelope) => void }) {
  const [open, setOpen] = useState(false);
  const [shortcutOpen, setShortcutOpen] = useState(false);
  const [audit, setAudit] = useState(() => ql300Recovery(inspectQl272LocalLayout()));
  const [feedback, setFeedback] = useState('Manual acceptance remains unverified. No owner sign-off has been recorded.');

  function inspect() {
    const next = ql300Recovery(inspectQl272LocalLayout());
    setAudit(next);
    setFeedback(`Saved-view audit: ${next.audit.title}. This is a local format check, not owner acceptance.`);
  }
  function restore() {
    const next = ql300Recovery(inspectQl272LocalLayout());
    setAudit(next);
    if (!next.recovered) { setFeedback('Restore blocked: saved layout is missing, invalid or unavailable. Safe defaults remain active.'); return; }
    onRestore(next.recovered);
    setFeedback(`Restored the verified local “${next.audit.activeLabel ?? 'Standard'}” display profile. Authorization unchanged; owner acceptance still unverified.`);
  }

  return <section className="ql300" aria-labelledby="ql300-title" data-ql300-release="preference-accessibility-v1">
    <header><div><p className="ql271-eyebrow">QL-300 · Preference accessibility and recovery</p><h3 id="ql300-title">Make this command view work for you</h3><p>Use the existing Customize cards and Comfortable / Compact controls. Test keyboard, motion, contrast and refresh recovery without creating a new saved-data store.</p></div>
      <button type="button" aria-expanded={open} aria-controls="ql300-checklist" onClick={() => setOpen(value => !value)}>{open ? 'Hide' : 'Open'} accessibility acceptance guide</button></header>
    <p className="ql300-notice" role="note">MANUAL REVIEW ONLY · Four device and preference checks are ready to perform. Owner outcomes are not recorded or accepted by this screen; all integrations remain disconnected.</p>
    {open && <div id="ql300-checklist">
      <div className="ql300-actions"><button type="button" aria-expanded={shortcutOpen} aria-controls="ql300-shortcuts" onClick={() => setShortcutOpen(value => !value)}>{shortcutOpen ? 'Hide' : 'Show'} keyboard shortcut reference</button><button type="button" onClick={inspect}>Check saved-view integrity</button><button type="button" onClick={restore}>Restore verified saved profile</button></div>
      {shortcutOpen && <div id="ql300-shortcuts" aria-label="Keyboard shortcut reference"><p>Shortcuts apply in command screens, outside editable fields. They never change security permissions.</p><dl className="ql300-shortcuts">{QL273_SHORTCUTS.map(item => <div key={item.keys}><dt><kbd>{item.keys}</kbd></dt><dd>{item.action}</dd></div>)}</dl></div>}
      <p className="ql300-audit">Stored profile: <strong>{audit.audit.status.toUpperCase()}</strong> · {audit.audit.explanation}</p>
      <p className="ql300-feedback" role="status" aria-live="polite">{feedback}</p>
      <ol className="ql300-checks">{QL300_ACCEPTANCE.map(check => <li key={check.id}><h4>{check.title}</h4><p><strong>Walkthrough:</strong> {check.steps}</p><p><strong>Expected:</strong> {check.expected}</p><span>OWNER RESULT · UNVERIFIED</span></li>)}</ol>
    </div>}
  </section>;
}

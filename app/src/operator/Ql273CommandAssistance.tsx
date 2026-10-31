import { useEffect, useState } from 'react';
import type { Ql271CommandMode } from './Ql271CommandSurfaces';
import { inspectQl272LocalLayout } from '../storage/localRepository';
import { defaultQl272Preferences, type Ql272PreferenceEnvelope } from './ql272LayoutPreferences';
import { QL273_METRIC_HELP, QL273_SHORTCUTS, QL273_VIEW_HELP,
  auditQl273SavedView, ql273ShortcutMode, savedQl273Preferences } from './ql273CommandHelp';
import { Ql274CommandReview } from './Ql274CommandReview';
import { Ql275OperatorWalkthrough } from './Ql275OperatorWalkthrough';
import { Ql276EvidenceIntake } from './Ql276EvidenceIntake';
import { Ql277DriftReview } from './Ql277DriftReview';
import { Ql278FollowupDesk } from './Ql278FollowupDesk';
import './ql273-assistance.css';

type AssistancePanel = 'help' | 'shortcuts' | 'audit' | 'review' | 'walkthrough' | 'intake' | 'drift' | 'followup' | null;

function editableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) return false;
  return Boolean(target.closest('input, select, textarea, [contenteditable="true"], [role="textbox"]'));
}

export function Ql273CommandAssistance({ mode, preferences, onNavigate, onOpenEvidence, onOpenConnections, onRestore, onReset }: {
  mode: Ql271CommandMode;
  preferences: Ql272PreferenceEnvelope;
  onNavigate: (mode: Ql271CommandMode) => void;
  onOpenEvidence: () => void;
  onOpenConnections: () => void;
  onRestore: (preferences: Ql272PreferenceEnvelope) => void;
  onReset: (preferences: Ql272PreferenceEnvelope) => void;
}) {
  const [panel, setPanel] = useState<AssistancePanel>(null);
  const [audit, setAudit] = useState(() => auditQl273SavedView(inspectQl272LocalLayout()));
  const [action, setAction] = useState('Read-only review; no saved-view changes made.');
  const help = QL273_VIEW_HELP[mode];

  function checkSavedView() {
    setAudit(auditQl273SavedView(inspectQl272LocalLayout()));
    setAction('Local format check repeated. No external event, permission or tenant access was created.');
  }

  function restoreSavedView() {
    const snapshot = inspectQl272LocalLayout();
    const saved = savedQl273Preferences(snapshot);
    if (!saved) {
      setAudit(auditQl273SavedView(snapshot));
      setAction('Restore stopped: no valid local snapshot is available.');
      return;
    }
    onRestore(saved);
    setAudit(auditQl273SavedView(snapshot));
    setAction(`Restored the locally verified “${saved.profiles.find(profile => profile.id === saved.activeId)?.label ?? 'Standard'}” presentation.`);
  }

  function resetInvalidView() {
    onReset(defaultQl272Preferences());
    setAudit(auditQl273SavedView(inspectQl272LocalLayout()));
    setAction('Replaced the invalid local layout record with safe defaults where browser storage permits.');
  }

  useEffect(() => {
    function handleKey(event: KeyboardEvent) {
      if (event.defaultPrevented || event.isComposing || editableTarget(event.target)) return;
      const destination = ql273ShortcutMode(event);
      if (destination) { event.preventDefault(); onNavigate(destination); return; }
      if (event.altKey && event.shiftKey && !event.ctrlKey && !event.metaKey && event.code === 'KeyH') {
        event.preventDefault(); setPanel(open => open === 'help' ? null : 'help');
      } else if (event.altKey && event.shiftKey && !event.ctrlKey && !event.metaKey && event.code === 'KeyR') {
        event.preventDefault(); checkSavedView(); setPanel('audit');
      } else if (event.key === 'Escape') {
        setPanel(open => { if (open) event.preventDefault(); return null; });
      }
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onNavigate]);

  function toggle(next: Exclude<AssistancePanel, null>) {
    if (next === 'audit') checkSavedView();
    setPanel(current => current === next ? null : next);
  }

  return <section className="ql273-assist" aria-label="Contextual command help and recovery">
    <div className="ql273-assist-toolbar">
      <div className="ql273-assist-intro"><span aria-hidden="true">ⓘ</span><div><strong>Command guidance</strong><small>Help for this screen · accessible shortcuts · local recovery</small></div></div>
      <div className="ql273-assist-actions">
        <button type="button" aria-expanded={panel === 'help'} aria-controls="ql273-help" onClick={() => toggle('help')}>ⓘ Help for this view</button>
        <button type="button" aria-expanded={panel === 'shortcuts'} aria-controls="ql273-shortcuts" onClick={() => toggle('shortcuts')}>⌨ Keyboard shortcuts</button>
        <button type="button" aria-expanded={panel === 'audit'} aria-controls="ql273-audit" onClick={() => toggle('audit')}>◷ Saved view audit</button>
        <button type="button" aria-expanded={panel === 'review'} aria-controls="ql274-review" onClick={() => toggle('review')}>✓ Help &amp; proof review</button>
        <button type="button" aria-expanded={panel === 'walkthrough'} aria-controls="ql275-walkthrough" onClick={() => toggle('walkthrough')}>◈ Guided operator walkthrough</button>
        <button type="button" aria-expanded={panel === 'intake'} aria-controls="ql276-intake" onClick={() => toggle('intake')}>◷ Owner evidence &amp; custody intake</button>
        <button type="button" aria-expanded={panel === 'drift'} aria-controls="ql277-drift" onClick={() => toggle('drift')}>◇ Recheck &amp; source drift audit</button>
        <button type="button" aria-expanded={panel === 'followup'} aria-controls="ql278-followup" onClick={() => toggle('followup')}>◈ Regression retests &amp; proof follow-up</button>
      </div>
    </div>
    {panel === 'help' && <div id="ql273-help" className="ql273-assist-panel" role="region" aria-label="Help for this command view">
      <h4>ⓘ Understanding this screen</h4>
      <div className="ql273-help-grid"><p><strong>What it does</strong>{help.purpose}</p><p><strong>How to read it</strong>{help.reading}</p><p><strong>Next step</strong>{help.next}</p></div>
      <p className="ql273-held-note">All integration authorization remains DISCONNECTED / HOLD. These controls affect navigation or browser-local layout only.</p>
    </div>}
    {panel === 'shortcuts' && <div id="ql273-shortcuts" className="ql273-assist-panel" role="region" aria-label="Command keyboard shortcuts">
      <h4>⌨ Keyboard navigation</h4>
      <p>Use these shortcuts while focus is outside text fields. Normal Tab, Shift + Tab, Enter and Space also work on every command control.</p>
      <dl className="ql273-shortcut-list">{QL273_SHORTCUTS.map(item => <div key={item.keys}><dt><kbd>{item.keys}</kbd></dt><dd>{item.action}</dd></div>)}</dl>
      <p className="ql273-held-note">Shortcuts never submit records, send messages, or change operator permissions.</p>
    </div>}
    {panel === 'audit' && <div id="ql273-audit" className="ql273-assist-panel" role="region" aria-label="Saved command view recovery audit">
      <div className="ql273-audit-heading"><div><h4>◷ Saved view recovery audit</h4><p>Checked the existing browser-local QL-272 layout format. This is not a server-side audit log.</p></div><span className={`ql273-audit-badge status-${audit.status}`}>{audit.status.toUpperCase()}</span></div>
      <div className="ql273-audit-result" role="status"><strong>{audit.title}</strong><p>{audit.explanation}</p>{audit.status === 'valid' && <small>{audit.profileCount} safe layout profile(s) · active: {audit.activeLabel}</small>}</div>
      <div className="ql273-audit-actions">
        <button type="button" onClick={checkSavedView}>Check again</button>
        <button type="button" onClick={restoreSavedView} disabled={audit.status !== 'valid'}>Restore verified saved view</button>
        {(audit.status === 'invalid' || audit.status === 'malformed') && <button type="button" className="ql273-repair" onClick={resetInvalidView}>Replace invalid record with defaults</button>}
      </div>
      <p className="ql273-recovery-event" aria-live="polite">Latest local action: {action}</p>
      <p className="ql273-held-note">No layout record contains or grants secrets, roles, Proof-B acceptance, tenant access, authenticated GETs, live calls or SMS.</p>
    </div>}
    {panel === 'review' && <div id="ql274-review" className="ql273-assist-panel" role="region" aria-label="QL-274 command help and proof assurance review">
      <Ql274CommandReview preferences={preferences} onOpenEvidence={onOpenEvidence} />
    </div>}
    {panel === 'walkthrough' && <div id="ql275-walkthrough" className="ql273-assist-panel" role="region" aria-label="QL-275 guided operator, accessibility and Proof-B routing walkthrough">
      <Ql275OperatorWalkthrough mode={mode} onNavigate={onNavigate} onOpenEvidence={onOpenEvidence} onOpenConnections={onOpenConnections} />
    </div>}
    {panel === 'intake' && <div id="ql276-intake" className="ql273-assist-panel" role="region" aria-label="QL-276 owner accessibility evidence and Proof-B custodian intake">
      <Ql276EvidenceIntake onOpenEvidence={onOpenEvidence} onOpenConnections={onOpenConnections} />
    </div>}
    {panel === 'drift' && <div id="ql277-drift" className="ql273-assist-panel" role="region" aria-label="QL-277 owner recheck, custodian reference and source drift audit">
      <Ql277DriftReview onOpenEvidence={onOpenEvidence} />
    </div>}
    {panel === 'followup' && <div id="ql278-followup" className="ql273-assist-panel" role="region" aria-label="QL-278 owner accessibility regression retests, original custody preconditions and six-app drift follow-up aging">
      <Ql278FollowupDesk onOpenEvidence={onOpenEvidence} />
    </div>}
  </section>;
}

export function Ql273MetricHelp({ mode, index, label }: { mode: Ql271CommandMode; index: number; label: string }) {
  const [open, setOpen] = useState(false);
  const id = `ql273-metric-${mode}-${index}`;
  return <>
    <button type="button" className="ql273-metric-help" aria-label={`Help about ${label}`} aria-expanded={open} aria-controls={id}
      onClick={() => setOpen(value => !value)}>ⓘ</button>
    {open && <p id={id} role="note" aria-live="polite" className="ql273-metric-explanation">{QL273_METRIC_HELP[mode][index]}</p>}
  </>;
}

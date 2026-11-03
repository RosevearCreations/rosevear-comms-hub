import { useEffect, useState } from 'react';
import { inspectQl272LocalLayout } from '../storage/localRepository';
import type { Ql271CommandMode } from './Ql271CommandSurfaces';
import { QL273_SHORTCUTS, QL273_VIEW_HELP } from './ql273CommandHelp';
import { activeQl272Profile, defaultQl272Preferences, editQl272ActiveProfile, QL272_ROLE_PREVIEWS,
  type Ql272Density, type Ql272PreferenceEnvelope } from './ql272LayoutPreferences';
import { ql319ActiveSummary, ql319ExportPreview, ql319SavedViewState } from './ql319AdminPreferences';
import './ql319-admin-preferences.css';

const destinations: ReadonlyArray<{ mode: Ql271CommandMode; label: string }> = [
  { mode: 'it_command', label: 'IT Command' }, { mode: 'management', label: 'Management' },
  { mode: 'analytics', label: 'Statistics' }, { mode: 'system_status', label: 'System Status' }
];

export function Ql319AdminPreferences({ mode, preferences, saved, storageAvailable, onNavigate, onChange, onRestore, onReset }: {
  mode: Ql271CommandMode;
  preferences: Ql272PreferenceEnvelope;
  saved: boolean;
  storageAvailable: boolean;
  onNavigate: (mode: Ql271CommandMode) => void;
  onChange: (next: Ql272PreferenceEnvelope) => void;
  onRestore: (next: Ql272PreferenceEnvelope) => void;
  onReset: (next: Ql272PreferenceEnvelope) => void;
}) {
  const [open, setOpen] = useState(true);
  const [helpOpen, setHelpOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [recovery, setRecovery] = useState(() => ql319SavedViewState(inspectQl272LocalLayout()));
  const [feedback, setFeedback] = useState('No settings changed. All actions stay on this device or in this tab.');
  const profile = activeQl272Profile(preferences);
  const role = QL272_ROLE_PREVIEWS.find(item => item.id === profile.rolePreview) ?? QL272_ROLE_PREVIEWS[0];
  const help = QL273_VIEW_HELP[mode];
  const exportPreview = ql319ExportPreview(preferences);

  useEffect(() => {
    setRecovery(ql319SavedViewState(inspectQl272LocalLayout()));
  }, [preferences, saved, storageAvailable]);

  function update(next: Ql272PreferenceEnvelope, description: string) {
    onChange(next);
    setConfirmReset(false);
    setExportOpen(false);
    setFeedback(`${description} This changes presentation only, never permissions.`);
  }

  function check() {
    const next = ql319SavedViewState(inspectQl272LocalLayout());
    setRecovery(next);
    setFeedback(`Local saved-layout check: ${next.audit.title}. No server or account was contacted.`);
  }

  function restore() {
    const next = ql319SavedViewState(inspectQl272LocalLayout());
    setRecovery(next);
    if (!next.verifiedPreferences) {
      setFeedback('Restore blocked: the local record is missing, corrupt or unavailable. Safe defaults remain active.');
      return;
    }
    onRestore(next.verifiedPreferences);
    setConfirmReset(false);
    setExportOpen(false);
    setFeedback(`Restored verified layout “${next.audit.activeLabel ?? 'Standard'}” for display only. No role or account changed.`);
  }

  function reset() {
    if (!confirmReset) return;
    onReset(defaultQl272Preferences());
    setConfirmReset(false);
    setExportOpen(false);
    setRecovery(ql319SavedViewState(inspectQl272LocalLayout()));
    setFeedback('Standard defaults selected. Check the storage badge before assuming the replacement was saved; prior named layouts may be overwritten.');
  }

  return <section className="ql319-admin" aria-labelledby="ql319-title" data-ql319-admin>
    <header className="ql319-head">
      <div><p className="ql271-eyebrow">QL-319 · Admin / local display preferences</p>
        <h3 id="ql319-title">Operator settings &amp; recovery</h3>
        <p>One safe place to manage named screen layouts, navigation and help. This is an <strong>Admin-style preview</strong>, not an administrator login.</p></div>
      <div className="ql319-head-actions"><span className="ql319-safety">PREVIEW · NO LIVE ACTIONS</span>
        <button type="button" aria-expanded={open} aria-controls="ql319-body" onClick={() => setOpen(value => !value)}>{open ? 'Hide settings' : 'Open settings'}</button></div>
    </header>
    <div className="ql319-status-grid" aria-label="Settings status">
      <div><small>Current display</small><strong>{ql319ActiveSummary(preferences)}</strong></div>
      <div><small>Browser saved view</small><strong>{recovery.audit.status.toUpperCase()}</strong><span>{saved ? 'Validated local layout' : storageAvailable ? 'Safe in-tab layout' : 'Session only'}</span></div>
      <div><small>Access boundary</small><strong>{role.label} · DISPLAY ONLY</strong><span>No account grants, secret fields or tenant access</span></div>
    </div>
    {open && <div id="ql319-body" className="ql319-body">
      <div className="ql319-grid">
        <section className="ql319-card" aria-labelledby="ql319-layout-title"><h4 id="ql319-layout-title">01 · Layout &amp; reading density</h4>
          <p>Choose a saved layout for all four command screens. Each profile remembers card order and visibility.</p>
          <label htmlFor="ql319-profile">Active local profile</label>
          <select id="ql319-profile" value={preferences.activeId} onChange={event =>
            update({ ...preferences, activeId: event.currentTarget.value }, 'Selected an existing local profile.') }>
            {preferences.profiles.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}
          </select>
          <fieldset className="ql319-density"><legend>Text and card density</legend>
            {(['comfortable', 'compact'] as const).map(density => <label key={density}><input type="radio" name="ql319-density" value={density}
              checked={profile.density === density} onChange={() => update(editQl272ActiveProfile(preferences, current => ({ ...current, density: density as Ql272Density })), `${density === 'compact' ? 'Compact' : 'Comfortable'} density selected.`)} />
              {density === 'compact' ? 'Compact' : 'Comfortable'}</label>)}
          </fieldset>
          <small className="ql319-footnote">For card arrangement, use the adjacent <strong>Customize cards</strong> editor. Display role: {role.scope}.</small>
        </section>
        <section className="ql319-card" aria-labelledby="ql319-navigation-title"><h4 id="ql319-navigation-title">02 · Navigation &amp; shortcuts</h4>
          <p>Jump between preview command centres, or open the complete keyboard guide.</p>
          <div className="ql319-nav-actions">{destinations.map(item => <button key={item.mode} type="button" aria-current={mode === item.mode ? 'page' : undefined} onClick={() => onNavigate(item.mode)}>{item.label}</button>)}</div>
          <button type="button" aria-expanded={shortcutsOpen} aria-controls="ql319-shortcuts" onClick={() => setShortcutsOpen(value => !value)}>{shortcutsOpen ? 'Hide' : 'Show'} keyboard guide</button>
          {shortcutsOpen && <dl id="ql319-shortcuts" className="ql319-shortcuts">{QL273_SHORTCUTS.map(item => <div key={item.keys}><dt><kbd>{item.keys}</kbd></dt><dd>{item.action}</dd></div>)}</dl>}
          <small className="ql319-footnote">Shortcuts are ignored while typing in text fields and do not trigger live actions.</small>
        </section>
        <section className="ql319-card" aria-labelledby="ql319-recovery-title"><h4 id="ql319-recovery-title">03 · Saved-view integrity &amp; recovery</h4>
          <p><strong>{recovery.audit.title}</strong> — {recovery.audit.explanation}</p>
          <div className="ql319-card-actions"><button type="button" onClick={check}>Inspect saved profile</button>
            <button type="button" disabled={!recovery.verifiedPreferences} onClick={restore}>Restore saved layout</button></div>
          {recovery.canRepair && <p className="ql319-repair-note" role="alert">The stored record cannot be trusted. The Standard default is shown; restoration is disabled until a valid layout is saved.</p>}
          <button type="button" className="ql319-review-reset" aria-expanded={confirmReset} aria-controls="ql319-reset-confirm" onClick={() => setConfirmReset(value => !value)}>{confirmReset ? 'Cancel reset review' : 'Review reset to defaults'}</button>
          {confirmReset && <div id="ql319-reset-confirm" className="ql319-confirm" role="group" aria-label="Confirm local layout reset"><p>Reset replaces local layout choices with the three Standard profiles. Existing named profiles can be lost. No customer data or accounts are affected.</p>
            <button type="button" onClick={reset}>Confirm replace local layouts</button><button type="button" onClick={() => setConfirmReset(false)}>Keep existing layout</button></div>}
        </section>
        <section className="ql319-card" aria-labelledby="ql319-help-title"><h4 id="ql319-help-title">04 · Contextual help &amp; export readback</h4>
          <p>This screen: <strong>{help.purpose}</strong></p>
          <button type="button" aria-expanded={helpOpen} aria-controls="ql319-help" onClick={() => setHelpOpen(value => !value)}>{helpOpen ? 'Hide' : 'Show'} view-specific help</button>
          {helpOpen && <div id="ql319-help" className="ql319-detail"><p>{help.reading}</p><p>{help.next}</p><p>Admin settings never activate a provider or approve evidence.</p></div>}
          <button type="button" aria-expanded={exportOpen} aria-controls="ql319-export" disabled={!exportPreview} onClick={() => setExportOpen(value => !value)}>{exportOpen ? 'Close' : 'Review'} sanitized layout export</button>
          {exportOpen && exportPreview && <div id="ql319-export" className="ql319-export"><label htmlFor="ql319-export-text">Read-only local layout JSON — manually copy only if wanted</label>
            <textarea id="ql319-export-text" value={exportPreview} readOnly rows={7} spellCheck={false} /><small>No file, cloud upload, account transfer or clipboard write occurs automatically.</small></div>}
        </section>
      </div>
      <p className="ql319-feedback" role="status" aria-live="polite">{feedback}</p>
    </div>}
  </section>;
}

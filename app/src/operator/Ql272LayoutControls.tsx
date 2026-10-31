import { useState } from 'react';
import type { Ql271CommandMode } from './Ql271CommandSurfaces';
import {
  QL272_DENIED_ACTIONS, QL272_ROLE_PREVIEWS, activeQl272Profile, addQl272Profile,
  editQl272ActiveProfile, ql272PreviewCapabilities, reorderQl272Metric, toggleQl272Metric,
  type Ql272LayoutProfile, type Ql272MetricIndex, type Ql272PreferenceEnvelope,
  type Ql272RolePreview, type Ql272Density
} from './ql272LayoutPreferences';
import './ql272-layout.css';

export function Ql272LayoutControls({ preferences, mode, metricLabels, saved, storageAvailable, onChange, onReset }: {
  preferences: Ql272PreferenceEnvelope;
  mode: Ql271CommandMode;
  metricLabels: readonly string[];
  saved: boolean;
  storageAvailable: boolean;
  onChange: (next: Ql272PreferenceEnvelope) => void;
  onReset: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [nameError, setNameError] = useState(false);
  const profile = activeQl272Profile(preferences);
  const layout = profile.views[mode];
  const role = QL272_ROLE_PREVIEWS.find(option => option.id === profile.rolePreview) ?? QL272_ROLE_PREVIEWS[0];
  const capabilities = ql272PreviewCapabilities(profile.rolePreview);

  function updateProfile(edit: (current: Ql272LayoutProfile) => Ql272LayoutProfile) {
    onChange(editQl272ActiveProfile(preferences, edit));
  }

  function changeLayout(edit: (current: Ql272LayoutProfile['views'][Ql271CommandMode]) => Ql272LayoutProfile['views'][Ql271CommandMode]) {
    updateProfile(current => ({ ...current, views: { ...current.views, [mode]: edit(current.views[mode]) } }));
  }

  function addProfile() {
    const next = addQl272Profile(preferences, newName);
    if (!next) { setNameError(true); return; }
    onChange(next);
    setNameError(false);
    setNewName('');
  }

  return <section className="ql272-layout" aria-label="Personal command layout settings" data-layout-controls>
    <div className="ql272-toolbar">
      <div className="ql272-toolbar-label">
        <span aria-hidden="true">▦</span>
        <div><strong>{profile.label} layout</strong><small role="status" aria-live="polite" aria-atomic="true">{role.label} preview · {profile.density === 'compact' ? 'Compact' : 'Comfortable'} · {saved ? 'Saved on this device' : storageAvailable ? 'No verified saved layout — safe defaults' : 'Storage unavailable — session only'}</small></div>
      </div>
      <div className="ql272-toolbar-actions">
        <span className="ql272-local-pill">LOCAL ONLY</span>
        <button type="button" className={open ? 'active' : ''} aria-expanded={open} aria-controls="ql272-editor" onClick={() => setOpen(value => !value)}>{open ? 'Close layout editor' : 'Customize cards'} <span aria-hidden="true">⚙</span></button>
      </div>
    </div>

    {open && <div id="ql272-editor" className="ql272-editor">
      <p className="ql272-editor-warning" role="note">Layout settings are saved only in this browser. Role selections are <strong>display previews, never access grants</strong>. Do not enter personal information, tenant identifiers or secrets.</p>
      <div className="ql272-editor-settings">
        <label>Layout profile
          <select aria-label="Layout profile" value={preferences.activeId}
            onChange={event => onChange({ ...preferences, activeId: event.currentTarget.value })}>
            {preferences.profiles.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}
          </select>
        </label>
        <label>Screen density
          <select aria-label="Screen density" value={profile.density} onChange={event =>
            updateProfile(current => ({ ...current, density: event.currentTarget.value as Ql272Density }))}>
            <option value="comfortable">Comfortable</option><option value="compact">Compact · more on screen</option>
          </select>
        </label>
        <label>Role-safe preview
          <select aria-label="Role-safe preview" value={profile.rolePreview} onChange={event =>
            updateProfile(current => ({ ...current, rolePreview: event.currentTarget.value as Ql272RolePreview }))}>
            {QL272_ROLE_PREVIEWS.map(option => <option key={option.id} value={option.id}>{option.label} (read-only)</option>)}
          </select>
        </label>
      </div>
      <div className="ql272-editor-columns">
        <section className="ql272-card-editor" aria-label="Command card visibility and order">
          <h4>Cards on this screen <small>{4 - layout.hidden.length} of 4 visible</small></h4>
          <p>Choose cards and arrange them in the order you want. At least one stays visible.</p>
          {layout.order.map((index, position) => <div className="ql272-card-editor-row" key={index}>
            <span>{position + 1}</span><strong>{metricLabels[index]}</strong>
            <button type="button" aria-pressed={!layout.hidden.includes(index)} aria-label={`${layout.hidden.includes(index) ? 'Show' : 'Hide'} ${metricLabels[index]}`}
              onClick={() => changeLayout(current => toggleQl272Metric(current, index))}>{layout.hidden.includes(index) ? 'Show' : 'Visible'}</button>
            <button type="button" aria-label={`Move ${metricLabels[index]} up`} disabled={position === 0}
              onClick={() => changeLayout(current => reorderQl272Metric(current, index, -1))}>↑</button>
            <button type="button" aria-label={`Move ${metricLabels[index]} down`} disabled={position === 3}
              onClick={() => changeLayout(current => reorderQl272Metric(current, index, 1))}>↓</button>
          </div>)}
          <label className="ql272-panel-toggle"><input type="checkbox" checked={layout.showPanels}
            onChange={event => changeLayout(current => ({ ...current, showPanels: event.currentTarget.checked }))} />Show detailed panels below the cards</label>
        </section>
        <section className="ql272-role-panel" aria-label="Role preview safety matrix">
          <h4>{role.label} · preview scope</h4>
          <p>{role.scope}. This changes presentation only; there is no signed-in role or new server permission.</p>
          {capabilities.readSyntheticLocalExamples && capabilities.inspectDatedPublicEvidence &&
            <p className="ql272-role-allow">✓ Read fictional examples and previously observed public status</p>}
          <h5>Never permitted by this screen</h5>
          <ul>{QL272_DENIED_ACTIONS.map(action => <li key={action}>× {action}</li>)}</ul>
        </section>
      </div>
      <div className="ql272-save-row">
        <label>Save a copy of this layout
          <input type="text" maxLength={28} value={newName} placeholder="e.g. Morning command"
            aria-invalid={nameError} onChange={event => { setNewName(event.currentTarget.value); setNameError(false); }} />
        </label>
        <button type="button" onClick={addProfile} disabled={preferences.profiles.length >= 6}>Save named profile</button>
        <button type="button" className="ql272-reset" onClick={() => { onReset(); setNameError(false); }}>Restore defaults</button>
      </div>
      {nameError && <p role="alert" className="ql272-error">Choose a unique, short generic name using letters, numbers, spaces, dots, underscores or hyphens.</p>}
      {preferences.profiles.length >= 6 && <p className="ql272-limit">Six local profiles are the maximum. Restore defaults to start over.</p>}
    </div>}
  </section>;
}

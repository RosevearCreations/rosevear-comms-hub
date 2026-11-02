export type Ql312Density = 'comfortable' | 'compact';
export type Ql312Contrast = 'standard' | 'high';

const categorySwatches = [
  { name: 'Front End / Operator', tone: 'cyan' },
  { name: 'Admin', tone: 'violet' },
  { name: 'I.T. / Connections', tone: 'blue' },
  { name: 'Management', tone: 'gold' },
  { name: 'Statistical', tone: 'green' },
  { name: 'System Status', tone: 'rose' }
] as const;

export function Ql312ThemeControls({ density, onDensityChange, contrast, onContrastChange }: {
  density: Ql312Density;
  onDensityChange: (next: Ql312Density) => void;
  contrast: Ql312Contrast;
  onContrastChange: (next: Ql312Contrast) => void;
}) {
  return <section className="ql312-toolbar" aria-label="Standard theme display controls" data-ql312-controls="true">
    <div className="ql312-brand-mark" aria-hidden="true">◈</div>
    <div className="ql312-toolbar-intro"><strong>Standard Theme</strong><small>QL-312 · visual controls · this session only</small></div>
    <div className="ql312-toolbar-actions">
      <div className="ql312-choice" role="group" aria-label="Card density">
        <span>Cards</span>
        <button type="button" aria-pressed={density === 'comfortable'} onClick={() => onDensityChange('comfortable')}>Comfortable</button>
        <button type="button" aria-pressed={density === 'compact'} onClick={() => onDensityChange('compact')}>Compact</button>
      </div>
      <div className="ql312-choice" role="group" aria-label="Visual contrast">
        <span>Contrast</span>
        <button type="button" aria-pressed={contrast === 'standard'} onClick={() => onContrastChange('standard')}>Standard</button>
        <button type="button" aria-pressed={contrast === 'high'} onClick={() => onContrastChange('high')}>High</button>
      </div>
    </div>
    <details className="ql312-style-help">
      <summary>ⓘ Colour & status guide</summary>
      <p>Category colours make navigation easier to scan; the category names remain visible, so colour is never the only identifier. Bright operator cards and dark command cards share typography, spacing, control sizes and focus treatment.</p>
      <ul className="ql312-swatches" aria-label="Command category colours">
        {categorySwatches.map(item => <li key={item.tone} className={`ql312-swatch ql312-swatch-${item.tone}`}><span aria-hidden="true" />{item.name}</li>)}
      </ul>
      <div className="ql312-status-legend" aria-label="Safety status meanings">
        <span className="ql312-chip ql312-chip-preview">PREVIEW ONLY · synthetic</span>
        <span className="ql312-chip ql312-chip-hold">DISCONNECTED / HOLD · no live connection</span>
        <span className="ql312-chip ql312-chip-review">UNDER REVIEW · evidence not approved</span>
      </div>
      <p>Comfortable and Compact only change visual spacing. High contrast increases visible borders and focus. Neither control enables an integration, saves a preference, or counts as an owner device test. Use browser zoom for 200–400% readability checks.</p>
      <p>Optional Supabase admin login remains off and is not needed for the public six-app proof handoff. The QL-311 technical configuration help above the application explains any missing <code>VITE_</code> values; leave them unset until separately approved.</p>
    </details>
  </section>;
}

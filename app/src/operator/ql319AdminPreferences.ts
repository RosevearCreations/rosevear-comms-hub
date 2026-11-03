import type { Ql272LocalSnapshot } from '../storage/localRepository';
import { auditQl273SavedView, savedQl273Preferences } from './ql273CommandHelp';
import { activeQl272Profile, parseQl272Preferences, type Ql272PreferenceEnvelope } from './ql272LayoutPreferences';

// The export is a human-readable preview of the existing, validated v1 layout
// record. It never includes CRM data, account tokens, role grants or tenant IDs.
export function ql319ExportPreview(preferences: Ql272PreferenceEnvelope): string | null {
  try {
    const compact = JSON.stringify(preferences);
    if (compact.length > 12000 || JSON.stringify(parseQl272Preferences(preferences)) !== compact) return null;
    return JSON.stringify(parseQl272Preferences(preferences), null, 2);
  } catch {
    return null;
  }
}

export function ql319SavedViewState(snapshot: Ql272LocalSnapshot) {
  const audit = auditQl273SavedView(snapshot);
  return {
    audit,
    verifiedPreferences: savedQl273Preferences(snapshot),
    canRepair: audit.status === 'invalid' || audit.status === 'malformed'
  };
}

export function ql319ActiveSummary(preferences: Ql272PreferenceEnvelope) {
  const current = activeQl272Profile(preferences);
  return `${current.label} · ${current.density === 'compact' ? 'Compact' : 'Comfortable'} · ${current.rolePreview.replace('_', ' ')} display preview`;
}

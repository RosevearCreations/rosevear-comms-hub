import type { Ql271CommandMode } from './Ql271CommandSurfaces';
import type { Ql272LocalSnapshot } from '../storage/localRepository';
import { parseQl272Preferences, type Ql272PreferenceEnvelope } from './ql272LayoutPreferences';

export const QL273_VIEW_HELP: Record<Ql271CommandMode, { purpose: string; reading: string; next: string }> = {
  it_command: {
    purpose: 'Inspect six source mappings and the independent connection-release checklist.',
    reading: 'Registry counts are known mappings. Proofs verified and gateway requests are zero, not live health measurements.',
    next: 'Open Connections to inspect the held preflight and Six-app evidence to review existing receipt exceptions.'
  },
  management: {
    purpose: 'Compare four separate fictional business desks without mixing company or customer information.',
    reading: 'Queues and follow-ups are local training fixtures. No employee, payment or customer activity is measured.',
    next: 'Open the current company task preview to rehearse a safe follow-up.'
  },
  analytics: {
    purpose: 'Understand the distribution of sixteen fabricated communication scenarios.',
    reading: 'Four equal categories are a training mix, not a revenue, conversion, staffing or live traffic forecast.',
    next: 'Check the approval funnel before interpreting any integration-readiness number.'
  },
  system_status: {
    purpose: 'Read the dated proof observations and explicit runtime safety switches.',
    reading: 'HTTP 404 labels are historical observations, not a fresh heartbeat or a failed production deployment.',
    next: 'Review six-app evidence for the original signed Proof-B, independent witness and TEST authorization blockers.'
  }
};

export const QL273_METRIC_HELP: Record<Ql271CommandMode, readonly string[]> = {
  it_command: [
    'Six repository mappings are registered. Registration never means a tenant is connected.',
    'No original signed Proof-B was independently accepted for any of the six applications.',
    'Zero authenticated requests have been sent; approval of the separate TEST-only gate is still required.',
    'Twelve release safeguards remain held. A GREEN interface deployment does not remove them.'
  ],
  management: [
    'Four isolated business demo workspaces: Rosie Dazzlers, Devil n Dove, Yard Workers and iCamp.',
    'Sixteen fixed training scenarios; nothing here comes from actual company conversations.',
    'Four examples are mock tasks without real staff assignment or scheduled dispatch.',
    'None of the four business workspaces has a verified live tenant connection.'
  ],
  analytics: [
    'The entire displayed activity sample is fictional, with four events per company.',
    'Reply scenarios are a category count, not a response rate or response-time measurement.',
    'Categories describe the example data only: reply, missed call, intake and follow-up.',
    'There is no live analytics feed from AI Data Platform or any other connected tenant.'
  ],
  system_status: [
    'Six source repositories are in the registry. Source identity does not grant runtime access.',
    'Historical source-file observations returned 404 at their pinned commit references.',
    'No verified tenant authorization is active; the display does not inspect private tenant data.',
    'Twelve safety holds remain active for the integration trial and communications runtime.'
  ]
};

export const QL273_SHORTCUTS = [
  { keys: 'Alt + Shift + 1', action: 'IT Command' },
  { keys: 'Alt + Shift + 2', action: 'Management' },
  { keys: 'Alt + Shift + 3', action: 'Analytics' },
  { keys: 'Alt + Shift + 4', action: 'System Status' },
  { keys: 'Alt + Shift + H', action: 'Contextual help' },
  { keys: 'Alt + Shift + R', action: 'Saved-view recovery audit' },
  { keys: 'Escape', action: 'Close an open help, shortcuts or audit panel' }
] as const;

export type Ql273AuditStatus = 'valid' | 'missing' | 'invalid' | 'malformed' | 'unavailable';
export type Ql273Audit = {
  status: Ql273AuditStatus;
  title: string;
  explanation: string;
  profileCount: number;
  activeLabel: string | null;
};

// Fail closed on an unfamiliar schema or extra fields rather than rehydrating
// untrusted browser data as configuration. This audit never sends the value.
export function auditQl273SavedView(snapshot: Ql272LocalSnapshot): Ql273Audit {
  const defaults = { profileCount: 0, activeLabel: null };
  if (snapshot.state === 'missing') return { status: 'missing', title: 'No saved view yet',
    explanation: 'The safe Standard view is available. Save a layout in Customize cards to keep it on this device.', ...defaults };
  if (snapshot.state === 'unavailable') return { status: 'unavailable', title: 'Browser storage unavailable',
    explanation: 'Use this session without a persistence claim. Check browser storage permissions before relying on recovery.', ...defaults };
  if (snapshot.state === 'malformed') return { status: 'malformed', title: 'Saved view cannot be decoded',
    explanation: 'The local saved value is not valid JSON. You may replace it with the safe default layout after reviewing this warning.', ...defaults };
  const parsed = parseQl272Preferences(snapshot.value);
  if (JSON.stringify(parsed) !== JSON.stringify(snapshot.value)) return {
    status: 'invalid', title: 'Saved view failed the integrity check',
    explanation: 'The local record has an unsupported or changed shape. The safe default is shown; no stored permission is trusted.', ...defaults
  };
  const active = parsed.profiles.find(profile => profile.id === parsed.activeId);
  return { status: 'valid', title: 'Saved view integrity verified',
    explanation: 'This is a local format check only. It is not a cryptographic proof, identity audit or connection authorization.',
    profileCount: parsed.profiles.length, activeLabel: active?.label ?? null };
}

export function savedQl273Preferences(snapshot: Ql272LocalSnapshot): Ql272PreferenceEnvelope | null {
  return auditQl273SavedView(snapshot).status === 'valid' ? parseQl272Preferences(snapshot.value) : null;
}

export function ql273ShortcutMode(event: Pick<KeyboardEvent, 'altKey' | 'shiftKey' | 'ctrlKey' | 'metaKey' | 'code'>): Ql271CommandMode | null {
  if (!event.altKey || !event.shiftKey || event.ctrlKey || event.metaKey) return null;
  return ({ Digit1: 'it_command', Digit2: 'management', Digit3: 'analytics', Digit4: 'system_status' } as Record<string, Ql271CommandMode>)[event.code] ?? null;
}

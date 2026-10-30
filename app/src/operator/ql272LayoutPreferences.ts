import type { Ql271CommandMode } from './Ql271CommandSurfaces';

export type Ql272RolePreview = 'operator' | 'manager' | 'it_reviewer';
export type Ql272Density = 'comfortable' | 'compact';
export type Ql272MetricIndex = 0 | 1 | 2 | 3;

export type Ql272ViewLayout = {
  order: Ql272MetricIndex[];
  hidden: Ql272MetricIndex[];
  showPanels: boolean;
};

export type Ql272LayoutProfile = {
  id: string;
  label: string;
  rolePreview: Ql272RolePreview;
  density: Ql272Density;
  views: Record<Ql271CommandMode, Ql272ViewLayout>;
};

export type Ql272PreferenceEnvelope = {
  version: 1;
  activeId: string;
  profiles: Ql272LayoutProfile[];
};

export const QL272_VIEWS: readonly Ql271CommandMode[] = ['it_command', 'management', 'analytics', 'system_status'];
export const QL272_ROLE_PREVIEWS = [
  { id: 'operator', label: 'Operator', scope: 'Fictional company queues and read-only source status' },
  { id: 'manager', label: 'Manager', scope: 'Sample business oversight and held release summaries' },
  { id: 'it_reviewer', label: 'IT reviewer', scope: 'Public origin observations and independent proof checklist' }
] as const;

export const QL272_DENIED_ACTIONS = [
  'Create or assign real access credentials',
  'Accept signed proof or witness roles',
  'Request an authenticated gateway GET',
  'Access live tenant or customer records',
  'Activate calls, SMS, dispatch or device control'
] as const;

// A preview persona must never be consumed as authentication, an API scope or a
// connection authorization. All protected capabilities are denied for every
// profile; the only allowed operations remain local reading and layout editing.
export function ql272PreviewCapabilities(_role: Ql272RolePreview) {
  return {
    readSyntheticLocalExamples: true,
    inspectDatedPublicEvidence: true,
    provisionCredentials: false,
    acceptIndependentSignature: false,
    accessRealTenant: false,
    issueAuthenticatedGet: false,
    sendLiveCommunications: false
  } as const;
}

function view(order: Ql272MetricIndex[] = [0, 1, 2, 3], showPanels = true): Ql272ViewLayout {
  return { order: [...order], hidden: [], showPanels };
}

function views(order?: Ql272MetricIndex[], showPanels = true): Record<Ql271CommandMode, Ql272ViewLayout> {
  return {
    it_command: view(order, showPanels),
    management: view(order, showPanels),
    analytics: view(order, showPanels),
    system_status: view(order, showPanels)
  };
}

export function defaultQl272Preferences(): Ql272PreferenceEnvelope {
  return {
    version: 1,
    activeId: 'standard',
    profiles: [
      { id: 'standard', label: 'Standard', rolePreview: 'operator', density: 'comfortable', views: views() },
      { id: 'compact', label: 'Compact command', rolePreview: 'manager', density: 'compact', views: views() },
      { id: 'it-review', label: 'IT review', rolePreview: 'it_reviewer', density: 'compact', views: views([1, 0, 3, 2]) }
    ]
  };
}

function isObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function validIndexArray(value: unknown, uniqueCount?: number): value is Ql272MetricIndex[] {
  return Array.isArray(value) && (uniqueCount === undefined || value.length === uniqueCount) &&
    value.every(entry => Number.isInteger(entry) && entry >= 0 && entry <= 3) &&
    new Set(value).size === value.length;
}

export function parseQl272Preferences(raw: unknown): Ql272PreferenceEnvelope {
  const fallback = defaultQl272Preferences();
  if (!isObject(raw) || raw.version !== 1 || !Array.isArray(raw.profiles) || raw.profiles.length < 1 || raw.profiles.length > 6) return fallback;
  const profiles: Ql272LayoutProfile[] = [];
  for (const item of raw.profiles) {
    if (!isObject(item) || typeof item.id !== 'string' || !/^[a-z0-9-]{1,32}$/.test(item.id) ||
      typeof item.label !== 'string' || item.label.length < 1 || item.label.length > 28 ||
      !QL272_ROLE_PREVIEWS.some(role => role.id === item.rolePreview) ||
      !['comfortable', 'compact'].includes(String(item.density)) || !isObject(item.views)) return fallback;

    const validatedViews = {} as Record<Ql271CommandMode, Ql272ViewLayout>;
    for (const mode of QL272_VIEWS) {
      const candidate = item.views[mode];
      if (!isObject(candidate) || !validIndexArray(candidate.order, 4) ||
        !validIndexArray(candidate.hidden) || candidate.hidden.length > 3 ||
        typeof candidate.showPanels !== 'boolean') return fallback;
      validatedViews[mode] = { order: [...candidate.order], hidden: [...candidate.hidden], showPanels: candidate.showPanels };
    }
    profiles.push({ id: item.id, label: item.label, rolePreview: item.rolePreview as Ql272RolePreview,
      density: item.density as Ql272Density, views: validatedViews });
  }
  if (new Set(profiles.map(profile => profile.id)).size !== profiles.length ||
    typeof raw.activeId !== 'string' || !profiles.some(profile => profile.id === raw.activeId)) return fallback;
  return { version: 1, activeId: raw.activeId, profiles };
}

export function activeQl272Profile(preferences: Ql272PreferenceEnvelope): Ql272LayoutProfile {
  return preferences.profiles.find(profile => profile.id === preferences.activeId) ?? preferences.profiles[0];
}

export function editQl272ActiveProfile(preferences: Ql272PreferenceEnvelope,
  edit: (profile: Ql272LayoutProfile) => Ql272LayoutProfile): Ql272PreferenceEnvelope {
  return { ...preferences, profiles: preferences.profiles.map(profile => profile.id === preferences.activeId ? edit(profile) : profile) };
}

export function reorderQl272Metric(layout: Ql272ViewLayout, index: Ql272MetricIndex, direction: -1 | 1): Ql272ViewLayout {
  const order = [...layout.order];
  const from = order.indexOf(index);
  const to = from + direction;
  if (from < 0 || to < 0 || to >= order.length) return layout;
  [order[from], order[to]] = [order[to], order[from]];
  return { ...layout, order };
}

export function toggleQl272Metric(layout: Ql272ViewLayout, index: Ql272MetricIndex): Ql272ViewLayout {
  if (layout.hidden.includes(index)) return { ...layout, hidden: layout.hidden.filter(value => value !== index) };
  if (layout.hidden.length >= 3) return layout; // Never leave a blank command strip.
  return { ...layout, hidden: [...layout.hidden, index] };
}

export function addQl272Profile(preferences: Ql272PreferenceEnvelope, name: string): Ql272PreferenceEnvelope | null {
  const label = name.trim().replace(/\s+/g, ' ').slice(0, 28);
  if (!/^[\p{L}\p{N}][\p{L}\p{N} ._-]{0,27}$/u.test(label) || preferences.profiles.length >= 6 ||
    preferences.profiles.some(profile => profile.label.toLowerCase() === label.toLowerCase())) return null;
  const existing = activeQl272Profile(preferences);
  const id = `layout-${Array.from({ length: 100 }, (_, i) => i + 1).find(n =>
    !preferences.profiles.some(profile => profile.id === `layout-${n}`)) ?? 100}`;
  const next: Ql272LayoutProfile = { ...existing, id, label,
    views: Object.fromEntries(QL272_VIEWS.map(mode => [mode, { ...existing.views[mode],
      order: [...existing.views[mode].order], hidden: [...existing.views[mode].hidden] }])) as Record<Ql271CommandMode, Ql272ViewLayout> };
  return { ...preferences, activeId: id, profiles: [...preferences.profiles, next] };
}

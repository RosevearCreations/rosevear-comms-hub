import type { OrganizationId } from './ql191Organizations';

export type Ql299Device = 'desktop' | 'tablet' | 'mobile';
export type Ql299Disposition = 'unreviewed' | 'reproduced_locally' | 'needs_owner_retest' | 'deferred';
export type Ql299CheckId = 'keyboard' | 'focus' | 'contrast' | 'zoom' | 'screen_reader';
export interface Ql299Check {
  id: Ql299CheckId;
  label: string;
  steps: string;
  expected: string;
}
export const ql299Devices: readonly Ql299Device[] = ['desktop', 'tablet', 'mobile'];
export const ql299Checks: readonly Ql299Check[] = [
  { id: 'keyboard', label: 'Keyboard-only navigation', steps: 'From the company switcher, Tab through navigation, activate the review workspace with Enter, and return using Shift+Tab.', expected: 'Every interactive control is reachable and operable; no keyboard trap.' },
  { id: 'focus', label: 'Visible focus and order', steps: 'Tab from navigation search to workspace controls, open the device selector and move between disposition controls.', expected: 'Focus indicator is visible, focus order follows reading order, and changing the device does not steal focus.' },
  { id: 'contrast', label: 'Contrast and forced colors', steps: 'Inspect primary text, warning, badges and controls in standard and forced-colors modes.', expected: 'Text, controls and focus remain discernible with system colors; color alone never conveys status.' },
  { id: 'zoom', label: 'Text zoom and reflow', steps: 'At each device width, increase browser text zoom to 200% and page zoom to 400%; inspect headings, controls and the checklist.', expected: 'No content or operation is lost; long instructions reflow without two-dimensional scrolling.' },
  { id: 'screen_reader', label: 'Screen-reader landmarks and announcements', steps: 'Navigate by heading, landmark and button in a screen reader; change a local disposition and listen for the updated summary.', expected: 'Names and headings identify controls; status is announced; no simulated owner sign-off is claimed.' },
] as const;
export type Ql299Ledger = Partial<Record<OrganizationId, Partial<Record<`${Ql299Device}:${Ql299CheckId}`, Ql299Disposition>>>>;

export function ql299Key(device: Ql299Device, check: Ql299CheckId) { return `${device}:${check}` as const; }

export function ql299Update(ledger: Ql299Ledger, organization: OrganizationId, device: Ql299Device, check: Ql299CheckId, disposition: Ql299Disposition): Ql299Ledger {
  if (!['rosiedazzlers', 'devilndove', 'icamp', 'yw'].includes(organization) || !ql299Devices.includes(device) || !ql299Checks.some((item) => item.id === check) || !['unreviewed', 'reproduced_locally', 'needs_owner_retest', 'deferred'].includes(disposition)) throw new Error('Invalid accessibility review entry');
  const current = { ...ledger[organization] };
  if (disposition === 'unreviewed') delete current[ql299Key(device, check)];
  else current[ql299Key(device, check)] = disposition;
  return { ...ledger, [organization]: current };
}

export function ql299Summary(ledger: Ql299Ledger, organization: OrganizationId) {
  const entries = ql299Devices.flatMap((device) => ql299Checks.map((check) => ledger[organization]?.[ql299Key(device, check.id)] ?? 'unreviewed'));
  return { total: entries.length, unreviewed: entries.filter((value) => value === 'unreviewed').length, reproduced: entries.filter((value) => value === 'reproduced_locally').length, ownerRetest: entries.filter((value) => value === 'needs_owner_retest').length, deferred: entries.filter((value) => value === 'deferred').length, ownerVerified: 0 };
}

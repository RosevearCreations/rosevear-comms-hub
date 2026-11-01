import { auditQl273SavedView, savedQl273Preferences } from './ql273CommandHelp';
import type { Ql272LocalSnapshot } from '../storage/localRepository';

export const QL300_ACCEPTANCE = [
  { id: 'keyboard', title: 'Keyboard and shortcut discovery', steps: 'Tab to Keyboard shortcuts; open it with Enter, use Alt + Shift + 1–4 outside a text field, then Escape to close the panel.', expected: 'The shortcut guide has named controls, input fields are not hijacked, and the current command view is identifiable.' },
  { id: 'motion', title: 'Reduced motion', steps: 'Enable the operating system Reduce Motion setting, then navigate between command views and expand Customize cards.', expected: 'No animated movement is required to understand the page; controls and status remain readable.' },
  { id: 'contrast', title: 'High contrast and text reflow', steps: 'Enable forced colors/high contrast, then test keyboard focus and 200% text zoom on mobile, tablet and desktop widths.', expected: 'The active density choice and keyboard focus remain visible; headings, buttons and recovery information reflow.' },
  { id: 'recovery', title: 'Saved profile refresh and recovery', steps: 'Choose Compact, refresh, reopen the command workspace, check the saved-view audit and activate Restore verified layout.', expected: 'Only a schema-valid local layout is restored. Invalid or unavailable storage falls back safely without any permission or owner sign-off.' }
] as const;

export function ql300Recovery(snapshot: Ql272LocalSnapshot) {
  const audit = auditQl273SavedView(snapshot);
  return { audit, recovered: savedQl273Preferences(snapshot), canRestore: audit.status === 'valid' };
}

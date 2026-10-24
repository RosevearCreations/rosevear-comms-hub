import type { BrandId } from '../types';

export const QL183_VERSION = 'ql183-operator-usability-acceptance-v1';

export const QL183_MODES = [
  { id: 'keyboard', label: 'Keyboard walkthrough', instruction: 'Use Tab, Shift+Tab, Enter and Space. Do not use a mouse for this rehearsal.' },
  { id: 'screen_reader', label: 'Screen-reader walkthrough', instruction: 'Use a screen reader and its landmark, heading and form-control commands. A checklist cannot verify assistive technology by itself.' },
  { id: 'mobile', label: 'Mobile walkthrough', instruction: 'Use a narrow viewport or actual phone; review at 320 px, 375 px and 760 px with 200% text zoom.' }
] as const;

export type Ql183Mode = (typeof QL183_MODES)[number]['id'];
export type Ql183Feedback = 'NOT_TESTED' | 'SELF_REPORTED_USABLE' | 'NEEDS_IMPROVEMENT';

export interface Ql183Task {
  id: string;
  mode: Ql183Mode;
  title: string;
  workspace: string;
  action: string;
  expected: string;
  issueCategory: 'focus' | 'announcement' | 'layout';
}

// This is a manual rehearsal script, not the result of automated browser or
// assistive-technology testing. It contains no customer or operator identity.
export const QL183_TASKS: ReadonlyArray<Ql183Task> = [
  {
    id: 'key_skip', mode: 'keyboard', title: 'Skip repeated navigation', workspace: 'Operator workspace',
    action: 'On page load, press Tab until the Skip to operator workspace link is focused; activate it.',
    expected: 'Focus can move to the main workspace without traversing the full sidebar.', issueCategory: 'focus'
  },
  {
    id: 'key_brand', mode: 'keyboard', title: 'Change business without a pointer', workspace: 'Business selector',
    action: 'Tab to the two business buttons and activate the other brand; inspect the active pressed state.',
    expected: 'The active brand is announced and only that brand is shown in the workspace context.', issueCategory: 'focus'
  },
  {
    id: 'key_journey', mode: 'keyboard', title: 'Navigate a sample journey', workspace: 'Safety & hold review',
    action: 'Use the QL-182 scenario selector, checkpoint buttons, Previous, Next and Restart with the keyboard.',
    expected: 'The selected step is identifiable and no action can send a message or clear a live hold.', issueCategory: 'focus'
  },
  {
    id: 'sr_landmarks', mode: 'screen_reader', title: 'Identify regions and current workspace', workspace: 'Operator workspace',
    action: 'Navigate by landmarks and headings, then read the workspace navigation and current item.',
    expected: 'The main area, workspace name and active navigation destination can be understood without visual cues.', issueCategory: 'announcement'
  },
  {
    id: 'sr_controls', mode: 'screen_reader', title: 'Hear sample controls and changes', workspace: 'Safety & hold review',
    action: 'Hear the QL-182 scenario label, selected checkpoint and changing evidence detail.',
    expected: 'Controls have understandable names, the current step is identified and changed evidence can be announced.', issueCategory: 'announcement'
  },
  {
    id: 'sr_safety', mode: 'screen_reader', title: 'Understand the safety boundary', workspace: 'Safety & hold review',
    action: 'Read the QL-181 live-pilot hold and the QL-182 simulated-only result without relying on colours.',
    expected: 'It is unambiguous that the preview cannot place calls, send SMS, collect approvals or contact customers.', issueCategory: 'announcement'
  },
  {
    id: 'mobile_320', mode: 'mobile', title: 'Small phone layout · 320 px', workspace: 'Operator navigation',
    action: 'At 320 px width, move through both brand buttons and all workspace navigation entries.',
    expected: 'No clipped labels or overlapping controls; buttons remain readable and comfortably tappable.', issueCategory: 'layout'
  },
  {
    id: 'mobile_375', mode: 'mobile', title: 'Phone journey · 375 px', workspace: 'Safety & hold review',
    action: 'At 375 px width, choose a QL-182 scenario and visit every checkpoint.',
    expected: 'The selector, cards, focus indicators and review actions are usable without horizontal page scrolling.', issueCategory: 'layout'
  },
  {
    id: 'mobile_zoom', mode: 'mobile', title: 'Zoom and orientation', workspace: 'Synthetic conversations',
    action: 'At 760 px and with 200% text zoom, inspect the conversation preview, task simulation and disabled labels.',
    expected: 'Reading order and safety wording remain clear; long values wrap and no essential content is hidden.', issueCategory: 'layout'
  }
];

export interface Ql183Assessment {
  version: typeof QL183_VERSION;
  brandId: BrandId | null;
  disposition: 'INCOMPLETE_SELF_REVIEW' | 'NEEDS_REMEDIATION' | 'SELF_REPORTED_READY_FOR_INDEPENDENT_REVIEW' | 'DENIED_INVALID_REHEARSAL';
  total: number;
  usable: number;
  needsImprovement: number;
  notTested: number;
  flaggedTaskIds: string[];
  syntheticTrainingOnly: true;
  verifiedAccessibilityAudit: false;
  livePilotAuthorized: false;
  heldPrerequisites: 12;
  externalWrites: 0;
  messagesSent: 0;
  callsPlaced: 0;
  ownerApprovals: 0;
}

const allowedIds = new Set(QL183_TASKS.map(task => task.id));
const allowedFeedback = new Set<Ql183Feedback>(['NOT_TESTED', 'SELF_REPORTED_USABLE', 'NEEDS_IMPROVEMENT']);

export function assessQl183Rehearsal(brandId: unknown, input: unknown): Ql183Assessment {
  const base = {
    version: QL183_VERSION, syntheticTrainingOnly: true, verifiedAccessibilityAudit: false,
    livePilotAuthorized: false, heldPrerequisites: 12, externalWrites: 0, messagesSent: 0,
    callsPlaced: 0, ownerApprovals: 0
  } as const;
  const validBrand = brandId === 'rosiedazzlers' || brandId === 'devilndove';
  const validInput = input !== null && typeof input === 'object' && !Array.isArray(input)
    && (Object.getPrototypeOf(input) === Object.prototype || Object.getPrototypeOf(input) === null)
    && Object.entries(input).every(([id, status]) => allowedIds.has(id) && allowedFeedback.has(status as Ql183Feedback));
  if (!validBrand || !validInput) {
    return { ...base, brandId: null, disposition: 'DENIED_INVALID_REHEARSAL', total: 0,
      usable: 0, needsImprovement: 0, notTested: 0, flaggedTaskIds: [] };
  }

  const outcomes = input as Record<string, Ql183Feedback>;
  const usable = QL183_TASKS.filter(task => outcomes[task.id] === 'SELF_REPORTED_USABLE').length;
  const flaggedTaskIds = QL183_TASKS.filter(task => outcomes[task.id] === 'NEEDS_IMPROVEMENT').map(task => task.id);
  const notTested = QL183_TASKS.length - usable - flaggedTaskIds.length;
  const disposition = flaggedTaskIds.length ? 'NEEDS_REMEDIATION'
    : notTested ? 'INCOMPLETE_SELF_REVIEW' : 'SELF_REPORTED_READY_FOR_INDEPENDENT_REVIEW';
  return { ...base, brandId, disposition, total: QL183_TASKS.length, usable,
    needsImprovement: flaggedTaskIds.length, notTested, flaggedTaskIds };
}

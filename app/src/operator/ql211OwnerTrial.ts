import { operatorOrganizations, type OrganizationId, type OperatorWorkspace } from './ql191Organizations';
import { QL181_PREREQUISITES } from './ql181PrivacyPilotGate';
import { evaluateQl210Portfolio } from './ql210ApplicationAcceptance';

export const QL211_RELEASE = 'ql211-owner-observed-four-company-trial-disabled-preview-v1';
export type Ql211Outcome = 'not_run' | 'observed_pass' | 'observed_gap' | 'blocked';
export type Ql211Severity = 'critical' | 'high' | 'medium' | 'low';
export type Ql211Area = 'usability' | 'accessibility' | 'workflow' | 'isolation' | 'safety';
export type Ql211ScenarioId = 'inbox' | 'contact' | 'followup' | 'phone' | 'consent' | 'handoff' | 'isolation' | 'reports' | 'keyboard' | 'mobile';
export type Ql211Observation = Readonly<{
  outcome: Ql211Outcome;
  severity: Ql211Severity;
  area: Ql211Area;
  note: string;
}>;
export type Ql211Ledger = Partial<Record<OrganizationId, Partial<Record<Ql211ScenarioId, Ql211Observation>>>>;
export type Ql211Scenario = Readonly<{
  id: Ql211ScenarioId;
  title: string;
  workspace: OperatorWorkspace;
  steps: string;
  expected: string;
}>;
export type Ql211Finding = Readonly<{
  id: Ql211ScenarioId;
  title: string;
  priority: 'P0' | 'P1' | 'P2' | 'P3';
  area: Ql211Area;
  outcome: 'observed_gap' | 'blocked';
  note: string;
  nextAction: string;
}>;

export function scenariosForCompany(organizationId: OrganizationId): readonly Ql211Scenario[] {
  const company = operatorOrganizations.find((entry) => entry.id === organizationId);
  const examples: Record<OrganizationId, { inquiry: string; context: string }> = {
    rosiedazzlers: { inquiry: 'detailing quotation', context: 'vehicle service request' },
    devilndove: { inquiry: 'custom maker commission', context: 'product enquiry' },
    icamp: { inquiry: 'campsite reservation', context: 'campground guest enquiry' },
    yw: { inquiry: 'property service quotation', context: 'property maintenance enquiry' }
  };
  const example = examples[organizationId];
  return [
    { id: 'inbox', title: 'Company-safe inbox', workspace: 'inbox',
      steps: `Open the sample ${example.inquiry} thread. Change filters and return to the timeline.`,
      expected: `Only ${company?.name ?? organizationId} fictional threads appear; nothing sends.` },
    { id: 'contact', title: 'Contact and conversation continuity', workspace: 'contacts',
      steps: `Open the mock customer for the ${example.context}, follow the linked thread, then return.`,
      expected: 'Linked contact history stays within this company; unrelated brands are absent.' },
    { id: 'followup', title: 'Assignment and calendar handoff', workspace: 'queue',
      steps: 'Edit a fictional follow-up, visit Tasks & calendar, and confirm the local task is coherent.',
      expected: 'Changes are preview-only; a company switch has a separate task queue.' },
    { id: 'phone', title: 'Phone desk disabled boundary', workspace: 'phone',
      steps: 'Inspect one fabricated missed call and try the mock keypad.',
      expected: 'No dialing, provider provisioning or real voicemail playback is offered.' },
    { id: 'consent', title: 'SMS/MMS consent and send hold', workspace: 'composer',
      steps: 'Inspect consent labels and an unsent service/marketing draft.',
      expected: 'No SMS or MMS can be dispatched, even with a fictional draft.' },
    { id: 'handoff', title: 'Connector handoff provenance', workspace: 'connectors',
      steps: `Review the fictional ${example.inquiry} source mapping and its review-only disposition.`,
      expected: 'External write controls remain disabled, with company-safe fixture references.' },
    { id: 'isolation', title: 'Company and tenant separation', workspace: 'inbox',
      steps: 'Switch to a different company, check its list, then return here; include tenant/property labels where present.',
      expected: 'No prior-company item, task, or property is presented as belonging to the new company.' },
    { id: 'reports', title: 'Reports and cost-control readability', workspace: 'reports',
      steps: 'Read the synthetic workload and cost assumptions; review budget warnings.',
      expected: 'Illustrative costs and timing are labelled as samples, never real invoices or fees.' },
    { id: 'keyboard', title: 'Keyboard and help walkthrough', workspace: 'dashboard',
      steps: 'Use Tab and Shift+Tab to reach company navigation, workspace buttons and Help; inspect focus and headings.',
      expected: 'Visible focus, understandable control labels, sensible focus after navigation and keyboard-reachable guidance.' },
    { id: 'mobile', title: 'Small-screen and zoom review', workspace: 'dashboard',
      steps: 'On a phone or a narrow viewport, try the navigation, an inbox item, the form controls and 200% zoom.',
      expected: 'No clipped action buttons, overlapping controls or loss of essential meaning; record the device/zoom generically.' }
  ];
}

const blankObservation: Ql211Observation = { outcome: 'not_run', severity: 'medium', area: 'workflow', note: '' };
export function observationFor(ledger: Ql211Ledger, organizationId: OrganizationId, id: Ql211ScenarioId): Ql211Observation {
  return ledger[organizationId]?.[id] ?? blankObservation;
}

/** Pure, immutable, fixture-only update. Unknown IDs cannot create arbitrary entries. */
export function recordQl211Observation(ledger: Ql211Ledger, organizationId: OrganizationId, id: Ql211ScenarioId,
  patch: Partial<Ql211Observation>): Ql211Ledger {
  if (!operatorOrganizations.some((entry) => entry.id === organizationId) ||
    !scenariosForCompany(organizationId).some((scenario) => scenario.id === id)) return ledger;
  const current = observationFor(ledger, organizationId, id);
  const next = { ...current, ...patch, note: (patch.note ?? current.note).slice(0, 240) };
  return { ...ledger, [organizationId]: { ...ledger[organizationId], [id]: next } };
}

function priorityFor(outcome: Ql211Observation['outcome'], severity: Ql211Severity): Ql211Finding['priority'] {
  if (outcome === 'blocked') return 'P1';
  const bySeverity: Readonly<Record<Ql211Severity, Ql211Finding['priority']>> = {
    critical: 'P0', high: 'P1', medium: 'P2', low: 'P3'
  };
  return bySeverity[severity];
}
const suggestedActions: Readonly<Record<Ql211Area, string>> = {
  usability: 'Reproduce the friction in the relevant workspace and define a clear interface repair.',
  accessibility: 'Repeat with keyboard, zoom and assistive technology; verify focus and accessible labels.',
  workflow: 'Check handoff steps against the canonical fictional task and conversation contracts.',
  isolation: 'Freeze pilot eligibility; reproduce cross-company or tenant leakage with safe synthetic fixtures.',
  safety: 'Keep all external operations disabled; review consent, authorization and policy gates.'
};

export function evaluateQl211Company(ledger: Ql211Ledger, organizationId: OrganizationId) {
  const scenarios = scenariosForCompany(organizationId);
  const observations = scenarios.map((scenario) => ({ scenario, record: observationFor(ledger, organizationId, scenario.id) }));
  const observedPass = observations.filter((entry) => entry.record.outcome === 'observed_pass').length;
  const observedGaps = observations.filter((entry) => entry.record.outcome === 'observed_gap').length;
  const blocked = observations.filter((entry) => entry.record.outcome === 'blocked').length;
  const notRun = scenarios.length - observedPass - observedGaps - blocked;
  const findings: Ql211Finding[] = observations.filter(({ record }) => record.outcome === 'observed_gap' || record.outcome === 'blocked')
    .map(({ scenario, record }) => ({ id: scenario.id, title: scenario.title,
      priority: priorityFor(record.outcome, record.severity), area: record.area,
      outcome: record.outcome as Ql211Finding['outcome'], note: record.note,
      nextAction: suggestedActions[record.area] }))
    .sort((a, b) => a.priority.localeCompare(b.priority) || a.id.localeCompare(b.id));
  return { organizationId, total: scenarios.length, observedPass, observedGaps, blocked, notRun,
    observations, findings, actualOwnerIdentityVerified: false as const, livePilotReady: false as const };
}

export function evaluateQl211Portfolio(ledger: Ql211Ledger) {
  const companies = operatorOrganizations.map((entry) => evaluateQl211Company(ledger, entry.id));
  const prior = evaluateQl210Portfolio();
  return { release: QL211_RELEASE, companies, total: companies.reduce((sum, company) => sum + company.total, 0),
    observed: companies.reduce((sum, company) => sum + company.observedPass + company.observedGaps, 0),
    gaps: companies.reduce((sum, company) => sum + company.observedGaps + company.blocked, 0),
    notRun: companies.reduce((sum, company) => sum + company.notRun, 0),
    ql210SyntheticPasses: prior.passed, ql210SyntheticChecks: prior.totalChecks,
    heldPrerequisites: QL181_PREREQUISITES,
    ownerApprovalCaptured: false as const, livePilotReady: false as const,
    providerConnected: false as const, externalWrites: 0 as const,
    callsPlaced: 0 as const, messagesSent: 0 as const };
}

/** Portable, PII-minimized status receipt: deliberately excludes arbitrary observation notes. */
export function ql211CompanyReceipt(ledger: Ql211Ledger, organizationId: OrganizationId): string {
  const company = evaluateQl211Company(ledger, organizationId);
  return JSON.stringify({ release: QL211_RELEASE, company: organizationId,
    scope: 'Fictional preview, unverified self-reported session entries; not an owner approval',
    observedPass: company.observedPass, observedGaps: company.observedGaps, blocked: company.blocked,
    notRun: company.notRun, findings: company.findings.map(({ id, priority, area, outcome }) => ({ id, priority, area, outcome })),
    pilot: 'HELD', liveCommunications: false, externalWrites: 0, noteTextIncluded: false }, null, 2);
}

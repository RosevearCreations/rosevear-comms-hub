/**
 * QL-182: cross-module synthetic acceptance, not a live communications workflow.
 * Each operation below is a pure projection or an in-memory replay. A successful
 * rehearsal NEVER grants the QL-181 pilot gate or sends a customer message.
 */
import type { BrandId } from '../types';
import { validateQl173CanonicalSnapshot, type Ql173Migration } from '../fixtures/ql173CanonicalSynthetic';
import { getQl174BrandRows } from './ql174BrandSafeTriage';
import { getQl175BrandContacts } from './ql175ContactContextConsent';
import { getQl176BrandThreads, stageQl176Draft } from './ql176ConversationTimeline';
import { getQl177BrandIntakes, getQl177Template, updateQl177Intake } from './ql177BrandIntakeHandoff';
import { getQl178BrandTasks, simulateQl178Task } from './ql178OperatorTasks';
import {
  emptyQl179Replay, getQl179MockScenarios, getQl179OperatorFeed, simulateQl179MockReceipt,
  validateQl179MockEnvelope, type Ql179MockEnvelope
} from './ql179MockPhoneSms';
import { simulateQl180Route } from './ql180RoutingIvr';
import { QL181_PREREQUISITES, evaluateQl181LivePilotGate } from './ql181PrivacyPilotGate';

export const QL182_VERSION = 'ql182-synthetic-journey-acceptance-v1' as const;
export const QL182_STAGES = [
  'event', 'triage', 'context', 'timeline', 'draft', 'intake', 'task', 'routing', 'receipt', 'privacy_hold'
] as const;
export type Ql182Stage = typeof QL182_STAGES[number];
export type Ql182Step = Readonly<{
  id: Ql182Stage;
  title: string;
  evidence: string;
  outcome: 'VERIFIED_SIMULATED' | 'NOT_APPLICABLE_SIMULATED' | 'HELD_FOR_LIVE_PILOT';
}>;
export type Ql182Result = Readonly<{
  version: typeof QL182_VERSION;
  disposition: 'SYNTHETIC_ACCEPTED_LIVE_HELD' | 'DENIED_UNVERIFIED_SOURCE';
  brandId: BrandId | null;
  conversationId: string | null;
  eventId: string | null;
  sourceLabel: string;
  steps: readonly Ql182Step[];
  reasons: readonly string[];
  heldPrerequisites: number;
  syntheticOnly: true;
  liveCalls: 0;
  sentMessages: 0;
  externalWrites: 0;
  ownerApprovals: 0;
  livePilotAuthorized: false;
}>;

const labels: Readonly<Record<Ql182Stage, string>> = {
  event: '1. Checked-in mock event', triage: '2. Brand-safe inbox triage',
  context: '3. Contact context & consent', timeline: '4. Conversation timeline',
  draft: '5. Unsent reply draft', intake: '6. Brand-specific intake handoff',
  task: '7. Operator follow-up task', routing: '8. Voice routing preview',
  receipt: '9. Mock receipt replay', privacy_hold: '10. Privacy & pilot hold'
};

/** Only pinned inbound examples may be exercised; outbound intent is never a journey entry. */
export function getQl182InboundChoices(migration: Ql173Migration, brandId: BrandId): Ql179MockEnvelope[] {
  return getQl179MockScenarios(migration, brandId).filter(row =>
    row.event.direction === 'inbound' && (row.event.kind === 'inbound_call' || row.event.kind === 'inbound_sms'));
}

export function assessQl182Journey(migration: Ql173Migration, brandId: BrandId, input: unknown): Ql182Result {
  const constant = {
    version: QL182_VERSION, syntheticOnly: true as const,
    liveCalls: 0 as const, sentMessages: 0 as const, externalWrites: 0 as const,
    ownerApprovals: 0 as const, livePilotAuthorized: false as const,
    heldPrerequisites: QL181_PREREQUISITES.length
  };
  const deny = (reason: string): Ql182Result => ({
    ...constant, disposition: 'DENIED_UNVERIFIED_SOURCE', brandId: null, conversationId: null,
    eventId: null, sourceLabel: '', steps: [], reasons: [reason]
  });

  if (!['rosiedazzlers', 'devilndove'].includes(brandId) || !migration.verified ||
    validateQl173CanonicalSnapshot(migration.snapshot).length !== 0) return deny('Canonical synthetic source or business context failed verification.');
  const validated = validateQl179MockEnvelope(migration, brandId, input);
  if (!validated.ok || !getQl182InboundChoices(migration, brandId).some(row => row.event.id === validated.envelope.event.id))
    return deny('The supplied event is not a pinned same-brand inbound mock example.');

  const event = validated.envelope.event;
  const conversation = migration.snapshot.conversations.find(row => row.id === event.conversationId && row.brandId === brandId);
  const triage = getQl174BrandRows(migration, brandId).find(row => row.id === event.conversationId);
  const contact = getQl175BrandContacts(migration, brandId).find(row => row.id === conversation?.contactId);
  const timeline = getQl176BrandThreads(migration, brandId).find(row => row.id === event.conversationId);
  const intake = getQl177BrandIntakes(migration, brandId).find(row => row.conversationId === event.conversationId);
  const task = getQl178BrandTasks(migration, brandId).find(row => row.conversationId === event.conversationId);
  if (!conversation || !triage || !contact || !timeline || !intake || !task ||
    !contact.conversations.some(row => row.id === conversation.id) ||
    !contact.consent.every(row => !row.verifiedGrant && !row.dispatchAllowed) || contact.identityVerified ||
    timeline.brandId !== brandId || intake.contactId !== contact.id || task.contactId !== contact.id ||
    task.mockHandoffId !== intake.handoffId || intake.brandId !== brandId || task.brandId !== brandId)
    return deny('A required same-brand inbox/contact/timeline/intake/task link or consent hold is missing.');

  // Rehearse a draft, a structured intake and a task transition without saving them.
  const draftOverlay = stageQl176Draft(migration, brandId, {}, conversation.id, 'Internal sample reply — do not send.', 'stage');
  const stagedThread = getQl176BrandThreads(migration, brandId, draftOverlay).find(row => row.id === conversation.id);
  let stagedIntake = {};
  for (const field of getQl177Template(brandId).filter(field => field.required)) {
    stagedIntake = updateQl177Intake(migration, brandId, stagedIntake, conversation.id, 'edit', field.id, field.options[0]?.value);
  }
  stagedIntake = updateQl177Intake(migration, brandId, stagedIntake, conversation.id, 'stage');
  const reviewedIntake = getQl177BrandIntakes(migration, brandId, stagedIntake).find(row => row.conversationId === conversation.id);
  const taskOverlay = simulateQl178Task(migration, brandId, {}, task.id, 'state', 'waiting_on_information');
  const reviewedTask = getQl178BrandTasks(migration, brandId, taskOverlay).find(row => row.id === task.id);
  if (stagedThread?.draft.deliveryState !== 'UNSENT_SIMULATED' || stagedThread.draft.source !== 'LOCAL_SCREEN_ONLY' ||
    reviewedIntake?.reviewStatus !== 'READY_FOR_INTERNAL_REVIEW_SIMULATED' || reviewedIntake.missingFields.length ||
    reviewedTask?.state !== 'waiting_on_information' || reviewedTask?.ownerDecision !== 'NOT_REQUESTED_NOT_GRANTED')
    return deny('The unsent draft, internal intake or follow-up rehearsal was not accepted by its existing safety contract.');

  const route = event.kind === 'inbound_call' ? simulateQl180Route(migration, brandId, {
    line: brandId === 'rosiedazzlers' ? 'rosie_business_demo' : 'devil_business_demo',
    hours: 'during_demo_hours', answer: 'answered_demo', digit: '1', personalOptIn: false,
    sourceEnvelope: validated.envelope
  }) : null;
  if (route && (route.outcome !== 'ROUTED_MOCK' || route.brandDestination !== brandId || route.liveCalls || route.externalWrites))
    return deny('The call-routing preview failed the same-brand simulated-only contract.');

  const replay = simulateQl179MockReceipt(migration, brandId, emptyQl179Replay(), validated.envelope);
  const replayed = simulateQl179MockReceipt(migration, brandId, replay, validated.envelope);
  const feed = getQl179OperatorFeed(migration, brandId, replay);
  const gate = evaluateQl181LivePilotGate(migration, brandId, {
    prospectiveBrandId: brandId, illustrativeRole: 'owner', readOnlyReviewedIds: []
  });
  if (replay.lastResult !== 'ACCEPTED_MOCK' || replay.receipts.length !== 1 ||
    replayed.lastResult !== 'DUPLICATE_IGNORED' || replayed.receipts.length !== 1 ||
    feed.length !== 1 || feed[0].event.conversationId !== conversation.id ||
    feed[0].subject !== conversation.subject || feed[0].taskTitle !== task.taskTitle ||
    gate.disposition !== 'LIVE_PILOT_HELD' || gate.heldPrerequisiteIds.length !== QL181_PREREQUISITES.length ||
    gate.livePilotAuthorized || gate.liveCapabilities.length || gate.realOwnerDecisionCaptured)
    return deny('Mock replay, idempotency, operator feed or immutable live-pilot hold verification failed.');

  const steps: Ql182Step[] = [
    { id: 'event', title: labels.event, evidence: `${event.label} · ${event.id} · no provider webhook`, outcome: 'VERIFIED_SIMULATED' },
    { id: 'triage', title: labels.triage, evidence: `${triage.subject} · queue ${triage.queue} · checked-in fixture`, outcome: 'VERIFIED_SIMULATED' },
    { id: 'context', title: labels.context, evidence: `${contact.label} · identity unverified; all channels deny dispatch`, outcome: 'VERIFIED_SIMULATED' },
    { id: 'timeline', title: labels.timeline, evidence: `${timeline.events.length} checked-in event(s), no approved outbound item`, outcome: 'VERIFIED_SIMULATED' },
    { id: 'draft', title: labels.draft, evidence: 'UNSENT_SIMULATED · local screen-only draft; no send action', outcome: 'VERIFIED_SIMULATED' },
    { id: 'intake', title: labels.intake, evidence: `${reviewedIntake.templateVersion} · READY_FOR_INTERNAL_REVIEW_SIMULATED; no actual quote`, outcome: 'VERIFIED_SIMULATED' },
    { id: 'task', title: labels.task, evidence: `Task ${task.id} · waiting_on_information · no reminder or owner decision`, outcome: 'VERIFIED_SIMULATED' },
    { id: 'routing', title: labels.routing, evidence: route ? 'ROUTED_MOCK · correct business line; no transfer' : 'Not applicable: inbound SMS has no telephone IVR route',
      outcome: route ? 'VERIFIED_SIMULATED' : 'NOT_APPLICABLE_SIMULATED' },
    { id: 'receipt', title: labels.receipt, evidence: 'ACCEPTED_MOCK · receipt #1; duplicate ignored; same-brand operator feed', outcome: 'VERIFIED_SIMULATED' },
    { id: 'privacy_hold', title: labels.privacy_hold, evidence: `${gate.heldPrerequisiteIds.length} HELD_UNVERIFIED requirements; zero real permissions or owner approvals`, outcome: 'HELD_FOR_LIVE_PILOT' }
  ];
  return {
    ...constant, disposition: 'SYNTHETIC_ACCEPTED_LIVE_HELD', brandId,
    conversationId: conversation.id, eventId: event.id,
    sourceLabel: `${conversation.provenance.sourceSetVersion} · ${conversation.provenance.sourceId}`,
    steps, reasons: ['Synthetic walkthrough accepted. Live-pilot authority remains denied.']
  };
}

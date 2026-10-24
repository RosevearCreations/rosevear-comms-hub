/**
 * QL-186 — synthetic-only consent/message classification specification.
 * No real recipients, proof records, browser storage, Supabase, network,
 * telecom provider, SMS/email/voice sender or owner approval is involved.
 */
import type { BrandId } from '../types';

export const QL186_VERSION = 'ql186-consent-message-classification-specification-v1';
export type Ql186Channel = 'sms' | 'email' | 'voice';
export type Ql186ScenarioId = 'booking_update' | 'requested_quote' | 'seasonal_offer'
  | 'review_solicitation' | 'mixed_booking_promotion' | 'help_information';
export type Ql186ConsentEvidence = 'none' | 'illustrative_claim_only';
export type Ql186KeywordEvent = 'none' | 'STOP' | 'START' | 'HELP';
export type Ql186MessageIntent = 'service_only_candidate' | 'commercial_candidate' | 'control_only';

export type Ql186Scenario = Readonly<{
  id: Ql186ScenarioId;
  label: string;
  example: string;
  intent: Ql186MessageIntent;
  reason: string;
  nextReview: string;
}>;

/** Examples contain fictional content only. A label is not a legal CASL determination. */
export const QL186_SCENARIOS: readonly Ql186Scenario[] = [
  { id: 'booking_update', label: 'Service appointment update',
    example: 'Sample: Your requested service appointment time has changed.',
    intent: 'service_only_candidate',
    reason: 'Operational information requested in an existing service context; no promotional language in this fixture.',
    nextReview: 'Confirm actual customer relationship, message purpose, legal exemptions if any and applicable notice.' },
  { id: 'requested_quote', label: 'Reply to a requested quote',
    example: 'Sample: Here is the quote information you asked us to prepare.',
    intent: 'service_only_candidate',
    reason: 'The fixture models a direct response to a request, not unsolicited marketing.',
    nextReview: 'Verify request provenance and whether actual contents include an additional commercial purpose.' },
  { id: 'seasonal_offer', label: 'Seasonal promotion',
    example: 'Sample: Ask us about a seasonal service discount.',
    intent: 'commercial_candidate',
    reason: 'A discount or promotion makes commercial intent apparent.',
    nextReview: 'Legal reviewer to confirm CASL applicability, proof of consent, sender identification and unsubscribe.' },
  { id: 'review_solicitation', label: 'Feedback or review invitation',
    example: 'Sample: Tell us how your visit went and consider our next services.',
    intent: 'commercial_candidate',
    reason: 'The illustrative invitation also solicits future business; classify conservatively.',
    nextReview: 'Inspect the real purpose and wording rather than treating every review request as automatically exempt.' },
  { id: 'mixed_booking_promotion', label: 'Booking message with an upsell',
    example: 'Sample: Your booking is confirmed. Consider adding a premium service.',
    intent: 'commercial_candidate',
    reason: 'Service content mixed with an upsell cannot be assumed to inherit a service-only exemption.',
    nextReview: 'Separate operational and promotional purposes, verify each lawful basis and exclude upsell if unapproved.' },
  { id: 'help_information', label: 'Suppression and HELP instructions',
    example: 'Sample: A request for opt-out or help instructions was received.',
    intent: 'control_only',
    reason: 'This fixture describes a control request, not a provider response.',
    nextReview: 'Define safe identification, suppression, opt-out acknowledgment and provider-approved HELP process.' }
] as const;

export const QL186_CHANNELS: readonly Ql186Channel[] = ['sms', 'email', 'voice'];
export const QL186_EVIDENCE_STATES: readonly Ql186ConsentEvidence[] = ['none', 'illustrative_claim_only'];
export const QL186_KEYWORD_EVENTS: readonly Ql186KeywordEvent[] = ['none', 'STOP', 'START', 'HELP'];

/** Fields of a *future* private auditable ledger. The preview creates no entries. */
export const QL186_PROPOSED_LEDGER_FIELDS = [
  { field: 'brand_id + subject_reference', why: 'Separate business ownership and pseudonymous recipient identity; never rely on the sidebar alone.' },
  { field: 'channel + purpose + message_classification', why: 'Document exactly which channel, purpose and reviewed message class a basis covers.' },
  { field: 'basis + scope + collected_at + source_reference', why: 'Record whether express, implied, requested-service or another reviewed basis applies, and how it arose.' },
  { field: 'notice_version + wording_snapshot + actor_reference', why: 'Prove what was presented, when, and by whom without copying unneeded private contents into public logs.' },
  { field: 'expiry_review + reviewer + policy_version', why: 'Track applicable expiry and independent review, including any asserted exception.' },
  { field: 'withdrawal_event + suppression_scope + occurred_at', why: 'Record channel/brand scope of STOP or other withdrawal with immutable provenance and replay handling.' },
  { field: 'dispatch_decision + provider_receipt + audit_reference', why: 'Keep a private, integrity-checked server-side decision and provider evidence only after live authorization.' }
] as const;

export const QL186_HOLDS = [
  'Classify real message purpose and channel under the law applicable to that exact communication.',
  'Independently verify consent or exemption basis; an incoming message, contact flag or preview claim is not proof.',
  'For qualifying commercial electronic messages, review identification and unsubscribe requirements.',
  'Implement verified STOP and HELP handling, durable suppression and replay-safe withdrawal; START must not self-grant consent.',
  'Review telephone-specific consent/telemarketing rules separately from email and SMS classifications.',
  'Implement private brand-scoped evidence ledger, RLS, audit integrity and deletion/retention from QL-185.',
  'Independently accept provider, server authorization, rate limits, owner scope and all QL-181 holds before live sending.'
] as const;

export type Ql186Request = Readonly<{
  targetBrand: BrandId;
  scenarioId: Ql186ScenarioId;
  channel: Ql186Channel;
  consentEvidence: Ql186ConsentEvidence;
  priorSuppressed: boolean;
  keywordEvent: Ql186KeywordEvent;
}>;

export type Ql186Assessment = Readonly<{
  version: typeof QL186_VERSION;
  disposition: 'INVALID_PREVIEW_REQUEST' | 'CROSS_BRAND_REJECTED' | 'REVIEW_ONLY_NO_SEND';
  brandId: BrandId | null;
  scenarioId: Ql186ScenarioId | null;
  channel: Ql186Channel | null;
  candidateIntent: Ql186MessageIntent | null;
  commercialReviewRequired: boolean;
  reason: string;
  suppressionModeled: boolean;
  keywordInterpretation: string;
  evidenceVerified: false;
  consentGranted: false;
  dispatchAllowed: false;
  providerConfigured: false;
  livePilotAuthorized: false;
  heldPrerequisites: 12;
  realRecipientsRead: 0;
  evidenceRecordsWritten: 0;
  suppressionRecordsWritten: 0;
  callsPlaced: 0;
  messagesSent: 0;
  ownerApprovals: 0;
}>;

/** Pure policy demonstration: never determines a real person's legal consent. */
export function assessQl186Message(activeBrand: unknown, request: unknown): Ql186Assessment {
  const zero = {
    version: QL186_VERSION, evidenceVerified: false, consentGranted: false, dispatchAllowed: false,
    providerConfigured: false, livePilotAuthorized: false, heldPrerequisites: 12,
    realRecipientsRead: 0, evidenceRecordsWritten: 0, suppressionRecordsWritten: 0,
    callsPlaced: 0, messagesSent: 0, ownerApprovals: 0
  } as const;
  const invalid = (): Ql186Assessment => ({ ...zero, disposition: 'INVALID_PREVIEW_REQUEST',
    brandId: null, scenarioId: null, channel: null, candidateIntent: null, commercialReviewRequired: true,
    suppressionModeled: false, keywordInterpretation: 'Unrecognized keyword or scope: no action taken.',
    reason: 'Invalid or forged synthetic request. No business, message content or consent is projected.' });
  const brands: readonly BrandId[] = ['rosiedazzlers', 'devilndove'];
  if (!brands.includes(activeBrand as BrandId) || !request || typeof request !== 'object' || Array.isArray(request) ||
      ![Object.prototype, null].includes(Object.getPrototypeOf(request))) return invalid();
  const item = request as Record<string, unknown>;
  const fields = ['targetBrand', 'scenarioId', 'channel', 'consentEvidence', 'priorSuppressed', 'keywordEvent'];
  if (Object.keys(item).length !== fields.length || Object.keys(item).some(field => !fields.includes(field)) ||
      !brands.includes(item.targetBrand as BrandId) || !QL186_CHANNELS.includes(item.channel as Ql186Channel) ||
      !QL186_EVIDENCE_STATES.includes(item.consentEvidence as Ql186ConsentEvidence) ||
      !QL186_KEYWORD_EVENTS.includes(item.keywordEvent as Ql186KeywordEvent) ||
      typeof item.priorSuppressed !== 'boolean') return invalid();
  const scenario = QL186_SCENARIOS.find(row => row.id === item.scenarioId);
  if (!scenario) return invalid();
  if (item.targetBrand !== activeBrand) return {
    ...zero, disposition: 'CROSS_BRAND_REJECTED', brandId: null, scenarioId: null,
    channel: null, candidateIntent: null, commercialReviewRequired: true,
    suppressionModeled: false, keywordInterpretation: 'Other business not reviewed.',
    reason: 'Business mismatch: consent and suppression must never migrate by switching a UI selector.'
  };

  const keyword = item.keywordEvent as Ql186KeywordEvent;
  const suppressionModeled = item.priorSuppressed === true || keyword === 'STOP';
  const keywordInterpretation = keyword === 'STOP'
    ? 'STOP models a suppression event. This preview does not persist, acknowledge or send anything.'
    : keyword === 'START'
      ? 'START is a request for review, NOT verified consent. Any prior suppression remains modeled.'
      : keyword === 'HELP'
        ? 'HELP signals an information request. No automated response or permission change occurs.'
        : suppressionModeled ? 'Previous suppression remains modeled; no outbound action.'
          : 'No keyword event; absence of an opt-out is NOT proof of consent.';
  const commercialReviewRequired = scenario.intent === 'commercial_candidate' || item.channel === 'voice';
  return {
    ...zero, disposition: 'REVIEW_ONLY_NO_SEND', brandId: activeBrand as BrandId,
    scenarioId: scenario.id, channel: item.channel as Ql186Channel,
    candidateIntent: scenario.intent, commercialReviewRequired,
    suppressionModeled, keywordInterpretation,
    reason: `${scenario.reason} ${scenario.nextReview} ${item.consentEvidence === 'illustrative_claim_only'
      ? 'The illustrative consent claim is NOT a verified grant.' : 'No consent evidence is present.'}
      ${item.channel === 'voice' ? ' Voice is a distinct legal/provider review, not automatically an electronic-message classification.' : ''}
      Every live send remains blocked.`
  };
}

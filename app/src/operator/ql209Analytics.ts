import { QL187_DEMO_RATES, type Ql187Currency, type Ql187ProviderId } from './ql187ProviderCostModel';
import { inboxForOrganization, type InboxChannel } from './ql192InboxFixtures';
import type { OrganizationId } from './ql191Organizations';
import { connectorContracts } from './ql199ConnectorContracts';
import { buildMockReviewQueue } from './ql204HandoffReviewQueue';
import { mockOperatorProfiles, assessMockHandoffSecurity, type MockOperatorProfile } from './ql206SecureOperations';

export const QL209_RELEASE = 'ql209-company-tenant-analytics-and-cost-controls-mock-v1';
export const QL209_RATE_OPTIONS = [
  { id: 'voipms', label: 'Fictional rate card A' },
  { id: 'telnyx', label: 'Fictional rate card B' },
  { id: 'twilio', label: 'Fictional rate card C' }
] as const;
export const QL209_MULTIPLIERS = [1, 10, 50, 100] as const;

export type Ql209BudgetFlag = 'within_demo_budget' | 'approaching_demo_budget' | 'above_demo_budget';
export type Ql209ReportInput = {
  organizationId: OrganizationId;
  profile: MockOperatorProfile;
  providerId: Ql187ProviderId;
  volumeMultiplier: number;
  monthlyBudgetUsd: number;
  reservePercent: number;
  currency: Ql187Currency;
  cadPerUsd: number;
};
export type Ql209ChannelRow = Readonly<{ channel: InboxChannel; label: string; count: number }>;
export type Ql209Usage = Readonly<{
  inboundSmsSegments: number;
  projectedOutboundSmsSegments: number;
  inboundVoiceMinutes: number;
  projectedOutboundVoiceMinutes: number;
  projectedOutboundMms: 0;
}>;
export type Ql209Cost = Readonly<{
  fixedUsd: number; voiceUsd: number; smsUsd: number; mmsUsd: number;
  subtotalUsd: number; reserveUsd: number; totalUsd: number; displayTotal: number;
  budgetUsedPercent: number | null; flag: Ql209BudgetFlag;
}>;
export type Ql209Report = Readonly<{
  disposition: 'PREVIEW_ONLY';
  organizationId: OrganizationId;
  profileId: string;
  visibleHandoffs: number;
  highPriority: number;
  awaitingReply: number;
  waitingOrResolved: number;
  targetWithin30Minutes: number;
  targetWithin120Minutes: number;
  channels: readonly Ql209ChannelRow[];
  usage: Ql209Usage;
  cost: Ql209Cost;
  fictionalOnly: true;
  actualResponsesTimed: 0;
  actualProviderChargesKnown: false;
  messagesSent: 0;
  callsPlaced: 0;
  externalWrites: 0;
}>;
export type Ql209Result = Ql209Report | Readonly<{ disposition: 'INVALID_REQUEST' | 'ACCESS_DENIED'; reason: string; report: null }>;

const channelLabels: Readonly<Record<InboxChannel, string>> = {
  sms: 'SMS', mms: 'MMS', voice: 'Voice calls', voicemail: 'Voicemail',
  website: 'Website form', email: 'Email', internal: 'Internal'
};
const money = (value: number): number => Math.round((value + Number.EPSILON) * 100) / 100;
const invalid = (reason: string): Ql209Result => ({ disposition: 'INVALID_REQUEST', reason, report: null });
const denied = (reason: string): Ql209Result => ({ disposition: 'ACCESS_DENIED', reason, report: null });

/**
 * One company at a time, with fictional role/campground/property scope.
 * These are connector handoff samples, not all communication records.
 * No dates or measured response times are present in the fixtures, so the
 * 30/120-minute values are *planning targets*, never claimed SLA results.
 */
export function evaluateQl209Analytics(input: Ql209ReportInput): Ql209Result {
  if (!input || typeof input !== 'object' || Array.isArray(input) ||
      ![Object.prototype, null].includes(Object.getPrototypeOf(input))) return invalid('Malformed report request.');
  const names = ['organizationId', 'profile', 'providerId', 'volumeMultiplier', 'monthlyBudgetUsd', 'reservePercent', 'currency', 'cadPerUsd'];
  if (Object.keys(input).length !== names.length || Object.keys(input).some((name) => !names.includes(name)) ||
      !['rosiedazzlers', 'devilndove', 'icamp', 'yw'].includes(input.organizationId) ||
      !QL209_RATE_OPTIONS.some((plan) => plan.id === input.providerId) ||
      !QL209_MULTIPLIERS.some((n) => n === input.volumeMultiplier) ||
      !Number.isFinite(input.monthlyBudgetUsd) || input.monthlyBudgetUsd < 0 || input.monthlyBudgetUsd > 100_000 ||
      !Number.isFinite(input.reservePercent) || input.reservePercent < 0 || input.reservePercent > 100 ||
      !['USD', 'CAD'].includes(input.currency) ||
      !Number.isFinite(input.cadPerUsd) || input.cadPerUsd < .5 || input.cadPerUsd > 3) {
    return invalid('Only bounded, invented cost scenarios and known company identifiers are accepted.');
  }
  if (!mockOperatorProfiles.includes(input.profile)) return denied('Fictional operator must match the immutable demo registry.');
  if (input.profile.role === 'signed_out' || input.profile.organizationId !== input.organizationId) {
    return denied('Selected fictional operator does not belong to this company.');
  }
  const contract = connectorContracts[input.organizationId];
  const queue = buildMockReviewQueue(input.organizationId, contract);
  if (!queue.ok) return denied('No canonical, company-scoped connector data was available.');
  const visible = queue.items.filter((item) => assessMockHandoffSecurity(input.organizationId, contract,
    input.profile, item, 'inspect_summary').designAllows);
  if (!visible.length) return denied('No fictional handoffs belong to the selected campground, property or role.');
  const threads = inboxForOrganization(input.organizationId);
  const sourceThreads = visible.map((item) => threads.find((thread) => thread.id === item.threadId && thread.organizationId === input.organizationId));
  // Fail closed if the source handoff and its approved fictional inbox cannot be matched.
  if (sourceThreads.some((thread) => !thread)) return denied('The fictional source mapping could not be verified.');
  const scopeThreads = sourceThreads.filter((thread): thread is NonNullable<typeof thread> => Boolean(thread));
  const countChannel = (channel: InboxChannel) => scopeThreads.filter((thread) => thread.channel === channel).length;
  const voiceCount = countChannel('voice') + countChannel('voicemail');
  const smsCount = countChannel('sms');
  const usage: Ql209Usage = {
    inboundSmsSegments: smsCount * input.volumeMultiplier,
    projectedOutboundSmsSegments: smsCount * input.volumeMultiplier,
    inboundVoiceMinutes: voiceCount * 4 * input.volumeMultiplier,
    projectedOutboundVoiceMinutes: voiceCount * 2 * input.volumeMultiplier,
    projectedOutboundMms: 0
  };
  const rates = QL187_DEMO_RATES[input.providerId];
  const fixedUsd = rates.numberMonthlyUsd + rates.platformMonthlyUsd + rates.otherMonthlyUsd;
  const voiceUsd = usage.inboundVoiceMinutes * rates.incomingVoiceMinuteUsd + usage.projectedOutboundVoiceMinutes * rates.outgoingVoiceMinuteUsd;
  const smsUsd = usage.inboundSmsSegments * rates.inboundSmsSegmentUsd + usage.projectedOutboundSmsSegments * rates.outboundSmsSegmentUsd;
  const mmsUsd = usage.projectedOutboundMms * rates.outboundMmsUsd;
  const subtotalUsd = fixedUsd + voiceUsd + smsUsd + mmsUsd;
  const reserveUsd = subtotalUsd * input.reservePercent / 100;
  const totalUsd = money(subtotalUsd + reserveUsd);
  const budgetUsedPercent = input.monthlyBudgetUsd > 0 ? money(totalUsd / input.monthlyBudgetUsd * 100) : null;
  const flag: Ql209BudgetFlag = totalUsd > input.monthlyBudgetUsd ? 'above_demo_budget'
    : budgetUsedPercent !== null && budgetUsedPercent >= 80 ? 'approaching_demo_budget' : 'within_demo_budget';
  const channels = (Object.entries(channelLabels) as Array<[InboxChannel, string]>).map(([channel, label]) => ({
    channel, label, count: countChannel(channel)
  })).filter((row) => row.count > 0);
  return {
    disposition: 'PREVIEW_ONLY', organizationId: input.organizationId, profileId: input.profile.id,
    visibleHandoffs: visible.length, highPriority: visible.filter((item) => item.priority === 'high').length,
    awaitingReply: scopeThreads.filter((thread) => thread.status === 'new' || thread.status === 'needs_reply').length,
    waitingOrResolved: scopeThreads.filter((thread) => thread.status === 'waiting' || thread.status === 'resolved').length,
    targetWithin30Minutes: visible.filter((item) => item.priority === 'high').length,
    targetWithin120Minutes: visible.filter((item) => item.priority === 'normal').length,
    channels, usage,
    cost: { fixedUsd: money(fixedUsd), voiceUsd: money(voiceUsd), smsUsd: money(smsUsd), mmsUsd: money(mmsUsd),
      subtotalUsd: money(subtotalUsd), reserveUsd: money(reserveUsd), totalUsd,
      displayTotal: money(totalUsd * (input.currency === 'CAD' ? input.cadPerUsd : 1)),
      budgetUsedPercent, flag },
    fictionalOnly: true, actualResponsesTimed: 0, actualProviderChargesKnown: false,
    messagesSent: 0, callsPlaced: 0, externalWrites: 0
  };
}

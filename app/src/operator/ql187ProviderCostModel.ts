/** QL-187: strictly synthetic provider shortlist and arithmetic, never a quote or telecom instruction. */
import type { BrandId } from '../types';

export const QL187_VERSION = 'ql187-provider-decision-cost-model-v1' as const;
export type Ql187ProviderId = 'voipms' | 'telnyx' | 'twilio';
export type Ql187VolumeId = 'small' | 'regular' | 'busy';
export type Ql187Currency = 'USD' | 'CAD';

export const QL187_PROVIDERS = [
  { id: 'voipms', label: 'VoIP.ms', pricing: 'https://voip.ms/pricing',
    review: 'Canadian DID availability, SMS/MMS eligibility, API/webhook behaviour, emergency service and number ownership.' },
  { id: 'telnyx', label: 'Telnyx', pricing: 'https://telnyx.com/pricing',
    review: 'Canadian numbers, inbound and outbound rates, messaging profile, webhook signatures, taxes and carrier pass-through.' },
  { id: 'twilio', label: 'Twilio', pricing: 'https://www.twilio.com/en-us/sms/pricing/ca',
    review: 'Canadian number and voice pricing, SMS segments and carrier fees, webhook validation and required registrations.' }
] as const;

/** Entirely made-up unit rates for teaching the cost formula. NOT observed vendor prices. */
export const QL187_DEMO_RATES: Readonly<Record<Ql187ProviderId, Ql187RateCard>> = {
  voipms: { numberMonthlyUsd: 2, platformMonthlyUsd: 0, incomingVoiceMinuteUsd: .01,
    outgoingVoiceMinuteUsd: .015, inboundSmsSegmentUsd: .01, outboundSmsSegmentUsd: .01, outboundMmsUsd: .03, otherMonthlyUsd: 0 },
  telnyx: { numberMonthlyUsd: 2, platformMonthlyUsd: 0, incomingVoiceMinuteUsd: .012,
    outgoingVoiceMinuteUsd: .018, inboundSmsSegmentUsd: .012, outboundSmsSegmentUsd: .012, outboundMmsUsd: .035, otherMonthlyUsd: 0 },
  twilio: { numberMonthlyUsd: 2, platformMonthlyUsd: 0, incomingVoiceMinuteUsd: .02,
    outgoingVoiceMinuteUsd: .025, inboundSmsSegmentUsd: .012, outboundSmsSegmentUsd: .012, outboundMmsUsd: .04, otherMonthlyUsd: 0 }
};

export type Ql187RateCard = Readonly<{
  numberMonthlyUsd: number; platformMonthlyUsd: number; incomingVoiceMinuteUsd: number;
  outgoingVoiceMinuteUsd: number; inboundSmsSegmentUsd: number;
  outboundSmsSegmentUsd: number; outboundMmsUsd: number; otherMonthlyUsd: number;
}>;

export const QL187_VOLUMES = [
  { id: 'small', label: 'Small test scenario', inboundMinutes: 60, outboundMinutes: 25,
    inboundSmsSegments: 30, outboundSmsSegments: 45, outboundMms: 4 },
  { id: 'regular', label: 'Regular illustrative month', inboundMinutes: 300, outboundMinutes: 150,
    inboundSmsSegments: 190, outboundSmsSegments: 260, outboundMms: 20 },
  { id: 'busy', label: 'Busy illustrative month', inboundMinutes: 1200, outboundMinutes: 700,
    inboundSmsSegments: 750, outboundSmsSegments: 1150, outboundMms: 90 }
] as const;

export const QL187_DECISION_GATES = [
  'Owner must approve a firm total budget and purchase separately; preview changes are not approval.',
  'Obtain Canadian DID availability, current itemized CAD/USD quotes, taxes, carrier fees and FX terms.',
  'Validate SMS/MMS capabilities, consent controls, provider terms, signatures, throttling and recording rules.',
  'Use only a newly issued test number after independent authorization; do not port Bell Fibe or business/personal cells.',
  'Keep Bell and existing cellular plans active, check forwarding fees/behaviour with the carriers before any later routing.',
  'Never route a dual-use personal mobile number into shared business inboxes without separate explicit review.',
  'Verify QL-181 identity, brand RLS, consent, retention, provider authentication, security and owner approval holds.'
] as const;

export type Ql187Request = Readonly<{
  targetBrand: BrandId;
  volume: Ql187VolumeId;
  currency: Ql187Currency;
  cadPerUsd: number;
  monthlyBudgetUsd: number;
  reservePercent: number;
}>;

export type Ql187Cost = Readonly<{
  providerId: Ql187ProviderId;
  recurringUsd: number;
  reserveUsd: number;
  planningTotalUsd: number;
  displayTotal: number;
  withinIllustrativeBudget: boolean;
}>;

export type Ql187Result = Readonly<{
  version: typeof QL187_VERSION;
  disposition: 'REVIEW_ONLY_NO_PURCHASE' | 'CROSS_BRAND_REJECTED' | 'INVALID_PREVIEW_REQUEST';
  brandId: BrandId | null;
  costs: readonly Ql187Cost[];
  explanation: string;
  vendorPricesVerified: false;
  providerSelected: false;
  providerConnected: false;
  numberPurchased: false;
  forwardingChanged: false;
  portingChanged: false;
  smsOrCallsSent: 0;
  externalWrites: 0;
  realOwnerApprovals: 0;
  pilotAuthorized: false;
  heldPrerequisites: 12;
}>;

const round = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100;
const expectedFields = ['targetBrand', 'volume', 'currency', 'cadPerUsd', 'monthlyBudgetUsd', 'reservePercent'];

/** In-memory calculation for hypothetical volume * hypothetical rates, not a purchasing decision. */
export function evaluateQl187Costs(activeBrand: unknown, request: unknown): Ql187Result {
  const base = { version: QL187_VERSION, vendorPricesVerified: false, providerSelected: false,
    providerConnected: false, numberPurchased: false, forwardingChanged: false,
    portingChanged: false, smsOrCallsSent: 0, externalWrites: 0,
    realOwnerApprovals: 0, pilotAuthorized: false, heldPrerequisites: 12 } as const;
  const deny = (disposition: 'INVALID_PREVIEW_REQUEST' | 'CROSS_BRAND_REJECTED', explanation: string): Ql187Result =>
    ({ ...base, disposition, explanation, brandId: null, costs: [] });
  if (activeBrand !== 'rosiedazzlers' && activeBrand !== 'devilndove' || !request ||
      typeof request !== 'object' || Array.isArray(request) ||
      ![Object.prototype, null].includes(Object.getPrototypeOf(request)))
    return deny('INVALID_PREVIEW_REQUEST', 'Unrecognized preview scope. No prices or provider details evaluated.');
  const item = request as Record<string, unknown>;
  if (Object.keys(item).length !== expectedFields.length ||
      Object.keys(item).some(key => !expectedFields.includes(key)) ||
      !['rosiedazzlers', 'devilndove'].includes(item.targetBrand as string) ||
      !QL187_VOLUMES.some(v => v.id === item.volume) || !['USD', 'CAD'].includes(item.currency as string) ||
      typeof item.cadPerUsd !== 'number' || !Number.isFinite(item.cadPerUsd) || item.cadPerUsd < .5 || item.cadPerUsd > 3 ||
      typeof item.monthlyBudgetUsd !== 'number' || !Number.isFinite(item.monthlyBudgetUsd) ||
      item.monthlyBudgetUsd < 0 || item.monthlyBudgetUsd > 10000 ||
      typeof item.reservePercent !== 'number' || !Number.isFinite(item.reservePercent) ||
      item.reservePercent < 0 || item.reservePercent > 100)
    return deny('INVALID_PREVIEW_REQUEST', 'Invalid or forged scenario. No estimate is calculated.');
  if (item.targetBrand !== activeBrand)
    return deny('CROSS_BRAND_REJECTED', 'The selected business differs from the active workspace; no foreign business estimate is shown.');
  const volume = QL187_VOLUMES.find(v => v.id === item.volume)!;
  const costs = QL187_PROVIDERS.map(provider => {
    const rates = QL187_DEMO_RATES[provider.id];
    const recurringUsd = rates.numberMonthlyUsd + rates.platformMonthlyUsd + rates.otherMonthlyUsd +
      volume.inboundMinutes * rates.incomingVoiceMinuteUsd +
      volume.outboundMinutes * rates.outgoingVoiceMinuteUsd +
      volume.inboundSmsSegments * rates.inboundSmsSegmentUsd +
      volume.outboundSmsSegments * rates.outboundSmsSegmentUsd +
      volume.outboundMms * rates.outboundMmsUsd;
    const reserveUsd = recurringUsd * (item.reservePercent as number) / 100;
    const planningTotalUsd = round(recurringUsd + reserveUsd);
    return { providerId: provider.id, recurringUsd: round(recurringUsd), reserveUsd: round(reserveUsd),
      planningTotalUsd, displayTotal: round(planningTotalUsd * (item.currency === 'CAD' ? item.cadPerUsd as number : 1)),
      withinIllustrativeBudget: planningTotalUsd <= (item.monthlyBudgetUsd as number) };
  });
  return { ...base, disposition: 'REVIEW_ONLY_NO_PURCHASE', brandId: activeBrand,
    costs, explanation: 'Numbers use invented rates and fictional usage only; an apparent budget fit is NOT a quote, provider selection or permission to order.' };
}

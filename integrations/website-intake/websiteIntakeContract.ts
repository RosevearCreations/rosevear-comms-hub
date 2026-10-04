// QL-012 website intake integration draft.
// Contract only; no live endpoint or public table writes are enabled.

export type WebsiteIntakeBrand = 'rosiedazzlers' | 'devilndove';

export type RosieDazzlersIntakeType =
  | 'detailing_quote'
  | 'booking_request'
  | 'fleet_commercial_inquiry'
  | 'missed_call_follow_up';

export type DevilnDoveIntakeType =
  | 'custom_order'
  | 'product_question'
  | 'personalization_request'
  | 'maker_story_candidate';

export type WebsiteIntakeType = RosieDazzlersIntakeType | DevilnDoveIntakeType;

export interface WebsiteIntakePayload {
  brand: WebsiteIntakeBrand;
  intakeType: WebsiteIntakeType;
  source: {
    site: string;
    formName: string;
    pageUrl?: string;
    submittedAt: string;
    utm?: Record<string, string>;
  };
  contact: {
    name: string;
    email?: string;
    phone?: string;
    town?: string;
    preferredReplyChannel?: 'phone' | 'sms' | 'email' | 'unknown';
  };
  request: {
    subject: string;
    message: string;
    flags?: string[];
    recommendedService?: string;
    [key: string]: unknown;
  };
  consent?: {
    canContact?: boolean;
    canText?: boolean;
    marketingOptIn?: boolean;
    consentText?: string;
  };
  attachments?: Array<{
    kind: 'photo' | 'reference' | 'other';
    label: string;
    url?: string;
  }>;
}

export const allowedWebsiteIntakeBrands: WebsiteIntakeBrand[] = ['rosiedazzlers', 'devilndove'];

export const allowedWebsiteIntakeTypes: Record<WebsiteIntakeBrand, WebsiteIntakeType[]> = {
  rosiedazzlers: ['detailing_quote', 'booking_request', 'fleet_commercial_inquiry', 'missed_call_follow_up'],
  devilndove: ['custom_order', 'product_question', 'personalization_request', 'maker_story_candidate']
};

export function isAllowedWebsiteIntakeType(brand: WebsiteIntakeBrand, intakeType: string): intakeType is WebsiteIntakeType {
  return allowedWebsiteIntakeTypes[brand].includes(intakeType as WebsiteIntakeType);
}

import type { BrandConfig } from '../types';

export const brands: BrandConfig[] = [
  {
    id: 'rosiedazzlers',
    displayName: 'RosieDazzlers',
    shortName: 'Rosie',
    businessType: 'Mobile auto detailing',
    firstWorkflow: 'Detailing quote and missed-call follow-up',
    accentLabel: 'Oxford / Norfolk detailing',
    primaryCta: 'Review detailing leads',
    intakeTypes: ['detailing_quote', 'booking_request', 'missed_call_follow_up', 'fleet_commercial_inquiry']
  },
  {
    id: 'devilndove',
    displayName: 'DevilnDove',
    shortName: 'DND',
    businessType: 'Artisan custom products',
    firstWorkflow: 'Custom order and product question intake',
    accentLabel: 'Maker shop and custom gifts',
    primaryCta: 'Review custom requests',
    intakeTypes: ['custom_order', 'product_question', 'personalization_request', 'maker_story_candidate']
  }
];

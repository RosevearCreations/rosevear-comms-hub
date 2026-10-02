import type { BrandConfig } from '../types';

export const brands: BrandConfig[] = [
  {
    id: 'rosiedazzlers',
    displayName: 'RosieDazzlers',
    businessType: 'Mobile auto detailing',
    firstWorkflow: 'Detailing quote intake, missed-call follow-up, photo requests, and booking support.',
    accentLabel: 'Detailing front desk',
    statuses: ['new', 'needs_reply', 'waiting_on_customer', 'needs_photos', 'quote_needed', 'quote_sent', 'booked', 'completed', 'archived'],
    intakeTypes: ['detailing_quote', 'booking_request', 'missed_call_follow_up', 'fleet_commercial_inquiry'],
    defaultTags: ['new_lead', 'quote_request', 'booking_request', 'missed_call', 'needs_photos', 'pet_hair', 'odor', 'salt_stains', 'ceramic_coating', 'paint_correction', 'fleet_commercial', 'human_review']
  },
  {
    id: 'devilndove',
    displayName: 'DevilnDove',
    businessType: 'Artisan custom products',
    firstWorkflow: 'Custom order intake, product questions, personalization, and reference-photo requests.',
    accentLabel: 'Maker front desk',
    statuses: ['new', 'needs_reply', 'waiting_on_customer', 'needs_reference_photos', 'quote_needed', 'quote_sent', 'approved', 'in_progress', 'completed', 'archived'],
    intakeTypes: ['custom_order', 'product_question', 'personalization_request', 'maker_story_candidate'],
    defaultTags: ['new_lead', 'custom_order', 'product_question', 'needs_reference_photos', 'jewelry', 'candle', 'engraving', 'sublimation', '3d_print', 'cnc_laser', 'resin', 'gift_deadline', 'human_review']
  }
];

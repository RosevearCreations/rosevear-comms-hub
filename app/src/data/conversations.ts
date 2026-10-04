import type { Conversation } from '../types';

const now = new Date().toISOString();

export const conversations: Conversation[] = [
  {
    id: 'rdz-001',
    brandId: 'rosiedazzlers',
    contactId: 'contact-rdz-sample-001',
    sourceChannel: 'website_form',
    status: 'needs_photos',
    priority: 'normal',
    subject: 'Interior detail with pet hair',
    summary: 'Customer wants an interior detail for an SUV with pet hair and possible salt staining. Photos are needed before quoting.',
    tags: ['quote_request', 'pet_hair', 'salt_stains', 'needs_photos'],
    lastActivityAt: now,
    createdAt: now,
    updatedAt: now
  },
  {
    id: 'rdz-002',
    brandId: 'rosiedazzlers',
    contactId: 'contact-rdz-fleet-001',
    sourceChannel: 'missed_call',
    status: 'quote_needed',
    priority: 'high',
    subject: 'Three work trucks, same location',
    summary: 'Placeholder for future missed-call or fleet inquiry workflow. Collect vehicle count, size, condition, location, and frequency.',
    tags: ['fleet_commercial', 'quote_needed', 'human_review'],
    lastActivityAt: now,
    createdAt: now,
    updatedAt: now
  },
  {
    id: 'dnd-001',
    brandId: 'devilndove',
    contactId: 'contact-dnd-sample-001',
    sourceChannel: 'website_form',
    status: 'needs_reference_photos',
    priority: 'normal',
    subject: 'Custom engraved candle gift',
    summary: 'Customer wants a personalized candle gift and needs reference text, deadline, and budget range.',
    tags: ['custom_order', 'engraving', 'gift_deadline', 'needs_reference_photos'],
    lastActivityAt: now,
    createdAt: now,
    updatedAt: now
  },
  {
    id: 'dnd-002',
    brandId: 'devilndove',
    contactId: 'contact-dnd-product-001',
    sourceChannel: 'email',
    status: 'needs_reply',
    priority: 'normal',
    subject: 'Question about care instructions',
    summary: 'Placeholder for product question thread for handmade item care and pickup/shipping details.',
    tags: ['product_question', 'shipping_pickup', 'human_review'],
    lastActivityAt: now,
    createdAt: now,
    updatedAt: now
  }
];

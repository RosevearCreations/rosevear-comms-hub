import type { Conversation } from '../types';

export const conversations: Conversation[] = [
  {
    id: 'rdz-001',
    brandId: 'rosiedazzlers',
    customerName: 'Sample Rosie Customer',
    channel: 'website',
    status: 'needs_photos',
    title: 'Interior detail with pet hair',
    summary: 'Customer wants an interior detail for an SUV with pet hair and possible salt staining. Photos are needed before quoting.',
    tags: ['quote_request', 'pet_hair', 'salt_stains', 'needs_photos'],
    lastActivity: 'Today 10:42 AM',
    nextAction: 'Send photo request template when SMS/email is connected.',
    valueHint: 'medium'
  },
  {
    id: 'rdz-002',
    brandId: 'rosiedazzlers',
    customerName: 'Fleet Placeholder',
    channel: 'phone_placeholder',
    status: 'quote_needed',
    title: 'Three work trucks, same location',
    summary: 'Placeholder for future missed-call or fleet inquiry workflow.',
    tags: ['fleet_commercial', 'quote_needed', 'human_review'],
    lastActivity: 'Yesterday 4:18 PM',
    nextAction: 'Collect vehicle count, size, condition, location, and frequency.',
    valueHint: 'high'
  },
  {
    id: 'dnd-001',
    brandId: 'devilndove',
    customerName: 'Sample DevilnDove Customer',
    channel: 'website',
    status: 'needs_reference_photos',
    title: 'Custom engraved candle gift',
    summary: 'Customer wants a personalized candle gift and needs reference text, deadline, and budget range.',
    tags: ['custom_order', 'engraving', 'gift_deadline', 'needs_reference_photos'],
    lastActivity: 'Today 9:15 AM',
    nextAction: 'Ask for exact engraving text and date needed.',
    valueHint: 'medium'
  },
  {
    id: 'dnd-002',
    brandId: 'devilndove',
    customerName: 'Product Question Placeholder',
    channel: 'email_placeholder',
    status: 'needs_reply',
    title: 'Question about care instructions',
    summary: 'Placeholder for product question thread for handmade item care and pickup/shipping details.',
    tags: ['product_question', 'shipping_pickup', 'human_review'],
    lastActivity: 'Monday 2:03 PM',
    nextAction: 'Draft care-instruction response from approved knowledge source.',
    valueHint: 'unknown'
  }
];

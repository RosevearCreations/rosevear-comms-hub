import type { OrganizationId } from './ql191Organizations';

export type QueueCategory = 'reply' | 'call' | 'intake' | 'task';

export interface DashboardQueueItem {
  id: string;
  category: QueueCategory;
  channel: string;
  title: string;
  detail: string;
  action: string;
}

/** Fabricated training examples only. Never insert customer/provider data here. */
export const dashboardQueues: Readonly<Record<OrganizationId, readonly DashboardQueueItem[]>> = {
  rosiedazzlers: [
    { id: 'rd-reply', category: 'reply', channel: 'Website form · sample', title: 'Salt-stain interior enquiry', detail: 'A fictional customer asks which interior package covers winter salt.', action: 'Review suggested service' },
    { id: 'rd-call', category: 'call', channel: 'Missed call · simulation', title: 'Unanswered detailing request', detail: 'A fabricated missed call needs an operator follow-up plan.', action: 'Review missed-call workflow' },
    { id: 'rd-intake', category: 'intake', channel: 'Quote intake · sample', title: 'SUV detailing estimate', detail: 'Synthetic vehicle condition and service preferences awaiting a quote.', action: 'Review quote requirements' },
    { id: 'rd-task', category: 'task', channel: 'Follow-up · sample', title: 'Check on booking availability', detail: 'A mock task to verify an appointment slot before replying.', action: 'Review follow-up task' }
  ],
  devilndove: [
    { id: 'dnd-reply', category: 'reply', channel: 'Product question · sample', title: 'Custom pendant materials', detail: 'A fictional buyer asks about a silver-tone pendant finish.', action: 'Review maker options' },
    { id: 'dnd-call', category: 'call', channel: 'Missed call · simulation', title: 'Unanswered commission inquiry', detail: 'Synthetic voice enquiry about a gift commission; no number is stored.', action: 'Review callback plan' },
    { id: 'dnd-intake', category: 'intake', channel: 'Custom order · sample', title: 'Engraved keepsake request', detail: 'Fictitious engraving text and production schedule need review.', action: 'Review custom order intake' },
    { id: 'dnd-task', category: 'task', channel: 'Follow-up · sample', title: 'Request reference photos', detail: 'A sample task to collect reference images from a fictional customer.', action: 'Review maker follow-up' }
  ],
  icamp: [
    { id: 'camp-reply', category: 'reply', channel: 'Guest enquiry · sample', title: 'Campsite availability question', detail: 'A fictional camper is exploring tent-site dates and services.', action: 'Review reservation enquiry' },
    { id: 'camp-call', category: 'call', channel: 'Missed call · simulation', title: 'Office missed-call follow-up', detail: 'Synthetic call event for a campground front desk, without caller data.', action: 'Review front-desk callback' },
    { id: 'camp-intake', category: 'intake', channel: 'Visitor request · sample', title: 'Event guest registration question', detail: 'Fictitious weekend-event visitor asks about admission procedures.', action: 'Review guest intake' },
    { id: 'camp-task', category: 'task', channel: 'Maintenance · sample', title: 'Washroom service update', detail: 'A demonstration task to follow up on a site-maintenance question.', action: 'Review maintenance handoff' }
  ],
  yw: [
    { id: 'yw-reply', category: 'reply', channel: 'Property request · sample', title: 'Snow-clearing service question', detail: 'A fictional property owner asks about seasonal plowing coverage.', action: 'Review property enquiry' },
    { id: 'yw-call', category: 'call', channel: 'Missed call · simulation', title: 'Unanswered rural service enquiry', detail: 'Synthetic telephone event for a service company, with no real number.', action: 'Review service callback' },
    { id: 'yw-intake', category: 'intake', channel: 'Estimate · sample', title: 'Garbage collection and sticker request', detail: 'A fictional resident asks about paid stickers and recurring collection.', action: 'Review service estimate' },
    { id: 'yw-task', category: 'task', channel: 'Dispatch · sample', title: 'Septic service scheduling question', detail: 'A mock task requiring staff review before any scheduling changes.', action: 'Review dispatch follow-up' }
  ]
};

export function getDashboardQueue(organizationId: OrganizationId): readonly DashboardQueueItem[] {
  return dashboardQueues[organizationId];
}

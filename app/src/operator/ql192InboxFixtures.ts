import type { OrganizationId } from './ql191Organizations';

export type InboxChannel = 'sms' | 'mms' | 'voice' | 'voicemail' | 'website' | 'email' | 'internal';
export type InboxDisposition = 'new' | 'needs_reply' | 'waiting' | 'resolved';
export type InboxConsent = 'unknown' | 'service_only' | 'opted_out';

export interface InboxEvent {
  id: string;
  kind: 'inbound' | 'call_event' | 'internal_note' | 'draft';
  body: string;
  timeLabel: string;
}

export interface InboxThread {
  id: string;
  organizationId: OrganizationId;
  channel: InboxChannel;
  sourceLabel: string;
  contactLabel: string;
  subject: string;
  summary: string;
  status: InboxDisposition;
  consent: InboxConsent;
  unread: boolean;
  needsFollowUp: boolean;
  priority: 'normal' | 'high';
  context: string;
  events: readonly InboxEvent[];
}

/** Entirely fictional, context-isolated examples. Never mix with real records. */
export const inboxFixtures: Readonly<Record<OrganizationId, readonly InboxThread[]>> = {
  rosiedazzlers: [
    {
      id: 'rd-sms', organizationId: 'rosiedazzlers', channel: 'sms', sourceLabel: 'SMS · simulated',
      contactLabel: 'Demo detailing customer A', subject: 'Interior salt-stain question',
      summary: 'Asks which package covers a winter interior cleanup.', status: 'needs_reply', consent: 'unknown',
      unread: true, needsFollowUp: false, priority: 'high', context: 'Vehicle: compact SUV · Synthetic service inquiry',
      events: [
        { id: 'rd-sms-e1', kind: 'inbound', body: 'Mock message: Can winter salt stains be removed in an interior detail?', timeLabel: 'Sample · earlier' },
        { id: 'rd-sms-e2', kind: 'internal_note', body: 'Demo note: check the current service descriptions before making a promise.', timeLabel: 'Sample · later' }
      ]
    },
    {
      id: 'rd-missed', organizationId: 'rosiedazzlers', channel: 'voice', sourceLabel: 'Missed call · simulated',
      contactLabel: 'Demo detailing customer B', subject: 'Missed booking inquiry',
      summary: 'No live number or call was received; callback review only.', status: 'new', consent: 'unknown',
      unread: true, needsFollowUp: true, priority: 'high', context: 'Booking support · No phone number stored',
      events: [{ id: 'rd-missed-e1', kind: 'call_event', body: 'Simulated missed inbound call. No connected telephony provider.', timeLabel: 'Sample · now' }]
    },
    {
      id: 'rd-website', organizationId: 'rosiedazzlers', channel: 'website', sourceLabel: 'Website intake · simulated',
      contactLabel: 'Demo detailing customer C', subject: 'Ceramic coating estimate',
      summary: 'Synthetic quote request with vehicle size and paint condition.', status: 'waiting', consent: 'service_only',
      unread: false, needsFollowUp: true, priority: 'normal', context: 'Quote review · No live website connection',
      events: [{ id: 'rd-website-e1', kind: 'inbound', body: 'Mock form: I would like an estimate for a ceramic coating on a midsize vehicle.', timeLabel: 'Sample · earlier' }]
    },
    {
      id: 'rd-mms', organizationId: 'rosiedazzlers', channel: 'mms', sourceLabel: 'MMS · simulated',
      contactLabel: 'Demo detailing customer D', subject: 'Condition photo question',
      summary: 'Sample attachment description only; no picture or personal data.', status: 'resolved', consent: 'opted_out',
      unread: false, needsFollowUp: false, priority: 'normal', context: 'Photo intake · Marketing opt-out recorded only in fixture',
      events: [{ id: 'rd-mms-e1', kind: 'inbound', body: 'Simulated image attachment: upholstery condition photo. No media uploaded.', timeLabel: 'Sample · earlier' }]
    },
    {
      id: 'rd-email', organizationId: 'rosiedazzlers', channel: 'email', sourceLabel: 'Email · simulated',
      contactLabel: 'Demo fleet contact E', subject: 'Fleet detailing schedule',
      summary: 'Fictional fleet-service scheduling question.', status: 'needs_reply', consent: 'unknown',
      unread: true, needsFollowUp: true, priority: 'normal', context: 'Fleet · No mailbox connected',
      events: [{ id: 'rd-email-e1', kind: 'inbound', body: 'Mock email: Is there a recurring mobile detailing option for a small fleet?', timeLabel: 'Sample · earlier' }]
    }
  ],
  devilndove: [
    {
      id: 'dnd-sms', organizationId: 'devilndove', channel: 'sms', sourceLabel: 'SMS · simulated',
      contactLabel: 'Demo maker customer A', subject: 'Engraved keepsake timing',
      summary: 'Asks about a fictional keepsake customization deadline.', status: 'needs_reply', consent: 'unknown',
      unread: true, needsFollowUp: true, priority: 'high', context: 'Custom order · No production commitment',
      events: [{ id: 'dnd-sms-e1', kind: 'inbound', body: 'Mock message: Could a personalized engraving be ready for a gift date?', timeLabel: 'Sample · earlier' }]
    },
    {
      id: 'dnd-voicemail', organizationId: 'devilndove', channel: 'voicemail', sourceLabel: 'Voicemail · simulated',
      contactLabel: 'Demo maker customer B', subject: 'Lost-wax ring commission',
      summary: 'Fictitious voice inquiry; no recording file is stored.', status: 'new', consent: 'unknown',
      unread: true, needsFollowUp: false, priority: 'normal', context: 'Commission inquiry · No call recording',
      events: [{ id: 'dnd-voicemail-e1', kind: 'call_event', body: 'Simulated voicemail description: question about a wax-carved ring.', timeLabel: 'Sample · now' }]
    },
    {
      id: 'dnd-web', organizationId: 'devilndove', channel: 'website', sourceLabel: 'Custom order form · simulated',
      contactLabel: 'Demo maker customer C', subject: 'Resin colour combination',
      summary: 'Needs reference colours for a sample custom object.', status: 'waiting', consent: 'service_only',
      unread: false, needsFollowUp: true, priority: 'normal', context: 'Maker intake · No production record',
      events: [{ id: 'dnd-web-e1', kind: 'inbound', body: 'Mock form: Can we combine teal and gold in a resin piece?', timeLabel: 'Sample · earlier' }]
    },
    {
      id: 'dnd-mms', organizationId: 'devilndove', channel: 'mms', sourceLabel: 'MMS · simulated',
      contactLabel: 'Demo maker customer D', subject: 'Reference photo intake',
      summary: 'Only an attachment placeholder; no photo uploaded.', status: 'resolved', consent: 'opted_out',
      unread: false, needsFollowUp: false, priority: 'normal', context: 'Photo reference · Marketing opt-out simulated',
      events: [{ id: 'dnd-mms-e1', kind: 'inbound', body: 'Simulated image attachment: jewellery inspiration. No actual attachment.', timeLabel: 'Sample · earlier' }]
    },
    {
      id: 'dnd-internal', organizationId: 'devilndove', channel: 'internal', sourceLabel: 'Internal note · demo',
      contactLabel: 'Demo workshop team', subject: 'Check material availability',
      summary: 'Mock workshop handoff to check materials before quoting.', status: 'needs_reply', consent: 'unknown',
      unread: false, needsFollowUp: true, priority: 'normal', context: 'Workshop · No inventory system write',
      events: [{ id: 'dnd-internal-e1', kind: 'internal_note', body: 'Demo handoff: verify available stock before responding to a custom inquiry.', timeLabel: 'Sample · earlier' }]
    }
  ],
  icamp: [
    {
      id: 'camp-sms', organizationId: 'icamp', channel: 'sms', sourceLabel: 'Guest SMS · simulated',
      contactLabel: 'Demo campground guest A', subject: 'Tent-site availability',
      summary: 'Fictional visitor asks about an open weekend tent site.', status: 'needs_reply', consent: 'unknown',
      unread: true, needsFollowUp: false, priority: 'high', context: 'Demo campground only · No guest account',
      events: [{ id: 'camp-sms-e1', kind: 'inbound', body: 'Mock message: Are tent sites available for the long weekend?', timeLabel: 'Sample · earlier' }]
    },
    {
      id: 'camp-voice', organizationId: 'icamp', channel: 'voice', sourceLabel: 'Office call · simulated',
      contactLabel: 'Demo campground guest B', subject: 'Arrival gate question',
      summary: 'Fictional missed front-desk call about visitor arrival.', status: 'new', consent: 'unknown',
      unread: true, needsFollowUp: true, priority: 'high', context: 'Front desk · No gate integration',
      events: [{ id: 'camp-voice-e1', kind: 'call_event', body: 'Simulated office missed-call event. No telephone or gate touched.', timeLabel: 'Sample · now' }]
    },
    {
      id: 'camp-web', organizationId: 'icamp', channel: 'website', sourceLabel: 'Visitor intake · simulated',
      contactLabel: 'Demo campground visitor C', subject: 'Event hall visitor pass',
      summary: 'Sample event inquiry with no reservation or admission created.', status: 'waiting', consent: 'service_only',
      unread: false, needsFollowUp: true, priority: 'normal', context: 'Events · No booking system access',
      events: [{ id: 'camp-web-e1', kind: 'inbound', body: 'Mock form: What is the process for visitor passes at a dance?', timeLabel: 'Sample · earlier' }]
    },
    {
      id: 'camp-email', organizationId: 'icamp', channel: 'email', sourceLabel: 'Email · simulated',
      contactLabel: 'Demo seasonal camper D', subject: 'Winter shutdown reminder',
      summary: 'Fictional seasonal water-shutdown question.', status: 'resolved', consent: 'opted_out',
      unread: false, needsFollowUp: false, priority: 'normal', context: 'Seasonal sites · No real tenant',
      events: [{ id: 'camp-email-e1', kind: 'inbound', body: 'Mock email: When do seasonal site winter procedures begin?', timeLabel: 'Sample · earlier' }]
    },
    {
      id: 'camp-internal', organizationId: 'icamp', channel: 'internal', sourceLabel: 'Maintenance note · demo',
      contactLabel: 'Demo campground office', subject: 'Washroom repair handoff',
      summary: 'Sample maintenance coordination; no work order submitted.', status: 'needs_reply', consent: 'unknown',
      unread: false, needsFollowUp: true, priority: 'normal', context: 'Maintenance · No campground tenant identified',
      events: [{ id: 'camp-internal-e1', kind: 'internal_note', body: 'Mock maintenance handoff: ask field crew for repair completion status.', timeLabel: 'Sample · earlier' }]
    }
  ],
  yw: [
    {
      id: 'yw-sms', organizationId: 'yw', channel: 'sms', sourceLabel: 'Customer SMS · simulated',
      contactLabel: 'Demo property owner A', subject: 'Snow plow service window',
      summary: 'Fictional property owner asks about a plowing schedule.', status: 'needs_reply', consent: 'unknown',
      unread: true, needsFollowUp: false, priority: 'high', context: 'Snow removal · No live company tenant',
      events: [{ id: 'yw-sms-e1', kind: 'inbound', body: 'Mock message: Is there a planned plow visit after the next snowfall?', timeLabel: 'Sample · earlier' }]
    },
    {
      id: 'yw-voicemail', organizationId: 'yw', channel: 'voicemail', sourceLabel: 'Voicemail · simulated',
      contactLabel: 'Demo property owner B', subject: 'Emergency septic request',
      summary: 'No voicemail audio; synthetic priority-triage example.', status: 'new', consent: 'unknown',
      unread: true, needsFollowUp: true, priority: 'high', context: 'Septic · No dispatch or service booking',
      events: [{ id: 'yw-voicemail-e1', kind: 'call_event', body: 'Simulated voicemail description: septic service request requiring staff triage.', timeLabel: 'Sample · now' }]
    },
    {
      id: 'yw-web', organizationId: 'yw', channel: 'website', sourceLabel: 'Service estimate · simulated',
      contactLabel: 'Demo rural resident C', subject: 'Garbage sticker collection question',
      summary: 'Sample quote request about paid collection stickers and contracts.', status: 'waiting', consent: 'service_only',
      unread: false, needsFollowUp: true, priority: 'normal', context: 'Rural waste collection · No invoice or contract',
      events: [{ id: 'yw-web-e1', kind: 'inbound', body: 'Mock intake: Does a seasonal garbage route require stickers or a contract?', timeLabel: 'Sample · earlier' }]
    },
    {
      id: 'yw-email', organizationId: 'yw', channel: 'email', sourceLabel: 'Email · simulated',
      contactLabel: 'Demo property owner D', subject: 'Lawn care renewal',
      summary: 'Fictitious spring maintenance contract question.', status: 'resolved', consent: 'opted_out',
      unread: false, needsFollowUp: false, priority: 'normal', context: 'Recurring lawn care · No accounting access',
      events: [{ id: 'yw-email-e1', kind: 'inbound', body: 'Mock email: Please explain the annual lawn maintenance options.', timeLabel: 'Sample · earlier' }]
    },
    {
      id: 'yw-internal', organizationId: 'yw', channel: 'internal', sourceLabel: 'Dispatch note · demo',
      contactLabel: 'Demo field operations', subject: 'Fibre trenching site constraints',
      summary: 'Synthetic job handoff for property access and site confirmation.', status: 'needs_reply', consent: 'unknown',
      unread: false, needsFollowUp: true, priority: 'normal', context: 'Light construction · No real work order',
      events: [{ id: 'yw-internal-e1', kind: 'internal_note', body: 'Mock task: review easement and utility-clearance requirements before estimating.', timeLabel: 'Sample · earlier' }]
    }
  ]
};

export const inboxChannels: readonly { id: InboxChannel | 'all'; label: string }[] = [
  { id: 'all', label: 'All channels' },
  { id: 'sms', label: 'SMS' },
  { id: 'mms', label: 'MMS' },
  { id: 'voice', label: 'Calls' },
  { id: 'voicemail', label: 'Voicemail' },
  { id: 'website', label: 'Website' },
  { id: 'email', label: 'Email' },
  { id: 'internal', label: 'Internal' }
];

export function inboxForOrganization(organizationId: OrganizationId): readonly InboxThread[] {
  return inboxFixtures[organizationId];
}

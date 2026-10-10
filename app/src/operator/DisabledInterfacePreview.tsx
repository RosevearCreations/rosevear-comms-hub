import { useState } from 'react';
import './disabled-interface-preview.css';

type PreviewBrandId = 'rosie' | 'devil';
type QueueTone = 'priority' | 'safe' | 'locked';

type SyntheticConversation = {
  id: string;
  title: string;
  status: string;
  summary: string;
  draft: string;
  timeline: Array<{ title: string; detail: string; locked?: boolean }>;
};

type PreviewBrand = {
  name: string;
  context: string;
  sample: string;
  count: string;
  headline: string;
  description: string;
  queueCards: Array<{ label: string; value: string; detail: string; help: string; tone: QueueTone }>;
  conversations: SyntheticConversation[];
};

const targetPreviewUrl = 'https://rosevearcreations.github.io/rosevear-comms-hub/';
const viteBasePath = '/rosevear-comms-hub/';
const brandOrder: PreviewBrandId[] = ['rosie', 'devil'];

const brandSamples: Record<PreviewBrandId, PreviewBrand> = {
  rosie: {
    name: 'Rosie Dazzlers',
    context: 'Mobile detailing',
    sample: 'Ceramic quote follow-up',
    count: '4 open',
    headline: 'Rosie Dazzlers communication cockpit',
    description: 'Synthetic detailing follow-ups for quotes, missed calls, weather-safe scheduling, and locked Phone/SMS actions.',
    queueCards: [
      {
        label: 'Needs reply',
        value: '4',
        detail: 'Website + missed-call detailing follow-ups',
        help: 'Synthetic Rosie Dazzlers queue count only; no live customer records are loaded.',
        tone: 'priority'
      },
      {
        label: 'Draft follow-ups',
        value: '2',
        detail: 'Ceramic quote and winter booking samples',
        help: 'Draft-only means the preview can show intent without provider delivery.',
        tone: 'safe'
      },
      {
        label: 'Phone/SMS runtime',
        value: 'OFF',
        detail: 'Controls visible, locked, and inert',
        help: 'Runtime remains blocked for calls, SMS, callbacks, recordings, and AI send.',
        tone: 'locked'
      }
    ],
    conversations: [
      {
        id: 'rosie-ceramic-quote',
        title: 'Ceramic quote follow-up',
        status: 'Needs review',
        summary: 'A synthetic customer asks whether a ceramic coating quote includes paint prep and safe weather timing.',
        draft: 'Draft-only sample: confirm vehicle size, explain prep expectations, and offer a weather-safe booking window.',
        timeline: [
          { title: 'Synthetic inquiry received', detail: 'Website quote sample enters the local-only Rosie Dazzlers selector.' },
          { title: 'Ceramic context reviewed', detail: 'Preview shows where vehicle size, prep, and coating notes could appear later.' },
          { title: 'Draft response staged', detail: 'No SMS, email, provider, persistence, or live customer path is used.' },
          { title: 'Send controls locked', detail: 'The selector changes preview context only; delivery remains disabled.', locked: true }
        ]
      },
      {
        id: 'rosie-missed-call',
        title: 'Missed-call callback sample',
        status: 'Callback sample',
        summary: 'A synthetic missed-call card asks for a detailing appointment after work hours.',
        draft: 'Draft-only sample: acknowledge the missed call, ask for vehicle size, and suggest AM/PM availability.',
        timeline: [
          { title: 'Missed-call sample selected', detail: 'No phone provider event or call log is loaded.' },
          { title: 'Availability question staged', detail: 'Synthetic AM/PM scheduling context appears for visual review.' },
          { title: 'Draft callback note prepared', detail: 'The draft remains plain preview copy inside React state.' },
          { title: 'Call action locked', detail: 'The public preview cannot place calls or register callback URLs.', locked: true }
        ]
      },
      {
        id: 'rosie-weather-reschedule',
        title: 'Weather-safe reschedule sample',
        status: 'Winter-safe sample',
        summary: 'A synthetic customer asks whether a cold-weather service should be rescheduled.',
        draft: 'Draft-only sample: explain temperature limits, offer the next safe window, and keep booking locked.',
        timeline: [
          { title: 'Weather sample opened', detail: 'Synthetic cold-weather constraint is shown as local preview data.' },
          { title: 'Service limit note reviewed', detail: 'Preview explains how an operator could phrase a reschedule later.' },
          { title: 'Follow-up copy staged', detail: 'No booking, SMS, customer search, or persistence path runs.' },
          { title: 'Booking and SMS locked', detail: 'Selection does not unlock scheduling or delivery.', locked: true }
        ]
      }
    ]
  },
  devil: {
    name: 'Devil n Dove',
    context: 'Maker shop',
    sample: 'Custom order reply',
    count: '2 open',
    headline: 'Devil n Dove communication cockpit',
    description: 'Synthetic maker-shop follow-ups for custom orders, Etsy-style questions, workshop context, and locked delivery actions.',
    queueCards: [
      {
        label: 'Needs reply',
        value: '2',
        detail: 'Custom order and product-question samples',
        help: 'Synthetic Devil n Dove queue count only; no live shop messages are loaded.',
        tone: 'priority'
      },
      {
        label: 'Draft follow-ups',
        value: '3',
        detail: 'Maker story and order clarification samples',
        help: 'Draft-only means no Etsy, SMS, email, or provider delivery is connected.',
        tone: 'safe'
      },
      {
        label: 'Provider delivery',
        value: 'OFF',
        detail: 'Shop, Phone/SMS, callback, and AI paths locked',
        help: 'The public preview only changes sample UI context in browser-local state.',
        tone: 'locked'
      }
    ],
    conversations: [
      {
        id: 'devil-custom-order',
        title: 'Custom order clarification sample',
        status: 'Needs maker detail',
        summary: 'A synthetic customer asks about colour, sizing, and whether a custom polymer clay item can be personalized.',
        draft: 'Draft-only sample: confirm colour, size, personalization limits, and expected making time.',
        timeline: [
          { title: 'Custom request selected', detail: 'Hard-coded maker-shop sample opens in the browser preview.' },
          { title: 'Workshop details reviewed', detail: 'Material, colour, and sizing notes remain synthetic.' },
          { title: 'Draft reply staged', detail: 'The response is plain local copy and cannot be sent.' },
          { title: 'Provider delivery locked', detail: 'No Etsy, SMS, email, callback, or provider account is connected.', locked: true }
        ]
      },
      {
        id: 'devil-maker-story',
        title: 'Maker story question sample',
        status: 'Story sample',
        summary: 'A synthetic shopper asks about the meaning behind Devil n Dove and the materials used.',
        draft: 'Draft-only sample: explain the Devil barriers / Dove hope theme and invite a specific product question.',
        timeline: [
          { title: 'Story question selected', detail: 'Synthetic brand-story prompt is loaded from local constants.' },
          { title: 'Meaning note reviewed', detail: 'Preview shows how the story could appear in a future operator panel.' },
          { title: 'Draft story reply staged', detail: 'The draft is not generated by AI and is not delivered anywhere.' },
          { title: 'AI and send locked', detail: 'No AI reply generation or provider send path is enabled.', locked: true }
        ]
      },
      {
        id: 'devil-workshop-materials',
        title: 'Workshop material sample',
        status: 'Materials sample',
        summary: 'A synthetic customer asks whether a piece can use stainless, clay, resin, or a mixed-material finish.',
        draft: 'Draft-only sample: ask which finish they prefer and explain that final material availability needs later review.',
        timeline: [
          { title: 'Material sample opened', detail: 'Synthetic workshop context appears in the selector.' },
          { title: 'Material options staged', detail: 'Clay, resin, stainless, and mixed-finish notes are preview text only.' },
          { title: 'Clarifying question staged', detail: 'No inventory, Etsy, Supabase, or provider source is queried.' },
          { title: 'Live data locked', detail: 'Selector cannot read product stock, archive messages, or retain records.', locked: true }
        ]
      }
    ]
  }
};

const plannedDetailTabs = [
  {
    title: 'Overview tab',
    detail: 'Show selected synthetic summary, status, brand context, and why the sample needs operator review.'
  },
  {
    title: 'Draft tab',
    detail: 'Show draft-only response copy without send, AI generation, provider delivery, or persistence.'
  },
  {
    title: 'Timeline tab',
    detail: 'Group the existing synthetic timeline into an intentional detail view without reading call or message history.'
  },
  {
    title: 'Safety tab',
    detail: 'Keep the locked actions, source restrictions, and runtime-disabled reminders visible beside every sample.'
  }
];

const planningChecks = [
  'Tabs will be planned only; no tab click implementation in QL-085.',
  'Future tab state must remain browser-local React state only.',
  'Tab content must reuse hard-coded synthetic conversation fields only.',
  'No tab can fetch Supabase rows, provider inboxes, SMS/call history, recordings, transcripts, archives, retention records, or AI replies.'
];

const disabledActions = [
  'Send SMS',
  'Call customer',
  'Connect provider',
  'Attach live number',
  'Register callback',
  'Persist live event',
  'Archive transcript',
  'Start live pilot'
];

function HelpMarker({ label }: { label: string }) {
  return (
    <span className="interface-preview-help" title={label} aria-label={`Help: ${label}`}>
      i
    </span>
  );
}

export function DisabledInterfacePreview() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeBrandId, setActiveBrandId] = useState<PreviewBrandId>('rosie');
  const [activeConversationByBrand, setActiveConversationByBrand] = useState<Record<PreviewBrandId, string>>({
    rosie: 'rosie-ceramic-quote',
    devil: 'devil-custom-order'
  });

  const activeBrand = brandSamples[activeBrandId];
  const activeConversation = activeBrand.conversations.find((conversation) => conversation.id === activeConversationByBrand[activeBrandId]) ?? activeBrand.conversations[0];

  return (
    <section className={isOpen ? 'interface-preview open' : 'interface-preview'} aria-label="Disabled interface preview">
      <button className="interface-preview-toggle" onClick={() => setIsOpen((value) => !value)} type="button">
        <span aria-hidden="true">▦</span>
        Interface preview
        <small>QL-085</small>
      </button>

      {isOpen && (
        <div className="interface-preview-panel" role="dialog" aria-modal="false" aria-label="QL-085 public disabled preview synthetic conversation detail tabs plan">
          <div className="interface-preview-header">
            <div>
              <p className="interface-preview-eyebrow">QL-085 Public disabled preview synthetic conversation detail tabs plan</p>
              <h2>Synthetic conversation detail tabs plan</h2>
              <p>
                This build plans the next browser-safe refinement: a future local-only tab set for the selected synthetic conversation. The current brand switcher and conversation selector remain active; the tabs are planned only and do not unlock runtime paths.
              </p>
            </div>
            <button className="interface-preview-close" onClick={() => setIsOpen(false)} type="button" aria-label="Close interface preview">
              ×
            </button>
          </div>

          <div className="interface-preview-warning">
            Browser-local preview only. QL-085 does not implement tab switching, connect providers, fetch live messages, enable callbacks, send SMS, place calls, persist data, archive records, generate AI replies, or start live pilot runtime.
          </div>

          <div className="interface-preview-review-grid">
            <article className="interface-preview-link-card">
              <p className="interface-preview-eyebrow">Public review URL</p>
              <h3>GitHub Pages disabled preview</h3>
              <code className="interface-preview-link">{targetPreviewUrl}</code>
              <p>
                The public preview remains served from GitHub Pages with the <code>{viteBasePath}</code> base path. QL-085 keeps the existing selector live and plans the future detail-tab shape.
              </p>
            </article>
            <article className="interface-preview-card interface-preview-next-step">
              <p className="interface-preview-eyebrow">QL-085 plan</p>
              <h3>Plan tabs before implementing them</h3>
              <p>
                The next implementation may add local tabs for overview, draft, timeline, and safety. Each tab must use only the selected hard-coded synthetic conversation.
              </p>
            </article>
          </div>

          <div className="interface-preview-shell refined" aria-label="Static operator dashboard mockup">
            <aside className="interface-preview-sidebar">
              <div className="interface-preview-section-title">
                <p className="interface-preview-eyebrow">Brand switcher</p>
                <HelpMarker label="Brand switcher remains local state only" />
              </div>
              {brandOrder.map((brandId) => {
                const brand = brandSamples[brandId];
                const isActive = brandId === activeBrandId;
                return (
                  <button
                    type="button"
                    className={isActive ? 'interface-preview-brand active interactive' : 'interface-preview-brand interactive'}
                    aria-pressed={isActive}
                    onClick={() => setActiveBrandId(brandId)}
                    key={brand.name}
                  >
                    <span>{brand.name}</span>
                    <small>{brand.context} · {brand.count}</small>
                    <em>{brand.sample}</em>
                  </button>
                );
              })}
              <div className="interface-preview-safe-card">
                <strong>Active sample</strong>
                <span>{activeConversation.title}</span>
                <small>Hard-coded sample; no persistence or live account access</small>
              </div>
            </aside>

            <main className="interface-preview-workspace">
              <div className="interface-preview-topline">
                <div>
                  <p className="interface-preview-eyebrow">Synthetic selector view</p>
                  <h3>{activeBrand.headline}</h3>
                </div>
                <span>Planning / synthetic / local state only</span>
              </div>

              <p className="interface-preview-muted">{activeBrand.description}</p>

              <div className="interface-preview-queue-grid">
                {activeBrand.queueCards.map((card) => (
                  <article className={`interface-preview-queue-card ${card.tone}`} key={card.label}>
                    <div className="interface-preview-section-title">
                      <span>{card.label}</span>
                      <HelpMarker label={card.help} />
                    </div>
                    <strong>{card.value}</strong>
                    <small>{card.detail}</small>
                  </article>
                ))}
              </div>

              <section className="interface-preview-card">
                <div className="interface-preview-section-title">
                  <p className="interface-preview-eyebrow">Synthetic conversation selector</p>
                  <HelpMarker label="Conversation selector remains hard-coded and browser-local" />
                </div>
                <div className="interface-preview-selector-list">
                  {activeBrand.conversations.map((conversation) => {
                    const isSelected = conversation.id === activeConversation.id;
                    return (
                      <button
                        type="button"
                        className={isSelected ? 'interface-preview-selector active' : 'interface-preview-selector'}
                        aria-pressed={isSelected}
                        onClick={() => setActiveConversationByBrand((current) => ({ ...current, [activeBrandId]: conversation.id }))}
                        key={conversation.id}
                      >
                        <span>{conversation.title}</span>
                        <small>{conversation.status}</small>
                      </button>
                    );
                  })}
                </div>
              </section>

              <section className="interface-preview-card">
                <div className="interface-preview-section-title">
                  <p className="interface-preview-eyebrow">Selected synthetic conversation</p>
                  <HelpMarker label="Current selector output remains synthetic preview text only" />
                </div>
                <h4>{activeConversation.title}</h4>
                <p>{activeConversation.summary}</p>
                <div className="interface-preview-draft-box">
                  <strong>Current draft-only copy</strong>
                  <span>{activeConversation.draft}</span>
                </div>
              </section>

              <section className="interface-preview-card">
                <div className="interface-preview-section-title">
                  <p className="interface-preview-eyebrow">Planned detail tabs</p>
                  <HelpMarker label="QL-085 plans the tabs only; QL-086 may implement local tab state" />
                </div>
                <div className="interface-preview-selector-list">
                  {plannedDetailTabs.map((tab) => (
                    <button className="interface-preview-selector" type="button" disabled key={tab.title}>
                      <span>{tab.title}</span>
                      <small>{tab.detail}</small>
                    </button>
                  ))}
                </div>
              </section>

              <section className="interface-preview-card">
                <div className="interface-preview-section-title">
                  <p className="interface-preview-eyebrow">Planning checks</p>
                  <HelpMarker label="These checks become the gate for implementing detail tabs safely" />
                </div>
                <ul className="interface-preview-check-list">
                  {planningChecks.map((check) => (
                    <li key={check}>{check}</li>
                  ))}
                </ul>
              </section>

              <section className="interface-preview-timeline">
                {activeConversation.timeline.map((event) => (
                  <article className={event.locked ? 'locked' : ''} key={event.title}>
                    <strong>{event.title}</strong>
                    <p>{event.detail}</p>
                  </article>
                ))}
              </section>

              <div className="interface-preview-actions" aria-label="Locked live actions">
                {disabledActions.map((action) => (
                  <button disabled type="button" key={action}>
                    {action} locked
                  </button>
                ))}
              </div>
            </main>
          </div>
        </div>
      )}
    </section>
  );
}

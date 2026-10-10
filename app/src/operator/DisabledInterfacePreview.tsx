import { useState } from 'react';
import './disabled-interface-preview.css';

type PreviewBrandId = 'rosie' | 'devil';
type QueueTone = 'priority' | 'safe' | 'locked';
type DetailTabId = 'overview' | 'draft' | 'timeline' | 'safety';

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
const supabaseProjectUrl = 'https://gxujcwpktaickcgzyvnu.supabase.co';
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

const detailTabs: Array<{ id: DetailTabId; title: string; detail: string }> = [
  {
    id: 'overview',
    title: 'Overview',
    detail: 'Selected summary, status, brand context, and why the sample needs review.'
  },
  {
    id: 'draft',
    title: 'Draft',
    detail: 'Draft-only response copy with no send, AI generation, provider delivery, or persistence.'
  },
  {
    id: 'timeline',
    title: 'Timeline',
    detail: 'Synthetic timeline events grouped into a focused local detail view.'
  },
  {
    id: 'safety',
    title: 'Safety',
    detail: 'Locked actions, source restrictions, and disabled runtime reminders.'
  }
];

const implementationChecks = [
  'Tabs are clickable in QL-086 and store active tab selection in browser-local React state only.',
  'Tab content reuses the selected hard-coded synthetic conversation fields only.',
  'Brand switching and conversation selection remain browser-local and synthetic.',
  'Tabs do not fetch Supabase rows, provider inboxes, SMS/call history, recordings, transcripts, archives, retention records, live customer records, callback payloads, or AI replies.'
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

function renderDetailTabContent(activeTabId: DetailTabId, activeBrand: PreviewBrand, activeConversation: SyntheticConversation) {
  if (activeTabId === 'draft') {
    return (
      <div className="interface-preview-tab-body draft">
        <p className="interface-preview-eyebrow">Draft-only reply</p>
        <h4>{activeConversation.title}</h4>
        <p>{activeConversation.draft}</p>
        <div className="interface-preview-tab-note locked">
          This draft cannot send, save, generate through AI, or reach a provider. It is static sample copy inside the public preview.
        </div>
      </div>
    );
  }

  if (activeTabId === 'timeline') {
    return (
      <div className="interface-preview-tab-body timeline">
        <p className="interface-preview-eyebrow">Synthetic timeline</p>
        <h4>{activeConversation.title}</h4>
        <ol>
          {activeConversation.timeline.map((event) => (
            <li className={event.locked ? 'locked-step' : ''} key={event.title}>
              <strong>{event.title}</strong>
              <span>{event.detail}</span>
            </li>
          ))}
        </ol>
      </div>
    );
  }

  if (activeTabId === 'safety') {
    return (
      <div className="interface-preview-tab-body safety">
        <p className="interface-preview-eyebrow">Safety and source locks</p>
        <h4>Runtime remains disabled</h4>
        <ul className="interface-preview-check-list">
          <li>Selected brand: {activeBrand.name}; selected sample: {activeConversation.title}.</li>
          <li>Supabase project target recorded for later: {supabaseProjectUrl}; QL-086 does not read or write it.</li>
          <li>No provider callbacks, live phone webhooks, SMS, calls, recordings, live customer records, archive writes, retention writes, AI send, or live pilot runtime are enabled.</li>
          <li>Tab state resets on page reload because it is not persisted.</li>
        </ul>
      </div>
    );
  }

  return (
    <div className="interface-preview-tab-body overview">
      <p className="interface-preview-eyebrow">Conversation overview</p>
      <h4>{activeConversation.title}</h4>
      <p>{activeConversation.summary}</p>
      <dl className="interface-preview-tab-facts">
        <div>
          <dt>Status</dt>
          <dd>{activeConversation.status}</dd>
        </div>
        <div>
          <dt>Brand</dt>
          <dd>{activeBrand.name}</dd>
        </div>
        <div>
          <dt>Source</dt>
          <dd>Hard-coded synthetic sample</dd>
        </div>
      </dl>
    </div>
  );
}

export function DisabledInterfacePreview() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeBrandId, setActiveBrandId] = useState<PreviewBrandId>('rosie');
  const [activeDetailTabId, setActiveDetailTabId] = useState<DetailTabId>('overview');
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
        <small>QL-086</small>
      </button>

      {isOpen && (
        <div className="interface-preview-panel" role="dialog" aria-modal="false" aria-label="QL-086 public disabled preview synthetic conversation detail tabs implementation">
          <div className="interface-preview-header">
            <div>
              <p className="interface-preview-eyebrow">QL-086 Public disabled preview synthetic conversation detail tabs implementation</p>
              <h2>Synthetic conversation detail tabs</h2>
              <p>
                This build implements the next browser-safe refinement: local tab switching for the selected synthetic conversation. Brand, conversation, and tab state are all React state only.
              </p>
            </div>
            <button className="interface-preview-close" onClick={() => setIsOpen(false)} type="button" aria-label="Close interface preview">
              ×
            </button>
          </div>

          <div className="interface-preview-warning">
            Browser-local preview only. QL-086 does not connect Supabase runtime, providers, fetch live messages, enable callbacks, send SMS, place calls, persist data, archive records, generate AI replies, or start live pilot runtime.
          </div>

          <div className="interface-preview-review-grid">
            <article className="interface-preview-link-card">
              <p className="interface-preview-eyebrow">Public review URL</p>
              <h3>GitHub Pages disabled preview</h3>
              <code className="interface-preview-link">{targetPreviewUrl}</code>
              <p>
                The public preview remains served from GitHub Pages with the <code>{viteBasePath}</code> base path. QL-086 adds local tab switching for selected synthetic conversations.
              </p>
            </article>
            <article className="interface-preview-card interface-preview-next-step">
              <p className="interface-preview-eyebrow">QL-086 implementation</p>
              <h3>Clickable local detail tabs</h3>
              <p>
                Overview, Draft, Timeline, and Safety tabs now switch local content. The next review build can validate tab clarity before any further interaction is added.
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
                  <p className="interface-preview-eyebrow">Synthetic detail-tabs view</p>
                  <h3>{activeBrand.headline}</h3>
                </div>
                <span>Interactive tabs / synthetic / local state only</span>
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

              <section className="interface-preview-card interface-preview-tabs-card">
                <div className="interface-preview-section-title">
                  <p className="interface-preview-eyebrow">Synthetic detail tabs</p>
                  <HelpMarker label="Tabs switch local React state only" />
                </div>
                <div className="interface-preview-tab-list" role="tablist" aria-label="Synthetic conversation detail tabs">
                  {detailTabs.map((tab) => {
                    const isSelected = tab.id === activeDetailTabId;
                    return (
                      <button
                        className={isSelected ? 'interface-preview-tab active' : 'interface-preview-tab'}
                        type="button"
                        role="tab"
                        aria-selected={isSelected}
                        onClick={() => setActiveDetailTabId(tab.id)}
                        key={tab.id}
                      >
                        <span>{tab.title}</span>
                        <small>{tab.detail}</small>
                      </button>
                    );
                  })}
                </div>
                <div className="interface-preview-tab-panel" role="tabpanel">
                  {renderDetailTabContent(activeDetailTabId, activeBrand, activeConversation)}
                </div>
              </section>

              <section className="interface-preview-card">
                <div className="interface-preview-section-title">
                  <p className="interface-preview-eyebrow">Implementation checks</p>
                  <HelpMarker label="These checks keep QL-086 browser-safe" />
                </div>
                <ul className="interface-preview-check-list">
                  {implementationChecks.map((check) => (
                    <li key={check}>{check}</li>
                  ))}
                </ul>
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
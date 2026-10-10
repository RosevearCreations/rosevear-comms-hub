import { useState } from 'react';
import './disabled-interface-preview.css';

type PreviewBrandId = 'rosie' | 'devil';
type QueueTone = 'priority' | 'safe' | 'locked';

type SyntheticConversation = {
  id: string;
  title: string;
  status: string;
  summary: string;
  detail: string;
  draft: string;
  timeline: Array<{ title: string; detail: string; locked?: boolean }>;
};

const targetPreviewUrl = 'https://rosevearcreations.github.io/rosevear-comms-hub/';
const viteBasePath = '/rosevear-comms-hub/';

const brandOrder: PreviewBrandId[] = ['rosie', 'devil'];

const brandSamples: Record<PreviewBrandId, {
  name: string;
  context: string;
  sample: string;
  count: string;
  headline: string;
  description: string;
  queueCards: Array<{ label: string; value: string; detail: string; help: string; tone: QueueTone }>;
  conversations: SyntheticConversation[];
}> = {
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
        status: 'Review passed',
        summary: 'A synthetic customer asks whether a ceramic coating quote includes paint prep and safe weather timing.',
        detail: 'Review confirms the selector changes only local preview context and does not read or write a real customer record.',
        draft: 'Draft-only sample: confirm vehicle size, explain prep expectations, and offer a weather-safe booking window.',
        timeline: [
          { title: 'Synthetic inquiry selected', detail: 'Website quote sample opens from hard-coded local data.' },
          { title: 'Ceramic context reviewed', detail: 'Vehicle size, prep, and coating notes remain synthetic preview copy.' },
          { title: 'Draft response staged', detail: 'No SMS, email, provider, persistence, or live customer path is used.' },
          { title: 'Send controls locked', detail: 'The selector changes preview context only; delivery remains disabled.', locked: true }
        ]
      },
      {
        id: 'rosie-missed-call',
        title: 'Missed-call callback sample',
        status: 'Review passed',
        summary: 'A synthetic missed-call card asks for a detailing appointment after work hours.',
        detail: 'Review confirms this card is not telephony-backed and has no callback URL, call log, recording, or transcript source.',
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
        status: 'Review passed',
        summary: 'A synthetic customer asks whether a cold-weather service should be rescheduled.',
        detail: 'Review confirms seasonal guidance is hard-coded and disconnected from bookings, live messages, or customer records.',
        draft: 'Draft-only sample: explain temperature limits, offer the next safe window, and keep the booking action locked.',
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
        status: 'Review passed',
        summary: 'A synthetic customer asks about colour, sizing, and whether a custom polymer clay item can be personalized.',
        detail: 'Review confirms the selector does not pull Etsy, email, live shop data, or customer records.',
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
        status: 'Review passed',
        summary: 'A synthetic shopper asks about the meaning behind Devil n Dove and the materials used.',
        detail: 'Review confirms brand-story context is hard-coded and not generated by AI or pulled from live product data.',
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
        status: 'Review passed',
        summary: 'A synthetic customer asks whether a piece can use stainless, clay, resin, or a mixed-material finish.',
        detail: 'Review confirms material clarification does not read inventory, customer records, or live product data.',
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

const selectorReviewFindings = [
  {
    title: 'Interaction is understandable',
    detail: 'Brand selection and conversation selection both visibly change the operator context without needing live data.'
  },
  {
    title: 'State remains browser-local',
    detail: 'The chosen brand and conversation are stored in React state only and reset with a page reload.'
  },
  {
    title: 'Sample scope is safe',
    detail: 'Only summary text, draft-only copy, and timeline content change when the selector is used.'
  },
  {
    title: 'Locked actions stay locked',
    detail: 'Provider, Phone/SMS, AI, archive, retention, persistence, and live pilot actions remain visibly disabled.'
  }
];

const nextSafeInteractionRules = [
  'May add browser-local conversation detail tabs for notes, draft, and history.',
  'May add synthetic-only confidence labels and review badges.',
  'Must not read Supabase rows, provider inboxes, live customers, recordings, transcripts, archives, or retention records.',
  'Must not send SMS, place calls, generate AI replies, register callbacks, or start live pilot runtime.'
];

const rejectedEscalations = [
  'Live Supabase conversation rows',
  'Provider inbox imports',
  'Phone/SMS message history',
  'Call recordings or transcripts',
  'Real customer search',
  'AI-generated replies',
  'Archive or retention records',
  'Callback verification payloads'
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

function DisabledInterfacePreview() {
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
        <small>QL-084</small>
      </button>

      {isOpen && (
        <div className="interface-preview-panel" role="dialog" aria-modal="false" aria-label="QL-084 public disabled preview synthetic conversation selector review">
          <div className="interface-preview-header">
            <div>
              <p className="interface-preview-eyebrow">QL-084 Public disabled preview synthetic conversation selector review</p>
              <h2>Synthetic conversation selector review</h2>
              <p>
                This build reviews the QL-083 selector implementation. The brand switcher and conversation selector stay active, but both remain hard-coded, synthetic, browser-local, and disconnected from every live Phone/SMS, provider, Supabase, AI, persistence, archive, retention, and live pilot path.
              </p>
            </div>
            <button className="interface-preview-close" onClick={() => setIsOpen(false)} type="button" aria-label="Close interface preview">
              ×
            </button>
          </div>

          <div className="interface-preview-warning">
            Review only. QL-084 confirms the selector is useful and safe, but it does not connect providers, fetch live messages, enable callbacks, send SMS, place calls, persist data, archive records, generate AI replies, or start live pilot runtime.
          </div>

          <div className="interface-preview-review-grid">
            <article className="interface-preview-link-card">
              <p className="interface-preview-eyebrow">Public review URL</p>
              <h3>GitHub Pages disabled preview</h3>
              <code className="interface-preview-link">{targetPreviewUrl}</code>
              <p>
                The public preview remains served from GitHub Pages with the <code>{viteBasePath}</code> base path. QL-084 keeps the local selector live for review.
              </p>
            </article>
            <article className="interface-preview-card interface-preview-next-step">
              <p className="interface-preview-eyebrow">QL-084 decision</p>
              <h3>Selector passes safe-interaction review</h3>
              <p>
                The selector is suitable for continued public-preview refinement because it only swaps hard-coded sample context in browser-local state.
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
                <strong>Review result</strong>
                <span>Selector stays safe</span>
                <small>Hard-coded samples; no persistence or live account access</small>
              </div>
            </aside>

            <main className="interface-preview-workspace">
              <div className="interface-preview-topline">
                <div>
                  <p className="interface-preview-eyebrow">Selector review view</p>
                  <h3>{activeBrand.headline}</h3>
                </div>
                <span>Reviewed / synthetic / local state only</span>
              </div>

              <article className="interface-preview-card interface-preview-local-state-card">
                <div className="interface-preview-card-heading">
                  <span>{activeBrand.name} selector review</span>
                  <HelpMarker label="QL-084 reviews the local selector without changing runtime boundaries" />
                </div>
                <p>{activeBrand.description}</p>
              </article>

              <div className="interface-preview-grid refined-cards">
                {activeBrand.queueCards.map((card) => (
                  <article className={`interface-preview-card ${card.tone}`} key={card.label}>
                    <div className="interface-preview-card-heading">
                      <span>{card.label}</span>
                      <HelpMarker label={card.help} />
                    </div>
                    <strong>{card.value}</strong>
                    <small>{card.detail}</small>
                  </article>
                ))}
              </div>

              <div className="interface-preview-detail-grid">
                <article className="interface-preview-card timeline refined-timeline">
                  <div className="interface-preview-card-heading">
                    <p className="interface-preview-eyebrow">Synthetic conversations</p>
                    <HelpMarker label="Conversation buttons switch hard-coded samples only" />
                  </div>
                  <h4>Selector remains active for review</h4>
                  <ol>
                    {activeBrand.conversations.map((conversation) => {
                      const isActive = conversation.id === activeConversation.id;
                      return (
                        <li key={conversation.id}>
                          <button
                            type="button"
                            className={isActive ? 'interface-preview-brand active interactive' : 'interface-preview-brand interactive'}
                            aria-pressed={isActive}
                            onClick={() => setActiveConversationByBrand((current) => ({ ...current, [activeBrandId]: conversation.id }))}
                          >
                            <span>{conversation.title}</span>
                            <small>{conversation.status}</small>
                          </button>
                        </li>
                      );
                    })}
                  </ol>
                </article>

                <article className="interface-preview-card controls">
                  <div className="interface-preview-card-heading">
                    <p className="interface-preview-eyebrow">Selected sample review</p>
                    <HelpMarker label="Selected sample changes preview text only" />
                  </div>
                  <h4>{activeConversation.title}</h4>
                  <p>{activeConversation.summary}</p>
                  <small>{activeConversation.detail}</small>
                  <div className="interface-preview-warning">{activeConversation.draft}</div>
                </article>
              </div>

              <div className="interface-preview-detail-grid">
                <article className="interface-preview-card timeline refined-timeline">
                  <div className="interface-preview-card-heading">
                    <p className="interface-preview-eyebrow">Synthetic timeline</p>
                    <HelpMarker label="Timeline is derived from hard-coded local sample data" />
                  </div>
                  <ol>
                    {activeConversation.timeline.map((item) => (
                      <li className={item.locked ? 'locked-step' : undefined} key={item.title}>
                        <strong>{item.title}</strong>
                        <span>{item.detail}</span>
                      </li>
                    ))}
                  </ol>
                </article>

                <article className="interface-preview-card controls">
                  <div className="interface-preview-card-heading">
                    <p className="interface-preview-eyebrow">Locked controls</p>
                    <HelpMarker label="Controls remain locked after selector review" />
                  </div>
                  <div className="interface-preview-action-grid">
                    {disabledActions.map((action) => (
                      <button type="button" disabled key={action}>
                        {action} locked
                      </button>
                    ))}
                  </div>
                  <p className="interface-preview-control-note">
                    The selector review approves local preview interaction only. It does not unlock any live action button.
                  </p>
                </article>
              </div>
            </main>
          </div>

          <div className="interface-preview-columns">
            <article className="interface-preview-card interface-preview-wide-card">
              <h3>QL-084 review findings</h3>
              <div className="interface-preview-help-grid">
                {selectorReviewFindings.map((item) => (
                  <div className="interface-preview-help-card" key={item.title}>
                    <HelpMarker label={`${item.title} review finding`} />
                    <strong>{item.title}</strong>
                    <p>{item.detail}</p>
                  </div>
                ))}
              </div>
            </article>
            <article className="interface-preview-card interface-preview-wide-card interface-preview-interactions">
              <h3>Next safe interaction rules</h3>
              <div className="interface-preview-pill-list">
                {nextSafeInteractionRules.map((rule) => (
                  <span key={rule}>{rule}</span>
                ))}
              </div>
            </article>
            <article className="interface-preview-card interface-preview-wide-card interface-preview-interactions">
              <h3>Still rejected as selector sources</h3>
              <div className="interface-preview-pill-list">
                {rejectedEscalations.map((source) => (
                  <span key={source}>{source}</span>
                ))}
              </div>
            </article>
          </div>
        </div>
      )}
    </section>
  );
}

export { DisabledInterfacePreview };

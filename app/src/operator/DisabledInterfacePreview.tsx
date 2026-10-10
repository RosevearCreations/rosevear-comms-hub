import { useState } from 'react';
import './disabled-interface-preview.css';

type PreviewBrandId = 'rosie' | 'devil';
type QueueTone = 'priority' | 'safe' | 'locked';

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
  timeline: Array<{ title: string; detail: string; locked?: boolean }>;
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
    timeline: [
      {
        title: 'Quote inquiry received',
        detail: 'Synthetic ceramic coating request enters the Rosie Dazzlers sample queue.'
      },
      {
        title: 'Weather-safe note added',
        detail: 'Preview shows where an operator note about temperature limits could appear later.'
      },
      {
        title: 'Draft follow-up prepared',
        detail: 'Follow-up is staged as review-only sample data.'
      },
      {
        title: 'SMS/call actions locked',
        detail: 'No provider connection, callback registration, or live customer record is used.',
        locked: true
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
    timeline: [
      {
        title: 'Custom request received',
        detail: 'Synthetic maker-shop request enters the Devil n Dove sample queue.'
      },
      {
        title: 'Workshop note staged',
        detail: 'Preview shows where material, colour, or sizing notes could appear later.'
      },
      {
        title: 'Draft reply prepared',
        detail: 'Follow-up is staged as review-only sample data.'
      },
      {
        title: 'Send and archive actions locked',
        detail: 'No provider account, live customer data, archive, retention, or AI reply path is used.',
        locked: true
      }
    ]
  }
};

const selectorPlan = [
  {
    title: 'Selector remains synthetic',
    detail: 'The next interaction may choose between two or three hard-coded conversation examples for the active brand only.'
  },
  {
    title: 'Selector remains browser-local',
    detail: 'The chosen sample conversation should be stored in React state only and reset when the page reloads.'
  },
  {
    title: 'Selector stays read-only',
    detail: 'Conversation selection may update preview text and timeline context, but it must not save, fetch, send, call, archive, or deliver anything.'
  }
];

const selectorCandidates = [
  'Quote follow-up sample',
  'Missed-call callback sample',
  'Custom order clarification sample',
  'Workshop detail question sample'
];

const rejectedSelectorSources = [
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
  const activeBrand = brandSamples[activeBrandId];

  return (
    <section className={isOpen ? 'interface-preview open' : 'interface-preview'} aria-label="Disabled interface preview">
      <button className="interface-preview-toggle" onClick={() => setIsOpen((value) => !value)} type="button">
        <span aria-hidden="true">▦</span>
        Interface preview
        <small>QL-082</small>
      </button>

      {isOpen && (
        <div className="interface-preview-panel" role="dialog" aria-modal="false" aria-label="QL-082 public disabled preview synthetic conversation selector plan">
          <div className="interface-preview-header">
            <div>
              <p className="interface-preview-eyebrow">QL-082 Public disabled preview synthetic conversation selector plan</p>
              <h2>Synthetic conversation selector plan</h2>
              <p>
                This build plans the next safe public-preview interaction after the reviewed brand switcher. The next selector may switch among hard-coded sample conversations for the active brand, but every Phone/SMS, provider, Supabase runtime, persistence, archive, retention, AI, and live pilot path remains blocked.
              </p>
            </div>
            <button className="interface-preview-close" onClick={() => setIsOpen(false)} type="button" aria-label="Close interface preview">
              ×
            </button>
          </div>

          <div className="interface-preview-warning">
            Planning only. QL-082 does not implement conversation selection, connect providers, fetch live messages, enable callbacks, send SMS, place calls, persist data, archive records, generate AI replies, or start live pilot runtime.
          </div>

          <div className="interface-preview-review-grid">
            <article className="interface-preview-link-card">
              <p className="interface-preview-eyebrow">Public review URL</p>
              <h3>GitHub Pages disabled preview</h3>
              <code className="interface-preview-link">{targetPreviewUrl}</code>
              <p>
                The public preview remains served from GitHub Pages with the <code>{viteBasePath}</code> base path. QL-082 keeps the current brand switcher live and plans the next safe local-only control.
              </p>
            </article>
            <article className="interface-preview-card interface-preview-next-step">
              <p className="interface-preview-eyebrow">QL-082 decision</p>
              <h3>Plan a synthetic conversation selector next</h3>
              <p>
                The selector should be limited to hard-coded examples and browser-local React state. It should help review operator flow without introducing live inbox, provider, SMS, call, Supabase, AI, archive, or retention risk.
              </p>
            </article>
          </div>

          <div className="interface-preview-shell refined" aria-label="Static operator dashboard mockup">
            <aside className="interface-preview-sidebar">
              <div className="interface-preview-section-title">
                <p className="interface-preview-eyebrow">Existing safe interaction</p>
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
                <strong>Next planned local control</strong>
                <span>Synthetic conversation selector</span>
                <small>Not implemented in QL-082; planned for browser-local state only</small>
              </div>
            </aside>

            <main className="interface-preview-workspace">
              <div className="interface-preview-topline">
                <div>
                  <p className="interface-preview-eyebrow">Selector planning view</p>
                  <h3>{activeBrand.headline}</h3>
                </div>
                <span>Plan / synthetic / local state only</span>
              </div>

              <article className="interface-preview-card interface-preview-local-state-card">
                <div className="interface-preview-card-heading">
                  <span>{activeBrand.name} stays selected by local state</span>
                  <HelpMarker label="QL-082 keeps brand switching live while planning conversation selection" />
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
                    <p className="interface-preview-eyebrow">Planned selector candidates</p>
                    <HelpMarker label="Candidates are labels for hard-coded sample conversations only" />
                  </div>
                  <h4>Conversation selector planning</h4>
                  <ol>
                    {selectorCandidates.map((candidate) => (
                      <li key={candidate}>
                        <strong>{candidate}</strong>
                        <span>Candidate only; no live inbox, provider, SMS, call, Supabase, AI, archive, or retention source.</span>
                      </li>
                    ))}
                  </ol>
                </article>

                <article className="interface-preview-card controls">
                  <div className="interface-preview-card-heading">
                    <p className="interface-preview-eyebrow">Locked controls</p>
                    <HelpMarker label="Controls remain locked while selector planning proceeds" />
                  </div>
                  <div className="interface-preview-action-grid">
                    {disabledActions.map((action) => (
                      <button type="button" disabled key={action}>
                        {action} locked
                      </button>
                    ))}
                  </div>
                  <p className="interface-preview-control-note">
                    The future selector may choose synthetic sample copy only. It must not unlock any live action button.
                  </p>
                </article>
              </div>
            </main>
          </div>

          <div className="interface-preview-columns">
            <article className="interface-preview-card interface-preview-wide-card">
              <h3>QL-082 selector plan</h3>
              <div className="interface-preview-help-grid">
                {selectorPlan.map((item) => (
                  <div className="interface-preview-help-card" key={item.title}>
                    <HelpMarker label={`${item.title} selector planning`} />
                    <strong>{item.title}</strong>
                    <p>{item.detail}</p>
                  </div>
                ))}
              </div>
            </article>
            <article className="interface-preview-card interface-preview-wide-card interface-preview-interactions">
              <h3>Rejected selector sources</h3>
              <p>
                QL-082 explicitly rejects sources that would introduce provider, backend, live customer, delivery, archive, retention, AI, or live-pilot risk.
              </p>
              <div className="interface-preview-pill-list">
                {rejectedSelectorSources.map((source) => (
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

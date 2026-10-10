import { useState } from 'react';
import './disabled-interface-preview.css';

type PreviewBrandId = 'rosie' | 'devil';

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
  queueCards: Array<{ label: string; value: string; detail: string; help: string; tone: 'priority' | 'safe' | 'locked' }>;
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

const implementedChecks = [
  'Brand buttons now switch between Rosie Dazzlers and Devil n Dove sample panels.',
  'The interaction uses React state only inside the public preview component.',
  'All queue cards, timeline text, and summary copy remain hard-coded synthetic preview data.',
  'No Supabase client import, provider connection, persistence write, live customer read, SMS send, call runtime, AI send, archive write, retention write, or live pilot path is added.'
];

const remainingLockedPaths = [
  'Real SMS draft send',
  'Call test button',
  'Provider connect flow',
  'Callback verification route',
  'Supabase-backed inbox reads',
  'Live customer search',
  'Archive or retention action',
  'AI reply generation'
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
        <small>QL-080</small>
      </button>

      {isOpen && (
        <div className="interface-preview-panel" role="dialog" aria-modal="false" aria-label="QL-080 public disabled preview first safe interaction implementation">
          <div className="interface-preview-header">
            <div>
              <p className="interface-preview-eyebrow">QL-080 Public disabled preview first safe interaction implementation</p>
              <h2>Browser-local brand switcher implemented</h2>
              <p>
                This build implements the first safe public-preview interaction selected in QL-079. The Rosie Dazzlers / Devil n Dove switcher changes only synthetic browser-local preview content while every Phone/SMS, provider, Supabase runtime, persistence, archive, retention, AI, and live pilot path remains blocked.
              </p>
            </div>
            <button className="interface-preview-close" onClick={() => setIsOpen(false)} type="button" aria-label="Close interface preview">
              ×
            </button>
          </div>

          <div className="interface-preview-warning">
            Browser-local interaction only. QL-080 does not connect providers, callbacks, live SMS, calls, recordings, AI send, persistence writes, live customer access, archive writes, retention writes, Supabase runtime changes, or live pilot runtime.
          </div>

          <div className="interface-preview-review-grid">
            <article className="interface-preview-link-card">
              <p className="interface-preview-eyebrow">Public review URL</p>
              <h3>GitHub Pages disabled preview</h3>
              <code className="interface-preview-link">{targetPreviewUrl}</code>
              <p>
                The public preview remains served from GitHub Pages with the <code>{viteBasePath}</code> base path. The first interaction runs inside the browser bundle only.
              </p>
            </article>
            <article className="interface-preview-card interface-preview-next-step">
              <p className="interface-preview-eyebrow">QL-080 result</p>
              <h3>Local brand switching is now clickable</h3>
              <p>
                Select Rosie Dazzlers or Devil n Dove to swap synthetic queue cards and timeline context. Nothing is saved, fetched, sent, called, archived, or delivered.
              </p>
            </article>
          </div>

          <div className="interface-preview-shell refined" aria-label="Static operator dashboard mockup">
            <aside className="interface-preview-sidebar">
              <div className="interface-preview-section-title">
                <p className="interface-preview-eyebrow">Browser-local brands</p>
                <HelpMarker label="Brand switcher is local state only" />
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
                <strong>Active synthetic brand</strong>
                <span>{activeBrand.name}</span>
                <small>Stored only in React state for this browser session</small>
              </div>
            </aside>

            <main className="interface-preview-workspace">
              <div className="interface-preview-topline">
                <div>
                  <p className="interface-preview-eyebrow">Safe interaction live in preview</p>
                  <h3>{activeBrand.headline}</h3>
                </div>
                <span>Interactive / synthetic / local state</span>
              </div>

              <article className="interface-preview-card interface-preview-local-state-card">
                <div className="interface-preview-card-heading">
                  <span>{activeBrand.name} selected</span>
                  <HelpMarker label="The selected brand only affects synthetic preview content" />
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
                    <p className="interface-preview-eyebrow">Synthetic timeline</p>
                    <HelpMarker label="Timeline changes with selected sample brand" />
                  </div>
                  <h4>{activeBrand.sample}</h4>
                  <ol>
                    {activeBrand.timeline.map((item) => (
                      <li key={item.title} className={item.locked ? 'locked-step' : undefined}>
                        <strong>{item.title}</strong>
                        <span>{item.detail}</span>
                      </li>
                    ))}
                  </ol>
                </article>

                <article className="interface-preview-card controls">
                  <div className="interface-preview-card-heading">
                    <p className="interface-preview-eyebrow">Locked controls</p>
                    <HelpMarker label="Controls remain locked even while brand switching works" />
                  </div>
                  <div className="interface-preview-action-grid">
                    {disabledActions.map((action) => (
                      <button type="button" disabled key={action}>
                        {action} locked
                      </button>
                    ))}
                  </div>
                  <p className="interface-preview-control-note">
                    Brand switching changes sample UI context only. It does not unlock any live action button.
                  </p>
                </article>
              </div>
            </main>
          </div>

          <div className="interface-preview-columns">
            <article className="interface-preview-card interface-preview-wide-card">
              <h3>QL-080 implementation checks</h3>
              <ol>
                {implementedChecks.map((check) => (
                  <li key={check}>{check}</li>
                ))}
              </ol>
            </article>
            <article className="interface-preview-card interface-preview-wide-card interface-preview-interactions">
              <h3>Still rejected from the public preview interaction path</h3>
              <p>
                These remain locked because they touch provider, backend, live customer, delivery, archive, retention, AI, or live-pilot risk.
              </p>
              <div className="interface-preview-pill-list">
                {remainingLockedPaths.map((option) => (
                  <span key={option}>{option}</span>
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

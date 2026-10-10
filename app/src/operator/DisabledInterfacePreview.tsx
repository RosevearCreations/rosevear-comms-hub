import { useState } from 'react';
import './disabled-interface-preview.css';

const targetPreviewUrl = 'https://rosevearcreations.github.io/rosevear-comms-hub/';
const viteBasePath = '/rosevear-comms-hub/';

const brandPanels = [
  {
    name: 'Rosie Dazzlers',
    context: 'Mobile detailing',
    sample: 'Ceramic quote follow-up',
    count: '4 open',
    active: true
  },
  {
    name: 'Devil n Dove',
    context: 'Maker shop',
    sample: 'Custom order reply',
    count: '2 open',
    active: false
  }
];

const refinedQueueCards = [
  {
    label: 'Needs reply',
    value: '4',
    detail: 'Website + missed-call follow-ups',
    help: 'Prioritizes visible work only; no real message send is connected.',
    tone: 'priority'
  },
  {
    label: 'Draft follow-ups',
    value: '2',
    detail: 'Operator review before sending later',
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
];

const timelineSteps = [
  {
    title: 'Inquiry received',
    detail: 'Synthetic website request enters the sample queue.',
    locked: false
  },
  {
    title: 'Internal note added',
    detail: 'Operator can understand where a private note will appear later.',
    locked: false
  },
  {
    title: 'Draft task prepared',
    detail: 'Follow-up is staged as review-only sample data.',
    locked: false
  },
  {
    title: 'SMS/call actions locked',
    detail: 'No provider connection, callback registration, or live customer record is used.',
    locked: true
  }
];

const helpMarkers = [
  {
    area: 'Brand switcher',
    guidance: 'Explains how Rosie Dazzlers and Devil n Dove stay separated inside one shared console.'
  },
  {
    area: 'Queue cards',
    guidance: 'Explains urgency, source, draft-only state, and why visible counts are synthetic.'
  },
  {
    area: 'Timeline',
    guidance: 'Explains inquiry, note, draft task, and locked communication action order.'
  },
  {
    area: 'Disabled controls',
    guidance: 'Explains why live SMS, calls, callbacks, AI, archive, retention, and persistence remain off.'
  },
  {
    area: 'Deployment status',
    guidance: 'Explains the GitHub Pages preview and public-safe browser boundary.'
  }
];

const firstSafeInteractionOptions = [
  'Sample brand switcher',
  'Synthetic conversation selector',
  'Local task filter',
  'Preview layout preference',
  'Browser-local feedback checklist'
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

  return (
    <section className={isOpen ? 'interface-preview open' : 'interface-preview'} aria-label="Disabled interface preview">
      <button className="interface-preview-toggle" onClick={() => setIsOpen((value) => !value)} type="button">
        <span aria-hidden="true">▦</span>
        Interface preview
        <small>QL-078</small>
      </button>

      {isOpen && (
        <div className="interface-preview-panel" role="dialog" aria-modal="false" aria-label="QL-078 public disabled preview refinement implementation">
          <div className="interface-preview-header">
            <div>
              <p className="interface-preview-eyebrow">QL-078 Public disabled preview refinement implementation</p>
              <h2>Quo-lite public preview refinements</h2>
              <p>
                This build implements the safe public-preview refinements planned in QL-077: clearer layout sections, visible circled-i help markers, refined brand and queue context, a more readable synthetic timeline, and first safe interaction candidates.
              </p>
            </div>
            <button className="interface-preview-close" onClick={() => setIsOpen(false)} type="button" aria-label="Close interface preview">
              ×
            </button>
          </div>

          <div className="interface-preview-warning">
            Static public preview only. Phone/SMS providers, callbacks, live SMS, calls, recordings, AI send, persistence writes, live customer access, archive writes, retention writes, Supabase runtime changes, and live pilot runtime remain OFF.
          </div>

          <div className="interface-preview-review-grid">
            <article className="interface-preview-link-card">
              <p className="interface-preview-eyebrow">Public review URL</p>
              <h3>GitHub Pages disabled preview</h3>
              <code className="interface-preview-link">{targetPreviewUrl}</code>
              <p>
                The preview remains served from GitHub Pages with the <code>{viteBasePath}</code> base path. The browser bundle stays public-safe and runtime-disabled.
              </p>
            </article>
            <article className="interface-preview-card interface-preview-next-step">
              <p className="interface-preview-eyebrow">QL-078 refinement result</p>
              <h3>Usability refined before live integration</h3>
              <p>
                The page now gives a clearer first impression and prepares for a future browser-safe interaction using synthetic sample data or local state only.
              </p>
            </article>
          </div>

          <div className="interface-preview-shell refined" aria-label="Static operator dashboard mockup">
            <aside className="interface-preview-sidebar">
              <div className="interface-preview-section-title">
                <p className="interface-preview-eyebrow">Brands</p>
                <HelpMarker label="Brand switcher guidance" />
              </div>
              {brandPanels.map((brand) => (
                <button type="button" className={brand.active ? 'interface-preview-brand active' : 'interface-preview-brand'} disabled key={brand.name}>
                  <span>{brand.name}</span>
                  <small>{brand.context} · {brand.count}</small>
                  <em>{brand.sample}</em>
                </button>
              ))}
              <div className="interface-preview-safe-card">
                <strong>Preview status</strong>
                <span>Refinement implemented</span>
                <small>Static Pages preview; live controls locked</small>
              </div>
            </aside>

            <main className="interface-preview-workspace">
              <div className="interface-preview-topline">
                <div>
                  <p className="interface-preview-eyebrow">Operator queue</p>
                  <h3>Today’s communication cockpit</h3>
                </div>
                <span>Static / disabled / refined</span>
              </div>

              <div className="interface-preview-grid refined-cards">
                {refinedQueueCards.map((card) => (
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
                    <p className="interface-preview-eyebrow">Customer timeline</p>
                    <HelpMarker label="Timeline guidance" />
                  </div>
                  <h4>Example: ceramic quote follow-up</h4>
                  <ol>
                    {timelineSteps.map((step) => (
                      <li key={step.title} className={step.locked ? 'locked-step' : undefined}>
                        <strong>{step.title}</strong>
                        <span>{step.detail}</span>
                      </li>
                    ))}
                  </ol>
                </article>

                <article className="interface-preview-card controls">
                  <div className="interface-preview-card-heading">
                    <p className="interface-preview-eyebrow">Disabled controls</p>
                    <HelpMarker label="Disabled control guidance" />
                  </div>
                  <div className="interface-preview-action-grid">
                    {disabledActions.map((action) => (
                      <button type="button" disabled key={action}>
                        {action} locked
                      </button>
                    ))}
                  </div>
                  <p className="interface-preview-control-note">
                    All buttons are visible to show the future operator surface, but they are intentionally inert in the public preview.
                  </p>
                </article>
              </div>
            </main>
          </div>

          <div className="interface-preview-columns">
            <article className="interface-preview-card interface-preview-wide-card">
              <h3>Implemented QL-078 refinements</h3>
              <div className="interface-preview-help-grid">
                {helpMarkers.map((marker) => (
                  <div className="interface-preview-help-card" key={marker.area}>
                    <HelpMarker label={`${marker.area} help`} />
                    <strong>{marker.area}</strong>
                    <p>{marker.guidance}</p>
                  </div>
                ))}
              </div>
            </article>
            <article className="interface-preview-card interface-preview-wide-card interface-preview-interactions">
              <h3>First browser-safe interaction candidates</h3>
              <p>
                These are still candidates only. A later build can implement one using synthetic sample data or browser-local state, without provider, Supabase runtime, or live customer data.
              </p>
              <div className="interface-preview-pill-list">
                {firstSafeInteractionOptions.map((option) => (
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

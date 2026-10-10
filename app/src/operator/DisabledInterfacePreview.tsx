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

const plannedInteractionCandidates = [
  {
    title: 'Sample brand switcher',
    decision: 'Approve as the first interaction to implement next',
    reason: 'It is useful, understandable, and can run entirely from synthetic data in browser-local state.',
    safety: 'No provider, Supabase runtime, persistence writes, live customer records, SMS, calls, callbacks, archive, retention, or AI send.'
  },
  {
    title: 'Synthetic conversation selector',
    decision: 'Keep as second interaction candidate',
    reason: 'It can help prove the cockpit flow after brand switching is clear.',
    safety: 'Synthetic-only conversation cards; no real message bodies, phone numbers, transcripts, or customer records.'
  },
  {
    title: 'Local feedback checklist',
    decision: 'Keep as review aid, not first interaction',
    reason: 'Useful for visual review but less important than proving brand context first.',
    safety: 'Browser-local only and not submitted anywhere.'
  }
];

const interactionAcceptanceChecks = [
  'Uses only hard-coded synthetic preview data or browser-local state.',
  'Does not import or initialize the Supabase client.',
  'Does not read or write persistence, archive, retention, or live customer tables.',
  'Does not expose provider credentials, service-role keys, callback tokens, live phone numbers, message bodies, transcripts, or recordings.',
  'Does not enable SMS sending, call runtime, recording, AI send, provider delivery, callback registration, or live pilot behavior.',
  'Keeps every live action visibly locked and inert while allowing the selected safe UI interaction.'
];

const implementationScope = [
  {
    step: '1',
    title: 'Add browser-local active brand state',
    detail: 'Use React state only to switch between Rosie Dazzlers and Devil n Dove sample panels.'
  },
  {
    step: '2',
    title: 'Swap synthetic queue content',
    detail: 'Change visible counts, sample task labels, and timeline headings based on the active brand.'
  },
  {
    step: '3',
    title: 'Preserve locked action controls',
    detail: 'Keep SMS, calls, provider connection, callbacks, persistence, archive, retention, AI, and live pilot controls disabled.'
  },
  {
    step: '4',
    title: 'Verify static Pages deployment',
    detail: 'Confirm App scaffold CI and GitHub Pages Disabled Preview both remain green after promotion.'
  }
];

const rejectedFirstInteractions = [
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

  return (
    <section className={isOpen ? 'interface-preview open' : 'interface-preview'} aria-label="Disabled interface preview">
      <button className="interface-preview-toggle" onClick={() => setIsOpen((value) => !value)} type="button">
        <span aria-hidden="true">▦</span>
        Interface preview
        <small>QL-079</small>
      </button>

      {isOpen && (
        <div className="interface-preview-panel" role="dialog" aria-modal="false" aria-label="QL-079 public disabled preview first safe interaction plan">
          <div className="interface-preview-header">
            <div>
              <p className="interface-preview-eyebrow">QL-079 Public disabled preview first safe interaction plan</p>
              <h2>First safe interaction plan</h2>
              <p>
                This build chooses the first browser-safe public preview interaction to implement next. The selected path is a sample brand switcher using synthetic data and browser-local React state only, while every Phone/SMS, provider, Supabase runtime, persistence, archive, retention, AI, and live pilot path remains blocked.
              </p>
            </div>
            <button className="interface-preview-close" onClick={() => setIsOpen(false)} type="button" aria-label="Close interface preview">
              ×
            </button>
          </div>

          <div className="interface-preview-warning">
            Interaction plan only. QL-079 does not enable the interaction yet and does not connect providers, callbacks, live SMS, calls, recordings, AI send, persistence writes, live customer access, archive writes, retention writes, Supabase runtime changes, or live pilot runtime.
          </div>

          <div className="interface-preview-review-grid">
            <article className="interface-preview-link-card">
              <p className="interface-preview-eyebrow">Public review URL</p>
              <h3>GitHub Pages disabled preview</h3>
              <code className="interface-preview-link">{targetPreviewUrl}</code>
              <p>
                The public preview remains served from GitHub Pages with the <code>{viteBasePath}</code> base path. QL-079 plans the first local-only interaction for the same public-safe surface.
              </p>
            </article>
            <article className="interface-preview-card interface-preview-next-step">
              <p className="interface-preview-eyebrow">QL-079 decision</p>
              <h3>Implement brand switching next</h3>
              <p>
                The first safe interaction should be a browser-local brand switcher that changes synthetic preview content between Rosie Dazzlers and Devil n Dove without backend or provider access.
              </p>
            </article>
          </div>

          <div className="interface-preview-shell refined" aria-label="Static operator dashboard mockup">
            <aside className="interface-preview-sidebar">
              <div className="interface-preview-section-title">
                <p className="interface-preview-eyebrow">Planned interaction</p>
                <HelpMarker label="First safe interaction guidance" />
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
                <span>Interaction planned</span>
                <small>Next build may make these sample brand buttons locally interactive</small>
              </div>
            </aside>

            <main className="interface-preview-workspace">
              <div className="interface-preview-topline">
                <div>
                  <p className="interface-preview-eyebrow">Safe interaction boundary</p>
                  <h3>Browser-local brand switching</h3>
                </div>
                <span>Plan only / synthetic / local state</span>
              </div>

              <div className="interface-preview-grid refined-cards">
                <article className="interface-preview-card safe">
                  <div className="interface-preview-card-heading">
                    <span>Selected first interaction</span>
                    <HelpMarker label="Selected interaction" />
                  </div>
                  <strong>Brand</strong>
                  <small>Switch Rosie Dazzlers / Devil n Dove synthetic panels</small>
                </article>
                <article className="interface-preview-card priority">
                  <div className="interface-preview-card-heading">
                    <span>Data source</span>
                    <HelpMarker label="Synthetic data only" />
                  </div>
                  <strong>Local</strong>
                  <small>Hard-coded sample records or React state only</small>
                </article>
                <article className="interface-preview-card locked">
                  <div className="interface-preview-card-heading">
                    <span>Runtime status</span>
                    <HelpMarker label="Runtime remains locked" />
                  </div>
                  <strong>OFF</strong>
                  <small>Live SMS, calls, callbacks, Supabase runtime, and provider delivery blocked</small>
                </article>
              </div>

              <div className="interface-preview-detail-grid">
                <article className="interface-preview-card timeline refined-timeline">
                  <div className="interface-preview-card-heading">
                    <p className="interface-preview-eyebrow">Implementation plan</p>
                    <HelpMarker label="Implementation steps" />
                  </div>
                  <h4>Next safe interaction implementation path</h4>
                  <ol>
                    {implementationScope.map((item) => (
                      <li key={item.step}>
                        <strong>{item.step}. {item.title}</strong>
                        <span>{item.detail}</span>
                      </li>
                    ))}
                  </ol>
                </article>

                <article className="interface-preview-card controls">
                  <div className="interface-preview-card-heading">
                    <p className="interface-preview-eyebrow">Locked controls</p>
                    <HelpMarker label="Controls remain locked" />
                  </div>
                  <div className="interface-preview-action-grid">
                    {disabledActions.map((action) => (
                      <button type="button" disabled key={action}>
                        {action} locked
                      </button>
                    ))}
                  </div>
                  <p className="interface-preview-control-note">
                    The first safe interaction may change sample UI context only. It must not unlock any live action button.
                  </p>
                </article>
              </div>
            </main>
          </div>

          <div className="interface-preview-columns">
            <article className="interface-preview-card interface-preview-wide-card">
              <h3>QL-079 candidate decision</h3>
              <div className="interface-preview-help-grid">
                {plannedInteractionCandidates.map((candidate) => (
                  <div className="interface-preview-help-card" key={candidate.title}>
                    <HelpMarker label={`${candidate.title} decision`} />
                    <strong>{candidate.title}</strong>
                    <p><b>{candidate.decision}.</b> {candidate.reason}</p>
                    <p>{candidate.safety}</p>
                  </div>
                ))}
              </div>
            </article>
            <article className="interface-preview-card interface-preview-wide-card">
              <h3>Acceptance checks for the next build</h3>
              <ol>
                {interactionAcceptanceChecks.map((check) => (
                  <li key={check}>{check}</li>
                ))}
              </ol>
            </article>
            <article className="interface-preview-card interface-preview-wide-card interface-preview-interactions">
              <h3>Rejected as first interactions</h3>
              <p>
                These are intentionally rejected for the first public preview interaction because they touch provider, backend, live customer, or delivery risk.
              </p>
              <div className="interface-preview-pill-list">
                {rejectedFirstInteractions.map((option) => (
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

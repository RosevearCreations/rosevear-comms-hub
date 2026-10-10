import { useState } from 'react';
import './disabled-interface-preview.css';

const targetPreviewUrl = 'https://rosevearcreations.github.io/rosevear-comms-hub/';
const viteBasePath = '/rosevear-comms-hub/';

const feedbackModules = [
  {
    title: 'First-look feedback',
    body: 'Capture whether the public disabled preview immediately communicates the shared Quo-lite direction for Rosie Dazzlers and Devil n Dove.',
    status: 'Feedback intake'
  },
  {
    title: 'Operator workflow clarity',
    body: 'Review whether inbox, queue, customer timeline, draft-only actions, and disabled controls are clear enough for future daily use.',
    status: 'Review needed'
  },
  {
    title: 'GitHub Pages publication',
    body: `QL-075 expects the corrected variable to let the Pages workflow publish ${targetPreviewUrl} using the ${viteBasePath} base path.`,
    status: 'Verify live URL'
  },
  {
    title: 'Safety boundary',
    body: 'Provider credentials, callback tokens, service-role keys, live numbers, webhooks, message bodies, transcripts, recordings, and live customer records remain excluded from browser output.',
    status: 'Protected'
  }
];

const feedbackPrompts = [
  'Does the public preview load at the GitHub Pages URL after the final main push?',
  'Can you quickly tell this is a shared communications hub for Rosie Dazzlers and Devil n Dove?',
  'Are the brand switcher, operator queue, customer timeline, disabled controls, and status cards easy to understand?',
  'Do the labels make it obvious that SMS, calls, provider connections, callbacks, recordings, AI send, persistence, archive, retention, and live pilot runtime are disabled?',
  'What should be changed first: layout, labels, colours, help text, brand switching, inbox cards, timeline, or next-action panels?',
  'What is missing before we build the first real interactive console screen?'
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

function DisabledInterfacePreview() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <section className={isOpen ? 'interface-preview open' : 'interface-preview'} aria-label="Disabled interface preview">
      <button className="interface-preview-toggle" onClick={() => setIsOpen((value) => !value)} type="button">
        <span aria-hidden="true">▦</span>
        Interface preview
        <small>QL-075</small>
      </button>

      {isOpen && (
        <div className="interface-preview-panel" role="dialog" aria-modal="false" aria-label="QL-075 public disabled preview feedback intake">
          <div className="interface-preview-header">
            <div>
              <p className="interface-preview-eyebrow">QL-075 Public disabled preview feedback intake</p>
              <h2>Quo-lite public preview feedback capture</h2>
              <p>
                This build turns the disabled public preview into a feedback intake checkpoint. It asks what looks right, what feels wrong, and what should become interactive next while keeping all live Phone/SMS paths disabled.
              </p>
            </div>
            <button className="interface-preview-close" onClick={() => setIsOpen(false)} type="button" aria-label="Close interface preview">
              ×
            </button>
          </div>

          <div className="interface-preview-warning">
            Feedback intake only. Phone/SMS providers, callbacks, live SMS, calls, recordings, AI send, persistence writes, live customer access, archive writes, retention writes, and live pilot runtime remain OFF.
          </div>

          <div className="interface-preview-review-grid">
            <article className="interface-preview-link-card">
              <p className="interface-preview-eyebrow">Public review URL</p>
              <h3>GitHub Pages disabled preview</h3>
              <code className="interface-preview-link">{targetPreviewUrl}</code>
              <p>
                QL-075 verifies whether the corrected ENABLE_GITHUB_PAGES_DISABLED_PREVIEW variable lets the static disabled preview deploy. Once live, use this URL for first feedback notes.
              </p>
            </article>
            <article className="interface-preview-card interface-preview-next-step">
              <p className="interface-preview-eyebrow">QL-075 decision</p>
              <h3>Capture feedback before adding real interaction</h3>
              <p>
                The goal is to collect layout, wording, workflow, and priority feedback before any provider callbacks, SMS, calls, AI sends, persistence writes, or live pilot behavior are enabled.
              </p>
            </article>
          </div>

          <div className="interface-preview-shell" aria-label="Static operator dashboard mockup">
            <aside className="interface-preview-sidebar">
              <p className="interface-preview-eyebrow">Brands</p>
              <button type="button" className="interface-preview-brand active" disabled>
                Rosie Dazzlers
                <small>Mobile detailing inbox</small>
              </button>
              <button type="button" className="interface-preview-brand" disabled>
                Devil n Dove
                <small>Maker shop inbox</small>
              </button>
              <div className="interface-preview-safe-card">
                <strong>Preview status</strong>
                <span>Feedback intake</span>
                <small>Static Pages preview; live controls locked</small>
              </div>
            </aside>

            <main className="interface-preview-workspace">
              <div className="interface-preview-topline">
                <div>
                  <p className="interface-preview-eyebrow">Operator queue</p>
                  <h3>Today’s communication cockpit</h3>
                </div>
                <span>Static / disabled / feedback intake</span>
              </div>

              <div className="interface-preview-grid">
                <article className="interface-preview-card priority">
                  <span>Needs reply</span>
                  <strong>4</strong>
                  <small>Website + missed-call follow-ups</small>
                </article>
                <article className="interface-preview-card">
                  <span>Quotes waiting</span>
                  <strong>2</strong>
                  <small>Draft-only, no sending</small>
                </article>
                <article className="interface-preview-card">
                  <span>Phone/SMS runtime</span>
                  <strong>OFF</strong>
                  <small>Controls are visible but locked</small>
                </article>
              </div>

              <div className="interface-preview-detail-grid">
                <article className="interface-preview-card timeline">
                  <p className="interface-preview-eyebrow">Customer timeline</p>
                  <h4>Example: ceramic quote follow-up</h4>
                  <ul>
                    <li>Website request received</li>
                    <li>Internal note added</li>
                    <li>Quote follow-up task created</li>
                    <li>SMS/call buttons remain disabled</li>
                  </ul>
                </article>

                <article className="interface-preview-card controls">
                  <p className="interface-preview-eyebrow">Disabled controls</p>
                  <div className="interface-preview-action-grid">
                    {disabledActions.map((action) => (
                      <button type="button" disabled key={action}>
                        {action} disabled
                      </button>
                    ))}
                  </div>
                </article>
              </div>
            </main>
          </div>

          <div className="interface-preview-module-grid">
            {feedbackModules.map((module) => (
              <article className="interface-preview-module" key={module.title}>
                <span>{module.status}</span>
                <h4>{module.title}</h4>
                <p>{module.body}</p>
              </article>
            ))}
          </div>

          <div className="interface-preview-columns">
            <article className="interface-preview-card interface-preview-wide-card">
              <h3>QL-075 feedback prompts</h3>
              <ol>
                {feedbackPrompts.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ol>
            </article>
          </div>
        </div>
      )}
    </section>
  );
}

export { DisabledInterfacePreview };

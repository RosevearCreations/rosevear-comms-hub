import { useState } from 'react';
import './disabled-interface-preview.css';

const targetPreviewUrl = 'https://rosevearcreations.github.io/rosevear-comms-hub/';
const viteBasePath = '/rosevear-comms-hub/';

const visualReviewModules = [
  {
    title: 'Unified inbox surface',
    body: 'Brand-aware conversation cards for Rosie Dazzlers and Devil n Dove remain visible so the public preview can be judged directionally.',
    status: 'Visual review'
  },
  {
    title: 'Operator command centre',
    body: 'Phone/SMS action areas remain visible for workflow review, while every live control is disabled and cannot send or call.',
    status: 'Locked'
  },
  {
    title: 'GitHub Pages public preview',
    body: `QL-074 reviews the public static preview at ${targetPreviewUrl} with the ${viteBasePath} base path when the Pages gate deploys.`,
    status: 'Public check'
  },
  {
    title: 'Safety boundary',
    body: 'Provider credentials, callback tokens, service-role keys, live numbers, webhooks, message bodies, transcripts, recordings, and live customer records remain excluded from browser output.',
    status: 'Protected'
  }
];

const visualReviewChecks = [
  'Open the public URL after the final main push and confirm whether the GitHub Pages workflow deployed or safely skipped.',
  'Confirm the preview shell is visually usable: brand switcher, operator queue, customer timeline, disabled controls, and status cards are visible.',
  'Confirm the review page clearly says it is static, disabled, and not a live Phone/SMS pilot.',
  'Confirm the static build uses npm run pages:build and Vite base path /rosevear-comms-hub/.',
  'Confirm browser output does not contain provider credentials, service-role keys, callback tokens, live phone data, live message bodies, transcripts, recordings, or live customer data.',
  'Confirm SMS, calls, callbacks, recording, AI send, persistence writes, archive writes, retention writes, and live pilot runtime remain disabled.'
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
        <small>QL-074</small>
      </button>

      {isOpen && (
        <div className="interface-preview-panel" role="dialog" aria-modal="false" aria-label="QL-074 public disabled preview visual review">
          <div className="interface-preview-header">
            <div>
              <p className="interface-preview-eyebrow">QL-074 Public disabled preview visual review</p>
              <h2>Quo-lite public static preview visual check</h2>
              <p>
                This build reviews the public GitHub Pages disabled preview experience. It keeps the interface static and browser-safe while making the Quo-lite direction visible for visual review.
              </p>
            </div>
            <button className="interface-preview-close" onClick={() => setIsOpen(false)} type="button" aria-label="Close interface preview">
              ×
            </button>
          </div>

          <div className="interface-preview-warning">
            Visual review only. Phone/SMS providers, callbacks, live SMS, calls, recordings, AI send, persistence writes, live customer access, archive writes, retention writes, and live pilot runtime remain OFF.
          </div>

          <div className="interface-preview-review-grid">
            <article className="interface-preview-link-card">
              <p className="interface-preview-eyebrow">Public review URL</p>
              <h3>GitHub Pages disabled preview</h3>
              <code className="interface-preview-link">{targetPreviewUrl}</code>
              <p>
                QL-074 verifies this as the public visual review target. It loads only after the Pages workflow deploys with GitHub Pages Source set to GitHub Actions and ENABLE_GITHUB_PAGES_DISABLED_PREVIEW=true.
              </p>
            </article>
            <article className="interface-preview-card interface-preview-next-step">
              <p className="interface-preview-eyebrow">QL-074 decision</p>
              <h3>Review the look and direction, not live operations</h3>
              <p>
                The public preview can confirm whether the dashboard direction feels right without enabling provider callbacks, SMS, calls, AI sends, persistence writes, or live pilot behavior.
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
                <span>Public visual review</span>
                <small>Static Pages preview; live controls locked</small>
              </div>
            </aside>

            <main className="interface-preview-workspace">
              <div className="interface-preview-topline">
                <div>
                  <p className="interface-preview-eyebrow">Operator queue</p>
                  <h3>Today’s communication cockpit</h3>
                </div>
                <span>Static / disabled / visual review</span>
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
            {visualReviewModules.map((module) => (
              <article className="interface-preview-module" key={module.title}>
                <span>{module.status}</span>
                <h4>{module.title}</h4>
                <p>{module.body}</p>
              </article>
            ))}
          </div>

          <div className="interface-preview-columns">
            <article className="interface-preview-card interface-preview-wide-card">
              <h3>QL-074 visual review checklist</h3>
              <ol>
                {visualReviewChecks.map((step) => (
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

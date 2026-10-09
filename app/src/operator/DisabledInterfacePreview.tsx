import { useState } from 'react';
import './disabled-interface-preview.css';

const targetPreviewUrl = 'https://rosevearcreations.github.io/rosevear-comms-hub/';
const viteBasePath = '/rosevear-comms-hub/';

const previewModules = [
  {
    title: 'Unified inbox',
    body: 'Brand-aware conversations for Rosie Dazzlers and Devil n Dove with contact, intake, and task context in one static review surface.',
    status: 'Ready for static preview'
  },
  {
    title: 'Operator command centre',
    body: 'Phone/SMS action areas stay visible for workflow review, but every live control remains disabled.',
    status: 'Locked'
  },
  {
    title: 'GitHub Pages path',
    body: `Static build uses the ${viteBasePath} base path and can publish to the planned GitHub Pages URL after the repo Pages source and enablement variable are set.`,
    status: 'Gated workflow added'
  },
  {
    title: 'Provider boundary',
    body: 'Provider credentials, callback tokens, service-role keys, live numbers, webhooks, and live customer records remain server-only later.',
    status: 'Server-only later'
  }
];

const enablementGateSteps = [
  'GitHub Pages workflow exists but is gated by ENABLE_GITHUB_PAGES_DISABLED_PREVIEW=true.',
  'Repository Pages source must be set to GitHub Actions before expecting the public URL to work.',
  'The static build uses npm run pages:build and Vite base path /rosevear-comms-hub/.',
  'Browser env is limited to public values only; live provider and service-role secrets are never exposed.',
  'SMS, calls, callbacks, recording, AI send, persistence writes, archive writes, retention writes, and live pilot runtime remain disabled.'
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
        <small>QL-072</small>
      </button>

      {isOpen && (
        <div className="interface-preview-panel" role="dialog" aria-modal="false" aria-label="QL-072 GitHub Pages disabled preview deployment enablement gate">
          <div className="interface-preview-header">
            <div>
              <p className="interface-preview-eyebrow">QL-072 GitHub Pages disabled preview deployment enablement gate</p>
              <h2>Quo-lite static review link is workflow-ready</h2>
              <p>
                This build adds the gated GitHub Pages deployment workflow for the disabled preview. It remains static, browser-safe, and locked until the repository Pages source and enablement variable are set.
              </p>
            </div>
            <button className="interface-preview-close" onClick={() => setIsOpen(false)} type="button" aria-label="Close interface preview">
              ×
            </button>
          </div>

          <div className="interface-preview-warning">
            Static disabled preview only. Phone/SMS providers, callbacks, live SMS, calls, recordings, AI send, persistence writes, live customer access, archive writes, retention writes, and live pilot runtime remain OFF.
          </div>

          <div className="interface-preview-review-grid">
            <article className="interface-preview-link-card">
              <p className="interface-preview-eyebrow">Target public review URL</p>
              <h3>GitHub Pages disabled preview</h3>
              <code className="interface-preview-link">{targetPreviewUrl}</code>
              <p>
                The workflow is now in code, but the URL only becomes live after GitHub Pages is set to GitHub Actions and the ENABLE_GITHUB_PAGES_DISABLED_PREVIEW Actions variable is set to true.
              </p>
            </article>
            <article className="interface-preview-card interface-preview-next-step">
              <p className="interface-preview-eyebrow">QL-072 decision</p>
              <h3>Deployment workflow added behind a safety gate</h3>
              <p>
                The repository can now produce a static disabled preview without Vercel, Cloudflare Pages, provider secrets, callbacks, or live runtime behavior.
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
                <strong>Deployment status</strong>
                <span>GitHub Pages gated</span>
                <small>Static workflow added; live controls locked</small>
              </div>
            </aside>

            <main className="interface-preview-workspace">
              <div className="interface-preview-topline">
                <div>
                  <p className="interface-preview-eyebrow">Operator queue</p>
                  <h3>Today’s communication cockpit</h3>
                </div>
                <span>Static / disabled / Pages-gated</span>
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
            {previewModules.map((module) => (
              <article className="interface-preview-module" key={module.title}>
                <span>{module.status}</span>
                <h4>{module.title}</h4>
                <p>{module.body}</p>
              </article>
            ))}
          </div>

          <div className="interface-preview-columns">
            <article className="interface-preview-card interface-preview-wide-card">
              <h3>QL-072 enablement checklist</h3>
              <ol>
                {enablementGateSteps.map((step) => (
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

import { useState } from 'react';
import './disabled-interface-preview.css';

const targetPreviewUrl = 'https://rosevearcreations.github.io/rosevear-comms-hub/';
const viteBasePath = '/rosevear-comms-hub/';

const previewModules = [
  {
    title: 'Unified inbox',
    body: 'Brand-aware conversations for Rosie Dazzlers and Devil n Dove with contact, intake, and task context in one static review surface.',
    status: 'Ready for review'
  },
  {
    title: 'Operator command centre',
    body: 'Phone/SMS action areas stay visible for workflow review, but every live control remains disabled.',
    status: 'Locked'
  },
  {
    title: 'GitHub Pages verification',
    body: `QL-073 verifies whether the gated Pages workflow deploys the static app with the ${viteBasePath} base path or safely skips when the enablement variable is absent.`,
    status: 'Verification active'
  },
  {
    title: 'Provider boundary',
    body: 'Provider credentials, callback tokens, service-role keys, live numbers, webhooks, and live customer records remain server-only later.',
    status: 'Server-only later'
  }
];

const verificationSteps = [
  'Confirm the normal app CI still passes install, check, and build on main.',
  'Confirm the GitHub Pages disabled preview workflow either deploys when ENABLE_GITHUB_PAGES_DISABLED_PREVIEW=true or skips safely when the variable is absent.',
  'Confirm the target public review URL remains https://rosevearcreations.github.io/rosevear-comms-hub/.',
  'Confirm the static build uses npm run pages:build and Vite base path /rosevear-comms-hub/.',
  'Confirm browser output remains static and does not contain provider credentials, service-role keys, callback tokens, live phone data, live message bodies, transcripts, recordings, or live customer data.',
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
        <small>QL-073</small>
      </button>

      {isOpen && (
        <div className="interface-preview-panel" role="dialog" aria-modal="false" aria-label="QL-073 GitHub Pages disabled preview deployment verification">
          <div className="interface-preview-header">
            <div>
              <p className="interface-preview-eyebrow">QL-073 GitHub Pages disabled preview deployment verification</p>
              <h2>Quo-lite static review link verification</h2>
              <p>
                This build verifies the disabled GitHub Pages preview deployment path while keeping the app static, browser-safe, and locked. It proves whether the Pages workflow deploys or safely skips based on the repository variable.
              </p>
            </div>
            <button className="interface-preview-close" onClick={() => setIsOpen(false)} type="button" aria-label="Close interface preview">
              ×
            </button>
          </div>

          <div className="interface-preview-warning">
            Verification only. Phone/SMS providers, callbacks, live SMS, calls, recordings, AI send, persistence writes, live customer access, archive writes, retention writes, and live pilot runtime remain OFF.
          </div>

          <div className="interface-preview-review-grid">
            <article className="interface-preview-link-card">
              <p className="interface-preview-eyebrow">Public review URL under verification</p>
              <h3>GitHub Pages disabled preview</h3>
              <code className="interface-preview-link">{targetPreviewUrl}</code>
              <p>
                QL-073 verifies this URL after the workflow runs. A successful Pages deployment requires GitHub Pages Source = GitHub Actions and ENABLE_GITHUB_PAGES_DISABLED_PREVIEW=true.
              </p>
            </article>
            <article className="interface-preview-card interface-preview-next-step">
              <p className="interface-preview-eyebrow">QL-073 decision</p>
              <h3>Deployment path verification, not live feature enablement</h3>
              <p>
                The verification proves the static preview path without enabling provider callbacks, SMS, calls, AI sends, persistence writes, or live pilot behavior.
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
                <span>Pages verification</span>
                <small>Static workflow checked; live controls locked</small>
              </div>
            </aside>

            <main className="interface-preview-workspace">
              <div className="interface-preview-topline">
                <div>
                  <p className="interface-preview-eyebrow">Operator queue</p>
                  <h3>Today’s communication cockpit</h3>
                </div>
                <span>Static / disabled / verifying Pages</span>
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
              <h3>QL-073 verification checklist</h3>
              <ol>
                {verificationSteps.map((step) => (
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

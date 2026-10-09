import { useState } from 'react';
import './disabled-interface-preview.css';

const previewModules = [
  {
    title: 'Unified inbox',
    body: 'Brand-aware conversations for Rosie Dazzlers and Devil n Dove with contact, intake, and task context in one review surface.',
    status: 'Deployment planned'
  },
  {
    title: 'Operator command centre',
    body: 'Phone/SMS action area is visible so the workflow can be reviewed, but every live control remains disabled.',
    status: 'Locked'
  },
  {
    title: 'Customer timeline',
    body: 'Shows how calls, texts, notes, website forms, quotes, and follow-ups will line up once the safe backend path exists.',
    status: 'Static data'
  },
  {
    title: 'Provider boundary',
    body: 'Provider credentials, callback tokens, service-role keys, live numbers, and webhook secrets stay server-only later.',
    status: 'Server-only later'
  }
];

const reviewFindings = [
  'Preview is useful enough to validate overall Quo-lite direction.',
  'Static dashboard regions communicate the expected operator workflow.',
  'Disabled Phone/SMS controls make the future live path visible without enabling it.',
  'A real review link is the next useful step, but it must stay static and disabled.'
];

const deploymentPlanSteps = [
  'Use GitHub Pages as the static disabled preview host for the existing app build output.',
  'Set GitHub Pages source to GitHub Actions before enabling the deployment workflow.',
  'Add only public browser variables: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.',
  'Keep service-role keys, provider credentials, callback tokens, live phone numbers, message bodies, transcripts, recordings, and live customer data out of browser code.',
  'Build the app with the GitHub Pages base path /rosevear-comms-hub/.',
  'Deploy only the static disabled preview; do not enable SMS, calls, callbacks, persistence, archive, retention, AI send, or live pilot runtime.'
];

const implementationSteps = [
  'Keep this preview inside the existing app while the GitHub Pages deployment plan is reviewed.',
  'Prepare GitHub Pages as the next static disabled preview deployment path; do not deploy in QL-071.',
  'Use only public browser variables later: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.',
  'Keep provider secrets, service-role work, callback verification, and webhook handling behind Supabase Edge Functions later.',
  'Do not expose live phone numbers, customer message bodies, transcripts, recordings, callback tokens, or provider credentials in browser code.',
  'Do not enable SMS, calls, AI sending, persistence writes, archive writes, retention policy writes, or live-pilot runtime in this build.'
];

const interfaceRegions = [
  'Brand switcher',
  'Inbox queue',
  'Customer/contact summary',
  'Conversation timeline',
  'Disabled Phone/SMS controls',
  'Follow-up task board',
  'Safe deployment status',
  'Manual readiness checklist'
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

const futurePreviewUrl = 'https://rosevearcreations.github.io/rosevear-comms-hub/';

function DisabledInterfacePreview() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <section className={isOpen ? 'interface-preview open' : 'interface-preview'} aria-label="Disabled interface preview">
      <button className="interface-preview-toggle" onClick={() => setIsOpen((value) => !value)} type="button">
        <span aria-hidden="true">▦</span>
        Interface preview
        <small>QL-071</small>
      </button>

      {isOpen && (
        <div className="interface-preview-panel" role="dialog" aria-modal="false" aria-label="QL-071 GitHub Pages disabled preview deployment plan">
          <div className="interface-preview-header">
            <div>
              <p className="interface-preview-eyebrow">QL-071 GitHub Pages disabled preview deployment plan</p>
              <h2>Quo-lite operator interface review link path</h2>
              <p>
                This build plans the static GitHub Pages preview path for the reviewed interface while keeping every Phone/SMS, provider, persistence, AI, archive, retention, and live-pilot runtime path disabled.
              </p>
            </div>
            <button className="interface-preview-close" onClick={() => setIsOpen(false)} type="button" aria-label="Close interface preview">
              ×
            </button>
          </div>

          <div className="interface-preview-warning">
            Deployment plan only. No GitHub Pages workflow, no Pages deployment, no provider connection, no callback route, no SMS, no calls, no recording, no AI send, no persistence writes, and no live pilot runtime are enabled in QL-071.
          </div>

          <div className="interface-preview-review-grid">
            <article className="interface-preview-link-card">
              <p className="interface-preview-eyebrow">Planned public review URL</p>
              <h3>GitHub Pages disabled preview</h3>
              <code className="interface-preview-link">{futurePreviewUrl}</code>
              <p>
                QL-071 confirms this as the target static review URL. It remains not live until a later deployment enablement build adds the GitHub Pages workflow and the repository Pages setting is switched to GitHub Actions.
              </p>
            </article>
            <article className="interface-preview-card interface-preview-next-step">
              <p className="interface-preview-eyebrow">QL-071 decision</p>
              <h3>Deployment path planned, not enabled</h3>
              <p>
                The next safe build should enable a static GitHub Pages disabled preview using only browser-safe variables and no live Phone/SMS runtime.
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
                <strong>Deployment path</strong>
                <span>GitHub Pages planned</span>
                <small>QL-071 plan only; still not deployed</small>
              </div>
            </aside>

            <main className="interface-preview-workspace">
              <div className="interface-preview-topline">
                <div>
                  <p className="interface-preview-eyebrow">Operator queue</p>
                  <h3>Today’s communication cockpit</h3>
                </div>
                <span>Static / disabled / deployment planned</span>
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
            <article className="interface-preview-card">
              <h3>QL-070 review findings carried forward</h3>
              <ol>
                {reviewFindings.map((finding) => (
                  <li key={finding}>{finding}</li>
                ))}
              </ol>
            </article>
            <article className="interface-preview-card">
              <h3>QL-071 deployment plan</h3>
              <ol>
                {deploymentPlanSteps.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ol>
            </article>
            <article className="interface-preview-card">
              <h3>Interface regions planned for static preview</h3>
              <div className="interface-preview-pill-list">
                {interfaceRegions.map((region) => (
                  <span key={region}>{region}</span>
                ))}
              </div>
            </article>
            <article className="interface-preview-card interface-preview-wide-card">
              <h3>Implementation checklist</h3>
              <ol>
                {implementationSteps.map((step) => (
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

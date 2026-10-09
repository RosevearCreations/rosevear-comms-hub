import { useState } from 'react';
import './disabled-interface-preview.css';

const previewModules = [
  {
    title: 'Unified inbox',
    body: 'Brand-aware conversations for Rosie Dazzlers and Devil n Dove with contact, intake, and task context in one review surface.',
    status: 'Visible preview'
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

const implementationSteps = [
  'Keep this preview inside the existing app while the direction is reviewed.',
  'Prepare GitHub Pages only as a later static UI host; do not deploy in QL-069.',
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

function DisabledInterfacePreview() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <section className={isOpen ? 'interface-preview open' : 'interface-preview'} aria-label="Disabled interface preview">
      <button className="interface-preview-toggle" onClick={() => setIsOpen((value) => !value)} type="button">
        <span aria-hidden="true">▦</span>
        Interface preview
        <small>QL-069</small>
      </button>

      {isOpen && (
        <div className="interface-preview-panel" role="dialog" aria-modal="false" aria-label="QL-069 disabled interface implementation preview">
          <div className="interface-preview-header">
            <div>
              <p className="interface-preview-eyebrow">QL-069 disabled interface implementation plan</p>
              <h2>Quo-lite operator interface direction</h2>
              <p>
                This is a visible static preview of the direction: a combined communications dashboard with disabled Phone/SMS controls, brand context, customer timeline, and safe deployment boundaries.
              </p>
            </div>
            <button className="interface-preview-close" onClick={() => setIsOpen(false)} type="button" aria-label="Close interface preview">
              ×
            </button>
          </div>

          <div className="interface-preview-warning">
            Preview only. No GitHub Pages deployment, no provider connection, no callback route, no SMS, no calls, no recording, no AI send, no persistence writes, and no live pilot runtime are enabled.
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
                <span>GitHub Pages candidate</span>
                <small>Not deployed in QL-069</small>
              </div>
            </aside>

            <main className="interface-preview-workspace">
              <div className="interface-preview-topline">
                <div>
                  <p className="interface-preview-eyebrow">Operator queue</p>
                  <h3>Today’s communication cockpit</h3>
                </div>
                <span>Static / disabled</span>
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
              <h3>Interface regions planned</h3>
              <div className="interface-preview-pill-list">
                {interfaceRegions.map((region) => (
                  <span key={region}>{region}</span>
                ))}
              </div>
            </article>
            <article className="interface-preview-card">
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

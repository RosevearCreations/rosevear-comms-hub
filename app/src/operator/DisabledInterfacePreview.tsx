import { useState } from 'react';
import './disabled-interface-preview.css';

const targetPreviewUrl = 'https://rosevearcreations.github.io/rosevear-comms-hub/';
const viteBasePath = '/rosevear-comms-hub/';

const refinementModules = [
  {
    title: 'Public preview continuity',
    body: `Keep the GitHub Pages disabled preview reachable at ${targetPreviewUrl} with the ${viteBasePath} base path while refinements are planned.`,
    status: 'Keep live'
  },
  {
    title: 'Priority refinements',
    body: 'Plan the first visible improvements for layout clarity, brand switching, inbox cards, timeline wording, disabled action labels, help notes, and accessibility.',
    status: 'Plan'
  },
  {
    title: 'First safe interaction',
    body: 'Choose the first browser-safe interaction to build next without provider delivery, callbacks, live phone data, persistence writes, or live pilot runtime.',
    status: 'Select'
  },
  {
    title: 'Safety boundary',
    body: 'Provider credentials, callback tokens, service-role keys, live numbers, webhooks, message bodies, transcripts, recordings, and live customer records remain excluded from browser output.',
    status: 'Protected'
  }
];

const refinementPlanItems = [
  {
    label: 'Layout pass',
    plan: 'Reduce visual clutter, make the operator cockpit read top-to-bottom, and keep the brand/sidebar/workspace relationship obvious.'
  },
  {
    label: 'Brand context',
    plan: 'Make Rosie Dazzlers and Devil n Dove feel like two separate inboxes inside one shared Quo-lite console.'
  },
  {
    label: 'Inbox card clarity',
    plan: 'Refine the queue cards so the operator can see urgency, source, brand, customer context, and draft-only status at a glance.'
  },
  {
    label: 'Timeline clarity',
    plan: 'Improve the sample customer timeline so it shows inquiry, internal note, draft task, and locked SMS/call actions in a more realistic order.'
  },
  {
    label: 'Help system',
    plan: 'Add first-pass circled-i guidance near the brand switcher, queue, timeline, disabled controls, and public deployment status.'
  },
  {
    label: 'First interaction',
    plan: 'Prefer a browser-safe sample interaction such as brand switching, sample conversation selection, task filtering, or a local feedback checklist.'
  }
];

const refinementDecisionRules = [
  'QL-077 may plan refinements and update the static public preview wording only.',
  'QL-077 may not enable real provider connections, callbacks, SMS delivery, call runtime, recording, AI send, persistence writes, archive writes, retention writes, or live pilot behavior.',
  'The next implementation build should improve visible public-preview usability before adding any backend or provider runtime.',
  'Any future interactive surface must use synthetic sample data or browser-local state only until a later build explicitly proves a safe backend boundary.',
  'GitHub Pages remains the current public disabled preview host; Vercel and Cloudflare Pages remain out of scope.'
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
        <small>QL-077</small>
      </button>

      {isOpen && (
        <div className="interface-preview-panel" role="dialog" aria-modal="false" aria-label="QL-077 public disabled preview refinement plan">
          <div className="interface-preview-header">
            <div>
              <p className="interface-preview-eyebrow">QL-077 Public disabled preview refinement plan</p>
              <h2>Quo-lite public preview refinement plan</h2>
              <p>
                This build turns the feedback review into a prioritized refinement plan for the public disabled preview. It keeps the GitHub Pages preview active while planning safer layout, labels, help notes, brand context, and first browser-safe interactions.
              </p>
            </div>
            <button className="interface-preview-close" onClick={() => setIsOpen(false)} type="button" aria-label="Close interface preview">
              ×
            </button>
          </div>

          <div className="interface-preview-warning">
            Refinement plan only. The public preview may be live, but Phone/SMS providers, callbacks, live SMS, calls, recordings, AI send, persistence writes, live customer access, archive writes, retention writes, and live pilot runtime remain OFF.
          </div>

          <div className="interface-preview-review-grid">
            <article className="interface-preview-link-card">
              <p className="interface-preview-eyebrow">Public review URL</p>
              <h3>GitHub Pages disabled preview</h3>
              <code className="interface-preview-link">{targetPreviewUrl}</code>
              <p>
                QL-077 keeps this as the live public refinement target. Use it to review planned layout, labels, help notes, brand switching, inbox cards, and first safe interaction choices.
              </p>
            </article>
            <article className="interface-preview-card interface-preview-next-step">
              <p className="interface-preview-eyebrow">QL-077 decision</p>
              <h3>Plan refinement before implementation</h3>
              <p>
                The next work should improve the static public preview and select one browser-safe interaction. Real SMS, calls, provider callbacks, persistence writes, and live pilot behavior stay blocked.
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
                <span>Refinement plan</span>
                <small>Static Pages preview; live controls locked</small>
              </div>
            </aside>

            <main className="interface-preview-workspace">
              <div className="interface-preview-topline">
                <div>
                  <p className="interface-preview-eyebrow">Operator queue</p>
                  <h3>Today’s communication cockpit</h3>
                </div>
                <span>Static / disabled / refinement plan</span>
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
            {refinementModules.map((module) => (
              <article className="interface-preview-module" key={module.title}>
                <span>{module.status}</span>
                <h4>{module.title}</h4>
                <p>{module.body}</p>
              </article>
            ))}
          </div>

          <div className="interface-preview-columns">
            <article className="interface-preview-card interface-preview-wide-card">
              <h3>QL-077 refinement priorities</h3>
              <ol>
                {refinementPlanItems.map((item) => (
                  <li key={item.label}>
                    <strong>{item.label}:</strong> {item.plan}
                  </li>
                ))}
              </ol>
            </article>
            <article className="interface-preview-card interface-preview-wide-card">
              <h3>QL-077 decision rules</h3>
              <ol>
                {refinementDecisionRules.map((decision) => (
                  <li key={decision}>{decision}</li>
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

import { useState } from 'react';
import './disabled-interface-preview.css';

const targetPreviewUrl = 'https://rosevearcreations.github.io/rosevear-comms-hub/';
const viteBasePath = '/rosevear-comms-hub/';

const feedbackReviewModules = [
  {
    title: 'Public preview load review',
    body: `Confirm the GitHub Pages disabled preview remains reachable at ${targetPreviewUrl} after the QL-076 promotion and still uses the ${viteBasePath} base path.`,
    status: 'Review live URL'
  },
  {
    title: 'Feedback themes',
    body: 'Convert first-look notes into layout, navigation, labels, help-system, accessibility, brand-switching, inbox-card, and timeline improvements.',
    status: 'Triage'
  },
  {
    title: 'Next interactive surface',
    body: 'Identify the safest first interaction to build next without enabling provider delivery, callbacks, live phone data, persistence writes, or live pilot runtime.',
    status: 'Prioritize'
  },
  {
    title: 'Safety boundary',
    body: 'Provider credentials, callback tokens, service-role keys, live numbers, webhooks, message bodies, transcripts, recordings, and live customer records remain excluded from browser output.',
    status: 'Protected'
  }
];

const feedbackReviewFindings = [
  {
    label: 'Direction',
    prompt: 'Does the public preview clearly feel like a shared communication hub rather than a generic dashboard?'
  },
  {
    label: 'Brand switching',
    prompt: 'Can Rosie Dazzlers and Devil n Dove be understood as separate brand inboxes sharing one operator cockpit?'
  },
  {
    label: 'Operator flow',
    prompt: 'Are the queue, timeline, draft-only actions, and disabled controls understandable in one pass?'
  },
  {
    label: 'Locked controls',
    prompt: 'Is it obvious that Phone/SMS, provider setup, callbacks, recording, AI send, persistence, archive, retention, and live pilot runtime are off?'
  },
  {
    label: 'Help system',
    prompt: 'Where should the first circled-i help notes appear: brand switcher, queue, timeline, controls, status, or setup checklist?'
  },
  {
    label: 'First safe interaction',
    prompt: 'What should become clickable first: brand switcher, sample conversation, task filter, layout preference, feedback form, or setup checklist?'
  }
];

const feedbackReviewDecisions = [
  'Classify feedback as layout, label, navigation, help, accessibility, brand context, inbox clarity, timeline clarity, disabled-control clarity, or next-interaction readiness.',
  'Keep the public preview static until a later build deliberately introduces a browser-safe interactive surface.',
  'Treat any request for real SMS, live calls, callbacks, provider connection, recording, AI send, persistence writes, or live pilot behavior as out of scope for QL-076.',
  'Use QL-077 for prioritized public preview refinement planning before building more interaction.',
  'Keep the GitHub Pages preview deployable with the existing gated workflow and public-safe browser bundle.'
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
        <small>QL-076</small>
      </button>

      {isOpen && (
        <div className="interface-preview-panel" role="dialog" aria-modal="false" aria-label="QL-076 public disabled preview feedback review">
          <div className="interface-preview-header">
            <div>
              <p className="interface-preview-eyebrow">QL-076 Public disabled preview feedback review</p>
              <h2>Quo-lite public preview feedback review</h2>
              <p>
                This build reviews the feedback intake from the live public disabled preview and turns it into safe next-step priorities. It still does not enable provider callbacks, SMS, calls, AI send, persistence, archive, retention, or live pilot runtime.
              </p>
            </div>
            <button className="interface-preview-close" onClick={() => setIsOpen(false)} type="button" aria-label="Close interface preview">
              ×
            </button>
          </div>

          <div className="interface-preview-warning">
            Feedback review only. The public preview may be live, but Phone/SMS providers, callbacks, live SMS, calls, recordings, AI send, persistence writes, live customer access, archive writes, retention writes, and live pilot runtime remain OFF.
          </div>

          <div className="interface-preview-review-grid">
            <article className="interface-preview-link-card">
              <p className="interface-preview-eyebrow">Public review URL</p>
              <h3>GitHub Pages disabled preview</h3>
              <code className="interface-preview-link">{targetPreviewUrl}</code>
              <p>
                QL-076 keeps this as the live public feedback-review target. Use it to decide which labels, layouts, help notes, and first safe interactions should be refined next.
              </p>
            </article>
            <article className="interface-preview-card interface-preview-next-step">
              <p className="interface-preview-eyebrow">QL-076 decision</p>
              <h3>Review feedback before adding more interaction</h3>
              <p>
                The next work should improve the visible public preview and select a browser-safe first interaction, not enable provider callbacks, SMS, calls, AI sends, persistence writes, or live pilot behavior.
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
                <span>Feedback review</span>
                <small>Static Pages preview; live controls locked</small>
              </div>
            </aside>

            <main className="interface-preview-workspace">
              <div className="interface-preview-topline">
                <div>
                  <p className="interface-preview-eyebrow">Operator queue</p>
                  <h3>Today’s communication cockpit</h3>
                </div>
                <span>Static / disabled / feedback review</span>
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
            {feedbackReviewModules.map((module) => (
              <article className="interface-preview-module" key={module.title}>
                <span>{module.status}</span>
                <h4>{module.title}</h4>
                <p>{module.body}</p>
              </article>
            ))}
          </div>

          <div className="interface-preview-columns">
            <article className="interface-preview-card interface-preview-wide-card">
              <h3>QL-076 feedback review findings</h3>
              <ol>
                {feedbackReviewFindings.map((finding) => (
                  <li key={finding.label}>
                    <strong>{finding.label}:</strong> {finding.prompt}
                  </li>
                ))}
              </ol>
            </article>
            <article className="interface-preview-card interface-preview-wide-card">
              <h3>QL-076 decision rules</h3>
              <ol>
                {feedbackReviewDecisions.map((decision) => (
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

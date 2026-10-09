import { useState } from 'react';
import './disabled-operator-console.css';

const safetyLocks = [
  'Provider account connection: disabled',
  'Provider live-number attachment: disabled',
  'Provider callbacks and webhooks: disabled',
  'Live phone webhook runtime: disabled',
  'SMS sending and provider delivery: disabled',
  'Call recording and transcripts: disabled',
  'AI draft and AI auto-send: disabled',
  'Persistence writes and live customer reads/writes: disabled',
  'Archive writes and retention policy writes: disabled',
  'Live pilot runtime: disabled'
];

const readinessReviewSteps = [
  'Confirm QL-066 evidence closure is complete before reviewing post-closure readiness.',
  'Confirm the closed evidence set remains synthetic, redacted, review-only, closure-only, and unsafe to persist.',
  'Confirm no secret values, callback tokens, live phone numbers, message bodies, transcripts, recordings, or live customer data are present.',
  'Confirm the disabled console remains reachable, visible, reviewable, and fully blocked from the admin interface.',
  'Confirm rejected evidence categories remain rejected after closure.',
  'Confirm no Vercel, Cloudflare Pages, Supabase migration, provider account, callback route, webhook, or live number was introduced.',
  'Approve only the next disabled interface-pathway decision gate; do not approve live pilot activation.'
];

const readinessReviewItems = [
  {
    title: 'Closed evidence set readiness',
    body: 'Reviewed as synthetic/redacted closure proof only, with no secret values and no live customer data.',
    status: 'ready'
  },
  {
    title: 'Disabled console readiness',
    body: 'Reviewed as production-safe proof that the operator console remains reachable, visible, and fully disabled.',
    status: 'verified'
  },
  {
    title: 'Rejected evidence persistence',
    body: 'Reviewed with secrets, callback tokens, phone numbers, message bodies, transcripts, recordings, and live data still blocked.',
    status: 'blocked'
  },
  {
    title: 'Hosting boundary',
    body: 'Reviewed with no Vercel project, Cloudflare Pages project, provider runtime, callback route, or browser-held secret introduced.',
    status: 'unchanged'
  },
  {
    title: 'Runtime boundary',
    body: 'Reviewed with provider callbacks, webhooks, SMS, calls, recording, AI, persistence, archive, retention, and live-pilot runtime still off.',
    status: 'off'
  },
  {
    title: 'Production proof',
    body: 'Reviewed as CI/build proof only; no traffic, provider delivery, or runtime activation is allowed.',
    status: 'ci-only'
  }
];

const nonSecretVariableNames = [
  'PHONE_SMS_PROVIDER',
  'PHONE_SMS_PROVIDER_ACCOUNT_ID',
  'PHONE_SMS_PROVIDER_API_KEY',
  'PHONE_SMS_PROVIDER_API_SECRET',
  'PHONE_SMS_CALLBACK_BASE_URL',
  'PHONE_SMS_WEBHOOK_SIGNING_SECRET',
  'PHONE_SMS_LIVE_PILOT_ENABLED'
];

const readinessBlocks = [
  'No provider credential values may be reviewed as readiness proof.',
  'No live customer names, phone numbers, message bodies, transcripts, or recordings may be reviewed as readiness proof.',
  'No callback URL containing tokens or live routing paths may be reviewed as readiness proof.',
  'No enabled SMS, call, provider, persistence, archive, retention, or live-pilot control may be accepted.',
  'No Vercel, Cloudflare Pages, Supabase migration, provider account connection, callback route, webhook, or live number may be introduced by this review.'
];

const operatorNotes = [
  {
    title: 'Readiness result',
    body: 'QL-067 reviews the closed disabled-console evidence set without turning on any provider, webhook, messaging, recording, AI, persistence, archive, retention, hosting, or live-pilot runtime.'
  },
  {
    title: 'Interface status',
    body: 'The operator interface remains available as a disabled console inside the app. This build does not add Vercel, Cloudflare Pages, GitHub Pages deployment, provider runtime, or browser-held secrets.'
  },
  {
    title: 'Next safe stage',
    body: 'QL-068 should decide the disabled interface pathway before any actual hosting or runtime changes are introduced.'
  }
];

function DisabledOperatorConsole() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <section className={isOpen ? 'operator-console open' : 'operator-console'} aria-label="Phone and SMS disabled operator console">
      <button className="operator-console-toggle" onClick={() => setIsOpen((value) => !value)} type="button">
        <span aria-hidden="true">☎</span>
        Phone/SMS console
        <small>disabled</small>
      </button>

      {isOpen && (
        <div className="operator-console-panel" role="dialog" aria-modal="false" aria-label="Disabled phone and SMS operator console">
          <div className="operator-console-header">
            <div>
              <p className="eyebrow">QL-067 disabled operator console post-closure readiness review</p>
              <h2>Phone/SMS live-pilot post-closure readiness review</h2>
              <p>
                This interface reviews the QL-066 closed synthetic/redacted evidence set. It does not connect a provider, attach a live number, send SMS, record calls, inspect live customers, write persistence, add hosting, or start live runtime.
              </p>
            </div>
            <button className="operator-console-close" onClick={() => setIsOpen(false)} type="button" aria-label="Close disabled operator console">
              ×
            </button>
          </div>

          <div className="operator-console-status-grid">
            <article>
              <span>Stage</span>
              <strong>QL-067</strong>
              <small>Post-closure review only</small>
            </article>
            <article>
              <span>Runtime</span>
              <strong>OFF</strong>
              <small>No live pilot execution</small>
            </article>
            <article>
              <span>Provider delivery</span>
              <strong>OFF</strong>
              <small>No outbound traffic</small>
            </article>
            <article>
              <span>Readiness</span>
              <strong>Review</strong>
              <small>No hosting change</small>
            </article>
          </div>

          <div className="operator-console-callout">
            <strong>Post-closure readiness guardrail:</strong> review only synthetic/redacted disabled-console closure evidence. Keep secrets, live customer data, callback tokens, enabled buttons, persisted artifacts, hosting changes, and runtime proof rejected.
          </div>

          <div className="operator-console-grid">
            <article className="operator-console-card">
              <h3>Safety locks</h3>
              <ul>
                {safetyLocks.map((lock) => (
                  <li key={lock}>{lock}</li>
                ))}
              </ul>
            </article>

            <article className="operator-console-card">
              <h3>Manual readiness checklist</h3>
              <ol>
                {readinessReviewSteps.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ol>
            </article>
          </div>

          <article className="operator-console-card operator-console-evidence-section">
            <h3>QL-067 post-closure readiness review</h3>
            <div className="operator-console-evidence-list">
              {readinessReviewItems.map((item) => (
                <div className="operator-console-evidence-card" key={item.title}>
                  <span>{item.status}</span>
                  <h4>{item.title}</h4>
                  <p>{item.body}</p>
                </div>
              ))}
            </div>
          </article>

          <div className="operator-console-grid">
            <article className="operator-console-card">
              <h3>Variable names reviewed only</h3>
              <div className="operator-console-pill-list">
                {nonSecretVariableNames.map((name) => (
                  <code key={name}>{name}</code>
                ))}
              </div>
            </article>

            <article className="operator-console-card">
              <h3>Readiness blocks</h3>
              <ul>
                {readinessBlocks.map((block) => (
                  <li key={block}>{block}</li>
                ))}
              </ul>
            </article>
          </div>

          <div className="operator-console-grid three">
            {operatorNotes.map((note) => (
              <article className="operator-console-note" key={note.title}>
                <h4>{note.title}</h4>
                <p>{note.body}</p>
              </article>
            ))}
          </div>

          <div className="operator-console-disabled-actions" aria-label="Disabled future actions">
            <button type="button" disabled>
              Send SMS disabled
            </button>
            <button type="button" disabled>
              Call customer disabled
            </button>
            <button type="button" disabled>
              Connect provider disabled
            </button>
            <button type="button" disabled>
              Attach live number disabled
            </button>
            <button type="button" disabled>
              Add hosting disabled
            </button>
            <button type="button" disabled>
              Start live pilot disabled
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

export { DisabledOperatorConsole };

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

const closureSteps = [
  'Confirm QL-065 evidence review is present, complete, and accepted only for disabled evidence closure.',
  'Close only synthetic/redacted evidence labels; do not close any item that includes secret values, callback tokens, phone numbers, message bodies, transcripts, recordings, or live customer data.',
  'Confirm the disabled console remains reachable, visible, reviewable, and fully blocked from the admin interface.',
  'Confirm every rejected evidence category remains rejected and cannot be promoted into a persisted artifact.',
  'Confirm every future action button remains disabled in production.',
  'Confirm provider, runtime, persistence, archive, retention, and live-pilot paths remain disabled.',
  'Approve only the next disabled post-closure readiness review; do not approve live pilot activation.'
];

const closureGateItems = [
  {
    title: 'Reviewed evidence set',
    body: 'Closed as synthetic/redacted review material only, with no live customer data and no secret values.',
    status: 'closed'
  },
  {
    title: 'Console disabled proof',
    body: 'Closed as proof that the operator console remains reachable and fully disabled in production.',
    status: 'verified'
  },
  {
    title: 'Rejected evidence categories',
    body: 'Closed with secrets, callback tokens, phone numbers, message bodies, transcripts, recordings, and live data still rejected.',
    status: 'blocked'
  },
  {
    title: 'Disabled actions',
    body: 'Closed with SMS, calls, provider connection, live-number attachment, persistence, and live pilot controls disabled.',
    status: 'locked'
  },
  {
    title: 'Runtime boundary',
    body: 'Closed with provider callbacks, webhooks, AI, archive, retention, and runtime paths still off.',
    status: 'off'
  },
  {
    title: 'Production proof',
    body: 'Closed with production build evidence only; no traffic, provider delivery, or runtime activation is allowed.',
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

const closureBlocks = [
  'No provider credential values may be closed as evidence.',
  'No live customer names, phone numbers, message bodies, transcripts, or recordings may be closed as evidence.',
  'No callback URL containing tokens or live routing paths may be closed as evidence.',
  'No enabled SMS, call, provider, persistence, or live-pilot control may be accepted.',
  'No archive, retention, or persistence write may run from this closure gate.'
];

const operatorNotes = [
  {
    title: 'Closure result',
    body: 'QL-066 closes the reviewed disabled-console evidence set without turning on any provider, webhook, messaging, recording, AI, persistence, archive, or live-pilot runtime.'
  },
  {
    title: 'Interface status',
    body: 'The operator interface remains available as a disabled console inside the app. This build does not add Vercel, Cloudflare Pages, provider runtime, or browser-held secrets.'
  },
  {
    title: 'Next safe stage',
    body: 'QL-067 should perform a post-closure readiness review while preserving the disabled boundary unless a later explicit build changes it.'
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
              <p className="eyebrow">QL-066 disabled operator console evidence closure gate</p>
              <h2>Phone/SMS live-pilot evidence closure gate</h2>
              <p>
                This interface closes the QL-065 reviewed synthetic/redacted evidence set. It does not connect a provider, attach a live number, send SMS, record calls, inspect live customers, write persistence, or start live runtime.
              </p>
            </div>
            <button className="operator-console-close" onClick={() => setIsOpen(false)} type="button" aria-label="Close disabled operator console">
              ×
            </button>
          </div>

          <div className="operator-console-status-grid">
            <article>
              <span>Stage</span>
              <strong>QL-066</strong>
              <small>Evidence closure only</small>
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
              <span>Closure</span>
              <strong>Closed</strong>
              <small>Redacted proof only</small>
            </article>
          </div>

          <div className="operator-console-callout">
            <strong>Evidence closure guardrail:</strong> close only synthetic/redacted disabled-console evidence. Keep secrets, live customer data, callback tokens, enabled buttons, persisted artifacts, and runtime proof rejected.
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
              <h3>Manual closure checklist</h3>
              <ol>
                {closureSteps.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ol>
            </article>
          </div>

          <article className="operator-console-card operator-console-evidence-section">
            <h3>QL-066 evidence closure gate</h3>
            <div className="operator-console-evidence-list">
              {closureGateItems.map((item) => (
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
              <h3>Variable names closed only</h3>
              <div className="operator-console-pill-list">
                {nonSecretVariableNames.map((name) => (
                  <code key={name}>{name}</code>
                ))}
              </div>
            </article>

            <article className="operator-console-card">
              <h3>Closure blocks</h3>
              <ul>
                {closureBlocks.map((block) => (
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
              Persist closure disabled
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

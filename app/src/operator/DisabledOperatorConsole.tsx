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

const reviewSteps = [
  'Confirm QL-064 evidence intake is present and complete before approving review closure.',
  'Reject any item that contains secrets, credential values, callback tokens, phone numbers, message bodies, transcripts, recordings, or live customer data.',
  'Confirm the disabled console remains reachable, visible, reviewable, and fully blocked from the admin interface.',
  'Confirm variable handling remains name-only and guidance links contain no credentials or live callback targets.',
  'Confirm every future action button remains disabled in production.',
  'Confirm provider, runtime, persistence, archive, retention, and live-pilot paths remain disabled.',
  'Approve only the next disabled evidence closure gate; do not approve live pilot activation.'
];

const evidenceReviewItems = [
  {
    title: 'Console reachability evidence',
    body: 'Reviewed as synthetic/redacted proof that the console opens from the admin interface without enabling provider access.',
    status: 'reviewed'
  },
  {
    title: 'Disabled action state evidence',
    body: 'Reviewed as proof that SMS, call, provider connection, live-number, persistence, and live-pilot controls remain disabled.',
    status: 'accepted'
  },
  {
    title: 'Variable-name evidence',
    body: 'Reviewed as name-only inventory with no values, no secret material, and no callback tokens.',
    status: 'names-only'
  },
  {
    title: 'Guidance-link evidence',
    body: 'Reviewed as labels and routing notes only, with no provider credential links or live customer data.',
    status: 'redacted'
  },
  {
    title: 'Safety-lock evidence',
    body: 'Reviewed as proof that callbacks, webhooks, recording, AI, persistence, archive, retention, and runtime are off.',
    status: 'locked'
  },
  {
    title: 'Production proof evidence',
    body: 'Reviewed as build/status proof only; no runtime activation, live traffic, or provider delivery is allowed.',
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

const rejectedEvidenceExamples = [
  'Secret values or screenshots containing API keys',
  'Live customer names, phone numbers, message bodies, transcripts, or recordings',
  'Provider callback URLs containing tokens or live routing paths',
  'Any screenshot proving an enabled send/call/connect/live-pilot button',
  'Any persisted evidence artifact or archive-retention write'
];

const operatorNotes = [
  {
    title: 'Review result',
    body: 'QL-065 accepts only synthetic/redacted disabled-console evidence and moves the sequence toward a disabled evidence closure gate.'
  },
  {
    title: 'Interface status',
    body: 'The operator interface is present in the app, but this build does not add Vercel, Cloudflare Pages, provider runtime, or browser-held secrets.'
  },
  {
    title: 'Next safe stage',
    body: 'QL-066 should close the reviewed evidence set and keep live-pilot activation blocked unless a later explicit build changes the boundary.'
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
              <p className="eyebrow">QL-065 disabled operator console evidence review</p>
              <h2>Phone/SMS live-pilot evidence review</h2>
              <p>
                This interface reviews the QL-064 synthetic/redacted evidence intake. It does not connect a provider, attach a live number, send SMS, record calls, inspect live customers, write persistence, or start live runtime.
              </p>
            </div>
            <button className="operator-console-close" onClick={() => setIsOpen(false)} type="button" aria-label="Close disabled operator console">
              ×
            </button>
          </div>

          <div className="operator-console-status-grid">
            <article>
              <span>Stage</span>
              <strong>QL-065</strong>
              <small>Evidence review only</small>
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
              <span>Review</span>
              <strong>Safe</strong>
              <small>Redacted evidence only</small>
            </article>
          </div>

          <div className="operator-console-callout">
            <strong>Evidence review guardrail:</strong> approve only synthetic/redacted disabled-console evidence. Reject secrets, live data, provider callbacks, enabled buttons, persisted artifacts, and any runtime proof.
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
              <h3>Manual review checklist</h3>
              <ol>
                {reviewSteps.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ol>
            </article>
          </div>

          <article className="operator-console-card operator-console-evidence-section">
            <h3>QL-065 evidence review queue</h3>
            <div className="operator-console-evidence-list">
              {evidenceReviewItems.map((item) => (
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
              <h3>Rejected evidence examples</h3>
              <ul>
                {rejectedEvidenceExamples.map((example) => (
                  <li key={example}>{example}</li>
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
              Persist evidence disabled
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

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

const readinessSteps = [
  'Confirm QL-063 review remains GREEN on main before collecting evidence.',
  'Capture synthetic/redacted screenshots or notes only.',
  'List variable names only; never capture secret values.',
  'Record guidance-only service and application links with redacted labels.',
  'Confirm every future action button remains disabled.',
  'Confirm safety locks still block provider, runtime, persistence, and customer-data paths.',
  'Require owner review before any later evidence review or activation build.'
];

const evidenceIntakeItems = [
  {
    title: 'Console reachability',
    body: 'Record that the disabled console opens from the admin interface and remains review-only.',
    status: 'synthetic-redacted'
  },
  {
    title: 'Disabled action states',
    body: 'Record that SMS, call, provider connection, and live-number buttons are visible but disabled.',
    status: 'blocked'
  },
  {
    title: 'Variable-name inventory',
    body: 'Capture names such as PROVIDER_API_KEY and SMS_PROVIDER_ACCOUNT_ID without values.',
    status: 'names-only'
  },
  {
    title: 'Service links',
    body: 'Capture provider/admin/application links as guidance-only references with no credentials.',
    status: 'redacted'
  },
  {
    title: 'Safety locks',
    body: 'Record that callbacks, webhooks, recording, AI, persistence, archives, and runtime remain off.',
    status: 'locked'
  },
  {
    title: 'Operator notes',
    body: 'Capture only synthetic/redacted notes that are safe for review and not safe for persistence.',
    status: 'review-only'
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

const guidanceLinks = [
  'Rosevear Comms Hub admin app',
  'Provider dashboard placeholder',
  'Callback URL planning note',
  'STOP/START/HELP policy note',
  'Recording-notice policy note',
  'Rollback and kill-switch note'
];

const operatorNotes = [
  {
    title: 'What works in this console now',
    body: 'Operators can collect review evidence that the disabled console is reachable, visible, and safely blocked without connecting providers or sending messages.'
  },
  {
    title: 'What is intentionally blocked',
    body: 'No SMS send button, call button, provider callback URL, provider credential form, live phone number field, customer-data read/write, or persistence action is enabled in QL-064.'
  },
  {
    title: 'Next safe stage',
    body: 'QL-065 should review this synthetic/redacted evidence intake before any future live-pilot behavior is considered.'
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
              <p className="eyebrow">QL-064 disabled operator console evidence intake</p>
              <h2>Phone/SMS live-pilot evidence intake</h2>
              <p>
                This interface collects synthetic/redacted evidence for review only. It does not connect a provider, attach a live number, send SMS, record calls, inspect live customers, write persistence, or start live runtime.
              </p>
            </div>
            <button className="operator-console-close" onClick={() => setIsOpen(false)} type="button" aria-label="Close disabled operator console">
              ×
            </button>
          </div>

          <div className="operator-console-status-grid">
            <article>
              <span>Stage</span>
              <strong>QL-064</strong>
              <small>Evidence intake only</small>
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
              <span>Evidence</span>
              <strong>Redacted</strong>
              <small>Synthetic notes only</small>
            </article>
          </div>

          <div className="operator-console-callout">
            <strong>Evidence intake guardrail:</strong> collect labels, screenshots, and notes only when they are synthetic, redacted, review-only, and unsafe to persist.
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
              <h3>Manual evidence checklist</h3>
              <ol>
                {readinessSteps.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ol>
            </article>
          </div>

          <article className="operator-console-card operator-console-evidence-section">
            <h3>QL-064 evidence intake queue</h3>
            <div className="operator-console-evidence-list">
              {evidenceIntakeItems.map((item) => (
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
              <h3>Variable names only</h3>
              <div className="operator-console-pill-list">
                {nonSecretVariableNames.map((name) => (
                  <code key={name}>{name}</code>
                ))}
              </div>
            </article>

            <article className="operator-console-card">
              <h3>Guidance-only links</h3>
              <ul>
                {guidanceLinks.map((link) => (
                  <li key={link}>{link}</li>
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

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
  'Confirm QL-061 plan review remains GREEN on main.',
  'Review provider choice and keep provider credentials out of the app.',
  'Prepare variable names only; do not enter real secrets here.',
  'Prepare service and application links with redacted labels.',
  'Confirm STOP/START/HELP and recording-notice policies before any future live step.',
  'Confirm rollback, kill switch, rate limits, and replay controls.',
  'Confirm operator review and owner approval before any later activation build.'
];

const operatorNotes = [
  {
    title: 'What works in this console now',
    body: 'Operators can review readiness, safety locks, manual activation steps, and future evidence requirements without connecting providers or sending messages.'
  },
  {
    title: 'What is intentionally blocked',
    body: 'No SMS send button, call button, provider callback URL, provider credential form, live phone number field, or customer-data persistence action is enabled in QL-062.'
  },
  {
    title: 'Next safe stage',
    body: 'QL-063 should review this disabled console scaffold before any runtime or provider-adjacent implementation is considered.'
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
              <p className="eyebrow">QL-062 disabled operator console</p>
              <h2>Phone/SMS live-pilot readiness</h2>
              <p>
                This is the first phone/SMS-specific interface. It is interactive for review only and does not connect a provider, attach a live number, send SMS, record calls, or write live customer data.
              </p>
            </div>
            <button className="operator-console-close" onClick={() => setIsOpen(false)} type="button" aria-label="Close disabled operator console">
              ×
            </button>
          </div>

          <div className="operator-console-status-grid">
            <article>
              <span>Stage</span>
              <strong>QL-062</strong>
              <small>Disabled scaffold only</small>
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
                {readinessSteps.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ol>
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
          </div>
        </div>
      )}
    </section>
  );
}

export { DisabledOperatorConsole };

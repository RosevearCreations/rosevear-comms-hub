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
  'Hosting deployment: not added by this gate',
  'Live pilot runtime: disabled'
];

const pathwayDecisionSteps = [
  'Confirm QL-067 post-closure readiness is complete before deciding an interface pathway.',
  'Compare no-hosting, GitHub Pages, Supabase Edge Functions, Vercel, and Cloudflare Pages as decision options only.',
  'Reject Vercel and Cloudflare Pages for this rough-sketch phase because the account limits are already constrained.',
  'Select GitHub Pages only as a future disabled static interface candidate, not as an enabled deployment in this build.',
  'Require Supabase Edge Functions later for any provider secrets, webhook verification, callback handling, or service-role work.',
  'Confirm browser code may hold only public Supabase URL and anon key when a later deployment build exists.',
  'Approve only a later disabled interface implementation plan; do not deploy hosting, add migrations, or activate live pilot runtime.'
];

const pathwayOptions = [
  {
    title: 'Current repo app',
    body: 'Kept as the present disabled console surface. No hosting change is introduced by QL-068.',
    status: 'unchanged'
  },
  {
    title: 'GitHub Pages candidate',
    body: 'Selected only as a future static disabled interface path because it avoids new Vercel or Cloudflare usage.',
    status: 'candidate'
  },
  {
    title: 'Supabase backend boundary',
    body: 'Reserved for future Edge Function secrets, provider webhooks, callback verification, and service-role work only.',
    status: 'backend-only'
  },
  {
    title: 'Vercel option',
    body: 'Rejected for this rough-sketch stage because no new Vercel project or quota pressure should be added.',
    status: 'rejected'
  },
  {
    title: 'Cloudflare Pages option',
    body: 'Rejected for this rough-sketch stage because existing Cloudflare Pages limits must not be expanded.',
    status: 'rejected'
  },
  {
    title: 'Live runtime option',
    body: 'Rejected. No provider callback, SMS, call, recording, AI, persistence, archive, retention, or live pilot path is enabled.',
    status: 'blocked'
  }
];

const nonSecretBrowserVariables = [
  'VITE_SUPABASE_URL',
  'VITE_SUPABASE_ANON_KEY'
];

const serverOnlySecretNames = [
  'SUPABASE_SERVICE_ROLE_KEY',
  'PHONE_SMS_PROVIDER_API_KEY',
  'PHONE_SMS_PROVIDER_API_SECRET',
  'PHONE_SMS_WEBHOOK_SIGNING_SECRET',
  'TWILIO_AUTH_TOKEN',
  'TELNYX_API_KEY'
];

const decisionBlocks = [
  'No GitHub Pages deployment workflow may be added by QL-068.',
  'No Vercel or Cloudflare Pages project may be created by QL-068.',
  'No Supabase migration may be added by QL-068.',
  'No service-role key, provider credential, callback token, phone number, transcript, recording, message body, or live customer data may enter browser code.',
  'No enabled provider callback, SMS, call, persistence, archive, retention, or live-pilot runtime path may be accepted.'
];

const operatorNotes = [
  {
    title: 'Decision result',
    body: 'QL-068 chooses the future disabled interface direction only: GitHub Pages static UI can be planned later, with Supabase reserved for safe backend boundaries.'
  },
  {
    title: 'No deployment yet',
    body: 'This build does not add GitHub Pages, Vercel, Cloudflare Pages, Supabase migrations, provider runtime, callbacks, or browser-held secrets.'
  },
  {
    title: 'Next safe stage',
    body: 'QL-069 should produce a disabled interface implementation plan before any actual hosting workflow or runtime capability is introduced.'
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
              <p className="eyebrow">QL-068 disabled interface pathway decision gate</p>
              <h2>Phone/SMS disabled interface pathway decision</h2>
              <p>
                This gate decides the next disabled interface pathway only. It does not deploy GitHub Pages, add Vercel or Cloudflare Pages, create Supabase migrations, connect a provider, attach a live number, send SMS, record calls, inspect live customers, write persistence, or start live runtime.
              </p>
            </div>
            <button className="operator-console-close" onClick={() => setIsOpen(false)} type="button" aria-label="Close disabled operator console">
              ×
            </button>
          </div>

          <div className="operator-console-status-grid">
            <article>
              <span>Stage</span>
              <strong>QL-068</strong>
              <small>Decision gate only</small>
            </article>
            <article>
              <span>Runtime</span>
              <strong>OFF</strong>
              <small>No live pilot execution</small>
            </article>
            <article>
              <span>Hosting</span>
              <strong>Not deployed</strong>
              <small>Future path only</small>
            </article>
            <article>
              <span>Pathway</span>
              <strong>GitHub Pages candidate</strong>
              <small>Static disabled UI later</small>
            </article>
          </div>

          <div className="operator-console-callout">
            <strong>Interface pathway guardrail:</strong> QL-068 may choose a future disabled interface path, but it cannot deploy hosting, expose secrets, add runtime callbacks, persist data, or enable live phone/SMS behavior.
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
              <h3>Decision checklist</h3>
              <ol>
                {pathwayDecisionSteps.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ol>
            </article>
          </div>

          <article className="operator-console-card operator-console-evidence-section">
            <h3>QL-068 pathway decision options</h3>
            <div className="operator-console-evidence-list">
              {pathwayOptions.map((item) => (
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
              <h3>Browser-safe variable names later</h3>
              <div className="operator-console-pill-list">
                {nonSecretBrowserVariables.map((name) => (
                  <code key={name}>{name}</code>
                ))}
              </div>
            </article>

            <article className="operator-console-card">
              <h3>Server-only secret names</h3>
              <div className="operator-console-pill-list">
                {serverOnlySecretNames.map((name) => (
                  <code key={name}>{name}</code>
                ))}
              </div>
            </article>
          </div>

          <article className="operator-console-card">
            <h3>Decision blocks</h3>
            <ul>
              {decisionBlocks.map((block) => (
                <li key={block}>{block}</li>
              ))}
            </ul>
          </article>

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
              Deploy GitHub Pages disabled
            </button>
            <button type="button" disabled>
              Add Supabase function disabled
            </button>
            <button type="button" disabled>
              Connect provider disabled
            </button>
            <button type="button" disabled>
              Attach live number disabled
            </button>
            <button type="button" disabled>
              Send SMS disabled
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

import { useState } from 'react';
import './disabled-interface-preview.css';

type PreviewBrandId = 'rosie' | 'devil';
type DetailTabId = 'overview' | 'draft' | 'timeline' | 'safety';

type SyntheticConversation = {
  id: string;
  title: string;
  status: string;
  summary: string;
  draft: string;
  timeline: Array<{ title: string; detail: string; locked?: boolean }>;
};

type PreviewBrand = {
  name: string;
  context: string;
  count: string;
  headline: string;
  conversations: SyntheticConversation[];
};

const targetPreviewUrl = 'https://rosevearcreations.github.io/rosevear-comms-hub/';
const cloudflareWorkerTarget = 'Connected Cloudflare Worker project for devilndovelive@gmail.com';
const cloudflareWorkerCheck = 'Workers Builds: rosevear-comms-hub';
const supabaseProjectUrl = 'https://gxujcwpktaickcgzyvnu.supabase.co';
const supabaseIntegrationTarget = 'Repository RosevearCreations/rosevear-comms-hub · working directory . · production branch main';
const brandOrder: PreviewBrandId[] = ['rosie', 'devil'];

const brandSamples: Record<PreviewBrandId, PreviewBrand> = {
  rosie: {
    name: 'Rosie Dazzlers',
    context: 'Mobile detailing',
    count: '4 planned reads',
    headline: 'Rosie Dazzlers communication cockpit',
    conversations: [
      {
        id: 'rosie-ceramic-quote',
        title: 'Ceramic quote follow-up',
        status: 'Read-only plan',
        summary: 'Synthetic ceramic coating follow-up that may later be hydrated from a public read-only Supabase sample source.',
        draft: 'Draft-only sample: confirm vehicle size, explain prep expectations, and offer a weather-safe booking window.',
        timeline: [
          { title: 'Synthetic inquiry remains local', detail: 'QL-089 still loads hard-coded samples only; no Supabase client is instantiated.' },
          { title: 'Safe future source planned', detail: 'Future reads are limited to public synthetic view/function outputs, never live customer records.' },
          { title: 'Runtime stays locked', detail: 'No SMS, call, provider, archive, retention, or write action is available.', locked: true }
        ]
      },
      {
        id: 'rosie-missed-call',
        title: 'Missed-call callback sample',
        status: 'Read-only plan',
        summary: 'Synthetic missed-call card that defines fallback copy for when Supabase env values or read access are unavailable.',
        draft: 'Draft-only sample: acknowledge the missed call, ask for vehicle size, and suggest AM/PM availability.',
        timeline: [
          { title: 'Sample selected', detail: 'No phone provider event, call log, or customer phone data is loaded.' },
          { title: 'Fallback planned', detail: 'Missing env variables or failed reads must fall back to hard-coded samples and visible disabled-state messaging.' },
          { title: 'Call action locked', detail: 'The public preview cannot place calls or register callbacks.', locked: true }
        ]
      }
    ]
  },
  devil: {
    name: 'Devil n Dove',
    context: 'Maker shop',
    count: '2 planned reads',
    headline: 'Devil n Dove communication cockpit',
    conversations: [
      {
        id: 'devil-custom-order',
        title: 'Custom order clarification sample',
        status: 'Read-only plan',
        summary: 'Synthetic custom-order question planned for safe public read-only sample hydration after QL-089.',
        draft: 'Draft-only sample: confirm colour, size, personalization limits, and expected making time.',
        timeline: [
          { title: 'Custom request remains synthetic', detail: 'Hard-coded maker-shop sample opens in the browser preview.' },
          { title: 'Read-only contract planned', detail: 'Future Supabase access is restricted to public synthetic sample outputs only.' },
          { title: 'Provider delivery locked', detail: 'No Etsy, SMS, email, callback, or provider account is connected.', locked: true }
        ]
      },
      {
        id: 'devil-maker-story',
        title: 'Maker story question sample',
        status: 'Read-only plan',
        summary: 'Synthetic shopper asks about the Devil n Dove meaning and materials; QL-089 defines how it may be safely read later.',
        draft: 'Draft-only sample: explain the Devil barriers / Dove hope theme and invite a specific product question.',
        timeline: [
          { title: 'Story sample selected', detail: 'Synthetic brand-story prompt is loaded from local constants.' },
          { title: 'Read-only boundary planned', detail: 'Only public anon-key safe sample reads are eligible for future implementation.' },
          { title: 'AI and send locked', detail: 'No AI reply generation or provider send path is enabled.', locked: true }
        ]
      }
    ]
  }
};

const detailTabs: Array<{ id: DetailTabId; title: string; detail: string }> = [
  { id: 'overview', title: 'Overview', detail: 'Selected summary, status, and QL-089 planning outcome.' },
  { id: 'draft', title: 'Draft', detail: 'Draft-only response copy with no send or AI generation.' },
  { id: 'timeline', title: 'Timeline', detail: 'Synthetic timeline events grouped into a focused local view.' },
  { id: 'safety', title: 'Safety', detail: 'Supabase read-only limits, fallbacks, and locked runtime reminders.' }
];

const plannedReadOnlySources = [
  'public.ql_public_synthetic_conversations view or RPC output containing only synthetic sample rows',
  'public.ql_public_system_status view or ql-status function output with non-secret project readiness data',
  'No public reads from contacts, conversations, messages, phone_calls, sms_messages, consent_logs, app_admins, audit_events, archives, or retention tables',
  'Anon-key reads only after RLS and explicit public-safe policies are reviewed in a later build'
];

const fallbackPlan = [
  'If VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY is missing, keep hard-coded samples and show a disabled Supabase badge.',
  'If a read request fails, keep hard-coded samples and show a non-blocking read-only unavailable message.',
  'If a read returns unexpected columns or real-customer-like content, reject it and keep the local samples.',
  'Never auto-send, auto-draft from AI, persist, archive, retain, or mutate data from the browser preview.'
];

const readinessChecks = [
  'QL-089 plans browser-safe Supabase reads but does not instantiate a Supabase client yet.',
  'Allowed future reads must use public anon-key boundaries and synthetic-only view/function outputs.',
  'Environment-variable and failed-read fallbacks must preserve the existing hard-coded local preview.',
  'QL-090 may scaffold the read-only client only after this plan, RLS boundaries, and fallback rules are accepted.'
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

function HelpMarker({ label }: { label: string }) {
  return (
    <span className="interface-preview-help" title={label} aria-label={`Help: ${label}`}>
      i
    </span>
  );
}

function renderDetailTabContent(activeTabId: DetailTabId, activeBrand: PreviewBrand, activeConversation: SyntheticConversation) {
  if (activeTabId === 'draft') {
    return (
      <div className="interface-preview-tab-body draft">
        <p className="interface-preview-eyebrow">Draft-only reply</p>
        <h4>{activeConversation.title}</h4>
        <p>{activeConversation.draft}</p>
        <div className="interface-preview-tab-note locked">QL-089: this remains staged copy only. No Supabase read, AI generation, or send action runs.</div>
      </div>
    );
  }

  if (activeTabId === 'timeline') {
    return (
      <div className="interface-preview-tab-body timeline">
        <p className="interface-preview-eyebrow">Synthetic timeline</p>
        <h4>{activeConversation.title}</h4>
        <ol>
          {activeConversation.timeline.map((event) => (
            <li className={event.locked ? 'locked-step' : ''} key={event.title}>
              <strong>{event.title}</strong>
              <span>{event.detail}</span>
            </li>
          ))}
        </ol>
      </div>
    );
  }

  if (activeTabId === 'safety') {
    return (
      <div className="interface-preview-tab-body safety">
        <p className="interface-preview-eyebrow">Safety and read-only planning</p>
        <h4>Runtime remains controlled</h4>
        <ul className="interface-preview-check-list">
          <li>Selected brand: {activeBrand.name}; selected sample: {activeConversation.title}.</li>
          <li>Supabase target remains {supabaseProjectUrl}, but QL-089 does not instantiate a browser client.</li>
          <li>Cloudflare target: {cloudflareWorkerTarget}; expected check: {cloudflareWorkerCheck}.</li>
          <li>Phone/SMS providers, recordings, live customer records, archive writes, retention writes, and live pilot runtime remain locked.</li>
        </ul>
      </div>
    );
  }

  return (
    <div className="interface-preview-tab-body overview">
      <p className="interface-preview-eyebrow">QL-089 read-only plan outcome</p>
      <h4>{activeConversation.title}</h4>
      <p>{activeConversation.summary}</p>
      <dl className="interface-preview-tab-facts">
        <div>
          <dt>Status</dt>
          <dd>{activeConversation.status}</dd>
        </div>
        <div>
          <dt>Brand</dt>
          <dd>{activeBrand.name}</dd>
        </div>
        <div>
          <dt>Current source</dt>
          <dd>Hard-coded synthetic sample only</dd>
        </div>
      </dl>
    </div>
  );
}

export function DisabledInterfacePreview() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeBrandId, setActiveBrandId] = useState<PreviewBrandId>('rosie');
  const [activeDetailTabId, setActiveDetailTabId] = useState<DetailTabId>('overview');
  const [activeConversationByBrand, setActiveConversationByBrand] = useState<Record<PreviewBrandId, string>>({
    rosie: 'rosie-ceramic-quote',
    devil: 'devil-custom-order'
  });

  const activeBrand = brandSamples[activeBrandId];
  const activeConversation = activeBrand.conversations.find((conversation) => conversation.id === activeConversationByBrand[activeBrandId]) ?? activeBrand.conversations[0];

  return (
    <section className={isOpen ? 'interface-preview open' : 'interface-preview'} aria-label="Disabled interface preview">
      <button className="interface-preview-toggle" onClick={() => setIsOpen((value) => !value)} type="button">
        <span aria-hidden="true">▦</span>
        Interface preview
        <small>QL-089</small>
      </button>

      {isOpen && (
        <div className="interface-preview-panel" role="dialog" aria-modal="false" aria-label="QL-089 public disabled preview browser-safe Supabase read-only client plan">
          <div className="interface-preview-header">
            <div>
              <p className="interface-preview-eyebrow">QL-089 Public disabled preview browser-safe Supabase read-only client plan</p>
              <h2>Supabase read-only client plan</h2>
              <p>
                This build plans a future browser-safe Supabase read-only client while keeping the current public preview local, synthetic, and non-mutating.
              </p>
            </div>
            <button className="interface-preview-close" onClick={() => setIsOpen(false)} type="button" aria-label="Close interface preview">
              ×
            </button>
          </div>

          <div className="interface-preview-warning">
            QL-089 is a planning build only. It does not add a Supabase client, anon key use, database reads, writes, SMS, calls, provider callbacks, recordings, AI send, archives, retention writes, live customer access, or live pilot runtime.
          </div>

          <div className="interface-preview-review-grid">
            <article className="interface-preview-link-card">
              <p className="interface-preview-eyebrow">GitHub Pages production preview</p>
              <h3>Current public preview</h3>
              <code className="interface-preview-link">{targetPreviewUrl}</code>
              <p>The public preview remains hard-coded and synthetic until QL-090 is explicitly approved.</p>
            </article>
            <article className="interface-preview-link-card">
              <p className="interface-preview-eyebrow">Supabase future target</p>
              <h3>Read-only planning target</h3>
              <code className="interface-preview-link">{supabaseProjectUrl}</code>
              <p>{supabaseIntegrationTarget}. Future browser reads must use anon-key-safe synthetic outputs only.</p>
            </article>
          </div>

          <div className="interface-preview-shell refined" aria-label="Static operator dashboard mockup">
            <aside className="interface-preview-sidebar">
              <div className="interface-preview-section-title">
                <p className="interface-preview-eyebrow">Brand switcher</p>
                <HelpMarker label="Brand switcher remains local state only" />
              </div>
              {brandOrder.map((brandId) => {
                const brand = brandSamples[brandId];
                const isActive = brandId === activeBrandId;
                return (
                  <button
                    type="button"
                    className={isActive ? 'interface-preview-brand active interactive' : 'interface-preview-brand interactive'}
                    aria-pressed={isActive}
                    onClick={() => setActiveBrandId(brandId)}
                    key={brand.name}
                  >
                    <span>{brand.name}</span>
                    <small>{brand.context} · {brand.count}</small>
                    <em>Read-only plan only</em>
                  </button>
                );
              })}
              <div className="interface-preview-safe-card">
                <strong>Active sample</strong>
                <span>{activeConversation.title}</span>
                <small>Hard-coded sample; no Supabase read yet</small>
              </div>
            </aside>

            <main className="interface-preview-workspace">
              <div className="interface-preview-topline">
                <div>
                  <p className="interface-preview-eyebrow">Browser-safe read-only planning</p>
                  <h3>{activeBrand.headline}</h3>
                </div>
                <span>Planning only / anon-key boundary / synthetic reads / live comms locked</span>
              </div>

              <section className="interface-preview-card">
                <div className="interface-preview-section-title">
                  <p className="interface-preview-eyebrow">Synthetic conversation selector</p>
                  <HelpMarker label="Conversation selector remains hard-coded and browser-local" />
                </div>
                <div className="interface-preview-selector-list">
                  {activeBrand.conversations.map((conversation) => {
                    const isSelected = conversation.id === activeConversation.id;
                    return (
                      <button
                        type="button"
                        className={isSelected ? 'interface-preview-selector active' : 'interface-preview-selector'}
                        aria-pressed={isSelected}
                        onClick={() => setActiveConversationByBrand((current) => ({ ...current, [activeBrandId]: conversation.id }))}
                        key={conversation.id}
                      >
                        <span>{conversation.title}</span>
                        <small>{conversation.status}</small>
                      </button>
                    );
                  })}
                </div>
              </section>

              <section className="interface-preview-card interface-preview-tabs-card">
                <div className="interface-preview-section-title">
                  <p className="interface-preview-eyebrow">Reviewed detail tabs</p>
                  <HelpMarker label="Tabs switch local React state only" />
                </div>
                <div className="interface-preview-tab-list" role="tablist" aria-label="Synthetic conversation detail tabs">
                  {detailTabs.map((tab) => {
                    const isSelected = tab.id === activeDetailTabId;
                    return (
                      <button
                        className={isSelected ? 'interface-preview-tab active' : 'interface-preview-tab'}
                        type="button"
                        role="tab"
                        aria-selected={isSelected}
                        onClick={() => setActiveDetailTabId(tab.id)}
                        key={tab.id}
                      >
                        <span>{tab.title}</span>
                        <small>{tab.detail}</small>
                      </button>
                    );
                  })}
                </div>
                <div className="interface-preview-tab-panel" role="tabpanel">
                  {renderDetailTabContent(activeDetailTabId, activeBrand, activeConversation)}
                </div>
              </section>

              <section className="interface-preview-card">
                <div className="interface-preview-section-title">
                  <p className="interface-preview-eyebrow">Allowed future read sources</p>
                  <HelpMarker label="QL-089 plans future reads but does not perform them" />
                </div>
                <ul className="interface-preview-check-list">
                  {plannedReadOnlySources.map((source) => (
                    <li key={source}>{source}</li>
                  ))}
                </ul>
              </section>

              <section className="interface-preview-card">
                <div className="interface-preview-section-title">
                  <p className="interface-preview-eyebrow">Fallback rules</p>
                  <HelpMarker label="Fallbacks protect the public preview from unsafe data exposure" />
                </div>
                <ul className="interface-preview-check-list">
                  {fallbackPlan.map((rule) => (
                    <li key={rule}>{rule}</li>
                  ))}
                </ul>
              </section>

              <section className="interface-preview-card">
                <div className="interface-preview-section-title">
                  <p className="interface-preview-eyebrow">Planning checks</p>
                  <HelpMarker label="QL-089 must be green before QL-090 scaffold work" />
                </div>
                <ul className="interface-preview-check-list">
                  {readinessChecks.map((check) => (
                    <li key={check}>{check}</li>
                  ))}
                </ul>
              </section>

              <div className="interface-preview-actions" aria-label="Locked live actions">
                {disabledActions.map((action) => (
                  <button disabled type="button" key={action}>
                    {action} locked
                  </button>
                ))}
              </div>
            </main>
          </div>
        </div>
      )}
    </section>
  );
}

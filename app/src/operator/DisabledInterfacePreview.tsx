import { useMemo, useState } from 'react';
import {
  allowedReadOnlySources,
  blockedBrowserSources,
  getSupabaseReadOnlyClientState,
  readOnlyFallbackRules
} from '../integrations/supabaseReadOnlyClient';
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
const brandOrder: PreviewBrandId[] = ['rosie', 'devil'];

const brandSamples: Record<PreviewBrandId, PreviewBrand> = {
  rosie: {
    name: 'Rosie Dazzlers',
    context: 'Mobile detailing',
    count: '4 scaffold reads',
    headline: 'Rosie Dazzlers communication cockpit',
    conversations: [
      {
        id: 'rosie-ceramic-quote',
        title: 'Ceramic quote follow-up',
        status: 'Read-only scaffolded',
        summary: 'Synthetic ceramic coating follow-up that can now be represented by a guarded read-only Supabase scaffold.',
        draft: 'Draft-only sample: confirm vehicle size, explain prep expectations, and offer a weather-safe booking window.',
        timeline: [
          { title: 'Synthetic sample remains available', detail: 'The local hard-coded sample stays as the fallback source.' },
          { title: 'Read-only scaffold added', detail: 'QL-090 can create an anon-key client only when env values, project URL, and the read-enable flag are correct.' },
          { title: 'Runtime stays locked', detail: 'No SMS, call, provider, archive, retention, or write action is available.', locked: true }
        ]
      },
      {
        id: 'rosie-missed-call',
        title: 'Missed-call callback sample',
        status: 'Read-only scaffolded',
        summary: 'Synthetic missed-call card with safe fallbacks when Supabase env values, view access, or payload validation fail.',
        draft: 'Draft-only sample: acknowledge the missed call, ask for vehicle size, and suggest AM/PM availability.',
        timeline: [
          { title: 'Sample selected', detail: 'No phone provider event, call log, or customer phone data is loaded.' },
          { title: 'Fallback enforced', detail: 'Missing env variables or failed reads keep hard-coded samples visible.' },
          { title: 'Call action locked', detail: 'The public preview cannot place calls or register callbacks.', locked: true }
        ]
      }
    ]
  },
  devil: {
    name: 'Devil n Dove',
    context: 'Maker shop',
    count: '2 scaffold reads',
    headline: 'Devil n Dove communication cockpit',
    conversations: [
      {
        id: 'devil-custom-order',
        title: 'Custom order clarification sample',
        status: 'Read-only scaffolded',
        summary: 'Synthetic custom-order question limited to public read-only sample views in the QL-090 scaffold.',
        draft: 'Draft-only sample: confirm colour, size, personalization limits, and expected making time.',
        timeline: [
          { title: 'Custom request remains synthetic', detail: 'Hard-coded maker-shop sample opens in the browser preview.' },
          { title: 'Read-only view boundary added', detail: 'Future reads are restricted to public synthetic views only.' },
          { title: 'Provider delivery locked', detail: 'No Etsy, SMS, email, callback, or provider account is connected.', locked: true }
        ]
      },
      {
        id: 'devil-maker-story',
        title: 'Maker story question sample',
        status: 'Read-only scaffolded',
        summary: 'Synthetic shopper asks about the Devil n Dove meaning and materials; QL-090 keeps it safe through public synthetic-only reads.',
        draft: 'Draft-only sample: explain the Devil barriers / Dove hope theme and invite a specific product question.',
        timeline: [
          { title: 'Story sample selected', detail: 'Synthetic brand-story prompt is loaded from local constants.' },
          { title: 'Client gate checked', detail: 'The scaffold refuses unexpected Supabase project URLs and missing read-enable flags.' },
          { title: 'AI and send locked', detail: 'No AI reply generation or provider send path is enabled.', locked: true }
        ]
      }
    ]
  }
};

const detailTabs: Array<{ id: DetailTabId; title: string; detail: string }> = [
  { id: 'overview', title: 'Overview', detail: 'Selected summary, status, and QL-090 scaffold outcome.' },
  { id: 'draft', title: 'Draft', detail: 'Draft-only response copy with no send or AI generation.' },
  { id: 'timeline', title: 'Timeline', detail: 'Synthetic timeline events grouped into a focused local view.' },
  { id: 'safety', title: 'Safety', detail: 'Read-only client gate, fallbacks, and locked runtime reminders.' }
];

const scaffoldChecks = [
  'Supabase wrapper can only create an anon-key client for the expected rosevearcreations Supabase project.',
  'Browser reads require VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, and VITE_QL_ENABLE_SUPABASE_READS=true.',
  'Read functions are limited to public.ql_public_synthetic_conversations and public.ql_public_system_status.',
  'Hard-coded local samples remain the fallback whenever env, project, policy, or payload checks fail.'
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

function formatStatus(value: string): string {
  return value.replaceAll('_', ' ').toUpperCase();
}

function renderDetailTabContent(activeTabId: DetailTabId, activeBrand: PreviewBrand, activeConversation: SyntheticConversation) {
  if (activeTabId === 'draft') {
    return (
      <div className="interface-preview-tab-body draft">
        <p className="interface-preview-eyebrow">Draft-only reply</p>
        <h4>{activeConversation.title}</h4>
        <p>{activeConversation.draft}</p>
        <div className="interface-preview-tab-note locked">QL-090: this remains staged copy only. No send, AI generation, mutation, archive, or retention path runs.</div>
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
        <p className="interface-preview-eyebrow">Safety and read-only scaffold</p>
        <h4>Runtime remains controlled</h4>
        <ul className="interface-preview-check-list">
          <li>Selected brand: {activeBrand.name}; selected sample: {activeConversation.title}.</li>
          <li>Supabase target remains {supabaseProjectUrl}; unexpected browser project URLs are blocked.</li>
          <li>Cloudflare target: {cloudflareWorkerTarget}; expected check: {cloudflareWorkerCheck}.</li>
          <li>Phone/SMS providers, recordings, live customer records, archive writes, retention writes, and live pilot runtime remain locked.</li>
        </ul>
      </div>
    );
  }

  return (
    <div className="interface-preview-tab-body overview">
      <p className="interface-preview-eyebrow">QL-090 read-only scaffold outcome</p>
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
          <dt>Current UI source</dt>
          <dd>Hard-coded synthetic fallback sample</dd>
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
  const supabaseReadOnlyState = useMemo(() => getSupabaseReadOnlyClientState(), []);

  const activeBrand = brandSamples[activeBrandId];
  const activeConversation = activeBrand.conversations.find((conversation) => conversation.id === activeConversationByBrand[activeBrandId]) ?? activeBrand.conversations[0];

  return (
    <section className={isOpen ? 'interface-preview open' : 'interface-preview'} aria-label="Disabled interface preview">
      <button className="interface-preview-toggle" onClick={() => setIsOpen((value) => !value)} type="button">
        <span aria-hidden="true">▦</span>
        Interface preview
        <small>QL-090</small>
      </button>

      {isOpen && (
        <div className="interface-preview-panel" role="dialog" aria-modal="false" aria-label="QL-090 public disabled preview browser-safe Supabase read-only client scaffold">
          <div className="interface-preview-header">
            <div>
              <p className="interface-preview-eyebrow">QL-090 Public disabled preview browser-safe Supabase read-only client scaffold</p>
              <h2>Supabase read-only client scaffold</h2>
              <p>
                This build adds the first guarded browser-safe Supabase read-only scaffold while keeping the current public preview local, synthetic, and non-mutating by default.
              </p>
            </div>
            <button className="interface-preview-close" onClick={() => setIsOpen(false)} type="button" aria-label="Close interface preview">
              ×
            </button>
          </div>

          <div className="interface-preview-warning">
            QL-090 adds a read-only scaffold only. Browser reads stay disabled unless the expected Supabase project URL, anon key, and explicit read-enable flag are present. SMS, calls, provider callbacks, recordings, AI send, archives, retention writes, live customer access, and live pilot runtime stay disabled.
          </div>

          <div className="interface-preview-review-grid">
            <article className="interface-preview-link-card">
              <p className="interface-preview-eyebrow">GitHub Pages production preview</p>
              <h3>Current public preview</h3>
              <code className="interface-preview-link">{targetPreviewUrl}</code>
              <p>The public preview still renders local synthetic fallback samples unless safe read env values are explicitly configured.</p>
            </article>
            <article className="interface-preview-link-card">
              <p className="interface-preview-eyebrow">Supabase read-only gate</p>
              <h3>{formatStatus(supabaseReadOnlyState.status)}</h3>
              <code className="interface-preview-link">{supabaseReadOnlyState.configuredProjectUrl ?? supabaseReadOnlyState.expectedProjectUrl}</code>
              <p>{supabaseReadOnlyState.message}</p>
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
                    <em>Read-only scaffold</em>
                  </button>
                );
              })}
              <div className="interface-preview-safe-card">
                <strong>Active sample</strong>
                <span>{activeConversation.title}</span>
                <small>Fallback sample; no mutation path</small>
              </div>
            </aside>

            <main className="interface-preview-workspace">
              <div className="interface-preview-topline">
                <div>
                  <p className="interface-preview-eyebrow">Browser-safe read-only scaffold</p>
                  <h3>{activeBrand.headline}</h3>
                </div>
                <span>Anon-key gate / synthetic public views / live comms locked</span>
              </div>

              <section className="interface-preview-card">
                <div className="interface-preview-section-title">
                  <p className="interface-preview-eyebrow">Synthetic conversation selector</p>
                  <HelpMarker label="Conversation selector remains hard-coded fallback state" />
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
                  <p className="interface-preview-eyebrow">Read-only client gate</p>
                  <HelpMarker label="The client is created only when all browser-safe gate checks pass" />
                </div>
                <ul className="interface-preview-check-list">
                  <li>Expected project: {supabaseReadOnlyState.expectedProjectUrl}</li>
                  <li>Configured project: {supabaseReadOnlyState.configuredProjectUrl ?? 'not configured'}</li>
                  <li>Anon key configured: {supabaseReadOnlyState.anonKeyConfigured ? 'yes' : 'no'}</li>
                  <li>Read-enable flag active: {supabaseReadOnlyState.readsEnabled ? 'yes' : 'no'}</li>
                  <li>Client creation allowed: {supabaseReadOnlyState.canCreateClient ? 'yes' : 'no'}</li>
                </ul>
              </section>

              <section className="interface-preview-card">
                <div className="interface-preview-section-title">
                  <p className="interface-preview-eyebrow">Allowed read sources</p>
                  <HelpMarker label="Only synthetic public views can be used by the QL-090 scaffold" />
                </div>
                <ul className="interface-preview-check-list">
                  {allowedReadOnlySources.map((source) => (
                    <li key={source}>{source}</li>
                  ))}
                </ul>
              </section>

              <section className="interface-preview-card">
                <div className="interface-preview-section-title">
                  <p className="interface-preview-eyebrow">Blocked browser sources</p>
                  <HelpMarker label="Live and private tables stay out of browser scope" />
                </div>
                <ul className="interface-preview-check-list">
                  {blockedBrowserSources.map((source) => (
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
                  {readOnlyFallbackRules.map((rule) => (
                    <li key={rule}>{rule}</li>
                  ))}
                </ul>
              </section>

              <section className="interface-preview-card">
                <div className="interface-preview-section-title">
                  <p className="interface-preview-eyebrow">Scaffold checks</p>
                  <HelpMarker label="QL-090 must stay read-only and synthetic-only" />
                </div>
                <ul className="interface-preview-check-list">
                  {scaffoldChecks.map((check) => (
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

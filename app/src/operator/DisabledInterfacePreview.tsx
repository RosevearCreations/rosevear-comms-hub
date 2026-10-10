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
const cloudflareWorkerUrl = 'https://rosevear-comms-hub.jfrosevear.workers.dev/';
const supabaseProjectUrl = 'https://gxujcwpktaickcgzyvnu.supabase.co';
const brandOrder: PreviewBrandId[] = ['rosie', 'devil'];

const brandSamples: Record<PreviewBrandId, PreviewBrand> = {
  rosie: {
    name: 'Rosie Dazzlers',
    context: 'Mobile detailing',
    count: '4 open',
    headline: 'Rosie Dazzlers communication cockpit',
    conversations: [
      {
        id: 'rosie-ceramic-quote',
        title: 'Ceramic quote follow-up',
        status: 'Review passed',
        summary: 'Synthetic ceramic coating follow-up with paint-prep and weather-safe scheduling context.',
        draft: 'Draft-only sample: confirm vehicle size, explain prep expectations, and offer a weather-safe booking window.',
        timeline: [
          { title: 'Synthetic inquiry received', detail: 'Hard-coded website quote sample enters the local-only preview.' },
          { title: 'Detail tabs reviewed', detail: 'Overview, Draft, Timeline, and Safety tabs stay understandable for the selected sample.' },
          { title: 'Runtime stays locked', detail: 'No SMS, call, provider, archive, or retention action is available.', locked: true }
        ]
      },
      {
        id: 'rosie-missed-call',
        title: 'Missed-call callback sample',
        status: 'Review passed',
        summary: 'Synthetic missed-call card for a detailing appointment after work hours.',
        draft: 'Draft-only sample: acknowledge the missed call, ask for vehicle size, and suggest AM/PM availability.',
        timeline: [
          { title: 'Sample selected', detail: 'No phone provider event or call log is loaded.' },
          { title: 'Draft reviewed', detail: 'The Draft tab shows copy clearly without implying delivery.' },
          { title: 'Call action locked', detail: 'The public preview cannot place calls or register callbacks.', locked: true }
        ]
      }
    ]
  },
  devil: {
    name: 'Devil n Dove',
    context: 'Maker shop',
    count: '2 open',
    headline: 'Devil n Dove communication cockpit',
    conversations: [
      {
        id: 'devil-custom-order',
        title: 'Custom order clarification sample',
        status: 'Review passed',
        summary: 'Synthetic custom-order question about colour, sizing, and personalization.',
        draft: 'Draft-only sample: confirm colour, size, personalization limits, and expected making time.',
        timeline: [
          { title: 'Custom request selected', detail: 'Hard-coded maker-shop sample opens in the browser preview.' },
          { title: 'Detail tabs reviewed', detail: 'The tabs organize summary, draft, timeline, and safety information clearly.' },
          { title: 'Provider delivery locked', detail: 'No Etsy, SMS, email, callback, or provider account is connected.', locked: true }
        ]
      },
      {
        id: 'devil-maker-story',
        title: 'Maker story question sample',
        status: 'Review passed',
        summary: 'Synthetic shopper asks about the Devil n Dove meaning and materials.',
        draft: 'Draft-only sample: explain the Devil barriers / Dove hope theme and invite a specific product question.',
        timeline: [
          { title: 'Story sample selected', detail: 'Synthetic brand-story prompt is loaded from local constants.' },
          { title: 'Safety reviewed', detail: 'The Safety tab makes locked runtime boundaries visible.' },
          { title: 'AI and send locked', detail: 'No AI reply generation or provider send path is enabled.', locked: true }
        ]
      }
    ]
  }
};

const detailTabs: Array<{ id: DetailTabId; title: string; detail: string }> = [
  { id: 'overview', title: 'Overview', detail: 'Selected summary, status, and review outcome.' },
  { id: 'draft', title: 'Draft', detail: 'Draft-only response copy with no send or AI generation.' },
  { id: 'timeline', title: 'Timeline', detail: 'Synthetic timeline events grouped into a focused local view.' },
  { id: 'safety', title: 'Safety', detail: 'Locked actions, source restrictions, and disabled runtime reminders.' }
];

const readinessChecks = [
  'QL-087 review confirms the QL-086 tabs remain useful, clear, and browser-local.',
  'Cloudflare Worker static-assets config is now expected in the repo for the connected Cloudflare Worker project.',
  'Supabase scaffold is now expected in the repo so the dashboard GitHub integration can find a root supabase/ folder.',
  'Testing can begin against safe database/function scaffolding before any real Phone/SMS provider is connected.'
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
        <div className="interface-preview-tab-note locked">Review passed: the draft area reads as staged copy, not a live send action.</div>
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
        <p className="interface-preview-eyebrow">Safety and infrastructure readiness</p>
        <h4>Runtime remains controlled</h4>
        <ul className="interface-preview-check-list">
          <li>Selected brand: {activeBrand.name}; selected sample: {activeConversation.title}.</li>
          <li>Cloudflare target recorded for Worker static-assets testing: {cloudflareWorkerUrl}</li>
          <li>Supabase target recorded for database/functions testing: {supabaseProjectUrl}</li>
          <li>Phone/SMS providers, recordings, live customer records, archive writes, retention writes, and live pilot runtime remain locked.</li>
        </ul>
      </div>
    );
  }

  return (
    <div className="interface-preview-tab-body overview">
      <p className="interface-preview-eyebrow">QL-087 review outcome</p>
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
          <dt>Source</dt>
          <dd>Hard-coded synthetic sample</dd>
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
        <small>QL-087</small>
      </button>

      {isOpen && (
        <div className="interface-preview-panel" role="dialog" aria-modal="false" aria-label="QL-087 public disabled preview synthetic conversation detail tabs review">
          <div className="interface-preview-header">
            <div>
              <p className="interface-preview-eyebrow">QL-087 Public disabled preview synthetic conversation detail tabs review</p>
              <h2>Detail-tabs review plus deployment readiness</h2>
              <p>
                This build reviews the local synthetic conversation tabs and records the practical Cloudflare Worker and Supabase readiness path so testing can move from theory to safe scaffolding.
              </p>
            </div>
            <button className="interface-preview-close" onClick={() => setIsOpen(false)} type="button" aria-label="Close interface preview">
              ×
            </button>
          </div>

          <div className="interface-preview-warning">
            QL-087 adds Cloudflare/Supabase readiness scaffolding, not live communications. SMS, calls, provider callbacks, recordings, AI send, archives, retention writes, and live pilot runtime stay disabled.
          </div>

          <div className="interface-preview-review-grid">
            <article className="interface-preview-link-card">
              <p className="interface-preview-eyebrow">GitHub Pages production preview</p>
              <h3>Confirmed preview target</h3>
              <code className="interface-preview-link">{targetPreviewUrl}</code>
              <p>The GitHub Pages preview remains the confirmed green public preview during this transition.</p>
            </article>
            <article className="interface-preview-link-card">
              <p className="interface-preview-eyebrow">Cloudflare connected target</p>
              <h3>Worker static-assets target</h3>
              <code className="interface-preview-link">{cloudflareWorkerUrl}</code>
              <p>Cloudflare is prepared as a connected deployment target once the Worker static-assets config is deployed from main.</p>
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
                    <em>Detail tabs reviewed</em>
                  </button>
                );
              })}
              <div className="interface-preview-safe-card">
                <strong>Active sample</strong>
                <span>{activeConversation.title}</span>
                <small>Hard-coded sample; no live account access</small>
              </div>
            </aside>

            <main className="interface-preview-workspace">
              <div className="interface-preview-topline">
                <div>
                  <p className="interface-preview-eyebrow">Synthetic detail-tabs review</p>
                  <h3>{activeBrand.headline}</h3>
                </div>
                <span>Reviewed / infrastructure ready / live comms locked</span>
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
                  <p className="interface-preview-eyebrow">Readiness checks</p>
                  <HelpMarker label="Cloudflare and Supabase are prepared for safe testing" />
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

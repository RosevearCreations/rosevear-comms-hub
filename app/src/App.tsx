import { useMemo, useState } from 'react';
import { brands } from './data/brands';
import { conversations } from './data/conversations';
import type { BrandId, Conversation } from './types';

const defaultBrand = (import.meta.env.VITE_DEFAULT_BRAND as BrandId | undefined) ?? 'rosiedazzlers';

function App() {
  const [selectedBrandId, setSelectedBrandId] = useState<BrandId>(
    brands.some((brand) => brand.id === defaultBrand) ? defaultBrand : 'rosiedazzlers'
  );
  const selectedBrand = brands.find((brand) => brand.id === selectedBrandId) ?? brands[0];
  const brandConversations = useMemo(
    () => conversations.filter((conversation) => conversation.brandId === selectedBrand.id),
    [selectedBrand.id]
  );
  const [selectedConversationId, setSelectedConversationId] = useState<string>(brandConversations[0]?.id ?? '');
  const selectedConversation =
    brandConversations.find((conversation) => conversation.id === selectedConversationId) ?? brandConversations[0];
  const needsAction = brandConversations.filter((conversation) =>
    ['needs_reply', 'needs_photos', 'needs_reference_photos', 'quote_needed'].includes(conversation.status)
  ).length;

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <p className="eyebrow">Rosevear Comms Hub</p>
        <h1>QL-002 Admin Scaffold</h1>
        <p className="sidebar-copy">
          Brand-aware inbox shell for RosieDazzlers and DevilnDove. This stage is local-only and provider-neutral.
        </p>
        <div className="brand-switcher">
          {brands.map((brand) => (
            <button
              key={brand.id}
              className={brand.id === selectedBrand.id ? 'brand-button active' : 'brand-button'}
              onClick={() => {
                setSelectedBrandId(brand.id);
                setSelectedConversationId(conversations.find((conversation) => conversation.brandId === brand.id)?.id ?? '');
              }}
              type="button"
            >
              <span>{brand.displayName}</span>
              <small>{brand.accentLabel}</small>
            </button>
          ))}
        </div>
        <nav className="nav-list">
          <a href="#inbox">Inbox</a>
          <a href="#tasks">Follow-ups</a>
          <a href="#contacts">Contacts</a>
          <a href="#settings">Settings</a>
        </nav>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div>
            <p className="eyebrow">{selectedBrand.businessType}</p>
            <h2>{selectedBrand.displayName}</h2>
            <p>{selectedBrand.firstWorkflow}</p>
          </div>
          <div className="stage-pill">No live phone/SMS connected</div>
        </header>

        <section className="stat-grid">
          <Stat label="Open threads" value={String(brandConversations.length)} helper="Static QL-002 sample data" />
          <Stat label="Needs action" value={String(needsAction)} helper="Future task queue source" />
          <Stat label="Live integrations" value="0" helper="Phone/SMS intentionally disabled" />
        </section>

        <section className="workspace" id="inbox">
          <div className="panel">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">Placeholder inbox</p>
                <h3>{selectedBrand.displayName} conversations</h3>
              </div>
              <span className="count">{brandConversations.length} sample threads</span>
            </div>
            <div className="conversation-list">
              {brandConversations.map((conversation) => (
                <button
                  key={conversation.id}
                  className={selectedConversation?.id === conversation.id ? 'conversation-card active' : 'conversation-card'}
                  onClick={() => setSelectedConversationId(conversation.id)}
                  type="button"
                >
                  <span className="status-row">
                    <strong>{conversation.title}</strong>
                    <StatusBadge status={conversation.status} />
                  </span>
                  <span>{conversation.customerName}</span>
                  <small>{conversation.summary}</small>
                </button>
              ))}
            </div>
          </div>
          <ConversationDetail conversation={selectedConversation} />
        </section>

        <section className="roadmap-card" id="tasks">
          <p className="eyebrow">Next build handoff</p>
          <h3>QL-003 should add persistence/API foundations</h3>
          <p>
            This scaffold proves the brand-aware admin shell. Next connect it to database records and API contracts
            before phone providers are connected.
          </p>
        </section>
      </main>
    </div>
  );
}

function Stat({ label, value, helper }: { label: string; value: string; helper: string }) {
  return (
    <article className="stat-card">
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{helper}</small>
    </article>
  );
}

function ConversationDetail({ conversation }: { conversation?: Conversation }) {
  if (!conversation) {
    return (
      <div className="panel detail-panel">
        <h3>No conversation selected</h3>
        <p>Create or select a placeholder conversation.</p>
      </div>
    );
  }

  return (
    <div className="panel detail-panel">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Conversation detail</p>
          <h3>{conversation.title}</h3>
        </div>
        <StatusBadge status={conversation.status} />
      </div>
      <dl className="detail-list">
        <div><dt>Customer</dt><dd>{conversation.customerName}</dd></div>
        <div><dt>Channel</dt><dd>{conversation.channel.replaceAll('_', ' ')}</dd></div>
        <div><dt>Last activity</dt><dd>{conversation.lastActivity}</dd></div>
        <div><dt>Value hint</dt><dd>{conversation.valueHint}</dd></div>
      </dl>
      <div className="summary-box"><strong>Summary</strong><p>{conversation.summary}</p></div>
      <div className="summary-box"><strong>Next action</strong><p>{conversation.nextAction}</p></div>
      <div className="tag-row">
        {conversation.tags.map((tag) => <span className="tag" key={tag}>{tag.replaceAll('_', ' ')}</span>)}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: Conversation['status'] }) {
  return <span className="status-badge">{status.replaceAll('_', ' ')}</span>;
}

export default App;

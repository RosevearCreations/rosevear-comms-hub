import { FormEvent, useMemo, useState } from 'react';
import { createLocalHubApi } from './api/hubApi';
import { brands } from './data/brands';
import { completeTask, getContactName, getConversationMessages, getOpenTasksForBrand, loadHubDb, resetHubDb } from './storage/localRepository';
import type { BrandId, Conversation, ConversationStatus, HubDatabase } from './types';

const defaultBrand = (import.meta.env.VITE_DEFAULT_BRAND as BrandId | undefined) ?? 'rosiedazzlers';

function getFormValue(formData: FormData, key: string): string {
  return formData.get(key)?.toString().trim() ?? '';
}

function parseFlags(raw: string): string[] {
  return raw
    .split(',')
    .map((flag) => flag.trim())
    .filter(Boolean);
}

function App() {
  const [db, setDb] = useState<HubDatabase>(() => loadHubDb());
  const [selectedBrandId, setSelectedBrandId] = useState<BrandId>(
    brands.some((brand) => brand.id === defaultBrand) ? defaultBrand : 'rosiedazzlers'
  );
  const [selectedConversationId, setSelectedConversationId] = useState<string>('');

  const api = useMemo(() => createLocalHubApi(db), [db]);
  const selectedBrand = brands.find((brand) => brand.id === selectedBrandId) ?? brands[0];
  const brandConversations = useMemo(
    () => db.conversations.filter((conversation) => conversation.brandId === selectedBrand.id),
    [db.conversations, selectedBrand.id]
  );
  const selectedConversation =
    brandConversations.find((conversation) => conversation.id === selectedConversationId) ?? brandConversations[0];
  const selectedMessages = selectedConversation ? getConversationMessages(db, selectedConversation.id) : [];
  const openTasks = getOpenTasksForBrand(db, selectedBrand.id);
  const needsAction = brandConversations.filter((conversation) =>
    ['needs_reply', 'needs_photos', 'needs_reference_photos', 'quote_needed'].includes(conversation.status)
  ).length;

  function changeBrand(brandId: BrandId) {
    setSelectedBrandId(brandId);
    setSelectedConversationId(db.conversations.find((conversation) => conversation.brandId === brandId)?.id ?? '');
  }

  function handleLeadSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const result = api.createManualLead({
      brandId: selectedBrand.id,
      name: getFormValue(formData, 'name'),
      phone: getFormValue(formData, 'phone'),
      email: getFormValue(formData, 'email'),
      town: getFormValue(formData, 'town'),
      subject: getFormValue(formData, 'subject'),
      body: getFormValue(formData, 'body'),
      intakeType: getFormValue(formData, 'intakeType'),
      flags: parseFlags(getFormValue(formData, 'flags')),
      recommendedService: getFormValue(formData, 'recommendedService')
    });
    setDb(result.db);
    setSelectedConversationId(result.conversationId);
    form.reset();
  }

  function handleStatusChange(conversation: Conversation, status: ConversationStatus) {
    setDb(api.updateConversationStatus(conversation.id, status));
  }

  function handleNoteSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedConversation) return;
    const form = event.currentTarget;
    const formData = new FormData(form);
    const body = getFormValue(formData, 'note');
    setDb(api.addInternalNote(selectedConversation.id, body));
    form.reset();
  }

  function handleTaskSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedConversation) return;
    const form = event.currentTarget;
    const formData = new FormData(form);
    const title = getFormValue(formData, 'taskTitle');
    setDb(api.createFollowUpTask(selectedConversation, title));
    form.reset();
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <p className="eyebrow">Rosevear Comms Hub</p>
        <h1>QL-003 Local Data Foundation</h1>
        <p className="sidebar-copy">
          Brand-aware inbox with local persistence, draft API boundary, and no live phone/SMS connection.
        </p>
        <div className="brand-switcher">
          {brands.map((brand) => (
            <button
              key={brand.id}
              className={brand.id === selectedBrand.id ? 'brand-button active' : 'brand-button'}
              onClick={() => changeBrand(brand.id)}
              type="button"
            >
              <span>{brand.displayName}</span>
              <small>{brand.accentLabel}</small>
            </button>
          ))}
        </div>
        <nav className="nav-list">
          <a href="#inbox">Inbox</a>
          <a href="#new-lead">New lead</a>
          <a href="#tasks">Follow-ups</a>
          <a href="#data">Local data</a>
        </nav>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div>
            <p className="eyebrow">{selectedBrand.businessType}</p>
            <h2>{selectedBrand.displayName}</h2>
            <p>{selectedBrand.firstWorkflow}</p>
          </div>
          <div className="stage-pill">Local storage only</div>
        </header>

        <section className="stat-grid">
          <Stat label="Contacts" value={String(db.contacts.filter((contact) => contact.primaryBrand === selectedBrand.id).length)} helper="Local repository" />
          <Stat label="Open threads" value={String(brandConversations.length)} helper="Brand-filtered conversations" />
          <Stat label="Needs action" value={String(needsAction)} helper="Reply/photo/quote queue" />
          <Stat label="Open tasks" value={String(openTasks.length)} helper="Follow-up queue" />
        </section>

        <section className="workspace" id="inbox">
          <div className="panel conversation-list-panel">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">Inbox</p>
                <h3>{selectedBrand.displayName} conversations</h3>
              </div>
              <span className="count">{brandConversations.length} threads</span>
            </div>
            <div className="conversation-list">
              {brandConversations.map((conversation) => (
                <button
                  className={conversation.id === selectedConversation?.id ? 'conversation-card active' : 'conversation-card'}
                  key={conversation.id}
                  onClick={() => setSelectedConversationId(conversation.id)}
                  type="button"
                >
                  <div>
                    <strong>{conversation.subject}</strong>
                    <span>{getContactName(db, conversation.contactId)}</span>
                  </div>
                  <em>{conversation.status.replaceAll('_', ' ')}</em>
                </button>
              ))}
            </div>
          </div>

          <div className="panel detail-panel">
            {selectedConversation ? (
              <>
                <div className="panel-heading">
                  <div>
                    <p className="eyebrow">Conversation detail</p>
                    <h3>{selectedConversation.subject}</h3>
                  </div>
                  <select value={selectedConversation.status} onChange={(event) => handleStatusChange(selectedConversation, event.target.value as ConversationStatus)}>
                    {selectedBrand.statuses.map((status) => (
                      <option key={status} value={status}>
                        {status.replaceAll('_', ' ')}
                      </option>
                    ))}
                  </select>
                </div>
                <p>{selectedConversation.summary}</p>
                <div className="tag-row">
                  {selectedConversation.tags.map((tag) => (
                    <span key={tag}>{tag}</span>
                  ))}
                </div>
                <div className="message-thread">
                  {selectedMessages.map((message) => (
                    <article key={message.id} className={`message ${message.direction}`}>
                      <strong>{message.direction.replace('_', ' ')}</strong>
                      <p>{message.body}</p>
                    </article>
                  ))}
                </div>
                <form className="inline-form" onSubmit={handleNoteSubmit}>
                  <textarea name="note" placeholder="Add an internal note..." rows={3} />
                  <button type="submit">Add note</button>
                </form>
                <form className="inline-form compact" onSubmit={handleTaskSubmit}>
                  <input name="taskTitle" placeholder="Follow-up task title" />
                  <button type="submit">Create task</button>
                </form>
              </>
            ) : (
              <p>No conversations yet for this brand.</p>
            )}
          </div>
        </section>

        <section className="panel" id="new-lead">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Manual intake</p>
              <h3>Create a local lead</h3>
            </div>
            <span className="count">Writes to localStorage</span>
          </div>
          <form className="lead-form" onSubmit={handleLeadSubmit}>
            <input name="name" placeholder="Customer name" required />
            <input name="phone" placeholder="Phone" />
            <input name="email" placeholder="Email" type="email" />
            <input name="town" placeholder="Town" />
            <select name="intakeType" defaultValue={selectedBrand.intakeTypes[0]}>
              {selectedBrand.intakeTypes.map((type) => (
                <option key={type} value={type}>
                  {type.replaceAll('_', ' ')}
                </option>
              ))}
            </select>
            <input name="subject" placeholder="Subject" required />
            <input name="flags" placeholder="Tags/flags separated by commas" />
            <input name="recommendedService" placeholder="Recommended service or product" />
            <textarea name="body" placeholder="What did the customer ask for?" rows={4} required />
            <button type="submit">Create contact + conversation + task</button>
          </form>
        </section>

        <section className="panel" id="tasks">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Follow-ups</p>
              <h3>Open tasks</h3>
            </div>
            <span className="count">{openTasks.length}</span>
          </div>
          <div className="task-list">
            {openTasks.map((task) => (
              <article key={task.id} className="task-card">
                <div>
                  <strong>{task.title}</strong>
                  <p>{task.notes}</p>
                </div>
                <button type="button" onClick={() => setDb(completeTask(db, task.id))}>
                  Mark done
                </button>
              </article>
            ))}
          </div>
        </section>

        <section className="panel" id="data">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">QL-003 boundary</p>
              <h3>Local database status</h3>
            </div>
            <button type="button" onClick={() => setDb(resetHubDb())}>
              Reset local demo data
            </button>
          </div>
          <p>
            Current data is stored only in this browser using localStorage. This lets us test the workflow before setting up Supabase, VPS, PBX, SMS, or any phone provider.
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

export default App;

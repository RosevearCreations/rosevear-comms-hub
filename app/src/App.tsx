import { FormEvent, useMemo, useState } from 'react';
import { createLocalHubApi } from './api/hubApi';
import { brands } from './data/brands';
import {
  completeTask,
  exportHubDb,
  getContact,
  getContactName,
  getContactsForBrand,
  getConversationMessages,
  getIntakeForConversation,
  getIntakesForBrand,
  getOpenTasksForBrand,
  getTasksForConversation,
  loadHubDb,
  resetHubDb
} from './storage/localRepository';
import type { BrandId, Conversation, ConversationStatus, HubDatabase, InboxFilterState, SourceChannel } from './types';

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

function normalize(value: string): string {
  return value.toLowerCase().trim();
}

function formatDate(value: string): string {
  return new Date(value).toLocaleString();
}

function conversationMatchesQuery(db: HubDatabase, conversation: Conversation, query: string): boolean {
  const cleanQuery = normalize(query);
  if (!cleanQuery) return true;
  const contactName = getContactName(db, conversation.contactId);
  const haystack = [
    contactName,
    conversation.subject,
    conversation.summary,
    conversation.status,
    conversation.sourceChannel,
    conversation.priority,
    conversation.tags.join(' ')
  ]
    .join(' ')
    .toLowerCase();

  return haystack.includes(cleanQuery);
}

function App() {
  const [db, setDb] = useState<HubDatabase>(() => loadHubDb());
  const [selectedBrandId, setSelectedBrandId] = useState<BrandId>(
    brands.some((brand) => brand.id === defaultBrand) ? defaultBrand : 'rosiedazzlers'
  );
  const [selectedConversationId, setSelectedConversationId] = useState<string>('');
  const [selectedContactId, setSelectedContactId] = useState<string>('');
  const [filters, setFilters] = useState<InboxFilterState>({ status: 'all', query: '', tag: '', sourceChannel: 'all' });
  const [exportText, setExportText] = useState('');
  const [importMessage, setImportMessage] = useState('');
  const [activeView, setActiveView] = useState<'inbox' | 'contacts' | 'tasks' | 'intakes' | 'data'>('inbox');

  const api = useMemo(() => createLocalHubApi(db), [db]);
  const selectedBrand = brands.find((brand) => brand.id === selectedBrandId) ?? brands[0];
  const brandConversations = useMemo(
    () => db.conversations.filter((conversation) => conversation.brandId === selectedBrand.id).sort((a, b) => b.lastActivityAt.localeCompare(a.lastActivityAt)),
    [db.conversations, selectedBrand.id]
  );
  const brandContacts = useMemo(() => getContactsForBrand(db, selectedBrand.id), [db, selectedBrand.id]);
  const brandIntakes = useMemo(() => getIntakesForBrand(db, selectedBrand.id), [db, selectedBrand.id]);
  const openTasks = getOpenTasksForBrand(db, selectedBrand.id);
  const allBrandTasks = db.followUpTasks.filter((task) => task.brandId === selectedBrand.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const availableTags = Array.from(new Set(brandConversations.flatMap((conversation) => conversation.tags))).sort();

  const filteredConversations = brandConversations.filter((conversation) => {
    const statusMatch = filters.status === 'all' || conversation.status === filters.status;
    const tagMatch = !filters.tag || conversation.tags.includes(filters.tag);
    const sourceMatch = filters.sourceChannel === 'all' || conversation.sourceChannel === filters.sourceChannel;
    const queryMatch = conversationMatchesQuery(db, conversation, filters.query);
    return statusMatch && tagMatch && sourceMatch && queryMatch;
  });

  const selectedConversation =
    brandConversations.find((conversation) => conversation.id === selectedConversationId) ?? filteredConversations[0] ?? brandConversations[0];
  const selectedMessages = selectedConversation ? getConversationMessages(db, selectedConversation.id) : [];
  const selectedConversationTasks = selectedConversation ? getTasksForConversation(db, selectedConversation.id) : [];
  const selectedConversationContact = selectedConversation ? getContact(db, selectedConversation.contactId) : undefined;
  const selectedIntake = selectedConversation ? getIntakeForConversation(db, selectedConversation.id) : undefined;
  const selectedContact = brandContacts.find((contact) => contact.id === selectedContactId) ?? selectedConversationContact ?? brandContacts[0];

  const needsAction = brandConversations.filter((conversation) =>
    ['needs_reply', 'needs_photos', 'needs_reference_photos', 'quote_needed'].includes(conversation.status)
  ).length;

  function changeBrand(brandId: BrandId) {
    const firstConversation = db.conversations.find((conversation) => conversation.brandId === brandId);
    const firstContact = getContactsForBrand(db, brandId)[0];

    setSelectedBrandId(brandId);
    setSelectedConversationId(firstConversation?.id ?? '');
    setSelectedContactId(firstContact?.id ?? '');
    setFilters({ status: 'all', query: '', tag: '', sourceChannel: 'all' });
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
    setActiveView('inbox');
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

  function handleCompleteTask(taskId: string) {
    setDb(completeTask(db, taskId));
  }

  function handleExportClick() {
    setExportText(exportHubDb(db));
    setImportMessage('Local export generated. Save this text somewhere safe if needed.');
  }

  function handleImportSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const rawJson = getFormValue(formData, 'importJson');
    const result = api.importDatabase(rawJson);
    if (result.ok) {
      setDb(result.db);
      setImportMessage('Import successful. Local database replaced in this browser.');
      event.currentTarget.reset();
      return;
    }

    setImportMessage(result.error);
  }

  function resetDemoData() {
    const next = resetHubDb();
    setDb(next);
    setSelectedConversationId('');
    setSelectedContactId('');
    setExportText('');
    setImportMessage('Local demo data reset.');
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <p className="eyebrow">Rosevear Comms Hub</p>
        <h1>QL-004 Admin Inbox MVP</h1>
        <p className="sidebar-copy">
          Brand-aware local inbox with filters, contact and intake detail, tasks, and data import/export. No live phone/SMS is connected.
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
        <nav className="nav-list" aria-label="Admin sections">
          {(['inbox', 'contacts', 'tasks', 'intakes', 'data'] as const).map((view) => (
            <button className={activeView === view ? 'nav-button active' : 'nav-button'} key={view} onClick={() => setActiveView(view)} type="button">
              {view}
            </button>
          ))}
        </nav>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div>
            <p className="eyebrow">{selectedBrand.businessType}</p>
            <h2>{selectedBrand.displayName}</h2>
            <p>{selectedBrand.firstWorkflow}</p>
          </div>
          <div className="stage-pill">Local-only / no live phone or SMS</div>
        </header>

        <section className="stat-grid">
          <Stat label="Open threads" value={String(brandConversations.length)} helper="Local brand conversations" />
          <Stat label="Needs action" value={String(needsAction)} helper="Needs reply/photos/quote" />
          <Stat label="Open tasks" value={String(openTasks.length)} helper="Follow-up queue" />
          <Stat label="Intakes" value={String(brandIntakes.length)} helper="Quote/custom requests" />
        </section>

        {activeView === 'inbox' && (
          <section className="workspace" id="inbox">
            <div className="panel">
              <div className="panel-heading">
                <div>
                  <p className="eyebrow">Inbox controls</p>
                  <h3>{selectedBrand.displayName} conversations</h3>
                </div>
                <span className="count">{filteredConversations.length} shown</span>
              </div>

              <div className="filter-grid">
                <label>
                  Search
                  <input
                    value={filters.query}
                    onChange={(event) => setFilters({ ...filters, query: event.target.value })}
                    placeholder="Name, tag, summary..."
                  />
                </label>
                <label>
                  Status
                  <select
                    value={filters.status}
                    onChange={(event) => setFilters({ ...filters, status: event.target.value as ConversationStatus | 'all' })}
                  >
                    <option value="all">All statuses</option>
                    {selectedBrand.statuses.map((status) => (
                      <option value={status} key={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Tag
                  <select value={filters.tag} onChange={(event) => setFilters({ ...filters, tag: event.target.value })}>
                    <option value="">All tags</option>
                    {availableTags.map((tag) => (
                      <option value={tag} key={tag}>
                        {tag}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Channel
                  <select
                    value={filters.sourceChannel}
                    onChange={(event) => setFilters({ ...filters, sourceChannel: event.target.value as SourceChannel | 'all' })}
                  >
                    <option value="all">All channels</option>
                    {(['manual', 'website_form', 'phone_call', 'missed_call', 'voicemail', 'sms', 'email', 'system_task'] as SourceChannel[]).map((channel) => (
                      <option value={channel} key={channel}>
                        {channel}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="conversation-list">
                {filteredConversations.map((conversation) => (
                  <button
                    key={conversation.id}
                    className={conversation.id === selectedConversation?.id ? 'conversation-card active' : 'conversation-card'}
                    onClick={() => setSelectedConversationId(conversation.id)}
                    type="button"
                  >
                    <div>
                      <strong>{conversation.subject}</strong>
                      <span>{getContactName(db, conversation.contactId)}</span>
                      <small>{conversation.tags.join(', ') || 'No tags'}</small>
                    </div>
                    <em>{conversation.status}</em>
                  </button>
                ))}
              </div>
            </div>

            <ConversationDetail
              conversation={selectedConversation}
              contactName={selectedConversationContact?.name ?? 'Unknown contact'}
              selectedBrand={selectedBrand}
              messages={selectedMessages}
              tasks={selectedConversationTasks}
              selectedIntake={selectedIntake}
              onStatusChange={handleStatusChange}
              onNoteSubmit={handleNoteSubmit}
              onTaskSubmit={handleTaskSubmit}
              onCompleteTask={handleCompleteTask}
            />
          </section>
        )}

        {activeView === 'contacts' && (
          <section className="workspace" id="contacts">
            <div className="panel">
              <div className="panel-heading">
                <div>
                  <p className="eyebrow">Contacts</p>
                  <h3>{selectedBrand.displayName} contact list</h3>
                </div>
                <span className="count">{brandContacts.length} contacts</span>
              </div>
              <div className="conversation-list">
                {brandContacts.map((contact) => (
                  <button
                    type="button"
                    key={contact.id}
                    className={contact.id === selectedContact?.id ? 'conversation-card active' : 'conversation-card'}
                    onClick={() => setSelectedContactId(contact.id)}
                  >
                    <div>
                      <strong>{contact.name}</strong>
                      <span>{contact.town || 'No town'} · {contact.customerType}</span>
                      <small>{contact.phone || contact.email || 'No contact info'}</small>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="panel detail-panel">
              <p className="eyebrow">Contact detail</p>
              <h3>{selectedContact?.name ?? 'No contact selected'}</h3>
              {selectedContact ? (
                <div className="detail-grid">
                  <Detail label="Phone" value={selectedContact.phone ?? 'Not provided'} />
                  <Detail label="Email" value={selectedContact.email ?? 'Not provided'} />
                  <Detail label="Town" value={selectedContact.town ?? 'Not provided'} />
                  <Detail label="Source" value={selectedContact.source} />
                  <Detail label="Customer type" value={selectedContact.customerType} />
                  <Detail label="Created" value={formatDate(selectedContact.createdAt)} />
                  <Detail label="Notes" value={selectedContact.notes ?? 'No notes yet'} wide />
                </div>
              ) : (
                <p>No contact selected.</p>
              )}
            </div>
          </section>
        )}

        {activeView === 'tasks' && (
          <section className="panel" id="tasks">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">Follow-up queue</p>
                <h3>{selectedBrand.displayName} tasks</h3>
              </div>
              <span className="count">{openTasks.length} open</span>
            </div>
            <div className="task-list">
              {allBrandTasks.map((task) => (
                <div className={task.status === 'done' ? 'task-card done' : 'task-card'} key={task.id}>
                  <div>
                    <strong>{task.title}</strong>
                    <p>
                      {task.priority} priority · {task.status} · {task.conversationId ? getContactName(db, task.contactId ?? '') : 'General task'}
                    </p>
                    {task.notes && <small>{task.notes}</small>}
                  </div>
                  {task.status === 'open' && (
                    <button onClick={() => handleCompleteTask(task.id)} type="button">
                      Complete
                    </button>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {activeView === 'intakes' && (
          <section className="panel" id="intakes">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">Intake detail</p>
                <h3>{selectedBrand.displayName} quote/custom requests</h3>
              </div>
              <span className="count">{brandIntakes.length} intakes</span>
            </div>
            <div className="intake-grid">
              {brandIntakes.map((intake) => (
                <article className="intake-card" key={intake.id}>
                  <p className="eyebrow">{intake.intakeType}</p>
                  <h4>{getContactName(db, intake.contactId)}</h4>
                  <p>Status: {intake.status}</p>
                  <p>Recommended: {intake.recommendedService ?? 'Not set'}</p>
                  <div className="tag-row">
                    {intake.flags.map((flag) => (
                      <span key={flag}>{flag}</span>
                    ))}
                  </div>
                  <pre>{JSON.stringify(intake.rawAnswers, null, 2)}</pre>
                </article>
              ))}
            </div>
          </section>
        )}

        {activeView === 'data' && (
          <section className="workspace" id="data">
            <div className="panel">
              <div className="panel-heading">
                <div>
                  <p className="eyebrow">Local data tools</p>
                  <h3>Export / import</h3>
                </div>
              </div>
              <p className="muted">
                QL-004 still uses browser localStorage. Export/import is only for safe demo movement and backup before a real backend exists.
              </p>
              <div className="button-row">
                <button onClick={handleExportClick} type="button">
                  Generate export
                </button>
                <button className="secondary" onClick={resetDemoData} type="button">
                  Reset demo data
                </button>
              </div>
              {importMessage && <p className="notice">{importMessage}</p>}
              <textarea className="export-box" readOnly value={exportText} placeholder="Export output appears here." />
            </div>

            <div className="panel">
              <p className="eyebrow">Import JSON</p>
              <h3>Replace local browser data</h3>
              <form className="inline-form" onSubmit={handleImportSubmit}>
                <textarea name="importJson" placeholder="Paste a QL-004 JSON export here." rows={12} />
                <button type="submit">Import local data</button>
              </form>
            </div>
          </section>
        )}

        <section className="panel" id="new-lead">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Manual lead</p>
              <h3>Create test lead for {selectedBrand.displayName}</h3>
            </div>
          </div>
          <form className="lead-form" onSubmit={handleLeadSubmit}>
            <input name="name" placeholder="Customer name" />
            <input name="phone" placeholder="Phone" />
            <input name="email" placeholder="Email" />
            <input name="town" placeholder="Town" />
            <input name="subject" placeholder="Subject" />
            <select name="intakeType" defaultValue={selectedBrand.intakeTypes[0] ?? 'manual'}>
              {selectedBrand.intakeTypes.map((type) => (
                <option value={type} key={type}>
                  {type}
                </option>
              ))}
            </select>
            <input name="recommendedService" placeholder="Recommended service / item" />
            <input name="flags" placeholder="Comma-separated tags, e.g. needs_photos, pet_hair" />
            <textarea name="body" placeholder="Customer request summary" />
            <button type="submit">Create local lead</button>
          </form>
        </section>
      </main>
    </div>
  );
}

interface StatProps {
  label: string;
  value: string;
  helper: string;
}

function Stat({ label, value, helper }: StatProps) {
  return (
    <article className="stat-card">
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{helper}</small>
    </article>
  );
}

interface DetailProps {
  label: string;
  value: string;
  wide?: boolean;
}

function Detail({ label, value, wide }: DetailProps) {
  return (
    <div className={wide ? 'detail-item wide' : 'detail-item'}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

interface ConversationDetailProps {
  conversation?: Conversation;
  contactName: string;
  selectedBrand: (typeof brands)[number];
  messages: ReturnType<typeof getConversationMessages>;
  tasks: ReturnType<typeof getTasksForConversation>;
  selectedIntake: ReturnType<typeof getIntakeForConversation>;
  onStatusChange: (conversation: Conversation, status: ConversationStatus) => void;
  onNoteSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onTaskSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onCompleteTask: (taskId: string) => void;
}

function ConversationDetail({
  conversation,
  contactName,
  selectedBrand,
  messages,
  tasks,
  selectedIntake,
  onStatusChange,
  onNoteSubmit,
  onTaskSubmit,
  onCompleteTask
}: ConversationDetailProps) {
  if (!conversation) {
    return (
      <div className="panel detail-panel">
        <h3>No conversation selected</h3>
        <p>Create a lead or clear the filters.</p>
      </div>
    );
  }

  return (
    <div className="panel detail-panel">
      <p className="eyebrow">Conversation detail</p>
      <h3>{conversation.subject}</h3>
      <p className="muted">
        {contactName} · {conversation.sourceChannel} · Last activity {formatDate(conversation.lastActivityAt)}
      </p>

      <label className="status-control">
        Status
        <select value={conversation.status} onChange={(event) => onStatusChange(conversation, event.target.value as ConversationStatus)}>
          {selectedBrand.statuses.map((status) => (
            <option value={status} key={status}>
              {status}
            </option>
          ))}
        </select>
      </label>

      <div className="tag-row">
        {conversation.tags.map((tag) => (
          <span key={tag}>{tag}</span>
        ))}
      </div>

      <section className="mini-panel">
        <p className="eyebrow">Summary</p>
        <p>{conversation.summary}</p>
      </section>

      {selectedIntake && (
        <section className="mini-panel">
          <p className="eyebrow">Linked intake</p>
          <p>
            {selectedIntake.intakeType} · {selectedIntake.status}
          </p>
          <p>{selectedIntake.recommendedService ?? 'No recommended service set.'}</p>
        </section>
      )}

      <div className="message-thread">
        {messages.map((message) => (
          <article className={`message ${message.direction}`} key={message.id}>
            <span>
              {message.direction} · {message.channel} · {formatDate(message.createdAt)}
            </span>
            <p>{message.body}</p>
          </article>
        ))}
      </div>

      <form className="inline-form" onSubmit={onNoteSubmit}>
        <textarea name="note" placeholder="Add internal note" />
        <button type="submit">Add note</button>
      </form>

      <form className="inline-form compact" onSubmit={onTaskSubmit}>
        <input name="taskTitle" placeholder="Follow-up task" />
        <button type="submit">Create task</button>
      </form>

      <div className="task-list compact-list">
        {tasks.map((task) => (
          <div className={task.status === 'done' ? 'task-card done' : 'task-card'} key={task.id}>
            <div>
              <strong>{task.title}</strong>
              <p>
                {task.priority} · {task.status}
              </p>
            </div>
            {task.status === 'open' && (
              <button onClick={() => onCompleteTask(task.id)} type="button">
                Done
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;

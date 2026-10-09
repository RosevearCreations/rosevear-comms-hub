import { useEffect, useMemo, useState } from 'react';
import './site-help.css';

type HelpTopicKey =
  | 'hub-overview'
  | 'brand-switcher'
  | 'navigation'
  | 'stats'
  | 'inbox'
  | 'conversation-detail'
  | 'contacts'
  | 'tasks'
  | 'intakes'
  | 'data-tools'
  | 'manual-lead'
  | 'live-pilot-decision'
  | 'manual-intervention';

interface HelpTopic {
  key: HelpTopicKey;
  label: string;
  targetSelectors: string[];
  summary: string;
  steps: string[];
}

const helpTopics: HelpTopic[] = [
  {
    key: 'hub-overview',
    label: 'Hub overview',
    targetSelectors: ['.topbar'],
    summary: 'This area confirms which brand workspace is selected and whether the hub is still local-only with live phone and SMS disabled.',
    steps: [
      'Use the brand name and workflow summary to verify you are working in the correct business context.',
      'Treat the Local-only / no live phone or SMS badge as the safety state until a later explicit approval enables a controlled path.',
      'Do not connect providers or production callbacks from this screen.'
    ]
  },
  {
    key: 'brand-switcher',
    label: 'Brand switcher',
    targetSelectors: ['.brand-switcher'],
    summary: 'Switches between the supported business brands while preserving a separate local inbox, contacts, intakes, and tasks view for each brand.',
    steps: [
      'Choose Rosie Dazzlers or Devil n Dove before reviewing messages or creating test leads.',
      'Changing brands resets the active filters so the new brand starts with a clean view.',
      'The switcher does not send messages, call customers, or write to a production provider.'
    ]
  },
  {
    key: 'navigation',
    label: 'Navigation',
    targetSelectors: ['.nav-list'],
    summary: 'Use this menu to move between Inbox, Contacts, Tasks, Intakes, and Data tools.',
    steps: [
      'Inbox is for conversation triage.',
      'Contacts is for customer or lead detail.',
      'Tasks is for follow-up work.',
      'Intakes is for quote or custom request answers.',
      'Data is for local demo export/import only.'
    ]
  },
  {
    key: 'stats',
    label: 'Dashboard stats',
    targetSelectors: ['.stat-grid'],
    summary: 'The stat cards summarize the currently selected brand and help you see what needs attention first.',
    steps: [
      'Open threads counts local conversations for the brand.',
      'Needs action focuses on statuses requiring reply, photos, or quotes.',
      'Open tasks shows unfinished follow-up items.',
      'Intakes counts saved quote or custom requests.'
    ]
  },
  {
    key: 'inbox',
    label: 'Inbox controls',
    targetSelectors: ['#inbox .panel-heading:first-child'],
    summary: 'Inbox controls filter local conversations by text search, status, tag, and source channel.',
    steps: [
      'Search by customer, subject, summary, status, source, priority, or tag.',
      'Use Status to narrow to work that needs reply, photos, quote, or follow-up.',
      'Use Tag and Channel to isolate specific intake reasons or communication paths.',
      'Selecting a conversation opens the detail panel without contacting anyone.'
    ]
  },
  {
    key: 'conversation-detail',
    label: 'Conversation detail',
    targetSelectors: ['.detail-panel'],
    summary: 'Conversation detail is for local review, internal notes, status changes, linked intake context, and follow-up tasks.',
    steps: [
      'Use status updates to organize the local queue.',
      'Add internal notes for staff context only.',
      'Create tasks when a follow-up is needed.',
      'Completing tasks changes the local demo state only.'
    ]
  },
  {
    key: 'contacts',
    label: 'Contacts',
    targetSelectors: ['#contacts .panel-heading:first-child'],
    summary: 'Contacts shows local customer or lead details for the selected brand.',
    steps: [
      'Select a contact to review phone, email, town, source, customer type, created date, and notes.',
      'Use this as local reference only until a real backend and permissions model are enabled.',
      'Do not paste real customer data into demo records unless production storage has been approved.'
    ]
  },
  {
    key: 'tasks',
    label: 'Tasks',
    targetSelectors: ['#tasks .panel-heading'],
    summary: 'Tasks tracks local follow-up work for the selected brand.',
    steps: [
      'Open tasks are active work items.',
      'Done tasks remain visible with reduced emphasis for audit context.',
      'The task queue does not notify customers or staff automatically.'
    ]
  },
  {
    key: 'intakes',
    label: 'Intakes',
    targetSelectors: ['#intakes .panel-heading'],
    summary: 'Intakes show local quote or custom request answers and the recommended service or item.',
    steps: [
      'Review intake type, contact, status, recommended service, and flags.',
      'Use raw answer previews to validate mapping logic before a real backend exists.',
      'Keep intake evidence synthetic and redacted unless a production privacy model is approved.'
    ]
  },
  {
    key: 'data-tools',
    label: 'Data tools',
    targetSelectors: ['#data .panel-heading'],
    summary: 'Data tools export, import, and reset browser-local demo data.',
    steps: [
      'Generate export creates a local JSON backup shown in the text box.',
      'Import replaces this browser’s local demo database.',
      'Reset demo data restores seeded local records.',
      'These tools are not a production backup and do not write Supabase.'
    ]
  },
  {
    key: 'manual-lead',
    label: 'Manual lead',
    targetSelectors: ['#new-lead .panel-heading'],
    summary: 'Manual lead creates a local test lead and linked conversation for the selected brand.',
    steps: [
      'Enter synthetic or approved test details only.',
      'Use tags to simulate workflows like needs_photos or pet_hair.',
      'Submitting creates a local browser record and does not contact the customer.'
    ]
  },
  {
    key: 'live-pilot-decision',
    label: 'Live-pilot decision safety',
    targetSelectors: ['.stage-pill'],
    summary: 'QL-059 is a go/no-go decision gate only. It must not start the live pilot, connect providers, attach live numbers, or deliver phone/SMS traffic.',
    steps: [
      'Confirm owner approval is recorded separately before any future live behavior.',
      'Confirm provider account, number ownership, consent, rollback, rate limit, replay, audit, and production proof are ready.',
      'Leave all runtime flags disabled in this build.',
      'Queue a later controlled activation build only after a GREEN production proof.'
    ]
  },
  {
    key: 'manual-intervention',
    label: 'Manual intervention guide',
    targetSelectors: ['.sidebar-copy'],
    summary: 'Manual intervention must be performed outside the app and documented before any live pilot activation is considered.',
    steps: [
      'Variables: keep provider keys, webhook secrets, Supabase service credentials, and live phone numbers out of source control.',
      'Services: verify Supabase, hosting, DNS, and the chosen phone/SMS provider in their own dashboards before a future activation build.',
      'Application links: use the production site, provider console, Supabase project, GitHub Actions, and deployment dashboard for evidence.',
      'Do not enable callbacks, phone webhooks, SMS send, call recording, AI auto-send, or persistence writes in QL-059.'
    ]
  }
];

function findTopic(topicKey: string | undefined): HelpTopic {
  return helpTopics.find((topic) => topic.key === topicKey) ?? helpTopics[0];
}

export function SiteHelpSystem() {
  const topics = useMemo(() => helpTopics, []);
  const [activeTopicKey, setActiveTopicKey] = useState<HelpTopicKey>('hub-overview');
  const [isOpen, setIsOpen] = useState(false);
  const activeTopic = findTopic(activeTopicKey);

  useEffect(() => {
    function handleOpenHelp(event: Event) {
      const topicKey = (event as CustomEvent<{ topicKey?: HelpTopicKey }>).detail?.topicKey;
      setActiveTopicKey(findTopic(topicKey).key);
      setIsOpen(true);
    }

    window.addEventListener('ql-help-open', handleOpenHelp);
    return () => window.removeEventListener('ql-help-open', handleOpenHelp);
  }, []);

  useEffect(() => {
    const createdButtons: HTMLButtonElement[] = [];

    function attachButtons() {
      topics.forEach((topic) => {
        topic.targetSelectors.forEach((selector) => {
          document.querySelectorAll<HTMLElement>(selector).forEach((target) => {
            const alreadyAttached = Array.from(target.children).some(
              (child) => child instanceof HTMLButtonElement && child.dataset.helpKey === topic.key
            );

            if (alreadyAttached) return;

            target.classList.add('ql-help-anchor');
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'ql-help-icon';
            button.dataset.helpKey = topic.key;
            button.textContent = 'i';
            button.title = `Help: ${topic.label}`;
            button.setAttribute('aria-label', `Open help for ${topic.label}`);
            button.addEventListener('click', () => {
              window.dispatchEvent(new CustomEvent('ql-help-open', { detail: { topicKey: topic.key } }));
            });
            target.appendChild(button);
            createdButtons.push(button);
          });
        });
      });
    }

    attachButtons();
    const observer = new MutationObserver(() => attachButtons());
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      createdButtons.forEach((button) => button.remove());
    };
  }, [topics]);

  return (
    <aside className="site-help" aria-label="Website help system">
      <button
        type="button"
        className="site-help-toggle"
        onClick={() => setIsOpen((open) => !open)}
        aria-expanded={isOpen}
      >
        <span aria-hidden="true">i</span>
        Help
      </button>

      {isOpen && (
        <div className="site-help-panel" role="dialog" aria-modal="false" aria-label={`${activeTopic.label} help`}>
          <div className="site-help-header">
            <div>
              <p className="eyebrow">Section help</p>
              <h2>{activeTopic.label}</h2>
            </div>
            <button type="button" className="site-help-close" onClick={() => setIsOpen(false)} aria-label="Close help">
              ×
            </button>
          </div>

          <p className="site-help-summary">{activeTopic.summary}</p>
          <ol className="site-help-steps">
            {activeTopic.steps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>

          <label className="site-help-picker">
            Help topic
            <select value={activeTopic.key} onChange={(event) => setActiveTopicKey(event.target.value as HelpTopicKey)}>
              {topics.map((topic) => (
                <option value={topic.key} key={topic.key}>
                  {topic.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      )}
    </aside>
  );
}

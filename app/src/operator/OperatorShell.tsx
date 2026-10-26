import { useEffect, useRef, useState } from 'react';
import App from '../App';
import type { BrandId } from '../types';
import { DisabledInterfacePreview } from './DisabledInterfacePreview';
import { DisabledOperatorConsole } from './DisabledOperatorConsole';
import { Ql174BrandSafeTriagePreview } from './Ql174BrandSafeTriagePreview';
import { Ql175ContactContextPreview } from './Ql175ContactContextPreview';
import { Ql176ConversationTimelinePreview } from './Ql176ConversationTimelinePreview';
import { Ql177BrandIntakeHandoffPreview } from './Ql177BrandIntakeHandoffPreview';
import { Ql178OperatorTaskSimulation } from './Ql178OperatorTaskSimulation';
import { Ql179PhoneSmsEventEmulator } from './Ql179PhoneSmsEventEmulator';
import { Ql180RoutingIvrPreview } from './Ql180RoutingIvrPreview';
import { Ql181PrivacyPilotGatePreview } from './Ql181PrivacyPilotGatePreview';
import { Ql182SyntheticJourneyPreview } from './Ql182SyntheticJourneyPreview';
import { Ql183OperatorUsabilityPreview } from './Ql183OperatorUsabilityPreview';
import { Ql184BrandWorkspacePermissionPreview } from './Ql184BrandWorkspacePermissionPreview';
import { Ql185PrivateDataBlueprintPreview } from './Ql185PrivateDataBlueprintPreview';
import { Ql186ConsentMessageClassificationPreview } from './Ql186ConsentMessageClassificationPreview';
import { Ql187ProviderCostPreview } from './Ql187ProviderCostPreview';
import { Ql188SecurityHarnessPreview } from './Ql188SecurityHarnessPreview';
import { Ql189OperationsSafetyPreview } from './Ql189OperationsSafetyPreview';
import { Ql190IndependentReviewPacketPreview } from './Ql190IndependentReviewPacketPreview';
import { Ql191OperatorDashboard } from './Ql191OperatorDashboard';
import { Ql191AdditionalOrganizationPreview } from './Ql191AdditionalOrganizationPreview';
import { Ql192UnifiedInbox } from './Ql192UnifiedInbox';
import { Ql193Customer360 } from './Ql193Customer360';
import { Ql194FollowUpQueue } from './Ql194FollowUpQueue';
import { Ql195PhoneDesk } from './Ql195PhoneDesk';
import { Ql196MessageComposer } from './Ql196MessageComposer';
import { Ql197TaskCalendar } from './Ql197TaskCalendar';
import { Ql198Reports } from './Ql198Reports';
import { Ql199ConnectorCentre } from './Ql199ConnectorCentre';
import { Ql210ApplicationAcceptance } from './Ql210ApplicationAcceptance';
import { Ql211OwnerObservedTrial } from './Ql211OwnerObservedTrial';
import { type Ql211Ledger } from './ql211OwnerTrial';
import { Ql212RepairEvidenceQueue } from './Ql212RepairEvidenceQueue';
import { type Ql212Ledger } from './ql212RepairQueue';
import { Ql213IndependentReviewPrep } from './Ql213IndependentReviewPrep';
import { type Ql213Ledger } from './ql213ReviewPreparation';
import { Ql214ReviewIntakeHoldRegister } from './Ql214ReviewIntakeHoldRegister';
import { type Ql214Ledger } from './ql214ReviewIntake';
import { Ql215FollowUpAgingHoldAudit } from './Ql215FollowUpAgingHoldAudit';
import { type Ql215Ledger } from './ql215FollowUpAudit';
import { Ql216EscalationHandoffAudit } from './Ql216EscalationHandoffAudit';
import { type Ql216Ledger } from './ql216EscalationHandoff';
import { seedQueueForOrganization, type MockQueueState } from './ql194WorkQueue';
import { findOperatorOrganization, initialOperatorOrganization, operatorOrganizations, type OperatorWorkspace, type OrganizationId } from './ql191Organizations';
import { Ql093SafeReadPreview } from './Ql093SafeReadPreview';
import type { Ql183Feedback } from './ql183OperatorUsabilityAcceptance';
import './operator-shell.css';

const workspaces: ReadonlyArray<{ id: OperatorWorkspace; label: string; description: string }> = [
  { id: 'dashboard', label: 'Dashboard', description: 'Company overview, synthetic activity and quick navigation' },
  { id: 'inbox', label: 'Unified inbox', description: 'Company-scoped multi-channel threads, filters and review-only timelines' },
  { id: 'contacts', label: 'Customer 360', description: 'Explicitly linked fictional customer context and cross-channel history' },
  { id: 'queue', label: 'Assignments & follow-ups', description: 'Fictional owners, due windows, triage and conversation-linked sample tasks' },
  { id: 'phone', label: 'Phone desk', description: 'Mock keypad, missed calls, voicemail descriptions and business-line review' },
  { id: 'composer', label: 'SMS/MMS composer', description: 'Unsent message templates, attachment placeholders, consent and opt-out controls' },
  { id: 'calendar', label: 'Tasks & calendar', description: 'Fictional calendar board, task schedule and local reminder rehearsals' },
  { id: 'reports', label: 'Reporting centre', description: 'Fictional communication breakdowns and session-only task totals' },
  { id: 'connectors', label: 'Connector centre', description: 'Company-scoped mock integration contracts, gates and mapping rehearsals' },
  { id: 'samples', label: 'Synthetic conversations', description: 'Brand-safe triage, unsent drafts, mock intake handoffs and follow-up tasks' },
  { id: 'evidence', label: 'Safety & hold review', description: 'Four-company preview acceptance, synthetic evidence and unresolved pilot prerequisites' },
  { id: 'trial', label: 'Owner trial & gap triage', description: 'Guided four-company manual preview observations, mobile review and prioritized gap follow-up' },
  { id: 'repair', label: 'Finding replay & repair queue', description: 'Synthetic trial-finding replay, session-only repair evidence drafts and manual retest holds' },
  { id: 'review', label: 'Retest comparison & review prep', description: 'Before/after mock replay evidence, independent-review checklist drafts and unresolved closure risks' },
  { id: 'intake', label: 'Independent review intake & holds', description: 'Fictional reviewer intake, evidence gap follow-up and conditional release hold register' },
  { id: 'audit', label: 'Reviewer follow-up aging & hold audit', description: 'Simulated gap-aging cycles, stale source reconciliation and read-only release hold continuity' },
  { id: 'handoff', label: 'Escalation replay & owner-safe handoff', description: 'Source-linked fictional escalations, locally prepared review packets and unchanged release holds' },
  { id: 'telephony', label: 'Phone/SMS safety', description: 'Mock-only phone/SMS event emulator, replay and disabled provider safeguards' }
];

const firstOrganization = initialOperatorOrganization(import.meta.env.VITE_DEFAULT_BRAND).id;

export function OperatorShell() {
  const [organizationId, setOrganizationId] = useState<OrganizationId>(firstOrganization);
  const [usabilityFeedback, setUsabilityFeedback] = useState<Record<string, Ql183Feedback>>({});
  const [showLegacyTools, setShowLegacyTools] = useState(false);
  const [workspace, setWorkspace] = useState<OperatorWorkspace>('dashboard');
  const [contactJump, setContactJump] = useState<string | null>(null);
  const [threadJump, setThreadJump] = useState<string | null>(null);
  const [queueJump, setQueueJump] = useState<string | null>(null);
  const [composerJump, setComposerJump] = useState<string | null>(null);
  const [queueState, setQueueState] = useState<MockQueueState>(() => seedQueueForOrganization(firstOrganization));
  const [trialLedger, setTrialLedger] = useState<Ql211Ledger>({});
  const [repairLedger, setRepairLedger] = useState<Ql212Ledger>({});
  const [reviewLedger, setReviewLedger] = useState<Ql213Ledger>({});
  const [intakeLedger, setIntakeLedger] = useState<Ql214Ledger>({});
  const [auditLedger, setAuditLedger] = useState<Ql215Ledger>({});
  const [handoffLedger, setHandoffLedger] = useState<Ql216Ledger>({});
  const [reminderIds, setReminderIds] = useState<ReadonlySet<string>>(() => new Set());
  const organization = findOperatorOrganization(organizationId) ?? operatorOrganizations[0];
  const brandId = organization.legacyBrandId;
  const activeWorkspace = workspaces.find((entry) => entry.id === workspace) ?? workspaces[0];
  const headingRef = useRef<HTMLHeadingElement>(null);
  const previouslySelected = useRef<OperatorWorkspace | null>(null);

  function changeOrganization(nextOrganization: OrganizationId) {
    if (nextOrganization !== organizationId) {
      setUsabilityFeedback({});
      setShowLegacyTools(false);
      setContactJump(null);
      setThreadJump(null);
      setQueueJump(null);
      setComposerJump(null);
      setQueueState(seedQueueForOrganization(nextOrganization));
      setReminderIds(new Set());
    }
    setOrganizationId(nextOrganization);
  }

  function changeBrand(nextBrand: BrandId) { changeOrganization(nextBrand); }

  function openCustomer(contactId: string) {
    setContactJump(contactId);
    setThreadJump(null);
    setWorkspace('contacts');
  }

  function openThread(threadId: string) {
    setThreadJump(threadId);
    setContactJump(null);
    setWorkspace('inbox');
  }

  function openQueue(threadId: string) {
    setQueueJump(threadId);
    setWorkspace('queue');
  }

  function openComposer(threadId: string) {
    setComposerJump(threadId);
    setWorkspace('composer');
  }

  // Move focus to the visible workspace heading after an explicit navigation
  // change, while leaving initial page-load focus untouched.
  useEffect(() => {
    if (previouslySelected.current && previouslySelected.current !== workspace) headingRef.current?.focus();
    previouslySelected.current = workspace;
  }, [workspace]);

  return (
    <div className="ql172-shell" data-organization={organization.id} data-ql191-release="ql191-four-organization-console-v2">
      <a className="ql172-skip-link" href="#ql172-workspace">Skip to operator workspace</a>
      <header className="ql172-header">
        <div>
          <p className="ql172-kicker">Rosevear Comms Hub · QL-191</p>
          <h1>Communications command centre</h1>
          <p>One operator console for Rosie Dazzlers, Devil n Dove, iCamp and YW.</p>
        </div>
        <div className="ql172-status" role="status">
          <strong>DISABLED PREVIEW</strong>
            <span>Only fabricated samples and browser-local demo records. No live integrations.</span>
        </div>
      </header>

      <div className="ql172-layout">
        <aside className="ql172-sidebar" aria-label="Workspace controls">
          <div className="ql172-brand-group" role="group" aria-label="Active company context">
            <h2>Company</h2>
            {operatorOrganizations.map((entry) => (
              <button
                className={entry.id === organizationId ? 'ql172-brand active' : 'ql172-brand'}
                key={entry.id}
                type="button"
                aria-pressed={entry.id === organizationId}
                onClick={() => changeOrganization(entry.id)}
              >
                <span>{entry.name}</span>
                <small>{entry.businessType}</small>
              </button>
            ))}
          </div>
          <nav className="ql172-navigation" aria-label="Operator workspaces">
            <h2>Workspaces</h2>
            {workspaces.map((entry) => (
              <button
                className={entry.id === workspace ? 'ql172-nav-button active' : 'ql172-nav-button'}
                type="button"
                key={entry.id}
                aria-current={entry.id === workspace ? 'page' : undefined}
                aria-controls="ql172-workspace"
                onClick={() => setWorkspace(entry.id)}
              >
                <strong>{entry.label}</strong>
                <small>{entry.description}</small>
              </button>
            ))}
          </nav>
          <p className="ql172-sidebar-warning">No live calls, SMS, owner approvals, or customer-data processing is authorized.</p>
        </aside>

        <main id="ql172-workspace" tabIndex={-1} className="ql172-main" aria-label="Selected operator workspace">
          <div className="ql172-context">
            <div>
              <p className="ql172-kicker" aria-live="polite" aria-atomic="true">{organization.name} · {activeWorkspace.label}</p>
              <h2 tabIndex={-1} ref={headingRef}>{activeWorkspace.label}</h2>
              <p>{activeWorkspace.description}</p>
            </div>
            <span className="ql172-context-badge">Preview only · no dispatch</span>
          </div>
          {workspace === 'dashboard' && <Ql191OperatorDashboard key={`dashboard-${organization.id}`} organization={organization} onNavigate={setWorkspace} />}
          {workspace === 'inbox' && (
            <>
              <p className="ql172-local-warning" role="note">QL-192 is a synthetic unified inbox. Do not enter real names, phone numbers, messages, or owner decisions. No communications are sent or saved.</p>
              <Ql192UnifiedInbox key={`unified-inbox-${organization.id}-${threadJump ?? 'default'}`} organization={organization} initialThreadId={threadJump} onOpenContact={openCustomer} onOpenQueue={openQueue} onOpenComposer={openComposer} />
              {brandId !== null && (
                <section className="ql192-legacy-tools" aria-label="Historical browser-local inbox tools">
                  <button type="button" aria-expanded={showLegacyTools} aria-controls="ql192-legacy-panel" onClick={() => setShowLegacyTools((open) => !open)}>{showLegacyTools ? 'Hide' : 'Open'} historical QL-004 local demo tools</button>
                  {showLegacyTools && (
                    <div id="ql192-legacy-panel">
                      <p className="ql172-local-warning" role="note">Historical QL-004 browser-local demonstration. Any edits or exports affect only local demo records. Do not enter personal information.</p>
                      <App activeBrandId={brandId} onBrandChange={changeBrand} embedded />
                    </div>
                  )}
                </section>
              )}
            </>
          )}
          {workspace === 'contacts' && <Ql193Customer360 key={`customer-360-${organization.id}-${contactJump ?? 'default'}`} organization={organization} initialContactId={contactJump} onOpenThread={openThread} onOpenQueue={openQueue} />}
          {workspace === 'queue' && <Ql194FollowUpQueue key={`follow-up-queue-${organization.id}-${queueJump ?? 'default'}`} organization={organization} queue={queueState} setQueue={setQueueState} initialThreadId={queueJump} onOpenThread={openThread} onOpenContact={openCustomer} />}
          {workspace === 'phone' && <Ql195PhoneDesk key={`phone-desk-${organization.id}`} organization={organization} onOpenThread={openThread} onOpenQueue={openQueue} />}
          {workspace === 'composer' && <Ql196MessageComposer key={`message-composer-${organization.id}-${composerJump ?? 'default'}`} organization={organization} initialThreadId={composerJump} onOpenThread={openThread} />}
          {workspace === 'calendar' && <Ql197TaskCalendar key={`task-calendar-${organization.id}`} organization={organization} queue={queueState} setQueue={setQueueState} reminderIds={reminderIds} setReminderIds={setReminderIds} onOpenThread={openThread} onOpenQueue={openQueue} />}
          {workspace === 'reports' && <Ql198Reports key={`reports-${organization.id}`} organization={organization} queue={queueState} onNavigate={setWorkspace} />}
          {workspace === 'connectors' && <Ql199ConnectorCentre key={`connectors-${organization.id}`} organization={organization} onOpenThread={openThread} />}
          {workspace === 'samples' && brandId !== null && (
            <>
              <Ql174BrandSafeTriagePreview brandId={brandId} />
              <Ql175ContactContextPreview key={brandId} brandId={brandId} />
              <Ql176ConversationTimelinePreview key={brandId} brandId={brandId} />
              <Ql177BrandIntakeHandoffPreview key={`intake-${brandId}`} brandId={brandId} />
              <Ql178OperatorTaskSimulation key={`tasks-${brandId}`} brandId={brandId} />
              <DisabledInterfacePreview embedded brandId={brandId} onBrandChange={changeBrand} />
            </>
          )}
          {workspace === 'evidence' && <Ql210ApplicationAcceptance key={`acceptance-${organization.id}`} organization={organization} onNavigate={setWorkspace} />}
          {workspace === 'trial' && <Ql211OwnerObservedTrial key={`trial-${organization.id}`} organization={organization} ledger={trialLedger} setLedger={setTrialLedger} onNavigate={setWorkspace} />}
          {workspace === 'repair' && <Ql212RepairEvidenceQueue key={`repair-${organization.id}`} organization={organization} trial={trialLedger} ledger={repairLedger} setLedger={setRepairLedger} onNavigate={setWorkspace} />}
          {workspace === 'review' && <Ql213IndependentReviewPrep key={`review-${organization.id}`} organization={organization} trial={trialLedger} repair={repairLedger} ledger={reviewLedger} setLedger={setReviewLedger} onNavigate={setWorkspace} />}
          {workspace === 'intake' && <Ql214ReviewIntakeHoldRegister key={`intake-${organization.id}`} organization={organization} trial={trialLedger} repair={repairLedger} review={reviewLedger} ledger={intakeLedger} setLedger={setIntakeLedger} onNavigate={setWorkspace} />}
          {workspace === 'audit' && <Ql215FollowUpAgingHoldAudit key={`audit-${organization.id}`} organization={organization} trial={trialLedger} repair={repairLedger} review={reviewLedger} intake={intakeLedger} ledger={auditLedger} setLedger={setAuditLedger} onNavigate={setWorkspace} />}
          {workspace === 'handoff' && <Ql216EscalationHandoffAudit key={`handoff-${organization.id}`} organization={organization} trial={trialLedger} repair={repairLedger} review={reviewLedger} intake={intakeLedger} audit={auditLedger} packets={handoffLedger} setPackets={setHandoffLedger} onNavigate={setWorkspace} />}
          {workspace === 'evidence' && brandId !== null && (
            <>
              <Ql190IndependentReviewPacketPreview key={`prepilot-packet-${brandId}`} brandId={brandId} />
              <Ql186ConsentMessageClassificationPreview key={`consent-message-${brandId}`} brandId={brandId} />
              <Ql185PrivateDataBlueprintPreview key={`private-data-${brandId}`} brandId={brandId} />
              <Ql184BrandWorkspacePermissionPreview key={`permission-${brandId}`} brandId={brandId} />
              <Ql183OperatorUsabilityPreview key={`usability-${brandId}`} brandId={brandId}
                feedback={usabilityFeedback} onFeedbackChange={setUsabilityFeedback} />
              <Ql182SyntheticJourneyPreview key={`journey-${brandId}`} brandId={brandId} />
              <Ql181PrivacyPilotGatePreview key={`privacy-${brandId}`} brandId={brandId} />
              <Ql093SafeReadPreview embedded brandId={brandId} onBrandChange={changeBrand} />
            </>
          )}
          {workspace === 'telephony' && brandId !== null && (
            <>
              <Ql189OperationsSafetyPreview key={`operations-safety-${brandId}`} brandId={brandId} />
              <Ql188SecurityHarnessPreview key={`security-harness-${brandId}`} brandId={brandId} />
              <Ql187ProviderCostPreview key={`provider-cost-${brandId}`} brandId={brandId} />
              <Ql179PhoneSmsEventEmulator key={`phone-sms-${brandId}`} brandId={brandId} />
              <Ql180RoutingIvrPreview key={`ivr-${brandId}`} brandId={brandId} />
              <DisabledOperatorConsole embedded />
            </>
          )}
          {workspace !== 'dashboard' && workspace !== 'inbox' && workspace !== 'contacts' && workspace !== 'queue' && workspace !== 'phone' && workspace !== 'composer' && workspace !== 'calendar' && workspace !== 'reports' && workspace !== 'connectors' && workspace !== 'evidence' && workspace !== 'trial' && workspace !== 'repair' && workspace !== 'review' && workspace !== 'intake' && workspace !== 'audit' && brandId === null && (
            <Ql191AdditionalOrganizationPreview key={`additional-${organization.id}-${workspace}`} organization={organization} workspace={workspace} />
          )}
        </main>
      </div>
    </div>
  );
}

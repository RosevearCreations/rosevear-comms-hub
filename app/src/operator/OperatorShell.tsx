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
import { emptyInboxTriagePresets, type InboxTriagePresets } from './ql292InboxTriage';
import { Ql193Customer360 } from './Ql193Customer360';
import { Ql194FollowUpQueue } from './Ql194FollowUpQueue';
import { ql294Shortcut } from './ql294OperatorWorklist';
import { Ql195PhoneDesk } from './Ql195PhoneDesk';
import { Ql196MessageComposer } from './Ql196MessageComposer';
import { discardQl293Draft, stageQl293Draft, type Ql293SessionDrafts } from './ql293ConversationRecovery';
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
import { Ql217OwnerEvidenceReassessment } from './Ql217OwnerEvidenceReassessment';
import { type Ql217Ledger } from './ql217OwnerReassessment';
import { Ql218RecurrenceHoldFollowUp } from './Ql218RecurrenceHoldFollowUp';
import { type Ql218Ledger } from './ql218RecurrenceAudit';
import { Ql219ClosureReadiness } from './Ql219ClosureReadiness';
import { type Ql219Ledger } from './ql219OutcomeReconciliation';
import { Ql220ReopenMonitor } from './Ql220ReopenMonitor';
import { type Ql220Ledger } from './ql220ReopenMonitoring';
import { Ql221EvidenceRefresh } from './Ql221EvidenceRefresh';
import { type Ql221Ledger } from './ql221EvidenceRefresh';
import { Ql222OwnerDecisionAudit } from './Ql222OwnerDecisionAudit';
import { type Ql222Ledger } from './ql222ExceptionRecurrence';
import { Ql223DecisionAgingAudit } from './Ql223DecisionAgingAudit';
import { type Ql223Ledger } from './ql223DecisionAging';
import { Ql224OverdueHoldAudit } from './Ql224OverdueHoldAudit';
import { type Ql224Ledger } from './ql224OverdueEscalation';
import { Ql225DispositionAudit } from './Ql225DispositionAudit';
import { type Ql225Ledger } from './ql225EvidenceDisposition';
import { Ql226RecurrenceReopenAudit } from './Ql226RecurrenceReopenAudit';
import { type Ql226Ledger } from './ql226RecurrenceReopen';
import { Ql227DecisionEvidenceAudit } from './Ql227DecisionEvidenceAudit';
import { type Ql227Ledger } from './ql227DecisionEvidenceAudit';
import { Ql228HandoffContinuityAudit } from './Ql228HandoffContinuityAudit';
import { type Ql228Ledger } from './ql228HandoffContinuity';
import { Ql229ReassignmentAudit } from './Ql229ReassignmentAudit';
import { type Ql229Ledger } from './ql229ReassignmentAudit';
import { Ql230ReviewerContinuityAudit } from './Ql230ReviewerContinuityAudit';
import { type Ql230Ledger } from './ql230ReviewerContinuity';
import { Ql231DispositionOversight } from './Ql231DispositionOversight';
import { type Ql231Ledger } from './ql231DispositionOversight';
import { Ql232EscalationProofAudit } from './Ql232EscalationProofAudit';
import { type Ql232Ledger } from './ql232EscalationProof';
import { Ql233FollowUpIntegrityAudit } from './Ql233FollowUpIntegrityAudit';
import { type Ql233Ledger } from './ql233FollowUpIntegrity';
import { Ql234SourceDriftContinuityAudit } from './Ql234SourceDriftContinuityAudit';
import { type Ql234Ledger } from './ql234SourceDriftContinuity';
import { Ql235RenewalWatchAudit } from './Ql235RenewalWatchAudit';
import { type Ql235Ledger } from './ql235RenewalWatch';
import { Ql236ReceiptHandoffAudit } from './Ql236ReceiptHandoffAudit';
import { type Ql236Ledger } from './ql236ReceiptHandoff';
import { Ql237IntegrationOptions } from './Ql237IntegrationOptions';
import { Ql238HandshakeReadiness } from './Ql238HandshakeReadiness';
import { type Ql238Ledger } from './ql238HandshakeReadiness';
import { Ql239GatewayProofReview } from './Ql239GatewayProofReview';
import { type Ql239Ledger } from './ql239GatewayProofReview';
import { Ql240PilotDecision } from './Ql240PilotDecision';
import { type Ql240Ledger } from './ql240PilotDecision';
import { Ql241ExternalProofReadiness } from './Ql241ExternalProofReadiness';
import { type Ql241Ledger } from './ql241ExternalProofReadiness';
import { Ql242OwnerSignedRollout } from './Ql242OwnerSignedRollout';
import { type Ql242Ledger } from './ql242OwnerSignedRollout';
import { Ql243ConnectionTesting } from './Ql243ConnectionTesting';
import { type Ql243Ledger } from './ql243ConnectionTesting';
import { Ql244WitnessedHandshake } from './Ql244WitnessedHandshake';
import { type Ql244Ledger } from './ql244WitnessedHandshake';
import { Ql245SixAppEvidence } from './Ql245SixAppEvidence';
import { Ql270Connections } from './Ql270Connections';
import { Ql271CommandSurfaces, type Ql271CommandMode } from './Ql271CommandSurfaces';
import { type Ql245Ledger } from './ql245SixAppEvidence';
import { seedQueueForOrganization, type MockQueueState } from './ql194WorkQueue';
import { findOperatorOrganization, initialOperatorOrganization, operatorOrganizations, type OperatorWorkspace, type OrganizationId } from './ql191Organizations';
import { Ql093SafeReadPreview } from './Ql093SafeReadPreview';
import type { Ql183Feedback } from './ql183OperatorUsabilityAcceptance';
import './operator-shell.css';

const workspaces: ReadonlyArray<{ id: OperatorWorkspace; label: string; description: string }> = [
  { id: 'dashboard', label: 'Dashboard', description: 'Company overview, synthetic activity and quick navigation' },
  { id: 'connections', label: 'Connections · six apps', description: 'Six-app topology, nonproduction TEST profile planning, public proof status and the independent GET release gates' },
  { id: 'it_command', label: 'IT Command', description: 'Six-app source registry, independent proof status and safe connection release controls' },
  { id: 'management', label: 'Management', description: 'Four isolated company workspaces, staff-free sample workload and pilot safeguards' },
  { id: 'analytics', label: 'Analytics & statistics', description: 'Graphical synthetic activity breakdowns and actual six-app approval funnel' },
  { id: 'system_status', label: 'System status', description: 'Original Proof-B source ledger, runtime switches and reversible integration HOLD monitoring' },
  { id: 'inbox', label: 'Unified inbox', description: 'Company-scoped multi-channel threads, filters and review-only timelines' },
  { id: 'contacts', label: 'Customer 360', description: 'Explicitly linked fictional customer context and cross-channel history' },
  { id: 'queue', label: 'Assignments & follow-ups', description: 'Fictional owners, due windows, triage and conversation-linked sample tasks' },
  { id: 'phone', label: 'Phone desk', description: 'Mock keypad, missed calls, voicemail descriptions and business-line review' },
  { id: 'composer', label: 'SMS/MMS composer', description: 'Unsent message templates, attachment placeholders, consent and opt-out controls' },
  { id: 'calendar', label: 'Tasks & calendar', description: 'Fictional calendar board, task schedule and local reminder rehearsals' },
  { id: 'reports', label: 'Reporting centre', description: 'Fictional communication breakdowns and session-only task totals' },
  { id: 'connectors', label: 'Connector centre', description: 'Company-scoped mock integration contracts, gates and mapping rehearsals' },
  { id: 'integration_options', label: 'Free phone options & integration v1', description: 'Research-backed free option limits, shared integration handoff and safe four-business gateway event tests' },
  { id: 'handshake_readiness', label: 'Gateway handshake & tenant gate', description: 'Four-company fictional v1 health/capabilities handshake, tenant denial proofs and unverified no-dispatch evidence' },
  { id: 'gateway_proof_review', label: 'Gateway proof intake & rotation', description: 'Four-company read-only source proof intake, invented-key rotation checklist and independent HELD review' },
  { id: 'receipt_pilot_gate', label: 'Nonproduction receipts & pilot HOLD', description: 'Pinned-key nonproduction evidence reconciliation, separate audit draft and owner-safe read-only pilot candidate HOLD' },
  { id: 'external_proof_readiness', label: 'External GET proof & owner HOLD', description: 'Sanitized nonproduction GET report, separately pinned public-key evidence and Devil n Dove owner authorization request draft' },
  { id: 'owner_signed_rollout', label: 'Gateway audit & rollback HOLD', description: 'Two independently pinned signatures, owner rehearsal-request receipt and locally reversible read-only rollout simulation' },
  { id: 'connection_testing', label: 'Secure gateway connection tests HOLD', description: 'Six-app server-only nonproduction handshake evidence, independent owner-identity claims, audit retrieval and release blockers' },
  { id: 'witnessed_handshake_review', label: 'Witnessed handshake & pilot HOLD', description: 'Six-app non-secret credential records, separately signed witness review and owner conditional decision HOLD' },
  { id: 'six_app_evidence', label: 'Six-app evidence & activation HOLD', description: 'Owner handoff claims, source-specific receipt exceptions, signed six-app review and explicit read-only pilot blockers' },
  { id: 'samples', label: 'Synthetic conversations', description: 'Brand-safe triage, unsent drafts, mock intake handoffs and follow-up tasks' },
  { id: 'evidence', label: 'Safety & hold review', description: 'Four-company preview acceptance, synthetic evidence and unresolved pilot prerequisites' },
  { id: 'trial', label: 'Owner trial & gap triage', description: 'Guided four-company manual preview observations, mobile review and prioritized gap follow-up' },
  { id: 'repair', label: 'Finding replay & repair queue', description: 'Synthetic trial-finding replay, session-only repair evidence drafts and manual retest holds' },
  { id: 'review', label: 'Retest comparison & review prep', description: 'Before/after mock replay evidence, independent-review checklist drafts and unresolved closure risks' },
  { id: 'intake', label: 'Independent review intake & holds', description: 'Fictional reviewer intake, evidence gap follow-up and conditional release hold register' },
  { id: 'audit', label: 'Reviewer follow-up aging & hold audit', description: 'Simulated gap-aging cycles, stale source reconciliation and read-only release hold continuity' },
  { id: 'handoff', label: 'Escalation replay & owner-safe handoff', description: 'Source-linked fictional escalations, locally prepared review packets and unchanged release holds' },
  { id: 'reassessment', label: 'Owner handoff & evidence reassessment', description: 'Source-linked fictional decision-aging cycles and unverified independent-evidence reassessment' },
  { id: 'recurrence', label: 'Recurrence replay & conditional holds', description: 'Four-company fictional exception recurrence, owner-decision replay and hold follow-up audit' },
  { id: 'closure', label: 'Outcome reconciliation & closure readiness', description: 'Four-company source-linked fictional outcomes and unverified independent-closure review packets' },
  { id: 'reopen', label: 'Reopen exceptions & owner follow-up audit', description: 'Four-company fictional independent-review reopen, follow-up aging and blocked closure audit' },
  { id: 'refresh', label: 'Evidence refresh & hold continuity audit', description: 'Four-company reopened exception source refresh, simulated reassessment and unaltered release holds' },
  { id: 'exception', label: 'Exception recurrence & owner decisions', description: 'Four-company synthetic recurrence replay, owner draft follow-up and independent release hold recheck' },
  { id: 'aging', label: 'Owner decision aging & conditional holds', description: 'Four-company fictional decision aging, follow-up evidence exceptions and release-hold oversight' },
  { id: 'overdue', label: 'Overdue escalation & hold continuity', description: 'Four-company fictional overdue owner follow-up, evidence reconciliation and independent release holds' },
  { id: 'disposition', label: 'Evidence disposition & held-release reassessment', description: 'Four-company fictional independent evidence dispositions, escalation outcome aging and blocked release recheck' },
  { id: 'reopen_review', label: 'Independent recurrence & owner reopen', description: 'Four-company fictional evidence-disposition recurrence, reopened owner follow-up and conditional release hold recheck' },
  { id: 'evidence_audit', label: 'Owner aging & independent evidence audit', description: 'Four-company fictional reopened owner-decision aging, independent evidence reconciliation and held-release audit' },
  { id: 'handoff_continuity', label: 'Evidence recurrence & handoff continuity', description: 'Four-company fictional evidence exception recurrence, independent handoff follow-up and blocked conditional release' },
  { id: 'reassignment_audit', label: 'Reassignment aging & hold reassessment', description: 'Four-company fictional independent handoff aging, reassignment outcome reconciliation and conditional release hold recheck' },
  { id: 'reviewer_continuity', label: 'Reviewer recurrence & hold continuity', description: 'Four-company fictional reassignment follow-up recurrence, reviewer decision aging and conditional hold continuity audit' },
  { id: 'disposition_oversight', label: 'Reviewer disposition & evidence recheck', description: 'Four-company fictional reviewer recurrence disposition, overdue evidence recheck and conditional held-release exception oversight' },
  { id: 'escalation_proof', label: 'Escalation outcomes & held proof', description: 'Four-company fictional overdue recheck escalation outcomes, independent disposition recurrence and unchanged hold-proof revalidation' },
  { id: 'held_integrity', label: 'Exception follow-up & pilot integrity', description: 'Four-company fictional escalation proof follow-up aging, independent decision reassessment and blocked held-pilot integrity audit' },
  { id: 'source_drift', label: 'Source drift & release continuity', description: 'Four-company fictional held-pilot evidence drift, independent reassessment continuity and unchanged conditional release hold proof' },
  { id: 'renewal_watch', label: 'Independent renewal & hold watch', description: 'Four-company fictional reopened drift aging, independent renewal follow-up and unchanged held-pilot release gate audit' },
  { id: 'receipt_handoff', label: 'Receipt handoff & overdue continuity', description: 'Four-company fictional renewal receipt aging, independent handoff exceptions and conditional held-release proof continuity' },
  { id: 'telephony', label: 'Phone/SMS safety', description: 'Mock-only phone/SMS event emulator, replay and disabled provider safeguards' }
];

/** Compact navigation: keep every historical screen but hide deep audits in
 * collapsed categories until requested. No permission or feature is removed. */
const NAVIGATION_GROUPS = [
  {id:'operations',label:'Operations',hint:'Daily workspaces',primary:true,
    ids:['dashboard','inbox','contacts','queue','phone','composer','calendar','reports']},
  {id:'it',label:'IT & Connections',hint:'Six-app setup and evidence',primary:true,
    ids:['it_command','connections','connectors','six_app_evidence','connection_testing','integration_options']},
  {id:'admin',label:'Management & Reviews',hint:'Company oversight, safety, trial and audits',primary:false,
    ids:['management','evidence','trial','review','audit']},
  {id:'insights',label:'Analytics & Status',hint:'Statistics and six-app safety',primary:true,
    ids:['analytics','system_status']},
  {id:'archive',label:'Advanced / Historical',hint:'Older technical and audit workspaces',primary:false,
    ids:workspaces.filter(entry=>!new Set([
      'dashboard','inbox','contacts','queue','phone','composer','calendar','reports',
      'it_command','connections','connectors','six_app_evidence','connection_testing','integration_options',
      'management','evidence','trial','review','audit','analytics','system_status'
    ]).has(entry.id)).map(entry=>entry.id)}
] as const;

const QL271_COMMAND_WORKSPACES: ReadonlySet<OperatorWorkspace> = new Set([
  'it_command', 'management', 'analytics', 'system_status'
]);

const firstOrganization = initialOperatorOrganization(import.meta.env.VITE_DEFAULT_BRAND).id;

export function OperatorShell() {
  const [organizationId, setOrganizationId] = useState<OrganizationId>(firstOrganization);
  const [usabilityFeedback, setUsabilityFeedback] = useState<Record<string, Ql183Feedback>>({});
  const [showLegacyTools, setShowLegacyTools] = useState(false);
  const [workspace, setWorkspace] = useState<OperatorWorkspace>('dashboard');
  const [navigationSearch,setNavigationSearch] = useState('');
  const [contactJump, setContactJump] = useState<string | null>(null);
  const [threadJump, setThreadJump] = useState<string | null>(null);
  const [queueJump, setQueueJump] = useState<string | null>(null);
  const [composerJump, setComposerJump] = useState<string | null>(null);
  const [queueState, setQueueState] = useState<MockQueueState>(() => seedQueueForOrganization(firstOrganization));
  const [inboxTriagePresets, setInboxTriagePresets] = useState<InboxTriagePresets>(emptyInboxTriagePresets);
  const [composerDrafts, setComposerDrafts] = useState<Ql293SessionDrafts>({});
  const [trialLedger, setTrialLedger] = useState<Ql211Ledger>({});
  const [repairLedger, setRepairLedger] = useState<Ql212Ledger>({});
  const [reviewLedger, setReviewLedger] = useState<Ql213Ledger>({});
  const [intakeLedger, setIntakeLedger] = useState<Ql214Ledger>({});
  const [auditLedger, setAuditLedger] = useState<Ql215Ledger>({});
  const [handoffLedger, setHandoffLedger] = useState<Ql216Ledger>({});
  const [reassessmentLedger, setReassessmentLedger] = useState<Ql217Ledger>({});
  const [recurrenceLedger, setRecurrenceLedger] = useState<Ql218Ledger>({});
  const [closureLedger, setClosureLedger] = useState<Ql219Ledger>({});
  const [reopenLedger, setReopenLedger] = useState<Ql220Ledger>({});
  const [refreshLedger, setRefreshLedger] = useState<Ql221Ledger>({});
  const [exceptionLedger, setExceptionLedger] = useState<Ql222Ledger>({});
  const [agingLedger, setAgingLedger] = useState<Ql223Ledger>({});
  const [overdueLedger, setOverdueLedger] = useState<Ql224Ledger>({});
  const [dispositionLedger, setDispositionLedger] = useState<Ql225Ledger>({});
  const [reopenReviewLedger, setReopenReviewLedger] = useState<Ql226Ledger>({});
  const [evidenceAuditLedger, setEvidenceAuditLedger] = useState<Ql227Ledger>({});
  const [handoffContinuityLedger, setHandoffContinuityLedger] = useState<Ql228Ledger>({});
  const [reassignmentAuditLedger, setReassignmentAuditLedger] = useState<Ql229Ledger>({});
  const [reviewerContinuityLedger, setReviewerContinuityLedger] = useState<Ql230Ledger>({});
  const [dispositionOversightLedger, setDispositionOversightLedger] = useState<Ql231Ledger>({});
  const [escalationProofLedger, setEscalationProofLedger] = useState<Ql232Ledger>({});
  const [heldIntegrityLedger, setHeldIntegrityLedger] = useState<Ql233Ledger>({});
  const [sourceDriftLedger, setSourceDriftLedger] = useState<Ql234Ledger>({});
  const [renewalWatchLedger, setRenewalWatchLedger] = useState<Ql235Ledger>({});
  const [receiptHandoffLedger, setReceiptHandoffLedger] = useState<Ql236Ledger>({});
  const [ql238Ledger, setQl238Ledger] = useState<Ql238Ledger>({});
  const [ql239Ledger, setQl239Ledger] = useState<Ql239Ledger>({});
  const [ql240Ledger, setQl240Ledger] = useState<Ql240Ledger>({});
  const [ql241Ledger, setQl241Ledger] = useState<Ql241Ledger>({});
  const [ql242Ledger, setQl242Ledger] = useState<Ql242Ledger>({});
  const [ql243Ledger, setQl243Ledger] = useState<Ql243Ledger>({});
  const [ql244Ledger, setQl244Ledger] = useState<Ql244Ledger>({});
  const [ql245Ledger, setQl245Ledger] = useState<Ql245Ledger>({});
  const [reminderIds, setReminderIds] = useState<ReadonlySet<string>>(() => new Set());
  const organization = findOperatorOrganization(organizationId) ?? operatorOrganizations[0];
  const brandId = organization.legacyBrandId;
  const activeWorkspace = workspaces.find((entry) => entry.id === workspace) ?? workspaces[0];
  const commandWorkspace = QL271_COMMAND_WORKSPACES.has(workspace);
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
      setInboxTriagePresets(emptyInboxTriagePresets());
      setComposerDrafts({});
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

  useEffect(() => {
    function handleWorklistNavigation(event: KeyboardEvent) {
      if (ql294Shortcut(event) !== 'queue') return;
      event.preventDefault();
      setWorkspace('queue');
    }
    window.addEventListener('keydown', handleWorklistNavigation);
    return () => window.removeEventListener('keydown', handleWorklistNavigation);
  }, []);

  return (
    <div className="ql172-shell" data-organization={organization.id} data-ql191-release="ql191-four-organization-console-v2" data-ql270-shell="categorized" data-ql271-command={commandWorkspace?'true':'false'}>
      <a className="ql172-skip-link" href="#ql172-workspace">Skip to operator workspace</a>
      <header className="ql172-header">
        <div>
          <p className="ql172-kicker">◆ Rosevear Comms Hub · QL-294</p>
          <h1>Communications Command Centre</h1>
          <p>One control surface · four businesses · two supporting systems.</p>
        </div>
        <div className="ql172-status" role="status">
          <strong>DISABLED PREVIEW</strong>
            <span>Only fabricated samples and browser-local demo records. No live integrations.</span>
        </div>
      </header>

      <div className="ql172-layout">
        <aside className="ql172-sidebar" aria-label="Workspace controls">
          <div className="ql172-brand-group" role="group" aria-label="Active company context">
            <h2>Active business</h2>
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
            <label className="ql172-nav-search-label" htmlFor="ql172-nav-search">Find a workspace</label>
            <input id="ql172-nav-search" className="ql172-nav-search" type="search"
              placeholder="Search tools…" value={navigationSearch}
              onChange={event=>setNavigationSearch(event.currentTarget.value)} />
            {NAVIGATION_GROUPS.map(group=>{
              const groupItems=workspaces.filter(entry=>group.ids.some(id=>id===entry.id)&&
                (!navigationSearch.trim()||`${entry.label} ${entry.description}`.toLowerCase()
                  .includes(navigationSearch.trim().toLowerCase())));
              if(!groupItems.length)return null;
              return <details className="ql172-nav-group" key={group.id}
                open={navigationSearch.trim()?true:group.primary}>
                <summary><span>{group.label}</span><small>{groupItems.length}</small></summary>
                <div className="ql172-nav-items">
                  {groupItems.map(entry=><button
                    className={entry.id===workspace?'ql172-nav-button active':'ql172-nav-button'}
                    type="button" key={entry.id}
                    aria-current={entry.id===workspace?'page':undefined}
                    aria-controls="ql172-workspace" title={entry.description}
                    onClick={()=>setWorkspace(entry.id)}>
                    <strong>{entry.label}</strong><small>{entry.description}</small>
                  </button>)}
                </div>
              </details>;
            })}
          </nav>
          <p className="ql172-sidebar-warning"><kbd>Alt + Shift + Q</kbd> opens assignment worklists. Use ⓘ Help there for focus and handoff shortcuts; shortcuts do not operate inside typing fields.</p>
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
          {workspace === 'connections' && <Ql270Connections onNavigate={setWorkspace} />}
          {commandWorkspace && <Ql271CommandSurfaces mode={workspace as Ql271CommandMode} organizationId={organization.id} onNavigate={setWorkspace} onSelectOrganization={changeOrganization} />}
          {workspace === 'inbox' && (
            <>
              <p className="ql172-local-warning" role="note">QL-192 is a synthetic unified inbox. Do not enter real names, phone numbers, messages, or owner decisions. No communications are sent or saved.</p>
              <Ql192UnifiedInbox key={`unified-inbox-${organization.id}-${threadJump ?? 'default'}`} organization={organization} initialThreadId={threadJump} onOpenContact={openCustomer} onOpenQueue={openQueue} onOpenComposer={openComposer} presets={inboxTriagePresets} onSavePreset={(slot, preset) => setInboxTriagePresets((previous) => ({ ...previous, [slot]: preset }))} />
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
          {workspace === 'composer' && <Ql196MessageComposer key={`message-composer-${organization.id}-${composerJump ?? 'default'}`} organization={organization} initialThreadId={composerJump} onOpenThread={openThread} sessionDrafts={composerDrafts} onStageDraft={(draft) => setComposerDrafts((previous) => stageQl293Draft(previous, organization.id, draft))} onDiscardDraft={(threadId) => setComposerDrafts((previous) => discardQl293Draft(previous, organization.id, threadId))} />}
          {workspace === 'calendar' && <Ql197TaskCalendar key={`task-calendar-${organization.id}`} organization={organization} queue={queueState} setQueue={setQueueState} reminderIds={reminderIds} setReminderIds={setReminderIds} onOpenThread={openThread} onOpenQueue={openQueue} />}
          {workspace === 'reports' && <Ql198Reports key={`reports-${organization.id}`} organization={organization} queue={queueState} onNavigate={setWorkspace} />}
          {workspace === 'connectors' && <Ql199ConnectorCentre key={`connectors-${organization.id}`} organization={organization} onOpenThread={openThread} />}
          {workspace === 'integration_options' && <Ql237IntegrationOptions key={'integration-v1-' + organization.id} organization={organization} />}
          {workspace === 'handshake_readiness' && <Ql238HandshakeReadiness key={'handshake-v1-' + organization.id} organization={organization} ledger={ql238Ledger} setLedger={setQl238Ledger} onNavigate={setWorkspace} />}
          {workspace === 'gateway_proof_review' && <Ql239GatewayProofReview key={'gateway-proof-v1-' + organization.id} organization={organization} ledger={ql239Ledger} setLedger={setQl239Ledger} onNavigate={setWorkspace} />}
          {workspace === 'receipt_pilot_gate' && <Ql240PilotDecision key={'receipt-pilot-v1-' + organization.id} organization={organization} sourceLedger={ql239Ledger} ledger={ql240Ledger} setLedger={setQl240Ledger} onNavigate={setWorkspace} />}
          {workspace === 'external_proof_readiness' && <Ql241ExternalProofReadiness key={'external-proof-v1-' + organization.id} organization={organization} sourceLedger={ql239Ledger} auditLedger={ql240Ledger} ledger={ql241Ledger} setLedger={setQl241Ledger} onNavigate={setWorkspace} />}
          {workspace === 'owner_signed_rollout' && <Ql242OwnerSignedRollout key={'owner-rollout-v1-' + organization.id} organization={organization} source={ql239Ledger} audit={ql240Ledger} external={ql241Ledger} ledger={ql242Ledger} setLedger={setQl242Ledger} onNavigate={setWorkspace} />}
          {workspace === 'connection_testing' && <Ql243ConnectionTesting key={'connection-testing-v1-' + organization.id} organization={organization} source={ql239Ledger} audit={ql240Ledger} external={ql241Ledger} ownerRollout={ql242Ledger} ledger={ql243Ledger} setLedger={setQl243Ledger} onNavigate={setWorkspace} />}
          {workspace === 'witnessed_handshake_review' && <Ql244WitnessedHandshake key={'witnessed-handshake-v1-' + organization.id} organization={organization} source={ql239Ledger} audit={ql240Ledger} external={ql241Ledger} ownerRollout={ql242Ledger} connectionTests={ql243Ledger} ledger={ql244Ledger} setLedger={setQl244Ledger} onNavigate={setWorkspace} />}
          {workspace === 'six_app_evidence' && <Ql245SixAppEvidence key={'six-app-evidence-v1-' + organization.id} organization={organization} source={ql239Ledger} audit={ql240Ledger} external={ql241Ledger} ownerRollout={ql242Ledger} connectionTests={ql243Ledger} witnessed={ql244Ledger} ledger={ql245Ledger} setLedger={setQl245Ledger} onNavigate={setWorkspace} />}
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
          {workspace === 'reassessment' && <Ql217OwnerEvidenceReassessment key={`reassessment-${organization.id}`} organization={organization} trial={trialLedger} repair={repairLedger} review={reviewLedger} intake={intakeLedger} audit={auditLedger} handoff={handoffLedger} ledger={reassessmentLedger} setLedger={setReassessmentLedger} onNavigate={setWorkspace} />}
          {workspace === 'recurrence' && <Ql218RecurrenceHoldFollowUp key={`recurrence-${organization.id}`} organization={organization} sources={{ trial: trialLedger, repair: repairLedger, review: reviewLedger, intake: intakeLedger, audit: auditLedger, handoff: handoffLedger, reassessment: reassessmentLedger }} ledger={recurrenceLedger} setLedger={setRecurrenceLedger} onNavigate={setWorkspace} />}
          {workspace === 'closure' && <Ql219ClosureReadiness key={`closure-${organization.id}`} organization={organization} sources={{ trial: trialLedger, repair: repairLedger, review: reviewLedger, intake: intakeLedger, audit: auditLedger, handoff: handoffLedger, reassessment: reassessmentLedger, recurrence: recurrenceLedger }} ledger={closureLedger} setLedger={setClosureLedger} onNavigate={setWorkspace} />}
          {workspace === 'reopen' && <Ql220ReopenMonitor key={`reopen-${organization.id}`} organization={organization} sources={{ trial: trialLedger, repair: repairLedger, review: reviewLedger, intake: intakeLedger, audit: auditLedger, handoff: handoffLedger, reassessment: reassessmentLedger, recurrence: recurrenceLedger, closure: closureLedger }} ledger={reopenLedger} setLedger={setReopenLedger} onNavigate={setWorkspace} />}
          {workspace === 'refresh' && <Ql221EvidenceRefresh key={`refresh-${organization.id}`} organization={organization} sources={{ trial: trialLedger, repair: repairLedger, review: reviewLedger, intake: intakeLedger, audit: auditLedger, handoff: handoffLedger, reassessment: reassessmentLedger, recurrence: recurrenceLedger, closure: closureLedger, reopen: reopenLedger }} ledger={refreshLedger} setLedger={setRefreshLedger} onNavigate={setWorkspace} />}
          {workspace === 'exception' && <Ql222OwnerDecisionAudit key={`exception-${organization.id}`} organization={organization} sources={{ trial: trialLedger, repair: repairLedger, review: reviewLedger, intake: intakeLedger, audit: auditLedger, handoff: handoffLedger, reassessment: reassessmentLedger, recurrence: recurrenceLedger, closure: closureLedger, reopen: reopenLedger, refresh: refreshLedger }} ledger={exceptionLedger} setLedger={setExceptionLedger} onNavigate={setWorkspace} />}
          {workspace === 'aging' && <Ql223DecisionAgingAudit key={`aging-${organization.id}`} organization={organization} sources={{ trial: trialLedger, repair: repairLedger, review: reviewLedger, intake: intakeLedger, audit: auditLedger, handoff: handoffLedger, reassessment: reassessmentLedger, recurrence: recurrenceLedger, closure: closureLedger, reopen: reopenLedger, refresh: refreshLedger, exception: exceptionLedger }} ledger={agingLedger} setLedger={setAgingLedger} onNavigate={setWorkspace} />}
          {workspace === 'overdue' && <Ql224OverdueHoldAudit key={`overdue-${organization.id}`} organization={organization} sources={{ trial: trialLedger, repair: repairLedger, review: reviewLedger, intake: intakeLedger, audit: auditLedger, handoff: handoffLedger, reassessment: reassessmentLedger, recurrence: recurrenceLedger, closure: closureLedger, reopen: reopenLedger, refresh: refreshLedger, exception: exceptionLedger, aging: agingLedger }} ledger={overdueLedger} setLedger={setOverdueLedger} onNavigate={setWorkspace} />}
          {workspace === 'disposition' && <Ql225DispositionAudit key={`disposition-${organization.id}`} organization={organization} sources={{ trial: trialLedger, repair: repairLedger, review: reviewLedger, intake: intakeLedger, audit: auditLedger, handoff: handoffLedger, reassessment: reassessmentLedger, recurrence: recurrenceLedger, closure: closureLedger, reopen: reopenLedger, refresh: refreshLedger, exception: exceptionLedger, aging: agingLedger, overdue: overdueLedger }} ledger={dispositionLedger} setLedger={setDispositionLedger} onNavigate={setWorkspace} />}
          {workspace === 'reopen_review' && <Ql226RecurrenceReopenAudit key={`reopen-review-${organization.id}`} organization={organization} sources={{ trial: trialLedger, repair: repairLedger, review: reviewLedger, intake: intakeLedger, audit: auditLedger, handoff: handoffLedger, reassessment: reassessmentLedger, recurrence: recurrenceLedger, closure: closureLedger, reopen: reopenLedger, refresh: refreshLedger, exception: exceptionLedger, aging: agingLedger, overdue: overdueLedger, disposition: dispositionLedger }} ledger={reopenReviewLedger} setLedger={setReopenReviewLedger} onNavigate={setWorkspace} />}
          {workspace === 'evidence_audit' && <Ql227DecisionEvidenceAudit key={`evidence-audit-${organization.id}`} organization={organization} sources={{ trial: trialLedger, repair: repairLedger, review: reviewLedger, intake: intakeLedger, audit: auditLedger, handoff: handoffLedger, reassessment: reassessmentLedger, recurrence: recurrenceLedger, closure: closureLedger, reopen: reopenLedger, refresh: refreshLedger, exception: exceptionLedger, aging: agingLedger, overdue: overdueLedger, disposition: dispositionLedger, reopenReview: reopenReviewLedger }} ledger={evidenceAuditLedger} setLedger={setEvidenceAuditLedger} onNavigate={setWorkspace} />}
          {workspace === 'handoff_continuity' && <Ql228HandoffContinuityAudit key={`handoff-continuity-${organization.id}`} organization={organization} sources={{ trial: trialLedger, repair: repairLedger, review: reviewLedger, intake: intakeLedger, audit: auditLedger, handoff: handoffLedger, reassessment: reassessmentLedger, recurrence: recurrenceLedger, closure: closureLedger, reopen: reopenLedger, refresh: refreshLedger, exception: exceptionLedger, aging: agingLedger, overdue: overdueLedger, disposition: dispositionLedger, reopenReview: reopenReviewLedger, evidenceAudit: evidenceAuditLedger }} ledger={handoffContinuityLedger} setLedger={setHandoffContinuityLedger} onNavigate={setWorkspace} />}
          {workspace === 'reassignment_audit' && <Ql229ReassignmentAudit key={`reassignment-audit-${organization.id}`} organization={organization} sources={{ trial: trialLedger, repair: repairLedger, review: reviewLedger, intake: intakeLedger, audit: auditLedger, handoff: handoffLedger, reassessment: reassessmentLedger, recurrence: recurrenceLedger, closure: closureLedger, reopen: reopenLedger, refresh: refreshLedger, exception: exceptionLedger, aging: agingLedger, overdue: overdueLedger, disposition: dispositionLedger, reopenReview: reopenReviewLedger, evidenceAudit: evidenceAuditLedger, handoffContinuity: handoffContinuityLedger }} ledger={reassignmentAuditLedger} setLedger={setReassignmentAuditLedger} onNavigate={setWorkspace} />}
          {workspace === 'reviewer_continuity' && <Ql230ReviewerContinuityAudit key={`reviewer-continuity-${organization.id}`} organization={organization} sources={{ trial: trialLedger, repair: repairLedger, review: reviewLedger, intake: intakeLedger, audit: auditLedger, handoff: handoffLedger, reassessment: reassessmentLedger, recurrence: recurrenceLedger, closure: closureLedger, reopen: reopenLedger, refresh: refreshLedger, exception: exceptionLedger, aging: agingLedger, overdue: overdueLedger, disposition: dispositionLedger, reopenReview: reopenReviewLedger, evidenceAudit: evidenceAuditLedger, handoffContinuity: handoffContinuityLedger, reassignmentAudit: reassignmentAuditLedger }} ledger={reviewerContinuityLedger} setLedger={setReviewerContinuityLedger} onNavigate={setWorkspace} />}
          {workspace === 'disposition_oversight' && <Ql231DispositionOversight key={`disposition-oversight-${organization.id}`} organization={organization} sources={{ trial: trialLedger, repair: repairLedger, review: reviewLedger, intake: intakeLedger, audit: auditLedger, handoff: handoffLedger, reassessment: reassessmentLedger, recurrence: recurrenceLedger, closure: closureLedger, reopen: reopenLedger, refresh: refreshLedger, exception: exceptionLedger, aging: agingLedger, overdue: overdueLedger, disposition: dispositionLedger, reopenReview: reopenReviewLedger, evidenceAudit: evidenceAuditLedger, handoffContinuity: handoffContinuityLedger, reassignmentAudit: reassignmentAuditLedger, reviewerContinuity: reviewerContinuityLedger }} ledger={dispositionOversightLedger} setLedger={setDispositionOversightLedger} onNavigate={setWorkspace} />}
          {workspace === 'escalation_proof' && <Ql232EscalationProofAudit key={`escalation-proof-${organization.id}`} organization={organization} sources={{ trial: trialLedger, repair: repairLedger, review: reviewLedger, intake: intakeLedger, audit: auditLedger, handoff: handoffLedger, reassessment: reassessmentLedger, recurrence: recurrenceLedger, closure: closureLedger, reopen: reopenLedger, refresh: refreshLedger, exception: exceptionLedger, aging: agingLedger, overdue: overdueLedger, disposition: dispositionLedger, reopenReview: reopenReviewLedger, evidenceAudit: evidenceAuditLedger, handoffContinuity: handoffContinuityLedger, reassignmentAudit: reassignmentAuditLedger, reviewerContinuity: reviewerContinuityLedger, dispositionOversight: dispositionOversightLedger }} ledger={escalationProofLedger} setLedger={setEscalationProofLedger} onNavigate={setWorkspace} />}
          {workspace === 'held_integrity' && <Ql233FollowUpIntegrityAudit key={`held-integrity-${organization.id}`} organization={organization} sources={{ trial: trialLedger, repair: repairLedger, review: reviewLedger, intake: intakeLedger, audit: auditLedger, handoff: handoffLedger, reassessment: reassessmentLedger, recurrence: recurrenceLedger, closure: closureLedger, reopen: reopenLedger, refresh: refreshLedger, exception: exceptionLedger, aging: agingLedger, overdue: overdueLedger, disposition: dispositionLedger, reopenReview: reopenReviewLedger, evidenceAudit: evidenceAuditLedger, handoffContinuity: handoffContinuityLedger, reassignmentAudit: reassignmentAuditLedger, reviewerContinuity: reviewerContinuityLedger, dispositionOversight: dispositionOversightLedger, escalationProof: escalationProofLedger }} ledger={heldIntegrityLedger} setLedger={setHeldIntegrityLedger} onNavigate={setWorkspace} />}
          {workspace === 'source_drift' && <Ql234SourceDriftContinuityAudit key={`source-drift-${organization.id}`} organization={organization} sources={{ trial: trialLedger, repair: repairLedger, review: reviewLedger, intake: intakeLedger, audit: auditLedger, handoff: handoffLedger, reassessment: reassessmentLedger, recurrence: recurrenceLedger, closure: closureLedger, reopen: reopenLedger, refresh: refreshLedger, exception: exceptionLedger, aging: agingLedger, overdue: overdueLedger, disposition: dispositionLedger, reopenReview: reopenReviewLedger, evidenceAudit: evidenceAuditLedger, handoffContinuity: handoffContinuityLedger, reassignmentAudit: reassignmentAuditLedger, reviewerContinuity: reviewerContinuityLedger, dispositionOversight: dispositionOversightLedger, escalationProof: escalationProofLedger, followUpIntegrity: heldIntegrityLedger }} ledger={sourceDriftLedger} setLedger={setSourceDriftLedger} onNavigate={setWorkspace} />}
          {workspace === 'renewal_watch' && <Ql235RenewalWatchAudit key={`renewal-watch-${organization.id}`} organization={organization} sources={{ trial: trialLedger, repair: repairLedger, review: reviewLedger, intake: intakeLedger, audit: auditLedger, handoff: handoffLedger, reassessment: reassessmentLedger, recurrence: recurrenceLedger, closure: closureLedger, reopen: reopenLedger, refresh: refreshLedger, exception: exceptionLedger, aging: agingLedger, overdue: overdueLedger, disposition: dispositionLedger, reopenReview: reopenReviewLedger, evidenceAudit: evidenceAuditLedger, handoffContinuity: handoffContinuityLedger, reassignmentAudit: reassignmentAuditLedger, reviewerContinuity: reviewerContinuityLedger, dispositionOversight: dispositionOversightLedger, escalationProof: escalationProofLedger, followUpIntegrity: heldIntegrityLedger, sourceDrift: sourceDriftLedger }} ledger={renewalWatchLedger} setLedger={setRenewalWatchLedger} onNavigate={setWorkspace} />}
          {workspace === 'receipt_handoff' && <Ql236ReceiptHandoffAudit key={`receipt-handoff-${organization.id}`} organization={organization} sources={{ trial: trialLedger, repair: repairLedger, review: reviewLedger, intake: intakeLedger, audit: auditLedger, handoff: handoffLedger, reassessment: reassessmentLedger, recurrence: recurrenceLedger, closure: closureLedger, reopen: reopenLedger, refresh: refreshLedger, exception: exceptionLedger, aging: agingLedger, overdue: overdueLedger, disposition: dispositionLedger, reopenReview: reopenReviewLedger, evidenceAudit: evidenceAuditLedger, handoffContinuity: handoffContinuityLedger, reassignmentAudit: reassignmentAuditLedger, reviewerContinuity: reviewerContinuityLedger, dispositionOversight: dispositionOversightLedger, escalationProof: escalationProofLedger, followUpIntegrity: heldIntegrityLedger, sourceDrift: sourceDriftLedger, renewalWatch: renewalWatchLedger }} ledger={receiptHandoffLedger} setLedger={setReceiptHandoffLedger} onNavigate={setWorkspace} />}
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

// QL-140 deployment verification: source-only marker to run the disabled Pages preview gate on the same final main commit.
// QL-140 promotion CI queue refresh: no change to synthetic safe-read runtime behavior.
// QL-140 CI queue refresh: unchanged disabled preview behavior; requeue exact PR-head verification.
import { useEffect, useState } from 'react';
import type { BrandId } from '../types';
import { buildQl094SafeReadReviewEvidence } from './ql094SafeReadReviewEvidence';
import { buildQl095SafeReadOperatorAcceptancePlan } from './ql095SafeReadOperatorAcceptance';
import { buildQl096SafeReadOperatorAcceptanceReview } from './ql096SafeReadOperatorAcceptanceReview';
import { buildQl097SafeReadOperatorAcceptanceEvidenceLedgerPlan } from './ql097SafeReadOperatorAcceptanceEvidenceLedgerPlan';
import { buildQl098SafeReadOperatorAcceptanceEvidenceLedgerReview } from './ql098SafeReadOperatorAcceptanceEvidenceLedgerReview';
import { buildQl099SafeReadOperatorAcceptanceEvidenceLedgerResolutionPlan } from './ql099SafeReadOperatorAcceptanceEvidenceLedgerResolutionPlan';
import { buildQl100SafeReadOperatorAcceptanceEvidenceLedgerResolutionReview } from './ql100SafeReadOperatorAcceptanceEvidenceLedgerResolutionReview';
import { buildQl101SafeReadOperatorAcceptanceEvidenceLedgerPersistencePlan } from './ql101SafeReadOperatorAcceptanceEvidenceLedgerPersistencePlan';
import { buildQl102SafeReadOperatorAcceptanceEvidenceLedgerPersistencePlanReview } from './ql102SafeReadOperatorAcceptanceEvidenceLedgerPersistencePlanReview';
import { buildQl103SafeReadOperatorAcceptanceEvidenceLedgerPersistenceImplementationPlan } from './ql103SafeReadOperatorAcceptanceEvidenceLedgerPersistenceImplementationPlan';
import { buildQl104SafeReadOperatorAcceptanceEvidenceLedgerPersistenceImplementationPlanReview } from './ql104SafeReadOperatorAcceptanceEvidenceLedgerPersistenceImplementationPlanReview';
import { buildQl105SafeReadOperatorAcceptanceEvidenceLedgerPersistenceImplementationReadinessDecision } from './ql105SafeReadOperatorAcceptanceEvidenceLedgerPersistenceImplementationReadinessDecision';
import { buildQl106SafeReadOperatorAcceptanceEvidenceLedgerPersistenceImplementationDraftPlan } from './ql106SafeReadOperatorAcceptanceEvidenceLedgerPersistenceImplementationDraftPlan';
import { buildQl107SafeReadOperatorAcceptanceEvidenceLedgerPersistenceImplementationDraftReview } from './ql107SafeReadOperatorAcceptanceEvidenceLedgerPersistenceImplementationDraftReview';
import { buildQl108SafeReadOperatorAcceptanceEvidenceLedgerPersistenceBoundedImplementationDecisionPlanning } from './ql108SafeReadOperatorAcceptanceEvidenceLedgerPersistenceBoundedImplementationDecisionPlanning';
import { buildQl109SafeReadOperatorAcceptanceEvidenceLedgerPersistenceBoundedImplementationDecisionPlanningReview } from './ql109SafeReadOperatorAcceptanceEvidenceLedgerPersistenceBoundedImplementationDecisionPlanningReview';
import { buildQl110SafeReadOperatorAcceptanceEvidenceLedgerPersistenceBoundedImplementationPlanningReadinessDecision } from './ql110SafeReadOperatorAcceptanceEvidenceLedgerPersistenceBoundedImplementationPlanningReadinessDecision';
import { buildQl111SafeReadOperatorAcceptanceEvidenceLedgerPersistenceBoundedImplementationPlanDraft } from './ql111SafeReadOperatorAcceptanceEvidenceLedgerPersistenceBoundedImplementationPlanDraft';
import { buildQl112SafeReadOperatorAcceptanceEvidenceLedgerPersistenceBoundedImplementationPlanDraftReview } from './ql112SafeReadOperatorAcceptanceEvidenceLedgerPersistenceBoundedImplementationPlanDraftReview';
import { buildQl113SafeReadOperatorAcceptanceEvidenceLedgerPersistenceBoundedImplementationOwnerDecisionPlanning } from './ql113SafeReadOperatorAcceptanceEvidenceLedgerPersistenceBoundedImplementationOwnerDecisionPlanning';
import { buildQl114SafeReadOperatorAcceptanceEvidenceLedgerPersistenceBoundedImplementationOwnerDecisionPlanningReview } from './ql114SafeReadOperatorAcceptanceEvidenceLedgerPersistenceBoundedImplementationOwnerDecisionPlanningReview';
import { buildQl115SafeReadOperatorAcceptanceEvidenceLedgerPersistenceBoundedImplementationOwnerDecisionReadinessDecision } from './ql115SafeReadOperatorAcceptanceEvidenceLedgerPersistenceBoundedImplementationOwnerDecisionReadinessDecision';
import { buildQl116SafeReadOperatorAcceptanceEvidenceLedgerPersistenceBoundedImplementationOwnerDecisionReadinessDecisionReview } from './ql116SafeReadOperatorAcceptanceEvidenceLedgerPersistenceBoundedImplementationOwnerDecisionReadinessDecisionReview';
import { buildQl117SafeReadOperatorAcceptanceEvidenceLedgerPersistenceBoundedImplementationOwnerDecisionPacketReviewPlanning } from './ql117SafeReadOperatorAcceptanceEvidenceLedgerPersistenceBoundedImplementationOwnerDecisionPacketReviewPlanning';
import { buildQl118SafeReadOperatorAcceptanceEvidenceLedgerPersistenceBoundedImplementationOwnerDecisionPacketReviewPlanningReview } from './ql118SafeReadOperatorAcceptanceEvidenceLedgerPersistenceBoundedImplementationOwnerDecisionPacketReviewPlanningReview';
import { buildQl119SafeReadOperatorAcceptanceEvidenceLedgerPersistenceBoundedImplementationOwnerDecisionPacketReviewReadinessDecision } from './ql119SafeReadOperatorAcceptanceEvidenceLedgerPersistenceBoundedImplementationOwnerDecisionPacketReviewReadinessDecision';
import { buildQl120SafeReadOperatorAcceptanceEvidenceLedgerPersistenceBoundedImplementationOwnerDecisionPacketReviewReadinessDecisionReview } from './ql120SafeReadOperatorAcceptanceEvidenceLedgerPersistenceBoundedImplementationOwnerDecisionPacketReviewReadinessDecisionReview';
import { buildQl121SafeReadOperatorAcceptanceEvidenceLedgerPersistenceBoundedImplementationOwnerDecisionPacketReviewFollowUpPlanning } from './ql121SafeReadOperatorAcceptanceEvidenceLedgerPersistenceBoundedImplementationOwnerDecisionPacketReviewFollowUpPlanning';
import { buildQl122SafeReadOperatorAcceptanceEvidenceLedgerPersistenceBoundedImplementationOwnerDecisionPacketReviewFollowUpPlanningReview } from './ql122SafeReadOperatorAcceptanceEvidenceLedgerPersistenceBoundedImplementationOwnerDecisionPacketReviewFollowUpPlanningReview';
import { buildQl123FollowUpReadinessDecision } from './ql123FollowUpReadinessDecision';
import { buildQl124FollowUpReadinessDecisionReview } from './ql124FollowUpReadinessDecisionReview';
import { buildQl125ReadinessReviewHandoffPlanning } from './ql125ReadinessReviewHandoffPlanning';
import { buildQl126ReadinessReviewHandoffPlanningReview } from './ql126ReadinessReviewHandoffPlanningReview';
import { buildQl127HandoffReadinessDecision } from './ql127HandoffReadinessDecision';
import { buildQl128HandoffReadinessDecisionReview } from './ql128HandoffReadinessDecisionReview';
import { buildQl129HandoffReadinessFollowUpPlanning } from './ql129HandoffReadinessFollowUpPlanning';
import { buildQl130HandoffReadinessFollowUpPlanningReview } from './ql130HandoffReadinessFollowUpPlanningReview';
import { buildQl131FollowUpPlanningReviewReadinessDecision } from './ql131FollowUpPlanningReviewReadinessDecision';
import { buildQl132FollowUpReadinessDecisionReview } from './ql132FollowUpReadinessDecisionReview';
import { buildQl133FollowUpReadinessReviewPlanning } from './ql133FollowUpReadinessReviewPlanning';
import { buildQl134FollowUpReadinessReviewPlanningReview } from './ql134FollowUpReadinessReviewPlanningReview';
import { buildQl135FollowUpPlanningReviewReadinessDecision } from './ql135FollowUpPlanningReviewReadinessDecision';
import { buildQl136FollowUpPlanningReadinessDecisionReview } from './ql136FollowUpPlanningReadinessDecisionReview';
import { buildQl137HandoffReadinessReviewFollowUpPlanning } from './ql137HandoffReadinessReviewFollowUpPlanning';
import { buildQl138HandoffReadinessFollowUpPlanningReview } from './ql138HandoffReadinessFollowUpPlanningReview';
import { buildQl139HandoffFollowUpPlanningReadinessDecision } from './ql139HandoffFollowUpPlanningReadinessDecision';
import { buildQl140HandoffPlanningReadinessDecisionReview } from './ql140HandoffPlanningReadinessDecisionReview';
import { buildQl141HandoffActionMatrix } from './ql141HandoffActionMatrix';
import { designQl142SyntheticEvidenceExport } from './ql142SyntheticEvidenceExportDesign';
import { reviewQl143SyntheticSchema } from './ql143SyntheticSchemaReview';
import { designQl144CorrectiveExceptions } from './ql144CorrectiveExceptions';
import { reviewQl145CorrectiveClosure } from './ql145CorrectiveClosureReview';
import { recheckQl146SyntheticEvidence } from './ql146SyntheticEvidenceRecheck';
import { reviewQl147IndependentClosure } from './ql147IndependentClosureDecision';
import { auditQl148SyntheticClosureTrace } from './ql148SyntheticClosureAuditTrace';
import { reviewQl149IndependentAuditAcceptance } from './ql149SyntheticAuditAcceptance';
import { recheckQl150AcceptanceContinuity } from './ql150SyntheticAcceptanceContinuity';
import { reviewQl151IndependentFollowUps } from './ql151SyntheticHoldContinuityFollowup';
import { recheckQl152SyntheticFollowUpEvidence } from './ql152SyntheticFollowupEvidenceRecheck';
import { reviewQl153SyntheticResolutionReadiness } from './ql153SyntheticResolutionReadiness';
import { reviewQl154IndependentDecisionContinuity } from './ql154SyntheticDecisionEvidenceContinuity';
import { reviewQl155SyntheticAuditFollowUp } from './ql155SyntheticAuditReadiness';
import { validateQl156SyntheticAuditEvidence } from './ql156SyntheticAuditEvidenceValidation';
import { reconcileQl157OwnerPrerequisitesAndFollowUps } from './ql157OwnerPrerequisiteGovernance';
import { reviewQl158OwnerGovernanceEscalations } from './ql158GovernanceEvidenceEscalation';
import { reviewQl159SyntheticEscalationContinuity } from './ql159SyntheticEscalationResolutionContinuity';
import { reviewQl160IndependentResolutionDecisionEvidence } from './ql160IndependentResolutionDecisionEvidence';
import { reviewQl161OwnerDecisionPrerequisites } from './ql161OwnerDecisionPrerequisites';
import { reviewQl162OwnerCriteriaAndHoldContinuity } from './ql162OwnerCriteriaHoldContinuity';
import {
  getLocalFallbackSafeReadResult,
  loadValidatedSyntheticSafeReads,
  type Ql093SafeReadResult
} from './ql093ValidatedSyntheticSafeReads';
import './ql093-safe-read-preview.css';

const brandOptions: Array<{ id: BrandId; label: string; help: string }> = [
  { id: 'rosiedazzlers', label: 'Rosie Dazzlers', help: 'Mobile detailing synthetic public-view rows only' },
  { id: 'devilndove', label: 'Devil n Dove', help: 'Maker-shop synthetic public-view rows only' }
];

function getBrandLabel(brandId: BrandId): string {
  return brandOptions.find((brand) => brand.id === brandId)?.label ?? brandId;
}

function formatSource(source: Ql093SafeReadResult['source']): string {
  return source.replaceAll('_', ' ');
}

function evidencePillClass(status: 'pass' | 'review' | 'blocked'): string {
  if (status === 'pass') {
    return 'ql093-pill ready';
  }

  if (status === 'blocked') {
    return 'ql093-pill blocked';
  }

  return 'ql093-pill planned';
}

function renderList(items: readonly string[], className = 'ql093-check-list') {
  return (
    <ul className={className}>
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}

export function Ql093SafeReadPreview() {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedBrandId, setSelectedBrandId] = useState<BrandId>('rosiedazzlers');
  const [isLoading, setIsLoading] = useState(false);
  const [safeReadResult, setSafeReadResult] = useState<Ql093SafeReadResult>(() =>
    getLocalFallbackSafeReadResult('rosiedazzlers', 'QL-140 initial local fallback before the async handoff readiness follow-up planning review readiness decision review follow-up planning review readiness decision review follow-up planning review readiness decision review check runs.')
  );

  const ql094Evidence = buildQl094SafeReadReviewEvidence(safeReadResult);
  const ql095AcceptancePlan = buildQl095SafeReadOperatorAcceptancePlan(ql094Evidence);
  const ql096AcceptanceReview = buildQl096SafeReadOperatorAcceptanceReview(ql095AcceptancePlan);
  const ql097LedgerPlan = buildQl097SafeReadOperatorAcceptanceEvidenceLedgerPlan(ql096AcceptanceReview);
  const ql098LedgerReview = buildQl098SafeReadOperatorAcceptanceEvidenceLedgerReview(ql097LedgerPlan);
  const ql099ResolutionPlan = buildQl099SafeReadOperatorAcceptanceEvidenceLedgerResolutionPlan(ql098LedgerReview);
  const ql100ResolutionReview = buildQl100SafeReadOperatorAcceptanceEvidenceLedgerResolutionReview(ql099ResolutionPlan);
  const ql101PersistencePlan = buildQl101SafeReadOperatorAcceptanceEvidenceLedgerPersistencePlan(ql100ResolutionReview);
  const ql102PersistenceReview = buildQl102SafeReadOperatorAcceptanceEvidenceLedgerPersistencePlanReview(ql101PersistencePlan);
  const ql103ImplementationPlan = buildQl103SafeReadOperatorAcceptanceEvidenceLedgerPersistenceImplementationPlan(ql102PersistenceReview);
  const ql104ImplementationReview = buildQl104SafeReadOperatorAcceptanceEvidenceLedgerPersistenceImplementationPlanReview(ql103ImplementationPlan);
  const ql105ReadinessDecision = buildQl105SafeReadOperatorAcceptanceEvidenceLedgerPersistenceImplementationReadinessDecision(ql104ImplementationReview);
  const ql106DraftPlan = buildQl106SafeReadOperatorAcceptanceEvidenceLedgerPersistenceImplementationDraftPlan(ql105ReadinessDecision);
  const ql107DraftReview = buildQl107SafeReadOperatorAcceptanceEvidenceLedgerPersistenceImplementationDraftReview(ql106DraftPlan);
  const ql108DecisionPlanning = buildQl108SafeReadOperatorAcceptanceEvidenceLedgerPersistenceBoundedImplementationDecisionPlanning(ql107DraftReview);
  const ql109DecisionPlanningReview = buildQl109SafeReadOperatorAcceptanceEvidenceLedgerPersistenceBoundedImplementationDecisionPlanningReview(ql108DecisionPlanning);
  const ql110ReadinessDecision = buildQl110SafeReadOperatorAcceptanceEvidenceLedgerPersistenceBoundedImplementationPlanningReadinessDecision(ql109DecisionPlanningReview);
  const ql111PlanDraft = buildQl111SafeReadOperatorAcceptanceEvidenceLedgerPersistenceBoundedImplementationPlanDraft(ql110ReadinessDecision);
  const ql112DraftReview = buildQl112SafeReadOperatorAcceptanceEvidenceLedgerPersistenceBoundedImplementationPlanDraftReview(ql111PlanDraft);
  const ql113OwnerDecisionPlanning = buildQl113SafeReadOperatorAcceptanceEvidenceLedgerPersistenceBoundedImplementationOwnerDecisionPlanning(ql112DraftReview);
  const ql114OwnerDecisionPlanningReview = buildQl114SafeReadOperatorAcceptanceEvidenceLedgerPersistenceBoundedImplementationOwnerDecisionPlanningReview(ql113OwnerDecisionPlanning);
  const ql115OwnerDecisionReadiness = buildQl115SafeReadOperatorAcceptanceEvidenceLedgerPersistenceBoundedImplementationOwnerDecisionReadinessDecision(ql114OwnerDecisionPlanningReview);
  const ql116OwnerDecisionReadinessReview = buildQl116SafeReadOperatorAcceptanceEvidenceLedgerPersistenceBoundedImplementationOwnerDecisionReadinessDecisionReview(ql115OwnerDecisionReadiness);
  const ql117PacketReviewPlanning = buildQl117SafeReadOperatorAcceptanceEvidenceLedgerPersistenceBoundedImplementationOwnerDecisionPacketReviewPlanning(ql116OwnerDecisionReadinessReview);
  const ql118PacketReview = buildQl118SafeReadOperatorAcceptanceEvidenceLedgerPersistenceBoundedImplementationOwnerDecisionPacketReviewPlanningReview(ql117PacketReviewPlanning);
  const ql119Readiness = buildQl119SafeReadOperatorAcceptanceEvidenceLedgerPersistenceBoundedImplementationOwnerDecisionPacketReviewReadinessDecision(ql118PacketReview);
  const ql120Review = buildQl120SafeReadOperatorAcceptanceEvidenceLedgerPersistenceBoundedImplementationOwnerDecisionPacketReviewReadinessDecisionReview(ql119Readiness);
  const ql121Plan = buildQl121SafeReadOperatorAcceptanceEvidenceLedgerPersistenceBoundedImplementationOwnerDecisionPacketReviewFollowUpPlanning(ql120Review);
  const ql122Review = buildQl122SafeReadOperatorAcceptanceEvidenceLedgerPersistenceBoundedImplementationOwnerDecisionPacketReviewFollowUpPlanningReview(ql121Plan);
  const ql123Readiness = buildQl123FollowUpReadinessDecision(ql122Review);
  const ql124Review = buildQl124FollowUpReadinessDecisionReview(ql123Readiness);
  const ql125Plan = buildQl125ReadinessReviewHandoffPlanning(ql124Review);
  const ql126Review = buildQl126ReadinessReviewHandoffPlanningReview(ql125Plan);
  const ql127Decision = buildQl127HandoffReadinessDecision(ql126Review);
  const ql128Review = buildQl128HandoffReadinessDecisionReview(ql127Decision);
  const ql129Plan = buildQl129HandoffReadinessFollowUpPlanning(ql128Review);
  const ql130Review = buildQl130HandoffReadinessFollowUpPlanningReview(ql129Plan);
  const ql131Decision = buildQl131FollowUpPlanningReviewReadinessDecision(ql130Review);
  const ql132Review = buildQl132FollowUpReadinessDecisionReview(ql131Decision);
  const ql133Plan = buildQl133FollowUpReadinessReviewPlanning(ql132Review);
  const ql134Review = buildQl134FollowUpReadinessReviewPlanningReview(ql133Plan);
  const ql135Decision = buildQl135FollowUpPlanningReviewReadinessDecision(ql134Review);
  const ql136Review = buildQl136FollowUpPlanningReadinessDecisionReview(ql135Decision);
  const ql137Plan = buildQl137HandoffReadinessReviewFollowUpPlanning(ql136Review);
  const ql138Review = buildQl138HandoffReadinessFollowUpPlanningReview(ql137Plan);
  const ql139Decision = buildQl139HandoffFollowUpPlanningReadinessDecision(ql138Review);
  const ql140Review = buildQl140HandoffPlanningReadinessDecisionReview(ql139Decision);
  const ql141Matrix = buildQl141HandoffActionMatrix(ql140Review);
  const ql142Design = designQl142SyntheticEvidenceExport(ql141Matrix);
  const ql143Review = reviewQl143SyntheticSchema(ql142Design);
  const ql144Exceptions = designQl144CorrectiveExceptions(ql143Review);
  const ql145Closure = reviewQl145CorrectiveClosure(ql144Exceptions);
  const ql146Recheck = recheckQl146SyntheticEvidence(ql142Design, ql143Review, ql144Exceptions, ql145Closure);
  const ql147Decision = reviewQl147IndependentClosure(ql146Recheck, ql145Closure);
  const ql148Trace = auditQl148SyntheticClosureTrace(ql146Recheck, ql147Decision);
  const ql149Review = reviewQl149IndependentAuditAcceptance(ql148Trace, ql146Recheck, ql147Decision);
  const ql150Recheck = recheckQl150AcceptanceContinuity(ql149Review, ql148Trace, ql146Recheck, ql147Decision);
  const ql151FollowUp = reviewQl151IndependentFollowUps(ql150Recheck, ql149Review);
  const ql152Recheck = recheckQl152SyntheticFollowUpEvidence(ql151FollowUp, ql150Recheck, ql149Review);
  const ql153Review = reviewQl153SyntheticResolutionReadiness(ql152Recheck, ql151FollowUp, ql150Recheck, ql149Review);
  const ql154Review = reviewQl154IndependentDecisionContinuity(ql153Review, ql152Recheck, ql151FollowUp, ql150Recheck, ql149Review);
  const ql155Review = reviewQl155SyntheticAuditFollowUp(ql154Review, ql153Review, ql152Recheck, ql151FollowUp, ql150Recheck, ql149Review);
  const ql156Review = validateQl156SyntheticAuditEvidence(ql155Review, ql154Review, ql153Review, ql152Recheck, ql151FollowUp, ql150Recheck, ql149Review);
  const ql157Review = reconcileQl157OwnerPrerequisitesAndFollowUps(ql156Review, ql155Review, ql154Review, ql153Review, ql152Recheck, ql151FollowUp, ql150Recheck, ql149Review);
  const ql158Review = reviewQl158OwnerGovernanceEscalations(ql157Review, ql156Review, ql155Review, ql154Review, ql153Review, ql152Recheck, ql151FollowUp, ql150Recheck, ql149Review);
  const ql159Review = reviewQl159SyntheticEscalationContinuity(ql158Review, ql157Review, ql156Review, ql155Review, ql154Review, ql153Review, ql152Recheck, ql151FollowUp, ql150Recheck, ql149Review);
  const ql160Review = reviewQl160IndependentResolutionDecisionEvidence(ql159Review, ql158Review, ql157Review, ql156Review, ql155Review, ql154Review, ql153Review, ql152Recheck, ql151FollowUp, ql150Recheck, ql149Review);
  const ql161Review = reviewQl161OwnerDecisionPrerequisites(ql160Review, ql159Review, ql158Review, ql157Review, ql156Review, ql155Review, ql154Review, ql153Review, ql152Recheck, ql151FollowUp, ql150Recheck, ql149Review);
  const ql162Review = reviewQl162OwnerCriteriaAndHoldContinuity(ql161Review, ql160Review, ql159Review, ql158Review, ql157Review, ql156Review, ql155Review, ql154Review, ql153Review, ql152Recheck, ql151FollowUp, ql150Recheck, ql149Review);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setSafeReadResult(
      getLocalFallbackSafeReadResult(selectedBrandId, `QL-140 handoff readiness follow-up planning review readiness decision review follow-up planning review readiness decision review follow-up planning review readiness decision review safe-read check starting for ${getBrandLabel(selectedBrandId)}.`)
    );

    loadValidatedSyntheticSafeReads(selectedBrandId)
      .then((result) => {
        if (!cancelled) {
          setSafeReadResult(result);
        }
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setSafeReadResult(
            getLocalFallbackSafeReadResult(
              selectedBrandId,
              error instanceof Error ? error.message : 'QL-140 handoff readiness follow-up planning review readiness decision review follow-up planning review readiness decision review follow-up planning review readiness decision review check failed and stayed on local fallback.'
            )
          );
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [selectedBrandId]);

  return (
    <section className={isOpen ? 'ql093-safe-read-preview open' : 'ql093-safe-read-preview'} aria-label="QL-140 safe-read handoff readiness follow-up planning review readiness decision review follow-up planning review readiness decision review follow-up planning review readiness decision review">
      <button className="ql093-toggle" onClick={() => setIsOpen((value) => !value)} type="button">
        <span aria-hidden="true">✓</span>
        Safe reads
        <small>QL-162</small>
      </button>

      {isOpen && (
        <div className="ql093-panel" role="dialog" aria-modal="false" aria-label="QL-140 safe-read handoff readiness follow-up planning review readiness decision review follow-up planning review readiness decision review follow-up planning review readiness decision review">
          <div className="ql093-header">
            <div>
              <p className="ql093-eyebrow">QL-162 Public disabled preview</p>
              <h2>Handoff readiness follow-up planning review readiness decision review follow-up planning review readiness decision review follow-up planning review readiness decision review</h2>
              <p>
                QL-140 independently reviews QL-139's eight synthetic/public readiness gates. Passing permits separately scoped read-only follow-up planning only. It still
                does not store owner decisions, approve implementation, create schema, routes, browser submits, Supabase writes, Phone/SMS runtime,
                callbacks, archives, audits, retention, AI delivery, or live pilot behavior.
              </p>
            </div>
            <button className="ql093-close" onClick={() => setIsOpen(false)} type="button" aria-label="Close QL-140 handoff readiness follow-up planning review readiness decision review follow-up planning review readiness decision review follow-up planning review readiness decision review">
              ×
            </button>
          </div>

          <div className="ql093-status-strip">
            <div>
              <span>Active source</span>
              <strong>{safeReadResult.activeSourceLabel}</strong>
            </div>
            <div>
              <span>Selected brand</span>
              <strong>{getBrandLabel(selectedBrandId)}</strong>
            </div>
            <div>
              <span>Client gate</span>
              <strong>{safeReadResult.readOnlyClientStatus.replaceAll('_', ' ')}</strong>
            </div>
            <div>
              <span>Mode</span>
              <strong>{isLoading ? 'checking' : formatSource(safeReadResult.source)}</strong>
            </div>
          </div>

          <div className="ql093-brand-row" aria-label="QL-140 brand filter">
            {brandOptions.map((brand) => (
              <button className={selectedBrandId === brand.id ? 'active' : ''} key={brand.id} onClick={() => setSelectedBrandId(brand.id)} type="button">
                <span>{brand.label}</span>
                <small>{brand.help}</small>
              </button>
            ))}
          </div>

          {safeReadResult.fallbackReason && <p className="ql093-notice">{safeReadResult.fallbackReason}</p>}

          <div className="ql093-grid">
            <article className="ql093-card wide">
              <div className="ql093-card-heading">
                <div>
                  <p className="ql093-eyebrow">QL-162 independent synthetic decision criteria</p>
                  <h3>Owner prerequisites and exception hold continuity</h3>
                </div>
                <span>{ql162Review.outcome.replaceAll('_', ' ')}</span>
              </div>
              <p className="ql093-notice">{ql162Review.notice}</p>
              <p>Source integrity: {ql162Review.sourceIntegrityVerified ? 'verified' : 'blocked'}. {ql162Review.summary.passed} checks passing, {ql162Review.summary.blocked} blocked. No real owner approval, escalations or closures.</p>
              {ql162Review.outstandingHoldIds.length > 0 && (
                <p className="ql093-muted">Unresolved synthetic hold IDs: {ql162Review.outstandingHoldIds.join(', ')}</p>
              )}
              <ul className="ql093-status-list">
                {ql162Review.gates.map((check) => (
                  <li key={check.id}>
                    <strong>{check.requirement}</strong>
                    <span className={evidencePillClass(check.status)}>{check.status}</span>
                    <p>{check.id}</p>
                    <small>If blocked: {check.ifBlocked}</small>
                  </li>
                ))}
              </ul>
              <p className="ql093-muted">Owner criteria — documented and unapproved</p>
              <ul className="ql093-status-list">
                {ql162Review.ownerCriteria.map((criterion) => (
                  <li key={criterion.id}>
                    <strong>{criterion.id}</strong>
                    <span className={evidencePillClass('review')}>Not approved</span>
                    <p>{criterion.requirement}</p>
                  </li>
                ))}
              </ul>
              {ql162Review.followUps.length > 0 && (
                <>
                  <p className="ql093-muted">Exception follow-ups — display only; every hold remains open</p>
                  <ul className="ql093-status-list">
                    {ql162Review.followUps.map((item) => (
                      <li key={item.holdId}>
                        <strong>{item.holdId}</strong>
                        <span className={evidencePillClass('blocked')}>Hold open</span>
                        <p>{item.requiredEvidence}</p>
                        <small>Proposed route: {item.proposedRoute.replaceAll('_', ' ')}. Independent evidence and human decision pending; no closure authorized.</small>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </article>
          </div>
          <div className="ql093-grid">
            <article className="ql093-card wide">
              <div className="ql093-card-heading">
                <div>
                  <p className="ql093-eyebrow">QL-161 independent synthetic decision governance</p>
                  <h3>Owner prerequisite evidence and unresolved exception holds</h3>
                </div>
                <span>{ql161Review.outcome.replaceAll('_', ' ')}</span>
              </div>
              <p className="ql093-notice">{ql161Review.warning}</p>
              <p>Source integrity: {ql161Review.sourceIntegrityVerified ? 'verified' : 'blocked'}. {ql161Review.summary.passed} checks passing, {ql161Review.summary.blocked} blocked. No real owner decisions, escalations or closures.</p>
              {ql161Review.outstandingHoldIds.length > 0 && (
                <p className="ql093-muted">Unresolved synthetic holds: {ql161Review.outstandingHoldIds.join(', ')}</p>
              )}
              <ul className="ql093-status-list">
                {ql161Review.gates.map((gate) => (
                  <li key={gate.id}>
                    <strong>{gate.requirement}</strong>
                    <span className={evidencePillClass(gate.status)}>{gate.status}</span>
                    <p>{gate.id}</p>
                    <small>If blocked: {gate.ifBlocked}</small>
                  </li>
                ))}
              </ul>
              <p className="ql093-muted">Owner review prerequisites — documented, not approved</p>
              <ul className="ql093-status-list">
                {ql161Review.ownerPrerequisites.map((criterion) => (
                  <li key={criterion.id}>
                    <strong>{criterion.id}</strong>
                    <span className={evidencePillClass('review')}>Not approved</span>
                    <p>{criterion.requirement}</p>
                  </li>
                ))}
              </ul>
              {ql161Review.exceptionGovernance.length > 0 && (
                <>
                  <p className="ql093-muted">Exception follow-ups — held in memory only</p>
                  <ul className="ql093-status-list">
                    {ql161Review.exceptionGovernance.map((item) => (
                      <li key={item.holdId}>
                        <strong>{item.holdId}</strong>
                        <span className={evidencePillClass('blocked')}>Hold open</span>
                        <p>{item.requiredEvidence}</p>
                        <small>Proposed route: {item.proposedRoute.replaceAll('_', ' ')}. External evidence and separate human review required; no real closure authorized.</small>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </article>
          </div>
          <div className="ql093-grid">
            <article className="ql093-card wide">
              <div className="ql093-card-heading">
                <div>
                  <p className="ql093-eyebrow">QL-160 independent synthetic owner-boundary review</p>
                  <h3>Resolution decision evidence and owner escalation safeguards</h3>
                </div>
                <span>{ql160Review.outcome.replaceAll('_', ' ')}</span>
              </div>
              <p className="ql093-notice">{ql160Review.warning}</p>
              <p>Source integrity: {ql160Review.sourceIntegrityVerified ? 'verified' : 'blocked'}; {ql160Review.summary.passed} passing, {ql160Review.summary.blocked} blocked gates. Real owner approvals, escalations and closures: none.</p>
              {ql160Review.outstandingHoldIds.length > 0 && (
                <p className="ql093-muted">Open synthetic holds: {ql160Review.outstandingHoldIds.join(', ')}</p>
              )}
              <ul className="ql093-status-list">
                {ql160Review.gates.map((gate) => (
                  <li key={gate.id}>
                    <strong>{gate.requirement}</strong>
                    <span className={evidencePillClass(gate.status)}>{gate.status}</span>
                    <p>{gate.id}</p>
                    <small>If blocked: {gate.onBlock}</small>
                  </li>
                ))}
              </ul>
              {ql160Review.decisionBoundaries.length > 0 && (
                <>
                  <p className="ql093-muted">Owner decision boundaries — synthetic proposals only</p>
                  <ul className="ql093-status-list">
                    {ql160Review.decisionBoundaries.map((item) => (
                      <li key={item.holdId}>
                        <strong>{item.holdId}</strong>
                        <span className={evidencePillClass('blocked')}>Hold open</span>
                        <p>{item.evidenceNeeded}</p>
                        <small>Route: {item.syntheticRoute.replaceAll('_', ' ')}. Separate owner and evidence review required. No dispatch or closure authorized.</small>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </article>
          </div>
          <div className="ql093-grid">
            <article className="ql093-card wide">
              <div className="ql093-card-heading">
                <div>
                  <p className="ql093-eyebrow">QL-159 synthetic escalation-resolution continuity</p>
                  <h3>Independent evidence follow-ups and governance holds</h3>
                </div>
                <span>{ql159Review.outcome.replaceAll('_', ' ')}</span>
              </div>
              <p className="ql093-notice">{ql159Review.notice}</p>
              <p>Source integrity: {ql159Review.sourceIntegrityVerified ? 'verified' : 'blocked'}; {ql159Review.summary.passed} passing and {ql159Review.summary.blocked} blocked checks. No escalations sent, no real exception closures.</p>
              {ql159Review.unresolvedHoldIds.length > 0 && (
                <p className="ql093-muted">Unresolved synthetic hold IDs: {ql159Review.unresolvedHoldIds.join(', ')}</p>
              )}
              <ul className="ql093-status-list">
                {ql159Review.gates.map((gate) => (
                  <li key={gate.id}>
                    <strong>{gate.requirement}</strong>
                    <span className={evidencePillClass(gate.status)}>{gate.status}</span>
                    <p>{gate.id}</p>
                    <small>If blocked: {gate.ifBlocked}</small>
                  </li>
                ))}
              </ul>
              {ql159Review.resolutionFollowUps.length > 0 && (
                <>
                  <p className="ql093-muted">Synthetic resolution follow-ups — in-memory proposals only</p>
                  <ul className="ql093-status-list">
                    {ql159Review.resolutionFollowUps.map((item) => (
                      <li key={item.holdId}>
                        <strong>{item.holdId}</strong>
                        <span className={evidencePillClass('blocked')}>Hold open</span>
                        <p>{item.evidenceNeeded}</p>
                        <small>Proposed route: {item.proposedRoute.replaceAll('_', ' ')}. Separate owner review required. No dispatch or closure authorized.</small>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </article>
          </div>
          <div className="ql093-grid">
            <article className="ql093-card wide">
              <div className="ql093-card-heading">
                <div>
                  <p className="ql093-eyebrow">QL-158 synthetic governance evidence integrity</p>
                  <h3>Follow-up provenance and proposed hold escalations</h3>
                </div>
                <span>{ql158Review.outcome.replaceAll('_', ' ')}</span>
              </div>
              <p className="ql093-notice">{ql158Review.notice}</p>
              <p>Evidence integrity: {ql158Review.sourceIntegrityVerified ? 'verified' : 'blocked'}; {ql158Review.summary.passed} passing, {ql158Review.summary.blocked} blocked. Escalations sent: none; real owner approvals: none.</p>
              {ql158Review.outstandingHoldIds.length > 0 && (
                <p className="ql093-muted">Open synthetic holds: {ql158Review.outstandingHoldIds.join(', ')}</p>
              )}
              <ul className="ql093-status-list">
                {ql158Review.gates.map((gate) => (
                  <li key={gate.id}>
                    <strong>{gate.requirement}</strong>
                    <span className={evidencePillClass(gate.status)}>{gate.status}</span>
                    <p>{gate.id}</p>
                    <small>If blocked: {gate.reviewIfBlocked}</small>
                  </li>
                ))}
              </ul>
              {ql158Review.escalationDrafts.length > 0 && (
                <>
                  <p className="ql093-muted">Synthetic escalation drafts — proposed only, nothing dispatched</p>
                  <ul className="ql093-status-list">
                    {ql158Review.escalationDrafts.map((draft) => (
                      <li key={draft.holdId}>
                        <strong>{draft.holdId}</strong>
                        <span className={evidencePillClass('blocked')}>Hold open</span>
                        <p>{draft.evidenceRequirement}</p>
                        <small>Proposed route: {draft.route.replaceAll('_', ' ')}. Human review required; no closure authorized.</small>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </article>
          </div>
          <div className="ql093-grid">
            <article className="ql093-card wide">
              <div className="ql093-card-heading">
                <div>
                  <p className="ql093-eyebrow">QL-157 synthetic owner governance reconciliation</p>
                  <h3>Owner review prerequisites and exception follow-up governance</h3>
                </div>
                <span>{ql157Review.outcome.replaceAll('_', ' ')}</span>
              </div>
              <p className="ql093-notice">{ql157Review.notice}</p>
              <p>Source integrity: {ql157Review.sourceIntegrityVerified ? 'verified' : 'blocked'}; {ql157Review.summary.passed} checks passing, {ql157Review.summary.blocked} blocked. Owner approvals and actual hold closures: none.</p>
              {ql157Review.outstandingHoldIds.length > 0 && (
                <p className="ql093-muted">Unresolved synthetic holds: {ql157Review.outstandingHoldIds.join(', ')}</p>
              )}
              <ul className="ql093-status-list">
                {ql157Review.checks.map((check) => (
                  <li key={check.id}>
                    <strong>{check.requirement}</strong>
                    <span className={evidencePillClass(check.status)}>{check.status}</span>
                    <p>{check.id}</p>
                    <small>If blocked: {check.nextStepIfBlocked}</small>
                  </li>
                ))}
              </ul>
              <p className="ql093-muted">Owner review checkpoints — documentation only, none authorized</p>
              <ul className="ql093-status-list">
                {ql157Review.prerequisites.map((item) => (
                  <li key={item.id}>
                    <strong>{item.id}</strong>
                    <span className={evidencePillClass('review')}>Not approved</span>
                    <p>{item.description}</p>
                  </li>
                ))}
              </ul>
              {ql157Review.exceptionFollowUps.length > 0 && (
                <>
                  <p className="ql093-muted">Exception follow-up register — all holds open, no changes applied</p>
                  <ul className="ql093-status-list">
                    {ql157Review.exceptionFollowUps.map((item) => (
                      <li key={item.holdId}>
                        <strong>{item.holdId}</strong>
                        <span className={evidencePillClass('blocked')}>Hold open</span>
                        <p>{item.evidenceRequirement}</p>
                        <small>Separate human review required. No closure authorized.</small>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </article>
          </div>
          <div className="ql093-grid">
            <article className="ql093-card wide">
              <div className="ql093-card-heading">
                <div>
                  <p className="ql093-eyebrow">QL-156 independent synthetic audit evidence</p>
                  <h3>Follow-up evidence validation and owner review prerequisites</h3>
                </div>
                <span>{ql156Review.outcome.replaceAll('_', ' ')}</span>
              </div>
              <p className="ql093-notice">{ql156Review.notice}</p>
              <p>Source integrity: {ql156Review.sourceReconciled ? 'verified' : 'blocked'}; {ql156Review.summary.passed} passing, {ql156Review.summary.blocked} blocked checks. No real owner review or actual exception closure.</p>
              {ql156Review.outstandingHoldIds.length > 0 && (
                <p className="ql093-muted">Outstanding synthetic holds: {ql156Review.outstandingHoldIds.join(', ')}</p>
              )}
              <ul className="ql093-status-list">
                {ql156Review.checks.map((check) => (
                  <li key={check.id}>
                    <strong>{check.requirement}</strong>
                    <span className={evidencePillClass(check.status)}>{check.status}</span>
                    <p>{check.id}</p>
                    <small>If blocked: {check.followUpIfBlocked}</small>
                  </li>
                ))}
              </ul>
              <p className="ql093-muted">Owner review prerequisites — documented, not approved</p>
              <ul className="ql093-status-list">
                {ql156Review.ownerReviewCriteria.map((criterion) => (
                  <li key={criterion.id}>
                    <strong>{criterion.id}</strong>
                    <span className={evidencePillClass('review')}>Not approved</span>
                    <p>{criterion.requirement}</p>
                  </li>
                ))}
              </ul>
              {ql156Review.heldEvidence.length > 0 && (
                <>
                  <p className="ql093-muted">Unresolved synthetic evidence — not acted upon</p>
                  <ul className="ql093-status-list">
                    {ql156Review.heldEvidence.map((item) => (
                      <li key={item.id}>
                        <strong>{item.id}</strong>
                        <span className={evidencePillClass('blocked')}>Hold open</span>
                        <p>{item.requiredEvidence}</p>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </article>
          </div>
          <div className="ql093-grid">
            <article className="ql093-card wide">
              <div className="ql093-card-heading">
                <div>
                  <p className="ql093-eyebrow">QL-155 independent synthetic audit readiness</p>
                  <h3>Decision follow-ups, evidence continuity and exception holds</h3>
                </div>
                <span>{ql155Review.outcome.replaceAll('_', ' ')}</span>
              </div>
              <p className="ql093-notice">{ql155Review.notice}</p>
              <p>Source integrity: {ql155Review.sourceIntegrityVerified ? 'verified' : 'blocked'}; {ql155Review.summary.passed} passing and {ql155Review.summary.blocked} blocked. No real approval, closure, or durable audit recorded.</p>
              {ql155Review.outstandingHoldIds.length > 0 && (
                <p className="ql093-muted">Open synthetic holds: {ql155Review.outstandingHoldIds.join(', ')}</p>
              )}
              <ul className="ql093-status-list">
                {ql155Review.checks.map((check) => (
                  <li key={check.id}>
                    <strong>{check.requirement}</strong>
                    <span className={evidencePillClass(check.status)}>{check.status}</span>
                    <p>{check.id}</p>
                    <small>If blocked: {check.followUpIfBlocked}</small>
                  </li>
                ))}
              </ul>
              {ql155Review.followUpCandidates.length > 0 && (
                <>
                  <p className="ql093-muted">Synthetic evidence follow-ups — not executed or persisted</p>
                  <ul className="ql093-status-list">
                    {ql155Review.followUpCandidates.map((item) => (
                      <li key={item.id}>
                        <strong>{item.id}</strong>
                        <span className={evidencePillClass('blocked')}>Hold open</span>
                        <p>{item.evidenceRequired}</p>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </article>
          </div>
          <div className="ql093-grid">
            <article className="ql093-card wide">
              <div className="ql093-card-heading">
                <div>
                  <p className="ql093-eyebrow">QL-154 independent synthetic decision evidence</p>
                  <h3>Evidence continuity and unresolved hold review</h3>
                </div>
                <span>{ql154Review.outcome.replaceAll('_', ' ')}</span>
              </div>
              <p className="ql093-notice">{ql154Review.warning}</p>
              <p>Integrity {ql154Review.sourceIntegrityVerified ? 'verified' : 'blocked'}; {ql154Review.summary.passed} passing and {ql154Review.summary.blocked} blocked checks. No real owner approval, closure, or stored audit.</p>
              {ql154Review.unresolvedHoldIds.length > 0 && (
                <p className="ql093-muted">Unresolved synthetic holds: {ql154Review.unresolvedHoldIds.join(', ')}</p>
              )}
              <ul className="ql093-status-list">
                {ql154Review.gates.map((gate) => (
                  <li key={gate.id}>
                    <strong>{gate.requirement}</strong>
                    <span className={evidencePillClass(gate.status)}>{gate.status}</span>
                    <p>{gate.id}</p>
                    <small>If blocked: {gate.ifBlocked}</small>
                  </li>
                ))}
              </ul>
              {ql154Review.heldEvidence.length > 0 && (
                <>
                  <p className="ql093-muted">Evidence holds — no decisions executed</p>
                  <ul className="ql093-status-list">
                    {ql154Review.heldEvidence.map((item) => (
                      <li key={item.id}>
                        <strong>{item.id}</strong>
                        <span className={evidencePillClass('blocked')}>Hold open</span>
                        <p>{item.nextReview}</p>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </article>
          </div>
          <div className="ql093-grid">
            <article className="ql093-card wide">
              <div className="ql093-card-heading">
                <div>
                  <p className="ql093-eyebrow">QL-153 independent synthetic resolution review</p>
                  <h3>Hold readiness, source reconciliation and follow-up decisions</h3>
                </div>
                <span>{ql153Review.outcome.replaceAll('_', ' ')}</span>
              </div>
              <p className="ql093-notice">{ql153Review.warning}</p>
              <p>Source integrity: {ql153Review.sourceReconciled ? 'verified' : 'blocked'}. {ql153Review.summary.passed} passing and {ql153Review.summary.blocked} blocked criteria. No actual owner approval or closure recorded.</p>
              {ql153Review.outstandingHoldIds.length > 0 && (
                <p className="ql093-muted">Unresolved synthetic holds: {ql153Review.outstandingHoldIds.join(', ')}</p>
              )}
              <ul className="ql093-status-list">
                {ql153Review.gates.map((gate) => (
                  <li key={gate.id}>
                    <strong>{gate.condition}</strong>
                    <span className={evidencePillClass(gate.status)}>{gate.status}</span>
                    <p>{gate.id}</p>
                    <small>If blocked: {gate.followUp}</small>
                  </li>
                ))}
              </ul>
              {ql153Review.decisionDrafts.length > 0 && (
                <>
                  <p className="ql093-muted">Hold decision drafts — none executed</p>
                  <ul className="ql093-status-list">
                    {ql153Review.decisionDrafts.map((draft) => (
                      <li key={draft.id}>
                        <strong>{draft.id}</strong>
                        <span className={evidencePillClass('blocked')}>Hold open</span>
                        <p>{draft.evidenceNeeded}</p>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </article>
          </div>
          <div className="ql093-grid">
            <article className="ql093-card wide">
              <div className="ql093-card-heading">
                <div>
                  <p className="ql093-eyebrow">QL-152 independent synthetic follow-up recheck</p>
                  <h3>Evidence replay and hold resolution criteria</h3>
                </div>
                <span>{ql152Recheck.outcome.replaceAll('_', ' ')}</span>
              </div>
              <p className="ql093-notice">{ql152Recheck.notice}</p>
              <p>Source integrity: {ql152Recheck.sourceReconciled ? 'verified' : 'blocked'}; {ql152Recheck.summary.passed} passing, {ql152Recheck.summary.blocked} blocked. No actual exception closure.</p>
              {ql152Recheck.outstandingHoldIds.length > 0 && (
                <p className="ql093-muted">Unresolved synthetic holds: {ql152Recheck.outstandingHoldIds.join(', ')}</p>
              )}
              <ul className="ql093-status-list">
                {ql152Recheck.gates.map((gate) => (
                  <li key={gate.id}>
                    <strong>{gate.requirement}</strong>
                    <span className={evidencePillClass(gate.status)}>{gate.status}</span>
                    <p>{gate.id}</p>
                    <small>If blocked: {gate.ifBlocked}</small>
                  </li>
                ))}
              </ul>
              {ql152Recheck.resolutionCandidates.length > 0 && (
                <>
                  <p className="ql093-muted">Resolution evidence requirements (not actions)</p>
                  <ul className="ql093-status-list">
                    {ql152Recheck.resolutionCandidates.map((item) => (
                      <li key={item.id}>
                        <strong>{item.id}</strong>
                        <span className={evidencePillClass('blocked')}>Hold open</span>
                        <p>{item.evidenceRequirement}</p>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </article>
          </div>
          <div className="ql093-grid">
            <article className="ql093-card wide">
              <div className="ql093-card-heading">
                <div>
                  <p className="ql093-eyebrow">QL-151 independent hold-continuity review</p>
                  <h3>Synthetic acceptance and proposed exception follow-ups</h3>
                </div>
                <span>{ql151FollowUp.outcome.replaceAll('_', ' ')}</span>
              </div>
              <p className="ql093-notice">{ql151FollowUp.warning}</p>
              <p>{ql151FollowUp.summary.passed} passing / {ql151FollowUp.summary.blocked} blocked criteria. No acceptance or actual hold closure recorded.</p>
              {ql151FollowUp.preservedHoldIds.length > 0 && (
                <p className="ql093-muted">Unresolved hold IDs: {ql151FollowUp.preservedHoldIds.join(', ')}</p>
              )}
              <ul className="ql093-status-list">
                {ql151FollowUp.checks.map((check) => (
                  <li key={check.id}>
                    <strong>{check.id}</strong>
                    <span className={evidencePillClass(check.status)}>{check.status}</span>
                    <p>{check.evidence}</p>
                    <small>If blocked: {check.followUpIfBlocked}</small>
                  </li>
                ))}
              </ul>
              {ql151FollowUp.followUps.length > 0 && (
                <>
                  <p className="ql093-muted">Proposed synthetic-only follow-up actions (not applied)</p>
                  <ul className="ql093-status-list">
                    {ql151FollowUp.followUps.map((item) => (
                      <li key={item.id}>
                        <strong>{item.id}</strong>
                        <span className={evidencePillClass('blocked')}>{item.status.replaceAll('_', ' ')}</span>
                        <p>{item.action}</p>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </article>
          </div>
          <div className="ql093-grid">
            <article className="ql093-card wide">
              <div className="ql093-card-heading">
                <div>
                  <p className="ql093-eyebrow">QL-150 synthetic acceptance recheck</p>
                  <h3>Independent replay and evidence hold continuity</h3>
                </div>
                <span>{ql150Recheck.outcome.replaceAll('_', ' ')}</span>
              </div>
              <p className="ql093-notice">{ql150Recheck.notice}</p>
              <p>Source integrity: {ql150Recheck.sourceIntegrityVerified ? 'verified' : 'blocked'}; {ql150Recheck.summary.passed} passing, {ql150Recheck.summary.blocked} blocked; no acceptance or closure recorded.</p>
              {ql150Recheck.outstandingHoldIds.length > 0 && (
                <p className="ql093-muted">Unresolved hold identifiers: {ql150Recheck.outstandingHoldIds.join(', ')}</p>
              )}
              <ul className="ql093-status-list">
                {ql150Recheck.gates.map((gate) => (
                  <li key={gate.id}>
                    <strong>{gate.requirement}</strong>
                    <span className={evidencePillClass(gate.status)}>{gate.status}</span>
                    <p>{gate.id}</p>
                    <small>If blocked: {gate.followUp}</small>
                  </li>
                ))}
              </ul>
            </article>
          </div>
          <div className="ql093-grid">
            <article className="ql093-card wide">
              <div className="ql093-card-heading">
                <div>
                  <p className="ql093-eyebrow">QL-149 independent synthetic acceptance review</p>
                  <h3>Trace integrity, exception holds and non-authorization</h3>
                </div>
                <span>{ql149Review.outcome.replaceAll('_', ' ')}</span>
              </div>
              <p className="ql093-notice">{ql149Review.notice}</p>
              <p>{ql149Review.traceEntriesInspected} synthetic trace entries reviewed; {ql149Review.summary.passed} passing and {ql149Review.summary.blocked} blocked criteria. No acceptance or closure was recorded.</p>
              {ql149Review.unresolvedHoldIds.length > 0 && (
                <p className="ql093-muted">Unresolved hold identifiers: {ql149Review.unresolvedHoldIds.join(', ')}</p>
              )}
              <ul className="ql093-status-list">
                {ql149Review.gates.map((gate) => (
                  <li key={gate.id}>
                    <strong>{gate.label}</strong>
                    <span className={evidencePillClass(gate.status)}>{gate.status}</span>
                    <p>Evidence: {gate.evidenceRequired}</p>
                    <small>If blocked: {gate.followUpIfBlocked}</small>
                  </li>
                ))}
              </ul>
            </article>
          </div>
          <div className="ql093-grid">
            <article className="ql093-card wide">
              <div className="ql093-card-heading">
                <div>
                  <p className="ql093-eyebrow">QL-148 synthetic audit trace</p>
                  <h3>Fourteen in-memory checks and unresolved-hold verification</h3>
                </div>
                <span>{ql148Trace.outcome.replaceAll('_', ' ')}</span>
              </div>
              <p className="ql093-notice">{ql148Trace.notice}</p>
              <p>{ql148Trace.checksPassed} integrity checks passing / {ql148Trace.checksBlocked} blocked; {ql148Trace.trace.length} trace entries. No durable audit log or real exception closure.</p>
              {ql148Trace.outstandingHoldIds.length > 0 && (
                <p className="ql093-muted">Evidence holds: {ql148Trace.outstandingHoldIds.join(', ')}</p>
              )}
              <ul className="ql093-status-list">
                {ql148Trace.checks.map((check) => (
                  <li key={check.id}>
                    <strong>{check.id}</strong>
                    <span className={evidencePillClass(check.status)}>{check.status}</span>
                    <p>{check.rationale}</p>
                  </li>
                ))}
              </ul>
              <p className="ql093-muted">Public/synthetic review trace (not stored)</p>
              <ul className="ql093-status-list">
                {ql148Trace.trace.map((entry) => (
                  <li key={entry.id}>
                    <strong>{entry.sourceBuild}: {entry.gateId}</strong>
                    <span className={evidencePillClass(entry.result)}>{entry.result}</span>
                    <p>{entry.note}</p>
                  </li>
                ))}
              </ul>
            </article>
          </div>
          <div className="ql093-grid">
            <article className="ql093-card wide">
              <div className="ql093-card-heading">
                <div>
                  <p className="ql093-eyebrow">QL-147 independent synthetic closure review</p>
                  <h3>Decision readiness and evidence hold reconciliation</h3>
                </div>
                <span>{ql147Decision.decision.replaceAll('_', ' ')}</span>
              </div>
              <p className="ql093-notice">{ql147Decision.notice}</p>
              <p>{ql147Decision.summary.passed} passing, {ql147Decision.summary.blocked} blocked; no owner approval or real closure.</p>
              {ql147Decision.evidenceHoldIds.length > 0 && (
                <p className="ql093-muted">Evidence holds: {ql147Decision.evidenceHoldIds.join(', ')}</p>
              )}
              <ul className="ql093-status-list">
                {ql147Decision.gates.map((gate) => (
                  <li key={gate.id}>
                    <strong>{gate.review}</strong>
                    <span className={evidencePillClass(gate.status)}>{gate.status}</span>
                    <p>If blocked: {gate.hold}</p>
                  </li>
                ))}
              </ul>
            </article>
          </div>
          <div className="ql093-grid">
            <article className="ql093-card wide">
              <div className="ql093-card-heading">
                <div>
                  <p className="ql093-eyebrow">QL-146 independent synthetic recheck</p>
                  <h3>Evidence replay and exception closure readiness</h3>
                </div>
                <span>{ql146Recheck.outcome.replaceAll('_', ' ')}</span>
              </div>
              <p className="ql093-notice">{ql146Recheck.warning}</p>
              <p>Source integrity: {ql146Recheck.sourceIntegrityVerified ? 'verified' : 'blocked'}; {ql146Recheck.summary.passed} passing and {ql146Recheck.summary.blocked} blocked gates.</p>
              <p className="ql093-muted">Rechecked QL-143 synthetic source: {ql146Recheck.sourceChecks.passed} passed, {ql146Recheck.sourceChecks.blocked} blocked.</p>
              {ql146Recheck.unresolvedExceptionIds.length > 0 && (
                <p className="ql093-muted">Unresolved exception holds: {ql146Recheck.unresolvedExceptionIds.join(', ')}</p>
              )}
              <ul className="ql093-status-list">
                {ql146Recheck.gates.map((gate) => (
                  <li key={gate.id}>
                    <strong>{gate.label}</strong>
                    <span className={evidencePillClass(gate.status)}>{gate.status}</span>
                    <p>Evidence: {gate.evidence}</p>
                    <small>If blocked: {gate.responseIfBlocked}</small>
                  </li>
                ))}
              </ul>
            </article>
          </div>
          <div className="ql093-grid">
            <article className="ql093-card wide">
              <div className="ql093-card-heading">
                <div>
                  <p className="ql093-eyebrow">QL-145 synthetic closure criteria</p>
                  <h3>Corrective review and unresolved exceptions</h3>
                </div>
                <span>{ql145Closure.outcome.replaceAll('_', ' ')}</span>
              </div>
              <p className="ql093-notice">{ql145Closure.notice}</p>
              <p>{ql145Closure.summary.passed} passing / {ql145Closure.summary.blocked} blocked criteria. No actual exception closure, owner approval or export.</p>
              {ql145Closure.unresolvedExceptionIds.length > 0 && (
                <p className="ql093-muted">Unresolved exceptions: {ql145Closure.unresolvedExceptionIds.join(', ')}</p>
              )}
              <ul className="ql093-status-list">
                {ql145Closure.gates.map((gate) => (
                  <li key={gate.id}>
                    <strong>{gate.label}</strong>
                    <span className={evidencePillClass(gate.status)}>{gate.status}</span>
                    <p>Evidence required: {gate.evidenceRequired}</p>
                    <small>Next: {gate.nextAction}</small>
                  </li>
                ))}
              </ul>
            </article>
          </div>
          <div className="ql093-grid">
            <article className="ql093-card wide">
              <div className="ql093-card-heading">
                <div><p className="ql093-eyebrow">QL-144 synthetic exceptions</p><h3>Corrective design — review only</h3></div>
                <span>{ql144Exceptions.outcome.replaceAll('_', ' ')}</span>
              </div>
              <p className="ql093-notice">{ql144Exceptions.message}</p>
              <p>Source reconciled: {ql144Exceptions.sourceReconciled ? 'yes' : 'no'}; {ql144Exceptions.inspectedChecks} checks; {ql144Exceptions.blockedChecks} blocked; {ql144Exceptions.exceptions.length} proposed corrective actions.</p>
              <ul className="ql093-status-list">
                {ql144Exceptions.exceptions.map((item) => (
                  <li key={item.id}>
                    <strong>{item.id}</strong>
                    <span className={evidencePillClass('blocked')}>{item.status.replaceAll('_', ' ')}</span>
                    <p>{item.reason}</p>
                    <small>Proposed only: {item.proposedCorrection}</small>
                  </li>
                ))}
              </ul>
            </article>
          </div>
          <div className="ql093-grid">
            <article className="ql093-card wide">
              <div className="ql093-card-heading">
                <div><p className="ql093-eyebrow">QL-143 schema and redaction review</p><h3>Synthetic evidence safeguards</h3></div>
                <span>{ql143Review.outcome.replaceAll('_', ' ')}</span>
              </div>
              <p className="ql093-notice">{ql143Review.warning}</p>
              <p>{ql143Review.passed} passing / {ql143Review.blocked} blocked; no real evidence export available.</p>
              <ul className="ql093-status-list">
                {ql143Review.checks.map((check) => (
                  <li key={check.id}>
                    <strong>{check.id}</strong>
                    <span className={evidencePillClass(check.status)}>{check.status}</span>
                    <p>{check.explanation}</p>
                  </li>
                ))}
              </ul>
            </article>
          </div>
          <div className="ql093-grid">
            <article className="ql093-card wide">
              <div className="ql093-card-heading">
                <div>
                  <p className="ql093-eyebrow">QL-142 synthetic-only export design</p>
                  <h3>Evidence schema proposal — no download or transmission</h3>
                </div>
                <span>{ql142Design.valid ? 'Design verified' : 'Blocked'}</span>
              </div>
              <p className="ql093-notice">{ql142Design.warning}</p>
              <p>Proposed filename: {ql142Design.fileNameProposal}; format: {ql142Design.format}; schema version: {ql142Design.schemaVersion}.</p>
              <p className="ql093-muted">Allowed synthetic fields</p>
              {renderList(ql142Design.allowedFields)}
              <p className="ql093-muted">Excluded private fields</p>
              {renderList(ql142Design.excludedFields, 'ql093-check-list warning')}
              <p className="ql093-muted">Synthetic evidence sections in proposed design: {ql142Design.preview.sections.length}. Export, download and transmission are disabled.</p>
            </article>
          </div>
          <div className="ql093-grid">
            <article className="ql093-card wide">
              <div className="ql093-card-heading">
                <div>
                  <p className="ql093-eyebrow">QL-141 synthetic handoff action matrix</p>
                  <h3>Next actions and blockers</h3>
                </div>
                <span>{ql141Matrix.build}</span>
              </div>
              <p className="ql093-notice">{ql141Matrix.notice}</p>
              <p>Source integrity: {ql141Matrix.sourceValid ? 'verified' : 'blocked'} — {ql141Matrix.ready} synthetic-review actions ready, {ql141Matrix.blocked} blocked.</p>
              <ul className="ql093-status-list">
                {ql141Matrix.items.map((item) => (
                  <li key={item.id}>
                    <strong>{item.area}: {item.action}</strong>
                    <span className={evidencePillClass(item.status === 'ready_for_synthetic_review' ? 'pass' : 'blocked')}>{item.status.replaceAll('_', ' ')}</span>
                    <p>{item.evidence}</p>
                    <small>{item.restriction}</small>
                  </li>
                ))}
              </ul>
            </article>
          </div>

          <div className="ql093-grid">
            <article className="ql093-card wide">
              <div className="ql093-card-heading">
                <div>
                  <p className="ql093-eyebrow">QL-140 handoff readiness follow-up planning review readiness decision review follow-up planning review readiness decision review follow-up planning review readiness decision review</p>
                  <h3>Handoff follow-up planning readiness decision review outcome</h3>
                </div>
                <span>{ql140Review.build}</span>
              </div>
              <div className="ql093-status-strip">
                <div>
                  <span>Review mode</span>
                  <strong>{ql140Review.handoffPlanningReadinessReviewMode.replaceAll('_', ' ')}</strong>
                </div>
                <div>
                  <span>Outcome</span>
                  <strong>{ql140Review.handoffPlanningReadinessReviewOutcome.replaceAll('_', ' ')}</strong>
                </div>
                <div>
                  <span>Owner decision</span>
                  <strong>{ql140Review.ownerDecisionStatus.replaceAll('_', ' ')}</strong>
                </div>
                <div>
                  <span>Implementation</span>
                  <strong>{ql140Review.implementationPermission.replaceAll('_', ' ')}</strong>
                </div>
              </div>
              <p className="ql093-notice">{ql140Review.ownerDecisionPacketReadinessWarning}</p>
              <ul className="ql093-status-list">
                {ql140Review.handoffPlanningReadinessReviewItems.map((item) => (
                  <li key={item.id}>
                    <strong>{item.label}</strong>
                    <span className={evidencePillClass(item.status)}>{item.status}</span>
                    <p>{item.readinessFinding}</p>
                    <small>{item.readinessDisposition}</small>
                    <p className="ql093-muted">Boundary: {item.noWriteBoundary}</p>
                  </li>
                ))}
              </ul>
            </article>

            <article className="ql093-card wide">
              <div className="ql093-grid">
                <div>
                  <p className="ql093-eyebrow">Read-only follow-up agenda</p>
                  {renderList(ql140Review.handoffPlanningReadinessReviewAgenda)}
                  <p className="ql093-muted">Prior QL-121 agenda</p>
                  {renderList(ql140Review.followUpAgenda)}
                </div>
                <div>
                  <p className="ql093-eyebrow">Decisions still deferred</p>
                  {renderList(ql140Review.deferredOwnerDecisions, 'ql093-check-list warning')}
                  <p className="ql093-muted">Outstanding owner requirements</p>
                  {renderList(ql140Review.pendingReadinessReviewApprovals, 'ql093-check-list warning')}
                  <p className="ql093-muted">Handoff requirements</p>
                  {renderList(ql140Review.handoffRequirements)}
                </div>
              </div>
            </article>

            <article className="ql093-card wide">
              <div className="ql093-grid">
                <div>
                  <p className="ql093-muted">Review scope</p>
                  {renderList(ql140Review.handoffPlanningReadinessReviewScope)}
                </div>
                <div>
                  <p className="ql093-muted">Owner decision review prerequisites</p>
                  {renderList(ql140Review.ownerDecisionReviewPrerequisites, 'ql093-check-list warning')}
                </div>
              </div>
            </article>

            <article className="ql093-card wide">
              <div className="ql093-grid">
                <div>
                  <p className="ql093-muted">Owner decision packet for review</p>
                  {renderList(ql140Review.ownerDecisionPacketForReview)}
                </div>
                <div>
                  <p className="ql093-muted">Owner approval still required</p>
                  {renderList(ql140Review.ownerDecisionApprovalStillRequired, 'ql093-check-list warning')}
                </div>
              </div>
            </article>

            <article className="ql093-card wide">
              <div className="ql093-grid">
                <div>
                  <p className="ql093-muted">Read-only owner packet review agenda</p>
                  {renderList(ql140Review.reviewedPacketReviewAgenda)}
                </div>
                <div>
                  <p className="ql093-muted">Owner decision questions for later review</p>
                  {renderList(ql140Review.ownerDecisionQuestionsForReview)}
                </div>
              </div>
            </article>

            <article className="ql093-card wide">
              <div className="ql093-grid">
                <div>
                  <p className="ql093-muted">Capture remains unauthorized</p>
                  {renderList(ql140Review.captureStillNotAuthorized, 'ql093-check-list warning')}
                </div>
                <div>
                  <p className="ql093-muted">Readiness scope</p>
                  {renderList(ql140Review.handoffPlanningReadinessReviewScope)}
                </div>
              </div>
            </article>

            <article className="ql093-card wide">
              <div className="ql093-grid">
                <div>
                  <p className="ql093-muted">Corrections required before any capture proposal</p>
                  {renderList(ql140Review.requiredCorrectionsBeforeOwnerDecisionCapture, 'ql093-check-list warning')}
                </div>
                <div>
                  <p className="ql093-muted">Readiness scope (display only)</p>
                  {renderList(ql140Review.handoffPlanningReadinessReviewScope)}
                </div>
              </div>
            </article>

            <article className="ql093-card wide">
              <div className="ql093-grid">
                <div>
                  <p className="ql093-muted">Implementation remains prohibited</p>
                  {renderList(ql140Review.implementationStillProhibited, 'ql093-check-list warning')}
                </div>
                <div>
                  <p className="ql093-muted">Future implementation prerequisites</p>
                  {renderList(ql140Review.futureImplementationPrerequisites)}
                </div>
              </div>
            </article>

            <article className="ql093-card wide">
              <div className="ql093-grid">
                <div>
                  <p className="ql093-muted">Candidate fields remain planning-only</p>
                  {renderList(ql140Review.candidateLedgerFields)}
                </div>
                <div>
                  <p className="ql093-muted">Rejected private fields remain excluded</p>
                  {renderList(ql140Review.rejectedPrivateFields, 'ql093-check-list warning')}
                </div>
              </div>
            </article>

            <article className="ql093-card wide">
              <div className="ql093-card-heading compact">
                <div>
                  <p className="ql093-eyebrow">Retained boundary</p>
                  <h3>No-write runtime locks</h3>
                </div>
                <span>{ql140Review.nextQueuedBuild}</span>
              </div>
              {renderList(ql140Review.verificationPlanReview)}
              {renderList(ql140Review.retainedNoWriteRuntime, 'ql093-check-list warning')}
              {renderList(ql140Review.retainedBoundaries)}
              {renderList(ql140Review.stopConditions, 'ql093-check-list warning')}
            </article>
          </div>
        </div>
      )}
    </section>
  );
}

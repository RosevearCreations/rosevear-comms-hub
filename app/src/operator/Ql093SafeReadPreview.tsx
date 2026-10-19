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
        <small>QL-141</small>
      </button>

      {isOpen && (
        <div className="ql093-panel" role="dialog" aria-modal="false" aria-label="QL-140 safe-read handoff readiness follow-up planning review readiness decision review follow-up planning review readiness decision review follow-up planning review readiness decision review">
          <div className="ql093-header">
            <div>
              <p className="ql093-eyebrow">QL-143 Public disabled preview</p>
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

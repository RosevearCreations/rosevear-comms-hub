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
    getLocalFallbackSafeReadResult('rosiedazzlers', 'QL-112 initial local fallback before the async bounded implementation plan draft review check runs.')
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

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setSafeReadResult(
      getLocalFallbackSafeReadResult(selectedBrandId, `QL-112 bounded implementation plan draft review safe-read check starting for ${getBrandLabel(selectedBrandId)}.`)
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
              error instanceof Error ? error.message : 'QL-112 bounded implementation plan draft review check failed and stayed on local fallback.'
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
    <section className={isOpen ? 'ql093-safe-read-preview open' : 'ql093-safe-read-preview'} aria-label="QL-112 safe-read bounded implementation plan draft review">
      <button className="ql093-toggle" onClick={() => setIsOpen((value) => !value)} type="button">
        <span aria-hidden="true">✓</span>
        Safe reads
        <small>QL-112</small>
      </button>

      {isOpen && (
        <div className="ql093-panel" role="dialog" aria-modal="false" aria-label="QL-112 safe-read bounded implementation plan draft review">
          <div className="ql093-header">
            <div>
              <p className="ql093-eyebrow">QL-112 Public disabled preview</p>
              <h2>Bounded implementation plan draft review</h2>
              <p>
                QL-112 reviews the QL-111 draft implementation plan for owner-decision planning readiness. It still does not create schema,
                routes, browser submits, Supabase writes, Phone/SMS runtime, callbacks, archives, audits, retention, AI delivery, or live pilot behavior.
              </p>
            </div>
            <button className="ql093-close" onClick={() => setIsOpen(false)} type="button" aria-label="Close QL-112 plan draft review">
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

          <div className="ql093-brand-row" aria-label="QL-112 brand filter">
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
                  <p className="ql093-eyebrow">QL-112 draft review</p>
                  <h3>Review summary</h3>
                </div>
                <span>{ql112DraftReview.build}</span>
              </div>
              <div className="ql093-status-strip">
                <div>
                  <span>Review mode</span>
                  <strong>{ql112DraftReview.reviewMode.replaceAll('_', ' ')}</strong>
                </div>
                <div>
                  <span>Outcome</span>
                  <strong>{ql112DraftReview.reviewOutcome.replaceAll('_', ' ')}</strong>
                </div>
                <div>
                  <span>Implementation</span>
                  <strong>{ql112DraftReview.implementationPermission.replaceAll('_', ' ')}</strong>
                </div>
                <div>
                  <span>Plan status</span>
                  <strong>{ql112DraftReview.implementationPlanStatus.replaceAll('_', ' ')}</strong>
                </div>
              </div>
              <p className="ql093-notice">{ql112DraftReview.draftReviewWarning}</p>
              <ul className="ql093-status-list">
                {ql112DraftReview.reviewItems.map((item) => (
                  <li key={item.id}>
                    <strong>{item.label}</strong>
                    <span className={evidencePillClass(item.status)}>{item.status}</span>
                    <p>{item.reviewFinding}</p>
                    <small>{item.requiredDisposition}</small>
                    <p className="ql093-muted">Boundary: {item.noWriteBoundary}</p>
                  </li>
                ))}
              </ul>
            </article>

            <article className="ql093-card wide">
              <div className="ql093-grid">
                <div>
                  <p className="ql093-muted">Reviewed QL-111 draft scope</p>
                  {renderList(ql112DraftReview.reviewedDraftScope)}
                </div>
                <div>
                  <p className="ql093-muted">Reviewed draft sections</p>
                  {renderList(ql112DraftReview.reviewedPlanSections, 'ql093-check-list warning')}
                </div>
              </div>
            </article>

            <article className="ql093-card wide">
              <div className="ql093-grid">
                <div>
                  <p className="ql093-muted">Approved draft-review scope</p>
                  {renderList(ql112DraftReview.approvedDraftReviewScope)}
                </div>
                <div>
                  <p className="ql093-muted">Required revisions before implementation</p>
                  {renderList(ql112DraftReview.requiredRevisionsBeforeImplementation, 'ql093-check-list warning')}
                </div>
              </div>
            </article>

            <article className="ql093-card wide">
              <div className="ql093-grid">
                <div>
                  <p className="ql093-muted">Review dispositions before next step</p>
                  {renderList(ql112DraftReview.reviewDispositionsBeforeNextStep)}
                </div>
                <div>
                  <p className="ql093-muted">Stop conditions</p>
                  {renderList(ql112DraftReview.stopConditions, 'ql093-check-list warning')}
                </div>
              </div>
            </article>

            <article className="ql093-card wide">
              <div className="ql093-grid">
                <div>
                  <p className="ql093-muted">Candidate fields remain planning-only</p>
                  {renderList(ql112DraftReview.candidateLedgerFields)}
                </div>
                <div>
                  <p className="ql093-muted">Rejected private fields remain excluded</p>
                  {renderList(ql112DraftReview.rejectedPrivateFields, 'ql093-check-list warning')}
                </div>
              </div>
            </article>

            <article className="ql093-card wide">
              <div className="ql093-card-heading compact">
                <div>
                  <p className="ql093-eyebrow">Retained boundary</p>
                  <h3>No-write runtime locks</h3>
                </div>
                <span>{ql112DraftReview.nextQueuedBuild}</span>
              </div>
              {renderList(ql112DraftReview.verificationPlanReview)}
              {renderList(ql112DraftReview.retainedNoWriteRuntime, 'ql093-check-list warning')}
              {renderList(ql112DraftReview.retainedBoundaries)}
            </article>
          </div>
        </div>
      )}
    </section>
  );
}

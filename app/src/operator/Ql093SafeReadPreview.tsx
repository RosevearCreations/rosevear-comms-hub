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

function renderList(items: readonly string[]) {
  return items.map((item) => <li key={item}>{item}</li>);
}

export function Ql093SafeReadPreview() {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedBrandId, setSelectedBrandId] = useState<BrandId>('rosiedazzlers');
  const [isLoading, setIsLoading] = useState(false);
  const [safeReadResult, setSafeReadResult] = useState<Ql093SafeReadResult>(() =>
    getLocalFallbackSafeReadResult('rosiedazzlers', 'QL-108 initial local fallback before the async bounded decision-planning check runs.')
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

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setSafeReadResult(
      getLocalFallbackSafeReadResult(selectedBrandId, `QL-108 bounded implementation decision-planning safe-read check starting for ${getBrandLabel(selectedBrandId)}.`)
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
              error instanceof Error ? error.message : 'QL-108 decision-planning check failed and stayed on local fallback.'
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
    <section className={isOpen ? 'ql093-safe-read-preview open' : 'ql093-safe-read-preview'} aria-label="QL-108 safe-read bounded implementation decision planning">
      <button className="ql093-toggle" onClick={() => setIsOpen((value) => !value)} type="button">
        <span aria-hidden="true">✓</span>
        Safe reads
        <small>QL-108</small>
      </button>

      {isOpen && (
        <div className="ql093-panel" role="dialog" aria-modal="false" aria-label="QL-108 safe-read bounded implementation decision planning">
          <div className="ql093-header">
            <div>
              <p className="ql093-eyebrow">QL-108 Public disabled preview</p>
              <h2>Safe-read evidence-ledger persistence bounded implementation decision planning</h2>
              <p>
                QL-108 plans the criteria for a later bounded implementation decision review. It still does not create schema, create a ledger,
                store acceptance, write Supabase data, call providers, enable Phone/SMS, create callbacks, write archives/audits/retention,
                or run AI delivery paths.
              </p>
            </div>
            <button className="ql093-close" onClick={() => setIsOpen(false)} type="button" aria-label="Close QL-108 decision planning">
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

          <div className="ql093-brand-row" aria-label="QL-108 brand filter">
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
                  <p className="ql093-eyebrow">QL-108 decision planning</p>
                  <h3>Bounded implementation decision plan</h3>
                </div>
                <span>{ql108DecisionPlanning.build}</span>
              </div>
              <div className="ql093-status-strip">
                <div>
                  <span>Planning mode</span>
                  <strong>{ql108DecisionPlanning.planningMode.replaceAll('_', ' ')}</strong>
                </div>
                <div>
                  <span>Outcome</span>
                  <strong>{ql108DecisionPlanning.planningOutcome.replaceAll('_', ' ')}</strong>
                </div>
                <div>
                  <span>Implementation</span>
                  <strong>{ql108DecisionPlanning.implementationPermission.replaceAll('_', ' ')}</strong>
                </div>
                <div>
                  <span>Browser writes</span>
                  <strong>{ql108DecisionPlanning.browserWriteStatus}</strong>
                </div>
              </div>
              <p className="ql093-notice">{ql108DecisionPlanning.planningWarning}</p>
              <ul className="ql093-status-list">
                {ql108DecisionPlanning.decisionItems.map((item) => (
                  <li key={item.id}>
                    <strong>{item.label}</strong>
                    <span className={evidencePillClass(item.status)}>{item.status}</span>
                    <p>{item.planningFinding}</p>
                    <small>{item.decisionRequirement}</small>
                    <p className="ql093-muted">Boundary: {item.noWriteBoundary}</p>
                  </li>
                ))}
              </ul>
            </article>

            <article className="ql093-card wide">
              <div className="ql093-card-heading compact">
                <div>
                  <p className="ql093-eyebrow">Decision criteria</p>
                  <h3>Required approvals and decision evidence</h3>
                </div>
                <span>{ql108DecisionPlanning.boundedDecisionStatus.replaceAll('_', ' ')}</span>
              </div>
              <div className="ql093-grid">
                <div>
                  <p className="ql093-muted">Bounded implementation principles</p>
                  <ul className="ql093-check-list">{renderList(ql108DecisionPlanning.boundedImplementationDecisionPrinciples)}</ul>
                </div>
                <div>
                  <p className="ql093-muted">Required pre-implementation approvals</p>
                  <ul className="ql093-check-list warning">{renderList(ql108DecisionPlanning.requiredPreImplementationApprovals)}</ul>
                </div>
              </div>
            </article>

            <article className="ql093-card wide">
              <div className="ql093-grid">
                <div>
                  <p className="ql093-muted">Required decision evidence</p>
                  <ul className="ql093-check-list">{renderList(ql108DecisionPlanning.requiredDecisionEvidence)}</ul>
                </div>
                <div>
                  <p className="ql093-muted">Required failure dispositions</p>
                  <ul className="ql093-check-list warning">{renderList(ql108DecisionPlanning.requiredFailureDispositions)}</ul>
                </div>
              </div>
            </article>

            <article className="ql093-card wide">
              <div className="ql093-card-heading compact">
                <div>
                  <p className="ql093-eyebrow">Non-negotiable boundaries</p>
                  <h3>No-write runtime remains locked</h3>
                </div>
                <span>{ql108DecisionPlanning.implementationCandidateStatus.replaceAll('_', ' ')}</span>
              </div>
              <div className="ql093-grid">
                <div>
                  <p className="ql093-muted">Implementation boundaries</p>
                  <ul className="ql093-check-list warning">{renderList(ql108DecisionPlanning.nonNegotiableImplementationBoundaries)}</ul>
                </div>
                <div>
                  <p className="ql093-muted">Runtime remains blocked</p>
                  <ul className="ql093-check-list warning">{renderList(ql108DecisionPlanning.retainedNoWriteRuntime)}</ul>
                </div>
              </div>
            </article>

            <article className="ql093-card wide">
              <div className="ql093-card-heading compact">
                <div>
                  <p className="ql093-eyebrow">Field boundary</p>
                  <h3>Candidate evidence fields remain separated from private fields</h3>
                </div>
                <span>{ql108DecisionPlanning.selectedBrandLabel}</span>
              </div>
              <div className="ql093-grid">
                <div>
                  <p className="ql093-muted">Candidate ledger fields for later review</p>
                  <ul className="ql093-check-list">{renderList(ql108DecisionPlanning.candidateLedgerFields)}</ul>
                </div>
                <div>
                  <p className="ql093-muted">Rejected private fields</p>
                  <ul className="ql093-check-list warning">{renderList(ql108DecisionPlanning.rejectedPrivateFields)}</ul>
                </div>
              </div>
            </article>

            <article className="ql093-card wide">
              <div className="ql093-card-heading">
                <div>
                  <p className="ql093-eyebrow">QL-107 retained input</p>
                  <h3>Implementation draft review retained</h3>
                </div>
                <span>{ql107DraftReview.build}</span>
              </div>
              <div className="ql093-status-strip">
                <div>
                  <span>Review outcome</span>
                  <strong>{ql107DraftReview.reviewOutcome.replaceAll('_', ' ')}</strong>
                </div>
                <div>
                  <span>Permission</span>
                  <strong>{ql107DraftReview.implementationPermission.replaceAll('_', ' ')}</strong>
                </div>
                <div>
                  <span>Passed</span>
                  <strong>{ql107DraftReview.reviewSummary.passed}</strong>
                </div>
                <div>
                  <span>Next</span>
                  <strong>{ql108DecisionPlanning.nextQueuedBuild}</strong>
                </div>
              </div>
            </article>
          </div>

          <p className="ql093-footer-note">
            Last checked {new Date(ql108DecisionPlanning.generatedAt).toLocaleString()} · Source {ql108DecisionPlanning.sourceLabel} · Next queued {ql108DecisionPlanning.nextQueuedBuild}
          </p>
        </div>
      )}
    </section>
  );
}

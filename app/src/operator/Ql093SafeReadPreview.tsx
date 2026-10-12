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

export function Ql093SafeReadPreview() {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedBrandId, setSelectedBrandId] = useState<BrandId>('rosiedazzlers');
  const [isLoading, setIsLoading] = useState(false);
  const [safeReadResult, setSafeReadResult] = useState<Ql093SafeReadResult>(() =>
    getLocalFallbackSafeReadResult('rosiedazzlers', 'QL-102 initial local fallback before the async persistence-plan review check runs.')
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

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setSafeReadResult(
      getLocalFallbackSafeReadResult(selectedBrandId, `QL-102 persistence-plan review safe-read check starting for ${getBrandLabel(selectedBrandId)}.`)
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
              error instanceof Error ? error.message : 'QL-102 persistence-plan review check failed and stayed on local fallback.'
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
    <section className={isOpen ? 'ql093-safe-read-preview open' : 'ql093-safe-read-preview'} aria-label="QL-102 safe-read persistence-plan review">
      <button className="ql093-toggle" onClick={() => setIsOpen((value) => !value)} type="button">
        <span aria-hidden="true">✓</span>
        Safe reads
        <small>QL-102</small>
      </button>

      {isOpen && (
        <div className="ql093-panel" role="dialog" aria-modal="false" aria-label="QL-102 safe-read persistence-plan review">
          <div className="ql093-header">
            <div>
              <p className="ql093-eyebrow">QL-102 Public disabled preview</p>
              <h2>Safe-read evidence-ledger persistence-plan review</h2>
              <p>
                QL-102 reviews the QL-101 persistence plan and keeps the preview display-only. It does not create schema, create a ledger,
                store acceptance, write Supabase data, call providers, enable Phone/SMS, create callbacks, write archives/audits/retention,
                or run AI delivery paths.
              </p>
            </div>
            <button
              className="ql093-close"
              onClick={() => setIsOpen(false)}
              type="button"
              aria-label="Close QL-102 safe-read persistence-plan review"
            >
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

          <div className="ql093-brand-row" aria-label="QL-102 brand filter">
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
                  <p className="ql093-eyebrow">QL-102 evidence-ledger persistence-plan review</p>
                  <h3>Review summary</h3>
                </div>
                <span>{ql102PersistenceReview.build}</span>
              </div>
              <div className="ql093-status-strip">
                <div>
                  <span>Review mode</span>
                  <strong>{ql102PersistenceReview.reviewMode.replaceAll('_', ' ')}</strong>
                </div>
                <div>
                  <span>Outcome</span>
                  <strong>{ql102PersistenceReview.reviewOutcome.replaceAll('_', ' ')}</strong>
                </div>
                <div>
                  <span>Write status</span>
                  <strong>{ql102PersistenceReview.ledgerWriteStatus.replaceAll('_', ' ')}</strong>
                </div>
                <div>
                  <span>Passed</span>
                  <strong>{ql102PersistenceReview.reviewSummary.passed}</strong>
                </div>
              </div>
              <p className="ql093-notice">{ql102PersistenceReview.reviewWarning}</p>
              <ul className="ql093-status-list">
                {ql102PersistenceReview.reviewItems.map((item) => (
                  <li key={item.id}>
                    <strong>{item.label}</strong>
                    <span className={evidencePillClass(item.status)}>{item.status}</span>
                    <p>{item.reviewFinding}</p>
                    <small>{item.requiredDecision}</small>
                    <p className="ql093-muted">Boundary: {item.noWriteBoundary}</p>
                  </li>
                ))}
              </ul>
            </article>

            <article className="ql093-card wide">
              <div className="ql093-card-heading">
                <div>
                  <p className="ql093-eyebrow">QL-101 persistence plan retained</p>
                  <h3>Plan under review</h3>
                </div>
                <span>{ql101PersistencePlan.build}</span>
              </div>
              <div className="ql093-status-strip">
                <div>
                  <span>Persistence mode</span>
                  <strong>{ql101PersistencePlan.persistenceMode.replaceAll('_', ' ')}</strong>
                </div>
                <div>
                  <span>Outcome</span>
                  <strong>{ql101PersistencePlan.persistenceOutcome.replaceAll('_', ' ')}</strong>
                </div>
                <div>
                  <span>Schema</span>
                  <strong>{ql101PersistencePlan.candidateSchemaStatus.replaceAll('_', ' ')}</strong>
                </div>
                <div>
                  <span>Passed</span>
                  <strong>{ql101PersistencePlan.persistenceSummary.passed}</strong>
                </div>
              </div>
              <ul className="ql093-status-list">
                {ql101PersistencePlan.persistenceItems.map((item) => (
                  <li key={item.id}>
                    <strong>{item.label}</strong>
                    <span className={evidencePillClass(item.status)}>{item.status}</span>
                    <p>{item.planFinding}</p>
                    <small>{item.persistenceRequirement}</small>
                    <p className="ql093-muted">Boundary: {item.noWriteBoundary}</p>
                  </li>
                ))}
              </ul>
            </article>

            <article className="ql093-card wide">
              <div className="ql093-card-heading compact">
                <div>
                  <p className="ql093-eyebrow">Reviewed persistence boundary</p>
                  <h3>Candidate fields and rejected private fields</h3>
                </div>
                <span>{ql102PersistenceReview.selectedBrandLabel}</span>
              </div>
              <div className="ql093-grid">
                <div>
                  <p className="ql093-muted">Candidate ledger fields for later planning only</p>
                  <ul className="ql093-check-list">
                    {ql102PersistenceReview.candidateLedgerFields.map((field) => (
                      <li key={field}>{field}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="ql093-muted">Rejected private fields</p>
                  <ul className="ql093-check-list warning">
                    {ql102PersistenceReview.rejectedPrivateFields.map((field) => (
                      <li key={field}>{field}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </article>

            <article className="ql093-card wide">
              <div className="ql093-card-heading compact">
                <div>
                  <p className="ql093-eyebrow">Future gates</p>
                  <h3>Required before any later implementation plan</h3>
                </div>
                <span>{ql102PersistenceReview.reviewedBuild}</span>
              </div>
              <div className="ql093-grid">
                <div>
                  <p className="ql093-muted">Future review checks</p>
                  <ul className="ql093-check-list warning">
                    {ql102PersistenceReview.requiredFutureReviewChecks.map((check) => (
                      <li key={check}>{check}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="ql093-muted">Implementation readiness gates</p>
                  <ul className="ql093-check-list">
                    {ql102PersistenceReview.implementationReadinessGates.map((gate) => (
                      <li key={gate}>{gate}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </article>

            <article className="ql093-card wide">
              <div className="ql093-card-heading compact">
                <div>
                  <p className="ql093-eyebrow">Rollback and retained boundaries</p>
                  <h3>Still blocked before persistence</h3>
                </div>
                <span>{ql102PersistenceReview.candidateSchemaStatus.replaceAll('_', ' ')}</span>
              </div>
              <div className="ql093-grid">
                <div>
                  <p className="ql093-muted">Rollback requirements</p>
                  <ul className="ql093-check-list warning">
                    {ql102PersistenceReview.rollbackPlanRequirements.map((requirement) => (
                      <li key={requirement}>{requirement}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="ql093-muted">QL-102 retained boundaries</p>
                  <ul className="ql093-check-list">
                    {ql102PersistenceReview.retainedBoundaries.map((boundary) => (
                      <li key={boundary}>{boundary}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </article>

            <article className="ql093-card wide">
              <div className="ql093-card-heading">
                <div>
                  <p className="ql093-eyebrow">Display-only conversation rows</p>
                  <h3>{getBrandLabel(selectedBrandId)} safe-read cards</h3>
                </div>
                <span>{safeReadResult.conversationRows.length} rows</span>
              </div>
              <div className="ql093-conversation-list">
                {safeReadResult.conversationRows.map((row) => (
                  <section className="ql093-conversation" key={row.id}>
                    <div>
                      <strong>{row.title}</strong>
                      <span>{row.brandName} · {row.status}</span>
                      <p>{row.summary}</p>
                    </div>
                    <blockquote>{row.draft}</blockquote>
                    <small>{row.source === 'validated_supabase' ? 'Validated Supabase synthetic row' : 'Local fallback row'} · {row.id}</small>
                  </section>
                ))}
              </div>
            </article>

            <article className="ql093-card">
              <div className="ql093-card-heading compact">
                <div>
                  <p className="ql093-eyebrow">System status</p>
                  <h3>Readiness rows</h3>
                </div>
                <span>{safeReadResult.systemStatusRows.length}</span>
              </div>
              <ul className="ql093-status-list">
                {safeReadResult.systemStatusRows.map((row) => (
                  <li key={row.id}>
                    <strong>{row.label}</strong>
                    <span className={`ql093-pill ${row.status}`}>{row.status}</span>
                    <p>{row.detail}</p>
                    <small>{row.source === 'validated_supabase' ? 'Validated Supabase synthetic row' : 'Local fallback row'}</small>
                  </li>
                ))}
              </ul>
            </article>

            <article className="ql093-card">
              <div className="ql093-card-heading compact">
                <div>
                  <p className="ql093-eyebrow">Rejected rows</p>
                  <h3>Validation discard log</h3>
                </div>
                <span>{safeReadResult.rejectedRows.length}</span>
              </div>
              {safeReadResult.rejectedRows.length > 0 ? (
                <ul className="ql093-check-list warning">
                  {safeReadResult.rejectedRows.map((row) => (
                    <li key={row}>{row}</li>
                  ))}
                </ul>
              ) : (
                <p className="ql093-muted">No remote rows were rejected in this browser check.</p>
              )}
            </article>

            <article className="ql093-card wide">
              <div className="ql093-card-heading compact">
                <div>
                  <p className="ql093-eyebrow">Runtime and review boundary</p>
                  <h3>Still disabled</h3>
                </div>
                <span>{safeReadResult.build}</span>
              </div>
              <div className="ql093-grid">
                <div>
                  <p className="ql093-muted">Reviewed plan steps</p>
                  <ul className="ql093-check-list">
                    {ql102PersistenceReview.reviewedPlanSteps.map((step) => (
                      <li key={step}>{step}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="ql093-muted">Blocked runtime</p>
                  <ul className="ql093-check-list">
                    {ql102PersistenceReview.blockedRuntime.map((runtime) => (
                      <li key={runtime}>{runtime}</li>
                    ))}
                  </ul>
                </div>
              </div>
              <p className="ql093-muted">Last checked: {new Date(ql102PersistenceReview.generatedAt).toLocaleString()}</p>
              <p className="ql093-muted">Next queued: {ql102PersistenceReview.nextQueuedBuild}</p>
            </article>
          </div>
        </div>
      )}
    </section>
  );
}

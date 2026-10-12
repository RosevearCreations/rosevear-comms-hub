import { useEffect, useState } from 'react';
import type { BrandId } from '../types';
import { buildQl094SafeReadReviewEvidence } from './ql094SafeReadReviewEvidence';
import { buildQl095SafeReadOperatorAcceptancePlan } from './ql095SafeReadOperatorAcceptance';
import { buildQl096SafeReadOperatorAcceptanceReview } from './ql096SafeReadOperatorAcceptanceReview';
import { buildQl097SafeReadOperatorAcceptanceEvidenceLedgerPlan } from './ql097SafeReadOperatorAcceptanceEvidenceLedgerPlan';
import { buildQl098SafeReadOperatorAcceptanceEvidenceLedgerReview } from './ql098SafeReadOperatorAcceptanceEvidenceLedgerReview';
import { buildQl099SafeReadOperatorAcceptanceEvidenceLedgerResolutionPlan } from './ql099SafeReadOperatorAcceptanceEvidenceLedgerResolutionPlan';
import { buildQl100SafeReadOperatorAcceptanceEvidenceLedgerResolutionReview } from './ql100SafeReadOperatorAcceptanceEvidenceLedgerResolutionReview';
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
    getLocalFallbackSafeReadResult('rosiedazzlers', 'QL-100 initial local fallback before the async evidence-ledger resolution-review check runs.')
  );

  const ql094Evidence = buildQl094SafeReadReviewEvidence(safeReadResult);
  const ql095AcceptancePlan = buildQl095SafeReadOperatorAcceptancePlan(ql094Evidence);
  const ql096AcceptanceReview = buildQl096SafeReadOperatorAcceptanceReview(ql095AcceptancePlan);
  const ql097LedgerPlan = buildQl097SafeReadOperatorAcceptanceEvidenceLedgerPlan(ql096AcceptanceReview);
  const ql098LedgerReview = buildQl098SafeReadOperatorAcceptanceEvidenceLedgerReview(ql097LedgerPlan);
  const ql099ResolutionPlan = buildQl099SafeReadOperatorAcceptanceEvidenceLedgerResolutionPlan(ql098LedgerReview);
  const ql100ResolutionReview = buildQl100SafeReadOperatorAcceptanceEvidenceLedgerResolutionReview(ql099ResolutionPlan);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setSafeReadResult(
      getLocalFallbackSafeReadResult(selectedBrandId, `QL-100 evidence-ledger resolution-review safe-read check starting for ${getBrandLabel(selectedBrandId)}.`)
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
              error instanceof Error ? error.message : 'QL-100 evidence-ledger resolution-review check failed and stayed on local fallback.'
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
    <section className={isOpen ? 'ql093-safe-read-preview open' : 'ql093-safe-read-preview'} aria-label="QL-100 safe-read evidence-ledger resolution review">
      <button className="ql093-toggle" onClick={() => setIsOpen((value) => !value)} type="button">
        <span aria-hidden="true">✓</span>
        Safe reads
        <small>QL-100</small>
      </button>

      {isOpen && (
        <div className="ql093-panel" role="dialog" aria-modal="false" aria-label="QL-100 safe-read evidence-ledger resolution review">
          <div className="ql093-header">
            <div>
              <p className="ql093-eyebrow">QL-100 Public disabled preview</p>
              <h2>Safe-read evidence-ledger resolution review</h2>
              <p>
                QL-100 reviews the QL-099 resolution plan and keeps the preview display-only. It does not create a ledger, store acceptance, write Supabase data, call providers, enable Phone/SMS, create callbacks, write archives/audits/retention, or run AI delivery paths.
              </p>
            </div>
            <button className="ql093-close" onClick={() => setIsOpen(false)} type="button" aria-label="Close QL-100 safe-read evidence-ledger resolution review">
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

          <div className="ql093-brand-row" aria-label="QL-100 brand filter">
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
                  <p className="ql093-eyebrow">QL-100 evidence-ledger resolution review</p>
                  <h3>Review summary</h3>
                </div>
                <span>{ql100ResolutionReview.build}</span>
              </div>
              <div className="ql093-status-strip">
                <div>
                  <span>Review mode</span>
                  <strong>{ql100ResolutionReview.reviewMode.replaceAll('_', ' ')}</strong>
                </div>
                <div>
                  <span>Outcome</span>
                  <strong>{ql100ResolutionReview.reviewOutcome.replaceAll('_', ' ')}</strong>
                </div>
                <div>
                  <span>Write status</span>
                  <strong>{ql100ResolutionReview.ledgerWriteStatus.replaceAll('_', ' ')}</strong>
                </div>
                <div>
                  <span>Passed</span>
                  <strong>{ql100ResolutionReview.reviewSummary.passed}</strong>
                </div>
              </div>
              <p className="ql093-notice">{ql100ResolutionReview.reviewWarning}</p>
              <ul className="ql093-status-list">
                {ql100ResolutionReview.reviewItems.map((item) => (
                  <li key={item.id}>
                    <strong>{item.label}</strong>
                    <span className={evidencePillClass(item.status)}>{item.status}</span>
                    <p>{item.reviewFinding}</p>
                    <small>{item.operatorDecision}</small>
                    <p className="ql093-muted">Boundary: {item.evidenceBoundary}</p>
                  </li>
                ))}
              </ul>
            </article>

            <article className="ql093-card wide">
              <div className="ql093-card-heading">
                <div>
                  <p className="ql093-eyebrow">QL-099 resolution plan retained</p>
                  <h3>Resolution plan under review</h3>
                </div>
                <span>{ql099ResolutionPlan.build}</span>
              </div>
              <div className="ql093-status-strip">
                <div>
                  <span>Resolution mode</span>
                  <strong>{ql099ResolutionPlan.resolutionMode.replaceAll('_', ' ')}</strong>
                </div>
                <div>
                  <span>Outcome</span>
                  <strong>{ql099ResolutionPlan.resolutionOutcome.replaceAll('_', ' ')}</strong>
                </div>
                <div>
                  <span>Write status</span>
                  <strong>{ql099ResolutionPlan.ledgerWriteStatus.replaceAll('_', ' ')}</strong>
                </div>
                <div>
                  <span>Passed</span>
                  <strong>{ql099ResolutionPlan.resolutionSummary.passed}</strong>
                </div>
              </div>
              <ul className="ql093-status-list">
                {ql099ResolutionPlan.resolutionItems.map((item) => (
                  <li key={item.id}>
                    <strong>{item.label}</strong>
                    <span className={evidencePillClass(item.status)}>{item.status}</span>
                    <p>{item.resolutionFinding}</p>
                    <small>{item.requiredResolution}</small>
                    <p className="ql093-muted">Boundary: {item.noWriteBoundary}</p>
                  </li>
                ))}
              </ul>
            </article>

            <article className="ql093-card wide">
              <div className="ql093-card-heading compact">
                <div>
                  <p className="ql093-eyebrow">Reviewed field boundary</p>
                  <h3>Approved proof fields and rejected private fields</h3>
                </div>
                <span>{ql100ResolutionReview.selectedBrandLabel}</span>
              </div>
              <div className="ql093-grid">
                <div>
                  <p className="ql093-muted">Approved proof fields for later planning only</p>
                  <ul className="ql093-check-list">
                    {ql100ResolutionReview.approvedProofFields.map((field) => (
                      <li key={field}>{field}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="ql093-muted">Rejected private fields</p>
                  <ul className="ql093-check-list warning">
                    {ql100ResolutionReview.rejectedPrivateFields.map((field) => (
                      <li key={field}>{field}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </article>

            <article className="ql093-card wide">
              <div className="ql093-card-heading compact">
                <div>
                  <p className="ql093-eyebrow">Deferred write gate</p>
                  <h3>Still blocked before any persistence plan</h3>
                </div>
                <span>{ql100ResolutionReview.reviewedBuild}</span>
              </div>
              <div className="ql093-grid">
                <div>
                  <p className="ql093-muted">Deferred write requirements</p>
                  <ul className="ql093-check-list warning">
                    {ql100ResolutionReview.deferredWriteRequirements.map((requirement) => (
                      <li key={requirement}>{requirement}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="ql093-muted">QL-100 retained boundaries</p>
                  <ul className="ql093-check-list">
                    {ql100ResolutionReview.retainedBoundaries.map((boundary) => (
                      <li key={boundary}>{boundary}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </article>

            <article className="ql093-card wide">
              <div className="ql093-card-heading">
                <div>
                  <p className="ql093-eyebrow">QL-098 evidence-ledger review retained</p>
                  <h3>Prior review still visible</h3>
                </div>
                <span>{ql098LedgerReview.build}</span>
              </div>
              <div className="ql093-status-strip">
                <div>
                  <span>Review mode</span>
                  <strong>{ql098LedgerReview.reviewMode.replaceAll('_', ' ')}</strong>
                </div>
                <div>
                  <span>Outcome</span>
                  <strong>{ql098LedgerReview.reviewOutcome.replaceAll('_', ' ')}</strong>
                </div>
                <div>
                  <span>Passed</span>
                  <strong>{ql098LedgerReview.reviewSummary.passed}</strong>
                </div>
                <div>
                  <span>Needs review</span>
                  <strong>{ql098LedgerReview.reviewSummary.review}</strong>
                </div>
              </div>
            </article>

            <article className="ql093-card wide">
              <div className="ql093-card-heading">
                <div>
                  <p className="ql093-eyebrow">QL-097 evidence ledger plan retained</p>
                  <h3>Plan still display-only</h3>
                </div>
                <span>{ql097LedgerPlan.build}</span>
              </div>
              <div className="ql093-status-strip">
                <div>
                  <span>Ledger mode</span>
                  <strong>{ql097LedgerPlan.ledgerMode.replaceAll('_', ' ')}</strong>
                </div>
                <div>
                  <span>Storage</span>
                  <strong>{ql097LedgerPlan.storageStatus.replaceAll('_', ' ')}</strong>
                </div>
                <div>
                  <span>Readiness</span>
                  <strong>{ql097LedgerPlan.ledgerReadiness.replaceAll('_', ' ')}</strong>
                </div>
                <div>
                  <span>Planned entries</span>
                  <strong>{ql097LedgerPlan.ledgerEntrySummary.planned}</strong>
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
                  <p className="ql093-muted">QL-100 retained boundaries</p>
                  <ul className="ql093-check-list">
                    {ql100ResolutionReview.retainedBoundaries.map((boundary) => (
                      <li key={boundary}>{boundary}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="ql093-muted">Blocked runtime</p>
                  <ul className="ql093-check-list">
                    {ql100ResolutionReview.blockedRuntime.map((runtime) => (
                      <li key={runtime}>{runtime}</li>
                    ))}
                  </ul>
                </div>
              </div>
              <p className="ql093-muted">Last checked: {new Date(ql100ResolutionReview.generatedAt).toLocaleString()}</p>
              <p className="ql093-muted">Next queued: {ql100ResolutionReview.nextQueuedBuild}</p>
            </article>
          </div>
        </div>
      )}
    </section>
  );
}

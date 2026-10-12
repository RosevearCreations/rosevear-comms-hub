import { useEffect, useState } from 'react';
import type { BrandId } from '../types';
import { buildQl094SafeReadReviewEvidence } from './ql094SafeReadReviewEvidence';
import { buildQl095SafeReadOperatorAcceptancePlan } from './ql095SafeReadOperatorAcceptance';
import { buildQl096SafeReadOperatorAcceptanceReview } from './ql096SafeReadOperatorAcceptanceReview';
import { buildQl097SafeReadOperatorAcceptanceEvidenceLedgerPlan } from './ql097SafeReadOperatorAcceptanceEvidenceLedgerPlan';
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
    getLocalFallbackSafeReadResult('rosiedazzlers', 'QL-097 initial local fallback before the async evidence-ledger plan check runs.')
  );

  const ql094Evidence = buildQl094SafeReadReviewEvidence(safeReadResult);
  const ql095AcceptancePlan = buildQl095SafeReadOperatorAcceptancePlan(ql094Evidence);
  const ql096AcceptanceReview = buildQl096SafeReadOperatorAcceptanceReview(ql095AcceptancePlan);
  const ql097LedgerPlan = buildQl097SafeReadOperatorAcceptanceEvidenceLedgerPlan(ql096AcceptanceReview);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setSafeReadResult(
      getLocalFallbackSafeReadResult(selectedBrandId, `QL-097 evidence-ledger plan safe-read check starting for ${getBrandLabel(selectedBrandId)}.`)
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
              error instanceof Error ? error.message : 'QL-097 evidence-ledger plan check failed and stayed on local fallback.'
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
    <section className={isOpen ? 'ql093-safe-read-preview open' : 'ql093-safe-read-preview'} aria-label="QL-097 safe-read evidence-ledger plan">
      <button className="ql093-toggle" onClick={() => setIsOpen((value) => !value)} type="button">
        <span aria-hidden="true">✓</span>
        Safe reads
        <small>QL-097</small>
      </button>

      {isOpen && (
        <div className="ql093-panel" role="dialog" aria-modal="false" aria-label="QL-097 safe-read evidence-ledger plan">
          <div className="ql093-header">
            <div>
              <p className="ql093-eyebrow">QL-097 Public disabled preview</p>
              <h2>Safe-read evidence-ledger plan</h2>
              <p>
                QL-097 plans what a future manual-acceptance evidence ledger could contain. It remains plan-only: no browser submit flow, Supabase write, provider call, Phone/SMS runtime, callback, archive, audit, retention, or AI delivery path is enabled.
              </p>
            </div>
            <button className="ql093-close" onClick={() => setIsOpen(false)} type="button" aria-label="Close QL-097 safe-read evidence-ledger plan">
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

          <div className="ql093-brand-row" aria-label="QL-097 brand filter">
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
                  <p className="ql093-eyebrow">QL-097 evidence ledger</p>
                  <h3>Ledger plan summary</h3>
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
              <p className="ql093-notice">{ql097LedgerPlan.reviewWarning}</p>
              <ul className="ql093-status-list">
                {ql097LedgerPlan.ledgerEntries.map((entry) => (
                  <li key={entry.id}>
                    <strong>{entry.label}</strong>
                    <span className={evidencePillClass(entry.status)}>{entry.status}</span>
                    <p>{entry.ledgerIntent}</p>
                    <small>Would record: {entry.evidenceToRecord.join(', ')}</small>
                    <p className="ql093-muted">Must exclude: {entry.excludedData.join(', ')}</p>
                    <p className="ql093-muted">Operator question: {entry.operatorQuestion}</p>
                  </li>
                ))}
              </ul>
            </article>

            <article className="ql093-card wide">
              <div className="ql093-card-heading compact">
                <div>
                  <p className="ql093-eyebrow">Ledger field boundary</p>
                  <h3>Proposed proof fields and exclusions</h3>
                </div>
                <span>{ql097LedgerPlan.selectedBrandLabel}</span>
              </div>
              <div className="ql093-grid">
                <div>
                  <p className="ql093-muted">Proposed future ledger fields</p>
                  <ul className="ql093-check-list">
                    {ql097LedgerPlan.proposedLedgerFields.map((field) => (
                      <li key={field}>{field}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="ql093-muted">Excluded private fields</p>
                  <ul className="ql093-check-list warning">
                    {ql097LedgerPlan.excludedFields.map((field) => (
                      <li key={field}>{field}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </article>

            <article className="ql093-card wide">
              <div className="ql093-card-heading">
                <div>
                  <p className="ql093-eyebrow">QL-096 review retained</p>
                  <h3>Operator acceptance review summary</h3>
                </div>
                <span>{ql096AcceptanceReview.build}</span>
              </div>
              <div className="ql093-status-strip">
                <div>
                  <span>Review mode</span>
                  <strong>{ql096AcceptanceReview.reviewMode.replaceAll('_', ' ')}</strong>
                </div>
                <div>
                  <span>Outcome</span>
                  <strong>{ql096AcceptanceReview.reviewOutcome.replaceAll('_', ' ')}</strong>
                </div>
                <div>
                  <span>Passed</span>
                  <strong>{ql096AcceptanceReview.checkpointSummary.passed}</strong>
                </div>
                <div>
                  <span>Needs review</span>
                  <strong>{ql096AcceptanceReview.checkpointSummary.review}</strong>
                </div>
              </div>
              <ul className="ql093-status-list">
                {ql096AcceptanceReview.reviewCheckpoints.map((checkpoint) => (
                  <li key={checkpoint.id}>
                    <strong>{checkpoint.label}</strong>
                    <span className={evidencePillClass(checkpoint.status)}>{checkpoint.status}</span>
                    <p>{checkpoint.reviewFinding}</p>
                    <small>{checkpoint.operatorDecision}</small>
                  </li>
                ))}
              </ul>
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
                  <p className="ql093-eyebrow">Runtime and retention boundary</p>
                  <h3>Still disabled</h3>
                </div>
                <span>{safeReadResult.build}</span>
              </div>
              <div className="ql093-grid">
                <div>
                  <p className="ql093-muted">QL-097 retention boundary</p>
                  <ul className="ql093-check-list">
                    {ql097LedgerPlan.retentionBoundary.map((boundary) => (
                      <li key={boundary}>{boundary}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="ql093-muted">Blocked runtime</p>
                  <ul className="ql093-check-list">
                    {ql097LedgerPlan.blockedRuntime.map((runtime) => (
                      <li key={runtime}>{runtime}</li>
                    ))}
                  </ul>
                </div>
              </div>
              <p className="ql093-muted">Last checked: {new Date(ql097LedgerPlan.generatedAt).toLocaleString()}</p>
              <p className="ql093-muted">Next queued: {ql097LedgerPlan.nextQueuedBuild}</p>
            </article>
          </div>
        </div>
      )}
    </section>
  );
}

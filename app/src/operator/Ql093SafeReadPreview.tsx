import { useEffect, useState } from 'react';
import type { BrandId } from '../types';
import { buildQl094SafeReadReviewEvidence } from './ql094SafeReadReviewEvidence';
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
    getLocalFallbackSafeReadResult('rosiedazzlers', 'QL-094 initial local fallback before the async safe-read evidence check runs.')
  );
  const ql094Evidence = buildQl094SafeReadReviewEvidence(safeReadResult);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setSafeReadResult(
      getLocalFallbackSafeReadResult(selectedBrandId, `QL-094 safe-read evidence check starting for ${getBrandLabel(selectedBrandId)}.`)
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
              error instanceof Error ? error.message : 'QL-094 safe-read evidence check failed and stayed on local fallback.'
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
    <section className={isOpen ? 'ql093-safe-read-preview open' : 'ql093-safe-read-preview'} aria-label="QL-094 safe-read review evidence">
      <button className="ql093-toggle" onClick={() => setIsOpen((value) => !value)} type="button">
        <span aria-hidden="true">✓</span>
        Safe reads
        <small>QL-094</small>
      </button>

      {isOpen && (
        <div className="ql093-panel" role="dialog" aria-modal="false" aria-label="QL-094 safe-read review and evidence">
          <div className="ql093-header">
            <div>
              <p className="ql093-eyebrow">QL-094 Public disabled preview</p>
              <h2>Safe-read review and evidence</h2>
              <p>
                The QL-094 review reuses the QL-093 validated safe-read path, records display-only evidence, and confirms the public preview still cannot write data or run live phone/SMS/AI actions.
              </p>
            </div>
            <button className="ql093-close" onClick={() => setIsOpen(false)} type="button" aria-label="Close QL-094 safe-read review">
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

          <div className="ql093-brand-row" aria-label="QL-094 brand filter">
            {brandOptions.map((brand) => (
              <button
                className={selectedBrandId === brand.id ? 'active' : ''}
                key={brand.id}
                onClick={() => setSelectedBrandId(brand.id)}
                type="button"
              >
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
                  <p className="ql093-eyebrow">QL-094 review evidence</p>
                  <h3>Safe-read evidence summary</h3>
                </div>
                <span>{ql094Evidence.build}</span>
              </div>
              <div className="ql093-status-strip">
                <div>
                  <span>Conversation rows</span>
                  <strong>{ql094Evidence.rowCounts.conversationRows}</strong>
                </div>
                <div>
                  <span>Status rows</span>
                  <strong>{ql094Evidence.rowCounts.systemStatusRows}</strong>
                </div>
                <div>
                  <span>Rejected rows</span>
                  <strong>{ql094Evidence.rowCounts.rejectedRows}</strong>
                </div>
                <div>
                  <span>Lockouts</span>
                  <strong>{ql094Evidence.rowCounts.runtimeLockouts}</strong>
                </div>
              </div>
              <ul className="ql093-status-list">
                {ql094Evidence.evidenceItems.map((item) => (
                  <li key={item.id}>
                    <strong>{item.label}</strong>
                    <span className={evidencePillClass(item.status)}>{item.status}</span>
                    <p>{item.detail}</p>
                  </li>
                ))}
              </ul>
            </article>

            <article className="ql093-card wide">
              <div className="ql093-card-heading compact">
                <div>
                  <p className="ql093-eyebrow">Evidence boundary</p>
                  <h3>Approved sources and blocked runtime</h3>
                </div>
                <span>{ql094Evidence.reviewedBuild}</span>
              </div>
              <div className="ql093-grid">
                <div>
                  <p className="ql093-muted">Approved read targets</p>
                  <ul className="ql093-check-list">
                    {ql094Evidence.approvedReadTargets.map((target) => (
                      <li key={target}>{target}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="ql093-muted">Still blocked</p>
                  <ul className="ql093-check-list">
                    {ql094Evidence.blockedRuntime.map((runtime) => (
                      <li key={runtime}>{runtime}</li>
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
                  <p className="ql093-eyebrow">Runtime lockouts</p>
                  <h3>Still disabled</h3>
                </div>
                <span>{safeReadResult.build}</span>
              </div>
              <ul className="ql093-check-list">
                {safeReadResult.safetyLockouts.map((lockout) => (
                  <li key={lockout}>{lockout}</li>
                ))}
              </ul>
              <ul className="ql093-check-list">
                {ql094Evidence.reviewerNotes.map((note) => (
                  <li key={note}>{note}</li>
                ))}
              </ul>
              <p className="ql093-muted">Last checked: {new Date(ql094Evidence.generatedAt).toLocaleString()}</p>
            </article>
          </div>
        </div>
      )}
    </section>
  );
}

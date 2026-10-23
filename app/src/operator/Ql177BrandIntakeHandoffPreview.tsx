import { useEffect, useMemo, useState } from 'react';
import type { BrandId } from '../types';
import { migrateQl173SyntheticFixtures } from '../fixtures/ql173CanonicalSynthetic';
import {
  getQl177BrandIntakes, getQl177Template, updateQl177Intake,
  type Ql177Overlay
} from './ql177BrandIntakeHandoff';
import './ql177-brand-intake-handoff.css';

export function Ql177BrandIntakeHandoffPreview({ brandId }: { brandId: BrandId }) {
  const migration = useMemo(() => migrateQl173SyntheticFixtures(), []);
  const [overlay, setOverlay] = useState<Ql177Overlay>({});
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState('Select synthetic fields to explore the internal review handoff. No external action is available.');
  const records = useMemo(() => getQl177BrandIntakes(migration, brandId, overlay), [migration, brandId, overlay]);
  const selected = records.find(row => row.conversationId === selectedId) ?? records[0];
  const template = getQl177Template(brandId);

  useEffect(() => {
    setOverlay({});
    setSelectedId(null);
    setFeedback('Brand context changed: all staged intake selections were discarded. Synthetic fixtures are unchanged.');
  }, [brandId]);

  function updateField(fieldId: string, value: string) {
    if (!selected) return;
    setOverlay(previous => updateQl177Intake(migration, brandId, previous, selected.conversationId, 'edit', fieldId, value));
    setFeedback('Synthetic intake selections changed in this screen only. Internal handoff must be staged again.');
  }

  function stage() {
    if (!selected) return;
    if (selected.missingFields.length) {
      setFeedback(`Handoff BLOCKED: ${selected.missingFields.length} required sample fields need a selection. No quote or owner decision was created.`);
      return;
    }
    setOverlay(previous => updateQl177Intake(migration, brandId, previous, selected.conversationId, 'stage'));
    setFeedback('Internal review handoff staged in screen memory only. No task, quote, booking, email, payment or owner approval was created.');
  }

  function reset() {
    if (!selected) return;
    setOverlay(previous => updateQl177Intake(migration, brandId, previous, selected.conversationId, 'reset'));
    setFeedback('Local handoff discarded. Checked-in synthetic intake defaults restored.');
  }

  return (
    <section className="ql177-preview" aria-label="QL-177 brand-specific synthetic intake and quote handoff">
      <header className="ql177-header">
        <div>
          <p className="ql177-eyebrow">QL-177 · intake & review handoff laboratory</p>
          <h3>Brand-specific intake & quote handoff</h3>
          <p>Follow a verified sample conversation into a business-specific intake checklist and a strictly internal mock review route.</p>
        </div>
        <strong className="ql177-lock">DISABLED PREVIEW · NO REAL QUOTES</strong>
      </header>
      <p className="ql177-warning" role="note">Synthetic fixtures only. Never enter a real customer's details, actual personalization, phone number, image link or credentials. No photo upload, customer send, booking, payment, provider request, owner approval, persistent record or production commitment is possible.</p>
      {!migration.verified && <p role="alert" className="ql177-error">Fixture provenance validation failed. Intake and handoff preview blocked.</p>}
      <div className="ql177-layout">
        <section className="ql177-threads" aria-label="Choose a synthetic intake conversation">
          <h4>{brandId === 'rosiedazzlers' ? 'Rosie Dazzlers' : 'Devil n Dove'} · source conversations</h4>
          <p>{records.length} pinned synthetic conversation samples</p>
          {records.length === 0 && <p>No verified intake samples available.</p>}
          {records.map(record => (
            <button key={record.id} type="button" className={selected?.id === record.id ? 'ql177-thread active' : 'ql177-thread'}
              aria-pressed={selected?.id === record.id} onClick={() => { setSelectedId(record.conversationId); setFeedback('Selected a pinned synthetic conversation for intake review.'); }}>
              <strong>{record.subject}</strong>
              <small>{record.intakeStatus === 'CANONICAL_NEEDS_REVIEW' ? 'Linked QL-004 intake' : 'Derived preview intake · no created record'}</small>
              <span>{record.missingFields.length} required selections missing</span>
            </button>
          ))}
        </section>
        <section className="ql177-panel" aria-label="Synthetic intake details and internal review handoff">
          {selected ? (
            <>
              <p className="ql177-eyebrow">Verified fixture · {selected.fixtureLabel}</p>
              <h4>{selected.subject}</h4>
              <p>{selected.contactLabel} · {selected.templateVersion}</p>
              <dl className="ql177-links">
                <div><dt>Conversation link</dt><dd>{selected.conversationId}</dd></div>
                <div><dt>Existing intake</dt><dd>{selected.linkedIntakeId ?? 'None · preview suggestion only'}</dd></div>
                <div><dt>Existing open follow-up</dt><dd>{selected.linkedTaskTitle ?? 'None · no new task created'}</dd></div>
              </dl>
              <section className="ql177-form" aria-label="Brand-specific synthetic intake form">
                <h5>{brandId === 'rosiedazzlers' ? 'Vehicle & detailing questions' : 'Maker & custom order questions'}</h5>
                <p>Fields marked required must be selected before the internal review simulation can be staged.</p>
                <div className="ql177-fields">
                  {template.map(field => (
                    <div className="ql177-field" key={field.id}>
                      <label htmlFor={`ql177-${field.id}`}>{field.label}{field.required ? ' · required' : ' · optional'}</label>
                      <select id={`ql177-${field.id}`} value={selected.fields[field.id] ?? 'not_provided'}
                        aria-describedby={`ql177-${field.id}-help`} onChange={event => updateField(field.id, event.target.value)}>
                        <option value="not_provided">Not provided · review needed</option>
                        {field.options.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
                      </select>
                      <small id={`ql177-${field.id}-help`}>{field.help}</small>
                    </div>
                  ))}
                </div>
                <label htmlFor="ql177-internal-note" className="ql177-note-label">Optional internal training note · synthetic text only</label>
                <textarea id="ql177-internal-note" rows={3} maxLength={800} value={selected.note} placeholder="Sample internal note — no personal information"
                  onChange={event => updateField('internal_note', event.target.value)} />
              </section>
              <section className="ql177-handoff" aria-label="Preview-only internal quote review handoff">
                <h5>Internal quote review · simulation only</h5>
                <dl className="ql177-links">
                  <div><dt>Mock handoff reference</dt><dd>{selected.handoffId}</dd></div>
                  <div><dt>Review target</dt><dd>{brandId === 'rosiedazzlers' ? 'Demo detailing estimator' : 'Demo maker feasibility reviewer'}</dd></div>
                  <div><dt>Handoff state</dt><dd><strong>{selected.reviewStatus.replaceAll('_', ' ')}</strong></dd></div>
                </dl>
                {selected.missingFields.length ? (
                  <p className="ql177-missing" role="note">BLOCKED — missing: {selected.missingFields.join('; ')}. No price, schedule, order or owner commitment can be generated.</p>
                ) : (
                  <p className="ql177-ready">Required sample fields selected. This can be staged for a mock internal review, not real approval.</p>
                )}
                <div className="ql177-actions">
                  <button type="button" className="ql177-stage" disabled={selected.missingFields.length > 0} onClick={stage}>Stage internal review · simulated</button>
                  <button type="button" onClick={reset}>Reset local intake</button>
                </div>
                <p role="status" aria-live="polite" className="ql177-feedback">{feedback}</p>
                <strong className="ql177-denials">NO CUSTOMER QUOTE · NO BOOKING · NO PAYMENT · NO CUSTOMER EMAIL · NO OWNER APPROVAL</strong>
              </section>
            </>
          ) : <p>No verified synthetic conversation can be selected. Handoff is disabled.</p>}
        </section>
      </div>
    </section>
  );
}

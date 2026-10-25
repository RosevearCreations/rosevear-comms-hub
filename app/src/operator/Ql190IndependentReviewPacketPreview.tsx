import { useMemo, useState } from 'react';
import type { BrandId } from '../types';
import {
  QL190_PACKET_VERSION, QL190_REVIEW_FOCUS, QL190_MEETING_AGENDA,
  QL190_SOURCE_DOCUMENTS, projectQl190Review, type Ql190Focus
} from './ql190IndependentReviewPacket';
import './ql190-independent-review.css';

const brandLabels: Record<BrandId, string> = {
  rosiedazzlers: 'Rosie Dazzlers', devilndove: 'Devil n Dove'
};
const sourceHref = (path: string) =>
  `https://github.com/RosevearCreations/rosevear-comms-hub/blob/main/${path}`;

export function Ql190IndependentReviewPacketPreview({ brandId }: { brandId: BrandId }) {
  const [packetBrand, setPacketBrand] = useState<BrandId>(brandId);
  const [focus, setFocus] = useState<Ql190Focus>('All prerequisites');
  const packet = useMemo(() => projectQl190Review(brandId, packetBrand, focus),
    [brandId, packetBrand, focus]);
  const canReview = packet.disposition === 'PACKET_REVIEW_ONLY';

  return <section className="ql190-packet" aria-labelledby="ql190-title">
    <header className="ql190-header"><div>
      <p className="ql190-kicker">QL-190 · {QL190_PACKET_VERSION}</p>
      <h3 id="ql190-title">Independent pre-pilot review packet</h3>
      <p>Draft evidence map and external-review agenda for {brandLabels[brandId]}.
        Every live phone/SMS requirement remains held until separately verified and authorized.</p>
    </div><strong className="ql190-hold">REVIEW PACKET ONLY · LIVE PILOT HELD</strong></header>
    <p className="ql190-warning" role="note"><strong>Neither this packet nor a GREEN software build approves a pilot.</strong>
      No independent reviewer has signed, no real owner decision is collected here, and no actual
      server access, consent ledger, provider, numbers, costs or customer-data permissions are enabled.
      This public preview contains no private evidence or real-world sign-off forms.</p>

    <div className="ql190-metrics" aria-label="External review readiness summary">
      <div><span>Real-pilot prerequisites held</span><strong>12 / 12</strong></div>
      <div><span>Historical source documents</span><strong>{QL190_SOURCE_DOCUMENTS.length}</strong></div>
      <div><span>Independent external reviews completed</span><strong>0 · NOT COLLECTED</strong></div>
      <div><span>Live authorizations</span><strong>0 · BLOCKED</strong></div>
    </div>

    <div className="ql190-controls" role="group" aria-label="Read-only independent review packet filters">
      <div><label htmlFor="ql190-brand">Packet business context</label><select id="ql190-brand"
        value={packetBrand} onChange={event => setPacketBrand(event.target.value as BrandId)}>
        <option value="rosiedazzlers">Rosie Dazzlers</option>
        <option value="devilndove">Devil n Dove</option>
      </select></div>
      <div><label htmlFor="ql190-focus">View reviewer evidence lane</label><select id="ql190-focus"
        value={focus} onChange={event => setFocus(event.target.value as Ql190Focus)}>
        {QL190_REVIEW_FOCUS.map(option => <option key={option} value={option}>{option}</option>)}
      </select></div>
    </div>

    <section className="ql190-outcome" role="status" aria-live="polite" aria-atomic="true">
      <h4>{packet.disposition.replaceAll('_', ' ')}</h4>
      <p>{packet.explanation}</p>
      <strong>Open holds: 12 · Reviewer signatures: 0 · Owner approvals: 0 · External writes: 0 · Calls/SMS: 0</strong>
    </section>

    {canReview && <>
      <section className="ql190-section" aria-labelledby="ql190-evidence-title">
        <h4 id="ql190-evidence-title">Checked-in source record — pointers, not approvals</h4>
        <p>These are documents for a future independent reviewer to examine and challenge. Passing the QL-190
          integrity test means the list is internally consistent; it does not verify an external action.</p>
        <div className="ql190-source-list">{QL190_SOURCE_DOCUMENTS.map(doc => <article key={doc.build}>
          <strong>{doc.build}</strong><p>{doc.purpose}</p>
          <a href={sourceHref(doc.path)} target="_blank" rel="noopener noreferrer">Inspect checked-in source</a>
        </article>)}</div>
      </section>

      <section className="ql190-section" aria-labelledby="ql190-holds-title">
        <h4 id="ql190-holds-title">Evidence still required from independent reviewers</h4>
        <p>{packet.visibleRows.length} shown in this category; <strong>all 12 are still HELD_UNVERIFIED</strong>
          regardless of this filter.</p>
        <div className="ql190-gate-list">{packet.visibleRows.map(row => <article key={row.id}>
          <div className="ql190-card-head"><h5>{row.title}</h5><span>HELD · UNVERIFIED</span></div>
          <p><strong>Reviewer lane:</strong> {row.reviewer}</p>
          <details><summary><span aria-hidden="true">ⓘ</span> Required evidence and source</summary>
            <p><strong>Current gap:</strong> {row.requiredBeforePilot}</p>
            <p><strong>External artifact needed:</strong> {row.requiredArtifact}</p>
            <p><strong>Origin:</strong> <code>{row.sourcePath}</code></p>
          </details>
        </article>)}</div>
      </section>

      <section className="ql190-section" aria-labelledby="ql190-agenda-title">
        <h4 id="ql190-agenda-title">Proposed independent review meeting agenda</h4>
        <ol>{QL190_MEETING_AGENDA.map(item => <li key={item}>{item}</li>)}</ol>
      </section>
    </>}

    <details className="ql190-help"><summary><span aria-hidden="true">ⓘ</span> What does GREEN mean for QL-190?</summary>
      <p>GREEN means the packet and disabled preview passed their software and publication checks at an exact
        main commit. It does not mean the twelve evidence gaps are closed, a lawyer or reviewer agrees,
        or a telecom provider/owner authorized live operation.</p>
    </details>
    <details className="ql190-help"><summary><span aria-hidden="true">ⓘ</span> How can we authorize a future pilot?</summary>
      <p>After separate security, database, privacy/legal, line-owner and telecom assessments produce verified
        artifacts outside this public preview, a real owner must independently authorize the precise pilot scope,
        budget, lines and rollback. That decision and its protected implementation are a future separately
        scoped change—not something this page can record or trigger.</p>
    </details>
  </section>;
}

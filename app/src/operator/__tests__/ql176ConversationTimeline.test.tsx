// @vitest-environment jsdom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { readFileSync } from 'node:fs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { migrateQl173SyntheticFixtures } from '../../fixtures/ql173CanonicalSynthetic';
import { Ql176ConversationTimelinePreview } from '../Ql176ConversationTimelinePreview';
import { getQl176BrandThreads, QL176_MAX_DRAFT_LENGTH, redactQl176Draft, stageQl176Draft } from '../ql176ConversationTimeline';

const result = migrateQl173SyntheticFixtures();

describe('QL-176 source-pinned synthetic timeline model', () => {
  it('creates six verified, cross-brand-separated timelines, preserving original source and channel', () => {
    expect(result.verified).toBe(true);
    const rosie = getQl176BrandThreads(result, 'rosiedazzlers');
    const devil = getQl176BrandThreads(result, 'devilndove');
    expect(rosie).toHaveLength(3);
    expect(devil).toHaveLength(3);
    expect(new Set([...rosie, ...devil].map(row => row.id)).size).toBe(6);
    expect(rosie.every(row => row.brandId === 'rosiedazzlers' && row.syntheticOnly)).toBe(true);
    expect(devil.every(row => row.brandId === 'devilndove' && row.syntheticOnly)).toBe(true);
    expect(rosie.map(row => row.subject).join(' ')).not.toMatch(/Custom engraved candle|Maker story/);
    expect(devil.map(row => row.subject).join(' ')).not.toMatch(/SUV interior|Ceramic quote/);
    expect([...rosie, ...devil].every(row => row.events.every(event => event.syntheticOnly && event.sourceLabel))).toBe(true);
    expect(rosie.flatMap(row => row.events).some(event => event.channel === 'missed_call')).toBe(true);
  });

  it('preserves inbound and internal-note types without masquerading as outbound deliveries', () => {
    const rows = [...getQl176BrandThreads(result, 'rosiedazzlers'), ...getQl176BrandThreads(result, 'devilndove')];
    const events = rows.flatMap(row => row.events);
    expect(events.filter(event => event.kind === 'inbound_fixture')).toHaveLength(2);
    expect(events.filter(event => event.kind === 'internal_note')).toHaveLength(4);
    expect(events.filter(event => event.kind === 'conversation_opened')).toHaveLength(6);
    expect(events.filter(event => event.kind === 'inbound_fixture').every(event => event.deliveryState === 'INBOUND_FIXTURE')).toBe(true);
    expect(events.filter(event => event.kind === 'internal_note').every(event => event.deliveryState === 'NOT_APPLICABLE')).toBe(true);
    expect(rows.every(row => row.events.every((event, index, all) => index === 0 || all[index - 1].occurredAt <= event.occurredAt))).toBe(true);
  });

  it('keeps all canonical drafts UNSENT/SIMULATED and failure examples explicitly non-sent training illustrations', () => {
    const rows = [...getQl176BrandThreads(result, 'rosiedazzlers'), ...getQl176BrandThreads(result, 'devilndove')];
    expect(rows.every(row => row.draft.deliveryState === 'UNSENT_SIMULATED')).toBe(true);
    expect(rows.filter(row => row.draft.text)).toHaveLength(4);
    const events = rows.flatMap(row => row.events);
    expect(events.filter(event => event.kind === 'draft_staged')).toHaveLength(4);
    const failures = events.filter(event => event.kind === 'mock_delivery_failure');
    expect(failures).toHaveLength(4);
    expect(failures.every(event => event.deliveryState === 'FAILED_SIMULATED' && event.label.includes('no send attempted'))).toBe(true);
    expect(failures.every(event => event.detail.includes('No real provider request') && event.sourceLabel.includes('not a provider receipt'))).toBe(true);
    expect(events.every(event => !['DELIVERED', 'SENT', 'APPROVED'].includes(event.deliveryState))).toBe(true);
  });

  it('redacts recognizable email, phone, URL, API key and bearer token values before draft state is stored', () => {
    const text = 'Email sample.person@example.ca or +1 (519) 555-0101. URL https://example.com/private and sk_live_abcdefghijkl or Bearer abcdefghijkl123456.';
    const safe = redactQl176Draft(text);
    expect(safe).toContain('[REDACTED EMAIL]');
    expect(safe).toContain('[REDACTED PHONE]');
    expect(safe).toContain('[REDACTED URL]');
    expect(safe).toContain('[REDACTED KEY]');
    expect(safe).toContain('[REDACTED TOKEN]');
    expect(safe).not.toMatch(/sample\.person|555-0101|example\.com\/private|abcdefghijkl|abcdef123456/);
    expect(redactQl176Draft('a'.repeat(2000)).length).toBe(QL176_MAX_DRAFT_LENGTH);
    expect(redactQl176Draft('hello\u0001 world')).toBe('hello world');
    expect(redactQl176Draft(null as unknown as string)).toBe('');
  });

  it('stages and discards only an ephemeral same-brand sanitized draft, with no snapshot mutation', () => {
    const id = getQl176BrandThreads(result, 'rosiedazzlers')[0].id;
    const original = JSON.stringify(result.snapshot);
    const previous = {};
    const next = stageQl176Draft(result, 'rosiedazzlers', previous, id, 'Synthetic contact: sample@example.com', 'stage');
    expect(previous).toEqual({});
    expect(next[id]).toMatchObject({ brandId: 'rosiedazzlers', text: 'Synthetic contact: [REDACTED EMAIL]', deliveryState: 'UNSENT_SIMULATED', source: 'LOCAL_SCREEN_ONLY' });
    const row = getQl176BrandThreads(result, 'rosiedazzlers', next).find(thread => thread.id === id)!;
    expect(row.draft).toMatchObject({ deliveryState: 'UNSENT_SIMULATED', source: 'LOCAL_SCREEN_ONLY' });
    expect(row.events.some(event => event.kind === 'draft_staged' && event.sourceLabel.includes('ephemeral editor'))).toBe(true);
    expect(getQl176BrandThreads(result, 'devilndove', next).every(thread => thread.draft.source === 'CANONICAL_FIXTURE')).toBe(true);
    const discard = stageQl176Draft(result, 'rosiedazzlers', next, id, '', 'discard');
    expect(discard[id]).toBeUndefined();
    expect(JSON.stringify(result.snapshot)).toBe(original);
  });

  it('fails closed on cross-brand identities, invalid operations, unverified fixtures and source drift', () => {
    const rosieId = getQl176BrandThreads(result, 'rosiedazzlers')[0].id;
    const devilId = getQl176BrandThreads(result, 'devilndove')[0].id;
    const previous = {};
    expect(stageQl176Draft(result, 'rosiedazzlers', previous, devilId, 'hello', 'stage')).toBe(previous);
    expect(stageQl176Draft(result, 'rosiedazzlers', previous, 'fake', 'hello', 'stage')).toBe(previous);
    expect(stageQl176Draft(result, 'rosiedazzlers', previous, rosieId, 'hello', 'send' as 'stage')).toBe(previous);
    expect(stageQl176Draft(result, 'rosiedazzlers', previous, rosieId, null as unknown as string, 'stage')).toBe(previous);
    expect(stageQl176Draft({ ...result, verified: false }, 'rosiedazzlers', previous, rosieId, 'hello', 'stage')).toBe(previous);
    const changed = structuredClone(result);
    changed.snapshot.messages[0].humanApproved = true;
    expect(getQl176BrandThreads(changed, 'rosiedazzlers')).toEqual([]);
    const forged = { [rosieId]: { brandId: 'rosiedazzlers' as const, text: 'unsafe text', deliveryState: 'SENT' as 'UNSENT_SIMULATED', source: 'LOCAL_SCREEN_ONLY' as const } };
    expect(getQl176BrandThreads(result, 'rosiedazzlers', forged).find(row => row.id === rosieId)?.draft.text).not.toBe('unsafe text');
  });
});

let host: HTMLDivElement;
let root: Root;

beforeEach(async () => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  host = document.createElement('div');
  document.body.append(host);
  root = createRoot(host);
  await act(async () => root.render(<Ql176ConversationTimelinePreview brandId="rosiedazzlers" />));
});

afterEach(async () => {
  await act(async () => root.unmount());
  host.remove();
  vi.restoreAllMocks();
});

async function click(label: string, selector = 'button') {
  const button = [...host.querySelectorAll<HTMLButtonElement>(selector)].find(node => node.textContent?.includes(label));
  if (!button) throw new Error(`Missing button ${label}`);
  await act(async () => button.click());
}

describe('QL-176 disabled-preview timeline and draft editor', () => {
  it('shows brand-scoped threads, timeline filtering, draft lock and zero dispatch controls', () => {
    expect(host.querySelectorAll('.ql176-thread')).toHaveLength(3);
    expect(host.querySelector('section[aria-label="Synthetic channel-aware events"]')).not.toBeNull();
    expect(host.querySelector('section[aria-label="Synthetic unsent draft composition"]')).not.toBeNull();
    expect(host.textContent).toContain('DISABLED PREVIEW · NO SEND');
    expect(host.textContent).toContain('UNSENT / SIMULATED');
    expect(host.textContent).toContain('no real messages');
    expect(host.querySelector('textarea[maxlength="800"]')).not.toBeNull();
    expect(host.querySelector('select[aria-label="Filter synthetic timeline events"]')).not.toBeNull();
    expect(host.textContent).not.toContain('Send now');
  });

  it('locally stages and discards an unsent draft without fetch or storage writes', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('network blocked'));
    const storageSpy = vi.spyOn(Storage.prototype, 'setItem');
    await click('Stage unsent simulation', '.ql176-stage');
    expect(host.textContent).toContain('Staged synthetic draft');
    expect(host.textContent).toContain('Nothing was transmitted, stored or approved.');
    expect(host.textContent).toContain('Unsent draft staged locally');
    await click('Discard local edit', '.ql176-actions button');
    expect(host.textContent).toContain('Local draft discarded');
    expect(host.textContent).not.toContain('Unsent draft staged locally');
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(storageSpy).not.toHaveBeenCalled();
  });

  it('labels simulated failures explicitly and resets selection/draft when switching brands', async () => {
    await click('Ceramic quote follow-up', '.ql176-thread');
    expect(host.textContent).toContain('TRAINING EXAMPLE · mock delivery failed (no send attempted)');
    expect(host.textContent).toContain('No real provider request, delivery attempt');
    await click('Stage unsent simulation', '.ql176-stage');
    await act(async () => root.render(<Ql176ConversationTimelinePreview brandId="devilndove" />));
    expect(host.querySelectorAll('.ql176-thread')).toHaveLength(3);
    expect(host.textContent).toContain('Devil n Dove');
    expect(host.textContent).not.toContain('Ceramic quote follow-up');
    expect(host.textContent).toContain('Staged draft edits and selection were discarded');
    await act(async () => root.render(<Ql176ConversationTimelinePreview brandId="rosiedazzlers" />));
    expect(host.textContent).not.toContain('Staged synthetic draft for Ceramic');
  });

  it('includes keyboard focus, accessible status, narrow screen and forced-colour affordances', () => {
    expect(host.querySelector('section[aria-label="Synthetic conversation selection"]')).not.toBeNull();
    expect(host.querySelector('label[for="ql176-draft-input"]')).not.toBeNull();
    expect(host.querySelector('[role="status"][aria-live="polite"]')).not.toBeNull();
    const css = readFileSync('src/operator/ql176-conversation-timeline.css', 'utf8');
    expect(css).toContain(':focus-visible');
    expect(css).toContain('@media (max-width: 680px)');
    expect(css).toContain('@media (forced-colors: active)');
    expect(css).toContain('min-height: 44px');
  });
});

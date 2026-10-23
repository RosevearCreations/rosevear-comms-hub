// @vitest-environment jsdom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { readFileSync } from 'node:fs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { migrateQl173SyntheticFixtures } from '../../fixtures/ql173CanonicalSynthetic';
import { Ql174BrandSafeTriagePreview } from '../Ql174BrandSafeTriagePreview';
import {
  QL174_DEFAULT_FILTERS, countQl174Queues, filterQl174Rows, getQl174BrandRows,
  ql174InitialQueue, simulateQl174Triage, type Ql174WorkQueue
} from '../ql174BrandSafeTriage';

const result = migrateQl173SyntheticFixtures();

describe('QL-174 brand-safe synthetic triage model', () => {
  it('derives the six stable source conversations as three per brand, with separate follow-up counts', () => {
    expect(result.verified).toBe(true);
    const rosie = getQl174BrandRows(result, 'rosiedazzlers');
    const devil = getQl174BrandRows(result, 'devilndove');
    expect(rosie).toHaveLength(3);
    expect(devil).toHaveLength(3);
    expect(rosie.every(row => row.brandId === 'rosiedazzlers' && row.assignedTo === 'unassigned' && row.simulationOnly)).toBe(true);
    expect(devil.every(row => row.brandId === 'devilndove' && row.assignedTo === 'unassigned' && row.simulationOnly)).toBe(true);
    expect(new Set([...rosie, ...devil].map(row => row.id)).size).toBe(6);
    expect(countQl174Queues(rosie)).toEqual({ all: 3, new: 0, needs_reply: 2, awaiting_customer: 1, quote: 0, follow_up: 1 });
    expect(countQl174Queues(devil)).toEqual({ all: 3, new: 0, needs_reply: 2, awaiting_customer: 0, quote: 1, follow_up: 1 });
    expect(rosie.some(row => row.draftState === 'UNSENT_SIMULATED')).toBe(true);
  });

  it('filters by queue, text/tag, priority and simulated operator; sorts deterministically', () => {
    const rows = getQl174BrandRows(result, 'rosiedazzlers');
    const needReply = filterQl174Rows(rows, { ...QL174_DEFAULT_FILTERS, queue: 'needs_reply' });
    expect(needReply).toHaveLength(2);
    expect(filterQl174Rows(rows, { ...QL174_DEFAULT_FILTERS, queue: 'new' })).toHaveLength(0);
    expect(filterQl174Rows(rows, { ...QL174_DEFAULT_FILTERS, queue: 'follow_up' })).toHaveLength(1);
    expect(filterQl174Rows(rows, { ...QL174_DEFAULT_FILTERS, query: 'ceramic' }).map(row => row.subject)).toEqual(['Ceramic quote follow-up']);
    expect(filterQl174Rows(rows, { ...QL174_DEFAULT_FILTERS, query: 'NONEXISTENT' })).toHaveLength(0);
    expect(filterQl174Rows(rows, { ...QL174_DEFAULT_FILTERS, priority: 'high' })).toHaveLength(1);
    expect(filterQl174Rows(rows, { ...QL174_DEFAULT_FILTERS, assignment: 'brand_demo_operator' })).toHaveLength(0);
    expect(filterQl174Rows(rows, { ...QL174_DEFAULT_FILTERS, sort: 'priority' })[0].priority).toBe('high');
    expect(filterQl174Rows(rows, { ...QL174_DEFAULT_FILTERS, sort: 'recent' }).map(row => row.id))
      .toEqual(filterQl174Rows(rows, { ...QL174_DEFAULT_FILTERS, sort: 'recent' }).map(row => row.id));
  });

  it('simulates a queue/assignment move without mutating canonical fixtures or creating a task/approval', () => {
    const id = getQl174BrandRows(result, 'rosiedazzlers')[0].id;
    const snapshotBefore = JSON.stringify(result.snapshot);
    const moved = simulateQl174Triage(result, 'rosiedazzlers', {}, id, 'new', 'brand_demo_operator');
    expect(moved[id]).toEqual({ queue: 'new', assignedTo: 'brand_demo_operator' });
    const rows = getQl174BrandRows(result, 'rosiedazzlers', moved);
    expect(rows.find(row => row.id === id)?.queue).toBe('new');
    expect(rows.find(row => row.id === id)?.operatorLabel).toBe('Rosie demo operator');
    expect(getQl174BrandRows(result, 'devilndove', moved).every(row => row.operatorLabel === 'Unassigned')).toBe(true);
    expect(JSON.stringify(result.snapshot)).toBe(snapshotBefore);
    expect(result.snapshot.followUpTasks).toHaveLength(2);
    expect(result.snapshot.messages.every(message => !message.humanApproved)).toBe(true);
  });

  it('denies cross-brand, unknown, unsafe queue, invalid assignment and unverified fixture transitions', () => {
    const rosieId = getQl174BrandRows(result, 'rosiedazzlers')[0].id;
    const devilId = getQl174BrandRows(result, 'devilndove')[0].id;
    const none = {};
    expect(simulateQl174Triage(result, 'rosiedazzlers', none, devilId, 'quote', 'brand_demo_operator')).toBe(none);
    expect(simulateQl174Triage(result, 'devilndove', none, rosieId, 'quote', 'brand_demo_operator')).toBe(none);
    expect(simulateQl174Triage(result, 'rosiedazzlers', none, 'fake-conversation', 'new', 'unassigned')).toBe(none);
    expect(simulateQl174Triage(result, 'rosiedazzlers', none, rosieId, 'approved' as Ql174WorkQueue, 'unassigned')).toBe(none);
    expect(simulateQl174Triage(result, 'rosiedazzlers', none, rosieId, 'new', 'real_owner' as 'unassigned')).toBe(none);
    expect(simulateQl174Triage({ ...result, verified: false }, 'rosiedazzlers', none, rosieId, 'new', 'unassigned')).toBe(none);
    const corrupt = structuredClone(result);
    corrupt.snapshot.conversations[0].brandId = corrupt.snapshot.conversations[0].brandId === 'rosiedazzlers' ? 'devilndove' : 'rosiedazzlers';
    expect(getQl174BrandRows(corrupt, 'rosiedazzlers')).toEqual([]);
    expect(ql174InitialQueue('approved')).toBeNull();
    expect(ql174InitialQueue('archived')).toBeNull();
  });
});

let host: HTMLDivElement;
let root: Root;

beforeEach(async () => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  host = document.createElement('div');
  document.body.append(host);
  root = createRoot(host);
  await act(async () => root.render(<Ql174BrandSafeTriagePreview brandId="rosiedazzlers" />));
});

afterEach(async () => {
  await act(async () => root.unmount());
  host.remove();
  vi.restoreAllMocks();
});

function clickButton(label: string, selector = 'button') {
  const button = [...host.querySelectorAll<HTMLButtonElement>(selector)].find(node => node.textContent?.includes(label));
  if (!button) throw new Error(`Missing ${label}`);
  return act(async () => button.click());
}

describe('QL-174 operator triage preview accessibility and disabled boundaries', () => {
  it('starts with labelled queue filters, synthetic counts, disabled-only banner and accessible controls', () => {
    expect(host.querySelectorAll('.ql174-queue')).toHaveLength(6);
    expect(host.querySelectorAll('.ql174-item')).toHaveLength(3);
    expect(host.querySelector('.ql174-warning')?.textContent).toContain('No phone calls, SMS');
    expect(host.textContent).toContain('DISABLED PREVIEW · UNSENT');
    expect(host.querySelectorAll('input[type="search"]')).toHaveLength(1);
    expect(host.querySelectorAll('.ql174-filter-bar select')).toHaveLength(3);
    expect(host.querySelector('.ql174-list-count')?.textContent).toContain('3 of 3 synthetic conversations for Rosie Dazzlers');
  });

  it('filters queue buttons and locally simulates triage without network or storage writes', async () => {
    const storageSpy = vi.spyOn(Storage.prototype, 'setItem');
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('no requests allowed'));
    await clickButton('Needs reply', '.ql174-queue');
    expect(host.querySelectorAll('.ql174-item')).toHaveLength(2);
    const selector = host.querySelector<HTMLSelectElement>('select[aria-label="Simulated destination queue"]')!;
    await act(async () => {
      selector.value = 'new';
      selector.dispatchEvent(new Event('change', { bubbles: true }));
    });
    await clickButton('Apply simulated triage', '.ql174-apply');
    expect(host.textContent).toContain('Simulated only');
    expect(host.textContent).toContain('Nothing was sent or saved');
    await clickButton('New', '.ql174-queue');
    expect(host.querySelectorAll('.ql174-item')).toHaveLength(1);
    await clickButton('Reset simulated changes', '.ql174-footer button');
    expect(host.querySelectorAll('.ql174-item')).toHaveLength(0);
    expect(storageSpy).not.toHaveBeenCalled();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('resets brand-specific selection and never exposes opposite-brand conversation cards', async () => {
    await act(async () => root.render(<Ql174BrandSafeTriagePreview brandId="devilndove" />));
    expect(host.querySelectorAll('.ql174-item')).toHaveLength(3);
    const labels = [...host.querySelectorAll('.ql174-item')].map(node => node.textContent ?? '');
    expect(labels.some(label => label.includes('Custom order'))).toBe(true);
    expect(labels.every(label => !label.includes('Ceramic quote') && !label.includes('SUV interior'))).toBe(true);
    expect(host.querySelector('.ql174-list-count')?.textContent).toContain('Devil n Dove');
    expect(host.textContent).toContain('Brand changed. Synthetic triage is scoped');
  });

  it('retains keyboard-focus indicators, narrow-screen layout and forced-colour selection', () => {
    const css = readFileSync('src/operator/ql174-brand-safe-triage.css', 'utf8');
    expect(css).toContain(':focus-visible');
    expect(css).toContain('@media (max-width: 640px)');
    expect(css).toContain('@media (forced-colors: active)');
    expect(css).toContain('min-height: 44px');
  });
});

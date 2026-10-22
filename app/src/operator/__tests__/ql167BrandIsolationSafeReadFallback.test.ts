import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  localFallbackConversations,
  reconcileQl167SyntheticReadBatches,
  type Ql167SyntheticReadBatch
} from '../ql093ValidatedSyntheticSafeReads';

const rosie = {
  id: 'rosie-ceramic-quote', brand_id: 'rosiedazzlers', brand_name: 'Rosie Dazzlers',
  title: 'Synthetic detailing question', status: 'preview', summary: 'An invented example',
  draft: 'Draft only', created_at: '2026-10-22T10:00:00Z'
};
const devil = {
  ...rosie, id: 'devil-custom-order', brand_id: 'devilndove', brand_name: 'Devil n Dove',
  title: 'Synthetic custom-order question'
};
const system = {
  id: 'ql093-local-fallback-active', label: 'Public synthetic preview', status: 'ready',
  detail: 'No live connections', created_at: '2026-10-22T10:00:00Z'
};
const remote = (rows: unknown): Ql167SyntheticReadBatch => ({ source: 'supabase', rows });
const fallback = (): Ql167SyntheticReadBatch => ({ source: 'fallback', rows: [], error: 'Read unavailable' });

function inspect(conversations: Ql167SyntheticReadBatch, statuses = remote([system]), brand: 'rosiedazzlers' | 'devilndove' = 'rosiedazzlers') {
  return reconcileQl167SyntheticReadBatches(brand, conversations, statuses);
}

describe('QL-167 brand isolation and fail-closed synthetic safe reads', () => {
  it('accepts only valid public synthetic rows for the selected brand', () => {
    const result = inspect(remote([rosie]));
    expect(result.source).toBe('validated_supabase');
    expect(result.conversationRows.map(row => row.id)).toEqual([rosie.id]);
    expect(result.conversationRows[0].source).toBe('validated_supabase');
    expect(result.systemStatusRows[0].source).toBe('validated_supabase');
    expect(result.fixtureProvenance.verified).toBe(true);
  });

  it('rejects a foreign brand even when the record is otherwise valid', () => {
    const result = inspect(remote([devil]));
    expect(result.source).toBe('partial_supabase_with_fallback');
    expect(result.conversationRows.map(row => row.id)).toEqual(['rosie-ceramic-quote', 'rosie-missed-call']);
    expect(result.rejectedRows.join(' ')).toContain('does not match selected preview brand');
    expect(result.conversationRows.every(row => row.brandId === 'rosiedazzlers')).toBe(true);
  });

  it('fails the entire conversation batch when a foreign row accompanies a valid row', () => {
    const result = inspect(remote([rosie, devil]));
    expect(result.conversationRows).toEqual(localFallbackConversations.filter(row => row.brandId === 'rosiedazzlers'));
    expect(result.conversationRows.every(row => row.source === 'local_fallback')).toBe(true);
  });

  it('keeps Devil n Dove isolated and refuses a mismatched brand display name', () => {
    expect(inspect(remote([devil]), fallback(), 'devilndove').conversationRows.map(row => row.id)).toEqual([devil.id]);
    const spoof = inspect(remote([{ ...devil, brand_name: 'Rosie Dazzlers' }]), fallback(), 'devilndove');
    expect(spoof.conversationRows.every(row => row.source === 'local_fallback')).toBe(true);
    expect(spoof.rejectedRows.join(' ')).toContain('brand name does not match');
  });

  it.each([
    ['private field', [{ ...rosie, customer_id: 'real-customer' }]],
    ['nested field', [{ ...rosie, provider_payload: { secret: true } }]],
    ['unsafe status', [{ ...rosie, status: 'sms_sent' }]],
    ['bad timestamp', [{ ...rosie, created_at: 'not-a-date' }]],
    ['missing property', [{ id: rosie.id, brand_id: rosie.brand_id }]],
    ['null row', [rosie, null]],
    ['array row', [[rosie]]],
    ['duplicate ids', [rosie, { ...rosie }]],
    ['null payload', null],
    ['object payload', { data: [rosie] }],
    ['empty batch', []],
    ['oversized batch', Array.from({ length: 101 }, (_, i) => ({ ...rosie, id: `fixture-${i}` }))]
  ])('falls back for %s without displaying partial remote conversation data', (_label, rows) => {
    const result = inspect(remote(rows));
    expect(result.conversationRows.map(row => row.id)).toEqual(['rosie-ceramic-quote', 'rosie-missed-call']);
    expect(result.conversationRows.every(row => row.source === 'local_fallback')).toBe(true);
    expect(result.fallbackReason).toContain('QL-167');
  });

  it('isolates a malformed system status batch while retaining valid brand-scoped conversations', () => {
    const result = inspect(remote([rosie]), remote([system, { ...system, status: 'delivered' }]));
    expect(result.source).toBe('partial_supabase_with_fallback');
    expect(result.conversationRows[0].source).toBe('validated_supabase');
    expect(result.systemStatusRows.every(row => row.source === 'local_fallback')).toBe(true);
    expect(result.rejectedRows.join(' ')).toContain('system status');
  });

  it('falls back independently on read failure and preserves immutable safety lockouts', () => {
    const result = inspect(fallback(), fallback());
    expect(result.source).toBe('local_fallback');
    expect(result.conversationRows.every(row => row.source === 'local_fallback')).toBe(true);
    expect(result.safetyLockouts.some(lock => lock.includes('No browser writes'))).toBe(true);
    expect(result.safetyLockouts.some(lock => lock.includes('No Phone/SMS'))).toBe(true);
  });

  it('enforces a brand filter at the synthetic public-view query boundary without write methods', () => {
    const source = readFileSync('src/integrations/supabaseReadOnlyClient.ts', 'utf8');
    expect(source).toContain(".from('ql_public_synthetic_conversations')");
    expect(source).toContain(".eq('brand_id', selectedBrandId)");
    expect(source).toContain(".from('ql_public_system_status')");
    expect(source).not.toMatch(/\.insert\(|\.upsert\(|\.update\(|\.delete\(|\.rpc\(|\.upload\(/);
    expect(source).toContain('persistSession: false');
  });
});

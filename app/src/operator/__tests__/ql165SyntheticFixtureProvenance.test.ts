import { describe, expect, it } from 'vitest';
import {
  localFallbackConversations,
  localFallbackSystemStatus,
  getLocalFallbackSafeReadResult
} from '../ql093ValidatedSyntheticSafeReads';
import {
  QL165_FIXTURE_SET_VERSION,
  fingerprintQl165Fixture,
  ql165FixtureManifest,
  verifyQl165SyntheticFixtures
} from '../ql165SyntheticFixtureProvenance';

const conversations = () => structuredClone(localFallbackConversations);
const statuses = () => structuredClone(localFallbackSystemStatus);

describe('QL-165 stable synthetic fixture provenance', () => {
  it('pins all six approved fixture IDs, kinds, revisions and exact content', () => {
    const observed = [
      ...conversations().map(row => ({ id: row.id, kind: 'conversation', revision: 1, fingerprint: fingerprintQl165Fixture(row) })),
      ...statuses().map(row => ({ id: row.id, kind: 'system-status', revision: 1, fingerprint: fingerprintQl165Fixture(row) }))
    ];
    expect(observed).toEqual(ql165FixtureManifest);
    expect(verifyQl165SyntheticFixtures(conversations(), statuses())).toMatchObject({
      setVersion: QL165_FIXTURE_SET_VERSION, schemaVersion: 1, verified: true, fixtureCount: 6, failures: []
    });
  });

  it('maintains stable identities independent of record ordering', () => {
    expect(verifyQl165SyntheticFixtures([...conversations()].reverse(), [...statuses()].reverse()).verified).toBe(true);
  });

  it('keeps the normal preview synthetic and read-only with verified local provenance', () => {
    const rosie = getLocalFallbackSafeReadResult('rosiedazzlers', 'Local only');
    const devil = getLocalFallbackSafeReadResult('devilndove', 'Local only');
    expect(rosie.fixtureProvenance.verified).toBe(true);
    expect(devil.fixtureProvenance.verified).toBe(true);
    expect(rosie.conversationRows.map(row => row.id)).toEqual(['rosie-ceramic-quote', 'rosie-missed-call']);
    expect(devil.conversationRows.map(row => row.id)).toEqual(['devil-custom-order', 'devil-maker-story']);
    expect(rosie.safetyLockouts.every(value => value.startsWith('No '))).toBe(true);
  });

  it.each([
    ['edited draft', () => { const rows = conversations(); rows[0].draft += ' Altered.'; return [rows, statuses()] as const; }, 'fixture content drift'],
    ['changed brand', () => { const rows = conversations(); rows[0].brandId = 'devilndove'; return [rows, statuses()] as const; }, 'fixture content drift'],
    ['changed timestamp', () => { const rows = conversations(); rows[0].createdAt = '2020-01-01'; return [rows, statuses()] as const; }, 'fixture content drift'],
    ['missing fixture', () => [conversations().slice(1), statuses()] as const, 'missing fixture'],
    ['duplicate fixture', () => [[...conversations(), conversations()[0]], statuses()] as const, 'duplicate fixture identity'],
    ['unexpected fixture', () => [[...conversations(), { ...conversations()[0], id: 'unreviewed-sample' }], statuses()] as const, 'unrecognized fixture identity'],
    ['forged local source', () => { const rows = conversations(); rows[0].source = 'validated_supabase'; return [rows, statuses()] as const; }, 'unexpected fixture source'],
    ['status changed', () => { const rows = statuses(); rows[1].status = 'ready'; return [conversations(), rows] as const; }, 'fixture content drift'],
    ['missing safety status', () => [conversations(), statuses().slice(1)] as const, 'missing fixture']
  ])('blocks %s', (_description, mutate, expectedError) => {
    const [conversationRows, statusRows] = mutate();
    const verification = verifyQl165SyntheticFixtures(conversationRows, statusRows);
    expect(verification.verified).toBe(false);
    expect(verification.failures.some(value => value.includes(expectedError))).toBe(true);
  });

  it('rejects a stale fixture set version even when every row matches', () => {
    const review = verifyQl165SyntheticFixtures(conversations(), statuses(), 'ql093-local-fallback-v0');
    expect(review.verified).toBe(false);
    expect(review.failures).toContain('fixture set version mismatch: ql093-local-fallback-v0');
  });
});

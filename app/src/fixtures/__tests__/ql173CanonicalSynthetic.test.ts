import { describe, expect, it } from 'vitest';
import { seedDb } from '../../data/seedData';
import { fingerprintQl165Fixture } from '../../operator/ql165SyntheticFixtureProvenance';
import { localFallbackConversations, localFallbackSystemStatus } from '../../operator/ql093ValidatedSyntheticSafeReads';
import {
  QL173_APPROVED_SEED_FINGERPRINT,
  QL173_FIXTURE_SET_VERSION,
  createQl173CanonicalSnapshot,
  getQl173BrandConversations,
  migrateQl173SyntheticFixtures,
  validateQl173CanonicalSnapshot
} from '../ql173CanonicalSynthetic';

describe('QL-173 canonical synthetic fixture migration', () => {
  it('pins the independently reviewed QL-004 source fixture', () => {
    expect(fingerprintQl165Fixture(seedDb)).toBe(QL173_APPROVED_SEED_FINGERPRINT);
  });

  it('merges both checked-in fixture families with stable unique IDs and traceable provenance', () => {
    const migration = migrateQl173SyntheticFixtures();
    expect(migration.issues).toEqual([]);
    expect(migration.verified).toBe(true);
    const snapshot = migration.snapshot;
    expect(snapshot.fixtureSetVersion).toBe(QL173_FIXTURE_SET_VERSION);
    expect(snapshot.contacts).toHaveLength(6);
    expect(snapshot.conversations).toHaveLength(6);
    expect(snapshot.messages).toHaveLength(6);
    expect(snapshot.followUpTasks).toHaveLength(2);
    expect(snapshot.intakeRequests).toHaveLength(1);
    expect(snapshot.auditEvents).toHaveLength(1);
    expect(snapshot.drafts).toHaveLength(4);
    expect(new Set(Object.values(snapshot).filter(Array.isArray).flatMap(rows => rows.map(row => row.id))).size).toBe(26);
    expect(snapshot.contacts.every(row => row.provenance.synthetic && row.phone === undefined && row.email === undefined && row.town === undefined)).toBe(true);
    expect(snapshot.messages.every(row => row.humanApproved === false && row.direction !== 'outbound')).toBe(true);
    expect(snapshot.drafts.every(row => row.state === 'UNSENT_SIMULATED')).toBe(true);
    expect(snapshot.conversations.map(row => row.id)).toEqual(createQl173CanonicalSnapshot(seedDb, [...localFallbackConversations].reverse()).conversations.map(row => row.id));
    expect(snapshot.conversations.every(row => row.provenance.recordFingerprint.startsWith('fnv1a64:'))).toBe(true);
  });

  it('isolates two brands and exposes no sent or approved path', () => {
    const result = migrateQl173SyntheticFixtures();
    expect(getQl173BrandConversations(result, 'rosiedazzlers')).toHaveLength(3);
    expect(getQl173BrandConversations(result, 'devilndove')).toHaveLength(3);
    expect(getQl173BrandConversations(result, 'rosiedazzlers').every(row => row.brandId === 'rosiedazzlers' && row.isUnsent)).toBe(true);
    expect(getQl173BrandConversations(result, 'devilndove').every(row => row.brandId === 'devilndove' && row.isUnsent)).toBe(true);
    expect(getQl173BrandConversations({ ...result, verified: false }, 'devilndove')).toEqual([]);
  });

  it.each([
    ['orphan conversation contact', (snapshot: ReturnType<typeof createQl173CanonicalSnapshot>) => { snapshot.conversations[0].contactId = 'missing'; }],
    ['cross-brand conversation/contact', (snapshot: ReturnType<typeof createQl173CanonicalSnapshot>) => { snapshot.conversations[0].brandId = snapshot.conversations[0].brandId === 'devilndove' ? 'rosiedazzlers' : 'devilndove'; }],
    ['orphan message', (snapshot: ReturnType<typeof createQl173CanonicalSnapshot>) => { snapshot.messages[0].conversationId = 'missing'; }],
    ['unsafe synthetic message approval/delivery', (snapshot: ReturnType<typeof createQl173CanonicalSnapshot>) => { snapshot.messages[0].humanApproved = true; }],
    ['unsafe delivery state', (snapshot: ReturnType<typeof createQl173CanonicalSnapshot>) => { snapshot.drafts[0].state = 'SENT' as 'UNSENT_SIMULATED'; }],
    ['missing or drifted provenance', (snapshot: ReturnType<typeof createQl173CanonicalSnapshot>) => { snapshot.conversations[0].provenance.recordFingerprint = 'fnv1a64:0000000000000000'; }],
    ['schema drift', (snapshot: ReturnType<typeof createQl173CanonicalSnapshot>) => { Object.assign(snapshot.conversations[0], { privatePayload: 'forbidden' }); }],
    ['duplicate global identity', (snapshot: ReturnType<typeof createQl173CanonicalSnapshot>) => { snapshot.messages[1].id = snapshot.messages[0].id; }],
    ['non-deterministic sort order', (snapshot: ReturnType<typeof createQl173CanonicalSnapshot>) => { snapshot.messages.reverse(); }],
    ['orphan intake contact', (snapshot: ReturnType<typeof createQl173CanonicalSnapshot>) => { snapshot.intakeRequests[0].contactId = 'missing'; }],
    ['orphan task conversation', (snapshot: ReturnType<typeof createQl173CanonicalSnapshot>) => { snapshot.followUpTasks[0].conversationId = 'missing'; }],
    ['orphan draft', (snapshot: ReturnType<typeof createQl173CanonicalSnapshot>) => { snapshot.drafts[0].conversationId = 'missing'; }],
    ['source set version drift', (snapshot: ReturnType<typeof createQl173CanonicalSnapshot>) => { snapshot.sourcePins.ql004 = 'unreviewed'; }],
    ['private/non-synthetic contact fields', (snapshot: ReturnType<typeof createQl173CanonicalSnapshot>) => { snapshot.contacts[0].email = 'someone@example.com'; }]
  ] as const)('rejects %s', (expected, mutate) => {
    const snapshot = structuredClone(createQl173CanonicalSnapshot());
    mutate(snapshot);
    expect(validateQl173CanonicalSnapshot(snapshot).some(issue => issue.includes(expected))).toBe(true);
  });

  it('fails closed for drifted QL-093 fixtures and QL-004 source data', () => {
    const changedFallbacks = structuredClone(localFallbackConversations);
    changedFallbacks[0].title = 'altered';
    const failedPin = migrateQl173SyntheticFixtures(seedDb, changedFallbacks, localFallbackSystemStatus);
    expect(failedPin.verified).toBe(false);
    expect(failedPin.snapshot.conversations).toEqual([]);
    expect(getQl173BrandConversations(failedPin, 'rosiedazzlers')).toEqual([]);
    const changedSeed = structuredClone(seedDb);
    changedSeed.contacts[0].notes = 'modified fixture';
    expect(migrateQl173SyntheticFixtures(changedSeed).issues).toContain('QL-004 source fixture content drift');
    expect(migrateQl173SyntheticFixtures(seedDb, localFallbackConversations, []).verified).toBe(false);
  });

  it('does not expose partial records when a synthetic source is malformed', () => {
    const invalid = [null] as unknown as typeof localFallbackConversations;
    const failed = migrateQl173SyntheticFixtures(seedDb, invalid);
    expect(failed.verified).toBe(false);
    expect(failed.snapshot.contacts).toEqual([]);
    expect(failed.issues).toContain('malformed checked-in synthetic source');
  });
});

import { describe, expect, it } from 'vitest';
import { QL249_RELEASE, QL249_SOURCE_SNAPSHOT, QL249_TEST_SLOT_GATE } from '../ql249OriginRetest';

describe('QL-249 independent public GitHub snapshot', () => {
  it('records exactly six distinct source SHAs and missing source-proof files', () => {
    expect(QL249_RELEASE).toContain('ql249');
    expect(QL249_SOURCE_SNAPSHOT).toHaveLength(6);
    expect(QL249_SOURCE_SNAPSHOT.every(row => /^[0-9a-f]{40}$/.test(row.mainSha))).toBe(true);
    expect(new Set(QL249_SOURCE_SNAPSHOT.map(row => row.repository)).size).toBe(6);
    expect(QL249_SOURCE_SNAPSHOT.every(row => row.proof === 'MISSING (404)')).toBe(true);
  });
  it('never schedules or authorizes a real gateway GET or pilot', () => {
    expect(QL249_TEST_SLOT_GATE).toMatchObject({ status: 'NOT_SCHEDULED',
      ownerTestAuthorization: 'NOT_GIVEN', githubOriginAndCiConfirmed: 0,
      separatelyPinnedPublicKeys: 0, actualGatewayTests: 0,
      allowedMethods: ['GET'], connectionState: 'DISCONNECTED',
      realPilotHolds: 12, writes: 0, calls: 0, sms: 0, dispatch: 0 });
    expect(QL249_TEST_SLOT_GATE.allowedPaths).toEqual([
      '/api/integration/v1/health', '/api/integration/v1/capabilities'
    ]);
  });
});

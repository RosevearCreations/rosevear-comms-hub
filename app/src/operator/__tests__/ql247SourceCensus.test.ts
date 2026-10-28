import { describe, expect, it } from 'vitest';
import { QL247_RELEASE, QL247_SOURCE_CENSUS, QL247_DECISION } from '../ql247SourceCensus';

describe('QL-247 disabled-preview source census', () => {
  it('identifies exactly the six real GitHub companion repositories', () => {
    expect(QL247_RELEASE).toContain('ql247-six-app-github-source-census');
    expect(QL247_SOURCE_CENSUS.map(x => x.repository)).toEqual([
      'ai-data-platform','devilndove-site','rosiedazzlers','yw','iCamp','rosevear-ai-hub'
    ]);
    expect(new Set(QL247_SOURCE_CENSUS.map(x => x.mainSha)).size).toBe(6);
    expect(QL247_SOURCE_CENSUS.every(x => /^[a-f0-9]{40}$/.test(x.mainSha)
      && x.blocker.length > 10)).toBe(true);
  });
  it('never promotes source code availability to a real approved connection', () => {
    expect(QL247_DECISION).toEqual({
      actualConnection: 'DISCONNECTED', actualOwnerApproval: 'NOT GIVEN',
      genuinePublicProofs: 0, independentlyVerifiedSignatures: 0,
      livePilotHolds: 12, calls: 0, sms: 0, writes: 0, dispatch: 0
    });
  });
});

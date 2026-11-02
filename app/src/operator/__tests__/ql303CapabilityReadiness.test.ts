import {describe,it,expect} from 'vitest';
import {QL303_GATES,QL303_ROWS,ql303AgeDays,ql303Classify,ql303ImmutableProofUrl,ql303NotificationCandidate} from '../ql303CapabilityReadiness';

describe('QL-303 six-app immutable capability review',()=>{
  it('keeps four businesses and two supporting services isolated and disconnected',()=>{
    expect(QL303_ROWS).toHaveLength(6);
    expect(QL303_ROWS.filter(row=>row.kind==='Business app')).toHaveLength(4);
    expect(QL303_ROWS.filter(row=>row.kind!=='Business app')).toHaveLength(2);
    expect(QL303_GATES).toHaveLength(5);
    for(const row of QL303_ROWS){expect(row.connection).toBe('DISCONNECTED / HOLD');expect(row.permission).toBe('DENIED');expect(row.approvedGates).toBe(0);expect(row.historicalHttp).toBe(404);expect(row.observedHttp).toBe(404);expect(row.observedAt).toBe('2026-11-02T01:20:55Z');}
  });
  it('uses each immutable forty-character commit pin, never the moving main ref',()=>{
    for(const row of QL303_ROWS){const url=ql303ImmutableProofUrl(row.id);expect(url).toContain(`/repos/RosevearCreations/${row.repo}/contents/docs/integration/ql246-source-proof.json?ref=${row.sha}`);expect(row.sha).toMatch(/^[a-f0-9]{40}$/);expect(url).not.toContain('ref=main');}
    expect(()=>ql303ImmutableProofUrl('unknown' as never)).toThrow('UNKNOWN_SOURCE');
  });
  it('distinguishes missing, present-but-unverified, forbidden, rate limited and network error',()=>{
    expect(ql303Classify(404)).toBe('MISSING_404');expect(ql303Classify(200)).toBe('PUBLIC_FILE_PRESENT_UNVERIFIED');
    for(const code of [401,403,429])expect(ql303Classify(code)).toBe('GITHUB_RATE_LIMITED_OR_FORBIDDEN');
    expect(ql303Classify(500)).toBe('PUBLIC_CHECK_ERROR');expect(ql303Classify(null)).toBe('NETWORK_ERROR');
  });
  it('ages evidence truthfully, never invents a recheck or sends a notification',()=>{
    expect(ql303AgeDays('2026-10-31T17:40:31Z',new Date('2026-11-02T17:40:31Z'))).toBe(2);
    expect(ql303AgeDays('2026-11-03T00:00:00Z',new Date('2026-11-02T00:00:00Z'))).toBeNull();
    const draft=ql303NotificationCandidate('rosiedazzlers',undefined,new Date('2026-11-03T17:40:31Z'));
    expect(draft.priority).toBe('STALE_SOURCE_EVIDENCE');expect(draft.sent).toBe(false);expect(draft.deliveryAttempts).toBe(0);expect(draft.connectionEnabled).toBe(false);
    expect(draft.body).toContain('MISSING_404');expect(draft.body).toContain('All 5 independent');
    expect(ql303NotificationCandidate('icamp',{source:'icamp',at:'2026-11-02T17:00:00Z',status:200,kind:'PUBLIC_FILE_PRESENT_UNVERIFIED'},new Date('2026-11-02T18:00:00Z')).priority).toBe('PROOF_REVIEW');
  });
});

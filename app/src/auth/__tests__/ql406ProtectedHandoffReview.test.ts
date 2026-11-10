import {describe,expect,it} from 'vitest';
import {QL406_CAPTURED_AT,QL406_MAX_SNAPSHOT_AGE_MS,QL406_PUBLIC_OBSERVATIONS,
  reviewQl406OneSource} from '../ql406ProtectedHandoffReview';

const captured=Date.parse(QL406_CAPTURED_AT);
const review=(id:'yw'|'icamp'|'rosiedazzlers'|'devilndove'|'ai-data-platform'|'rosevear-ai-hub',
  manual='')=>reviewQl406OneSource(id,manual,captured+1000);

describe('QL-406 one-source public revision and protected handoff review',()=>{
  it('rechecks six public revisions but never authenticates, connects or authorizes TEST',()=>{
    expect(QL406_PUBLIC_OBSERVATIONS).toHaveLength(6);
    for(const item of QL406_PUBLIC_OBSERVATIONS){
      const r=review(item.sourceId);
      expect(r).toMatchObject({state:'ONE_SOURCE_PROTECTED_REVIEW_HOLD',freshness:'RECENT_PUBLIC_SNAPSHOT',
        connection:'HOLD',ownerProof:'HOLD',signedReceipt:'NOT_VERIFIED',
        reviewerDisposition:'NOT_AUTHENTICATED',protectedDecision:'HOLD_ORIGINAL_REVIEW_REQUIRED',
        authorizedTest:false,receiverActivated:false,persisted:false,networkRequests:0,
        credentialsDisclosed:false,manualComparison:'NOT_SUPPLIED'});
      expect(r.source?.sourceId).toBe(item.sourceId);
      expect(r.source?.observedMainRevision).toBe(item.observedMainRevision);
      expect(r.source?.manifestPinNeedsReview).toBe(true);
      expect(r.protectedGates).toHaveLength(6);
      expect(r.protectedGates.every(gate=>gate.state==='HOLD')).toBe(true);
    }
    expect(QL406_PUBLIC_OBSERVATIONS.filter(item=>review(item.sourceId).source?.mainAdvanced))
      .toHaveLength(3);
    expect(JSON.stringify(review('yw'))).not.toMatch(/private_key|password|access_token/i);
  });
  it('keeps manual public SHA comparison separate from original protected evidence',()=>{
    const expected=QL406_PUBLIC_OBSERVATIONS[2].observedMainRevision;
    expect(review('rosiedazzlers',expected).manualComparison).toBe('MATCHES_CAPTURED_MAIN');
    expect(review('rosiedazzlers','a'.repeat(40)).manualComparison)
      .toBe('DIFFERS_FROM_CAPTURED_MAIN');
    expect(review('rosiedazzlers','not-a-sha').manualComparison).toBe('INVALID_PUBLIC_REVISION');
    expect(review('rosiedazzlers',' ').manualComparison).toBe('NOT_SUPPLIED');
    expect(review('rosiedazzlers',expected).connection).toBe('HOLD');
    expect(review('rosiedazzlers',expected).authorizedTest).toBe(false);
    expect(review('rosiedazzlers').source?.prompt)
      .toBe(`QL406-COMMS-REVIEW rosiedazzlers READ_ONLY main=${expected}`);
  });
  it('detects an expired public snapshot and future-clock mismatch',()=>{
    expect(reviewQl406OneSource('yw','',captured+QL406_MAX_SNAPSHOT_AGE_MS+1).freshness)
      .toBe('STALE_PUBLIC_SNAPSHOT');
    expect(reviewQl406OneSource('yw','',captured-1).freshness).toBe('STALE_PUBLIC_SNAPSHOT');
    expect(reviewQl406OneSource('yw','',Number.NaN).freshness).toBe('STALE_PUBLIC_SNAPSHOT');
  });
  it('fails closed on duplicate, malformed, or falsely connected public evidence',()=>{
    const base=QL406_PUBLIC_OBSERVATIONS[0];
    for(const invalid of [
      [base,base,...QL406_PUBLIC_OBSERVATIONS.slice(2)],
      QL406_PUBLIC_OBSERVATIONS.slice(1),
      [{...base,sourceId:'camp-rosevear'},...QL406_PUBLIC_OBSERVATIONS.slice(1)],
      [{...base,observedMainRevision:'bad'},...QL406_PUBLIC_OBSERVATIONS.slice(1)],
      [{...base,manifestRevision:'bad'},...QL406_PUBLIC_OBSERVATIONS.slice(1)],
      [{...base,manifestConnection:'CONNECTED'},...QL406_PUBLIC_OBSERVATIONS.slice(1)],
      [{...base,manifestSigner:'VERIFIED'},...QL406_PUBLIC_OBSERVATIONS.slice(1)],
      [{...base,transportOrigin:'https://example.com'},...QL406_PUBLIC_OBSERVATIONS.slice(1)]
    ]){
      const r=reviewQl406OneSource('yw','',captured+1000,
        invalid as typeof QL406_PUBLIC_OBSERVATIONS);
      expect(r).toMatchObject({state:'INVALID_PUBLIC_RECHECK_HOLD',source:null,
        connection:'HOLD',authorizedTest:false,receiverActivated:false,persisted:false,
        networkRequests:0});
    }
  });
});

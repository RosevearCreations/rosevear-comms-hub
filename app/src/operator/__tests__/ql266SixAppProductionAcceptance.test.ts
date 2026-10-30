import {describe,expect,it} from 'vitest';
import {QL266_SOURCE_SNAPSHOT,QL266_PUBLIC_RECHECK,ql266BuildAcceptanceReview}
  from '../ql266SixAppProductionAcceptance';

describe('QL-266 independent private witness and conditional TEST hold',()=>{
  it('retains six immutable observed main SHAs and exact 404 proof results',()=>{
    expect(QL266_SOURCE_SNAPSHOT).toHaveLength(6);
    expect(new Set(QL266_SOURCE_SNAPSHOT.map(x=>x.source)).size).toBe(6);
    expect(QL266_SOURCE_SNAPSHOT.every(x=>/^[a-f0-9]{40}$/.test(x.sha))).toBe(true);
    expect(QL266_PUBLIC_RECHECK.path).toBe('docs/integration/ql246-source-proof.json');
    expect(ql266BuildAcceptanceReview().originalProof404Count).toBe(6);
  });
  it('never upgrades local UI self-reports into an authenticated signer or test slot',()=>{
    const allReviewed=Object.fromEntries(QL266_SOURCE_SNAPSHOT.map(x=>[x.source,true]));
    const result=ql266BuildAcceptanceReview(allReviewed);
    expect(result.ownerUiReviewComplete).toBe(true);
    expect(result.sourceGatewaysEnabled).toBe(0);
    expect(result.authenticatedGatewayGets).toBe(0);
    expect(result.conditionalTestSlot).toBe('HELD_UNSCHEDULED');
    expect(result.originalSignedProofBStatus).toBe('NOT_AVAILABLE');
    expect(result.ownerTestAuthorization).toBe('NOT_GIVEN');
    expect(result.rows.every(x=>x.integration==='DISCONNECTED / HOLD')).toBe(true);
  });
  it('keeps no owner reports, arbitrary extra claims and the 12 live holds fail closed',()=>{
    const result=ql266BuildAcceptanceReview({
      rosiedazzlers:true,
      fakeApprovedApp:true,
      ownerTestAuthorization:true
    } as unknown as Parameters<typeof ql266BuildAcceptanceReview>[0]);
    expect(result.ownerReviewedCount).toBe(1);
    expect(result.livePilotHolds).toBe(12);
    expect(result.integration).toBe('DISCONNECTED / HOLD');
    expect(JSON.stringify(result)).not.toContain('fakeApprovedApp');
    expect(JSON.stringify(result)).not.toContain('ownerTestAuthorization":true');
  });
});

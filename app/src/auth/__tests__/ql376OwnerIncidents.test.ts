import {describe,expect,it} from 'vitest';
import type {OwnerProgress} from '../ql370OwnerProgress';
import {ownerEntryTruth} from '../ql374OwnerEntry';
import {ownerIncidents,ownerReadbackFreshness} from '../ql376OwnerIncidents';

const NOW=Date.parse('2026-11-08T18:00:00Z');
const progress=(ageSeconds:number):OwnerProgress=>({
  state:'ORIGINAL_OWNER_PROGRESS_READ_ONLY',organizationId:'rosevear-creations',
  ownerRole:'source',sessionAal2Verified:true,ownerMembershipActive:false,
  organizationEnrollmentState:'PENDING_VERIFIED_AUTH_USERS',activeOwnerMemberships:0,
  ownAttestation:{state:'NOT_RECORDED',expiresAt:null},
  peerAttestation:{state:'NOT_RECORDED',expiresAt:null},
  offlineApprovalState:'NOT_OBSERVABLE_UNTIL_FINAL_SIGNED_SUBMISSION',
  audit:{activationRecorded:false,activationAt:null,verifiedActivationEvents:0,lastVerifiedEventAt:null},
  totalApplicationShells:6,heldApplicationShells:6,connectionsState:'DISCONNECTED / HOLD',
  privateTestAuthorized:false,snapshotAt:new Date(NOW-ageSeconds*1000).toISOString()
});
const freshness=(ageSeconds:number)=>ownerReadbackFreshness({
  progress:progress(ageSeconds),role:'source',aal2:true,nowMs:NOW
});
const incidents=(ageSeconds:number,p=progress(ageSeconds))=>ownerIncidents(
  ownerEntryTruth({role:'source',aal2:true,enrolled:false,progress:p,nowMs:NOW}),
  ownerReadbackFreshness({progress:p,role:'source',aal2:true,nowMs:NOW})
);

describe('QL-376 protected freshness and incident derivation',()=>{
  it('separates current, approaching expiry and expired without trusting historical HOLD',()=>{
    expect(freshness(30).kind).toBe('current');
    expect(freshness(90).kind).toBe('expiring');
    expect(freshness(120).kind).toBe('expiring');
    expect(freshness(121).kind).toBe('stale');
    expect(incidents(121).find(x=>x.id==='freshness-expired')?.severity).toBe('action');
    expect(incidents(121).find(x=>x.id==='connections-held')?.title).toContain('not independently verified');
  });
  it('surfaces clock discrepancies and malformed timestamps without treating them as current',()=>{
    expect(freshness(-20).kind).toBe('future');
    expect(incidents(-20).find(x=>x.id==='freshness-expired')?.detail).toContain('ahead');
    expect(incidents(-20).find(x=>x.id==='connections-held')?.title).toContain('not independently verified');
    const bad={...progress(2),snapshotAt:'not-a-date'};
    expect(ownerReadbackFreshness({progress:bad,role:'source',aal2:true,nowMs:NOW}).kind).toBe('unknown');
  });
  it('does not disclose a mismatched owner readback or infer individual connections',()=>{
    const other={...progress(15),ownerRole:'master' as const};
    const view=ownerReadbackFreshness({progress:other,role:'source',aal2:true,nowMs:NOW});
    expect(view.observedAt).toBe(null);
    expect(view.kind).toBe('unknown');
    expect(ownerReadbackFreshness({progress:progress(20),role:'source',aal2:false,nowMs:NOW}).kind).toBe('unknown');
    expect(incidents(20).find(x=>x.id==='connections-held')?.detail).toContain('not six independent');
  });
  it('prioritizes STOP for inconsistent protected counts',()=>{
    const inconsistent={...progress(20),heldApplicationShells:5};
    expect(incidents(20,inconsistent)[0]).toMatchObject({id:'security-stop',severity:'action'});
  });
});

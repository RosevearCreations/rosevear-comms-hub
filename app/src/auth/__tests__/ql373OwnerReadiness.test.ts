import {describe,expect,it} from 'vitest';
import {EMPTY_ACCEPTANCE,OWNER_HELP_LINKS,ownerReadinessIssue,safeAcceptanceNote}
  from '../ql373OwnerReadiness';
import type {OwnerProgress} from '../ql370OwnerProgress';

const NOW=Date.parse('2026-11-08T17:00:00Z');
const at=(offset:number)=>new Date(NOW+offset*60000).toISOString();
const progress=():OwnerProgress=>({
  state:'ORIGINAL_OWNER_PROGRESS_READ_ONLY',organizationId:'rosevear-creations',
  ownerRole:'source',sessionAal2Verified:true,ownerMembershipActive:false,
  organizationEnrollmentState:'PENDING_VERIFIED_AUTH_USERS',activeOwnerMemberships:0,
  ownAttestation:{state:'NOT_RECORDED',expiresAt:null},
  peerAttestation:{state:'NOT_RECORDED',expiresAt:null},
  offlineApprovalState:'NOT_OBSERVABLE_UNTIL_FINAL_SIGNED_SUBMISSION',
  audit:{activationRecorded:false,activationAt:null,verifiedActivationEvents:0,lastVerifiedEventAt:null},
  totalApplicationShells:6,heldApplicationShells:6,
  connectionsState:'DISCONNECTED / HOLD',privateTestAuthorized:false,snapshotAt:at(0)
});
const diagnose=(p:OwnerProgress|null,mfaVerified=true,intentSupplied=true,nowMs=NOW)=>
  ownerReadinessIssue({progress:p,mfaVerified,intentSupplied,ownerRole:'source',nowMs});

describe('QL-373 fail-closed advisory readiness',()=>{
  it('stops before offering a next step on HOLD, role or receipt drift',()=>{
    expect(diagnose({...progress(),heldApplicationShells:5}).code).toBe('STOP_REVIEW');
    expect(diagnose({...progress(),ownerRole:'master'}).priority).toBe('stop');
    expect(diagnose({...progress(),audit:{...progress().audit,activationRecorded:true}}).priority).toBe('stop');
    expect(diagnose({...progress(),activeOwnerMemberships:1}).priority).toBe('stop');
  });
  it('requires personal MFA, an actual protected readback, a current clock and an original intent',()=>{
    expect(diagnose(null,false).code).toBe('PERSONAL_MFA');
    expect(diagnose(null).code).toBe('READBACK_UNAVAILABLE');
    expect(diagnose(progress(),true,true,NOW+121000).code).toBe('REFRESH_STATUS');
    expect(diagnose(progress(),true,false).code).toBe('MATCH_INTENT');
  });
  it('distinguishes own and peer attestation and never acts for the other owner',()=>{
    const own={...progress(),ownAttestation:{state:'EXPIRED' as const,expiresAt:at(-1)}};
    expect(diagnose(own).code).toBe('RENEW_OWN_MFA');
    expect(diagnose(progress()).code).toBe('ATTEST_SELF');
    const ownCurrent={...progress(),ownAttestation:{state:'CURRENT' as const,expiresAt:at(20)}};
    expect(diagnose(ownCurrent).code).toBe('WAIT_PEER');
    expect(diagnose({...ownCurrent,peerAttestation:{state:'REVOKED_OR_STALE',expiresAt:at(10)}}).code)
      .toBe('RENEW_PEER_MFA');
    expect(diagnose({...ownCurrent,peerAttestation:{state:'CURRENT',expiresAt:at(4)}}).code)
      .toBe('TIME_WINDOW');
    expect(diagnose({...ownCurrent,peerAttestation:{state:'CURRENT',expiresAt:at(20)}}).code)
      .toBe('OFFLINE_REVIEW');
  });
  it('can report genuine original activation without granting six-app access',()=>{
    const verified:OwnerProgress={...progress(),ownerMembershipActive:true,activeOwnerMemberships:2,
      organizationEnrollmentState:'VERIFIED',
      offlineApprovalState:'VERIFIED_AT_ORIGINAL_ACTIVATION',
      audit:{activationRecorded:true,activationAt:at(-1),verifiedActivationEvents:1,lastVerifiedEventAt:at(-1)}};
    const result=diagnose(verified);
    expect(result.code).toBe('OWNER_VERIFIED_HELD');
    expect(result.nextAction).toContain('DISCONNECTED / HOLD');
  });
  it('uses only three fixed, https help destinations with no query values',()=>{
    for(const link of OWNER_HELP_LINKS){
      const url=new URL(link.href);
      expect(url.protocol).toBe('https:');
      expect(url.search).toBe('');
      expect(url.hash).toBe('');
    }
  });
});

describe('QL-373 independent, non-authorizing two-device note',()=>{
  it('records fixed, per-owner self-reported outcomes without live evidence',()=>{
    const ree=safeAcceptanceNote('source',{...EMPTY_ACCEPTANCE,keyboard:'worked',readback:'blocked'},'network');
    const jack=safeAcceptanceNote('master',{...EMPTY_ACCEPTANCE,screenreader:'blocked'},'accessibility');
    expect(ree).toContain('Ree (source)');
    expect(jack).toContain('Jack (master)');
    expect(ree).not.toContain('Jack (master)');
    expect(ree).toContain('NOT identity verification');
    expect(ree).toContain('DISCONNECTED / HOLD');
    expect(jack).toContain('Blocked on this device');
    for(const note of [ree,jack])expect(note).not.toContain(at(0));
  });
  it('does not print an unrecognized value as an exported free-text field',()=>{
    const hostile={...EMPTY_ACCEPTANCE,keyboard:'my-password-123' as 'worked'};
    expect(safeAcceptanceNote('source',hostile,'none')).not.toContain('my-password-123');
    expect(safeAcceptanceNote('source',EMPTY_ACCEPTANCE,'unknown' as 'none')).not.toContain('unknown');
  });
});

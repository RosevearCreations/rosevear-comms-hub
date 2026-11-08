import {describe,expect,it} from 'vitest';
import {ownerEntryTruth,QL374_HISTORICAL_PREREQUISITES,QL374_REQUIRED_GATES}
  from '../ql374OwnerEntry';
import type {OwnerProgress} from '../ql370OwnerProgress';

const NOW=Date.parse('2026-11-08T18:00:00Z');
const pending=(role:'source'|'master'='source'):OwnerProgress=>({
  state:'ORIGINAL_OWNER_PROGRESS_READ_ONLY',organizationId:'rosevear-creations',
  ownerRole:role,sessionAal2Verified:true,ownerMembershipActive:false,
  organizationEnrollmentState:'PENDING_VERIFIED_AUTH_USERS',activeOwnerMemberships:0,
  ownAttestation:{state:'NOT_RECORDED',expiresAt:null},
  peerAttestation:{state:'NOT_RECORDED',expiresAt:null},
  offlineApprovalState:'NOT_OBSERVABLE_UNTIL_FINAL_SIGNED_SUBMISSION',
  audit:{activationRecorded:false,activationAt:null,verifiedActivationEvents:0,lastVerifiedEventAt:null},
  totalApplicationShells:6,heldApplicationShells:6,connectionsState:'DISCONNECTED / HOLD',
  privateTestAuthorized:false,snapshotAt:new Date(NOW).toISOString()
});
const verified=():OwnerProgress=>({...pending(),ownerMembershipActive:true,
  organizationEnrollmentState:'VERIFIED',activeOwnerMemberships:2,
  offlineApprovalState:'VERIFIED_AT_ORIGINAL_ACTIVATION',
  audit:{activationRecorded:true,activationAt:new Date(NOW).toISOString(),
    verifiedActivationEvents:1,lastVerifiedEventAt:new Date(NOW).toISOString()}});
const check=(progress:OwnerProgress|null=pending(),enrolled=false,role:'source'|'master'='source',aal2=true,nowMs=NOW)=>
  ownerEntryTruth({progress,enrolled,role,aal2,nowMs});

describe('QL-374 authenticated operator shell remains non-authorizing',()=>{
  it('describes distinct pending and activated memberships, with identical connection restrictions',()=>{
    expect(check().state).toBe('PENDING_ENROLLMENT_HOLD');
    expect(check().activeMemberships).toBe(0);
    expect(check(verified(),true).state).toBe('MEMBERSHIP_VERIFIED_HOLD');
    for(const result of [check(),check(verified(),true)]){
      expect(result.held).toBe(true);
      expect(result.mayActivateSource).toBe(false);
      expect(result.mayEnterCustomerOperations).toBe(false);
    }
  });
  it('locks AAL1, missing, expired or cross-owner protected snapshots',()=>{
    expect(check(pending(),false,'source',false).state).toBe('MFA_REQUIRED');
    expect(check(null).state).toBe('READBACK_REQUIRED');
    expect(check(pending(),false,'master').state).toBe('READBACK_REQUIRED');
    expect(check(pending(),false,'source',true,NOW+121000).state).toBe('READBACK_REQUIRED');
    expect(check({...pending(),sessionAal2Verified:false as true}).state).toBe('READBACK_REQUIRED');
  });
  it('stops on readback, server membership and audit drift',()=>{
    for(const snapshot of [
      {...pending(),heldApplicationShells:5},
      {...pending(),totalApplicationShells:7},
      {...pending(),connectionsState:'HOLD_STATE_DRIFT_REQUIRES_REVIEW' as const},
      {...pending(),privateTestAuthorized:true as false},
      {...pending(),activeOwnerMemberships:1},
      {...pending(),audit:{...pending().audit,activationRecorded:true}}
    ])expect(check(snapshot).state).toBe('STOP_REVIEW');
    expect(check(pending(),true).state).toBe('STOP_REVIEW');
    expect(check(verified(),false).state).toBe('STOP_REVIEW');
  });
  it('moves old launch preflight assumptions to history without removing real approval gates',()=>{
    expect(QL374_HISTORICAL_PREREQUISITES.map(x=>x.id)).toEqual(['ql329','ql331','ql307']);
    expect(QL374_REQUIRED_GATES).toHaveLength(3);
    expect(QL374_REQUIRED_GATES.join(' ')).toContain('DISCONNECTED / HOLD');
    expect(QL374_REQUIRED_GATES.join(' ')).toContain('AAL2');
  });
});

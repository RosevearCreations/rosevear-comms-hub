import {describe,expect,it} from 'vitest';
import {ql266BuildAcceptanceReview,QL266_SOURCE_SNAPSHOT}
  from '../ql266SixAppProductionAcceptance';
import {QL267_SOURCE_MAIN_RECHECK,QL267_PROOF_RECHECK,
  ql267ReconcileReturns,parseQl267WalkthroughReceipt,
  parseQl267PrivateWitnessStatus} from '../ql267SixAppReceiptReconciliation';

describe('QL-267 owner walkthrough and private-witness receipt reconciliation',()=>{
  it('records six exact current main SHAs and HTTP 404 original proof status',()=>{
    const report=ql267ReconcileReturns();
    expect(QL267_SOURCE_MAIN_RECHECK).toHaveLength(6);
    expect(QL267_SOURCE_MAIN_RECHECK.every(x=>/^[0-9a-f]{40}$/.test(x.sha))).toBe(true);
    expect(QL267_PROOF_RECHECK.path).toBe('docs/integration/ql246-source-proof.json');
    expect(report.originalSignedProof404Count).toBe(6);
    expect(report.rows.filter(x=>x.freshness==='NEWER_OR_DIFFERENT_MAIN_SHA_RECHECKED').length).toBe(3);
  });
  it('accepts only a genuine structured QL-266 sanitized owner report as self-report',()=>{
    const owner=Object.fromEntries(QL266_SOURCE_SNAPSHOT.map(x=>[x.source,true]));
    const packet=JSON.stringify(ql266BuildAcceptanceReview(owner));
    const parsed=parseQl267WalkthroughReceipt(packet);
    expect(parsed.status).toBe('ACCEPTED_OWNER_REPORT_ONLY');
    const report=ql267ReconcileReturns(packet);
    expect(report.ownerWalkthroughCount).toBe(6);
    expect(report.conditionalDryRun).toBe('HELD_UNSCHEDULED');
    expect(report.ownerTestAuthorization).toBe('NOT_GIVEN');
    expect(report.livePilotHolds).toBe(12);
  });
  it('rejects forged approvals, extra secrets and changed SHA as untrusted',()=>{
    const forged=ql266BuildAcceptanceReview({rosiedazzlers:true}) as unknown as Record<string,unknown>;
    expect(parseQl267WalkthroughReceipt(JSON.stringify({...forged,ownerTestAuthorization:'GIVEN'})).status)
      .toBe('REJECTED_UNTRUSTED_OR_MALFORMED');
    expect(parseQl267WalkthroughReceipt(JSON.stringify({...forged,secret:'private'})).status)
      .toBe('REJECTED_UNTRUSTED_OR_MALFORMED');
    const changed=JSON.parse(JSON.stringify(forged));
    changed.rows[0].inspectedMainCommit='0'.repeat(40);
    expect(parseQl267WalkthroughReceipt(JSON.stringify(changed)).status)
      .toBe('REJECTED_UNTRUSTED_OR_MALFORMED');
  });
  it('accepts only enum-only crypto status without elevating owner or human roles',()=>{
    const status={schema:'rosevear-comms-ql266-witness-crypto/v1',
      cryptographicPossession:'SIGNATURE_VALID_ONLY',publicPin:'PIN_MATCHED',
      challengeFreshness:'WITHIN_FIVE_MINUTES',independentlyAuthenticatedHumanRoles:'NOT_VERIFIED',
      originalSignedSourceProofB:'NOT_AVAILABLE',authenticatedGatewayGets:0,
      ownerTestAuthorization:'NOT_GIVEN',conditionalTestSlot:'HELD_UNSCHEDULED',
      integration:'DISCONNECTED / HOLD',reason:'HUMAN_CUSTODY_AND_ORIGINAL_PROOF_STILL_REQUIRE_PRIVATE_REVIEW'};
    expect(parseQl267PrivateWitnessStatus(JSON.stringify(status)))
      .toBe('SANITIZED_CRYPTO_RESULT_RECEIVED_NOT_INDEPENDENTLY_AUTHENTICATED');
    const report=ql267ReconcileReturns('',JSON.stringify(status));
    expect(report.actualPrivatelyAuthenticatedRoleDecision).toBe('NOT_RECEIVED');
    expect(report.scheduledWindowCount).toBe(0);
    expect(report.authenticatedGatewayGets).toBe(0);
  });
  it('rejects nonsecret format deviations and never echoes any supplied payload',()=>{
    const raw='{"schema":"rosevear-comms-ql266-witness-crypto/v1","secret":"unsafe"}';
    expect(parseQl267PrivateWitnessStatus(raw)).toBe('REJECTED_UNTRUSTED_OR_MALFORMED');
    expect(parseQl267WalkthroughReceipt('bogus')).toBeTruthy();
    const report=ql267ReconcileReturns('bogus',raw);
    expect(report.ownerPacketIntake).toBe('REJECTED_UNTRUSTED_OR_MALFORMED');
    expect(JSON.stringify(report)).not.toContain('unsafe');
    expect(report.integration).toBe('DISCONNECTED / HOLD');
  });
});

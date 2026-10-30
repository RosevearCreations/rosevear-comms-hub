import {describe,expect,it} from 'vitest';
import {ql267ReconcileReturns} from '../ql267SixAppReceiptReconciliation';
import {QL268_SOURCE_PROOF_RECHECK,QL268_PROOF_PATH,
  ql268ReleaseLedger,parseQl268PreviousLedger} from '../ql268ProofBIsolationReleaseLedger';

describe('QL-268 proof B exception and nonproduction GET trial gate',()=>{
  it('records six original signed-proof HTTP 404 exceptions at exact source SHAs',()=>{
    const report=ql268ReleaseLedger();
    expect(QL268_SOURCE_PROOF_RECHECK).toHaveLength(6);
    expect(new Set(QL268_SOURCE_PROOF_RECHECK.map(x=>x.source)).size).toBe(6);
    expect(QL268_SOURCE_PROOF_RECHECK.every(x=>/^[a-f0-9]{40}$/.test(x.sha))).toBe(true);
    expect(QL268_PROOF_PATH).toBe('docs/integration/ql246-source-proof.json');
    expect(report.exactMainProof404Count).toBe(6);
    expect(report.rows.filter(x=>x.observationFreshness==='RECHECKED_NEW_MAIN_SHA').length).toBe(5);
  });
  it('all owner preparation self-reports still leave release HELD',()=>{
    const all=Object.fromEntries(QL268_SOURCE_PROOF_RECHECK.map(x=>[x.source,{
      isolatedNonproductionProject:true,scopedReadOnlyGetIdentity:true,
      denyCasePlanReviewed:true,stopRollbackPrepared:true,
      productionAndPrivateDataExcluded:true
    }]));
    const report=ql268ReleaseLedger(all);
    expect(report.ownerPreparationCompleteSelfReports).toBe(6);
    expect(report.boundedGetTrial).toBe('HELD_UNSCHEDULED');
    expect(report.realOwnerTestAuthorization).toBe('NOT_GIVEN');
    expect(report.authenticatedGatewayGetCount).toBe(0);
    expect(report.livePilotHolds).toBe(12);
    expect(report.rows.every(x=>!x.sourceConnectionEnabled)).toBe(true);
  });
  it('reconciles only the strict QL-267 nonsecret previous ledger',()=>{
    const previous=JSON.stringify(ql267ReconcileReturns());
    expect(parseQl268PreviousLedger(previous)).toEqual({
      status:'ACCEPTED_NONSECRET_STATUS_ONLY',ownerReviewCount:0});
    const report=ql268ReleaseLedger({},previous);
    expect(report.previousQl267LedgerIntake).toBe('ACCEPTED_NONSECRET_STATUS_ONLY');
  });
  it('rejects forged TEST, source and private identity claims in previous ledger',()=>{
    const prev=ql267ReconcileReturns() as unknown as Record<string,unknown>;
    expect(parseQl268PreviousLedger(JSON.stringify({...prev,ownerTestAuthorization:'GIVEN'})).status)
      .toBe('REJECTED_UNTRUSTED_OR_MALFORMED');
    expect(parseQl268PreviousLedger(JSON.stringify({...prev,privateKey:'secret'})).status)
      .toBe('REJECTED_UNTRUSTED_OR_MALFORMED');
    const altered=JSON.parse(JSON.stringify(prev));
    altered.rows[0].observedMainSha='0'.repeat(40);
    expect(parseQl268PreviousLedger(JSON.stringify(altered)).status)
      .toBe('REJECTED_UNTRUSTED_OR_MALFORMED');
  });
  it('never echoes arbitrary source flags or unsafe inputs into release ledger',()=>{
    const report=ql268ReleaseLedger({rosiedazzlers:{isolatedNonproductionProject:true,
      ownerTestAuthorization:true,secret:'bad'} } as never,'not json');
    expect(report.previousQl267LedgerIntake).toBe('REJECTED_UNTRUSTED_OR_MALFORMED');
    expect(report.integration).toBe('DISCONNECTED / HOLD');
    expect(JSON.stringify(report)).not.toContain('secret');
    expect(JSON.stringify(report)).not.toContain('ownerTestAuthorization":true');
  });
});

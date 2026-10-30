import {describe,it,expect} from 'vitest';
import {QL269_SOURCE_PROOF_RECHECK,QL269_PACKET_SCHEMA,QL269_PROOF_PATH,
  ql269GetTrialDecision,ql269BlankSanitizedPacket,parseQl269SanitizedPacket}
  from '../ql269AuthenticatedProofReview';

const packet=()=>ql269BlankSanitizedPacket();

describe('QL-269 authentic-proof and independent TEST release gate',()=>{
  it('pins six latest observed public HTTP 404 exceptions without pretending proof acceptance',()=>{
    const report=ql269GetTrialDecision();
    expect(QL269_SOURCE_PROOF_RECHECK).toHaveLength(6);
    expect(new Set(QL269_SOURCE_PROOF_RECHECK.map(x=>x.repo)).size).toBe(6);
    expect(QL269_SOURCE_PROOF_RECHECK.every(x=>/^[a-f0-9]{40}$/.test(x.sha))).toBe(true);
    expect(QL269_PROOF_PATH).toBe('docs/integration/ql246-source-proof.json');
    expect(report.originalProofB404Count).toBe(6);
    expect(report.rows.filter(r=>r.sourceUpdatedSinceQl268)).toHaveLength(4);
    expect(report.integration).toBe('DISCONNECTED / HOLD');
  });

  it('checks exact schema/order/source SHA and rejects claimed security authorization',()=>{
    const original=packet();
    expect(original.schema).toBe(QL269_PACKET_SCHEMA);
    expect(parseQl269SanitizedPacket(JSON.stringify(original)).status)
      .toBe('ACCEPTED_UNAUTHENTICATED_CLAIMS_ONLY');
    expect(parseQl269SanitizedPacket('').status).toBe('NOT_RECEIVED');
    for(const altered of [
      {...original,ownerTestAuthorization:'GIVEN'},
      {...original,rows:[...original.rows].reverse()},
      {...original,rows:original.rows.map((r,i)=>i===0?{...r,observedMainSha:'a'.repeat(40)}:r)},
      {...original,rows:original.rows.map((r,i)=>i===0?{...r,privateKey:'unsafe'}:r)},
      {...original,rows:original.rows.map((r,i)=>i===0?{...r,nonproductionOnly:'true'}:r)}
    ])expect(parseQl269SanitizedPacket(JSON.stringify(altered)).status)
      .toBe('REJECTED_MALFORMED_OR_UNSAFE');
  });

  it('reports completeness only as untrusted self-report, even with six matching digest claims',()=>{
    const data=packet();
    data.rows.forEach((row,i)=>{
      row.publicProofSha256=String(i).repeat(64);
      row.isolatedTenantFingerprintSha256=String(i).repeat(64);
      for(const k of ['nonproductionOnly','productionDataExcluded','privateOrHomeDataExcluded',
        'separateReadOnlyGetIdentity','sevenDenialsPlanned','stopRollbackReviewed'] as const)
        row[k]=true;
    });
    const report=ql269GetTrialDecision(JSON.stringify(data));
    expect(report.reportedTenantScopeCompleteCount).toBe(6);
    expect(report.sanitizedPacketIntake).toBe('ACCEPTED_UNAUTHENTICATED_CLAIMS_ONLY');
    expect(report.tenantFingerprintCollisionCount).toBe(0);
    expect(report.rows.every(x=>x.reportedPublicProofDigestPresent)).toBe(true);
    expect(report.rows.every(x=>x.sourceProofOriginAuthenticated===false)).toBe(true);
    expect(report.rows.every(x=>x.independentTenantIsolationAuthenticated===false)).toBe(true);
    expect(report.rows.every(x=>x.separateOwnerTestAuthorizationAuthenticated===false)).toBe(true);
    expect(report.scheduledGetWindows).toBe(0);
    expect(report.authenticatedGatewayGets).toBe(0);
    expect(report.livePilotHolds).toBe(12);
    expect(report.releaseDecision).toMatch(/^DENY_/);
  });

  it('detects reused pseudonymous tenant fingerprints without trusting them as isolation',()=>{
    const data=packet();
    data.rows[0].isolatedTenantFingerprintSha256='b'.repeat(64);
    data.rows[1].isolatedTenantFingerprintSha256='b'.repeat(64);
    expect(ql269GetTrialDecision(JSON.stringify(data)).tenantFingerprintCollisionCount).toBe(1);
  });

  it('fails closed on malicious or malformed input and never echoes raw input',()=>{
    const secret='my-raw-private-challenge';
    const report=ql269GetTrialDecision(JSON.stringify({schema:QL269_PACKET_SCHEMA,
      rows:[{source:'rosiedazzlers',nonce:secret}]}));
    expect(report.sanitizedPacketIntake).toBe('REJECTED_MALFORMED_OR_UNSAFE');
    expect(report.integration).toBe('DISCONNECTED / HOLD');
    expect(JSON.stringify(report)).not.toContain(secret);
    expect(parseQl269SanitizedPacket('x'.repeat(12_001)).status)
      .toBe('REJECTED_MALFORMED_OR_UNSAFE');
    expect(report.rows.every(x=>x.authorizedGatewayGets===0&&!x.sourceConnectionEnabled)).toBe(true);
  });
});

// @vitest-environment jsdom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { readFileSync } from 'node:fs';
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { OperatorShell } from '../OperatorShell';
import { QL181_PREREQUISITES } from '../ql181PrivacyPilotGate';
import { ql239SyntheticProof, intakeQl239Proof, markQl239RotationChecklist,
  independentlyReviewQl239, type Ql239Ledger } from '../ql239GatewayProofReview';
import { QL240_CHECKS, recordQl240Claim, independentlyReviewQl240 } from '../ql240PilotDecision';
import { QL241_RELEASE, QL241_CHECKS, recordQl241Report,
  ql241PrepareOwnerReview } from '../ql241ExternalProofReadiness';
import { QL242_RELEASE, recordQl242Report } from '../ql242OwnerSignedRollout';
import { QL243_RELEASE, inspectQl243Report } from '../ql243ConnectionTesting';
import { QL244_RELEASE, QL244_SOURCES, inspectQl244Report } from '../ql244WitnessedHandshake';
import { QL245_RELEASE, QL245_SOURCE_CLAIMS, QL245_BLOCKERS, inspectQl245Summary,
  ql245CurrentStatus, ql245Portfolio } from '../ql245SixAppEvidence';

function rig() {
  const now = new Date('2026-10-27T14:00:00.000Z'); const company = 'devilndove';
  const proof = { ...ql239SyntheticProof(company, now), kind: 'EXTERNAL_CLAIM_UNVERIFIED' as const,
    sourceUrl: 'https://github.com/RosevearCreations/rosevear-comms-hub/pull/439',
    sourceRevision: 'a'.repeat(40), submitterAlias: 'source_team_1' };
  let source = intakeQl239Proof({}, proof, company, now);
  source = markQl239RotationChecklist(source, company);
  source = independentlyReviewQl239(source, company, 'source_reviewer_2');
  const claim = { company, sourceEvidenceId: proof.evidenceId,
    healthReceiptId: proof.healthReceiptId, capabilitiesReceiptId: proof.capabilitiesReceiptId,
    gatewayAuditId: 'np-gateway-audit-001', currentKeyId: 'np-current-001',
    revokedKeyId: 'np-previous-001', inspectorAlias: 'inspector_team_3',
    observedAt: now.toISOString(),
    checks: Object.fromEntries(QL240_CHECKS.map(key => [key, true])) as Record<typeof QL240_CHECKS[number], boolean> };
  let audit = recordQl240Claim({}, source, company, claim, now);
  audit = independentlyReviewQl240(audit, source, company, 'reviewer_team_4');
  const getReport = { release: QL241_RELEASE, status: 'SIGNED_GET_PAIR_CHECKED_HELD',
    reason: 'Isolated signed GET receipts.', signedGetReceiptsVerified: true,
    independentlyVerifiedPinProvenance: false, gatewayAuditIndependentlyVerified: false,
    realOwnerAuthorization: false, actualConnection: 'DISCONNECTED', externalGetAttempts: 2,
    externalWrites: 0, calls: 0, sms: 0, providerDispatch: 0, realPilotHolds: 12,
    company, tenantId: null, keyId: claim.currentKeyId, publicKeyFingerprintSha256: 'b'.repeat(64),
    healthReceiptId: proof.healthReceiptId, capabilitiesReceiptId: proof.capabilitiesReceiptId };
  let external = recordQl241Report({}, getReport, company, audit, source);
  external = ql241PrepareOwnerReview(external, company, audit, source, 'owner_review_team_5',
    Object.fromEntries(QL241_CHECKS.map(key => [key, true])) as Record<typeof QL241_CHECKS[number], boolean>);
  const ownerReport = { release: QL242_RELEASE, status: 'DUAL_SIGNATURES_CHECKED_HELD',
    reason: 'Synthetic dual signature comparison only.', signedAuditCompared: true,
    signedOwnerDecisionCompared: true, independentlyWitnessedProvenance: false,
    ownerIdentityVerified: false, actualOwnerAuthorization: false, realGatewayConnection: 'DISCONNECTED',
    rehearsalState: 'AUDIT_REVIEW_ONLY_HELD', externalRequests: 0, externalWrites: 0,
    liveCalls: 0, liveSms: 0, providerDispatch: 0, realPilotHolds: 12,
    company, gatewayAuditId: claim.gatewayAuditId, sourceRevision: proof.sourceRevision,
    healthReceiptId: proof.healthReceiptId, capabilitiesReceiptId: proof.capabilitiesReceiptId,
    gatewayPublicKeyFingerprintSha256: 'b'.repeat(64),
    ownerPublicKeyFingerprintSha256: 'c'.repeat(64),
    rollbackReceiptId: 'np-rollback-receipt-001', ownerDecision: 'REQUEST_READ_ONLY_REHEARSAL',
    transitions: [] };
  const ownerRollout = recordQl242Report({}, ownerReport, company, source, audit, external);
  const ql243Report = { release: QL243_RELEASE, status: 'AUTHENTICATED_FOUR_GETS_CHECKED_HELD',
    reason: 'Separate attestation pending', company, ownerIdentityClaimSignatureChecked: true,
    ownerIdentityIndependentlyConfirmed: false, gatewayAuditGetChecked: true,
    gatewayAuditDurabilityIndependentlyConfirmed: false, actualOwnerAuthorization: false,
    connectionState: 'DISCONNECTED', livePilotRelease: false, getAttempts: 4,
    writeAttempts: 0, calls: 0, sms: 0, providerDispatch: 0, realPilotHolds: 12,
    identityAttestationId: 'np-identity-attestation-001', gatewayAuditId: claim.gatewayAuditId,
    healthReceiptId: proof.healthReceiptId, capabilitiesReceiptId: proof.capabilitiesReceiptId,
    sourceRevision: proof.sourceRevision, gatewayPublicKeyFingerprintSha256: 'b'.repeat(64),
    ownerPublicKeyFingerprintSha256: 'c'.repeat(64), witnessPublicKeyFingerprintSha256: 'd'.repeat(64) };
  const connectionTests = { devilndove: inspectQl243Report(ql243Report, company,
    source, audit, external, ownerRollout) };
  const report = { release: QL244_RELEASE, status: 'TWO_ADDITIONAL_SIGNATURES_CHECKED_HELD',
    reason: 'Synthetic local QL-244 test only.', company, assessorSignatureChecked: true,
    conditionalOwnerRequestSignatureChecked: true, witnessedSourceIndependentlyConfirmed: false,
    credentialExchangeIndependentlyConfirmed: false, ownerIdentityIndependentlyConfirmed: false,
    actualOwnerAuthorization: false, conditionalPilotDecision: 'CONDITIONAL_REVIEW_REQUEST_ONLY_HELD',
    actualConnection: 'DISCONNECTED', actualWrites: 0, calls: 0, sms: 0, providerDispatch: 0,
    realPilotHolds: 12, gatewayAuditId: claim.gatewayAuditId,
    identityAttestationId: ql243Report.identityAttestationId,
    assessorReceiptId: 'np-assessor-receipt-001', sourceRevision: proof.sourceRevision,
    gatewayPublicKeyFingerprintSha256: 'b'.repeat(64),
    ownerPublicKeyFingerprintSha256: 'c'.repeat(64),
    witnessPublicKeyFingerprintSha256: 'd'.repeat(64),
    assessorPublicKeyFingerprintSha256: 'e'.repeat(64),
    credentialMetadata: QL244_SOURCES.map((system, i) => ({
      system, keyId: 'np-ql244-key-' + (i + 1),
      receiptId: 'np-exchange-receipt-' + (i + 1),
      review: 'OWNER_APPROVAL_NOT_GIVEN_HELD'
    }))
  };
  return { source, audit, external, ownerRollout, connectionTests, report, proof };
}

function evidenceRig() {
  const x=rig();
  const witnessed={devilndove:inspectQl244Report(x.report,'devilndove',x.source,x.audit,
    x.external,x.ownerRollout,x.connectionTests)};
  const accepted=witnessed.devilndove.reference!;
  const report={
    release:QL245_RELEASE,status:'SEVEN_PUBLIC_SIGNATURES_MATCHED_REAL_PROOF_PENDING_HELD',
    company:'devilndove',assessorSignatureChecked:true,sourceSignatureChecks:6,
    realWorldWitnessConfirmed:false,
    outOfBandKeyOwnershipIndependentlyConfirmed:false,
    externalReadIndependentlyConfirmed:false,
    credentialExchangeIndependentlyConfirmed:false,
    auditStorageIndependentlyConfirmed:false,
    ownerApprovalIndependentlyConfirmed:false,
    ownerPilotAuthorized:false,connectionState:'DISCONNECTED',livePilotRelease:false,
    writes:0,calls:0,sms:0,dispatch:0,realPilotHolds:12,
    ql244AssessorReceiptId:accepted.assessorReceiptId,
    ql244SourceRevision:accepted.sourceRevision,
    reviewReceiptId:'np-six-app-review-001',
    assessorPublicKeyFingerprintSha256:'f'.repeat(64),
    sourceMetadata:QL244_SOURCES.map((system,i)=>({
      system,businessId:system==='ai-data-platform'?'devilndove':system,
      tenantId:system==='yw'?'np-yard-rosevear-tenant-001':
        system==='icamp'?'np-camp-rosevear-tenant-001':null,
      sourceRevision:system==='devilndove'?accepted.sourceRevision:String(i+1).repeat(40),
      ciRunUrl:'https://github.com/RosevearCreations/rosevear-comms-hub/actions/runs/'+(9991+i),
      signerPinSha256:String(i+1).repeat(64),
      sourceReceiptId:'np-ql245-source-receipt-'+(i+1),
      registryReceiptId:'np-ql245-registry-receipt-'+(i+1),
      gatewayAuditId:system==='devilndove'?accepted.gatewayAuditId:'np-ql245-audit-'+(i+1),
      healthReceiptId:'np-ql245-health-'+(i+1),
      capabilitiesReceiptId:'np-ql245-caps-'+(i+1)
    }))
  };
  return {...x,witnessed,report};
}
describe('QL-245 source summary and owner decision safeguards',()=>{
  it('lists exactly six owner-supplied implementation claims; none is independent test evidence',()=>{
    expect(QL245_SOURCE_CLAIMS).toHaveLength(6);
    expect(QL245_BLOCKERS).toHaveLength(6);
    expect(QL181_PREREQUISITES).toHaveLength(12);
    expect(QL245_SOURCE_CLAIMS.every(x=>x.gap.length>0)).toBe(true);
    const x=evidenceRig();
    const rows=ql245Portfolio({},x.source,x.audit,x.external,x.ownerRollout,
      x.connectionTests,x.witnessed);
    expect(rows).toHaveLength(4);
    expect(rows.every(x=>x.connection==='DISCONNECTED'&&x.ownerPermission==='NOT GIVEN'
      &&x.pilotHolds===12)).toBe(true);
  });
  it('accepts current sanitized six-source claim only as HELD, not independently verified',()=>{
    const x=evidenceRig();
    const result=inspectQl245Summary(x.report,'devilndove',x.source,x.audit,x.external,
      x.ownerRollout,x.connectionTests,x.witnessed);
    expect(result).toMatchObject({status:'SIGNED_SOURCE_CLAIMS_RECONCILED_HELD',
      ownerAuthorized:false,connection:'DISCONNECTED',writes:0,dispatch:0,pilotHolds:12});
    expect(result.reference?.credentialMetadata).toHaveLength(6);
    expect(inspectQl245Summary(x.report,'yw',x.source,x.audit,x.external,
      x.ownerRollout,x.connectionTests,x.witnessed).status).toBe('UPSTREAM_MISSING_HELD');
    expect(inspectQl245Summary(x.report,'devilndove',x.source,x.audit,x.external,
      x.ownerRollout,x.connectionTests,{}).status).toBe('UPSTREAM_MISSING_HELD');
  });
  it('rejects owner approval, connection claim, extra secret and foreign tenant',()=>{
    const x=evidenceRig();
    const inspect=(payload:unknown)=>inspectQl245Summary(payload,'devilndove',x.source,x.audit,
      x.external,x.ownerRollout,x.connectionTests,x.witnessed).status;
    for(const field of [
      {ownerPilotAuthorized:true},{connectionState:'CONNECTED'},{writes:1},
      {calls:1},{realPilotHolds:0},{realWorldWitnessConfirmed:true},
      {externalReadIndependentlyConfirmed:true},{ownerApprovalIndependentlyConfirmed:true}
    ])expect(inspect({...x.report,...field})).toBe('DENIED_SCOPE');
    expect(inspect({...x.report,token:'secret'})).toBe('DENIED_SCHEMA');
    const foreign=[...x.report.sourceMetadata];
    foreign[4]={...foreign[4],tenantId:'np-some-foreign-campground'};
    expect(inspect({...x.report,sourceMetadata:foreign})).toBe('SIGNED_SOURCE_CLAIMS_RECONCILED_HELD');
    // The browser verifies syntactic claims, not actual trusted tenant ownership:
    // the OFFLINE CLI checks tenant IDs against a separately trusted registry.
    const wrong=[...x.report.sourceMetadata];
    wrong[1]={...wrong[1],sourceRevision:'f'.repeat(40)};
    expect(inspect({...x.report,sourceMetadata:wrong})).toBe('DENIED_SCHEMA');
  });
  it('rejects replayed receipt IDs and freezes prior evidence on QL-244 source drift',()=>{
    const x=evidenceRig();
    const inspect=(payload:unknown)=>inspectQl245Summary(payload,'devilndove',x.source,x.audit,
      x.external,x.ownerRollout,x.connectionTests,x.witnessed).status;
    const duplicated=[...x.report.sourceMetadata];
    duplicated[4]={...duplicated[4],registryReceiptId:duplicated[3].registryReceiptId};
    expect(inspect({...x.report,sourceMetadata:duplicated})).toBe('DENIED_SCHEMA');
    const accepted=inspectQl245Summary(x.report,'devilndove',x.source,x.audit,
      x.external,x.ownerRollout,x.connectionTests,x.witnessed);
    const changed:Ql239Ledger={...x.source,devilndove:{
      ...x.source.devilndove!,proof:{...x.proof,sourceRevision:'f'.repeat(40)}
    }};
    expect(ql245CurrentStatus(accepted,'devilndove',changed,x.audit,x.external,
      x.ownerRollout,x.connectionTests,x.witnessed)).toBe('SOURCE_DRIFT_HELD');
  });
});
let host:HTMLDivElement;let root:Root;
beforeEach(async()=>{
  Object.assign(globalThis,{IS_REACT_ACT_ENVIRONMENT:true});
  host=document.createElement('div');document.body.append(host);root=createRoot(host);
  await act(async()=>root.render(<OperatorShell/>));
});
afterEach(async()=>{await act(async()=>root.unmount());host.remove();vi.restoreAllMocks();});
async function click(label:string,selector='button'){
  const found=[...host.querySelectorAll<HTMLButtonElement>(selector)]
    .find(b=>b.textContent?.includes(label));
  if(!found)throw new Error('Button not found: '+label);
  await act(async()=>found.click());
}
describe('QL-245 operator exception-triage page',()=>{
  it('shows six claimed sources, four disconnected businesses and six blockers',async()=>{
    await click('Six-app evidence & activation HOLD','.ql172-nav-button');
    const section=host.querySelector<HTMLElement>('[data-ql245-release]')!;
    expect(section.dataset.ql245Release).toBe(QL245_RELEASE);
    expect(section.querySelector('#ql245-sources')?.closest('section')?.querySelectorAll('tbody tr')).toHaveLength(6);
    expect(section.querySelector('#ql245-companies')?.closest('section')?.querySelectorAll('tbody tr')).toHaveLength(4);
    expect(section.querySelectorAll('[data-ql247-release] tbody tr')).toHaveLength(6);
    expect(section.querySelectorAll('[data-ql248-release] ol li')).toHaveLength(6);
    expect(section.querySelectorAll('[data-ql249-release] tbody tr')).toHaveLength(6);
    expect(section.querySelector('[data-ql249-release]')?.textContent).toContain('NOT SCHEDULED');
    expect(section.querySelectorAll('[data-ql250-release] tbody tr')).toHaveLength(6);
    expect(section.querySelector('[data-ql250-release]')?.textContent).toContain('NOT SCHEDULED');
    expect(section.querySelectorAll('[data-ql251-release] tbody tr')).toHaveLength(6);
    expect(section.querySelector('[data-ql251-release]')?.textContent).toContain('NOT AUTHORIZED');
    expect(section.querySelectorAll('[data-ql252-release] tbody tr')).toHaveLength(6);
    expect(section.querySelector('[data-ql252-release]')?.textContent).toContain('owner decision claim');
    expect(section.querySelector('[data-ql252-release]')?.textContent).toContain('404');
    expect(section.querySelectorAll('[data-ql253-release] tbody tr')).toHaveLength(6);
    expect(section.querySelector('[data-ql253-release]')?.textContent).toContain('404 for every application');
    expect(section.querySelector('[data-ql253-release]')?.textContent).toContain('OPTIONAL PRIVATE RELAY DESIGN ONLY / HELD');
    expect(section.querySelector('[data-ql253-release]')?.textContent).toContain('12/12');
    expect(section.querySelector('[data-ql248-release]')?.textContent).toContain('two immutable commits');
    expect(section.textContent).toContain('missing (404)');
    expect(section.textContent).toContain('6/6 HANDOFF SUMMARIES RECEIVED');
    expect(section.textContent).toContain('OWNER APPROVAL NOT GIVEN');
    expect(section.querySelector<HTMLButtonElement>('form button[type=submit]')?.disabled).toBe(true);
    await click('Independent evidence help');
    expect(section.textContent).toContain('ql245-verify-six-app-evidence.mjs');
    await click('six independent release blockers');
    expect(section.querySelectorAll('#ql245-blockers li')).toHaveLength(6);
    await click('Devil n Dove','.ql172-brand');
    expect(host.querySelector<HTMLButtonElement>('[data-ql245-release] form button[type=submit]')?.disabled)
      .toBe(false);
  });
  it('has no browser gateway network, client secret storage, owner approval or dispatch',async()=>{
    const fetchSpy=vi.spyOn(globalThis,'fetch');
    const storageSpy=vi.spyOn(Storage.prototype,'setItem');
    await click('Six-app evidence & activation HOLD','.ql172-nav-button');
    await click('iCamp','.ql172-brand');
    const section=host.querySelector<HTMLElement>('[data-ql245-release]')!;
    expect(section.dataset.company).toBe('icamp');
    expect(section.textContent).toContain('DISCONNECTED');
    expect(section.querySelector<HTMLButtonElement>('form button[type=submit]')?.disabled).toBe(true);
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(storageSpy).not.toHaveBeenCalled();
    const css=readFileSync('src/operator/ql245-six-app-evidence.css','utf8');
    for(const key of ['@media (max-width: 650px)',':focus-visible','forced-colors: active','min-height: 44px'])
      expect(css).toContain(key);
  });
});

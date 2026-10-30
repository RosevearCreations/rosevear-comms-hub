// @vitest-environment jsdom
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {act} from 'react';
import {createRoot} from 'react-dom/client';
import {describe,expect,it,vi} from 'vitest';
import {Ql263OriginalReceiptReadiness} from '../Ql263OriginalReceiptReadiness';
import {newQl258Ledger,ql258SanitizedHandoff} from '../ql258OwnerActionChecklist';
import {QL263_PUBLIC_SNAPSHOT,QL263_HUB_RETURN,QL263_ROSIE_ATTACHMENT_SHA256,
  QL263_FUTURE_GET_PLAN,ql263InitialOwnerLedger,ql263SetRole,
  ql263NewRoleLedger,ql263DecisionReview,ql263SourceReturnHandoff,
  intakeQl263OriginalPacket} from '../ql263OriginalReceiptsAndTestPlan';

describe('QL-263 original Rosie owner receipt, Hub source return and safe TEST-only plan',()=>{
  const fixturePath=resolve(process.cwd(),'src/operator/ql263RosieOriginalOwnerReturn.json');
  it('preserves actual attached Rosie original bytes and exact strict QL-258 schema',()=>{
    const bytes=readFileSync(fixturePath);
    expect(createHash('sha256').update(bytes).digest('hex')).toBe(QL263_ROSIE_ATTACHMENT_SHA256);
    const original=ql263InitialOwnerLedger();
    expect(Object.keys(original)).toEqual(['rosiedazzlers']);
    expect(original.rosiedazzlers?.progress.privateCustodian).toBe('NOT_REPORTED');
    expect(original.rosiedazzlers?.progress.independentWitness).toBe('NOT_REPORTED');
    expect(original.rosiedazzlers?.progress.independentReviewer).toBe('NOT_REPORTED');
    expect(original.rosiedazzlers?.sourceShaFromQl258)
      .toBe('69afa528d28ee1df3ad200cc5da0cf4a3c2acbf9');
  });
  it('distinguishes original Rosie self-report, Hub synthetic contract and missing signed proofs',()=>{
    const data=ql263DecisionReview(ql263InitialOwnerLedger(),ql263NewRoleLedger());
    expect(data.originalOwnerPacketsReceived).toBe(1);
    expect(data.hubNarrativeReceived).toBe(true);
    expect(QL263_HUB_RETURN.actualQl258OwnerJson).toBe('NOT_PROVIDED');
    expect(QL263_HUB_RETURN.staticContract).toBe('SYNTHETIC_IN_PROCESS_TEST_ONLY');
    expect(QL263_HUB_RETURN.authenticatedGatewayGets).toBe(0);
    expect(data.rows.find(x=>x.system==='rosiedazzlers')?.sourceDriftSinceOwnerPacket).toBe(true);
    expect(data.rows.find(x=>x.system==='rosevear-ai-hub')?.ownerPacket).toBe('NOT_RECEIVED');
    expect(data.rows.find(x=>x.system==='rosevear-ai-hub')?.syntheticSourceContract)
      .toBe('SYNTHETIC_IN_PROCESS_TEST_ONLY');
    expect(data.authenticHumanCustodians).toBe(0);
    expect(data.independentWitnesses).toBe(0);
    expect(data.originalSignedProofsAccepted).toBe(0);
    expect(data.authenticatedGatewayGets).toBe(0);
    expect(data.connection).toBe('DISCONNECTED');
    expect(data.livePilotHolds).toBe(12);
  });
  it('maps latest six immutable main source observations without inferring proof from a green build',()=>{
    expect(QL263_PUBLIC_SNAPSHOT).toHaveLength(6);
    expect(new Set(QL263_PUBLIC_SNAPSHOT.map(x=>x.system)).size).toBe(6);
    expect(QL263_PUBLIC_SNAPSHOT.every(x=>x.proof==='HTTP_404'&&/^[a-f0-9]{40}$/.test(x.sha)))
      .toBe(true);
    expect(QL263_PUBLIC_SNAPSHOT.find(x=>x.system==='rosevear-ai-hub')?.sha)
      .toBe('398e99bdd757b1829e3693e1584d927741d4fcf8');
    for(const app of QL263_PUBLIC_SNAPSHOT){
      const handoff=ql263SourceReturnHandoff(app.system);
      expect(handoff).toContain(app.sha);
      expect(handoff).toContain('DISCONNECTED / HOLD');
      expect(handoff).not.toContain('@live.ca');
    }
  });
  it('keeps owner-reported role provisioning unverified and rejects spoofed original receipts',()=>{
    const roles=ql263SetRole(ql263NewRoleLedger(),'yw','custodian',
      'OWNER_REPORTS_ROLE_PROVISIONED_UNVERIFIED');
    expect(ql263DecisionReview(ql263InitialOwnerLedger(),roles).authenticHumanCustodians).toBe(0);
    expect(()=>ql263SetRole(roles,'icamp','witness','AUTHENTICATED' as any)).toThrow();
    const original=ql263InitialOwnerLedger();
    const same=JSON.stringify(JSON.parse(readFileSync(fixturePath,'utf8')));
    expect(intakeQl263OriginalPacket(original,same).status)
      .toBe('DUPLICATE_IDENTICAL_NO_CHANGE_HELD');
    for(const injected of [
      {ownerTestAuthorization:'GRANTED'},
      {independentCustodyAuthenticated:true},
      {authenticatedGatewayGets:7},
      {privateSignerHost:'C:\\private'},
      {connection:'CONNECTED'}
    ])expect(intakeQl263OriginalPacket({},JSON.stringify({...JSON.parse(same),...injected})).status)
      .toBe('REJECTED_UNSAFE_OR_INVALID_PACKET');
    const blank=newQl258Ledger();
    const validNext=intakeQl263OriginalPacket(original,
      ql258SanitizedHandoff('ai-data-platform',blank['ai-data-platform']));
    expect(validNext.status).toBe('ACCEPTED_SELF_REPORTED_HELD');
    expect(ql263DecisionReview(validNext.ledger,roles).originalOwnerPacketsReceived).toBe(2);
  });
  it('provides a bounded draft only: nine GETs, seven denials, no live side effects',()=>{
    expect(QL263_FUTURE_GET_PLAN.mode).toBe('DRAFT_ONLY_NOT_AUTHORIZED');
    expect(QL263_FUTURE_GET_PLAN.allowedMethod).toBe('GET');
    expect(QL263_FUTURE_GET_PLAN.positiveReadOnlyPaths).toEqual(['/health','/capabilities']);
    expect(QL263_FUTURE_GET_PLAN.negativeOnlyGetCases).toHaveLength(7);
    expect(new Set(QL263_FUTURE_GET_PLAN.negativeOnlyGetCases).size).toBe(7);
    expect(QL263_FUTURE_GET_PLAN.maxRequestsPerApp).toBe(9);
    expect(QL263_FUTURE_GET_PLAN.maxWindowMinutes).toBe(15);
    expect(QL263_FUTURE_GET_PLAN.ownerTestAuthorization).toBe('NOT_GIVEN');
    expect(QL263_FUTURE_GET_PLAN.executed).toBe(false);
    expect(QL263_FUTURE_GET_PLAN.privateRelay).toBe(false);
    expect(QL263_FUTURE_GET_PLAN.sms).toBe(false);
  });
  it('renders the real original Rosie packet and offline plan without fetch, storage or gateway actions',async()=>{
    Object.assign(globalThis,{IS_REACT_ACT_ENVIRONMENT:true});
    const host=document.createElement('div');document.body.append(host);
    const root=createRoot(host);
    const fetchSpy=vi.spyOn(globalThis,'fetch');
    const storageSpy=vi.spyOn(Storage.prototype,'setItem');
    try{
      await act(async()=>root.render(<Ql263OriginalReceiptReadiness/>));
      const section=host.querySelector('[data-ql263-release]')!;
      expect(section.querySelectorAll('tbody tr')).toHaveLength(6);
      expect(section.textContent).toContain('Received original packets: 1/6');
      expect(section.textContent).toContain('SYNTHETIC_IN_PROCESS_TEST_ONLY');
      await act(async()=>{
        Array.from(section.querySelectorAll('button')).find(b=>b.textContent?.includes('bounded future GET'))!.click();
      });
      const selected=section.querySelector<HTMLSelectElement>('#ql263-source')!;
      await act(async()=>{selected.value='yw';selected.dispatchEvent(new Event('change',{bubbles:true}));});
      const role=section.querySelector<HTMLSelectElement>('#ql263-role-decision')!;
      await act(async()=>{role.value='OWNER_REPORTS_ROLE_PROVISIONED_UNVERIFIED';
        role.dispatchEvent(new Event('change',{bubbles:true}));});
      const report=JSON.parse(section.querySelector<HTMLTextAreaElement>(
        '[aria-label="QL-263 sanitized six-app report"]')!.value);
      expect(report.originalOwnerPacketsReceived).toBe(1);
      expect(report.rows.find((x:{system:string})=>x.system==='yw').custodianRole)
        .toBe('OWNER_REPORTS_ROLE_PROVISIONED_UNVERIFIED');
      expect(report.authenticHumanCustodians).toBe(0);
      expect(report.currentWindow.executed).toBe(false);
      expect(fetchSpy).not.toHaveBeenCalled();
      expect(storageSpy).not.toHaveBeenCalled();
    }finally{await act(async()=>root.unmount());host.remove();vi.restoreAllMocks();}
  });
});

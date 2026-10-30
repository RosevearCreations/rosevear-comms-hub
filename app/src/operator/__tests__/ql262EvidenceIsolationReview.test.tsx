// @vitest-environment jsdom
import {act} from 'react';
import {createRoot} from 'react-dom/client';
import {describe,expect,it,vi} from 'vitest';
import {QL258_APPS,newQl258Ledger,ql258SanitizedHandoff,updateQl258Step}
  from '../ql258OwnerActionChecklist';
import {Ql262EvidenceIsolationReview} from '../Ql262EvidenceIsolationReview';
import {QL262_PUBLIC_SOURCES,newQl262IsolationLedger,ql262SetIsolation,
  ql262EvidenceLedger,ql262FreshPublicProofCheck,intakeQl262OwnerPacket}
  from '../ql262EvidenceIsolationFreshness';

const blank=newQl258Ledger();
const packet=(system:typeof QL258_APPS[number]['system'])=>
  ql258SanitizedHandoff(system,blank[system]);

describe('QL-262 genuine receipt vs owner report and public main freshness (HELD)',()=>{
  it('retains six exact immutable public baselines and 404 without inventing new proof',()=>{
    expect(QL262_PUBLIC_SOURCES.map(x=>x.system)).toEqual(QL258_APPS.map(x=>x.system));
    expect(QL262_PUBLIC_SOURCES.every(x=>/^[a-f0-9]{40}$/.test(x.observedMainSha)&&
      x.originalProofAtObservedSha==='HTTP_404')).toBe(true);
    const report=ql262EvidenceLedger({},newQl262IsolationLedger());
    expect(report.rows).toHaveLength(6);
    expect(report.originalSanitizedOwnerPackets).toBe(0);
    expect(report.verifiedPublicSignedProofs).toBe(0);
    expect(report.authenticatedOwnerTestApprovals).toBe(0);
    expect(report.authenticatedGatewayGets).toBe(0);
    expect(report.livePilotHolds).toBe(12);
    expect(report.readyForGatewayTest).toBe(false);
  });
  it('accepts exactly original nonsecret packets as self-reports, and keeps tenant isolation held',()=>{
    let ledger={};
    let decisions=newQl262IsolationLedger();
    for(const app of QL258_APPS){
      const next=intakeQl262OwnerPacket(ledger,packet(app.system));
      expect(next.status).toBe('ACCEPTED_SELF_REPORTED_HELD');ledger=next.ledger;
    }
    decisions=ql262SetIsolation(decisions,'yw','OWNER_REPORTS_ISOLATED_UNVERIFIED');
    decisions=ql262SetIsolation(decisions,'icamp','OWNER_REPORTS_PRIVATE_REVIEW_PENDING');
    const summary=ql262EvidenceLedger(ledger,decisions);
    expect(summary.originalSanitizedOwnerPackets).toBe(6);
    expect(summary.ownerIsolationReports).toBe(2);
    expect(summary.independentlyVerifiedTestTenants).toBe(0);
    expect(summary.rows.find(x=>x.system==='yw')?.dedicatedTenantProofNeeded).toBe(true);
    expect(summary.rows.find(x=>x.system==='icamp')?.isolationIndependentVerification).toBe('NOT_RECEIVED');
    expect(summary.rows.find(x=>x.system==='rosiedazzlers')?.dedicatedTenantProofNeeded).toBe(false);
    expect(()=>ql262SetIsolation(decisions,'yw','INDEPENDENTLY_APPROVED' as any)).toThrow();
  });
  it('rejects forged trusted source/owner claims and leaks in packet fields',()=>{
    const base=JSON.parse(packet('yw'));
    for(const change of [
      {ownerTestAuthorization:'GRANTED'},{connection:'CONNECTED'},
      {sourceProofAccepted:true},{independentCustodyAuthenticated:true},
      {privateSigningKey:'not-allowed'},{tenantPrivateUrl:'https://internal.invalid'},
      {ownerReportedUnverifiedProgress:{...base.ownerReportedUnverifiedProgress,tenantIsolation:'NOT_APPLICABLE'}}
    ])expect(intakeQl262OwnerPacket({},JSON.stringify({...base,...change})).status)
      .toBe('REJECTED_UNSAFE_OR_INVALID_PACKET');
    const reported=updateQl258Step(blank,'icamp','tenantIsolation',
      'OWNER_REPORTS_DONE_NOT_VERIFIED');
    const result=intakeQl262OwnerPacket({},ql258SanitizedHandoff('icamp',reported.icamp));
    expect(ql262EvidenceLedger(result.ledger,newQl262IsolationLedger())
      .independentlyVerifiedTestTenants).toBe(0);
  });
  it('performs only GitHub API main and immutable raw-proof GETs, labels 200 UNVERIFIED',async()=>{
    const inputs:string[]=[];const baseline=QL262_PUBLIC_SOURCES;
    // Parallel sources interleave branch and proof calls: route by URL, not call order.
    const safe=vi.fn(async(input:RequestInfo|URL,init?:RequestInit)=>{
      const url=String(input);inputs.push(url);
      expect(init).toEqual({method:'GET',credentials:'omit',cache:'no-store',redirect:'error',referrerPolicy:'no-referrer'});
      const index=baseline.findIndex(row=>url.includes(`/${row.repository}/`));
      expect(index).toBeGreaterThanOrEqual(0);
      if(url.startsWith('https://api.github.com/'))return {
        status:200,json:async()=>({name:'main',commit:{sha:baseline[index].observedMainSha}})
      } as Response;
      return {status:index===0?200:404} as Response;
    });
    const results=await ql262FreshPublicProofCheck(safe as typeof fetch);
    expect(safe).toHaveBeenCalledTimes(12);
    expect(results[0].proofStatus).toBe('PUBLIC_FILE_PRESENT_UNVERIFIED');
    expect(results.slice(1).every(r=>r.proofStatus==='MISSING_404')).toBe(true);
    expect(results.every(r=>r.sourceFreshness==='SAME_AS_QL260')).toBe(true);
    expect(inputs.filter(url=>url.startsWith('https://raw.githubusercontent.com/'))).toHaveLength(6);
    const ledger=ql262EvidenceLedger({},newQl262IsolationLedger(),results);
    expect(ledger.verifiedPublicSignedProofs).toBe(0);
    expect(ledger.authenticatedGatewayGets).toBe(0);
  });
  it('fails closed for invalid public main SHA, API outages or a moving branch',async()=>{
    const requests:string[]=[];
    const mock=vi.fn(async(input:RequestInfo|URL)=>{
      const url=String(input);requests.push(url);
      if(url.startsWith('https://api.github.com/')&&url.includes('/yw/'))
        return {status:200,json:async()=>({name:'main',commit:{sha:'bad'}})} as Response;
      if(url.startsWith('https://api.github.com/')&&url.includes('/iCamp/'))throw Error('rate limited');
      if(url.startsWith('https://api.github.com/'))return {
        status:200,json:async()=>({name:'main',commit:{sha:'b'.repeat(40)}})
      } as Response;
      return {status:404} as Response;
    });
    const result=await ql262FreshPublicProofCheck(mock as typeof fetch);
    expect(result.find(x=>x.system==='yw')?.sourceFreshness).toBe('MAIN_SHA_UNKNOWN');
    expect(result.find(x=>x.system==='icamp')?.proofStatus).toBe('NETWORK_UNKNOWN');
    expect(result.find(x=>x.system==='rosiedazzlers')?.sourceFreshness).toBe('NEW_SHA_REVIEW_REQUIRED');
    expect(requests.every(url=>url.startsWith('https://api.github.com/repos/RosevearCreations/')||
      url.startsWith('https://raw.githubusercontent.com/RosevearCreations/'))).toBe(true);
    expect(requests).toHaveLength(10);
  });
  it('lets operator run safe local/public checks and update decisions without storage or unauthorized network',async()=>{
    Object.assign(globalThis,{IS_REACT_ACT_ENVIRONMENT:true});
    const host=document.createElement('div');document.body.append(host);
    const root=createRoot(host);
    const fetchSpy=vi.spyOn(globalThis,'fetch').mockResolvedValue({status:404} as Response);
    const storageSpy=vi.spyOn(Storage.prototype,'setItem');
    try{
      await act(async()=>root.render(<Ql262EvidenceIsolationReview/>));
      const section=host.querySelector('[data-ql262-release]')!;
      expect(section.querySelectorAll('tbody tr')).toHaveLength(6);
      expect(section.textContent).toContain('0/6');
      const input=section.querySelector<HTMLTextAreaElement>('#ql262-owner-json')!;
      await act(async()=>{
        Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype,'value')!
          .set!.call(input,packet('yw'));
        input.dispatchEvent(new Event('input',{bubbles:true}));
      });
      await act(async()=>section.querySelector<HTMLButtonElement>('button[type=submit]')!.click());
      const select=section.querySelector<HTMLSelectElement>('#ql262-isolation-decision')!;
      await act(async()=>{select.value='OWNER_REPORTS_ISOLATED_UNVERIFIED';
        select.dispatchEvent(new Event('change',{bubbles:true}));});
      await act(async()=>{
        Array.from(section.querySelectorAll('button')).find(b=>b.textContent?.includes('offline'))!.click();
      });
      const report=JSON.parse(section.querySelector<HTMLTextAreaElement>(
        '[aria-label="QL-262 nonsecret evidence ledger"]')!.value);
      expect(report.originalSanitizedOwnerPackets).toBe(1);
      expect(report.ownerIsolationReports).toBe(1);
      expect(report.readyForGatewayTest).toBe(false);
      expect(fetchSpy).not.toHaveBeenCalled();
      await act(async()=>{
        Array.from(section.querySelectorAll('button')).find(b=>b.textContent?.includes('current main'))!.click();
      });
      expect(fetchSpy).toHaveBeenCalledTimes(6);
      const newReport=JSON.parse(section.querySelector<HTMLTextAreaElement>(
        '[aria-label="QL-262 nonsecret evidence ledger"]')!.value);
      expect(newReport.currentPublicProofChecks).toBe(6);
      expect(newReport.verifiedPublicSignedProofs).toBe(0);
      expect(storageSpy).not.toHaveBeenCalled();
    }finally{await act(async()=>root.unmount());host.remove();vi.restoreAllMocks();}
  });
});

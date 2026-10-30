// @vitest-environment jsdom
import {act} from 'react';
import {createRoot} from 'react-dom/client';
import {describe,expect,it,vi} from 'vitest';
import {Ql261SixAppPreflight} from '../Ql261SixAppPreflight';
import {QL258_APPS,newQl258Ledger,ql258SanitizedHandoff,updateQl258Step}
  from '../ql258OwnerActionChecklist';
import {QL261_GUIDES,checkQl261PublicProofs,intakeQl261Packet,
  ql261AppHandoff,runQl261OfflinePreflight} from '../ql261SixAppPreflight';

const blank=newQl258Ledger();
const packet=(system:typeof QL258_APPS[number]['system'])=>
  ql258SanitizedHandoff(system,blank[system]);

describe('QL-261 six-app original owner packets and safe local test',()=>{
  it('has distinct, actionable guides with the correct six source identities',()=>{
    expect(QL261_GUIDES.map(g=>g.system)).toEqual(QL258_APPS.map(a=>a.system));
    expect(new Set(QL261_GUIDES.map(g=>g.filename)).size).toBe(6);
    expect(QL261_GUIDES.every(g=>g.blocker.length>90)).toBe(true);
    for(const app of QL258_APPS){
      const handoff=ql261AppHandoff(app.system);
      expect(handoff).toContain(`RosevearCreations/${app.repository}`);
      expect(handoff).toContain(`docs/integration/ql261/`);
      expect(handoff).toContain('DISCONNECTED / HOLD');
      expect(handoff).not.toContain('jfrosevear@');
    }
  });
  it('accepts six exact original QL-258 packets without granting security evidence',()=>{
    let ledger={};
    for(const app of QL258_APPS){
      const next=intakeQl261Packet(ledger,packet(app.system));
      expect(next.status).toBe('ACCEPTED_SELF_REPORTED_HELD');
      ledger=next.ledger;
    }
    const result=runQl261OfflinePreflight(ledger);
    expect(result.checkedApps).toBe(6);
    expect(result.validOriginalOwnerPackets).toBe(6);
    expect(result.authenticatedCustodians).toBe(0);
    expect(result.verifiedSignedProofs).toBe(0);
    expect(result.verifiedSeparateTestTenants).toBe(0);
    expect(result.authenticatedOwnerTestApprovals).toBe(0);
    expect(result.authenticatedGatewayGets).toBe(0);
    expect(result.readyForNetworkTest).toBe(false);
    expect(result.livePilotHolds).toBe(12);
    expect(result.rows.find(x=>x.system==='yw')?.nonproductionTenant)
      .toBe('SEPARATE_ISOLATED_TENANT_NOT_VERIFIED');
    expect(result.rows.find(x=>x.system==='icamp')?.nonproductionTenant)
      .toBe('SEPARATE_ISOLATED_TENANT_NOT_VERIFIED');
    const checked=updateQl258Step(blank,'yw','tenantIsolation',
      'OWNER_REPORTS_DONE_NOT_VERIFIED');
    const ownerClaim=intakeQl261Packet({},ql258SanitizedHandoff('yw',checked.yw));
    expect(runQl261OfflinePreflight(ownerClaim.ledger).verifiedSeparateTestTenants).toBe(0);
  });
  it('fails closed on fake approvals, keys, swapped systems and conflicting packet replay',()=>{
    const base=JSON.parse(packet('icamp'));
    for(const change of [
      {ownerTestAuthorization:'APPROVED'},{connection:'CONNECTED'},
      {sourceProofAccepted:true},{privateKey:'invalid'},
      {authenticatedGatewayGets:7},{repository:'yw'},
      {ownerReportedUnverifiedProgress:{...base.ownerReportedUnverifiedProgress,tenantIsolation:'NOT_APPLICABLE'}}
    ])expect(intakeQl261Packet({},JSON.stringify({...base,...change})).status)
      .toBe('REJECTED_UNSAFE_OR_INVALID_PACKET');
    const first=intakeQl261Packet({},packet('yw'));
    expect(intakeQl261Packet(first.ledger,packet('yw')).status)
      .toBe('DUPLICATE_IDENTICAL_NO_CHANGE_HELD');
    const changed=updateQl258Step(blank,'yw','privateHost','OWNER_REPORTS_IN_PROGRESS');
    expect(intakeQl261Packet(first.ledger,ql258SanitizedHandoff('yw',changed.yw)).status)
      .toBe('CONFLICT_REQUIRES_CLEAR_HELD');
  });
  it('fetches ONLY the six allowlisted immutable public GitHub URLs and never trusts HTTP 200',async()=>{
    const urls:string[]=[];
    const request=vi.fn(async(input:RequestInfo|URL,init?:RequestInit)=>{
      urls.push(String(input));
      expect(init).toEqual({method:'GET',credentials:'omit',cache:'no-store',
        redirect:'error',referrerPolicy:'no-referrer'});
      return {status:urls.length===1?200:404} as Response;
    });
    const result=await checkQl261PublicProofs(request as typeof fetch);
    expect(result).toHaveLength(6);
    expect(result[0].result).toBe('PUBLIC_FILE_PRESENT_UNVERIFIED');
    expect(result.slice(1).every(row=>row.result==='MISSING_404')).toBe(true);
    expect(urls.every(url=>/^https:\/\/raw\.githubusercontent\.com\/RosevearCreations\/[a-zA-Z-]+\/[a-f0-9]{40}\/docs\/integration\/ql246-source-proof\.json$/.test(url))).toBe(true);
    const errors=await checkQl261PublicProofs(vi.fn(async()=>{throw Error('offline');}) as typeof fetch);
    expect(errors.every(row=>row.result==='NETWORK_UNKNOWN'&&row.httpStatus===null)).toBe(true);
  });
  it('shows six guides, runs offline test and optional public test without any gateway or storage calls',async()=>{
    Object.assign(globalThis,{IS_REACT_ACT_ENVIRONMENT:true});
    const host=document.createElement('div');document.body.append(host);
    const root=createRoot(host);
    const fetchSpy=vi.spyOn(globalThis,'fetch').mockResolvedValue({status:404} as Response);
    const storageSpy=vi.spyOn(Storage.prototype,'setItem');
    try{
      await act(async()=>root.render(<Ql261SixAppPreflight/>));
      const panel=host.querySelector('[data-ql261-release]')!;
      expect(panel.querySelectorAll('tbody tr')).toHaveLength(6);
      expect(panel.textContent).toContain('0/6');
      const input=panel.querySelector<HTMLTextAreaElement>('#ql261-owner-packet')!;
      await act(async()=>{
        Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype,'value')!
          .set!.call(input,packet('icamp'));
        input.dispatchEvent(new Event('input',{bubbles:true}));
      });
      await act(async()=>panel.querySelector<HTMLButtonElement>('button[type=submit]')!.click());
      await act(async()=>{
        Array.from(panel.querySelectorAll('button')).find(b=>b.textContent?.includes('offline preflight'))!.click();
      });
      const report=JSON.parse(panel.querySelector<HTMLTextAreaElement>(
        '[aria-label="QL-261 sanitized six-app preflight report"]')!.value);
      expect(report.validOriginalOwnerPackets).toBe(1);
      expect(report.rows.find((r:{system:string})=>r.system==='icamp').packet)
        .toBe('SCHEMA_VALID_SELF_REPORT_UNVERIFIED');
      expect(report.readyForNetworkTest).toBe(false);
      expect(fetchSpy).not.toHaveBeenCalled();
      await act(async()=>{
        Array.from(panel.querySelectorAll('button')).find(b=>b.textContent?.includes('six public GitHub'))!.click();
      });
      expect(fetchSpy).toHaveBeenCalledTimes(6);
      const after=JSON.parse(panel.querySelector<HTMLTextAreaElement>(
        '[aria-label="QL-261 sanitized six-app preflight report"]')!.value);
      expect(after.publicGithubCheck).toHaveLength(6);
      expect(after.authenticatedGatewayGets).toBe(0);
      expect(storageSpy).not.toHaveBeenCalled();
    }finally{await act(async()=>root.unmount());host.remove();vi.restoreAllMocks();}
  });
});

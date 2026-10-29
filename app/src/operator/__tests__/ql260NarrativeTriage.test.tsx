// @vitest-environment jsdom
import {act} from 'react';
import {createRoot} from 'react-dom/client';
import {describe,expect,it,vi} from 'vitest';
import {Ql260NarrativeTriage} from '../Ql260NarrativeTriage';
import {QL260_SOURCE_REPORTS,QL260_PROOF_PATH,inspectQl260Narratives,
  ql260AppHandoff,ql260SanitizedPortfolio}
  from '../ql260NarrativeReturnTriage';

describe('QL-260 actual five narrative returns and iCamp absent',()=>{
  it('maps exactly six repositories, 5 narrative claims, 0 owner JSON and six immutable proof 404s',()=>{
    expect(QL260_SOURCE_REPORTS).toHaveLength(6);
    expect(new Set(QL260_SOURCE_REPORTS.map(r=>r.repository)).size).toBe(6);
    expect(QL260_SOURCE_REPORTS.every(r=>/^[0-9a-f]{40}$/.test(r.mainSha))).toBe(true);
    const result=inspectQl260Narratives();
    expect(result.status).toContain('FIVE_NARRATIVES_ONE_MISSING');
    expect(result.narrativeReplies).toBe(5);
    expect(result.actualSanitizedOwnerPacketsReceived).toBe(0);
    expect(result.queue).toHaveLength(6);
    expect(result.queue.every(x=>x.originalProof==='HTTP_404_AT_IMMUTABLE_MAIN')).toBe(true);
    expect(result.proofPath).toBe(QL260_PROOF_PATH);
    expect(result.connection).toBe('DISCONNECTED');
    expect(result.ownerTestAuthorization).toBe('NOT_GIVEN');
    expect(result.authenticatedGatewayGets).toBe(0);
    expect(result.livePilotHolds).toBe(12);
  });
  it('distinguishes actual evidence from production business releases and signer claims',()=>{
    const list=inspectQl260Narratives().queue;
    expect(list.find(x=>x.system==='ai-data-platform')?.signer)
      .toBe('CANDIDATE_SIGNER_CUSTODY_UNVERIFIED');
    expect(list.find(x=>x.system==='yw')?.tenant)
      .toBe('PRODUCTION_COMPANY_OBSERVED_TEST_TENANT_UNVERIFIED');
    expect(list.find(x=>x.system==='rosiedazzlers')?.reportedResponse)
      .toBe('FUNCTIONALITY_RELEASE_UPDATE_NOT_SIGNER_REPORT');
    expect(list.find(x=>x.system==='icamp')?.reportedResponse)
      .toBe('NO_NEW_OWNER_FORWARDED_RETURN');
    expect(list.find(x=>x.system==='rosevear-ai-hub')?.tenant)
      .toBe('PRIVATE_RELAY_NOT_STARTED');
  });
  it('fails closed for fabricated custody, removed source, wrong SHA or secret metadata',()=>{
    const base=structuredClone(QL260_SOURCE_REPORTS);
    for(const mutate of [
      (x:any[])=>{x[0].signer='INDEPENDENTLY_AUTHENTICATED';},
      (x:any[])=>{x[2].proofB='authenticated';},
      (x:any[])=>{x[4].narrative='RECEIVED';},
      (x:any[])=>{x[3].mainSha='a'.repeat(40);},
      (x:any[])=>{x.pop();}
    ]){
      const data=structuredClone(base) as unknown as any[];mutate(data);
      const out=inspectQl260Narratives(data);
      expect(out.status).toBe('DENIED_FALSE_OR_OUT_OF_SCOPE_EVIDENCE');
      expect(out.connection).toBe('DISCONNECTED');
      expect(out.ownerTestAuthorization).toBe('NOT_GIVEN');
    }
  });
  it('generates only fixed nonsecret app instructions and a HELD summary',()=>{
    for(const app of QL260_SOURCE_REPORTS){
      const report=ql260AppHandoff(app.system);
      expect(report).toContain(app.mainSha);
      expect(report).toContain('Owner TEST authorization NOT_GIVEN');
      expect(report).toContain(app.nextAction);
      expect(report).not.toContain('@outlook.com');
      expect(report).not.toContain('@live.ca');
    }
    expect(()=>ql260AppHandoff('missing' as 'icamp')).toThrow();
    const summary=JSON.parse(ql260SanitizedPortfolio());
    expect(summary.actualSanitizedOwnerPacketsReceived).toBe(0);
    expect(summary.authenticatedCustodians).toBe(0);
    expect(summary.homeRelayRunning).toBe(false);
  });
  it('renders owner-safe app handoff without browser fetch/storage or connection controls',async()=>{
    Object.assign(globalThis,{IS_REACT_ACT_ENVIRONMENT:true});
    const host=document.createElement('div');document.body.append(host);
    const root=createRoot(host);
    const fetchSpy=vi.spyOn(globalThis,'fetch');
    const storageSpy=vi.spyOn(Storage.prototype,'setItem');
    try{
      await act(async()=>root.render(<Ql260NarrativeTriage/>));
      const panel=host.querySelector('[data-ql260-release]')!;
      expect(panel.querySelectorAll('tbody tr')).toHaveLength(6);
      expect(panel.textContent).toContain('5/6 narrative updates');
      const select=panel.querySelector<HTMLSelectElement>('#ql260-selected-app')!;
      await act(async()=>{select.value='yw';select.dispatchEvent(new Event('change',{bubbles:true}));});
      expect(panel.textContent).toContain('Production company ownership does not prove test isolation');
      const handoff=panel.querySelector<HTMLTextAreaElement>(
        '[aria-label="Selected QL-260 sanitized app handoff"]')!.value;
      expect(handoff).toContain('Yard Workers');
      expect(handoff).toContain('DISCONNECTED');
      expect(fetchSpy).not.toHaveBeenCalled();
      expect(storageSpy).not.toHaveBeenCalled();
    }finally{await act(async()=>root.unmount());host.remove();vi.restoreAllMocks();}
  });
});

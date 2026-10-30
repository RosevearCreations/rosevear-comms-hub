// @vitest-environment jsdom
import {act} from 'react';
import {createRoot,type Root} from 'react-dom/client';
import {afterEach,beforeEach,describe,expect,it,vi} from 'vitest';
import {Ql270Connections} from '../Ql270Connections';
import {QL270_SOURCES,QL270_PROOF_SNAPSHOT,ql270ClassifyPublicResponse,ql270PrepareLocalPlan,ql270PublicProofUrl}
  from '../ql270ConnectionCentre';

let host:HTMLDivElement;let root:Root;const navigate=vi.fn();
beforeEach(async()=>{
  Object.assign(globalThis,{IS_REACT_ACT_ENVIRONMENT:true});
  host=document.createElement('div');document.body.append(host);root=createRoot(host);
  await act(async()=>root.render(<Ql270Connections onNavigate={navigate}/>));
});
afterEach(async()=>{await act(async()=>root.unmount());host.remove();vi.restoreAllMocks();navigate.mockReset();});
const button=(text:string)=>[...host.querySelectorAll('button')].find(b=>b.textContent?.includes(text))!;

describe('QL-270 six-app connection centre and fail-closed public checks',()=>{
  it('separates four business apps and two supporting services with no implied live capability',()=>{
    expect(QL270_SOURCES).toHaveLength(6);
    expect(QL270_PROOF_SNAPSHOT.every(x=>x.proof==='HTTP_404'&&/^[0-9a-f]{40}$/.test(x.sha))).toBe(true);
    expect(QL270_SOURCES.filter(s=>s.kind==='Business app')).toHaveLength(4);
    expect(QL270_SOURCES.filter(s=>s.kind!=='Business app')).toHaveLength(2);
    expect(host.querySelectorAll('.ql270-source')).toHaveLength(6);
    expect(host.textContent).toContain('AI Data Platform');
    expect(host.textContent).toContain('Rosevear AI Hub');
    expect(host.textContent).toContain('Live pilot holds');
    expect(host.textContent).toContain('DISCONNECTED / HOLD');
  });
  it('renders an actionable connection planning view and full evidence navigation',async()=>{
    await act(async()=>button('How connecting works').click());
    expect(host.textContent).toContain('a fifth business');
    await act(async()=>button('Open security evidence').click());
    expect(navigate).toHaveBeenCalledWith('six_app_evidence');
    await act(async()=>button('Yard Workers').click());
    expect(host.querySelector('#ql270-inspector-title')?.textContent).toContain('Yard Workers');
    expect(host.textContent).toContain('Rosevear Landscaping');
  });
  it('offers only allowlisted public GitHub proof URLs and classifies HTTP without trusting the signer',()=>{
    for(const source of QL270_SOURCES){
      const url=ql270PublicProofUrl(source.id);
      expect(url).toMatch(/^https:\/\/api\.github\.com\/repos\/RosevearCreations\//);
      expect(url).toContain('docs/integration/ql246-source-proof.json?ref=main');
    }
    expect(()=>ql270PublicProofUrl('random-user-supplied-url' as never)).toThrow();
    expect(ql270ClassifyPublicResponse(200)).toBe('PUBLIC_FILE_PRESENT_UNVERIFIED');
    expect(ql270ClassifyPublicResponse(404)).toBe('MISSING_404');
    expect(ql270ClassifyPublicResponse(403)).toBe('GITHUB_RATE_LIMITED_OR_FORBIDDEN');
  });
  it('runs one public GET without credentials and does not claim a live connection',async()=>{
    const fetchMock=vi.spyOn(globalThis,'fetch').mockResolvedValue({status:404} as Response);
    await act(async()=>button('Check public Proof-B file').click());
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][0]).toBe(ql270PublicProofUrl('rosiedazzlers'));
    expect(fetchMock.mock.calls[0][1]).toMatchObject({method:'GET',credentials:'omit'});
    expect(host.textContent).toContain('Public signed proof missing (404)');
    expect(host.textContent).toContain('GET trial cannot be scheduled');
  });
  it('prepares only session-local generic alias drafts and never authorizes GETs',()=>{
    expect(ql270PrepareLocalPlan('rosiedazzlers','np-demo-lab').tenantAliasValid).toBe(true);
    expect(ql270PrepareLocalPlan('rosiedazzlers','np-real@private').tenantAliasValid).toBe(false);
    const plan=ql270PrepareLocalPlan('icamp','np-camp-test');
    expect(plan.allowedMethod).toBe('GET');
    expect(plan.connectionEnabled).toBe(false);
    expect(plan.authenticatedSourceProofB).toBe(false);
    expect(plan.gatewayRequestCount).toBe(0);
    expect(plan.release).toBe('DISCONNECTED / HOLD');
  });
  it('keeps the real gateway offline when GitHub is unavailable',async()=>{
    vi.spyOn(globalThis,'fetch').mockRejectedValue(new Error('offline'));
    await act(async()=>button('Check public Proof-B file').click());
    expect(host.textContent).toContain('Public check unavailable');
    expect(host.textContent).toContain('GET trial cannot be scheduled');
  });
});

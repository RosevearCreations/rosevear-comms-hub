// @vitest-environment jsdom
import {act} from 'react';
import {createRoot,type Root} from 'react-dom/client';
import {afterEach,beforeEach,expect,it,vi} from 'vitest';
import {QL349_PUBLIC_SOURCES,refreshSixPublicSources,refreshOnePublicSource}
  from '../ql349PublicSourceRefresh';
import {Ql349ConnectionControlCenter} from '../Ql349ConnectionControlCenter';

const commit='e'.repeat(40);
const manifest=(s:typeof QL349_PUBLIC_SOURCES[number])=>({
  schema:'rosevear.integration.discovery.v1',manifest_version:'1.0.0',
  source_id:s.id,source_app_id:s.app,repository:`RosevearCreations/${s.repo}`,
  requested_scope:'public_nonsecret_discovery_only',
  failure_behavior:'HOLD_AND_QUARANTINE',connection_state:'DISCONNECTED / HOLD',
  transport:{origin:null,redirects:'DENY'},signature:{algorithm:'Ed25519'}});

const calls:string[]=[];
const fetcher=vi.fn(async (resource:string)=>{
  calls.push(resource);
  const source=QL349_PUBLIC_SOURCES.find(s=>resource.includes(`/${s.repo}/`));
  if(!source)throw Error('unexpected host');
  const head=resource.includes('/commits/main');
  return {ok:true,redirected:false,url:resource,
    headers:{get:()=>null},
    json:async()=>({sha:commit}),text:async()=>JSON.stringify(manifest(source)),
    status:200};
}) as unknown as typeof fetch;

beforeEach(()=>{calls.length=0;});
afterEach(()=>{vi.restoreAllMocks();});

it('automatically checks all six exact public manifests at immutable revisions with GET only',async()=>{
  const results=await refreshSixPublicSources(fetcher);
  expect(results).toHaveLength(6);
  expect(results.every(s=>s.state==='PUBLIC_MANIFEST_FOUND_TRUST_HELD')).toBe(true);
  expect(results.every(s=>s.connection==='DISCONNECTED / HOLD')).toBe(true);
  expect(calls).toHaveLength(12);
  expect(calls.every(url=>url.startsWith('https://api.github.com/repos/RosevearCreations/')||
    url.startsWith('https://raw.githubusercontent.com/RosevearCreations/'))).toBe(true);
  expect(calls.some(url=>url.includes('/api/integration/v1/'))).toBe(false);
});

it('never marks forged public status, wrong identity or missing source as connected',async()=>{
  const source=QL349_PUBLIC_SOURCES[0];
  const bad=vi.fn(async (url:string)=>({ok:true,redirected:false,url,
    headers:{get:()=>null},json:async()=>({sha:commit}),
    text:async()=>JSON.stringify({...manifest(source),connection_state:'CONNECTED'})})) as unknown as typeof fetch;
  const checked=await refreshOnePublicSource(source,bad);
  expect(checked.state).toBe('PUBLIC_MANIFEST_INCOMPATIBLE_HELD');
  expect(checked.connection).toBe('DISCONNECTED / HOLD');
  const unavailable=await refreshOnePublicSource(source,vi.fn(async()=>{throw Error('offline');}) as unknown as typeof fetch);
  expect(unavailable.state).toBe('PUBLIC_MANIFEST_MISSING_OR_UNREACHABLE');
});

it('survives exhausted GitHub API quota using explicitly unpinned public manifests only',async()=>{
  const requests:string[]=[];
  const rateLimited=vi.fn(async (url:string)=>{
    requests.push(url);
    const source=QL349_PUBLIC_SOURCES.find(s=>url.includes(`/${s.repo}/`))!;
    return url.includes('/commits/main')?
      {ok:false,status:403,redirected:false,url}:
      {ok:true,status:200,redirected:false,url,headers:{get:()=>null},
        text:async()=>JSON.stringify(manifest(source))};
  }) as unknown as typeof fetch;
  const result=await refreshSixPublicSources(rateLimited);
  expect(result).toHaveLength(6);
  expect(result.every(s=>s.state==='PUBLIC_MANIFEST_FOUND_UNPINNED_TRUST_HELD')).toBe(true);
  expect(result.every(s=>!s.commitSha&&s.connection==='DISCONNECTED / HOLD')).toBe(true);
  expect(requests).toHaveLength(12);
  expect(requests.filter(x=>x.includes('/main/')&&x.includes('raw.githubusercontent.com'))).toHaveLength(6);
});

it('never treats an API rate-limit fallback mismatch as a valid descriptor',async()=>{
  const source=QL349_PUBLIC_SOURCES[0];
  const rateLimited=vi.fn(async(url:string)=>url.includes('/commits/main')?
    {ok:false,status:429,redirected:false,url}:
    {ok:true,status:200,redirected:false,url,headers:{get:()=>null},
      text:async()=>JSON.stringify({...manifest(source),repository:'malicious/wrong'})}) as unknown as typeof fetch;
  const found=await refreshOnePublicSource(source,rateLimited);
  expect(found.state).toBe('PUBLIC_MANIFEST_INCOMPATIBLE_HELD');
  expect(found.connection).toBe('DISCONNECTED / HOLD');
});

let root:Root;let host:HTMLDivElement;
beforeEach(async()=>{Object.assign(globalThis,{IS_REACT_ACT_ENVIRONMENT:true});
  host=document.createElement('div');document.body.append(host);root=createRoot(host);
  await act(async()=>root.render(<Ql349ConnectionControlCenter/>));});
afterEach(async()=>{await act(async()=>root.unmount());host.remove();});

it('shows six held apps and refreshes published contracts on explicit user action',async()=>{
  expect(host.querySelectorAll('.ql349-grid article')).toHaveLength(6);
  expect(host.textContent).toContain('0/6 private connections');
  const button=host.querySelector<HTMLButtonElement>('.ql349-actionbar button')!;
  expect(button.textContent).toContain('Refresh six source contracts');
  vi.stubGlobal('fetch',fetcher);
  try{await act(async()=>button.click());}
  finally{vi.unstubAllGlobals();}
  expect(host.textContent).toContain('6/6 public descriptors found');
  expect(host.textContent).toContain('0 authenticated private connections');
  expect(host.textContent).toContain('no code changed');
});

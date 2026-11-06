// @vitest-environment jsdom
import {act} from 'react';
import {createRoot,type Root} from 'react-dom/client';
import {afterEach,beforeEach,expect,it,vi} from 'vitest';
import {Ql350PrivateBridgePanel} from '../Ql350PrivateBridgePanel';
import {QL350_SCHEMA,inspectQl350PrivateStatus,checkPrivateQl350Bridge,
  requestOnePrivateQl350Test} from '../ql350PrivateBridgeClient';
import {QL349_PUBLIC_SOURCES} from '../ql349PublicSourceRefresh';

const peers=QL349_PUBLIC_SOURCES.map(s=>({sourceId:s.id,state:'DISCONNECTED / HOLD'}));
const status=(ready=false)=>({schema:QL350_SCHEMA,
  state:ready?'ORIGINAL_TEST_RECEIPT_VERIFIED_PER_SOURCE_AUTHORITY_PENDING':
    'HOLD_ORIGINAL_WINDOWS_ENROLLMENT_AND_SIGNED_RECEIPT',
  connectedCount:0,authenticatedPrivateOperator:true,peerCount:6,
  originalEnrollmentCount:ready?1:0,originalReceiptCount:ready?1:0,
  originalReceiptVerified:ready,readyForOneSourceTest:ready,peers});

let host:HTMLDivElement;let root:Root;
beforeEach(async()=>{Object.assign(globalThis,{IS_REACT_ACT_ENVIRONMENT:true});
  host=document.createElement('div');document.body.append(host);root=createRoot(host);
  await act(async()=>root.render(<Ql350PrivateBridgePanel/>));});
afterEach(async()=>{await act(async()=>root.unmount());host.remove();vi.unstubAllGlobals();});

it('requires exactly six HELD source IDs and server-authenticated session truth',()=>{
  expect(inspectQl350PrivateStatus(status(false))).toBeTruthy();
  expect(inspectQl350PrivateStatus({...status(true),connectedCount:6})).toBeNull();
  expect(inspectQl350PrivateStatus({...status(true),originalEnrollmentCount:0})).toBeNull();
  expect(inspectQl350PrivateStatus({...status(true),authenticatedPrivateOperator:false})).toBeNull();
  expect(inspectQl350PrivateStatus({...status(true),peers:peers.slice(1)})).toBeNull();
});

it('never sends private credentials or source URLs and uses same-origin only',async()=>{
  const calls:Array<{url:string;init:RequestInit}>=[];
  const fetcher=vi.fn(async(url:string,init:RequestInit)=>{
    calls.push({url,init});
    return {ok:true,status:200,redirected:false,url:'',
      json:async()=>url.includes('status')?status(true):{
        schema:QL350_SCHEMA,state:'HOLD_SOURCE_AUTHORITY',connectedCount:0}};
  }) as unknown as typeof fetch;
  expect(await checkPrivateQl350Bridge(fetcher)).toBeTruthy();
  const result=await requestOnePrivateQl350Test('yw',
    'bdbcf613-d84b-4826-81c2-f8a1f170fc65',fetcher);
  expect(result?.connectedCount).toBe(0);
  expect(calls.map(c=>c.url)).toEqual(['/private/ql350/status','/private/ql350/test']);
  expect(calls.every(c=>c.init.credentials==='same-origin'&&c.init.mode==='same-origin'&&
    c.init.redirect==='error')).toBe(true);
  const body=JSON.parse(calls[1].init.body as string);
  expect(Object.keys(body).sort()).toEqual(['operationId','sourceId']);
  expect(await requestOnePrivateQl350Test('unknown','bad',fetcher)).toBeNull();
  expect(calls).toHaveLength(2);
});

it('public disabled preview offers guidance, not active TEST dispatch',async()=>{
  expect(host.querySelectorAll('.ql350-peer-grid article')).toHaveLength(6);
  expect([...host.querySelectorAll<HTMLButtonElement>('.ql350-peer-grid button')]
    .every(b=>b.disabled)).toBe(true);
  vi.stubGlobal('fetch',vi.fn(async()=>({ok:false,status:404,redirected:false})));
  await act(async()=>host.querySelector<HTMLButtonElement>('.ql350-actions button')!.click());
  expect(host.textContent).toContain('No authenticated private bridge');
  expect(host.textContent).toContain('DISCONNECTED / HOLD');
});

it('private readback without original signed receipt cannot issue a TEST',async()=>{
  const fetcher=vi.fn(async()=>({ok:true,status:200,redirected:false,url:'',
    json:async()=>status(false)}));
  vi.stubGlobal('fetch',fetcher);
  await act(async()=>host.querySelector<HTMLButtonElement>('.ql350-actions button')!.click());
  expect(host.textContent).toContain('Independent owner enrollment HOLD');
  expect([...host.querySelectorAll<HTMLButtonElement>('.ql350-peer-grid button')]
    .every(b=>b.disabled)).toBe(true);
  expect(fetcher).toHaveBeenCalledTimes(1);
});

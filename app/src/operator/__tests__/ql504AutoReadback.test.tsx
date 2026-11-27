// @vitest-environment jsdom
import {act} from 'react';
import {createRoot,type Root} from 'react-dom/client';
import {afterEach,beforeEach,expect,it,vi} from 'vitest';
const mocks=vi.hoisted(()=>{
 let authChanged:(()=>void)|null=null;
 const client={
  auth:{onAuthStateChange:vi.fn((cb:()=>void)=>{
   authChanged=cb;
   return {data:{subscription:{unsubscribe:vi.fn()}}};
  })}
 };
 const read=vi.fn(async()=>({
  state:'TENANT_GRANT_MISSING',reason:'No source-approved tenant membership.',
  sourceApp:'icamp',tenantDigest:null,accessRole:null,
  messages:[],events:[],allowedTenants:0,
  isLiveProviderConnected:false,customerAcknowledged:false,
  canSend:false,serverWrites:false
 }));
 return {client,read,triggerAuth:()=>authChanged?.()};
});
vi.mock('../../supabase/client',()=>({getSupabaseClient:()=>mocks.client}));
vi.mock('../../supabase/ql367OwnerClient',()=>({getOwnerAuthClient:()=>null}));
vi.mock('../ql503DeliveryRead',()=>({
 ql503ReadOwnTenantHistory:mocks.read,ql503DescribeMessage:vi.fn()
}));
import {Ql503DurableDeliveryHistory} from '../Ql503DurableDeliveryHistory';
let host:HTMLDivElement,root:Root;
beforeEach(()=>{
 Object.assign(globalThis,{IS_REACT_ACT_ENVIRONMENT:true});
 host=document.createElement('div');document.body.append(host);
 root=createRoot(host);mocks.read.mockClear();
});
afterEach(async()=>{
 await act(async()=>root.unmount());
 host.remove();vi.useRealTimers();vi.restoreAllMocks();
});
it('QL504 Comms operator reloads RLS-scoped readback automatically on auth-state change and visible tab',async()=>{
 await act(async()=>root.render(<Ql503DurableDeliveryHistory organizationId="icamp"/>));
 expect(mocks.read).toHaveBeenCalledTimes(1);
 await act(async()=>{mocks.triggerAuth();await Promise.resolve()});
 expect(mocks.read.mock.calls.length).toBeGreaterThanOrEqual(2);
 const before=mocks.read.mock.calls.length;
 await act(async()=>{
  document.dispatchEvent(new Event('visibilitychange'));
  await Promise.resolve();
 });
 expect(mocks.read.mock.calls.length).toBeGreaterThan(before);
 expect(host.textContent).toContain('TENANT GRANT MISSING');
 expect(host.querySelector('.ql503-history')?.getAttribute('data-ql503-public-sends')).toBe('false');
 expect(host.querySelector('button')).toBeNull();
});
it('QL504 ordinary UI has no manual refresh button and does not claim delivery for empty scoped membership',async()=>{
 await act(async()=>root.render(<Ql503DurableDeliveryHistory organizationId="icamp"/>));
 expect(host.textContent).toContain('No synthetic receipt is substituted');
 expect(host.textContent).toContain('not proof a human read it');
 expect(host.querySelector('button')).toBeNull();
});

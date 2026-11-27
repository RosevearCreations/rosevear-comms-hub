// @vitest-environment jsdom
import {act} from 'react';
import {createRoot,type Root} from 'react-dom/client';
import {readFileSync} from 'node:fs';
import {afterEach,beforeEach,describe,it,expect,vi} from 'vitest';
vi.mock('../../supabase/client',()=>({getSupabaseClient:()=>null}));
vi.mock('../../supabase/ql367OwnerClient',()=>({getOwnerAuthClient:()=>null}));
import {ql505ReadOwnExceptions} from '../ql505ExceptionRead';
import {Ql505OperatorExceptionPanel} from '../Ql505OperatorExceptionPanel';
import {Ql192UnifiedInbox} from '../Ql192UnifiedInbox';
import {operatorOrganizations} from '../ql191Organizations';

const dig=c=>c.repeat(64);
const incident={source_app:'icamp',tenant_digest:dig('a'),
 exception_id:dig('b'),job_digest:dig('c'),reason_code:'PRIVATE_RPC_UNAVAILABLE',
 status:'HOLD',recorded_at:'2026-11-27T18:02:00Z'};
function fakeClient({user=true,granted=true,grantError=false,replyError=false,
 rows=[incident]}={}){
 const queries:string[]=[];
 const client={
  auth:{getUser:vi.fn(async()=>({
   data:{user:user?{id:'test_owner_uuid',is_anonymous:false}:null},
   error:null
  }))},
  from:vi.fn((name:string)=>{
   queries.push(name);
   const chain={
    select:vi.fn(()=>chain),
    eq:vi.fn(()=>chain),gt:vi.fn(()=>chain),
    order:vi.fn(()=>chain),
    limit:vi.fn(async()=>{
     if(name==='ql503_tenant_read_grants')return {
      data:granted?[{source_app:'icamp',tenant_digest:dig('a'),
       user_id:'test_owner_uuid',access_role:'operator',active:true,
       expires_at:'2099-01-01T00:00:00Z'}]:[],
      error:grantError?{code:'denied'}:null
     };
     return {data:rows,error:replyError?{code:'unavailable'}:null};
    })
   };
   return chain;
  })
 };
 return {...client,queries};
}
describe('QL505 RLS-scoped Comms exception history',()=>{
 it('requires a real signed-in user and an active, exact source-app tenant membership',async()=>{
  expect((await ql505ReadOwnExceptions(null,'icamp')).state).toBe('CONFIG_DISABLED');
  const guest=fakeClient({user:false});
  expect((await ql505ReadOwnExceptions(guest,'icamp')).state).toBe('AUTH_REQUIRED');
  expect(guest.from).not.toHaveBeenCalled();
  const blocked=fakeClient({granted:false});
  expect((await ql505ReadOwnExceptions(blocked,'icamp')).state).toBe('TENANT_GRANT_MISSING');
  expect(blocked.queries).toEqual(['ql503_tenant_read_grants']);
 });
 it('reads only tenant-matched HOLD rows and preserves zero customer sends',async()=>{
  const scoped=fakeClient({rows:[incident,{...incident,tenant_digest:dig('f')},
   {...incident,source_app:'yw'},{...incident,reason_code:'UNKNOWN'}]});
  const view=await ql505ReadOwnExceptions(scoped,'icamp');
  expect(view.state).toBe('READY');
  expect(view.exceptions).toHaveLength(1);
  expect(view.sent).toBe(false);
  expect(view.customerDeliveryVerified).toBe(false);
  expect(scoped.queries).toEqual(['ql503_tenant_read_grants','ql505_receipt_exceptions']);
 });
 it('fails closed on grant or receipt query failures and never falls back to mock customer records',async()=>{
  expect((await ql505ReadOwnExceptions(fakeClient({grantError:true}),'icamp')).state).toBe('HOLD');
  const receipt=fakeClient({replyError:true});
  const x=await ql505ReadOwnExceptions(receipt,'icamp');
  expect(x.state).toBe('HOLD');
  expect(x.exceptions).toHaveLength(0);
 });
});
let host:HTMLDivElement,root:Root;
beforeEach(()=>{
 Object.assign(globalThis,{IS_REACT_ACT_ENVIRONMENT:true});
 host=document.createElement('div');document.body.append(host);
 root=createRoot(host);
});
afterEach(async()=>{await act(async()=>root.unmount());host.remove();vi.restoreAllMocks()});
describe('QL505 original operator inbox integration and no-send accessibility',()=>{
 it('renders private exception panel adjacent to existing QL503 real readback and QL502 preview',async()=>{
  const fetchSpy=vi.spyOn(globalThis,'fetch');
  await act(async()=>root.render(<Ql192UnifiedInbox organization={operatorOrganizations[2]}/>));
  await act(async()=>Promise.resolve());
  const panel=host.querySelector<HTMLElement>('.ql505-exceptions');
  expect(panel).not.toBeNull();
  expect(panel?.dataset.ql505Sends).toBe('false');
  expect(panel?.textContent).toContain('CONFIG DISABLED');
  expect(panel?.textContent).toContain('No invented provider receipt');
  expect(host.querySelector('.ql503-history')).not.toBeNull();
  expect(host.querySelector('.ql502-panel')).not.toBeNull();
  expect(panel?.querySelector('button')).toBeNull();
  expect(fetchSpy).not.toHaveBeenCalled();
 });
 it('brand switch does not authorize a different tenant and styles support mobile / forced colors',async()=>{
  await act(async()=>root.render(<Ql505OperatorExceptionPanel organizationId="yw"/>));
  expect(host.querySelector('.ql505-exceptions')?.getAttribute('data-ql505-source')).toBe('yw');
  const css=readFileSync('src/operator/ql505-exceptions.css','utf8');
  expect(css).toContain('@media(max-width:375px)');
  expect(css).toContain('@media(forced-colors:active)');
  expect(css).toContain('@media(prefers-reduced-motion:reduce)');
 });
});

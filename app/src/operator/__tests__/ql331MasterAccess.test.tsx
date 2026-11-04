// @vitest-environment jsdom
import {act} from 'react';
import {createRoot,type Root} from 'react-dom/client';
import {readFileSync} from 'node:fs';
import {afterEach,beforeEach,describe,expect,it,vi} from 'vitest';
import {OperatorShell} from '../OperatorShell';
import {
 QL331_PUBLIC_SOURCES,QL331_BOOTSTRAP_GATES,QL331_SNAPSHOT,
 ql331Readiness,ql331PreviewScope,ql331VerifyMasterAccess,
 type Ql331MasterReadGateway
} from '../ql331MasterAccess';

const id='00000000-0000-4000-8000-000000000001';
const authorizedUser={id,email_confirmed_at:'2026-11-03T22:00:00Z'};
type GatewayInput={user?:{id:string;email_confirmed_at?:string|null}|null;authError?:boolean;
 principal?:unknown;grants?:unknown[];shells?:unknown[];children?:unknown[];failTable?:string};
function gateway(input:GatewayInput){
 const calls:string[]=[];
 const client:Ql331MasterReadGateway={
  auth:{getUser:async()=>{calls.push('auth.getUser');return {
    data:{user:input.user===undefined?authorizedUser:input.user},
    error:input.authError?{message:'not verified'}:null
  };}},
  from:(table:string)=>{
   calls.push(table);
   const record=table==='master_principals'?input.principal:
     table==='master_shell_grants'?input.grants:
     table==='master_shell_registry'?input.shells:input.children;
   const reply={data:record??null,error:table===input.failTable?{message:'RLS denied'}:null};
   return {
    select:()=>({
      eq:()=>({maybeSingle:async()=>reply}),
      order:async()=>reply
    })
   };
  }
 };
 return {client,calls};
}
describe('QL-331 authoritative master identity and source scope',()=>{
 it('reconciles exactly six source shell/support rows and no enrolled owner or side effects',()=>{
  expect(ql331Readiness()).toMatchObject({sourceCount:6,businessShells:4,supports:2,
    uniqueIds:6,allHeld:true,masterAuthUsersAtPreflight:0,
    ownerEnrolled:false,externalPeerConnections:0,childTenantGrants:0});
  expect(QL331_SNAPSHOT).toMatchObject({masterPrincipalsAtPreflight:0,
    sourceConnections:0,externalSourceRequests:0,externalWrites:0,masterTenantReadGrants:0,
    windowsRelay:'OFF',ack:'UNDER_REVIEW / PARKED_FOR_LATER'});
  expect(QL331_BOOTSTRAP_GATES).toHaveLength(6);
  expect(new Set(QL331_PUBLIC_SOURCES.map(s=>s.id))).toEqual(
    new Set(['yw','icamp','rosiedazzlers','devilndove','ai-data-platform','rosevear-ai-hub']));
  expect(QL331_PUBLIC_SOURCES.find(s=>s.id==='yw')?.sourceAppId).toBe('yard-workers');
 });
 it('does not invoke Auth, database or source networks when optional client is disabled',async()=>{
  const response=await ql331VerifyMasterAccess(null);
  expect(response).toMatchObject({state:'CLIENT_DISABLED',verifiedAuth:false,role:null,
    readableShells:[],childReadCount:0,sourceGets:0,sourceWrites:0,peerConnections:0});
 });
 it('requires a true verified Auth user before any RLS table read',async()=>{
  for(const scenario of [
    {user:null},{user:{id}}, {user:{id:'wrong',email_confirmed_at:'verified'}},
    {authError:true}
  ]){
   const {client,calls}=gateway(scenario);
   const response=await ql331VerifyMasterAccess(client);
   expect(response.state).toBe('AUTH_NOT_VERIFIED');
   expect(calls).toEqual(['auth.getUser']);
  }
 });
 it('denies an authenticated but unenrolled user; a pre-existing email allowlist cannot self-authorize',async()=>{
  for(const principal of [null,{user_id:id,master_role:'owner',active:false},
    {user_id:'00000000-0000-4000-8000-000000000002',master_role:'owner',active:true},
    {user_id:id,master_role:'super-admin',active:true}]){
   const {client,calls}=gateway({principal});
   const outcome=await ql331VerifyMasterAccess(client);
   expect(outcome).toMatchObject({state:'NOT_ENROLLED',verifiedAuth:true,
    masterUserEnrolled:false,peerConnections:0});
   expect(calls).toEqual(['auth.getUser','master_principals']);
  }
 });
 it('reads only RLS-returned source metadata/grants and never promotes source connectivity',async()=>{
  const {client,calls}=gateway({
   principal:{user_id:id,master_role:'owner',active:true},
   shells:[
    {shell_id:'yw',shell_kind:'business',connection_status:'DISCONNECTED / HOLD'},
    {shell_id:'icamp',shell_kind:'business',connection_status:'DISCONNECTED / HOLD'},
    {shell_id:'not-registered',connection_status:'DISCONNECTED / HOLD'},
    {shell_id:'rosiedazzlers',connection_status:'CONNECTED'}
   ],
   grants:[{shell_id:'yw',child_tenant_id:'child-demo',grant_scope:'child_read',state:'ACTIVE'},
    {shell_id:'icamp',child_tenant_id:null,grant_scope:'shell_read',state:'ACTIVE'},
    {shell_id:'unknown',child_tenant_id:null,grant_scope:'shell_read',state:'ACTIVE'}],
   children:[{shell_id:'yw',child_tenant_id:'child-demo'},
    {shell_id:'icamp',child_tenant_id:'another-child'}]
  });
  const outcome=await ql331VerifyMasterAccess(client);
  expect(outcome).toMatchObject({state:'VERIFIED_METADATA_READ',role:'owner',
   masterUserEnrolled:true,verifiedAuth:true,readableShells:['yw','icamp'],
   activeGrantCount:2,childReadCount:1,sourceGets:0,sourceWrites:0,peerConnections:0});
  expect(calls).toEqual(['auth.getUser','master_principals','master_shell_grants',
    'master_shell_registry','master_child_tenants']);
 });
 it('returns closed database errors instead of falling back to broad roles or customer data',async()=>{
  for(const failTable of ['master_principals','master_shell_grants','master_shell_registry','master_child_tenants']){
   const {client}=gateway({principal:{user_id:id,master_role:'owner',active:true},failTable});
   const outcome=await ql331VerifyMasterAccess(client);
   expect(outcome).toMatchObject({state:'DATABASE_ERROR',peerConnections:0,sourceWrites:0,childReadCount:0});
  }
 });
 it.each(['yw','icamp','rosiedazzlers','devilndove'])('enforces a separate source child grant for %s',shellId=>{
  expect(ql331PreviewScope(shellId,'shell_metadata')).toMatchObject({decision:'AUTHENTICATED_GRANT_REQUIRED',
    liveAuthorized:false,accesses:0});
  expect(ql331PreviewScope(shellId,'child_records')).toMatchObject({decision:'CHILD_GRANT_REQUIRED',
    liveAuthorized:false,accesses:0});
 });
 it('never classifies supporting services or unknown sources as a customer tenant',()=>{
  for(const shellId of ['ai-data-platform','rosevear-ai-hub','fake-source']){
   expect(ql331PreviewScope(shellId,'child_records').decision).toBe('DENY_SUPPORT_CHILD');
  }
  expect(ql331PreviewScope('yw','support_as_child').decision).toBe('DENY_SUPPORT_CHILD');
 });
 it('ships real schema-level auth.uid RLS, with no client-side write policies or fabricated seed user',()=>{
  const sql=readFileSync('../database/migrations/0008_ql331_master_shell_rls.sql','utf8');
  for(const name of ['master_principals','master_shell_registry','master_child_tenants',
   'master_shell_grants','master_security_audit']){
    expect(sql).toContain('ALTER TABLE public.'+name+' ENABLE ROW LEVEL SECURITY');
    expect(sql).toContain('ALTER TABLE public.'+name+' FORCE ROW LEVEL SECURITY');
  }
  expect(sql).toContain('auth.uid()');
  expect(sql).toContain('TO authenticated');
  expect(sql).toContain('GRANT SELECT');
  expect(sql).toContain('FROM PUBLIC, anon, authenticated');
  expect(sql).toContain('ON DELETE RESTRICT');
  expect(sql).toContain("shell_kind = 'business'");
  expect(sql).not.toMatch(/CREATE POLICY[^;]+FOR (ALL|INSERT|UPDATE|DELETE)/i);
  expect(sql.replace(/--[^\n]*/g,'')).not.toMatch(/SECURITY DEFINER/i);
  expect(sql).not.toMatch(/INSERT INTO public\.master_principals/i);
  expect(sql).not.toMatch(/INSERT INTO public\.master_shell_grants/i);
  expect(sql).not.toMatch(/FROM auth\.users u.+email/);
 });
});
let root:Root,host:HTMLDivElement;
beforeEach(async()=>{Object.assign(globalThis,{IS_REACT_ACT_ENVIRONMENT:true});
 window.localStorage.clear();host=document.createElement('div');document.body.append(host);
 root=createRoot(host);await act(async()=>root.render(<OperatorShell/>));});
afterEach(async()=>{await act(async()=>root.unmount());host.remove();});
describe('QL-331 accessible master-control UI across command workspaces',()=>{
 async function open(label:string){
  const nav=[...host.querySelectorAll<HTMLButtonElement>('.ql172-nav-button')].find(b=>b.textContent?.includes(label))!;
  expect(nav).toBeTruthy();await act(async()=>nav.click());return host.querySelector<HTMLElement>('.ql331')!;
 }
 async function choose(selector:string,value:string){
  const element=host.querySelector<HTMLSelectElement>(selector)!;
  const setter=Object.getOwnPropertyDescriptor(window.HTMLSelectElement.prototype,'value')!.set!;
  await act(async()=>{setter.call(element,value);element.dispatchEvent(new Event('change',{bubbles:true}));});
 }
 it('shows real-auth requirements and all six rows with explicit tenant restrictions',async()=>{
  const screen=await open('IT Command');
  expect(screen.getAttribute('data-ql331-release')).toBe('real-rls-guarded-master-registry-v1');
  expect(screen.querySelectorAll('.ql331-scroll tbody tr')).toHaveLength(6);
  expect(screen.textContent).toContain('Authenticated master foundation');
  expect(screen.textContent).toContain('0 / 6 CONNECTED');
  expect(screen.textContent).toContain('Registered Auth users at preflight');
  expect(screen.textContent).toContain('Yard Workers');
  expect(screen.textContent).toContain('child');
 });
 it('explicit master verification does not contact a disabled optional client or touch storage',async()=>{
  const spy=vi.spyOn(globalThis,'fetch');
  try{
   const screen=await open('IT Command');
   await act(async()=>screen.querySelectorAll<HTMLButtonElement>('.ql331-actions button')[0].click());
   expect(screen.querySelector('.ql331-readback')?.textContent).toContain('CLIENT_DISABLED');
   await act(async()=>screen.querySelectorAll<HTMLButtonElement>('.ql331-actions button')[1].click());
   expect(screen.querySelector('.ql331-readback')?.textContent).toContain('NOT CHECKED');
   expect(spy).not.toHaveBeenCalled();
   expect(window.localStorage.length).toBe(0);
  }finally{spy.mockRestore();}
 });
 it('locally previews business/child/support boundaries and keeps all connection holds',async()=>{
  const screen=await open('IT Command');
  await choose('#ql331-shell','icamp');await choose('#ql331-scope','child_records');
  expect(screen.querySelector('.ql331-decision')?.textContent).toContain('CHILD_GRANT_REQUIRED');
  await choose('#ql331-shell','ai-data-platform');
  expect(screen.querySelector('.ql331-decision')?.textContent).toContain('DENY_SUPPORT_CHILD');
  const button=screen.querySelector<HTMLButtonElement>('.ql331-expand')!;
  await act(async()=>button.click());
  expect(screen.querySelectorAll('#ql331-gates li')).toHaveLength(6);
  await act(async()=>button.click());expect(screen.querySelector('#ql331-gates')).toBeNull();
 });
 it('renders master status in Management and System Status without claiming authenticated ownership',async()=>{
  for(const label of ['Management','System status']){
   const screen=await open(label);
   expect(screen.textContent).toContain('NOT CHECKED');
   expect(screen.textContent).toContain('0 / 6 CONNECTED');
  }
 });
 it('uses responsive keyboard/touch styles and does not introduce secret/browser write code',()=>{
  const css=readFileSync('src/operator/ql331-master-control.css','utf8');
  const ui=readFileSync('src/operator/Ql331MasterControl.tsx','utf8');
  const model=readFileSync('src/operator/ql331MasterAccess.ts','utf8');
  for(const text of ['min-height:44px',':focus-visible','overflow:auto','max-width:1100px',
   'max-width:680px','forced-colors:active','prefers-reduced-motion:reduce'])expect(css).toContain(text);
  for(const text of ['aria-labelledby','aria-live','role="note"','aria-expanded','scope="row"'])
   expect(ui).toContain(text);
  expect(model).toContain('.auth.getUser()');
  expect(model).not.toContain('.auth.getSession()');
  expect(model+ui).not.toMatch(/\b(fetch|XMLHttpRequest|localStorage|sessionStorage)\s*\(/);
  expect(model+ui).not.toContain('service_role');
  expect(model+ui).not.toMatch(/\.(raw_)?user_metadata\b/);
 });
});

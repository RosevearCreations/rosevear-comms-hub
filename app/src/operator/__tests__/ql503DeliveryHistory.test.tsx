// @vitest-environment jsdom
import {act} from 'react';
import {createRoot,type Root} from 'react-dom/client';
import {afterEach,beforeEach,describe,it,expect,vi} from 'vitest';
import {Ql192UnifiedInbox} from '../Ql192UnifiedInbox';
import {operatorOrganizations} from '../ql191Organizations';
import {ql503ReadOwnTenantHistory,ql503DescribeMessage,type Ql503DeliveryEvent}
 from '../ql503DeliveryRead';

const hex=(x:string)=>x.repeat(64);
const tenant=hex('a'),foreign=hex('f'),thread=hex('b');
const saved={source_app:'icamp',tenant_digest:tenant,thread_digest:thread,
 message_key:'gate_ql503_test_01',message_version:1,content_digest:hex('c'),
 source_packet_digest:hex('d'),issued_at:'2026-11-27T12:00:00Z',
 recorded_at:'2026-11-27T12:01:00Z'};
const v2={...saved,message_version:2,content_digest:hex('e')};
const event=(kind:'PROVIDER_ACCEPTED'|'PROVIDER_DELIVERED'|'INBOUND_REPLY',version=1):Ql503DeliveryEvent=>({
 source_app:'icamp',tenant_digest:tenant,thread_digest:thread,
 message_key:saved.message_key,message_version:version,
 event_id:kind+'_ql503_event',evidence_kind:kind,
 evidence_packet_digest:hex('f'),
 provider_receipt_id:kind==='INBOUND_REPLY'?null:'provider_ql503_001',
 signed_by:kind==='INBOUND_REPLY'?'ORIGINAL_SOURCE':'INDEPENDENT_PROVIDER',
 reply_current_version:kind==='INBOUND_REPLY'?2:null,
 occurred_at:'2026-11-27T12:02:00Z',recorded_at:'2026-11-27T12:02:30Z'
});
function client({user=true,anonymous=false,grants=true,errorTable='',items=[saved,v2],events=[]}:
 {user?:boolean;anonymous?:boolean;grants?:boolean;errorTable?:string;
 items?:Array<typeof saved>;events?:ReturnType<typeof event>[]}={}){
 const seen:string[]=[];
 const base={auth:{getUser:vi.fn(async()=>({data:{user:user?
  {id:'auth_test_user',is_anonymous:anonymous}:null},error:null}))},
 from:vi.fn((name:string)=>{
  seen.push(name);
  const builder={
   select:vi.fn(()=>builder),eq:vi.fn(()=>builder),
   gt:vi.fn(()=>builder),order:vi.fn(()=>builder),
   limit:vi.fn(async()=>{
    if(name===errorTable)return {data:null,error:{message:'redacted'}};
    if(name==='ql503_tenant_read_grants')return {data:grants?
     [{source_app:'icamp',tenant_digest:tenant,access_role:'operator',
       expires_at:'2099-01-01T00:00:00Z'}]:[],error:null};
    if(name==='ql503_delivery_messages')return {data:items,error:null};
    return {data:events,error:null};
   })
  };return builder;
 })};
 return {...base,seen};
}
describe('QL503 authenticated persisted tenant read contract',()=>{
 it('cannot read anonymously or from a disabled deployment',async()=>{
  const absent=await ql503ReadOwnTenantHistory(null,'icamp');
  expect(absent.state).toBe('CONFIG_DISABLED');
  const guest=client({user:false});
  expect((await ql503ReadOwnTenantHistory(guest,'icamp')).state).toBe('AUTH_REQUIRED');
  expect(guest.from).not.toHaveBeenCalled();
  const anonymous=client({anonymous:true});
  expect((await ql503ReadOwnTenantHistory(anonymous,'icamp')).state).toBe('AUTH_REQUIRED');
  expect(anonymous.from).not.toHaveBeenCalled();
 });
 it('never retrieves messages without a verified exact-tenant source membership',async()=>{
  const g=client({grants:false});
  const state=await ql503ReadOwnTenantHistory(g,'icamp');
  expect(state.state).toBe('TENANT_GRANT_MISSING');
  expect(g.seen).toEqual(['ql503_tenant_read_grants']);
  expect(state.messages).toEqual([]);
  expect(state.canSend).toBe(false);
 });
 it('reads only the authorized source and tenant, removes foreign response rows and no customer PII',async()=>{
  const f=client({items:[saved,v2,{...saved,tenant_digest:foreign}]});
  const s=await ql503ReadOwnTenantHistory(f,'icamp');
  expect(s.state).toBe('READY');
  expect(s.messages).toHaveLength(2);
  expect(s.messages.every(x=>x.tenant_digest===tenant)).toBe(true);
  expect(s.allowedTenants).toBe(1);
  expect(s.isLiveProviderConnected).toBe(false);
  expect(s.serverWrites).toBe(false);
  expect(f.seen).toEqual(['ql503_tenant_read_grants',
   'ql503_delivery_messages','ql503_delivery_evidence']);
 });
 it('separates saved, accepted, delivered claim and superseded version reply',()=>{
  const a=ql503DescribeMessage(saved,[saved,v2],[]);
  expect(a.superseded).toBe(true);
  expect(a.providerDeliveredClaim).toBe(false);
  const accepted=ql503DescribeMessage(saved,[saved,v2],[event('PROVIDER_ACCEPTED')]);
  expect(accepted.providerAccepted).toBe(true);
  expect(accepted.providerDeliveredClaim).toBe(false);
  const delivered=ql503DescribeMessage(saved,[saved,v2],
   [event('PROVIDER_ACCEPTED'),event('PROVIDER_DELIVERED'),event('INBOUND_REPLY')]);
  expect(delivered.providerDeliveredClaim).toBe(true);
  expect(delivered.replyNeedsReview).toBe(true);
  expect(delivered.currentVersion).toBe(2);
  expect(delivered.humanAcknowledged).toBe(false);
  expect(delivered.canSend).toBe(false);
 });
 it('fails closed on database errors, never imports demo data after a failed read',async()=>{
  const broken=client({errorTable:'ql503_delivery_messages'});
  const s=await ql503ReadOwnTenantHistory(broken,'icamp');
  expect(s.state).toBe('ERROR');
  expect(s.messages).toHaveLength(0);
 });
});
let host:HTMLDivElement,root:Root;
beforeEach(async()=>{
 Object.assign(globalThis,{IS_REACT_ACT_ENVIRONMENT:true});
 host=document.createElement('div');document.body.append(host);
 root=createRoot(host);
});
afterEach(async()=>{
 await act(async()=>root.unmount());host.remove();vi.restoreAllMocks();
});
describe('QL503 existing operator inbox UI integration',()=>{
 it('keeps the durable read in the existing inbox, network inert and distinct from QL502 synthetic rehearsal',async()=>{
  const f=vi.spyOn(globalThis,'fetch');
  await act(async()=>root.render(<Ql192UnifiedInbox organization={operatorOrganizations[2]}/>));
  await act(async()=>Promise.resolve());
  const panel=host.querySelector<HTMLElement>('.ql503-history');
  expect(panel).not.toBeNull();
  expect(panel?.getAttribute('data-ql503-public-sends')).toBe('false');
  expect(panel?.textContent).toContain('Actual signed records');
  expect(panel?.textContent).toContain('No synthetic receipt is substituted');
  expect(host.querySelector('.ql502-panel')).not.toBeNull();
  expect(panel?.querySelector('button')).toBeNull();
  expect(f).not.toHaveBeenCalled();
 });
 it('renders for Rosie but does not grant Camp Rosevear access from a dropdown',async()=>{
  await act(async()=>root.render(<Ql192UnifiedInbox organization={operatorOrganizations[0]}/>));
  await act(async()=>Promise.resolve());
  const panel=host.querySelector<HTMLElement>('.ql503-history');
  expect(panel?.getAttribute('data-organization')).toBe('rosiedazzlers');
  expect(host.querySelector('.ql502-panel')).toBeNull();
 });
});

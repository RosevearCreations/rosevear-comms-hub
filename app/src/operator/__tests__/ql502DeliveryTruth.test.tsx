// @vitest-environment jsdom
import {act} from 'react';
import {createRoot,type Root} from 'react-dom/client';
import {readFileSync} from 'node:fs';
import {afterEach,beforeEach,describe,it,expect,vi} from 'vitest';
import {Ql192UnifiedInbox} from '../Ql192UnifiedInbox';
import {operatorOrganizations} from '../ql191Organizations';
import {ql502ReviewScenario,ql502CheckRetrySnapshot} from '../ql502DeliveredVersionReview';

let root:Root,host:HTMLDivElement;
beforeEach(async()=>{
 Object.assign(globalThis,{IS_REACT_ACT_ENVIRONMENT:true});
 host=document.createElement('div');document.body.append(host);
 root=createRoot(host);
 await act(async()=>root.render(<Ql192UnifiedInbox organization={operatorOrganizations[2]}/>));
});
afterEach(async()=>{await act(async()=>root.unmount());host.remove();vi.restoreAllMocks()});
describe('QL-502 Source of Truth iCamp gate change / outdated reply',()=>{
 it('mounts inside the real existing inbox as a prominently disabled delivery-truth rehearsal',()=>{
  const p=host.querySelector<HTMLElement>('.ql502-panel')!;
  expect(p).not.toBeNull();
  expect(p.dataset.ql502Live).toBe('false');
  expect(p.textContent).toContain('DEMONSTRATION ONLY');
  expect(p.textContent).toContain('Step 5: Guest replies to old instructions');
  expect(p.textContent).toContain('Camp Rosevear');
  expect(p.textContent).toContain('Current example: instructions v2');
  expect(p.textContent).toContain('Older-version reply needs staff review');
  expect(p.textContent).toContain('Saved ≠ provider accepted ≠ delivered ≠ human acknowledged.');
  expect(p.querySelector<HTMLButtonElement>('button')?.disabled).toBe(true);
  expect(p.querySelectorAll('li')).toHaveLength(5);
 });
 it('changes between opt-out, version-changed and provider outage with no network, sender or persistence',async()=>{
  const spy=vi.spyOn(globalThis,'fetch');
  const save=vi.spyOn(Storage.prototype,'setItem');
  const select=host.querySelector<HTMLSelectElement>('#ql502-scenario')!;
  for(const [caseName,expectedState] of [
   ['opted_out','SEND_HELD'],['provider_outage','UNVERIFIED'],
   ['version_changed','SUPERSEDED']
  ]){
   await act(async()=>{select.value=caseName;select.dispatchEvent(new Event('change',{bubbles:true}))});
   expect(host.querySelector<HTMLElement>('.ql502-panel [data-ql502-state="'+expectedState+'"]'))
     .not.toBeNull();
  }
  expect(spy).not.toHaveBeenCalled();
  expect(save).not.toHaveBeenCalled();
 });
 it('denies previewing Camp Rosevear evidence when a different organization is selected',async()=>{
  expect(ql502ReviewScenario('yw','outdated_reply').state).toBe('ACCESS_DENIED');
  await act(async()=>root.render(<Ql192UnifiedInbox organization={operatorOrganizations[0]}/>));
  expect(host.querySelector('.ql502-panel')).toBeNull();
  expect(host.textContent).not.toContain('Guest replies to old instructions');
 });
 it('never labels accepted as delivered, or a test reply as human acknowledgment',()=>{
  for(const sc of ['saved_only','version_changed','outdated_reply','opted_out','provider_outage'] as const){
   const x=ql502ReviewScenario('icamp',sc);
   expect(x.state).toBe('PREVIEW_ONLY');
   expect(x.canSend).toBe(false);
   expect(x.liveProviderDeliveryVerified).toBe(false);
   expect(x.humanAcknowledgementVerified).toBe(false);
   expect(x.customerWrites).toBe(false);
   expect(x.networkRequests).toBe(0);
  }
  const pending=ql502ReviewScenario('icamp','version_changed');
  expect(pending.steps.find(s=>s.id==='v1-demo-accepted')?.state)
   .toBe('PROVIDER_ACCEPTED_NOT_DELIVERED');
 });
 it('rechecks version, consent, cancellations, filled capacity, provider health, dispute and expiry before retry',()=>{
  const base={organizationId:'icamp' as const,tenantId:'camp_rosevear',
    expectedTenantId:'camp_rosevear',requestedVersion:2,currentVersion:2,
    consent:'service_allowed' as const,purpose:'service' as const,
    cancelled:false,slotFilled:false,disputedLine:false,providerHealthy:true,
    authorizedOperator:true,expiresAtMs:2000,nowMs:1000};
  const preview=ql502CheckRetrySnapshot(base);
  expect(preview.state).toBe('PRECHECK_ONLY');
  expect(preview.canSend).toBe(false);
  for(const mod of [
   {tenantId:'second_tenant'},{requestedVersion:1},{consent:'opted_out' as const},
   {consent:'unknown' as const},{cancelled:true},{slotFilled:true},
   {disputedLine:true},{providerHealthy:false},{expiresAtMs:999},
   {authorizedOperator:false}
  ])expect(ql502CheckRetrySnapshot({...base,...mod}).state).toBe('HOLD');
 });
 it('supports touch/mobile, reduced motion and forced-colors accessibility states',()=>{
  const css=readFileSync('src/operator/ql502-delivery-truth.css','utf8');
  expect(css).toContain('@media(max-width:620px)');
  expect(css).toContain('@media(max-width:375px)');
  expect(css).toContain('@media(forced-colors:active)');
  expect(css).toContain('@media(prefers-reduced-motion:reduce)');
  expect(host.querySelector('[aria-label="Synthetic versioned message evidence"]')).not.toBeNull();
 });
});

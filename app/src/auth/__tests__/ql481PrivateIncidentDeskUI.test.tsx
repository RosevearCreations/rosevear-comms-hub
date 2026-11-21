// @vitest-environment jsdom
import {act} from 'react';
import {createRoot,type Root} from 'react-dom/client';
import {afterEach,beforeEach,describe,it,expect,vi} from 'vitest';
import {Ql481PrivateIncidentDesk} from '../Ql481PrivateIncidentDesk';
let host:HTMLDivElement,root:Root;
beforeEach(()=>{
 Object.assign(globalThis,{IS_REACT_ACT_ENVIRONMENT:true});
 host=document.createElement('div');document.body.append(host);root=createRoot(host);
});
afterEach(async()=>{await act(async()=>root.unmount());host.remove();vi.restoreAllMocks()});
const show=async(unlocked:boolean)=>act(async()=>root.render(<Ql481PrivateIncidentDesk unlocked={unlocked}/>));
describe('QL-481 private owner desk rejects untrusted authority and restricts local inspection',()=>{
 it('has a locked state without an enrolled AAL2 owner session',async()=>{
  await show(false);
  expect(host.textContent).toContain('Private handover inspection is locked');
  expect(host.querySelectorAll('input[type="file"]')).toHaveLength(0);
  expect(host.querySelector('a[href^="http"]')).toBeNull();
 });
 it('shows scoped controls and no source connectivity or customer write buttons',async()=>{
  await show(true);
  expect(host.querySelector('#ql481-app')).toBeTruthy();
  expect(host.querySelectorAll('input[type="file"]')).toHaveLength(1);
  expect(host.textContent).toContain('No authorized production case feed');
  expect(host.textContent).toContain('No live cases verified');
  expect(host.querySelectorAll('textarea,form')).toHaveLength(0);
  const source=host.querySelector<HTMLSelectElement>('#ql481-app')!;
  await act(async()=>{
   source.value='icamp';source.dispatchEvent(new Event('change',{bubbles:true}));
  });
  expect(host.textContent).toContain('iCamp');
  expect(host.textContent).toContain('Local selection cleared');
  const button=[...host.querySelectorAll('button')].find(x=>x.textContent?.includes('Clear this local review'));
  await act(async()=>button!.click());
  expect(host.textContent).toContain('No data was saved or uploaded');
 });
});

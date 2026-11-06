// @vitest-environment jsdom
import {act} from 'react';
import {createRoot,type Root} from 'react-dom/client';
import {afterEach,beforeEach,expect,it} from 'vitest';
import {Ql342OwnerGatePanel} from '../Ql342OwnerGatePanel';

let host:HTMLDivElement,root:Root;
beforeEach(async()=>{Object.assign(globalThis,{IS_REACT_ACT_ENVIRONMENT:true});
  host=document.createElement('div');document.body.append(host);root=createRoot(host);
  await act(async()=>root.render(<Ql342OwnerGatePanel/>));});
afterEach(async()=>{await act(async()=>root.unmount());host.remove();});
it('shows an offline-only inert drill command and a clear original owner HOLD boundary',()=>{
  const drill=host.querySelector('[data-ql342a="inert-drill-offline"]');
  expect(drill).not.toBeNull();
  expect(drill!.textContent).toContain('-RollbackDrill');
  expect(drill!.textContent).toContain('RUN_INERT_LOOPBACK_DRILL');
  expect(drill!.textContent).toContain('not');
  expect(drill!.textContent).toContain('port 8788');
  expect(drill!.textContent).toContain('HOLD');
  expect(drill!.querySelector('button')).toBeNull();
  expect(drill!.querySelector('input')).toBeNull();
});

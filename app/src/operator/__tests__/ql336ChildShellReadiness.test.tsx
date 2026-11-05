// @vitest-environment jsdom
import {act} from 'react';
import {createRoot,type Root} from 'react-dom/client';
import {afterEach,beforeEach,describe,expect,it,vi} from 'vitest';
import {Ql336ChildShellReadiness} from '../Ql336ChildShellReadiness';

let host:HTMLDivElement;let root:Root;
beforeEach(()=>{(globalThis as {IS_REACT_ACT_ENVIRONMENT?:boolean}).IS_REACT_ACT_ENVIRONMENT=true;
  host=document.createElement('div');document.body.append(host);root=createRoot(host);});
afterEach(()=>{act(()=>root.unmount());host.remove();});

describe('QL-336 owned child-shell readiness',()=>{
  it('shows two independent HOLD sources, legacy boundaries and safe linked source code',async()=>{
    const spy=vi.spyOn(globalThis,'fetch');
    try{
      await act(async()=>root.render(<Ql336ChildShellReadiness/>));
      expect(host.textContent).toContain('0 OF 2 AUTHENTICATED · HOLD');
      expect(host.textContent).toContain('Rosie Dazzlers');
      expect(host.textContent).toContain('FORCE RLS');
      expect(host.textContent).toContain('/api/integration/v1/shell/health');
      const buttons=host.querySelectorAll<HTMLButtonElement>('.ql335-source-switch button');
      expect(buttons).toHaveLength(2);
      await act(async()=>buttons[1].click());
      expect(buttons[1].getAttribute('aria-pressed')).toBe('true');
      expect(host.textContent).toContain('D1 per-query isolation');
      expect(host.textContent).toContain('Etsy');
      expect(host.querySelector('a[href*="devilndove-site/tree/main"]')).toBeTruthy();
      expect(spy).not.toHaveBeenCalled();
    }finally{spy.mockRestore();}
  });
});

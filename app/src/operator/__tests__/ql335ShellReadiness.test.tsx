// @vitest-environment jsdom
import {act} from 'react';
import {createRoot,type Root} from 'react-dom/client';
import {readFileSync} from 'node:fs';
import {afterEach,beforeEach,describe,expect,it,vi} from 'vitest';
import {Ql335ShellReadiness} from '../Ql335ShellReadiness';

let host:HTMLDivElement;let root:Root;
beforeEach(()=>{(globalThis as {IS_REACT_ACT_ENVIRONMENT?:boolean}).IS_REACT_ACT_ENVIRONMENT=true;
  host=document.createElement('div');document.body.append(host);root=createRoot(host);});
afterEach(()=>{act(()=>root.unmount());host.remove();});
const render=async()=>act(async()=>root.render(<Ql335ShellReadiness/>));

describe('QL-335 YW and iCamp platform-only signed TEST readiness',()=>{
  it('distinguishes YW platform from landscaping companies and iCamp from campgrounds',async()=>{
    await render();
    expect(host.textContent).toContain('0 OF 2 AUTHENTICATED · HOLD');
    expect(host.textContent).toContain('yw');
    expect(host.textContent).toContain('yard-workers');
    expect(host.textContent).toContain('landscaping companies');
    const toggles=host.querySelectorAll<HTMLButtonElement>('.ql335-source-switch button');
    expect(toggles).toHaveLength(2);
    await act(async()=>toggles[1].click());
    expect(toggles[1].getAttribute('aria-pressed')).toBe('true');
    expect(host.textContent).toContain('campgrounds remain separate tenants');
    expect(host.querySelector<HTMLAnchorElement>('a[href*="iCamp/tree/main/app/api/"]')).toBeTruthy();
  });
  it('shows exact GET endpoints and all original trust gaps without private network access',async()=>{
    const fetchSpy=vi.spyOn(globalThis,'fetch');
    try{
      await render();
      expect(host.textContent).toContain('/api/integration/v1/shell/health');
      expect(host.textContent).toContain('/api/integration/v1/shell/capabilities');
      expect(host.querySelectorAll('.ql335-gates li')).toHaveLength(4);
      expect(host.textContent).toContain('DISCONNECTED / HOLD');
      expect(fetchSpy).not.toHaveBeenCalled();
    }finally{fetchSpy.mockRestore();}
  });
  it('preserves keyboard focus and colour/animation accessibility',()=>{
    const css=readFileSync('src/operator/ql335-shell-readiness.css','utf8');
    expect(css).toContain('min-height:48px');
    expect(css).toContain(':focus-visible');
    expect(css).toContain('forced-colors:active');
    expect(css).toContain('prefers-reduced-motion:reduce');
  });
});

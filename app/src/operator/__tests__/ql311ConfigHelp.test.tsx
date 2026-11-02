// @vitest-environment jsdom
import {act} from 'react';
import {createRoot,type Root} from 'react-dom/client';
import {afterEach,describe,expect,it} from 'vitest';
import {AdminSessionGate} from '../../auth/AdminSessionGate';
import {getSupabaseClientConfigStatus} from '../../supabase/client';

let host:HTMLDivElement|undefined,root:Root|undefined;
afterEach(async()=>{if(root)await act(async()=>root!.unmount());host?.remove();root=undefined;host=undefined;});

describe('QL-311 owner-friendly disabled Supabase configuration help',()=>{
  it('keeps local preview available without the four optional login variables',async()=>{
    Object.assign(globalThis,{IS_REACT_ACT_ENVIRONMENT:true});
    const config=getSupabaseClientConfigStatus();
    expect(config.ready).toBe(false);
    expect(config.reasons).toContain('VITE_ENABLE_SUPABASE_CLIENT is not true.');
    expect(config.reasons).toContain('VITE_ENABLE_HOSTED_DATABASE is not true.');
    expect(config.reasons).toContain('VITE_SUPABASE_URL is missing.');
    expect(config.reasons).toContain('VITE_SUPABASE_PUBLISHABLE_KEY is missing.');
    host=document.createElement('div');document.body.append(host);root=createRoot(host);
    await act(async()=>root!.render(<AdminSessionGate><p>Preview workspace ready</p></AdminSessionGate>));
    expect(host.textContent).toContain('Preview workspace ready');
    expect(host.textContent).toContain('No key is needed for the six-app proof handoff');
    expect(host.textContent).toContain('app/.env.local');
    expect(host.textContent).toContain('Build variables and secrets');
    expect(host.textContent).toContain('publishable key');
    expect(host.textContent).toContain('Never enter a secret/service-role key');
    expect(host.querySelector('.ql270-config-banner details summary')?.textContent).toContain('setup help');
  });
});

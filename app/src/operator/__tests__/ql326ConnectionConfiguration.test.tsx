// @vitest-environment jsdom
import {act} from 'react';
import {createRoot,type Root} from 'react-dom/client';
import {readFileSync} from 'node:fs';
import {afterEach,beforeEach,describe,expect,it,vi} from 'vitest';
import {OperatorShell} from '../OperatorShell';
import {QL326_BOUNDARY,QL326_ENVIRONMENTS,QL326_NAMES,QL326_ROWS,
  ql326ValidateDraft,type Ql326Draft} from '../ql326ConnectionConfiguration';

const draft=(changes:Partial<Ql326Draft>={}):Ql326Draft=>({source:'rosiedazzlers',environment:'local',
  tenantAlias:'np-rosie-demo',origin:'http://localhost',reference:'nonsecret-review',...changes});

describe('QL-326 descriptive six-source contract safety',()=>{
  it('maps six sources, four separate business scopes and two support roles without enabling a connection',()=>{
    expect(QL326_ROWS).toHaveLength(6);
    expect(new Set(QL326_ROWS.map(row=>row.id)).size).toBe(6);
    expect(QL326_ROWS.filter(row=>row.category==='business')).toHaveLength(4);
    expect(QL326_ROWS.filter(row=>row.category==='support')).toHaveLength(2);
    expect(QL326_ENVIRONMENTS.map(item=>item.id)).toEqual(['local','preview','test']);
    expect(QL326_BOUNDARY).toMatchObject({sources:6,businesses:4,support:2,approved:0,connected:0,
      gatewayRequests:0,sourceWrites:0,savedDrafts:0,credentialsRead:0,privateRelay:'OFF'});
    for(const row of QL326_ROWS){
      expect(row.connection).toBe('DISCONNECTED / HOLD');expect(row.configured).toBe(false);
      expect(row.authorized).toBe(false);expect(row.method).toBe('GET');
      expect(row.allowedPaths).toEqual(['/api/integration/v1/health','/api/integration/v1/capabilities']);
      expect(row.responsibility).toContain('independent');
      if(row.category==='support')expect(row.fixtureAlias).toBeNull();
      else expect(row.fixtureAlias).toMatch(/^np-/);
    }
    expect(QL326_NAMES.find(item=>item.name==='ROSEVEAR_QL243_NONPROD_HMAC_KEY_B64')?.where).toContain('NAME ONLY');
    for(const flag of ['VITE_ENABLE_SUPABASE_CLIENT','VITE_ENABLE_HOSTED_DATABASE'])
      expect(QL326_NAMES.find(item=>item.name===flag)?.where).toContain('keep false');
  });
  it('validates fictional nonsecret metadata as local shapes, never an authorization',()=>{
    for(const row of QL326_ROWS){
      const input=draft({source:row.id,tenantAlias:row.fixtureAlias??''});
      const result=ql326ValidateDraft(input);
      expect(result).toMatchObject({decision:'DRAFT_ONLY_NOT_AUTHORIZED',safeDraft:true,
        authorized:false,requests:0,credentialsRead:0,saved:false,connection:'DISCONNECTED / HOLD'});
    }
    expect(ql326ValidateDraft(draft({environment:'preview',origin:'https://demo.example.test'})).safeDraft).toBe(true);
    expect(ql326ValidateDraft(draft({environment:'test',origin:'https://example.test'})).safeDraft).toBe(true);
    expect(ql326ValidateDraft(draft({origin:'http://127.0.0.1:4321'})).safeDraft).toBe(true);
  });
  it.each([
    [{source:'nonexistent'},'DENY_UNKNOWN_SOURCE'],
    [{environment:'production'},'DENY_PRODUCTION_ENVIRONMENT'],
    [{environment:'prod',origin:'https://example.test'},'DENY_PRODUCTION_ENVIRONMENT'],
    [{tenantAlias:'np-devil-demo'},'DENY_CROSS_BUSINESS_TENANT'],
    [{tenantAlias:'np-owner-other'},'DENY_CROSS_BUSINESS_TENANT'],
    [{source:'ai-data-platform',tenantAlias:'np-rosie-demo'},'DENY_SUPPORT_AS_CUSTOMER'],
    [{reference:'Secret99'},'DENY_CREDENTIAL_OR_PERSONAL_DATA'],
    [{reference:'PrivateNotes'},'DENY_UNSAFE_METADATA'],
    [{reference:'a'},'DENY_UNSAFE_METADATA'],
    [{origin:'https://bearer@demo.example.test'},'DENY_CREDENTIAL_OR_PERSONAL_DATA'],
    [{origin:'https://user:password@demo.example.test'},'DENY_CREDENTIAL_OR_PERSONAL_DATA'],
    [{origin:'https://example.test?token=abc'},'DENY_CREDENTIAL_OR_PERSONAL_DATA'],
    [{origin:'mailto:person@example.com'},'DENY_CREDENTIAL_OR_PERSONAL_DATA'],
    [{reference:'customer-record'},'DENY_CREDENTIAL_OR_PERSONAL_DATA'],
    [{origin:'https://real-site.ca'},'DENY_UNVERIFIED_ORIGIN'],
    [{origin:'https://demo.example.test/private'},'DENY_UNVERIFIED_ORIGIN'],
    [{origin:'https://john-doe.example.test',environment:'test'},'DENY_UNVERIFIED_ORIGIN'],
    [{origin:'https://123-456-7890.example.test',environment:'preview'},'DENY_CREDENTIAL_OR_PERSONAL_DATA'],
    [{origin:'https://demo.example.test#secret'},'DENY_CREDENTIAL_OR_PERSONAL_DATA'],
    [{origin:'https://demo.example.test#example'},'DENY_UNVERIFIED_ORIGIN'],
    [{origin:'https://demo.example.test?foo=bar'},'DENY_UNVERIFIED_ORIGIN'],
    [{origin:'http://demo.example.test',environment:'preview'},'DENY_UNVERIFIED_ORIGIN'],
    [{origin:'https://127.0.0.1',environment:'preview'},'DENY_UNVERIFIED_ORIGIN'],
    [{origin:'http://notlocalhost'},'DENY_UNVERIFIED_ORIGIN'],
    [{origin:'http://localhost:3000/private'},'DENY_UNVERIFIED_ORIGIN'],
    [{origin:'https://sub.other.example.test',environment:'test'},'DENY_UNVERIFIED_ORIGIN'],
  ] as [Partial<Ql326Draft>,string][])('fails closed for %j with %s',(change,code)=>{
    const result=ql326ValidateDraft(draft(change));expect(result.decision).toBe(code);
    expect(result).toMatchObject({safeDraft:false,authorized:false,requests:0,credentialsRead:0,saved:false,connection:'DISCONNECTED / HOLD'});
  });
});

let host:HTMLDivElement;let root:Root;
beforeEach(async()=>{Object.assign(globalThis,{IS_REACT_ACT_ENVIRONMENT:true});window.localStorage.clear();
  host=document.createElement('div');document.body.append(host);root=createRoot(host);await act(async()=>root.render(<OperatorShell/>));});
afterEach(async()=>{await act(async()=>root.unmount());host.remove();});

describe('QL-326 I.T. Command nonsecret guide UI',()=>{
  async function open(){const nav=[...host.querySelectorAll<HTMLButtonElement>('.ql172-nav-button')].find(row=>row.textContent?.includes('IT Command'))!;
    await act(async()=>nav.click());return host.querySelector<HTMLElement>('.ql326')!;}
  it('renders exact six-row descriptive matrix, accessible contract table and safe flags',async()=>{
    const view=await open();expect(view.getAttribute('data-ql326-release')).toBe('nonsecret-config-matrix-v1');
    expect(view.querySelectorAll('.ql326-table-scroll tbody tr')).toHaveLength(6);
    expect(view.querySelectorAll('.ql326-names li')).toHaveLength(8);
    expect(view.querySelectorAll('.ql326-fallbacks li')).toHaveLength(5);
    expect(view.textContent).toContain('0 / 6 CONFIGURED');
    expect(view.textContent).toContain('ROSEVEAR_QL243_NONPROD_HMAC_KEY_B64');
    expect(view.textContent).toContain('No customer tenant assignment');
    expect(view.textContent).toContain('ACK UNDER_REVIEW / PARKED_FOR_LATER');
  });
  it('validates only a local shape, switches support role and never saves or calls network',async()=>{
    const network=vi.spyOn(globalThis,'fetch');
    try{
      const view=await open();const verify=[...view.querySelectorAll<HTMLButtonElement>('.ql326-actions button')][0];
      await act(async()=>verify.click());expect(view.textContent).toContain('DRAFT_ONLY_NOT_AUTHORIZED');
      const source=view.querySelector<HTMLSelectElement>('#ql326-source')!;
      const native=Object.getOwnPropertyDescriptor(window.HTMLSelectElement.prototype,'value')!.set!;
      await act(async()=>{native.call(source,'rosevear-ai-hub');source.dispatchEvent(new Event('change',{bubbles:true}));});
      expect((view.querySelector<HTMLInputElement>('#ql326-alias')!).value).toBe('');
      await act(async()=>verify.click());expect(view.textContent).toContain('DRAFT_ONLY_NOT_AUTHORIZED');
      expect(network).not.toHaveBeenCalled();expect(window.localStorage.length).toBe(0);
    }finally{network.mockRestore();}
  });
  it('has keyboard, contrast and mobile layout protections without network/persistence code',()=>{
    const css=readFileSync('src/operator/ql326-connection-configuration.css','utf8');
    const model=readFileSync('src/operator/ql326ConnectionConfiguration.ts','utf8');
    const ui=readFileSync('src/operator/Ql326ConnectionConfiguration.tsx','utf8');
    for(const token of ['min-height:44px',':focus-visible','overflow:auto','max-width:590px','forced-colors:active','prefers-reduced-motion:reduce'])
      expect(css).toContain(token);
    for(const token of ['aria-live','aria-labelledby','<table>','role="note"'])expect(ui).toContain(token);
    expect(model+ui).not.toMatch(/\b(fetch|XMLHttpRequest|localStorage|sessionStorage)\s*\(/);
    expect(model+ui).not.toContain('import.meta.env');
  });
});

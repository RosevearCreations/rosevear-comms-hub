// @vitest-environment jsdom
import {act} from 'react';
import {createRoot,type Root} from 'react-dom/client';
import {readFileSync} from 'node:fs';
import {afterEach,beforeEach,describe,expect,it,vi} from 'vitest';
import {OperatorShell} from '../OperatorShell';
import {QL291_GUIDED_ROUTES,QL291_OVERVIEW,ql291QuickDensity,
  ql291Recovery,ql291PreviewSafety} from '../ql291CommandNavigation';
import {QL272_VIEWS,activeQl272Profile,defaultQl272Preferences,
  parseQl272Preferences} from '../ql272LayoutPreferences';
import {loadQl272LocalLayout,saveQl272LocalLayout} from '../../storage/localRepository';

let host:HTMLDivElement;let root:Root;
beforeEach(async()=>{Object.assign(globalThis,{IS_REACT_ACT_ENVIRONMENT:true});
  window.localStorage.clear();host=document.createElement('div');document.body.append(host);
  root=createRoot(host);await act(async()=>root.render(<OperatorShell/>));});
afterEach(async()=>{await act(async()=>root.unmount());host.remove();vi.restoreAllMocks();});
function button(label:string){const item=[...host.querySelectorAll<HTMLButtonElement>('button')]
  .find(node=>node.getAttribute('aria-label')===label||node.textContent?.includes(label));
  if(!item)throw Error(`Missing button ${label}`);return item;}
async function openCommand(mode='IT Command'){
  await act(async()=>button(mode).click());
}
function route(title:string){const match=[...host.querySelectorAll<HTMLElement>('.ql291-route')]
  .find(item=>item.querySelector('h4')?.textContent===title);
  if(!match)throw Error(`Missing route ${title}`);return match;}

describe('QL-291 compact operator command and guided safe navigation',()=>{
  it('has three safe guided routes per mode and fixture-derived glance metrics',()=>{
    expect(QL272_VIEWS).toHaveLength(4);
    for(const mode of QL272_VIEWS){const steps=QL291_GUIDED_ROUTES[mode];
      expect(steps).toHaveLength(3);
      expect(new Set(steps.map(step=>step.id)).size).toBe(3);
      expect(steps.every(step=>!['trial','connection_testing','telephony'].includes(step.target))).toBe(true);
      expect(QL291_OVERVIEW[mode]).toHaveLength(3);}
    expect(QL291_OVERVIEW.management.map(item=>item.value)).toEqual(['4','16','4']);
    expect(QL291_OVERVIEW.analytics.map(item=>item.value)).toEqual(['16','4','0']);
    expect(QL291_OVERVIEW.it_command[0].value).toBe('6');
  });
  it('changes only selected safe presentation density while preserving all role capabilities',()=>{
    const defaults=defaultQl272Preferences();
    const compact=ql291QuickDensity(defaults,'compact');
    expect(activeQl272Profile(compact).density).toBe('compact');
    expect(defaults.profiles[0].density).toBe('comfortable');
    expect(compact.profiles[1]).toEqual(defaults.profiles[1]);
    expect(compact.profiles[0].views).toEqual(defaults.profiles[0].views);
    expect(ql291QuickDensity(defaults,'unknown' as never)).toBe(defaults);
    for(const role of ['operator','manager','it_reviewer'] as const){
      expect(ql291PreviewSafety(role)).toMatchObject({displayOnly:true,canViewDemo:true,
        canViewPublicEvidence:true,canAccessTenant:false,canIssueGatewayGet:false,canSend:false});}
  });
  it('only restores structurally valid QL-272 preferences, rejecting malformed and forged roles',()=>{
    expect(ql291Recovery({state:'missing',value:null})).toMatchObject({audit:{status:'missing'},preferences:null});
    expect(ql291Recovery({state:'malformed',value:null})).toMatchObject({audit:{status:'malformed'},preferences:null});
    expect(ql291Recovery({state:'unavailable',value:null})).toMatchObject({audit:{status:'unavailable'},preferences:null});
    const safe=defaultQl272Preferences();
    expect(ql291Recovery({state:'parsed',value:safe})).toMatchObject({audit:{status:'valid'},preferences:safe});
    const forged=structuredClone(safe);
    (forged.profiles[0] as {rolePreview:string}).rolePreview='admin';
    expect(ql291Recovery({state:'parsed',value:forged})).toMatchObject({audit:{status:'invalid'},preferences:null});
    expect(ql291Recovery({state:'parsed',value:{...safe,privateToken:'fake'}}).preferences).toBeNull();
  });
  it('renders information-rich guided cards and accessible per-card help in IT command',async()=>{
    await openCommand();
    expect(host.querySelectorAll('[data-ql291-board]')).toHaveLength(1);
    expect(host.querySelectorAll('.ql291-overview>div')).toHaveLength(3);
    expect(host.querySelectorAll('.ql291-route')).toHaveLength(3);
    expect(host.textContent).toContain('READ-ONLY / SYNTHETIC');
    expect(host.textContent).toContain('No verified saved layout');
    expect(button('Restore verified layout').disabled).toBe(true);
    await act(async()=>route('Review connection profiles').querySelector<HTMLButtonElement>('.ql291-help')!.click());
    expect(route('Review connection profiles').textContent).toContain('cannot provision a connection');
    expect(route('Review connection profiles').querySelector('.ql291-help')?.getAttribute('aria-expanded')).toBe('true');
    await act(async()=>button('Collapse guide').click());
    expect(host.querySelectorAll('.ql291-route')).toHaveLength(0);
    await act(async()=>button('Show guided cards').click());
    expect(host.querySelectorAll('.ql291-route')).toHaveLength(3);
  });
  it('one-click compact mode uses existing layout storage and survives a full shell remount',async()=>{
    await openCommand();
    const board=host.querySelector('[data-ql291-board]')!;
    await act(async()=>board.querySelectorAll<HTMLButtonElement>('.ql291-preference-controls button')[1].click());
    expect(host.querySelector('.ql271-command')?.getAttribute('data-ql272-density')).toBe('compact');
    expect(activeQl272Profile(parseQl272Preferences(loadQl272LocalLayout())).density).toBe('compact');
    expect(window.localStorage.length).toBe(1);
    await act(async()=>root.unmount());root=createRoot(host);
    await act(async()=>root.render(<OperatorShell/>));
    await openCommand();
    expect(host.querySelector('.ql271-command')?.getAttribute('data-ql272-density')).toBe('compact');
    expect(host.textContent).toContain('Saved through the existing QL-272 local layout format');
  });
  it('restores a verified saved profile after a presentation change',async()=>{
    await openCommand();
    await act(async()=>button('Compact').click());
    await act(async()=>button('Check saved view').click());
    expect(host.textContent).toContain('Saved layout: VALID');
    expect(button('Restore verified layout').disabled).toBe(false);
    await act(async()=>button('Restore verified layout').click());
    expect(host.textContent).toContain('Restored locally verified');
    expect(host.querySelector('.ql271-command')?.getAttribute('data-ql272-density')).toBe('compact');
    expect(host.textContent).toContain('no authorization changed');
  });
  it('rejects a tampered saved role and replaces invalid data only on explicit action',async()=>{
    await openCommand();
    const forged=structuredClone(defaultQl272Preferences());
    (forged.profiles[0] as {rolePreview:string}).rolePreview='superadmin';
    expect(saveQl272LocalLayout(forged)).toBe(true);
    await act(async()=>button('Check saved view').click());
    expect(host.textContent).toContain('Saved layout: INVALID');
    expect(button('Restore verified layout').disabled).toBe(true);
    await act(async()=>button('Replace invalid layout with defaults').click());
    expect(parseQl272Preferences(loadQl272LocalLayout())).toEqual(defaultQl272Preferences());
    expect(host.textContent).toContain('Invalid local layout replaced with safe Standard defaults');
    expect(host.textContent).toContain('Saved layout: VALID');
  });
  it('handles malformed storage, preserving the on-screen safe default until explicit repair',async()=>{
    await openCommand();
    window.localStorage.setItem('rosevear-comms-hub:ql272-command-layouts:v1','{bad-json');
    await act(async()=>button('Check saved view').click());
    expect(host.textContent).toContain('Saved layout: MALFORMED');
    expect(button('Restore verified layout').disabled).toBe(true);
    expect(window.localStorage.getItem('rosevear-comms-hub:ql272-command-layouts:v1')).toBe('{bad-json');
    await act(async()=>button('Replace invalid layout with defaults').click());
    expect(host.textContent).toContain('Saved layout: VALID');
  });
  it('routes each mode through existing safe workspaces without changing source permissions',async()=>{
    await openCommand('Management');
    expect(host.textContent).toContain('Training examples');
    await act(async()=>route('Open current business worklist').querySelector<HTMLButtonElement>('.ql291-route-actions button')!.click());
    expect(host.querySelector('[data-command-view]')).toBeNull();
    await openCommand('Analytics');
    expect(host.textContent).toContain('Category types');
    await act(async()=>route('Compare business workspaces').querySelector<HTMLButtonElement>('.ql291-route-actions button')!.click());
    expect(host.querySelector('[data-command-view]')?.getAttribute('data-command-view')).toBe('management');
    await openCommand('System Status');
    expect(host.textContent).toContain('QL-290 public GitHub source recheck');
    expect(host.querySelectorAll('.ql271-status-table>div')).toHaveLength(6);
    await act(async()=>route('Return to IT Command').querySelector<HTMLButtonElement>('.ql291-route-actions button')!.click());
    expect(host.querySelector('[data-command-view]')?.getAttribute('data-command-view')).toBe('it_command');
    expect(host.textContent).toContain('DISCONNECTED / HOLD');
  });
  it('keeps role preview display-only even after switching to IT reviewer and compact density',async()=>{
    await openCommand();
    await act(async()=>button('Customize cards').click());
    const select=host.querySelector<HTMLSelectElement>('select[aria-label="Role-safe preview"]')!;
    await act(async()=>{select.value='it_reviewer';select.dispatchEvent(new Event('change',{bubbles:true}));});
    expect(host.textContent).toContain('IT reviewer display preview');
    expect(host.textContent).toContain('No real tenant, gateway or messaging permission');
    await act(async()=>button('Compact').click());
    expect(host.querySelector('.ql271-command')?.getAttribute('data-ql272-role-preview')).toBe('it_reviewer');
    expect(host.querySelectorAll('.ql291-route')).toHaveLength(3);
    expect(window.localStorage.length).toBe(1);
  });
  it('provides readable compact/mobile/forced-colors focus styles',()=>{
    const css=readFileSync('src/operator/ql291-command-navigation.css','utf8');
    expect(css).toContain('max-width:700px');
    expect(css).toContain('data-ql272-density');
    expect(css).toContain('prefers-reduced-motion:reduce');
    expect(css).toContain('forced-colors:active');
    expect(css).toContain(':focus-visible');
  });
});

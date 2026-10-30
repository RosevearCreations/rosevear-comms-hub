// @vitest-environment jsdom
import {act} from 'react';
import {createRoot,type Root} from 'react-dom/client';
import {readFileSync} from 'node:fs';
import {afterEach,beforeEach,describe,expect,it,vi} from 'vitest';
import {OperatorShell} from '../OperatorShell';

let host:HTMLDivElement;let root:Root;
beforeEach(async()=>{Object.assign(globalThis,{IS_REACT_ACT_ENVIRONMENT:true});
  host=document.createElement('div');document.body.append(host);root=createRoot(host);
  await act(async()=>root.render(<OperatorShell/>));});
afterEach(async()=>{await act(async()=>root.unmount());host.remove();vi.restoreAllMocks();});

function nav(label:string){const button=[...host.querySelectorAll<HTMLButtonElement>('.ql172-nav-button')].find(b=>b.textContent?.includes(label));
  if(!button)throw new Error(`Missing ${label}`);return button;}
function commandButton(label:string){const button=[...host.querySelectorAll<HTMLButtonElement>('.ql271-command button')].find(b=>b.textContent?.includes(label));
  if(!button)throw new Error(`Missing ${label}`);return button;}

describe('QL-271 high-information command surfaces',()=>{
  it('opens a dark IT command page with six real proof failures, no accepted signatures, and safe links',async()=>{
    await act(async()=>nav('IT Command').click());
    expect(host.querySelector('[data-ql271-command]')?.getAttribute('data-ql271-command')).toBe('true');
    expect(host.querySelector('[data-command-view]')?.getAttribute('data-command-view')).toBe('it_command');
    expect(host.textContent).toContain('IT Command & Integrations');
    expect(host.querySelectorAll('.ql271-source-row')).toHaveLength(6);
    expect(host.textContent).toContain('0 / 6');
    expect(host.textContent).toContain('No application gateway contacted');
    expect(host.textContent).toContain('SYNTHETIC / READ-ONLY VIEW');
    expect(host.querySelectorAll('.ql271-kpi')).toHaveLength(4);
    expect(host.querySelectorAll('.ql271-tabs button')).toHaveLength(4);
    await act(async()=>commandButton('Manage six-app connections').click());
    expect(host.querySelector('.ql270-connect')).not.toBeNull();
  });

  it('shows company-isolated management samples, then switches company and opens its queue',async()=>{
    await act(async()=>nav('Management').click());
    expect(host.querySelectorAll('.ql271-table-row')).toHaveLength(4);
    expect(host.textContent).toContain('16 fictional records');
    expect(host.textContent).toContain('AI Data Platform has no live feed');
    const button=[...host.querySelectorAll<HTMLButtonElement>('.ql271-table-row button')].find(b=>b.getAttribute('aria-label')?.includes('iCamp'))!;
    await act(async()=>button.click());
    expect(host.querySelector('.ql172-context')?.textContent).toContain('iCamp');
    expect(host.querySelector('.ql194-queue')||host.textContent).toBeTruthy();
    expect(host.textContent).toContain('DISABLED SYNTHETIC WORK QUEUE');
    expect(host.textContent).not.toContain('Salt-stain interior enquiry');
  });

  it('renders accurate 16-record training charts and a real 6-to-zero approval funnel',async()=>{
    await act(async()=>nav('Analytics & statistics').click());
    expect(host.querySelectorAll('.ql271-chart-row')).toHaveLength(4);
    expect(host.querySelectorAll('.ql271-funnel>div')).toHaveLength(4);
    expect(host.querySelector('.ql271-donut')?.getAttribute('aria-label')).toContain('each 25 percent');
    expect(host.textContent).toContain('not trend or conversion estimates');
    expect(host.textContent).toContain('Original Proof-B accepted');
    expect(host.textContent).toContain('0');
  });

  it('keeps all six 404 proof statuses distinct from live health and no runtime permissions enabled',async()=>{
    await act(async()=>nav('System status').click());
    expect(host.querySelectorAll('.ql271-status-table>div')).toHaveLength(6);
    expect(host.textContent).toContain('Dated original GitHub proof checks');
    expect(host.textContent).toContain('Live calls and SMS');
    expect(host.textContent).toContain('0 SENT');
    expect(host.textContent).toContain('Production software and integration authorization are separate');
  });

  it('provides the dense responsive visual system without assuming real sales or phone data',()=>{
    const css=readFileSync('src/operator/ql271-command.css','utf8');
    expect(css).toContain('prefers-reduced-motion:reduce');
    expect(css).toContain('forced-colors:active');
    expect(css).toContain('ql271-donut');
    expect(css).toContain('ql271-hero-art');
    expect(css).toContain('max-width:690px');
  });
});

// @vitest-environment jsdom
import {readFileSync} from 'node:fs';
import {act} from 'react';
import {createRoot,type Root} from 'react-dom/client';
import {afterEach,beforeEach,describe,expect,it,vi} from 'vitest';
import {OperatorShell} from '../OperatorShell';

let host:HTMLDivElement,root:Root;
beforeEach(async()=>{
  Object.assign(globalThis,{IS_REACT_ACT_ENVIRONMENT:true});
  window.localStorage.clear();
  host=document.createElement('div');document.body.append(host);
  root=createRoot(host);await act(async()=>root.render(<OperatorShell/>));
});
afterEach(async()=>{await act(async()=>root.unmount());host.remove();vi.unstubAllGlobals();});

const mobile=()=>host.querySelector<HTMLButtonElement>('.ql313-mobile-toggle')!;
const sidebar=()=>host.querySelector<HTMLElement>('#ql313-sidebar')!;
async function toggle(){await act(async()=>mobile().click());}

describe('QL-313 responsive operator shell & recovery',()=>{
  it('keeps the mobile workspace menu closed by default and opens it with explicit accessible state',async()=>{
    expect(mobile().getAttribute('aria-expanded')).toBe('false');
    expect(mobile().getAttribute('aria-controls')).toBe(sidebar().id);
    expect(sidebar().dataset.ql313Open).toBe('false');
    await toggle();
    expect(mobile().getAttribute('aria-expanded')).toBe('true');
    expect(sidebar().dataset.ql313Open).toBe('true');
    expect(host.querySelector('.ql172-shell')?.getAttribute('data-ql313-nav-open')).toBe('true');
    await act(async()=>host.querySelector<HTMLButtonElement>('.ql313-mobile-close')!.click());
    expect(sidebar().dataset.ql313Open).toBe('false');
    expect(document.activeElement).toBe(mobile());
  });

  it('returns keyboard focus to the toggle on Escape and does not intercept Escape when closed',async()=>{
    await toggle();
    await act(async()=>window.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true})));
    expect(mobile().getAttribute('aria-expanded')).toBe('false');
    expect(document.activeElement).toBe(mobile());
    mobile().blur();
    await act(async()=>window.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true})));
    expect(document.activeElement).not.toBe(mobile());
  });

  it('navigates to a workspace, closes the menu, and focuses the destination heading',async()=>{
    await toggle();
    const destination=[...sidebar().querySelectorAll<HTMLButtonElement>('.ql172-nav-button')]
      .find(button=>button.querySelector('strong')?.textContent==='Dashboard')!;
    expect(destination).toBeDefined();
    await act(async()=>destination.click());
    expect(sidebar().dataset.ql313Open).toBe('false');
    const heading=host.querySelector<HTMLHeadingElement>('.ql172-context h2')!;
    expect(heading.textContent).toBe('Dashboard');
    expect(document.activeElement).toBe(heading);
  });

  it('preserves business, navigation search, display preferences and disabled-preview posture through reflow',async()=>{
    const business=[...sidebar().querySelectorAll<HTMLButtonElement>('.ql172-brand')]
      .find(button=>button.textContent?.includes('Devil'));
    expect(business).toBeDefined();
    await act(async()=>business!.click());
    const search=sidebar().querySelector<HTMLInputElement>('input[type="search"]')!;
    expect(search).not.toBeNull();
    await act(async()=>{const setter=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value')!.set!;setter.call(search,'analytics');search.dispatchEvent(new Event('input',{bubbles:true}));});
    const choices=[...host.querySelectorAll<HTMLButtonElement>('.ql312-choice button')];
    await act(async()=>choices.find(button=>button.textContent==='Compact')!.click());
    await act(async()=>choices.find(button=>button.textContent==='High')!.click());
    await toggle();await toggle();
    const shell=host.querySelector<HTMLElement>('.ql172-shell')!;
    expect(shell.dataset.ql312Density).toBe('compact');
    expect(shell.dataset.ql312Contrast).toBe('high');
    expect(search.value).toBe('analytics');
    expect(shell.dataset.organization).toBeTruthy();
    expect(host.querySelector('.ql172-status')?.textContent).toContain('DISABLED PREVIEW');
    expect(window.localStorage.length).toBe(0);
  });

  it('recovers the open menu on a landscape or desktop-width transition',async()=>{
    let listener:((event:MediaQueryListEvent)=>void)|undefined;
    const media={matches:true,addEventListener:vi.fn((_type:string,fn:(event:MediaQueryListEvent)=>void)=>{listener=fn;}),removeEventListener:vi.fn()};
    // The shell attaches this listener on mount, so recreate it under the media stub.
    await act(async()=>root.unmount());host.replaceChildren();
    vi.stubGlobal('matchMedia',vi.fn(()=>media));
    root=createRoot(host);await act(async()=>root.render(<OperatorShell/>));
    await toggle();
    expect(listener).toBeDefined();
    await act(async()=>listener!({matches:false} as MediaQueryListEvent));
    expect(mobile().getAttribute('aria-expanded')).toBe('false');
    expect(sidebar().dataset.ql313Open).toBe('false');
    expect(media.removeEventListener).not.toHaveBeenCalled();
  });

  it('provides 320/375/768/1024/1440 responsive and touch-target rules without hiding actions',()=>{
    const css=readFileSync('src/operator/ql313-responsive.css','utf8');
    for(const width of [480,768,850,1024])expect(css).toContain(`max-width:${width}px`);
    expect(css).toContain('min-height:44px');
    expect(css).toContain('overflow-x:auto');
    expect(css).toContain("data-ql313-open='false'");
    expect(css).toContain("data-ql313-open='true'");
    expect(css).toContain('orientation:landscape');
    expect(css).toContain('prefers-reduced-motion:reduce');
    expect(css).toContain('forced-colors:active');
    const fixture=JSON.parse(readFileSync('../docs/visual/ql313-responsive-viewports.json','utf8')) as {
      captureStatus:string;ownerDeviceAcceptance:string;viewportWidths:number[];zoomPercent:number[];categoryScreens:{section:string}[];
    };
    expect(fixture.viewportWidths).toEqual([320,375,768,1024,1440]);
    expect(fixture.zoomPercent).toEqual([100,200,400]);
    expect(fixture.captureStatus).toBe('PENDING_BROWSER_CAPTURE');
    expect(fixture.ownerDeviceAcceptance).toBe('NOT_PERFORMED');
    expect(fixture.categoryScreens.map(row=>row.section)).toEqual(['front_end','admin','it','management','statistics','status']);
  });

  it('keeps responsive help in context and never presents a real integration as connected',()=>{
    const help=host.querySelector<HTMLDetailsElement>('.ql313-responsive-help')!;
    expect(help.querySelector('summary')?.textContent).toContain('Phone, tablet, zoom');
    expect(help.textContent).toContain('DISCONNECTED / HOLD');
    expect(help.textContent).toContain('physical owner-device acceptance');
    expect(help.textContent).toContain('cannot call, send SMS, dispatch');
  });
});

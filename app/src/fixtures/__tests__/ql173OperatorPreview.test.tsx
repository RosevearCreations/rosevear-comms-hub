// @vitest-environment jsdom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { DisabledInterfacePreview } from '../../operator/DisabledInterfacePreview';

let host: HTMLDivElement;
let root: Root;

beforeEach(async () => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  host = document.createElement('div');
  document.body.append(host);
  root = createRoot(host);
  await act(async () => root.render(<DisabledInterfacePreview embedded />));
});

afterEach(async () => {
  await act(async () => root.unmount());
  host.remove();
});

describe('QL-173 canonical operator projection', () => {
  it('renders three canonical Rosie fixtures, with verified release version and all live actions disabled', () => {
    expect(host.textContent).toContain('ql173-canonical-v1 verified · 6 conversations');
    expect(host.querySelectorAll('.interface-preview-selector')).toHaveLength(3);
    expect(host.textContent).toContain('Rosie Dazzlers communication cockpit');
    expect(host.querySelectorAll('.interface-preview-actions button')).toHaveLength(8);
    expect(host.querySelectorAll('.interface-preview-actions button:not([disabled])')).toHaveLength(0);
    expect(host.querySelector('.interface-preview-tab-facts')?.textContent).toContain('Versioned, canonical checked-in synthetic fixtures');
  });

  it('keeps each brand strictly separated and displays UNSENT synthetic copy', async () => {
    const rosieLabels = [...host.querySelectorAll('.interface-preview-selector')].map(node => node.textContent);
    expect(rosieLabels.every(text => !text?.includes('Custom order') && !text?.includes('Maker story'))).toBe(true);
    const devilButton = [...host.querySelectorAll<HTMLButtonElement>('.interface-preview-brand')].find(node => node.textContent?.includes('Devil n Dove'));
    await act(async () => devilButton?.click());
    expect(host.textContent).toContain('Devil n Dove communication cockpit');
    const devilLabels = [...host.querySelectorAll('.interface-preview-selector')].map(node => node.textContent);
    expect(devilLabels).toHaveLength(3);
    expect(devilLabels.every(text => !text?.includes('Ceramic quote') && !text?.includes('Missed-call'))).toBe(true);
    const draftButton = [...host.querySelectorAll<HTMLButtonElement>('.interface-preview-tab')].find(node => node.textContent?.includes('Draft'));
    await act(async () => draftButton?.click());
    expect(host.textContent).toContain('Draft-only reply');
    expect(host.querySelector('.interface-preview-tab-body')?.textContent).toContain('Draft-only');
    expect(host.querySelectorAll('.interface-preview-actions button:not([disabled])')).toHaveLength(0);
  });
});

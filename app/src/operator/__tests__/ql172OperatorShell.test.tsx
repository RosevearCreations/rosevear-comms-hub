// @vitest-environment jsdom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { readFileSync } from 'node:fs';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { OperatorShell } from '../OperatorShell';

let host: HTMLDivElement;
let root: Root;

beforeEach(async () => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  window.localStorage.clear();
  host = document.createElement('div');
  document.body.append(host);
  root = createRoot(host);
  await act(async () => root.render(<OperatorShell />));
});

afterEach(async () => {
  await act(async () => root.unmount());
  host.remove();
  window.localStorage.clear();
});

function control(text: string, selector = 'button'): HTMLButtonElement {
  const button = [...host.querySelectorAll<HTMLButtonElement>(selector)].find((candidate) => candidate.textContent?.includes(text));
  if (!button) throw new Error(`Missing ${text}`);
  return button;
}

async function chooseWorkspace(label: string) {
  await act(async () => control(label, '.ql172-nav-button').click());
}

describe('QL-172 unified operator navigation and safe preview', () => {
  it('starts with one labelled navigation, a skip target, and a disabled-only banner', () => {
    expect(host.querySelectorAll('nav[aria-label="Operator workspaces"]')).toHaveLength(1);
    expect(host.querySelectorAll('.ql172-nav-button')).toHaveLength(19);
    expect(host.querySelector('a.ql172-skip-link')?.getAttribute('href')).toBe('#ql172-workspace');
    expect(host.querySelector('.ql172-status')?.textContent).toContain('DISABLED PREVIEW');
    expect(host.querySelector('[aria-current="page"]')?.textContent).toContain('Dashboard');
    expect(host.textContent).toContain('Demonstration mode');
  });

  it('keeps the active brand synchronized from the shell to synthetic conversations', async () => {
    await act(async () => control('Devil n Dove', '.ql172-brand').click());
    expect(control('Devil n Dove', '.ql172-brand').getAttribute('aria-pressed')).toBe('true');
    await chooseWorkspace('Synthetic conversations');
    expect(host.textContent).toContain('Devil n Dove communication cockpit');
    expect(host.querySelector('.interface-preview-panel')?.getAttribute('role')).toBe('region');
    expect(host.querySelectorAll('.interface-preview-toggle')).toHaveLength(0);
    expect(host.textContent).toContain('SMS, calls, provider callbacks, recordings');
    expect(host.querySelectorAll<HTMLButtonElement>('.interface-preview-actions button:not(:disabled)')).toHaveLength(0);
  });

  it('keeps brand context through navigation and focuses the new heading', async () => {
    await act(async () => control('Devil n Dove', '.ql172-brand').click());
    await chooseWorkspace('Phone/SMS safety');
    expect(document.activeElement).toBe(host.querySelector('.ql172-context h2'));
    expect(host.querySelector('.ql172-context')?.textContent).toContain('Devil n Dove');
    expect(host.querySelector('.operator-console-panel')?.getAttribute('role')).toBe('region');
    expect(host.textContent).toContain('Historical QL-068 planning record');
    expect(host.querySelectorAll<HTMLButtonElement>('.operator-console-disabled-actions button:not(:disabled)')).toHaveLength(0);
    await chooseWorkspace('Unified inbox');
    expect(host.querySelector('.ql172-context')?.textContent).toContain('Devil n Dove');
    expect(host.querySelector('.ql172-local-warning')).not.toBeNull();
    expect(host.querySelector('.ql192-inbox')).not.toBeNull();
  });

  it('opens the synthetic hold review without a floating modal or a real approval action', async () => {
    await chooseWorkspace('Safety & hold review');
    expect(host.querySelector('.ql093-panel')?.getAttribute('role')).toBe('region');
    expect(host.querySelector('.ql093-panel')?.getAttribute('aria-modal')).toBeNull();
    expect(host.textContent).toContain('This confirms versioned local samples only, not real evidence or owner approval.');
    expect(host.querySelector('.ql093-toggle')).toBeNull();
    expect(host.querySelector('.ql093-brand-row')).not.toBeNull();
  });

  it('documents narrow-screen and visible keyboard focus in layout CSS', () => {
    const css = readFileSync('src/operator/operator-shell.css', 'utf8');
    expect(css).toContain(':focus-visible');
    expect(css).toContain('@media (max-width: 760px)');
    expect(css).toContain('@media (max-width: 450px)');
    expect(css).toContain('@media (forced-colors: active)');
  });
});

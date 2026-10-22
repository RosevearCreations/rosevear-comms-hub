// @vitest-environment jsdom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { readFileSync } from 'node:fs';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { Ql093SafeReadPreview } from '../Ql093SafeReadPreview';

let host: HTMLDivElement;
let root: Root;

beforeEach(async () => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  host = document.createElement('div');
  document.body.append(host);
  root = createRoot(host);
  await act(async () => root.render(<Ql093SafeReadPreview />));
});

afterEach(async () => {
  await act(async () => root.unmount());
  host.remove();
});

function button(selector: string): HTMLButtonElement {
  const item = host.querySelector<HTMLButtonElement>(selector);
  if (!item) throw new Error(`Missing operator control: ${selector}`);
  return item;
}

async function openPanel() {
  const toggle = button('.ql093-toggle');
  await act(async () => toggle.click());
  return host.querySelector<HTMLElement>('[role="dialog"]');
}

describe('QL-166 operator preview keyboard and screen-reader acceptance', () => {
  it('exposes a collapsed dialog trigger and keeps the panel hidden initially', () => {
    const toggle = button('.ql093-toggle');
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
    expect(toggle.getAttribute('aria-haspopup')).toBe('dialog');
    expect(toggle.getAttribute('aria-controls')).toBeTruthy();
    expect(host.querySelector('[role="dialog"]')).toBeNull();
  });

  it('opens a non-modal labelled dialog and focuses its Close button', async () => {
    const panel = await openPanel();
    expect(panel).not.toBeNull();
    expect(button('.ql093-toggle').getAttribute('aria-expanded')).toBe('true');
    expect(panel?.id).toBe(button('.ql093-toggle').getAttribute('aria-controls'));
    expect(panel?.getAttribute('aria-modal')).toBe('false');
    expect(panel?.querySelector('h2')?.id).toBe(panel?.getAttribute('aria-labelledby'));
    expect(panel?.querySelector('.ql093-header p[id]')?.id).toBe(panel?.getAttribute('aria-describedby'));
    expect(document.activeElement).toBe(button('.ql093-close'));
    expect(button('.ql093-close').getAttribute('aria-label')).toBe('Close synthetic review panel');
  });

  it('supports Escape and restores focus to the opening control', async () => {
    await openPanel();
    await act(async () => {
      button('.ql093-close').dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    });
    expect(host.querySelector('[role="dialog"]')).toBeNull();
    expect(button('.ql093-toggle').getAttribute('aria-expanded')).toBe('false');
    expect(document.activeElement).toBe(button('.ql093-toggle'));
  });

  it('returns focus when closed by button and when toggled', async () => {
    await openPanel();
    await act(async () => button('.ql093-close').click());
    expect(document.activeElement).toBe(button('.ql093-toggle'));
    await openPanel();
    await act(async () => button('.ql093-toggle').click());
    expect(document.activeElement).toBe(button('.ql093-toggle'));
  });

  it('announces selected brand without confusing a read-only filter with an approval', async () => {
    const panel = await openPanel();
    const choices = panel?.querySelectorAll<HTMLButtonElement>('.ql093-brand-row button');
    expect(panel?.querySelector('.ql093-brand-row')?.getAttribute('role')).toBe('group');
    expect(choices?.length).toBe(2);
    expect(choices?.[0].getAttribute('aria-pressed')).toBe('true');
    expect(choices?.[1].getAttribute('aria-pressed')).toBe('false');
    await act(async () => choices?.[1].click());
    const updated = host.querySelectorAll<HTMLButtonElement>('.ql093-brand-row button');
    expect(updated[0].getAttribute('aria-pressed')).toBe('false');
    expect(updated[1].getAttribute('aria-pressed')).toBe('true');
    expect(panel?.querySelector('[role="status"]')?.getAttribute('aria-live')).toBe('polite');
    expect(panel?.textContent).toContain('This confirms versioned local samples only, not real evidence or owner approval.');
  });

  it('gives keyboard users working in-panel landmarks for lengthy evidence sections', async () => {
    const panel = await openPanel();
    const links = panel?.querySelectorAll<HTMLAnchorElement>('.ql093-jump-links a');
    expect(links?.length).toBe(3);
    for (const link of links ?? []) {
      const targetId = decodeURIComponent(link.getAttribute('href')!.slice(1));
      expect(panel?.querySelectorAll('[id]').length).toBeGreaterThan(4);
      expect(document.getElementById(targetId)?.tagName).toBe('H3');
    }
  });

  it('retains explicit focus, wrapping, narrow-screen and forced-colours CSS rules', () => {
    const css = readFileSync('src/operator/ql093-safe-read-preview.css', 'utf8');
    expect(css).toContain(':focus-visible');
    expect(css).toContain('overflow-wrap: anywhere');
    expect(css).toContain('white-space: normal');
    expect(css).toContain('@media (max-width: 560px)');
    expect(css).toContain('@media (forced-colors: active)');
    expect(css).toContain('min-height: 44px');
  });
});

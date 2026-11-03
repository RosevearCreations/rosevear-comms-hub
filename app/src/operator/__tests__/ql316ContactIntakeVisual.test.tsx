// @vitest-environment jsdom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { readFileSync } from 'node:fs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { OperatorShell } from '../OperatorShell';
import { customerThreads, customersForOrganization } from '../ql193CustomerContexts';
import { ql295ConsentPosture, ql295PermissionGate, duplicateCandidates } from '../ql295ContactReview';
import { ql296Fixtures, ql296Handoff } from '../ql296GuidedIntake';
import { ql316Brands, ql316ConsentReadback, ql316IntakeProgress } from '../ql316VisualReadback';

let host: HTMLDivElement;
let root: Root;
beforeEach(async () => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  host = document.createElement('div'); document.body.append(host); root = createRoot(host);
  await act(async () => root.render(<OperatorShell />));
});
afterEach(async () => { await act(async () => root.unmount()); host.remove(); vi.restoreAllMocks(); });
function button(label: string, selector = 'button') {
  const found = [...host.querySelectorAll<HTMLButtonElement>(selector)].find((candidate) => candidate.textContent?.includes(label));
  if (!found) throw Error(`Missing button ${label}`);
  return found;
}
async function click(label: string, selector?: string) { await act(async () => button(label, selector).click()); }
async function chooseSelect(element: HTMLSelectElement, value: string) {
  await act(async () => { element.value = value; element.dispatchEvent(new Event('change', { bubbles: true })); });
}
async function openContacts() { await click('Customer 360', '.ql172-nav-button'); }
async function openIntake() { await click('Guided intake', '.ql172-nav-button'); }

describe('QL-316 four-brand contact/consent and guided intake readback', () => {
  it('keeps all four business brands isolated with no allowed live contact capability', () => {
    expect(Object.keys(ql316Brands).sort()).toEqual(['devilndove', 'icamp', 'rosiedazzlers', 'yw']);
    expect(new Set(Object.values(ql316Brands).map((item) => item.workstream)).size).toBe(4);
    expect(Object.values(ql295PermissionGate).every((value) => value === false)).toBe(true);
    for (const fixture of ql296Fixtures) {
      const progress = ql316IntakeProgress(fixture, {});
      expect(progress).toMatchObject({ completed: 0, total: 4, remaining: 4 });
      const valid = Object.fromEntries(fixture.fields.map((field) => [field.id, field.choices[0]]));
      expect(ql316IntakeProgress(fixture, valid).completed).toBe(4);
      expect(ql296Handoff(fixture.organizationId, valid)?.status).toContain('UNSENT');
      const invalid = { ...valid, [fixture.fields[0].id]: 'CROSS COMPANY SPOOF' };
      expect(ql316IntakeProgress(fixture, invalid).completed).toBe(3);
      expect(ql296Handoff(fixture.organizationId, invalid)).toBeNull();
      const contact = customersForOrganization(fixture.organizationId)[0];
      const sources = customerThreads(fixture.organizationId, contact);
      expect(ql316ConsentReadback(ql295ConsentPosture(sources)).label).toMatch(/No marketing|Marketing prohibited|No outbound permission/);
      expect(ql295ConsentPosture(sources).marketingAllowed).toBe(false);
      expect(duplicateCandidates(fixture.organizationId)[0].organizationId).toBe(fixture.organizationId);
    }
  });

  it('shows source-specific consent, unverified duplicate and branded overview without implying a merge', async () => {
    await openContacts();
    const view = host.querySelector<HTMLElement>('[data-ql316-release="contact-consent-intake-visual-v1"]')!;
    expect(view.dataset.ql316Brand).toBe('rosiedazzlers');
    expect(view.querySelector('.ql316-contact-readback')?.textContent).toContain('UNVERIFIED IDENTITY');
    expect(view.querySelector('.ql316-consent--opted-out')?.textContent).toContain('Marketing prohibited');
    expect(view.querySelectorAll('.ql295-preferences .ql316-source-consent')).toHaveLength(2);
    expect(view.querySelector('.ql295-duplicates')?.textContent).toContain('0 confirmed matches');
    expect(view.querySelectorAll('.ql193-disabled-actions button:disabled')).toHaveLength(3);
    await click('ⓘ Help', '.ql193-header button');
    expect(view.querySelector('#ql193-help')?.textContent).toContain('strictest linked fixture status');
    await click('iCamp', '.ql172-brand');
    const camp = host.querySelector<HTMLElement>('.ql316-contact')!;
    expect(camp.dataset.ql316Brand).toBe('icamp');
    expect(camp.textContent).toContain('Campground guest services');
    expect(camp.textContent).not.toContain('Demo detailing customer');
  });

  it('shows counted fictional progress and keeps the review card UNSENT, invalidating it after edits and a brand change', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    const storageSpy = vi.spyOn(Storage.prototype, 'setItem');
    await openIntake();
    const view = host.querySelector<HTMLElement>('.ql316-intake')!;
    expect(view.dataset.ql316Brand).toBe('rosiedazzlers');
    expect(view.querySelector<HTMLProgressElement>('#ql316-intake-progress')?.value).toBe(0);
    expect(view.querySelector('[data-ql316-handoff="pending"]')?.textContent).toContain('UNSENT');
    expect(button('Preview internal handoff').disabled).toBe(true);
    const selects = [...view.querySelectorAll<HTMLSelectElement>('.ql296-fields select')];
    for (const element of selects) await chooseSelect(element, element.options[1].value);
    expect(view.querySelector<HTMLProgressElement>('#ql316-intake-progress')?.value).toBe(4);
    expect(button('Preview internal handoff').disabled).toBe(false);
    await click('Preview internal handoff');
    expect(view.querySelector('[data-ql316-handoff="unsent"]')?.textContent).toContain('QL296-RD-01');
    expect(view.querySelector('[data-ql316-handoff="unsent"]')?.textContent).toContain('Confirm vehicle size');
    await chooseSelect(selects[0], '');
    expect(view.querySelector('[data-ql316-handoff="pending"]')).not.toBeNull();
    expect(button('Preview internal handoff').disabled).toBe(true);
    await click('iCamp', '.ql172-brand');
    const camp = host.querySelector<HTMLElement>('.ql316-intake')!;
    expect(camp.dataset.ql316Brand).toBe('icamp');
    expect(camp.querySelector<HTMLProgressElement>('#ql316-intake-progress')?.value).toBe(0);
    expect(camp.textContent).toContain('Campground guest services');
    expect(camp.textContent).not.toContain('QL296-RD-01');
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(storageSpy).not.toHaveBeenCalled();
  });

  it('includes text-first statuses and responsive, focus, high-contrast and reduced-motion presentation', async () => {
    const css = readFileSync('src/operator/ql316-contact-intake-visual.css', 'utf8');
    expect(css).toContain('data-ql316-brand="devilndove"');
    expect(css).toContain('data-ql316-brand="yw"');
    expect(css).toContain('data-ql316-brand="icamp"');
    expect(css).toContain('max-width:620px');
    expect(css).toContain('max-width:375px');
    expect(css).toContain('forced-colors:active');
    expect(css).toContain('prefers-reduced-motion:reduce');
    expect(css).toContain(':focus-visible');
    await openIntake();
    expect(host.querySelector('label[for="ql316-intake-progress"]')).not.toBeNull();
    expect(host.querySelectorAll('.ql316-intake-step')).toHaveLength(3);
  });
});

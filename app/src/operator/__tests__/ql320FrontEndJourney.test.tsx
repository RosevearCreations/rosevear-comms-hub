// @vitest-environment jsdom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { readFileSync } from 'node:fs';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { OperatorShell } from '../OperatorShell';
import { operatorOrganizations } from '../ql191Organizations';
import { customerForThread } from '../ql193CustomerContexts';
import { inboxForOrganization } from '../ql192InboxFixtures';
import { seedQueueForOrganization } from '../ql194WorkQueue';
import { stageQl293Draft } from '../ql293ConversationRecovery';
import { messageTemplates } from '../ql196MessagePolicy';
import { ql320JourneyReadback, ql320Steps } from '../ql320FrontEndJourney';

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
});

const journey = () => host.querySelector<HTMLElement>('.ql320-journey')!;
const stepButton = (step: string) => journey().querySelector<HTMLButtonElement>(`[data-ql320-step="${step}"] button`)!;
const choice = (label: string) => [...journey().querySelectorAll<HTMLButtonElement>('.ql320-state-choices button')].find((button) => button.textContent === label)!;

describe('QL-320 accessible four-business front-end journey', () => {
  it.each(operatorOrganizations)('has the exact, scoped source chain for $name', (organization) => {
    const threads = inboxForOrganization(organization.id);
    const original = ql320JourneyReadback(organization.id, seedQueueForOrganization(organization.id), {});
    expect(original.state).toBe('ready');
    expect(original.thread?.organizationId).toBe(organization.id);
    expect(original.customer?.organizationId).toBe(organization.id);
    expect(original.customer?.id).toBe(customerForThread(organization.id, original.thread!.id)?.id);
    expect(original.task?.organizationId).toBe(organization.id);
    expect(threads.some((thread) => thread.id === original.task?.threadId)).toBe(true);
    expect(original.draft).toBeNull();
  });

  it('fails closed on invalid brand and wrong-company queue without borrowing another company’s fixture', () => {
    expect(ql320JourneyReadback('not-a-brand' as never, seedQueueForOrganization('yw'), {}).state).toBe('error');
    const wrong = ql320JourneyReadback('rosiedazzlers', seedQueueForOrganization('devilndove'), {});
    expect(wrong).toEqual({ state: 'error', thread: null, customer: null, task: null, draft: null });
    const mixed = seedQueueForOrganization('rosiedazzlers');
    const contaminated = { ...mixed, tasks: [...mixed.tasks, seedQueueForOrganization('yw').tasks[0]] };
    expect(ql320JourneyReadback('rosiedazzlers', contaminated, {}).state).toBe('error');
  });

  it('recovers strictly valid UNSENT local drafts and rejects a forged cross-company draft', () => {
    const draft = stageQl293Draft({}, 'rosiedazzlers', {
      threadId: 'rd-sms', purpose: 'service', templateId: 'invalid-template', text: 'Sample only', attachment: 'none'
    });
    expect(ql320JourneyReadback('rosiedazzlers', seedQueueForOrganization('rosiedazzlers'), draft).draft).toBeNull();
    const attempt = stageQl293Draft({}, 'rosiedazzlers', {
      threadId: 'rd-sms', purpose: 'service', templateId: messageTemplates('rosiedazzlers')[0].id, text: 'Example only', attachment: 'none'
    });
    const readback = ql320JourneyReadback('rosiedazzlers', seedQueueForOrganization('rosiedazzlers'), attempt);
    expect(readback.draft?.deliveryState).toBe('UNSENT_SIMULATED');
    const forged = { 'rd-sms': { version: 1, organizationId: 'yw', threadId: 'rd-sms', text: 'Cross-scope', deliveryState: 'UNSENT_SIMULATED' } } as never;
    expect(ql320JourneyReadback('rosiedazzlers', seedQueueForOrganization('rosiedazzlers'), forged).draft).toBeNull();
    expect(ql320JourneyReadback('yw', seedQueueForOrganization('yw'), attempt).draft).toBeNull();
  });

  it('navigates the actual six screens and moves focus to their visible headings', async () => {
    expect(ql320Steps.map(({ workspace }) => workspace)).toEqual(['inbox', 'contacts', 'guided_intake', 'routing_studio', 'queue', 'accessibility_review']);
    expect(host.querySelectorAll('[data-ql320-step]')).toHaveLength(6);
    for (const step of ql320Steps) {
      await act(async () => stepButton(step.workspace).click());
      expect(stepButton(step.workspace).getAttribute('aria-current')).toBe('step');
      expect(document.activeElement).toBe(host.querySelector('.ql172-context h2'));
      expect(host.querySelector('.ql172-context h2')?.textContent).toBeTruthy();
    }
    expect(host.textContent).toContain('owner');
    expect(host.querySelector('.ql299') || host.textContent?.includes('accessibility')).toBeTruthy();
  });

  it('offers distinct ready, loading, filtered-empty, error, and disabled rehearsals with real recovery controls', async () => {
    const cases = [
      ['Loading example', 'Loading demonstration', 'loading'],
      ['Empty example', 'No sample to show', 'empty'],
      ['Error example', 'Sample readback unavailable', 'error'],
      ['Disabled example', 'Actions disabled for review', 'disabled']
    ] as const;
    await act(async () => { journey().querySelector('summary')!.click(); });
    for (const [control, readback, status] of cases) {
      await act(async () => choice(control).click());
      expect(journey().textContent).toContain(readback);
      expect(journey().querySelector('.ql320-state-chip')?.className).toContain(`ql320-state-${status}`);
      expect(stepButton('inbox').disabled).toBe(true);
      const recovery = journey().querySelector<HTMLButtonElement>('.ql320-recovery-state button')!;
      await act(async () => recovery.click());
      expect(journey().querySelector('.ql320-state-chip')?.textContent).toContain('LOCAL FIXTURE READY');
      expect(stepButton('inbox').disabled).toBe(false);
    }
  });

  it('resets rehearsal state and fictional drafts on business switch, keeping company contexts separate', async () => {
    await act(async () => journey().querySelector('summary')!.click());
    await act(async () => choice('Error example').click());
    const switchButton = [...host.querySelectorAll<HTMLButtonElement>('.ql172-brand')].find((button) => button.textContent?.includes('Devil n Dove'))!;
    await act(async () => switchButton.click());
    expect(journey().getAttribute('data-ql320-journey')).toBe('devilndove');
    expect(journey().textContent).toContain('Engraved keepsake timing');
    expect(journey().textContent).not.toContain('Interior salt-stain question');
    expect(journey().querySelector('.ql320-state-chip')?.textContent).toContain('LOCAL FIXTURE READY');
  });

  it('recovers a real unsent composer edit through the journey without transmitting or persisting it', async () => {
    const buttons = [...host.querySelectorAll<HTMLButtonElement>('.ql172-nav-button')];
    const composer = buttons.find((button) => button.textContent?.includes('SMS/MMS composer'))!;
    await act(async () => composer.click());
    const templates = host.querySelector<HTMLSelectElement>('#ql196-template')!;
    expect(templates.options.length).toBeGreaterThan(1);
    await act(async () => { templates.value = templates.options[1].value; templates.dispatchEvent(new Event('change', { bubbles: true })); });
    expect(journey().textContent).toContain('A redacted, unsent browser-session draft can be resumed.');
    await act(async () => [...journey().querySelectorAll<HTMLButtonElement>('.ql320-actions button')].find((button) => button.textContent?.includes('Resume UNSENT'))!.click());
    expect(host.textContent).toContain('Unsent communications studio');
    expect(host.textContent).toContain('Recovered an unsent draft');
    expect(window.localStorage.length).toBe(0);
  });

  it('keeps responsive, high contrast, zoom, keyboard and reduced-motion boundaries visible in the delivered CSS', () => {
    const css = readFileSync('src/operator/ql320-operator-journey.css', 'utf8');
    expect(css).toContain('max-width:960px');
    expect(css).toContain('max-width:600px');
    expect(css).toContain('min-height:44px');
    expect(css).toContain('prefers-reduced-motion:reduce');
    expect(css).toContain('forced-colors:active');
    expect(css).toContain(':focus-visible');
    expect(journey().textContent).toContain('physical owner-device');
    expect(journey().textContent).toContain('DISABLED · no provider or customer action');
    expect([...journey().querySelectorAll('button')].every((button) => button.type === 'button')).toBe(true);
  });
});

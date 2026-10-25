// @vitest-environment jsdom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { readFileSync } from 'node:fs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { QL181_PREREQUISITES } from '../ql181PrivacyPilotGate';
import { OperatorShell } from '../OperatorShell';
import { Ql190IndependentReviewPacketPreview } from '../Ql190IndependentReviewPacketPreview';
import {
  QL190_PACKET_VERSION, QL190_REVIEW_FOCUS, QL190_SOURCE_DOCUMENTS,
  QL190_OPEN_EVIDENCE, QL190_MEETING_AGENDA, projectQl190Review
} from '../ql190IndependentReviewPacket';
import packetManifest from '../ql190-review-packet.json';

const clone = () => JSON.parse(JSON.stringify(packetManifest));

describe('QL-190 source-linked independent pre-pilot review model', () => {
  it('covers all 12 canonical QL-181 holds with source and reviewer evidence', () => {
    expect(QL190_PACKET_VERSION).toBe('ql190-independent-prepilot-review-packet-v1');
    expect(QL190_OPEN_EVIDENCE).toHaveLength(12);
    expect(QL181_PREREQUISITES).toHaveLength(12);
    expect(new Set(QL190_OPEN_EVIDENCE.map(row => row.id))).toEqual(
      new Set(QL181_PREREQUISITES.map(row => row.id)));
    for (const row of QL190_OPEN_EVIDENCE) {
      expect(row.state).toBe('HELD_UNVERIFIED');
      expect(row.reviewLane.length).toBeGreaterThan(8);
      expect(row.requiredArtifact.length).toBeGreaterThan(8);
    }
  });

  it('requires nine prior build sources and an agenda for external reviewers', () => {
    expect(QL190_SOURCE_DOCUMENTS.map(row => row.build)).toEqual([
      'QL-181', 'QL-182', 'QL-183', 'QL-184', 'QL-185', 'QL-186', 'QL-187', 'QL-188', 'QL-189'
    ]);
    expect(QL190_MEETING_AGENDA).toHaveLength(5);
  });

  for (const brand of ['rosiedazzlers', 'devilndove'] as const) {
    for (const focus of QL190_REVIEW_FOCUS) {
      it(`${brand} ${focus}: always held with no signoff, send or write`, () => {
        const result = projectQl190Review(brand, brand, focus);
        expect(result).toMatchObject({
          version: QL190_PACKET_VERSION, disposition: 'PACKET_REVIEW_ONLY', brandId: brand,
          selectedFocus: focus, heldCount: 12, reviewedExternally: 0, collectedOwnerApprovals: 0,
          livePilotAuthorized: false, externalReviewCompleted: false,
          realCustomerDataProcessed: false, realProviderEnabled: false,
          sourceDocuments: 9, externalWrites: 0, callsPlaced: 0, messagesSent: 0
        });
        expect(result.visibleRows).toHaveLength(focus === 'All prerequisites' ? 12 :
          QL181_PREREQUISITES.filter(row => row.category === focus).length);
        for (const item of result.visibleRows) expect(item.state).toBe('HELD_UNVERIFIED');
      });
    }
  }

  it('cannot read another business via a selected packet context', () => {
    expect(projectQl190Review('rosiedazzlers', 'devilndove', 'All prerequisites'))
      .toMatchObject({ disposition: 'CROSS_BRAND_REJECTED', brandId: null, visibleRows: [],
        sourceDocuments: 0, livePilotAuthorized: false });
  });

  it('rejects unknown brands, filters and object-coerced input', () => {
    for (const args of [
      ['other', 'rosiedazzlers', 'All prerequisites'],
      ['rosiedazzlers', 'personal', 'All prerequisites'],
      ['rosiedazzlers', 'rosiedazzlers', 'Approve pilot'],
      [{ toString: () => 'rosiedazzlers' }, 'rosiedazzlers', 'All prerequisites']
    ]) expect(projectQl190Review(args[0], args[1], args[2])).toMatchObject({
      disposition: 'INVALID_REVIEW_SCOPE', brandId: null, livePilotAuthorized: false
    });
  });

  it('rejects a forged external approval, changed state, duplicate or removed hold', () => {
    const forged = clone(); forged.ownerSignoffCaptured = true;
    expect(projectQl190Review('rosiedazzlers', 'rosiedazzlers', 'All prerequisites', forged).disposition)
      .toBe('PACKET_INTEGRITY_HOLD');
    forged.ownerSignoffCaptured = false; forged.prerequisites[0].state = 'APPROVED';
    expect(projectQl190Review('rosiedazzlers', 'rosiedazzlers', 'All prerequisites', forged).disposition)
      .toBe('PACKET_INTEGRITY_HOLD');
    forged.prerequisites[0].state = 'HELD_UNVERIFIED'; forged.prerequisites[11].id = forged.prerequisites[0].id;
    expect(projectQl190Review('rosiedazzlers', 'rosiedazzlers', 'All prerequisites', forged).disposition)
      .toBe('PACKET_INTEGRITY_HOLD');
    forged.prerequisites.pop();
    expect(projectQl190Review('rosiedazzlers', 'rosiedazzlers', 'All prerequisites', forged).disposition)
      .toBe('PACKET_INTEGRITY_HOLD');
  });

  it('rejects unexpected fields or missing versioned source references', () => {
    const forged = clone(); forged.enableSms = true;
    expect(projectQl190Review('devilndove', 'devilndove', 'All prerequisites', forged).disposition)
      .toBe('PACKET_INTEGRITY_HOLD');
    const noSource = clone(); noSource.sourceDocuments.pop();
    expect(projectQl190Review('devilndove', 'devilndove', 'All prerequisites', noSource).disposition)
      .toBe('PACKET_INTEGRITY_HOLD');
    const replacedSource = clone(); replacedSource.sourceDocuments[3].path = 'docs/QL-184_FAKE.md';
    expect(projectQl190Review('devilndove', 'devilndove', 'All prerequisites', replacedSource).disposition)
      .toBe('PACKET_INTEGRITY_HOLD');
  });

  it('withholds content for malformed or absent manifest', () => {
    for (const bad of [null, [], false, {}, { ...clone(), prerequisites: [null] }])
      expect(projectQl190Review('rosiedazzlers', 'rosiedazzlers', 'All prerequisites', bad).disposition)
        .toBe('PACKET_INTEGRITY_HOLD');
  });
});

let host: HTMLDivElement;
let root: Root;
beforeEach(async () => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  host = document.createElement('div'); document.body.append(host);
  root = createRoot(host);
  await act(async () => root.render(<Ql190IndependentReviewPacketPreview brandId="rosiedazzlers" />));
});
afterEach(async () => { await act(async () => root.unmount()); host.remove(); vi.restoreAllMocks(); });

async function select(id: string, value: string) {
  await act(async () => { const el = host.querySelector<HTMLSelectElement>(`#${id}`)!;
    el.value = value; el.dispatchEvent(new Event('change', { bubbles: true })); });
}

describe('QL-190 accessible read-only packet UI', () => {
  it('shows all holds, nine source links, help icons and denial without approval controls', () => {
    expect(host.textContent).toContain('Independent pre-pilot review packet');
    expect(host.textContent).toContain('LIVE PILOT HELD');
    expect(host.textContent).toContain('12 / 12');
    expect(host.textContent).toContain('PACKET REVIEW ONLY');
    expect(host.textContent).toContain('Owner approvals: 0');
    expect(host.querySelectorAll('.ql190-source-list a')).toHaveLength(9);
    expect(host.querySelectorAll('.ql190-gate-list article')).toHaveLength(12);
    expect(host.querySelectorAll('.ql190-help summary')).toHaveLength(2);
    expect(host.querySelectorAll('.ql190-controls label[for]')).toHaveLength(2);
    expect(host.querySelectorAll('button, input[type="checkbox"]')).toHaveLength(0);
    expect(host.querySelector('.ql190-outcome[role="status"][aria-live="polite"]')).not.toBeNull();
  });

  it('source links use a traceable GitHub path with safe external-link properties', () => {
    for (const el of host.querySelectorAll<HTMLAnchorElement>('.ql190-source-list a')) {
      expect(el.href).toContain('https://github.com/RosevearCreations/rosevear-comms-hub/blob/main/docs/');
      expect(el.rel).toBe('noopener noreferrer');
      expect(el.target).toBe('_blank');
    }
  });

  it('changes review focus without marking any prerequisite approved or writing data', async () => {
    const network = vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('offline'));
    const write = vi.spyOn(Storage.prototype, 'setItem');
    const remove = vi.spyOn(Storage.prototype, 'removeItem');
    await select('ql190-focus', 'Consent & privacy');
    expect(host.querySelectorAll('.ql190-gate-list article')).toHaveLength(3);
    expect(host.textContent).toContain('all 12 are still HELD_UNVERIFIED');
    await select('ql190-brand', 'devilndove');
    expect(host.textContent).toContain('CROSS BRAND REJECTED');
    expect(host.querySelector('.ql190-gate-list')).toBeNull();
    expect(network).not.toHaveBeenCalled();
    expect(write).not.toHaveBeenCalled();
    expect(remove).not.toHaveBeenCalled();
  });

  it('resets independent review context when the actual business changes', async () => {
    await select('ql190-focus', 'Owner governance');
    await act(async () => root.render(<Ql190IndependentReviewPacketPreview key="switch" brandId="devilndove" />));
    expect(host.querySelector<HTMLSelectElement>('#ql190-brand')?.value).toBe('devilndove');
    expect(host.querySelector<HTMLSelectElement>('#ql190-focus')?.value).toBe('All prerequisites');
    expect(host.querySelectorAll('.ql190-gate-list article')).toHaveLength(12);
  });

  it('is accessible inside the Safety & hold review workspace with QL-181 and QL-186', async () => {
    await act(async () => root.render(<OperatorShell key="full-shell" />));
    const button = [...host.querySelectorAll<HTMLButtonElement>('.ql172-nav-button')]
      .find(item => item.textContent?.includes('Safety & hold review'))!;
    await act(async () => button.click());
    expect(host.querySelector('.ql190-packet')).not.toBeNull();
    expect(host.querySelector('.ql186-consent')).not.toBeNull();
    expect(host.querySelector('.ql181-gate')).not.toBeNull();
  });

  it('maintains touch-sized controls, focus indication, mobile layout and forced contrast', () => {
    const css = readFileSync('src/operator/ql190-independent-review.css', 'utf8');
    for (const value of ['min-height:44px', 'max-width:700px', 'max-width:375px',
      ':focus-visible', 'forced-colors:active']) expect(css).toContain(value);
  });
});

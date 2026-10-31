// @vitest-environment jsdom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { readFileSync } from 'node:fs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { OperatorShell } from '../OperatorShell';
import { QL270_SOURCES } from '../ql270ConnectionCentre';
import { ql276CaptureOwnerObservation } from '../ql276EvidenceIntake';
import { QL277_OBSERVED_AT, QL277_PUBLIC_SOURCE_RECHECK, ql277CompareAccessibility } from '../ql277DriftReview';
import { QL278_CUSTODY_PRECONDITIONS, QL278_OBSERVED_AT, QL278_PUBLIC_SOURCE_RECHECK,
  ql278CreateRetestTicket, ql278FollowupAging, ql278PinnedProofUrl, ql278PrepareCustodyPacket,
  ql278PrepareFollowup, ql278RecordRetest, ql278ReviewPacket } from '../ql278FollowupDesk';

let host: HTMLDivElement;
let root: Root;
beforeEach(async () => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  localStorage.clear(); host = document.createElement('div'); document.body.append(host);
  root = createRoot(host); await act(async () => root.render(<OperatorShell />));
});
afterEach(async () => {
  await act(async () => root.unmount()); host.remove(); vi.restoreAllMocks();
  Object.defineProperty(navigator, 'clipboard', { configurable:true, value:undefined });
});
function button(label: string) {
  const match = [...host.querySelectorAll<HTMLButtonElement>('button')].find(item =>
    item.getAttribute('aria-label') === label || item.textContent?.includes(label));
  if (!match) throw Error(`Missing button ${label}`);
  return match;
}
function select(selector: string, value: string) {
  const field = host.querySelector<HTMLSelectElement>(selector)!;
  field.value = value; field.dispatchEvent(new Event('change', { bubbles:true }));
}
function input(selector: string, value: string) {
  const field = host.querySelector<HTMLInputElement | HTMLTextAreaElement>(selector)!;
  const descriptor = Object.getOwnPropertyDescriptor(field instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype, 'value')!;
  descriptor.set!.call(field, value);
  field.dispatchEvent(new Event('input', { bubbles:true }));
  field.dispatchEvent(new Event('change', { bubbles:true }));
}
async function openDesk() {
  await act(async () => button('IT Command').click());
  await act(async () => button('Regression retests & proof follow-up').click());
}
function observed(outcome: 'issue' | 'observed', at: string, device: 'desktop'|'tablet' = 'desktop') {
  const r = ql276CaptureOwnerObservation({ checkId:'keyboard', outcome, device,
    assistiveMethod:'keyboard', note:'Checked actual keyboard navigation order on this local device.' }, new Date(at));
  if (!r.ok) throw Error(r.reason);
  return r.record;
}

describe('QL-278 owner regression retest queue, original custody gates and six-source aging', () => {
  it('pins six current public source states and distinguishes three unchanged from three moved commits', () => {
    expect(QL278_OBSERVED_AT).toBe('2026-10-31T02:13:35Z');
    expect(QL278_PUBLIC_SOURCE_RECHECK).toHaveLength(6);
    expect(new Set(QL278_PUBLIC_SOURCE_RECHECK.map(row=>row.source))).toEqual(new Set(QL270_SOURCES.map(item=>item.id)));
    for (const row of QL278_PUBLIC_SOURCE_RECHECK) {
      expect(row.sha).toMatch(/^[a-f0-9]{40}$/);
      expect(row.http).toBe(404);
      expect(ql278PinnedProofUrl(row.source)).toContain(`ref=${row.sha}`);
      expect(ql278PinnedProofUrl(row.source)).toContain('docs/integration/ql246-source-proof.json');
    }
    const now = ql278FollowupAging('2026-10-31T03:13:35Z');
    expect(now).toMatchObject({ changed:3, unchanged:3, missing:6, total:6,
      snapshot:'PINNED_RECENT', aging:'WITHIN_24H', notificationsSent:0, originalReceiptsVerified:0,
      ownerApprovals:0, release:'DISCONNECTED / HOLD' });
    expect(now.rows.filter(row=>row.changed).map(row=>row.source)).toEqual(['devilndove','rosiedazzlers','rosevear-ai-hub']);
    expect(now.rows.filter(row=>!row.changed).map(row=>row.source)).toEqual(['ai-data-platform','yw','icamp']);
    expect(now.rows.every(row=>row.dispatch==='DRAFT_NOT_SENT' && row.http===404)).toBe(true);
    expect(QL277_PUBLIC_SOURCE_RECHECK).toHaveLength(6);
  });

  it('calculates elapsed time, follow-up due, escalation and invalid clock without making network calls', () => {
    expect(QL277_OBSERVED_AT).toBe('2026-10-31T01:50:32Z');
    expect(ql278FollowupAging('2026-11-01T02:00:00Z')).toMatchObject({ aging:'FOLLOW_UP_DUE', snapshot:'PINNED_RECENT' });
    expect(ql278FollowupAging('2026-11-02T02:00:00Z')).toMatchObject({ aging:'ESCALATION_REVIEW_DUE', snapshot:'PUBLIC_RECHECK_DUE' });
    expect(ql278FollowupAging('2026-10-31T01:00:00Z')).toMatchObject({ aging:'CLOCK_REVIEW', snapshot:'CLOCK_REVIEW', ageHours:null });
    expect(ql278FollowupAging('invalid').aging).toBe('CLOCK_REVIEW');
    expect(ql278FollowupAging(QL278_OBSERVED_AT).nextPublicCheckDueAt).toBe('2026-11-01T02:13:35.000Z');
    expect(()=>ql278PinnedProofUrl('invented' as never)).toThrow('UNKNOWN_QL278_SOURCE');
  });

  it('queues reported regressions, unresolved issues and noncomparable results but never automatically closes them', () => {
    const baseline = observed('observed','2026-10-31T02:14:00Z');
    const regression = ql278CreateRetestTicket(ql277CompareAccessibility(baseline, observed('issue','2026-10-31T02:15:00Z')));
    expect(regression.ok).toBe(true);
    if (!regression.ok) throw Error(regression.reason);
    expect(regression.ticket).toMatchObject({ priority:'HIGH_REGRESSION', retest:null, disposition:'INDEPENDENT_REVIEW_REQUIRED', accepted:false });
    const unresolved = ql278CreateRetestTicket(ql277CompareAccessibility(observed('issue','2026-10-31T02:14:00Z'),observed('issue','2026-10-31T02:15:00Z')));
    expect(unresolved.ok && unresolved.ticket.priority).toBe('UNRESOLVED_ISSUE');
    const mismatch = ql278CreateRetestTicket(ql277CompareAccessibility(baseline,observed('issue','2026-10-31T02:15:00Z','tablet')));
    expect(mismatch.ok && mismatch.ticket.priority).toBe('ENVIRONMENT_RECHECK');
    const order = ql278CreateRetestTicket(ql277CompareAccessibility(baseline,observed('issue','2026-10-31T02:13:00Z')));
    expect(order.ok && order.ticket.priority).toBe('TIME_ORDER_REVIEW');
    expect(ql278CreateRetestTicket(ql277CompareAccessibility(observed('issue','2026-10-31T02:14:00Z'),observed('observed','2026-10-31T02:15:00Z'))).ok).toBe(false);
    expect(ql278CreateRetestTicket(ql277CompareAccessibility(baseline,observed('observed','2026-10-31T02:15:00Z'))).ok).toBe(false);
    const retest = ql278RecordRetest(regression.ticket, observed('observed','2026-10-31T02:16:00Z'));
    expect(retest.ok).toBe(true);
    if (!retest.ok) throw Error(retest.reason);
    expect(retest).toMatchObject({ finding:'NO_ISSUE_REPORTED_REVIEW_REQUIRED',ticket:{ accepted:false, disposition:'INDEPENDENT_REVIEW_REQUIRED' } });
  });

  it('rejects non-later, wrong-check, mismatched-device and invalid owner retests', () => {
    const r = ql278CreateRetestTicket(ql277CompareAccessibility(observed('observed','2026-10-31T02:14:00Z'),observed('issue','2026-10-31T02:15:00Z')));
    if (!r.ok) throw Error(r.reason);
    expect(ql278RecordRetest(r.ticket, observed('issue','2026-10-31T02:15:00Z'))).toMatchObject({ ok:false, reason:'TIME_ORDER_REVIEW' });
    expect(ql278RecordRetest(r.ticket, observed('issue','2026-10-31T02:16:00Z','tablet'))).toMatchObject({ ok:false, reason:'ENVIRONMENT_MISMATCH' });
    expect(ql278RecordRetest(r.ticket, { ...observed('issue','2026-10-31T02:16:00Z'),checkId:'reader' })).toMatchObject({ ok:false,reason:'DIFFERENT_CHECK' });
    expect(ql278RecordRetest(r.ticket, { ...observed('issue','2026-10-31T02:16:00Z'),status:'IMPROPER' as never })).toMatchObject({ ok:false,reason:'INVALID_OBSERVATION' });
    expect(ql278RecordRetest(r.ticket, observed('issue','2026-10-31T02:16:00Z'))).toMatchObject({ ok:true,finding:'ISSUE_REPORTED_AGAIN',ticket:{accepted:false} });
  });

  it('enforces seven independent custody preconditions and does not authenticate reference claims', () => {
    expect(QL278_CUSTODY_PRECONDITIONS.map(row=>row.key)).toEqual(['original','ancestry','signer','custodian','witness','tenant','owner']);
    const result = ql278PrepareCustodyPacket('rosiedazzlers','CUST-278-CLAIM',new Date('2026-10-31T02:20:00Z'));
    expect(result.ok).toBe(true);
    if (!result.ok) throw Error(result.reason);
    expect(result.packet).toMatchObject({ source:'rosiedazzlers',reference:'CUST-278-CLAIM', verified:0,
      state:'DRAFT_NOT_SENT',acceptance:'BLOCKED_ORIGINAL_EVIDENCE_MISSING' });
    expect(result.packet.checks).toHaveLength(7);
    expect(result.packet.checks.map(row=>row.status)).not.toContain('VERIFIED');
    expect(result.packet.sha).toBe('e7e222f5324b931f5de97d0c279f77bc082a9576');
    expect(ql278PrepareCustodyPacket('rosiedazzlers','',new Date()).ok).toBe(true);
    expect(ql278PrepareCustodyPacket('rosiedazzlers','Bearer-a-secret',new Date()).ok).toBe(false);
    expect(ql278PrepareCustodyPacket('not-a-source' as never,'',new Date()).ok).toBe(false);
    expect(ql278PrepareCustodyPacket('rosiedazzlers','',new Date('invalid')).ok).toBe(false);
  });

  it('creates per-source aged follow-up drafts with no actual delivery or gateway authorization', () => {
    const draft = ql278PrepareFollowup('devilndove',new Date('2026-11-02T03:00:00Z'));
    expect(draft).toMatchObject({ source:'devilndove',finding:'NEW_SHA_PROOF_STILL_MISSING',
      followUp:'ESCALATION_REVIEW_DUE',state:'DRAFT_NOT_SENT' });
    expect(ql278PrepareFollowup('icamp',new Date('2026-10-31T03:00:00Z'))).toMatchObject({ finding:'SAME_SHA_PROOF_STILL_MISSING',state:'DRAFT_NOT_SENT' });
    const packet = ql278ReviewPacket([],[],[draft],'2026-10-31T03:00:00Z');
    expect(packet).toContain('3 changed / 3 unchanged');
    expect(packet).toContain('6/6 proof HTTP 404');
    expect(packet).toContain('Notifications sent: 0');
    expect(packet).toContain('TEST-only owner authorization: NOT GIVEN');
    expect(packet).toContain('DISCONNECTED / HOLD');
    expect(()=>ql278PrepareFollowup('unknown' as never,new Date())).toThrow('UNKNOWN_FOLLOWUP_SOURCE');
    expect(()=>ql278PrepareFollowup('icamp',new Date('invalid'))).toThrow('INVALID_FOLLOWUP_TIME');
  });

  it('mounts the real command desk and queues a local reported regression without persistence', async () => {
    await openDesk();
    expect(host.querySelector('[data-ql278-desk]')).not.toBeNull();
    expect(button('Record comparable retest').disabled).toBe(true);
    await act(async () => select('#ql278-outcome','observed'));
    await act(async () => input('#ql278-note','The keyboard focus order worked during the first device check.'));
    await act(async () => button('Capture fresh baseline').click());
    await act(async () => select('#ql278-outcome','issue'));
    await act(async () => input('#ql278-note','The next keyboard check reported a missing focus outline.'));
    await act(async () => button('Compare & queue if needed').click());
    expect(host.textContent).toContain('HIGH REGRESSION');
    expect(button('Record comparable retest').disabled).toBe(false);
    expect(host.querySelectorAll('.ql277-results article')).toHaveLength(1);
    expect(localStorage.length).toBe(0);
  });

  it('offers independent original-proof gates and validates only nonsecret custodian reference format', async () => {
    await openDesk(); await act(async () => button('02 Original custody preconditions').click());
    expect(host.querySelectorAll('.ql278-gate-list li')).toHaveLength(7);
    await act(async () => select('#ql278-source','devilndove'));
    await act(async () => input('#ql278-reference','CUST-278-FOLLOWUP'));
    await act(async () => button('Prepare independent-verification request draft').click());
    expect(host.textContent).toContain('BLOCKED ORIGINAL EVIDENCE MISSING');
    expect(host.textContent).toContain('0/7 verified');
    expect(host.querySelector<HTMLTextAreaElement>('#ql278-packet')?.value).toContain('CUST-278-FOLLOWUP');
    expect(localStorage.length).toBe(0);
  });

  it('shows source-specific SHA drift and produces only a copyable non-dispatched follow-up', async () => {
    await openDesk(); await act(async () => button('03 Six-app follow-up aging').click());
    expect(host.querySelectorAll('.ql278-aging-row:not(.head)')).toHaveLength(6);
    expect([...host.querySelectorAll<HTMLAnchorElement>('.ql278-aging-row a')].every(link=>link.href.includes('ref=')&&link.rel.includes('noopener'))).toBe(true);
    await act(async () => select('#ql278-aging-source','rosevear-ai-hub'));
    await act(async () => button('Prepare local aging follow-up draft').click());
    expect(host.textContent).toContain('NEW SHA PROOF STILL MISSING');
    expect(host.textContent).toContain('DRAFT NOT SENT');
    await act(async () => button('Refresh elapsed time only').click());
    expect(host.textContent).toContain('GitHub was NOT queried again');
    expect(localStorage.length).toBe(0);
  });

  it('copies local packet, reports clipboard denial and clears only transient operator drafts', async () => {
    await openDesk();
    expect(host.querySelector<HTMLTextAreaElement>('#ql278-packet')?.readOnly).toBe(true);
    await act(async () => button('Copy unsent QL-278 packet').click());
    expect(host.textContent).toContain('Clipboard unavailable');
    const copied = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:copied}});
    await act(async () => button('Copy unsent QL-278 packet').click());
    expect(copied).toHaveBeenCalledOnce();
    expect(copied.mock.calls[0][0]).toContain('QL-278');
    await act(async () => button('Clear local drafts').click());
    expect(host.textContent).toContain('All memory-only QL-278 review drafts cleared');
    expect(localStorage.length).toBe(0);
  });

  it('keeps mobile layouts, visible keyboard focus, forced colors and reduced motion support', () => {
    const css = readFileSync('src/operator/ql278-followup-desk.css','utf8');
    expect(css).toContain('max-width:480px');
    expect(css).toContain(':focus-visible');
    expect(css).toContain('forced-colors:active');
    expect(css).toContain('prefers-reduced-motion:reduce');
  });
});

import { useState } from 'react';
import type { OperatorOrganization, OperatorWorkspace } from './ql191Organizations';
import { getDashboardQueue } from './ql191DashboardData';

/**
 * Explicitly synthetic fallback for iCamp/YW, which do not have QL-004 local
 * repositories or the brand-specific QL-174–190 preview fixtures yet.
 */
export function Ql191AdditionalOrganizationPreview({ organization, workspace }: {
  organization: OperatorOrganization;
  workspace: Exclude<OperatorWorkspace, 'dashboard'>;
}) {
  const items = getDashboardQueue(organization.id);
  const [selectedId, setSelectedId] = useState(items[0]?.id ?? '');
  const item = items.find((entry) => entry.id === selectedId) ?? items[0];

  return (
    <section className="ql191-additional-preview ql191-panel" aria-label={`${organization.name} ${workspace} demonstration`}>
      <p className="ql191-eyebrow">QL-191 · {organization.name} · synthetic workspace</p>
      <h3>{workspace === 'inbox' ? 'Inbox preview' : workspace === 'samples' ? 'Workflow examples' : workspace === 'telephony' ? 'Phone/SMS planning' : 'Safety review'}</h3>
      <p className="ql191-synthetic-banner" role="note">This company workspace is not yet integrated. No real customer, booking, property, operator or phone information is loaded.</p>
      {(workspace === 'inbox' || workspace === 'samples') && (
        <div className="ql191-additional-layout">
          <div role="group" aria-label="Select fabricated workflow">
            {items.map((entry) => (
              <button type="button" className={item.id === entry.id ? 'ql191-queue-entry active' : 'ql191-queue-entry'} aria-pressed={item.id === entry.id} key={entry.id} onClick={() => setSelectedId(entry.id)}>
                <span>{entry.channel}</span><strong>{entry.title}</strong>
              </button>
            ))}
          </div>
          <article className="ql191-queue-detail" aria-live="polite"><h4>{item.title}</h4><p>{item.detail}</p><p>{item.action} — planning only; no connected intake or message dispatch.</p></article>
        </div>
      )}
      {workspace === 'telephony' && <p>Phone numbers, IVR, provider credentials, callbacks, live messages, calls and recording remain unconfigured and disabled. QL-195 provides a separate mock phone desk; QL-204 plans further routing.</p>}
      {workspace === 'evidence' && <p>Existing QL-190 records concern the earlier two-brand synthetic review. They do not approve iCamp or YW tenants. All twelve real-pilot requirements remain held; independent tenant and provider checks are still required.</p>}
    </section>
  );
}

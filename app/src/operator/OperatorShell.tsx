import { useEffect, useRef, useState } from 'react';
import App from '../App';
import { brands } from '../data/brands';
import type { BrandId } from '../types';
import { DisabledInterfacePreview } from './DisabledInterfacePreview';
import { DisabledOperatorConsole } from './DisabledOperatorConsole';
import { Ql174BrandSafeTriagePreview } from './Ql174BrandSafeTriagePreview';
import { Ql175ContactContextPreview } from './Ql175ContactContextPreview';
import { Ql176ConversationTimelinePreview } from './Ql176ConversationTimelinePreview';
import { Ql177BrandIntakeHandoffPreview } from './Ql177BrandIntakeHandoffPreview';
import { Ql178OperatorTaskSimulation } from './Ql178OperatorTaskSimulation';
import { Ql179PhoneSmsEventEmulator } from './Ql179PhoneSmsEventEmulator';
import { Ql180RoutingIvrPreview } from './Ql180RoutingIvrPreview';
import { Ql181PrivacyPilotGatePreview } from './Ql181PrivacyPilotGatePreview';
import { Ql182SyntheticJourneyPreview } from './Ql182SyntheticJourneyPreview';
import { Ql183OperatorUsabilityPreview } from './Ql183OperatorUsabilityPreview';
import { Ql184BrandWorkspacePermissionPreview } from './Ql184BrandWorkspacePermissionPreview';
import { Ql185PrivateDataBlueprintPreview } from './Ql185PrivateDataBlueprintPreview';
import { Ql186ConsentMessageClassificationPreview } from './Ql186ConsentMessageClassificationPreview';
import { Ql187ProviderCostPreview } from './Ql187ProviderCostPreview';
import { Ql093SafeReadPreview } from './Ql093SafeReadPreview';
import type { Ql183Feedback } from './ql183OperatorUsabilityAcceptance';
import './operator-shell.css';

type Workspace = 'inbox' | 'samples' | 'evidence' | 'telephony';

const workspaces: ReadonlyArray<{ id: Workspace; label: string; description: string }> = [
  { id: 'inbox', label: 'Local inbox', description: 'Conversations, contacts, tasks and intakes' },
  { id: 'samples', label: 'Synthetic conversations', description: 'Brand-safe triage, unsent drafts, mock intake handoffs and follow-up tasks' },
  { id: 'evidence', label: 'Safety & hold review', description: 'Synthetic evidence and unresolved prerequisites' },
  { id: 'telephony', label: 'Phone/SMS safety', description: 'Mock-only phone/SMS event emulator, replay and disabled provider safeguards' }
];

const firstBrand = brands.some((brand) => brand.id === import.meta.env.VITE_DEFAULT_BRAND)
  ? import.meta.env.VITE_DEFAULT_BRAND as BrandId
  : 'rosiedazzlers';

export function OperatorShell() {
  const [brandId, setBrandId] = useState<BrandId>(firstBrand);
  const [usabilityFeedback, setUsabilityFeedback] = useState<Record<string, Ql183Feedback>>({});
  const [workspace, setWorkspace] = useState<Workspace>('inbox');
  const activeBrand = brands.find((brand) => brand.id === brandId) ?? brands[0];
  const activeWorkspace = workspaces.find((entry) => entry.id === workspace) ?? workspaces[0];
  const headingRef = useRef<HTMLHeadingElement>(null);
  const previouslySelected = useRef<Workspace | null>(null);

  function changeBrand(nextBrand: BrandId) {
    if (nextBrand !== brandId) setUsabilityFeedback({});
    setBrandId(nextBrand);
  }

  // Move focus to the visible workspace heading after an explicit navigation
  // change, while leaving initial page-load focus untouched.
  useEffect(() => {
    if (previouslySelected.current && previouslySelected.current !== workspace) headingRef.current?.focus();
    previouslySelected.current = workspace;
  }, [workspace]);

  return (
    <div className="ql172-shell">
      <a className="ql172-skip-link" href="#ql172-workspace">Skip to operator workspace</a>
      <header className="ql172-header">
        <div>
          <p className="ql172-kicker">Rosevear Comms Hub · QL-172</p>
          <h1>Operator workspace</h1>
          <p>One preview workspace for Rosie Dazzlers and Devil n Dove.</p>
        </div>
        <div className="ql172-status" role="status">
          <strong>DISABLED PREVIEW</strong>
          <span>Only synthetic samples and browser-local demo records</span>
        </div>
      </header>

      <div className="ql172-layout">
        <aside className="ql172-sidebar" aria-label="Workspace controls">
          <div className="ql172-brand-group" role="group" aria-label="Active business context">
            <h2>Business</h2>
            {brands.map((brand) => (
              <button
                className={brand.id === brandId ? 'ql172-brand active' : 'ql172-brand'}
                key={brand.id}
                type="button"
                aria-pressed={brand.id === brandId}
                onClick={() => changeBrand(brand.id)}
              >
                <span>{brand.displayName}</span>
                <small>{brand.businessType}</small>
              </button>
            ))}
          </div>
          <nav className="ql172-navigation" aria-label="Operator workspaces">
            <h2>Workspaces</h2>
            {workspaces.map((entry) => (
              <button
                className={entry.id === workspace ? 'ql172-nav-button active' : 'ql172-nav-button'}
                type="button"
                key={entry.id}
                aria-current={entry.id === workspace ? 'page' : undefined}
                aria-controls="ql172-workspace"
                onClick={() => setWorkspace(entry.id)}
              >
                <strong>{entry.label}</strong>
                <small>{entry.description}</small>
              </button>
            ))}
          </nav>
          <p className="ql172-sidebar-warning">No live calls, SMS, owner approvals, or customer-data processing is authorized.</p>
        </aside>

        <main id="ql172-workspace" tabIndex={-1} className="ql172-main" aria-label="Selected operator workspace">
          <div className="ql172-context">
            <div>
              <p className="ql172-kicker" aria-live="polite" aria-atomic="true">{activeBrand.displayName} · {activeWorkspace.label}</p>
              <h2 tabIndex={-1} ref={headingRef}>{activeWorkspace.label}</h2>
              <p>{activeWorkspace.description}</p>
            </div>
            <span className="ql172-context-badge">Preview only · no dispatch</span>
          </div>
          {workspace === 'inbox' && (
            <>
              <p className="ql172-local-warning" role="note">QL-004 is a browser-local demonstration. Do not enter real names, phone numbers, messages, or owner decisions; edits and exports affect local demo data only.</p>
              <App activeBrandId={brandId} onBrandChange={changeBrand} embedded />
            </>
          )}
          {workspace === 'samples' && (
            <>
              <Ql174BrandSafeTriagePreview brandId={brandId} />
              <Ql175ContactContextPreview key={brandId} brandId={brandId} />
              <Ql176ConversationTimelinePreview key={brandId} brandId={brandId} />
              <Ql177BrandIntakeHandoffPreview key={`intake-${brandId}`} brandId={brandId} />
              <Ql178OperatorTaskSimulation key={`tasks-${brandId}`} brandId={brandId} />
              <DisabledInterfacePreview embedded brandId={brandId} onBrandChange={changeBrand} />
            </>
          )}
          {workspace === 'evidence' && (
            <>
              <Ql186ConsentMessageClassificationPreview key={`consent-message-${brandId}`} brandId={brandId} />
              <Ql185PrivateDataBlueprintPreview key={`private-data-${brandId}`} brandId={brandId} />
              <Ql184BrandWorkspacePermissionPreview key={`permission-${brandId}`} brandId={brandId} />
              <Ql183OperatorUsabilityPreview key={`usability-${brandId}`} brandId={brandId}
                feedback={usabilityFeedback} onFeedbackChange={setUsabilityFeedback} />
              <Ql182SyntheticJourneyPreview key={`journey-${brandId}`} brandId={brandId} />
              <Ql181PrivacyPilotGatePreview key={`privacy-${brandId}`} brandId={brandId} />
              <Ql093SafeReadPreview embedded brandId={brandId} onBrandChange={changeBrand} />
            </>
          )}
          {workspace === 'telephony' && (
            <>
              <Ql187ProviderCostPreview key={`provider-cost-${brandId}`} brandId={brandId} />
              <Ql179PhoneSmsEventEmulator key={`phone-sms-${brandId}`} brandId={brandId} />
              <Ql180RoutingIvrPreview key={`ivr-${brandId}`} brandId={brandId} />
              <DisabledOperatorConsole embedded />
            </>
          )}
        </main>
      </div>
    </div>
  );
}

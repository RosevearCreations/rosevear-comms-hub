import { useEffect, useRef, useState } from 'react';
import App from '../App';
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
import { Ql188SecurityHarnessPreview } from './Ql188SecurityHarnessPreview';
import { Ql189OperationsSafetyPreview } from './Ql189OperationsSafetyPreview';
import { Ql190IndependentReviewPacketPreview } from './Ql190IndependentReviewPacketPreview';
import { Ql191OperatorDashboard } from './Ql191OperatorDashboard';
import { Ql191AdditionalOrganizationPreview } from './Ql191AdditionalOrganizationPreview';
import { findOperatorOrganization, initialOperatorOrganization, operatorOrganizations, type OperatorWorkspace, type OrganizationId } from './ql191Organizations';
import { Ql093SafeReadPreview } from './Ql093SafeReadPreview';
import type { Ql183Feedback } from './ql183OperatorUsabilityAcceptance';
import './operator-shell.css';

const workspaces: ReadonlyArray<{ id: OperatorWorkspace; label: string; description: string }> = [
  { id: 'dashboard', label: 'Dashboard', description: 'Company overview, synthetic activity and quick navigation' },
  { id: 'inbox', label: 'Local inbox', description: 'Conversations, contacts, tasks and intakes' },
  { id: 'samples', label: 'Synthetic conversations', description: 'Brand-safe triage, unsent drafts, mock intake handoffs and follow-up tasks' },
  { id: 'evidence', label: 'Safety & hold review', description: 'Synthetic evidence and unresolved prerequisites' },
  { id: 'telephony', label: 'Phone/SMS safety', description: 'Mock-only phone/SMS event emulator, replay and disabled provider safeguards' }
];

const firstOrganization = initialOperatorOrganization(import.meta.env.VITE_DEFAULT_BRAND).id;

export function OperatorShell() {
  const [organizationId, setOrganizationId] = useState<OrganizationId>(firstOrganization);
  const [usabilityFeedback, setUsabilityFeedback] = useState<Record<string, Ql183Feedback>>({});
  const [workspace, setWorkspace] = useState<OperatorWorkspace>('dashboard');
  const organization = findOperatorOrganization(organizationId) ?? operatorOrganizations[0];
  const brandId = organization.legacyBrandId;
  const activeWorkspace = workspaces.find((entry) => entry.id === workspace) ?? workspaces[0];
  const headingRef = useRef<HTMLHeadingElement>(null);
  const previouslySelected = useRef<OperatorWorkspace | null>(null);

  function changeOrganization(nextOrganization: OrganizationId) {
    if (nextOrganization !== organizationId) setUsabilityFeedback({});
    setOrganizationId(nextOrganization);
  }

  function changeBrand(nextBrand: BrandId) { changeOrganization(nextBrand); }

  // Move focus to the visible workspace heading after an explicit navigation
  // change, while leaving initial page-load focus untouched.
  useEffect(() => {
    if (previouslySelected.current && previouslySelected.current !== workspace) headingRef.current?.focus();
    previouslySelected.current = workspace;
  }, [workspace]);

  return (
    <div className="ql172-shell" data-organization={organization.id} data-ql191-release="ql191-four-organization-console-v2">
      <a className="ql172-skip-link" href="#ql172-workspace">Skip to operator workspace</a>
      <header className="ql172-header">
        <div>
          <p className="ql172-kicker">Rosevear Comms Hub · QL-191</p>
          <h1>Communications command centre</h1>
          <p>One operator console for Rosie Dazzlers, Devil n Dove, iCamp and YW.</p>
        </div>
        <div className="ql172-status" role="status">
          <strong>DISABLED PREVIEW</strong>
            <span>Only fabricated samples and browser-local demo records. No live integrations.</span>
        </div>
      </header>

      <div className="ql172-layout">
        <aside className="ql172-sidebar" aria-label="Workspace controls">
          <div className="ql172-brand-group" role="group" aria-label="Active company context">
            <h2>Company</h2>
            {operatorOrganizations.map((entry) => (
              <button
                className={entry.id === organizationId ? 'ql172-brand active' : 'ql172-brand'}
                key={entry.id}
                type="button"
                aria-pressed={entry.id === organizationId}
                onClick={() => changeOrganization(entry.id)}
              >
                <span>{entry.name}</span>
                <small>{entry.businessType}</small>
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
              <p className="ql172-kicker" aria-live="polite" aria-atomic="true">{organization.name} · {activeWorkspace.label}</p>
              <h2 tabIndex={-1} ref={headingRef}>{activeWorkspace.label}</h2>
              <p>{activeWorkspace.description}</p>
            </div>
            <span className="ql172-context-badge">Preview only · no dispatch</span>
          </div>
          {workspace === 'dashboard' && <Ql191OperatorDashboard key={`dashboard-${organization.id}`} organization={organization} onNavigate={setWorkspace} />}
          {workspace === 'inbox' && brandId !== null && (
            <>
              <p className="ql172-local-warning" role="note">QL-004 is a browser-local demonstration. Do not enter real names, phone numbers, messages, or owner decisions; edits and exports affect local demo data only.</p>
              <App activeBrandId={brandId} onBrandChange={changeBrand} embedded />
            </>
          )}
          {workspace === 'samples' && brandId !== null && (
            <>
              <Ql174BrandSafeTriagePreview brandId={brandId} />
              <Ql175ContactContextPreview key={brandId} brandId={brandId} />
              <Ql176ConversationTimelinePreview key={brandId} brandId={brandId} />
              <Ql177BrandIntakeHandoffPreview key={`intake-${brandId}`} brandId={brandId} />
              <Ql178OperatorTaskSimulation key={`tasks-${brandId}`} brandId={brandId} />
              <DisabledInterfacePreview embedded brandId={brandId} onBrandChange={changeBrand} />
            </>
          )}
          {workspace === 'evidence' && brandId !== null && (
            <>
              <Ql190IndependentReviewPacketPreview key={`prepilot-packet-${brandId}`} brandId={brandId} />
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
          {workspace === 'telephony' && brandId !== null && (
            <>
              <Ql189OperationsSafetyPreview key={`operations-safety-${brandId}`} brandId={brandId} />
              <Ql188SecurityHarnessPreview key={`security-harness-${brandId}`} brandId={brandId} />
              <Ql187ProviderCostPreview key={`provider-cost-${brandId}`} brandId={brandId} />
              <Ql179PhoneSmsEventEmulator key={`phone-sms-${brandId}`} brandId={brandId} />
              <Ql180RoutingIvrPreview key={`ivr-${brandId}`} brandId={brandId} />
              <DisabledOperatorConsole embedded />
            </>
          )}
          {workspace !== 'dashboard' && brandId === null && (
            <Ql191AdditionalOrganizationPreview key={`additional-${organization.id}-${workspace}`} organization={organization} workspace={workspace} />
          )}
        </main>
      </div>
    </div>
  );
}

import { useEffect, useMemo, useState } from 'react';
import type { BrandId } from '../types';
import { migrateQl173SyntheticFixtures } from '../fixtures/ql173CanonicalSynthetic';
import {
  QL175_CHANNELS, getQl175BrandContacts, simulateQl175OptOut,
  type Ql175Channel, type Ql175Scenarios
} from './ql175ContactContextConsent';
import './ql175-contact-context.css';

const channelLabels: Record<Ql175Channel, string> = { sms: 'SMS', voice: 'Voice calls', email: 'Email' };

export function Ql175ContactContextPreview({ brandId }: { brandId: BrandId }) {
  const migration = useMemo(() => migrateQl173SyntheticFixtures(), []);
  const [scenario, setScenario] = useState<Ql175Scenarios>({});
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [notice, setNotice] = useState('Every channel is UNKNOWN until independently verified consent evidence exists. No such evidence is present.');
  const contacts = useMemo(() => getQl175BrandContacts(migration, brandId, scenario), [migration, brandId, scenario]);
  const selected = contacts.find(contact => contact.id === selectedId) ?? contacts[0];

  useEffect(() => {
    setSelectedId(null);
    setScenario({});
    setNotice('Synthetic contact view changed business. Any local consent scenario was discarded.');
  }, [brandId]);

  function changeScenario(channel: Ql175Channel, operation: 'opt_out' | 'reset') {
    if (!selected) return;
    const next = simulateQl175OptOut(migration, brandId, scenario, selected.id, channel, operation);
    if (next === scenario) {
      setNotice('Scenario blocked: this contact or consent channel was not available in the verified synthetic fixtures.');
      return;
    }
    setScenario(next);
    setNotice(operation === 'opt_out'
      ? `SIMULATED ${channelLabels[channel]} opt-out for ${selected.label}. Screen-only example; no actual consent record changed.`
      : `Reset ${channelLabels[channel]} to UNKNOWN for ${selected.label}. No real opt-in was created.`);
  }

  return (
    <section className="ql175-preview" aria-label="QL-175 synthetic contact context and consent">
      <header className="ql175-heading">
        <div>
          <p className="ql175-kicker">QL-175 · contact context</p>
          <h3>Synthetic contact profiles and consent states</h3>
          <p>Review the source-pinned history for the selected business. Possible duplicate names require human review; they are never merged.</p>
        </div>
        <strong className="ql175-mode">DISABLED PREVIEW · NO OUTBOUND PERMISSION</strong>
      </header>
      <p className="ql175-boundary" role="note">
        These are synthetic fixtures, not customers. A phone number, incoming conversation, or draft is not consent. No real contact import, message, call, SMS, email, approval or consent update is available.
      </p>
      {!migration.verified && <p className="ql175-error" role="alert">Fixture validation failed. Contact and consent previews are unavailable until reviewed.</p>}
      <div className="ql175-grid">
        <section aria-label="Synthetic contact list" className="ql175-contact-list">
          <h4>Contacts · {brandId === 'rosiedazzlers' ? 'Rosie Dazzlers' : 'Devil n Dove'}</h4>
          <p>{contacts.length} checked-in synthetic contacts</p>
          {contacts.length === 0 && <p>No verified sample contacts available.</p>}
          {contacts.map(contact => (
            <button
              key={contact.id}
              type="button"
              className={contact.id === selected?.id ? 'ql175-contact active' : 'ql175-contact'}
              aria-pressed={contact.id === selected?.id}
              onClick={() => setSelectedId(contact.id)}
            >
              <strong>{contact.label}</strong>
              <span>{contact.conversations.length} conversation(s) · {contact.followUps.length} task(s)</span>
              <small>{contact.duplicates.length ? `${contact.duplicates.length} possible duplicate(s) — REVIEW ONLY` : 'No duplicate-name candidates'}</small>
            </button>
          ))}
        </section>
        <section aria-label="Selected synthetic contact profile" className="ql175-profile">
          {selected ? (
            <>
              <p className="ql175-kicker">Unverified synthetic identity · {selected.contactType}</p>
              <h4>{selected.label}</h4>
              <dl className="ql175-facts">
                <div><dt>Identity</dt><dd>NOT VERIFIED · fixture-only</dd></div>
                <div><dt>Fixture source</dt><dd>{selected.fixture}</dd></div>
                <div><dt>Possible duplicates</dt><dd>{selected.duplicates.length ? 'Manual review needed — no merge' : 'No exact normalized-label candidates'}</dd></div>
                <div><dt>Outbound permission</dt><dd>BLOCKED across all channels</dd></div>
              </dl>

              <section className="ql175-consent" aria-label="Channel-specific synthetic consent states">
                <h5>Consent & opt-out review</h5>
                <p>No verified opt-in or opt-out evidence exists in these fixtures. UNKNOWN never means GRANTED. The opt-out button demonstrates a local screen state only.</p>
                <div className="ql175-consent-grid">
                  {QL175_CHANNELS.map(channel => {
                    const state = selected.consent.find(entry => entry.channel === channel)!;
                    return (
                      <div key={channel} className="ql175-channel">
                        <strong>{channelLabels[channel]}</strong>
                        <span className={state.state === 'opted_out' ? 'ql175-state blocked' : 'ql175-state'}>
                          {state.state === 'opted_out' ? 'OPTED OUT · SIMULATED' : 'UNKNOWN · NO EVIDENCE'}
                        </span>
                        <small>Dispatch: BLOCKED</small>
                        <button type="button" onClick={() => changeScenario(channel, state.state === 'unknown' ? 'opt_out' : 'reset')}>
                          {state.state === 'unknown' ? 'Simulate opt-out' : 'Reset to unknown'}
                        </button>
                      </div>
                    );
                  })}
                </div>
                <p className="ql175-notice" role="status" aria-live="polite">{notice}</p>
              </section>

              <section className="ql175-history" aria-label="Linked synthetic conversation history">
                <h5>Linked conversation history ({selected.conversations.length})</h5>
                {selected.conversations.length === 0 && <p>No linked sample conversations.</p>}
                <ol>
                  {selected.conversations.map(conversation => (
                    <li key={conversation.id}>
                      <strong>{conversation.subject}</strong>
                      <span>{conversation.channel.replaceAll('_', ' ')} · {conversation.status.replaceAll('_', ' ')} · {conversation.messageCount} message(s)</span>
                      <small>{conversation.lastActivityAt} · {conversation.draftState === 'UNSENT_SIMULATED' ? 'Draft UNSENT / SIMULATED' : 'No draft'}</small>
                    </li>
                  ))}
                </ol>
              </section>
              <div className="ql175-relations">
                <section aria-label="Linked synthetic follow-up tasks">
                  <h5>Follow-up tasks ({selected.followUps.length})</h5>
                  {selected.followUps.length === 0 ? <p>No sample tasks linked.</p> : selected.followUps.map(task => <p key={task.id}>{task.title} · {task.status}</p>)}
                </section>
                <section aria-label="Linked synthetic intakes">
                  <h5>Intakes ({selected.intakes.length})</h5>
                  {selected.intakes.length === 0 ? <p>No sample intakes linked.</p> : selected.intakes.map(intake => <p key={intake.id}>{intake.type} · {intake.status}</p>)}
                </section>
              </div>
              <section aria-label="Possible duplicate contact candidates" className="ql175-duplicates">
                <h5>Possible duplicates · review only</h5>
                {selected.duplicates.length === 0
                  ? <p>No same-brand, normalized-label candidates. This does not prove identity uniqueness.</p>
                  : selected.duplicates.map(candidate => <p key={candidate.otherId}>Synthetic contact {candidate.otherId}: same normalized sample label. Review only — no automatic merge.</p>)}
              </section>
            </>
          ) : <p>No synthetic contact selected. No action is possible.</p>}
        </section>
      </div>
    </section>
  );
}

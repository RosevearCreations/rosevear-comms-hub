import { useState } from 'react';
import { connectorContracts } from './ql199ConnectorContracts';
import { campDemoTenants, campIntakeFixtures, previewCampHandoff, type CampHandoffPreview } from './ql202CampConnector';
import './ql202-camp-connector.css';

export function Ql202CampGuestReservation({ onOpenThread }: { onOpenThread: (threadId: string) => void }) {
  const [campgroundId, setCampgroundId] = useState<string>(campDemoTenants[0].id);
  const [fixtureId, setFixtureId] = useState(campIntakeFixtures[0].id);
  const [preview, setPreview] = useState<CampHandoffPreview | null>(null);
  const [error, setError] = useState('');
  const [showHelp, setShowHelp] = useState(false);
  function inspect() {
    const result = previewCampHandoff('icamp', connectorContracts.icamp, campgroundId, fixtureId);
    setPreview(result.ok ? result.preview : null);
    setError(result.ok ? '' : 'The selected sample is not available in this demo campground. No cross-campground data was shown.');
  }
  return <section className="ql202-camp" data-ql202-release="ql202-icamp-guest-reservation-mock-v1" aria-labelledby="ql202-title">
    <header className="ql202-head"><div><p className="ql191-eyebrow">QL-202 · iCamp mock connector</p><h4 id="ql202-title">Guest & reservation handoff</h4><p>Rehearse a campground-scoped inquiry using Camp Rosevear sample data.</p></div><button type="button" className="ql191-help-button" aria-expanded={showHelp} aria-controls="ql202-help" onClick={() => setShowHelp((open) => !open)}>ⓘ Help</button></header>
    <p className="ql202-alert" role="note">CAMPGROUND DISCONNECTED · No reservation, site hold, guest pass, gate credential, payment or SMS is created.</p>
    {showHelp && <p id="ql202-help" className="ql202-help" role="note">Camp Rosevear is fictional and does not represent a connected campground. Select an example reservation or visitor question. The source button opens a sample inbox thread; real campground staff roles, per-campground tenancy, campsite availability, visitor limits and payment permissions require private-server verification.</p>}
    <div className="ql202-form"><label htmlFor="ql202-campground">Demo campground</label><select id="ql202-campground" value={campgroundId} onChange={(event) => { setCampgroundId(event.target.value); setPreview(null); setError(''); }}>{campDemoTenants.map((tenant) => <option key={tenant.id} value={tenant.id}>{tenant.name}</option>)}</select>
      <label htmlFor="ql202-fixture">Fictional guest inquiry</label><select id="ql202-fixture" value={fixtureId} onChange={(event) => { setFixtureId(event.target.value); setPreview(null); setError(''); }}>{campIntakeFixtures.map((item) => <option key={item.id} value={item.id}>{item.kind === 'reservation_question' ? 'Reservation' : 'Guest services'} · {item.topic}</option>)}</select><button type="button" onClick={inspect}>Preview campground handoff</button></div>
    {error && <p className="ql202-alert" role="alert">{error}</p>}
    {preview ? <div className="ql202-result" role="status" aria-live="polite"><h5>Staff review required — fictional handoff</h5><dl>
      <div><dt>Reference</dt><dd>{preview.reference}</dd></div><div><dt>Campground</dt><dd>{preview.campgroundName}</dd></div><div><dt>Kind</dt><dd>{preview.kind === 'reservation_question' ? 'Reservation inquiry' : 'Guest service inquiry'}</dd></div><div><dt>Source</dt><dd>{preview.sourceSubject}</dd></div><div><dt>Topic</dt><dd>{preview.topic}</dd></div><div><dt>Site or event</dt><dd>{preview.siteOrEvent}</dd></div><div><dt>Dates</dt><dd>{preview.stayOrVisitDates}</dd></div><div><dt>Office review</dt><dd>{preview.reviewNote}</dd></div>
      <div><dt>Availability</dt><dd>Not checked</dd></div><div><dt>Reservation</dt><dd>Not created</dd></div><div><dt>Guest pass</dt><dd>Not issued</dd></div><div><dt>Gate access</dt><dd>Not granted</dd></div><div><dt>Payment</dt><dd>Not requested</dd></div><div><dt>Reply</dt><dd>Not sent</dd></div>
    </dl><button type="button" onClick={() => onOpenThread(preview.threadId)}>View fictional source conversation</button></div> : <p className="ql202-empty" role="status">Select a sample to inspect its possible handoff. Nothing has been booked or issued.</p>}
  </section>;
}

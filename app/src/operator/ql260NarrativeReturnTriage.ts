/**
 * QL-260 owner-supplied five narrative replies plus an absent iCamp return.
 * All metadata is nonsecret and unverified; no identity/tenant verification,
 * signing, network GET, key custody or owner authorization is performed here.
 */
export const QL260_RELEASE='ql260-five-owner-narrative-returns-private-custody-and-tenant-triage-held-v1';
export const QL260_OBSERVED='29 October 2026';
export const QL260_PROOF_PATH='docs/integration/ql246-source-proof.json';

export const QL260_SOURCE_REPORTS=[
  {system:'ai-data-platform',name:'AI Data Platform',repository:'ai-data-platform',
    mainSha:'a28a4874497a416613bc4182b5f895a5132fe0b9',
    narrative:'OWNER_FORWARDED_PUBLIC_OPERATIONAL_STATUS',
    signer:'CANDIDATE_SIGNER_CUSTODY_UNVERIFIED',
    tenant:'NONPRODUCTION_SCOPE_NOT_AUTHENTICATED',
    nextAction:'Independently authenticate the existing signer, private custodian, distinct witness and reviewer; approve the restricted host and verify the public SPKI pin out-of-band.'},
  {system:'devilndove',name:'Devil n Dove',repository:'devilndove-site',
    mainSha:'a17dd027eddccabf890a28ff82120cf88687c572',
    narrative:'OWNER_FORWARDED_PUBLIC_OPERATIONAL_STATUS',
    signer:'SIGNER_STATUS_UNKNOWN',
    tenant:'NONPRODUCTION_SCOPE_NOT_AUTHENTICATED',
    nextAction:'Privately appoint the source signer custodian and distinct witness/reviewer; approve its persistent private key host. Etsy/Marketplace product trials are separate and do not clear integration custody.'},
  {system:'rosiedazzlers',name:'Rosie Dazzlers',repository:'rosiedazzlers',
    mainSha:'e9f2abf49cb2f243daf469ca58e87ccacfd15a0f',
    narrative:'FUNCTIONALITY_RELEASE_UPDATE_NOT_SIGNER_REPORT',
    signer:'SIGNER_STATUS_UNCONFIRMED',
    tenant:'NONPRODUCTION_SCOPE_NOT_AUTHENTICATED',
    nextAction:'Request the actual QL-258 sanitized owner packet and a separate private signer/custody/witness report. The booking/quote release is not a source-proof or gateway receipt.'},
  {system:'yw',name:'Yard Workers',repository:'yw',
    mainSha:'0da74570ddc97f224aef15f2a39810ca40c9dd8c',
    narrative:'OWNER_FORWARDED_PUBLIC_OPERATIONAL_STATUS',
    signer:'SIGNER_STATUS_UNKNOWN',
    tenant:'PRODUCTION_COMPANY_OBSERVED_TEST_TENANT_UNVERIFIED',
    nextAction:'Appoint and authenticate signer custodian, witness and reviewer; approve a private key store and separately verify an isolated NONPRODUCTION project/tenant. Production company ownership does not prove test isolation.'},
  {system:'icamp',name:'iCamp',repository:'iCamp',
    mainSha:'040faeeb064c162fc97c059c9a271983b7f1f6bf',
    narrative:'NO_NEW_OWNER_FORWARDED_RETURN',
    signer:'SIGNER_STATUS_UNCONFIRMED',
    tenant:'NONPRODUCTION_CAMPGROUND_NOT_AUTHENTICATED',
    nextAction:'Obtain an actual QL-258 sanitized iCamp packet, private signer/custody/witness review and independently verified isolated nonproduction campground before any read-only TEST request.'},
  {system:'rosevear-ai-hub',name:'Rosevear AI Hub',repository:'rosevear-ai-hub',
    mainSha:'2678983cb077f38b825ce8f113390fe8236f51bb',
    narrative:'OWNER_FORWARDED_PUBLIC_OPERATIONAL_STATUS',
    signer:'SIGNER_STATUS_UNKNOWN',
    tenant:'PRIVATE_RELAY_NOT_STARTED',
    nextAction:'Independently appoint real signer custodian, witness and reviewer, verify persistent key host/pin and original proof. Keep the optional Windows mini-server relay uninstalled/off.'}
] as const;

export type Ql260System=typeof QL260_SOURCE_REPORTS[number]['system'];
export type Ql260Report=typeof QL260_SOURCE_REPORTS[number];

const SHA=/^[a-f0-9]{40}$/;
const REPOSITORIES=['ai-data-platform','devilndove-site','rosiedazzlers',
  'yw','iCamp','rosevear-ai-hub'];

function denied(reason:string){
  return {status:'DENIED_FALSE_OR_OUT_OF_SCOPE_EVIDENCE',reason,
    proofPath:QL260_PROOF_PATH,
    narrativeReplies:0,actualSanitizedOwnerPacketsReceived:0,
    queue:[] as const,
    connection:'DISCONNECTED',ownerTestAuthorization:'NOT_GIVEN',
    authenticatedGatewayGets:0,authenticatedCustodians:0,
    signedPublicProofs:0,livePilotHolds:12} as const;
}

/** Dated immutable source observations; a narrative is never an owner QL-258 packet. */
export function inspectQl260Narratives(rows:ReadonlyArray<Ql260Report>=QL260_SOURCE_REPORTS){
  if(!Array.isArray(rows)||rows.length!==6||rows.some((r,i)=>{
    const known=QL260_SOURCE_REPORTS[i];
    return !r||typeof r!=='object'||Array.isArray(r)||
      Object.keys(r).length!==Object.keys(known).length||
      Object.keys(r).some(key=>!(key in known))||
      Object.entries(known).some(([key,value])=>r[key as keyof Ql260Report]!==value)||
      r.repository!==REPOSITORIES[i]||!SHA.test(r.mainSha);
  }))return denied('Unexpected source report, missing response or fabricated trust.');
  const queue=rows.map(row=>Object.freeze({
    system:row.system,name:row.name,repository:row.repository,
    checkedMainSha:row.mainSha,originalProof:'HTTP_404_AT_IMMUTABLE_MAIN',
    reportedResponse:row.narrative,signer:row.signer,tenant:row.tenant,
    actualQl258OwnerJson:'NOT_RECEIVED',
    independentAuthentication:'NOT_VERIFIED',nextAction:row.nextAction
  }));
  return Object.freeze({
    status:'FIVE_NARRATIVES_ONE_MISSING_QL258_JSON_NOT_RECEIVED_HELD',
    observed:QL260_OBSERVED,proofPath:QL260_PROOF_PATH,
    narrativeReplies:rows.filter(r=>r.narrative!=='NO_NEW_OWNER_FORWARDED_RETURN').length,
    actualSanitizedOwnerPacketsReceived:0,
    proofFilesAtObservedImmutableMain:0,queue:Object.freeze(queue),
    authenticatedCustodians:0,independentWitnesses:0,
    ownerTestAuthorization:'NOT_GIVEN',authenticatedGatewayGets:0,
    calls:0,sms:0,dispatch:0,homeRelayRunning:false,
    connection:'DISCONNECTED',livePilotHolds:12
  });
}

/** Text is entirely from an allowlisted app; no secret or identity fields accepted. */
export function ql260AppHandoff(system:Ql260System):string {
  const app=QL260_SOURCE_REPORTS.find(row=>row.system===system);
  if(!app)throw new Error('Unknown companion app; no handoff generated.');
  return [
    `Rosevear Comms Hub QL-260 — ${app.name} next owner action`,
    `Repository: RosevearCreations/${app.repository}`,
    `Immutable observed main SHA (${QL260_OBSERVED}): ${app.mainSha}`,
    `Original ${QL260_PROOF_PATH}: HTTP 404 at this SHA`,
    `Provided return: ${app.narrative} (unverified narrative only)`,
    `Actual QL-258 sanitized owner JSON: NOT_RECEIVED`,
    `Signer: ${app.signer}; nonproduction/relay: ${app.tenant}`,
    `Specific next action: ${app.nextAction}`,
    'Return: sanitized QL-258 owner JSON plus externally reviewed nonsecret evidence references only.',
    'Do not send private names, keys, passwords, tokens, host paths, IP addresses or customer records.',
    'Identity, custody, public SPKI pin, source A→B and isolated nonproduction tenant require independent review.',
    'Owner TEST authorization NOT_GIVEN; authenticated GETs 0; 12/12 live pilot gates HELD.',
    'Connection: DISCONNECTED / HOLD.',
    'No live connections, calls, SMS, dispatch, Etsy posts or Windows relay authorized.'
  ].join('\n');
}

export function ql260SanitizedPortfolio(){
  return JSON.stringify(inspectQl260Narratives(),null,2);
}

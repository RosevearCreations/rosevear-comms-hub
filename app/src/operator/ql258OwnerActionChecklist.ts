/** QL-258 owner-only progress worksheet. No identity, secret, or approval input. */
export const QL258_RELEASE='ql258-six-app-owner-custody-checklist-public-source-recheck-held-v1';
export const QL258_OBSERVED='29 October 2026';
export const QL258_PROOF_PATH='docs/integration/ql246-source-proof.json';
export const QL258_APPS=[
  {system:'ai-data-platform',name:'AI Data Platform',repository:'ai-data-platform',mainSha:'a86dce3a71cd6795f5b32b22ddf4320c091dd7a5',tenantIsolationRequired:false},
  {system:'devilndove',name:'Devil n Dove',repository:'devilndove-site',mainSha:'f3c18345e7ec00f92418e25cb3ffb121420598ca',tenantIsolationRequired:false},
  {system:'rosiedazzlers',name:'Rosie Dazzlers',repository:'rosiedazzlers',mainSha:'69afa528d28ee1df3ad200cc5da0cf4a3c2acbf9',tenantIsolationRequired:false},
  {system:'yw',name:'Yard Workers',repository:'yw',mainSha:'5c8f4a104fd8f0375a89f58c6ee65ea08b82b5fd',tenantIsolationRequired:true},
  {system:'icamp',name:'iCamp',repository:'iCamp',mainSha:'7722ee2c0549dc1baddafc7de350544d69793a65',tenantIsolationRequired:true},
  {system:'rosevear-ai-hub',name:'Rosevear AI Hub',repository:'rosevear-ai-hub',mainSha:'99d64047c49678733af762ff906f288ec3ee0bb8',tenantIsolationRequired:false}
] as const;

export const QL258_STEPS=[
  {key:'privateCustodian',label:'Private signing-key custodian',hint:'Assign an accountable person through a private channel.'},
  {key:'independentWitness',label:'Separate independent witness',hint:'Must be distinct from the signing-key custodian.'},
  {key:'independentReviewer',label:'Separate reviewer',hint:'Must independently evaluate original evidence.'},
  {key:'privateHost',label:'Restricted persistent private key store',hint:'Choose an approved host; no private key goes in this app.'},
  {key:'signerPresence',label:'Actual signer presence checked privately',hint:'Existing candidate keys are not automatically trusted.'},
  {key:'outOfBandPin',label:'Public SPKI pin independently witnessed',hint:'A public fingerprint in a report is only a candidate until checked.'},
  {key:'tenantIsolation',label:'Isolated nonproduction tenant',hint:'Required for Yard Workers and iCamp only.'}
] as const;

export type Ql258StepKey=typeof QL258_STEPS[number]['key'];
export type Ql258Progress='NOT_REPORTED'|'OWNER_REPORTS_IN_PROGRESS'|'OWNER_REPORTS_DONE_NOT_VERIFIED';
export type Ql258StepValue=Ql258Progress|'NOT_APPLICABLE';
export type Ql258App=typeof QL258_APPS[number]['system'];
export type Ql258Report=Record<Ql258StepKey,Ql258StepValue>;
export type Ql258Ledger=Record<Ql258App,Ql258Report>;

const allowed:ReadonlyArray<Ql258Progress>=[
  'NOT_REPORTED','OWNER_REPORTS_IN_PROGRESS','OWNER_REPORTS_DONE_NOT_VERIFIED'
];
const own=(o:object,k:string)=>Object.prototype.hasOwnProperty.call(o,k);
export function newQl258Ledger():Ql258Ledger {
  return Object.fromEntries(QL258_APPS.map(app=>[
    app.system,Object.fromEntries(QL258_STEPS.map(step=>[
      step.key,step.key==='tenantIsolation'&&!app.tenantIsolationRequired
        ?'NOT_APPLICABLE':'NOT_REPORTED'
    ]))
  ])) as Ql258Ledger;
}

export function updateQl258Step(ledger:Ql258Ledger,system:Ql258App,key:Ql258StepKey,
  value:Ql258Progress):Ql258Ledger {
  const app=QL258_APPS.find(item=>item.system===system);
  if(!app||!QL258_STEPS.some(item=>item.key===key)||!allowed.includes(value)||
    (key==='tenantIsolation'&&!app.tenantIsolationRequired))
    throw new Error('Not an editable owner progress field');
  return {...ledger,[system]:{...ledger[system],[key]:value}};
}

/** Strict allowlist: no names, server addresses, tokens, keys or fake approvals. */
export function ql258SanitizedHandoff(system:Ql258App,report:Ql258Report):string {
  const app=QL258_APPS.find(item=>item.system===system);
  if(!app||!report||typeof report!=='object'||Array.isArray(report)||
    Object.keys(report).length!==QL258_STEPS.length||
    Object.keys(report).some(key=>!QL258_STEPS.some(step=>step.key===key))||
    QL258_STEPS.some(step=>!own(report,step.key)||!(
      step.key==='tenantIsolation'&&!app.tenantIsolationRequired
        ?report[step.key]==='NOT_APPLICABLE'
        :allowed.includes(report[step.key] as Ql258Progress))))
    throw new Error('Rejected unknown or unsafe owner progress content');

  return JSON.stringify({
    release:QL258_RELEASE,system:app.system,repository:app.repository,
    publicGitHubSnapshot:{observed:QL258_OBSERVED,mainSha:app.mainSha,
      requiredPath:QL258_PROOF_PATH,httpStatusAtObservedSha:404},
    ownerReportedUnverifiedProgress:Object.fromEntries(QL258_STEPS.map(step=>[
      step.key,report[step.key]
    ])),
    independentCustodyAuthenticated:false,sourceProofAccepted:false,
    ownerTestAuthorization:'NOT_GIVEN',authenticatedGatewayGets:0,
    connection:'DISCONNECTED',livePilotHolds:12,
    disposition:'OWNER_SELF_REPORT_ONLY_NOT_SECURITY_EVIDENCE_HELD'
  },null,2);
}

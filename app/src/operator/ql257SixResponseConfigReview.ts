/** QL-257: owner-provided real signer statuses, reconciled to public GitHub only. */
export const QL257_RELEASE='ql257-six-app-real-signer-returns-static-build-variable-routing-held-v1';
export const QL257_OBSERVED='29 October 2026';
export const QL257_PROOF_PATH='docs/integration/ql246-source-proof.json';
export const QL257_SOURCES=Object.freeze([
  {name:'AI Data Platform',repository:'ai-data-platform',mainSha:'15ccd72f098b6238d4b1d357a97676d6a2836df2',
    signer:'Existing candidate key; custody unverified',next:'Independently verify custodian, public-key pin and separate witness'},
  {name:'Devil n Dove',repository:'devilndove-site',mainSha:'58713dcaaac487eb5b9634e9e21e42aa83ea436e',
    signer:'Status unknown',next:'Owner appoints custodian and independently confirms private signer status'},
  {name:'Rosie Dazzlers',repository:'rosiedazzlers',mainSha:'4da5a7fc78cf3dec21852f7fb79907e45f779279',
    signer:'Status unknown; provision tool prepared',next:'Choose private key host and independent custodian/witness first'},
  {name:'Yard Workers',repository:'yw',mainSha:'eb4b5baa6fbca39165c630ba71e3839e82df19e7',
    signer:'Status unknown; provision tool prepared',next:'Confirm isolated nonproduction company and key custodian'},
  {name:'iCamp',repository:'iCamp',mainSha:'d04bcaba6adbd551db0a66ec9cf363919bae1088',
    signer:'Status unknown',next:'Confirm isolated campground and private signer/custodian'},
  {name:'Rosevear AI Hub',repository:'rosevear-ai-hub',mainSha:'b992fdf6a30c62ad627f561c3808f39d4bf6f816',
    signer:'Status unknown; Windows relay not started',next:'App signer trust first; home relay remains optional and disabled'}
]);
export const QL257_BUILD_CONFIG=Object.freeze([
  {setting:'Public Vite values for Cloudflare site build',
    location:'Cloudflare Worker → Settings → Builds → Build variables and secrets',
    action:'Not required to complete QL-256 signer work'},
  {setting:'GitHub Pages preview build values',
    location:'GitHub repository → Settings → Secrets and variables → Actions',
    action:'Only applies when the GitHub Actions workflow uses those vars'},
  {setting:'Runtime Worker bindings and secrets',
    location:'Unavailable on current static-assets-only Worker',
    action:'Do not convert or enable simply to clear a HOLD'},
  {setting:'Ed25519 private signer and HMAC test credentials',
    location:'Approved private app-specific server/operator store',
    action:'Do not place in VITE, GitHub source, or static build variables'}
]);
export const QL257_GATES=Object.freeze({
  originalSignedProofs:0,independentlyVerifiedCustodians:0,
  separatelyAuthenticatedOwnerTestDecisions:0,actualGatewayGets:0,
  privateRelayEnabled:false,connections:'DISCONNECTED',livePilotHolds:12
});

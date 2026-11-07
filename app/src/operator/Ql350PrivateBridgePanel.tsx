import {useState} from 'react';
import {QL349_PUBLIC_SOURCES} from './ql349PublicSourceRefresh';
import {checkPrivateQl350Bridge,requestOnePrivateQl350Test,
  type Ql350PrivateStatus,type Ql350TestResult} from './ql350PrivateBridgeClient';
import './ql350-private-control.css';

/** Same-origin private Caddy/Tailnet deployment can authenticate through its
 * server-managed session. Static Pages gets a 404/HOLD, never a private key. */
export function Ql350PrivateBridgePanel(){
  const [status,setStatus]=useState<Ql350PrivateStatus|null>(null);
  const [checking,setChecking]=useState(false);
  const [active,setActive]=useState<string|null>(null);
  const [message,setMessage]=useState('Private control bridge not checked in this session.');
  const [results,setResults]=useState<Record<string,Ql350TestResult>>({});
  async function check(){
    if(checking||active)return;
    setChecking(true);setStatus(null);setResults({});
    try{
      const report=await checkPrivateQl350Bridge();
      if(report){setStatus(report);setMessage(report.readyForOneSourceTest?
        'Original signed TEST receipt verified by the private broker. Each source still requires separate authority.':
        'Original Windows enrollment or signed TEST receipt is missing. Six apps remain HOLD.');}
      else setMessage('No authenticated private bridge on this origin. Public Pages stays read-only.');
    }catch{setMessage('Private bridge unavailable, blocked or timed out. No connection was attempted.');}
    finally{setChecking(false);}
  }
  async function runOne(sourceId:string){
    if(!status?.readyForOneSourceTest||checking||active)return;
    setActive(sourceId);setMessage(`Reviewing independent ${sourceId} TEST authority…`);
    try{
      const result=await requestOnePrivateQl350Test(sourceId,crypto.randomUUID());
      if(result){setResults(old=>({...old,[sourceId]:result}));
        setMessage(`Private broker: ${result.state}. Persistent connection remains HOLD.`);}
      else setMessage('Private TEST denied, unavailable or unverified; no connection established.');
    }catch{setMessage('Private TEST failed safely. Independent recovery review is required; no automatic retry.');}
    finally{setActive(null);}
  }
  return <section className="ql350-private" aria-labelledby="ql350-title">
    <header><div><small>QL-350 · Authenticated private connection bridge</small>
      <h4 id="ql350-title">One secure control window. Six independent TEST approvals.</h4>
      <p>The Hub reuses original Windows/Jack signing authority through a private server.
        No keys, passwords or tenant secrets are entered into this browser.</p></div>
      <span>0/6 LIVE · HOLD</span></header>
    <div className="ql350-actions"><button type="button" disabled={checking||Boolean(active)}
      onClick={check}>{checking?'Checking private bridge…':'Check private bridge'}</button>
      <p role="status">{message}</p></div>
    <div className="ql350-steps" aria-label="Guided private activation prerequisites">
      <article><strong>1 · Private operator session</strong><span>{status?'Authenticated private readback':'Not independently observed here'}</span></article>
      <article><strong>2 · Original Windows enrollment</strong><span>{status?.originalEnrollmentCount===1?'One enrolled original device':'Independent owner enrollment HOLD'}</span></article>
      <article><strong>3 · Original signed TEST receipt</strong><span>{status?.originalReceiptVerified?'Authentic private witness observed':'Signed device receipt HOLD'}</span></article>
      <article><strong>4 · Individual source TESTs</strong><span>Separate source-owner signature and append-only witness required</span></article>
    </div>
    <details className="ql351-windows-guide">
      <summary>QL-351 · Install the original Windows adapter — owner walkthrough</summary>
      <ol>
        <li><strong>Here in Comms Hub · I.T. / Connections:</strong> check the private bridge. A public disabled-preview HOLD is expected until the original private service is installed and authenticated.</li>
        <li><strong>On Ree’s original Windows server · PowerShell:</strong> open the <code>rosevear-comms-hub</code> repository at clean, updated <code>main</code>; run <code>.\runtimes\hub-relay\ql351-windows-private-adapter.ps1 -Status</code>, then <code>-Install</code>. The owner must confirm staging.</li>
        <li><strong>On Ree’s Windows server · PowerShell:</strong> run the same adapter with <code>-Preflight</code> and <code>-Readback</code>. Existing DPAPI secrets remain on the machine; a staged adapter alone does not grant TEST authority.</li>
        <li><strong>On Jack’s separate laptop:</strong> review and independently sign the exact TEST request using the existing QL-340B ceremony. Keep his private key on his laptop.</li>
        <li><strong>With both original approvals:</strong> complete the separate database enrollment with an independently authorized operator. Only then, on Ree’s server, use <code>-SupervisedReceiver</code>; stop and independently verify exactly one signed receipt.</li>
        <li><strong>Back here:</strong> check the authenticated private bridge again; proceed to each application only when its own source authority and witness are independently confirmed.</li>
      </ol>
      <p>Installation does not turn on Tailscale Serve, send a handshake, copy signing keys, connect customers or change the other five repositories. The full field procedures are in <code>docs/build-records/QL-351_WINDOWS_ADAPTER_FIRST_TEST_OWNER_RUNBOOK.md</code> in the repository.</p>
    </details>
    <details className="ql351-windows-guide ql352-tailnet-guide">
      <summary>QL-352 · Private Tailscale HTTPS gateway — original Windows owner steps</summary>
      <ol>
        <li><strong>On Ree’s Windows server · PowerShell:</strong> update to a clean <code>main</code>, then run <code>.\runtimes\hub-relay\ql352-windows-tailnet-gateway.ps1 -Status</code>. Confirm that Caddy still serves LAN <code>192.168.68.74:8443</code> and Tailscale owns <code>100.77.246.3</code>.</li>
        <li><strong>On Ree’s Windows server:</strong> locate the existing original TLS certificate and matching <em>private</em> key under the current user’s private CommsRelay TLS folder. Do not copy the private key to Jack or the browser. If the existing key is absent, stay on HOLD.</li>
        <li><strong>With Ree supervising:</strong> run the QL-352 script with <code>-Stage</code>, then <code>-Validate</code>. This creates a separate deny-all Caddyfile; the original LAN Caddy configuration is untouched.</li>
        <li><strong>In Tailscale Admin · Access controls / Tests:</strong> independently confirm that Jack’s laptop <code>100.114.56.26</code> may reach Ree’s Tailscale address on TCP <code>8443</code> but not <code>8788</code>. Do not grant wider access.</li>
        <li><strong>Only with owner supervision:</strong> use <code>-SupervisedStart</code> in a dedicated PowerShell window. On Jack’s laptop test TCP <code>8443</code>. An HTTPS response of <code>403</code> or <code>503</code> is intentional: this is still a transport-only HOLD gateway, not an authenticated Comms connection.</li>
        <li><strong>For safe recovery:</strong> on Ree’s original Windows machine use <code>-Stop</code> in a second PowerShell window. This stops only the exact QL-352 process and confirms the original LAN Caddy remains running.</li>
      </ol>
      <p>No firewall, Tailnet grant, Windows LAN Caddyfile, signed TEST request, database enrollment or other application repository is changed. Original issuer approval and both owners’ decisions remain independent. See the QL-352 runbook in <code>docs/build-records</code>.</p>
    </details>
    <details className="ql351-windows-guide ql353-owner-guide">
      <summary>QL-353 · Original-owner enrollment, authenticated session and first signed receipt</summary>
      <ol>
        <li><strong>Ree’s Windows server · PowerShell:</strong> after updating a clean <code>main</code>, run <code>.\runtimes\hub-relay\ql353-windows-original-readback.ps1 -Status</code>. This checks original local evidence filenames and listener states without decrypting keys or contacting the database.</li>
        <li><strong>Jack’s separate laptop:</strong> independently review the original issuer evidence, signed source/master ownership decisions and exact public candidate fingerprints. The previous QL-352 HTTPS <code>503</code> result proves encrypted transport only—it is not consent or a device receipt.</li>
        <li><strong>Original private database administrator:</strong> separately verify one exact <code>REVIEWED_TEST</code> enrollment, no revocation and one genuine signed device receipt using the dedicated read-only verifier. The receiver role remains <code>NOLOGIN</code> until specifically approved; never expose a connection string in the browser.</li>
        <li><strong>Authenticated private operator:</strong> the server requires a short-lived original-device session with independent issuer and both-owner attestation, exact same-origin/CSRF checks and revocation verification. No browser button can self-enroll or issue this session.</li>
        <li><strong>First signed TEST receipt:</strong> reconcile an independently reviewed owner packet, exact original device pin and one durable QL-342 signed receipt. A valid first receipt still leaves all six application connections <code>DISCONNECTED / HOLD</code> until separate source TEST authority exists.</li>
      </ol>
      <p>QL-353 does not overwrite the QL-351 or QL-352 staged manifests. Their checkout hashes may deliberately go stale after a new release; a later activation must be explicitly reconciled, never silently repinned. Detailed field directions: <code>docs/build-records/QL-353_ORIGINAL_OWNER_SESSION_AND_FIRST_SIGNED_TEST_RECEIPT.md</code>.</p>
    </details>
    <details className="ql351-windows-guide ql354-owner-guide">
      <summary>QL-354 · Ree + Jack original enrollment and first genuine TEST challenge</summary>
      <ol>
        <li><strong>Ree · DESKTOP-AE894KC:</strong> update a clean <code>main</code>, then run <code>.\runtimes\hub-relay\ql354-windows-owner-handoff.ps1 -Status</code>. Keep LAN Caddy up, QL-352 Tailnet gateway stopped and original receiver <code>8788</code> OFF.</li>
        <li><strong>Jack · Templar:</strong> run the same <code>-Status</code> command in Jack’s checkout. Verify the original encrypted <em>master</em> key is still on Jack’s laptop. Ree’s encrypted <em>source</em> key stays on Ree’s machine.</li>
        <li><strong>Both owners and separate original issuer:</strong> authenticate original issuer custody and the separate field witness independently. Review the four original evidence byte hashes, three public candidates and exact 20-minute TEST scope. Earlier QL-345 <em>review acknowledgement</em> is not enrollment consent.</li>
        <li><strong>Ree and Jack · original local PowerShell:</strong> only after separate real approvals use <code>ql340b-ceremony.mjs --prepare</code>, <code>--inspect-request</code>, <code>--sign source</code> on Ree, <code>--sign master</code> on Jack, then <code>--assemble</code> on Ree. Transfer public request and signed approval files only; never private keys or passphrases.</li>
        <li><strong>Ree · PowerShell:</strong> run <code>ql354-windows-owner-handoff.ps1 -InspectSigned -RequestPath … -EvidencePathsFile …</code> to verify real Ed25519 signatures and the exact original witness bytes; a successful cryptographic review still requires independently verified issuer/witness authority.</li>
        <li><strong>Independent Supabase administrator:</strong> after verifying both external authorities and the precise original signatures, append exactly one reviewed TEST enrollment. Keep the admin login away from the Windows receiver; separately authorize only a dedicated encrypted least-privilege receiver credential.</li>
        <li><strong>Original AI Hub device signer and private receiver:</strong> only after all gates pass, prepare one fresh 90-second, read-only device challenge, sign on the original device, supervise one TEST POST, stop the exact receiver and reconcile exactly one immutable signed receipt.</li>
      </ol>
      <p>This build contains <strong>server-only</strong> proof and one-shot intake/challenge functions. The public browser cannot authenticate an issuer, insert enrollment, mint a device signature, enable a database login or activate a receiver. Six apps stay <strong>DISCONNECTED / HOLD</strong> until independently authorized source tests. Exact commands: <code>docs/build-records/QL-354_ORIGINAL_CUSTODY_SIGNED_ENROLLMENT_AND_FIRST_TEST_CHALLENGE.md</code>.</p>
    </details>
    <details className="ql351-windows-guide ql355-authority-guide">
      <summary>QL-355 · Independent issuer signature, separate owner ceremony and first private TEST acceptance</summary>
      <ol>
        <li><strong>Ree · original Windows server:</strong> from a clean updated <code>main</code>, run <code>.\runtimes\hub-relay\ql354-windows-owner-handoff.ps1 -Status</code>. Leave the original LAN service untouched and the private receiver OFF until authorization is proven.</li>
        <li><strong>Jack · Templar laptop:</strong> independently run the same read-only <code>-Status</code> command on Jack’s checkout. Verify the master key never leaves his laptop and compare the exact fresh 20-minute request digest with Ree.</li>
        <li><strong>Original independent authorities:</strong> an externally pinned original issuer and a separate field witness must each provide a genuine Ed25519 signature over the same restricted TEST enrollment digest. A screenshot, unchecked JSON flag, TLS certificate or copied public key is insufficient.</li>
        <li><strong>Separate owner decisions:</strong> Ree signs <em>source</em> and Jack signs <em>master</em> using their local encrypted keys, only after the independent authority review. A private administrator may then perform a single append-only enrollment; no public screen can enable a database login.</li>
        <li><strong>One original-device TEST:</strong> only a genuinely authenticated private operator and verified Tailnet transport can accept an original device-signed 90-second challenge plus exactly one matching durable PostgreSQL receipt. That is a TEST acceptance, <em>not</em> a six-app production connection.</li>
      </ol>
      <p><strong>Current state: DISCONNECTED / HOLD.</strong> QL-355 adds private, cryptographic verification functions and explicit fail-closed acceptance; it does not invent original signatures or alter the six HELD source grants. See <code>docs/build-records/QL-355_INDEPENDENT_ISSUER_DUAL_OWNER_AND_FIRST_PRIVATE_TEST.md</code> for the original-host and laptop handoff.</p>
    </details>
    <details className="ql351-windows-guide ql356-field-guide">
      <summary>QL-356 · Ree/Jack original field request, issuer-pin custody and one genuine TEST receipt</summary>
      <ol>
        <li><strong>Ree · DESKTOP-AE894KC:</strong> the observed source key and local LAN listener are present; signed enrollment, approved pins, receiver credential and genuine receipt are absent. Run <code>.\runtimes\hub-relay\ql356-windows-field-handoff.ps1 -Status</code> after updating a clean <code>main</code>.</li>
        <li><strong>Jack · Templar:</strong> his separate master encrypted key and public candidate are present; no owner decision was signed. Run the same <code>-Status</code> on Jack’s original account.</li>
        <li><strong>Public-only handoff:</strong> after locating Ree’s four original witness files and coordinating a short review window, Ree can deliberately run <code>-PrepareUnsigned -EvidencePathsFile … -RequestPath …</code>. This creates an unsigned 20-minute TEST request only; it never approves enrollment.</li>
        <li><strong>Both owners:</strong> use <code>-ReviewRequest -RequestPath …</code> on their own devices. The tool checks the precise original local public candidate and reviewed digest; only Ree can additionally check the four original witness file bytes. Do not send private keys, passphrases or DPAPI files.</li>
        <li><strong>Independent original issuer and field witness:</strong> both must authenticate their externally pinned Ed25519 identities and sign the same scoped request digest before Ree and Jack sign their individual owner decisions. Until then, original receiver <code>8788</code> stays OFF.</li>
        <li><strong>First genuine TEST acceptance:</strong> only after real dual-owner approval and private enrollment may a supervised original-device signature, authenticated private operator and one immutable PostgreSQL receipt be accepted. All six source apps remain <code>DISCONNECTED / HOLD</code>.</li>
      </ol>
      <p>QL-356 does not create an issuer, sign for Ree or Jack, alter firewall/database credentials, start Caddy, enable the receiver, or turn a public request into trust. The exact PowerShell handoff and STOP checks are in <code>docs/build-records/QL-356_ORIGINAL_ISSUER_PIN_CUSTODY_FIELD_EXECUTION.md</code>.</p>
    </details>
    <details className="ql351-windows-guide ql357-activation-guide">
      <summary>QL-357 · Original-owner enrollment, authenticated private receiver and one real cross-device TEST receipt</summary>
      <ol>
        <li><strong>Ree · original server:</strong> update a clean <code>main</code> and run <code>.\runtimes\hub-relay\ql357-windows-owner-activation.ps1 -Status</code>. Jack runs the same command separately on <strong>Templar</strong>. Public candidate and encrypted-key presence are not approvals.</li>
        <li><strong>Original issuer and separate field witness:</strong> independently authenticate their previously approved public pins and actual custody; both sign the same fresh TEST request digest. Ree and Jack then separately sign their own source/master decisions without exchanging private keys.</li>
        <li><strong>Ree reviews signatures:</strong> use <code>-ReviewSigned -RequestPath … -EvidencePathsFile …</code> after the real QL-340B ceremony. Until both owner signatures and original witness bytes verify, stop.</li>
        <li><strong>Private database administrator:</strong> QL-357 can execute one original append-only enrollment only through an authenticated administrator transaction and a nonserializable QL-355 permit. Live database enrollment and receiver credential are still absent; do not grant LOGIN or fabricate a row.</li>
        <li><strong>Ree checks the approved receiver:</strong> only after actual enrollment and a separately provisioned limited DPAPI credential, run <code>-PrivateReadback</code> while receiver <code>8788</code> is OFF. Separate private-session and Tailnet authentication must then pass before one supervised TEST.</li>
        <li><strong>First signed TEST receipt:</strong> once the original AI Hub device signs one fresh 90-second health-only challenge, the receiver is stopped and Ree uses <code>-VerifyReceipt -OriginalPacketPath … -OwnerReviewPath …</code>. Exactly one matching immutable database receipt is mandatory. All six app grants stay <code>DISCONNECTED / HOLD</code>.</li>
      </ol>
      <p>QL-357 preserves existing LAN Caddy, keeps customer/device actions disabled, and never runs its private administrator callback from the browser. See <code>docs/build-records/QL-357_ORIGINAL_OWNER_ENROLLMENT_PRIVATE_RECEIVER_AND_FIRST_CROSS_DEVICE_TEST.md</code>.</p>
    </details>
    <details className="ql351-windows-guide ql358-field-guide">
      <summary>QL-358 · Original field verifier, restricted receiver credential and first live TEST reconciliation</summary>
      <ol>
        <li><strong>Both Windows owners:</strong> update a clean <code>main</code> and run <code>.\runtimes\hub-relay\ql358-windows-original-field.ps1 -Status</code>. Ree's original source and Jack's separate master candidates exist, but neither is independent issuer approval.</li>
        <li><strong>Outside original authority:</strong> an already independently pinned issuer and separate field witness authenticate original custody and sign the same fresh 20-minute one-device TEST digest. Without this, do not sign the owner request or enable the receiver.</li>
        <li><strong>Ree and Jack compare their actual public candidates:</strong> after Ree prepares a fresh unsigned QL-356 request, each runs QL-358 <code>-ReviewRequest -RequestPath …</code>. Ree additionally supplies <code>-EvidencePathsFile …</code> to verify the original four witness bytes; Jack does not import those files.</li>
        <li><strong>Separate signed decisions:</strong> only after independent custody approvals, Ree signs source and Jack independently signs master using the protected QL-340B ceremony. Ree assembles and runs <code>-ReviewSigned -SignedRequestPath … -SignedEvidencePathsFile …</code>.</li>
        <li><strong>Dedicated private credential:</strong> one original administrator authenticates the exact signed database enrollment and separately provisions restricted <code>ql340c_private_receiver</code>. Ree runs <code>-CredentialHandoff</code> for a HOLD/readiness readback; only the existing local QL-340C hidden prompt may encrypt the subsequently approved URL with Ree-current-user DPAPI.</li>
        <li><strong>One genuine TEST receipt:</strong> after <code>-ReceiverReadback</code>, authenticated TLS/Tailnet and one original-device-signed 90-second TEST, Ree stops the exact supervised receiver and uses <code>-VerifyReceipt</code>. Exactly one immutable DB receipt is required; all six app peers remain <code>DISCONNECTED / HOLD</code>.</li>
      </ol>
      <p>The QL-358 private runtime uses nonserializable one-use tickets and never generates trust, credentials, or a real TEST in CI. Exact Ree/Jack commands and STOP conditions: <code>docs/build-records/QL-358_ORIGINAL_AUTHORITY_CREDENTIAL_AND_FIRST_LIVE_TEST.md</code>.</p>
    </details>
    <details className="ql351-windows-guide ql359-closeout-guide">
      <summary>QL-359 · Independent original trust, owner-only private credential and supervised TEST closeout</summary>
      <ol>
        <li><strong>Ree and Jack, original Windows machines:</strong> on a clean <code>main</code> run <code>.\runtimes\hub-relay\ql359-windows-supervised-test.ps1 -Status</code>. Their local candidate files do not authenticate an issuer.</li>
        <li><strong>Independent issuer and separate field witness:</strong> verify previously approved external public pins, custody, revocation and the same fresh QL-340B request digest. Both owners then independently review and sign their exact source/master decisions.</li>
        <li><strong>Private original enrollment:</strong> only an authenticated original administrator may record the one reviewed device after all approvals. The receiver role currently has <code>NOLOGIN</code>; this panel cannot provision it.</li>
        <li><strong>Ree-only credential:</strong> after administrator-approved restricted receiver provisioning, run QL-359 <code>-CredentialReadback</code>, then use QL-340C's original current-user hidden DPAPI <code>-StoreCredential</code> prompt. Never share the database URL.</li>
        <li><strong>Supervised first TEST:</strong> verify original private operator, limited PostgreSQL role and TLS/Tailnet, then perform one real 90-second original-device-signed health-only TEST using the preexisting owner-supervised receiver procedure.</li>
        <li><strong>Ree stops and witnesses:</strong> after QL-340C <code>-Stop</code>, use QL-359 <code>-StopWitness</code> and <code>-ReceiptReview</code>. Private acceptance additionally checks an independently authenticated stop/witness transcript, exactly one immutable receipt and all six apps still <code>DISCONNECTED / HOLD</code>.</li>
      </ol>
      <p>The original database still has no live original enrollment or TEST receipt. Software <code>main</code> GREEN does not constitute live authorization. See <code>docs/build-records/QL-359_ORIGINAL_AUTHORITY_SUPERVISED_PRIVATE_TEST.md</code> for owner steps and exact STOP boundaries.</p>
    </details>
    <details className="ql351-windows-guide ql360-archive-guide">
      <summary>QL-360 · Original-host trust archive, witnessed receiver shutdown and private six-app evidence export</summary>
      <ol>
        <li><strong>Ree and Jack:</strong> on their original Windows devices and a clean <code>main</code>, run <code>.\runtimes\hub-relay\ql360-windows-evidence-export.ps1 -Status</code>. Neither status nor public files constitutes original issuer approval.</li>
        <li><strong>Real QL-359 prerequisite:</strong> independently authenticated original issuer/witness, two separate signed owner decisions, actual original device enrollment, restricted Ree-only receiver credential, and exactly one signed private TEST receipt. The current database remains on HOLD.</li>
        <li><strong>Ree stops the actual receiver:</strong> QL-340C's existing supervised <code>-Stop</code> returns an original process-verified stop receipt. QL-360 <code>-ShutdownReadback -StopReceiptPath …</code> verifies its age under 90 seconds and that both receiver and Tailnet gateway listeners are absent.</li>
        <li><strong>Ree alone exports after proof:</strong> QL-360 <code>-ExportPostTest</code> requires original packet, owner review and fresh stop receipt. It delegates signed receipt verification to QL-359 and the existing owner-protected QL-340C six-app readback.</li>
        <li><strong>Private archive acceptance:</strong> one nonserializable verified QL-359 closeout, fresh observed shutdown and independent original trust are checked before atomic create-new Windows owner-ACL storage and hash readback. All six peers remain <code>DISCONNECTED / HOLD</code>.</li>
      </ol>
      <p>See <code>docs/build-records/QL-360_ORIGINAL_PRIVATE_TRUST_ARCHIVE_SHUTDOWN_AND_SIX_APP_EXPORT.md</code>. No browser control grants live original trust or exports secrets.</p>
    </details>
    <details className="ql351-windows-guide ql361-audit-guide">
      <summary>QL-361 · Original TEST chain, independent redaction audit and six-app owner handoff</summary>
      <ol>
        <li><strong>Both original Windows owners:</strong> from a clean <code>main</code>, run <code>.\runtimes\hub-relay\ql361-windows-owner-audit.ps1 -Status</code>. This is a local HOLD readback, never an issuer or owner signature.</li>
        <li><strong>Ree original machine only:</strong> after a genuine QL-359 signed TEST and QL-360 owner-only archive, use <code>-ArchiveDigest -ArchiveId ql360-...json</code> to inspect the claimed archival hash. Jack cannot read Ree's protected folder.</li>
        <li><strong>Independent redaction auditor:</strong> a separately pinned and authenticated Ed25519 auditor must verify the exact allowlisted six-app archive report, then sign its time-limited digest. No self-selected key or copied JSON passes.</li>
        <li><strong>Fresh chain readback:</strong> the private server rechecks the owner-only archive hash, authenticated restricted database role, one immutable TEST receipt, zero revocations, six unchanged HELD peers and the receiver still OFF.</li>
        <li><strong>Ree private handoff:</strong> six offline application candidates are stored create-new with current-user Windows ACL and digest readback. All still require each source owner's separate signed TEST authorization. No user messages, devices, database writes or external connections are enabled.</li>
      </ol>
      <p>See <code>docs/build-records/QL-361_ARCHIVED_ORIGINAL_TEST_CHAIN_REDACTION_AUDIT_AND_SIX_APP_HANDOFF.md</code>. Production release GREEN remains separate from the private original connection HOLD.</p>
    </details>
    <div className="ql350-peer-grid" aria-label="Six supervised source TEST actions">
      {QL349_PUBLIC_SOURCES.map(source=><article key={source.id}>
        <div><strong>{source.label}</strong><span>DISCONNECTED / HOLD</span></div>
        <small>{results[source.id]?.state??'No independently verified source TEST receipt'}</small>
        <button type="button" disabled={!status?.readyForOneSourceTest||Boolean(active)||checking}
          onClick={()=>runOne(source.id)}>{active===source.id?'Reviewing signed TEST…':'Run one authorized TEST'}</button>
      </article>)}
    </div>
    <p className="ql350-note">This screen sends requests only to its own origin. On the public disabled preview,
      the private bridge is absent and TEST actions are disabled. The Windows/Tailnet host must
      provide an authenticated same-origin bridge and independently verified original enrollment,
      source signer, owner decision and durable receipt. Even one valid TEST does not enable customer data,
      messaging or production connections.</p>
  </section>;
}

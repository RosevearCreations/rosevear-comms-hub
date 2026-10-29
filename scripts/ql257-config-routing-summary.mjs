#!/usr/bin/env node
/** No network requests, environment writes or secrets read. */
import {inspectQl257SixResponses,QL257_OBSERVED_DATE,QL257_PROOF_PATH}
  from './ql257-six-response-config-routing.mjs';
process.stdout.write(JSON.stringify({
  source:'Six owner-provided QL-256 returns plus public GitHub current-main recheck',
  observedDate:QL257_OBSERVED_DATE,proofPath:QL257_PROOF_PATH,
  cloudflareRuntime:'STATIC_ASSETS_ONLY_NO_RUNTIME_VARIABLES',
  cloudflareBuildVariables:'SETTINGS_BUILDS_BUILD_VARIABLES_IF_NEEDED_LATER',
  githubActionsVariables:'GITHUB_PAGES_PREVIEW_WORKFLOW_ONLY',
  privateSignerKeys:'DO_NOT_PLACE_IN_REPOSITORY_OR_STATIC_BUILD',
  ...inspectQl257SixResponses()
},null,2)+'\n');

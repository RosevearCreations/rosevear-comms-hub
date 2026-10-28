/** Source-only Github snapshot; browser never fetches any external runtime. */
export const QL249_RELEASE = 'ql249-six-app-immutable-github-origin-retest-owner-test-scheduling-held-v1';
export const QL249_OBSERVED = '28 October 2026 (Eastern)';

export const QL249_SOURCE_SNAPSHOT = Object.freeze([
  Object.freeze({ system: 'ai-data-platform', repository: 'ai-data-platform',
    mainSha: '33240278b4143a637c717ce7143ddd383d0eb4c3', proof: 'MISSING (404)' }),
  Object.freeze({ system: 'devilndove', repository: 'devilndove-site',
    mainSha: '46ecaea247498ad9bde8723d1c9721ce1d6b6e98', proof: 'MISSING (404)' }),
  Object.freeze({ system: 'rosiedazzlers', repository: 'rosiedazzlers',
    mainSha: '65bf778d77a39acb11f59677bd116aa8c6ceb774', proof: 'MISSING (404)' }),
  Object.freeze({ system: 'yw', repository: 'yw',
    mainSha: 'ca8f120d19091cdd009aeefecf83f127863cdcc4', proof: 'MISSING (404)' }),
  Object.freeze({ system: 'icamp', repository: 'iCamp',
    mainSha: '1a3c4a0dd3b95836c864dc71fdb3e1cbb4a91a47', proof: 'MISSING (404)' }),
  Object.freeze({ system: 'rosevear-ai-hub', repository: 'rosevear-ai-hub',
    mainSha: '4b4fb52cf1170e1f08084705b74258148df2ade2', proof: 'MISSING (404)' })
]);

export const QL249_TEST_SLOT_GATE = Object.freeze({
  status: 'NOT_SCHEDULED',
  ownerTestAuthorization: 'NOT_GIVEN',
  separatelyPinnedPublicKeys: 0,
  githubOriginAndCiConfirmed: 0,
  actualGatewayTests: 0,
  allowedMethods: Object.freeze(['GET']),
  allowedPaths: Object.freeze(['/api/integration/v1/health', '/api/integration/v1/capabilities']),
  connectionState: 'DISCONNECTED',
  realPilotHolds: 12,
  writes: 0, calls: 0, sms: 0, dispatch: 0
});

/** QL-368: MFA is a separate requirement from original-owner enrollment.
 * This is only a presentation/readiness check; source grants remain server-held.
 */
export type OwnerMfaState =
  | { kind: 'ENROLL'; factorId: null; message: string }
  | { kind: 'CHALLENGE'; factorId: string; message: string }
  | { kind: 'VERIFIED'; factorId: string; message: string }
  | { kind: 'ERROR'; factorId: null; message: string };

export interface OwnerMfaGateway {
  auth: {
    mfa: {
      listFactors(): Promise<{
        data: { totp?: Array<{ id: string; status: string }> } | null;
        error: { message: string } | null;
      }>;
      getAuthenticatorAssuranceLevel(): Promise<{
        data: { currentLevel: string | null } | null;
        error: { message: string } | null;
      }>;
    };
  };
}

const unavailable = (): OwnerMfaState => ({
  kind: 'ERROR', factorId: null,
  message: 'MFA verification is temporarily unavailable. Owner enrollment remains locked.'
});

export async function inspectOwnerMfa(gateway: OwnerMfaGateway): Promise<OwnerMfaState> {
  try {
    const { data: factors, error: factorsError } = await gateway.auth.mfa.listFactors();
    if (factorsError || !factors || !Array.isArray(factors.totp)) return unavailable();
    const { data: level, error: levelError } = await gateway.auth.mfa.getAuthenticatorAssuranceLevel();
    if (levelError || !level) return unavailable();

    const factor = factors.totp.find(item => item.status === 'verified' && item.id);
    if (!factor) return {
      kind: 'ENROLL', factorId: null,
      message: 'Set up an authenticator app to protect your personal owner account.'
    };
    if (level.currentLevel !== 'aal2') return {
      kind: 'CHALLENGE', factorId: factor.id,
      message: 'Enter the current six-digit code from your authenticator app.'
    };
    return {
      kind: 'VERIFIED', factorId: factor.id,
      message: 'Your current session has verified multi-factor authentication (AAL2).'
    };
  } catch {
    return unavailable();
  }
}

export function isValidTotpCode(value: string) {
  return /^\d{6}$/.test(value.trim());
}

/** Only pass trusted image data URLs to an <img>, never a remote QR URL. */
export function safeTotpQrSource(value: unknown): string | null {
  return typeof value === 'string' &&
    /^data:image\/(?:svg\+xml|png);(?:charset=[\w-]+;)?base64,[A-Za-z0-9+/=]+$/.test(value) ? value : null;
}

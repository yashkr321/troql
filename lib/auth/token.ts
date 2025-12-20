import jwt from 'jsonwebtoken';
import { createHash } from 'crypto';

const SECRET = process.env.TROQL_SECRET || 'dev-secret-do-not-use-in-prod';
const TOKEN_TTL = '15m'; // 15 Minutes

export interface ProofOfPreviewPayload extends jwt.JwtPayload {
  jobId: string;
  repo: string;
  file: string;
  diffHash: string;
}

/**
 * Computes a SHA-256 hash of the unified diff content.
 * This ensures strict integrity: even a single whitespace change invalidates the token.
 */
export function computeDiffHash(diff: string): string {
  return createHash('sha256').update(diff).digest('hex');
}

/**
 * Mints a signed JWT asserting that a specific diff passed preview.
 */
export function signPreviewToken(
  jobId: string, 
  repoUrl: string, 
  targetFile: string, 
  diffHash: string
): string {
  const payload: ProofOfPreviewPayload = {
    jobId,
    repo: repoUrl,
    file: targetFile,
    diffHash
  };

  return jwt.sign(payload, SECRET, { 
    expiresIn: TOKEN_TTL,
    algorithm: 'HS256',
    issuer: 'troql-sandbox-worker'
  });
}

/**
 * Verifies the token signature and expiration.
 * Throws if invalid or expired.
 */
export function verifyPreviewToken(token: string): ProofOfPreviewPayload {
  return jwt.verify(token, SECRET, {
    algorithms: ['HS256'],
    issuer: 'troql-sandbox-worker'
  }) as ProofOfPreviewPayload;
}
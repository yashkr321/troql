import jwt from 'jsonwebtoken';
import { Octokit } from 'octokit';
import { installationTokenCache } from './tokenCache';

const APP_ID = process.env.GITHUB_APP_ID!;
const PRIVATE_KEY = process.env.GITHUB_APP_PRIVATE_KEY!.replace(/\\n/g, '\n');

// 1. Sign JWT for App-Level Auth
function generateAppJWT(): string {
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iat: now - 60, // Backdate 60s for clock skew
    exp: now + (10 * 60), // 10 min max expiry
    iss: APP_ID
  };
  return jwt.sign(payload, PRIVATE_KEY, { algorithm: 'RS256' });
}

// 2. Resolve Installation ID from Repo URL
export async function resolveInstallationId(owner: string, repo: string): Promise<number> {
  const appOctokit = new Octokit({ auth: generateAppJWT() });
  try {
    const { data } = await appOctokit.request('GET /repos/{owner}/{repo}/installation', {
      owner, repo
    });
    return data.id;
  } catch (error: any) {
    if (error.status === 404) {
      throw new Error("Troql App is not installed on this repository.");
    }
    throw error;
  }
}

// 3. Get Access Token
export async function getRepoInstallationToken(owner: string, repo: string): Promise<string> {
  // A. Find Installation ID
  const installationId = await resolveInstallationId(owner, repo);

  // B. Check Cache
  const cached = installationTokenCache.get(installationId);
  if (cached) return cached;

  // C. Exchange JWT for Installation Token
  const appOctokit = new Octokit({ auth: generateAppJWT() });
  try {
    const { data } = await appOctokit.request('POST /app/installations/{installation_id}/access_tokens', {
      installation_id: installationId
    });

    // D. Cache and Return
    installationTokenCache.set(installationId, data.token, data.expires_at);
    return data.token;
  } catch (error: any) {
    throw new Error(`Failed to negotiate installation token: ${error.message}`);
  }
}
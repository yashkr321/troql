class TokenCache {
  private cache = new Map<number, { token: string; expiresAt: number }>();
  // Buffer to refresh token before it strictly expires (5 minutes)
  private BUFFER_MS = 5 * 60 * 1000; 

  set(installationId: number, token: string, expiresAtIso: string) {
    const expiresAt = new Date(expiresAtIso).getTime();
    this.cache.set(installationId, { token, expiresAt });
  }

  get(installationId: number): string | null {
    const entry = this.cache.get(installationId);
    if (!entry) return null;

    if (Date.now() > entry.expiresAt - this.BUFFER_MS) {
      this.cache.delete(installationId); // Expired
      return null;
    }
    return entry.token;
  }
  
  invalidate(installationId: number) {
      this.cache.delete(installationId);
  }
}

export const installationTokenCache = new TokenCache();
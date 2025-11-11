/**
 * Token storage service using sessionStorage.
 * Tokens are stored per-tab and cleared when the tab/window closes.
 */
class TokenStorage {
  private static readonly STORAGE_KEY = "appifyhub_access_token";

  /**
   * Retrieves the token from sessionStorage.
   * @returns The token string, or null if not found.
   */
  public getToken(): string | null {
    try {
      return sessionStorage.getItem(TokenStorage.STORAGE_KEY);
    } catch (err) {
      console.warn("Failed to read token from sessionStorage:", err);
      return null;
    }
  }

  /**
   * Stores the token in sessionStorage.
   * @param token The token string to store.
   */
  public setToken(token: string): void {
    try {
      sessionStorage.setItem(TokenStorage.STORAGE_KEY, token);
    } catch (err) {
      console.warn("Failed to store token in sessionStorage:", err);
    }
  }

  /**
   * Removes the token from sessionStorage.
   */
  public clearToken(): void {
    try {
      sessionStorage.removeItem(TokenStorage.STORAGE_KEY);
    } catch (err) {
      console.warn("Failed to clear token from sessionStorage:", err);
    }
  }

  /**
   * Checks if a token exists in sessionStorage.
   * @returns True if a token exists, false otherwise.
   */
  public hasToken(): boolean {
    return this.getToken() !== null;
  }
}

// Export singleton instance
export const tokenStorage = new TokenStorage();

import { jwtDecode } from "jwt-decode";
import { Platform } from "@/lib/platform";

export class TokenExpiredError extends Error {
  public constructor() {
    super("Token expired");
    this.name = "TokenExpiredError";
  }
}

export class TokenMissingError extends Error {
  public constructor() {
    super("Token missing");
    this.name = "TokenMissingError";
  }
}

export interface DecodedToken {
  iss: string; // issuer - The app name that issued the token
  sub: string; // subject - The user's unique identifier
  platform: Platform; // platform where the token was issued
  platform_id?: string; // platform-specific user ID
  platform_handle?: string; // platform-specific user handle (username)
  sponsored_by?: string; // name of the user who sponsors this user (if any)
  exp: number; // token expiration timestamp (Unix epoch)
  iat: number; // token issued at timestamp (Unix epoch)
  version: string; // version of the app that issued the token
}

export class AccessToken {
  public readonly raw: string;
  public readonly decoded: DecodedToken;

  public constructor(raw: string) {
    if (!raw) throw new TokenMissingError();
    this.raw = raw;
    const rawDecoded = jwtDecode<Omit<DecodedToken, 'platform'> & { platform: string }>(raw);
    this.decoded = {
      ...rawDecoded,
      platform: Platform.fromString(rawDecoded.platform),
    };
    if (this.isExpired()) throw new TokenExpiredError();
  }

  public isExpired(): boolean {
    if (!this.decoded || !this.decoded.exp) return true;
    const nowInSeconds = Date.now() / 1000;
    return this.decoded.exp < nowInSeconds;
  }
}

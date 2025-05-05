import { jwtDecode } from "jwt-decode";

export interface DecodedToken {
  aud: string; // display name
  iss: string; // bot name
  sub: string; // internal profile ID
  role: string; // chat role (member, manager, creator...)
  chat_id: number | string; // CID
  telegram_user_id: number | string; // TID
  telegram_username?: string; // TUN
  exp: number; // expiry timestamp
  iat: number; // issue timestamp
}

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

export class AccessToken {
  public readonly raw: string;
  public readonly decoded: DecodedToken;

  public constructor(raw: string) {
    if (!raw) throw new TokenMissingError();
    this.raw = raw;
    this.decoded = jwtDecode<DecodedToken>(raw);
    if (this.isExpired()) throw new TokenExpiredError();
  }

  public isExpired(): boolean {
    if (!this.decoded || !this.decoded.exp) return true;
    const nowInSeconds = Date.now() / 1000;
    return this.decoded.exp < nowInSeconds;
  }
}

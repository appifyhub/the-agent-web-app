import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function maskSecret(
  secret: string | null | undefined,
  mask: string = "*"
): string | null {
  if (!secret) {
    return null;
  }
  const length = secret.length;
  // short strings: mask all
  if (length <= 4) {
    return mask.repeat(length);
  }
  // medium strings: show one char on each side
  if (length <= 8) {
    return secret[0] + mask.repeat(length - 2) + secret.slice(-1);
  }
  // long strings: show 3 chars on each end with 5 masks in the middle
  return secret.slice(0, 3) + mask.repeat(5) + secret.slice(-3);
}

export class TokenExpiredError extends Error {
  constructor() {
    super("Token expired");
    this.name = "TokenExpiredError";
  }
}

export class TokenMissingError extends Error {
  constructor() {
    super("Token missing");
    this.name = "TokenMissingError";
  }
}

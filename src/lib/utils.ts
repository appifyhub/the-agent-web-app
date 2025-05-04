import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Masks a secret string similar to how the backend does it.
 * Shows first 2 and last 2 characters, masks everything in between.
 * @param secret The secret string to mask
 * @param mask The character to use for masking (default: '*')
 * @returns The masked string, or null if input is null
 */
export function maskSecret(
  secret: string | null | undefined = null,
  mask: string = "*"
): string | null {
  if (!secret) {
    return null;
  }
  const length = secret.length;
  if (length < 5) {
    return mask.repeat(length);
  }
  return (
    secret.substring(0, 2) +
    mask.repeat(length - 4) +
    secret.substring(length - 2)
  );
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

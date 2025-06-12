import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export class PageError {
  public readonly text: string;
  public readonly isBlocker: boolean;

  public constructor(text: string, isBlocker: boolean) {
    this.text = text;
    this.isBlocker = isBlocker;
  }

  public static simple(text: string) {
    return new PageError(text, false);
  }

  public static blocker(text: string) {
    return new PageError(text, true);
  }
}

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

export function formatDate(dateString: string, locale: string = "en"): string {
  const date = new Date(dateString);
  try {
    return date.toLocaleDateString(locale);
  } catch {
    return date.toLocaleDateString();
  }
}

export function truncateMiddle(
  text: string,
  maxLength: number = 32,
  startChars: number = 12,
  endChars: number = 8
): string {
  if (text.length <= maxLength) {
    return text;
  }
  return `${text.slice(0, startChars)}...${text.slice(-endChars)}`;
}

export function cleanUsername(username: string): string {
  return username
    .replace(/\s+/g, "") // remove all spaces
    .replace(/^@+/, "") // remove leading @ signs
    .trim(); // remove any remaining leading/trailing whitespace
}

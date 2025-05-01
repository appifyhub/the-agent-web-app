import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export class Language {
  isoCode: string;
  defaultName: string;
  localizedName: string;
  flagEmoji: string;

  constructor(
    isoCode: string,
    defaultName: string,
    localizedName: string,
    flagEmoji: string
  ) {
    this.isoCode = isoCode;
    this.defaultName = defaultName;
    this.localizedName = localizedName;
    this.flagEmoji = flagEmoji;
  }
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
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

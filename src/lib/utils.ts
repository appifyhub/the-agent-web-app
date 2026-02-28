import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import React from "react";
import { TranslationKey } from "@/lib/translation-keys";
import { t } from "@/lib/translations";
import { ApiError, getErrorTranslationKey } from "@/lib/api-error";

export interface ErrorData {
  translationKey?: TranslationKey;
  variables?: Record<string, string | number>;
  htmlContent?: React.ReactNode;
}

export class PageError {
  public readonly errorData: ErrorData | null;
  public readonly isBlocker: boolean;
  public readonly showGenericAppendix: boolean;

  public constructor(
    errorData: ErrorData | null,
    isBlocker: boolean,
    showGenericAppendix: boolean
  ) {
    this.errorData = errorData;
    this.isBlocker = isBlocker;
    this.showGenericAppendix = showGenericAppendix;
  }

  public static simple(
    translationKey: TranslationKey,
    variables?: Record<string, string | number>,
    showGenericAppendix: boolean = true
  ) {
    return new PageError(
      { translationKey, variables },
      false,
      showGenericAppendix
    );
  }

  public static blocker(
    translationKey: TranslationKey,
    variables?: Record<string, string | number>,
    showGenericAppendix: boolean = true
  ) {
    return new PageError(
      { translationKey, variables },
      true,
      showGenericAppendix
    );
  }

  public static blockerWithHtml(
    htmlContent: React.ReactNode,
    showGenericAppendix: boolean = false
  ) {
    return new PageError(
      { htmlContent },
      true,
      showGenericAppendix
    );
  }

  public static fromApiError(
    apiError: ApiError,
    isBlocker: boolean = false,
    showGenericAppendix: boolean = true
  ) {
    const translationKey = getErrorTranslationKey(apiError.errorCode) || "errors.unknown";
    const variables = translationKey === "errors.unknown"
      ? { message: apiError.serverMessage }
      : undefined;

    return new PageError(
      { translationKey, variables },
      isBlocker,
      showGenericAppendix
    );
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
    .replace(/^[@+]+/, "") // remove leading @ or + signs
    .replace(/^\++/, "") // remove leading + signs
    .trim(); // remove any remaining leading/trailing whitespace
}

export function buildSponsoredBlockerError(
  lang_iso_code: string,
  user_id: string,
): PageError {
  const sponsorshipsUrl = `/${lang_iso_code}/user/${user_id}/sponsorships${window.location.search}`;
  const linkStyle = "underline text-amber-100 hover:text-white";
  const sponsorshipsLinkHtml = `<a href="${sponsorshipsUrl}" class="${linkStyle}">${t("sponsorships")}</a>`;
  const htmlMessage = t("errors.sponsored_user", { sponsorshipsLink: sponsorshipsLinkHtml });
  return PageError.blockerWithHtml(
    React.createElement("span", { dangerouslySetInnerHTML: { __html: htmlMessage } }),
    false,
  );
}

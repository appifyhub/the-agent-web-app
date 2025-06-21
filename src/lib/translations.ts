import { TranslationKey } from "@/lib/translation-keys";
import { INTERFACE_LANGUAGES } from "@/lib/languages";
import en from "@/assets/i18n/en.json";
import sr from "@/assets/i18n/sr.json";
import ar from "@/assets/i18n/ar.json";
import zh from "@/assets/i18n/zh.json";
import fr from "@/assets/i18n/fr.json";
import de from "@/assets/i18n/de.json";
import hi from "@/assets/i18n/hi.json";
import it from "@/assets/i18n/it.json";
import es from "@/assets/i18n/es.json";
import ru from "@/assets/i18n/ru.json";
import tr from "@/assets/i18n/tr.json";
import { en as pluralEn } from "make-plural";
import { sr as pluralRs } from "make-plural";
import { ar as pluralAr } from "make-plural";
import { zh as pluralZh } from "make-plural";
import { fr as pluralFr } from "make-plural";
import { de as pluralDe } from "make-plural";
import { hi as pluralHi } from "make-plural";
import { it as pluralIt } from "make-plural";
import { es as pluralEs } from "make-plural";
import { ru as pluralRu } from "make-plural";
import { tr as pluralTr } from "make-plural";

// Dynamically derive Language type from INTERFACE_LANGUAGES
export type Language = (typeof INTERFACE_LANGUAGES)[number]["isoCode"];

// Map language code to translation data and plural function
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const TRANSLATIONS: Record<Language, any> = {
  en,
  sr,
  ar,
  zh,
  fr,
  de,
  hi,
  it,
  es,
  ru,
  tr,
};

const PLURAL_RULES: Record<Language, (n: number) => string> = {
  en: pluralEn,
  sr: pluralRs,
  ar: pluralAr,
  zh: pluralZh,
  fr: pluralFr,
  de: pluralDe,
  hi: pluralHi,
  it: pluralIt,
  es: pluralEs,
  ru: pluralRu,
  tr: pluralTr,
};

// Helper: Get nested property by dot-separated key
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getNested(obj: any, path: string): any {
  return path.split(".").reduce((o, k) => (o ? o[k] : undefined), obj);
}

// Helper: Interpolate variables in a string, e.g. {count}, {user}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function interpolate(str: string, vars: Record<string, any>): string {
  return str.replace(/\{(\w+)\}/g, (_, k) =>
    vars[k] !== undefined ? String(vars[k]) : `{${k}}`
  );
}

// Main translation function
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Vars = Record<string, any>;

export function t(
  key: TranslationKey,
  vars: Vars = {},
  options?: { count?: number; lang?: Language }
): string {
  const lang = options?.lang || getCurrentLanguage();
  const translations = TRANSLATIONS[lang];
  if (!translations)
    throw new Error(`Translations for language '${lang}' not loaded.`);

  // Handle pluralization if key points to a plural object
  const baseKey = key.replace(/\.(zero|one|two|few|many|other)$/, "");
  const pluralObj = getNested(translations, baseKey);
  if (
    pluralObj &&
    typeof pluralObj === "object" &&
    ["zero", "one", "two", "few", "many", "other"].some((k) => k in pluralObj)
  ) {
    const count = options?.count ?? vars.count;
    if (typeof count !== "number") {
      throw new Error(
        `Pluralization requires a 'count' variable for key '${key}'.`
      );
    }
    const pluralCategory = PLURAL_RULES[lang](count);
    const template = pluralObj[pluralCategory] ?? pluralObj["other"];
    if (!template)
      throw new Error(
        `Missing plural form '${pluralCategory}' for key '${key}' in '${lang}'.`
      );
    return interpolate(template, { ...vars, count });
  }

  // Otherwise, resolve as a plain string
  const template = getNested(translations, key);
  if (!template)
    throw new Error(`Missing translation for key '${key}' in '${lang}'.`);
  return interpolate(template, vars);
}

// Language detection from URL (e.g., /en/...)
function getCurrentLanguage(): Language {
  if (typeof window !== "undefined") {
    const match = window.location.pathname.match(/^\/(\w{2})\b/);
    if (match) {
      const lang = match[1] as Language;
      if (TRANSLATIONS[lang]) return lang;
    }
  }
  return "en";
}

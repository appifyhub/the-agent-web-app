import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const I18N_DIR = path.join(__dirname, "../src/assets/i18n");
const OUTPUT_FILE = path.join(__dirname, "../src/lib/translation-keys.ts");

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function flattenKeys(obj: any, prefix = ""): string[] {
  return Object.keys(obj).flatMap((key) => {
    const value = obj[key];
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (typeof value === "object" && value !== null && !Array.isArray(value)) {
      return flattenKeys(value, fullKey);
    }
    return [fullKey];
  });
}

import { INTERFACE_LANGUAGES } from "../src/lib/languages.ts";

function main() {
  const enPath = path.join(I18N_DIR, "en.json");
  if (!fs.existsSync(enPath)) {
    throw new Error("en.json not found");
  }
  const en = JSON.parse(fs.readFileSync(enPath, "utf8"));
  const keys = flattenKeys(en);

  // Validate all INTERFACE_LANGUAGES have a translation file and all keys
  const missingLangs: string[] = [];
  const mismatchLangs: {
    isoCode: string;
    missingKeys: string[];
    extraKeys: string[];
  }[] = [];

  // Helper to extract placeholders from a string
  function extractPlaceholders(str: string): Set<string> {
    const matches = str.match(/\{(\w+)\}/g);
    return new Set(matches ? matches.map((m) => m.slice(1, -1)) : []);
  }

  // Helper to get value by flattened key from object
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function getValueByFlatKey(obj: any, flatKey: string): any {
    return flatKey.split(".").reduce((o, k) => (o ? o[k] : undefined), obj);
  }

  // For each language, validate keys and placeholders
  for (const lang of INTERFACE_LANGUAGES) {
    const langPath = path.join(I18N_DIR, `${lang.isoCode}.json`);
    if (!fs.existsSync(langPath)) {
      missingLangs.push(lang.isoCode);
      continue;
    }
    const langJson = JSON.parse(fs.readFileSync(langPath, "utf8"));
    const langKeys = flattenKeys(langJson);
    const missingKeys = keys.filter((k) => !langKeys.includes(k));
    const extraKeys = langKeys.filter((k) => !keys.includes(k));
    if (missingKeys.length > 0 || extraKeys.length > 0) {
      mismatchLangs.push({
        isoCode: lang.isoCode,
        missingKeys,
        extraKeys,
      });
    }

    // Placeholder consistency check
    for (const key of keys) {
      const enValue = getValueByFlatKey(en, key);
      const langValue = getValueByFlatKey(langJson, key);
      // Only check if both values are strings (skip objects/plurals)
      if (typeof enValue === "string" && typeof langValue === "string") {
        const enPlaceholders = extractPlaceholders(enValue);
        const langPlaceholders = extractPlaceholders(langValue);
        const missingInLang = [...enPlaceholders].filter(
          (p) => !langPlaceholders.has(p)
        );
        const extraInLang = [...langPlaceholders].filter(
          (p) => !enPlaceholders.has(p)
        );
        if (missingInLang.length > 0 || extraInLang.length > 0) {
          console.error(
            `[${lang.isoCode}] Placeholder mismatch in key '${key}':`
          );
          if (missingInLang.length > 0) {
            console.error(
              `  Missing in ${lang.isoCode}: {${missingInLang.join(", ")}}`
            );
          }
          if (extraInLang.length > 0) {
            console.error(
              `  Extra in ${lang.isoCode}: {${extraInLang.join(", ")}}`
            );
          }
          throw new Error(
            `Placeholder mismatch for key '${key}' in '${lang.isoCode}'. See above.`
          );
        }
      }

      // If value is an object (plural forms), check each plural form
      if (
        enValue &&
        typeof enValue === "object" &&
        langValue &&
        typeof langValue === "object"
      ) {
        const pluralForms = ["zero", "one", "two", "few", "many", "other"];
        for (const form of pluralForms) {
          if (enValue[form] && langValue[form]) {
            const enPlaceholders = extractPlaceholders(enValue[form]);
            const langPlaceholders = extractPlaceholders(langValue[form]);
            const missingInLang = [...enPlaceholders].filter(
              (p) => !langPlaceholders.has(p)
            );
            const extraInLang = [...langPlaceholders].filter(
              (p) => !enPlaceholders.has(p)
            );
            if (missingInLang.length > 0 || extraInLang.length > 0) {
              console.error(
                `[${lang.isoCode}] Placeholder mismatch in key '${key}.${form}':`
              );
              if (missingInLang.length > 0) {
                console.error(
                  `  Missing in ${lang.isoCode}: {${missingInLang.join(", ")}}`
                );
              }
              if (extraInLang.length > 0) {
                console.error(
                  `  Extra in ${lang.isoCode}: {${extraInLang.join(", ")}}`
                );
              }
              throw new Error(
                `Placeholder mismatch for key '${key}.${form}' in '${lang.isoCode}'. See above.`
              );
            }
          }
        }
      }
    }
  }
  if (missingLangs.length > 0) {
    throw new Error(
      `Missing translation files for: ${missingLangs.join(", ")}`
    );
  }
  if (mismatchLangs.length > 0) {
    for (const m of mismatchLangs) {
      if (m.missingKeys.length > 0) {
        console.error(
          `[${m.isoCode}] Missing keys:`,
          JSON.stringify(m.missingKeys, null, 2)
        );
      }
      if (m.extraKeys.length > 0) {
        console.error(
          `[${m.isoCode}] Extra keys:`,
          JSON.stringify(m.extraKeys, null, 2)
        );
      }
    }
    throw new Error(
      "Some translation files have missing or extra keys. See above."
    );
  }

  const typeDefLines = [
    "// Auto-generated by generate-translation-keys.ts",
    "// To regenerate, run one of:",
    "//   bunx ts-node scripts/generate-translation-keys.ts",
    "//   npx ts-node scripts/generate-translation-keys.ts",
    "//   bun run scripts/generate-translation-keys.ts",
    "//   npm run generate-translation-keys",
    "",
    "export type TranslationKey =",
    ...keys.map((k, i) => `  | "${k}"${i === keys.length - 1 ? ";" : ""}`),
  ];
  fs.writeFileSync(OUTPUT_FILE, typeDefLines.join("\n"));
  console.log(`Generated ${OUTPUT_FILE}`);
}

main();

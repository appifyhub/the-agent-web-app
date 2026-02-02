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

function validateJSONSyntax(filePath: string): void {
  const content = fs.readFileSync(filePath, "utf8");
  try {
    JSON.parse(content);
  } catch (error) {
    throw new Error(
      `Invalid JSON syntax in ${path.basename(filePath)}: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

function findDuplicateKeys(filePath: string): string[] {
  const content = fs.readFileSync(filePath, "utf8");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function findDuplicatesInObject(obj: any, path = ""): string[] {
    const duplicates: string[] = [];
    const keys = Object.keys(obj);
    const seenKeys = new Map<string, number>();

    for (const key of keys) {
      const count = seenKeys.get(key) || 0;
      seenKeys.set(key, count + 1);
    }

    for (const [key, count] of seenKeys.entries()) {
      if (count > 1) {
        const fullPath = path ? `${path}.${key}` : key;
        duplicates.push(fullPath);
      }
    }

    for (const key of keys) {
      const value = obj[key];
      if (value && typeof value === "object" && !Array.isArray(value)) {
        const nestedPath = path ? `${path}.${key}` : key;
        duplicates.push(...findDuplicatesInObject(value, nestedPath));
      }
    }

    return duplicates;
  }

  try {
    const parsed = JSON.parse(content);
    return findDuplicatesInObject(parsed);
  } catch {
    return [];
  }
}

import { INTERFACE_LANGUAGES } from "../src/lib/languages.ts";

function main() {
  console.log("Validating JSON files...\n");

  const allLangCodes = INTERFACE_LANGUAGES.map((l) => l.isoCode);
  const jsonFiles = allLangCodes.map((code) =>
    path.join(I18N_DIR, `${code}.json`)
  );

  for (const filePath of jsonFiles) {
    if (!fs.existsSync(filePath)) {
      continue;
    }

    const fileName = path.basename(filePath);

    validateJSONSyntax(filePath);

    const duplicates = findDuplicateKeys(filePath);
    if (duplicates.length > 0) {
      console.error(`[${fileName}] Found duplicate keys:`);
      duplicates.forEach((key) => console.error(`  - "${key}"`));
      throw new Error(
        `Duplicate keys found in ${fileName}. See above for details.`
      );
    }
  }

  console.log("✓ All JSON files are valid with no duplicate keys\n");

  const enPath = path.join(I18N_DIR, "en.json");
  if (!fs.existsSync(enPath)) {
    throw new Error("en.json not found");
  }
  const en = JSON.parse(fs.readFileSync(enPath, "utf8"));
  const keys = flattenKeys(en);

  const missingLangs: string[] = [];
  const mismatchLangs: {
    isoCode: string;
    missingKeys: string[];
    extraKeys: string[];
  }[] = [];

  function extractPlaceholders(str: string): Set<string> {
    const matches = str.match(/\{(\w+)\}/g);
    return new Set(matches ? matches.map((m) => m.slice(1, -1)) : []);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function getValueByFlatKey(obj: any, flatKey: string): any {
    return flatKey.split(".").reduce((o, k) => (o ? o[k] : undefined), obj);
  }

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

    for (const key of keys) {
      const enValue = getValueByFlatKey(en, key);
      const langValue = getValueByFlatKey(langJson, key);
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

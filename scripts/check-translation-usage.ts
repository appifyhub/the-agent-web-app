import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { execSync } from "child_process";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SRC_DIR = path.join(__dirname, "../src");
const TRANSLATION_KEYS_FILE = path.join(
  __dirname,
  "../src/lib/translation-keys.ts"
);

// Extract all translation keys from the type definition
function extractKeys(): string[] {
  const content = fs.readFileSync(TRANSLATION_KEYS_FILE, "utf8");
  const keys: string[] = [];
  const keyRegex = /\| "([^"]+)"/g;
  let match;
  while ((match = keyRegex.exec(content)) !== null) {
    keys.push(match[1]);
  }
  return keys;
}

// Escape special characters for grep
function escapeForGrep(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Search for usage of a key in the codebase
function searchKeyUsage(key: string): boolean {
  try {
    const escapedKey = escapeForGrep(key);

    // Search for t("key") or t('key') or t(`key`)
    const patterns = [
      `t\\(\\"${escapedKey}\\"`,
      `t\\(\\'${escapedKey}\\'`,
      `t\\(\\\`${escapedKey}\\\``,
    ];

    // Search in source files
    const patternStr = patterns.join("|");
    const result = execSync(
      `grep -r --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" -E "${patternStr}" "${SRC_DIR}" 2>/dev/null || true`,
      { encoding: "utf8", maxBuffer: 10 * 1024 * 1024 }
    );

    if (result.trim()) {
      return true;
    }

    // Check for dynamic usage patterns (e.g., tools.types.${toolType}.title)
    if (
      key.startsWith("tools.types.") &&
      (key.endsWith(".title") || key.endsWith(".description"))
    ) {
      const dynamicResult = execSync(
        `grep -r --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" -E "tools\\.types\\.\\\\\\$\\{.*\\}\\.(title|description)" "${SRC_DIR}" 2>/dev/null || true`,
        { encoding: "utf8", maxBuffer: 10 * 1024 * 1024 }
      );
      if (dynamicResult.trim()) {
        return true;
      }
    }

    // Check for dynamic tools.groups usage (e.g., tools.groups.${category}.title)
    if (
      key.startsWith("tools.groups.") &&
      key.endsWith(".title")
    ) {
      const dynamicResult = execSync(
        `grep -r --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" -E "tools\\.groups\\.\\\\\\$\\{.*\\}\\.title" "${SRC_DIR}" 2>/dev/null || true`,
        { encoding: "utf8", maxBuffer: 10 * 1024 * 1024 }
      );
      if (dynamicResult.trim()) {
        return true;
      }
    }

    // Check for dynamic features usage
    if (
      key.startsWith("features.items.") &&
      (key.endsWith(".title") || key.endsWith(".description"))
    ) {
      const dynamicResult = execSync(
        `grep -r --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" -E "features\\.items\\.\\\\\\$\\{.*\\}\\.(title|description)" "${SRC_DIR}" 2>/dev/null || true`,
        { encoding: "utf8", maxBuffer: 10 * 1024 * 1024 }
      );
      if (dynamicResult.trim()) {
        return true;
      }
    }

    // Check for PageError.blocker() and PageError.simple() usage
    if (key.startsWith("errors.")) {
      const errorResult = execSync(
        `grep -r --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" -E "PageError\\.(blocker|simple)\\(\\"${escapedKey}\\"|PageError\\.(blocker|simple)\\(\\'${escapedKey}\\'" "${SRC_DIR}" 2>/dev/null || true`,
        { encoding: "utf8", maxBuffer: 10 * 1024 * 1024 }
      );
      if (errorResult.trim()) {
        return true;
      }
    }

    return false;
  } catch {
    // If grep fails, assume not found
    return false;
  }
}

function main() {
  console.log("Checking translation key usage...\n");

  const keys = extractKeys();
  console.log(`Found ${keys.length} translation keys\n`);

  const unusedKeys: string[] = [];
  const usedKeys: string[] = [];

  for (const key of keys) {
    if (searchKeyUsage(key)) {
      usedKeys.push(key);
    } else {
      unusedKeys.push(key);
    }
  }

  console.log(`Used keys: ${usedKeys.length}`);
  console.log(`Unused keys: ${unusedKeys.length}\n`);

  if (unusedKeys.length > 0) {
    console.log("⚠️  Unused translation keys:");
    unusedKeys.forEach((key) => {
      console.log(`  - ${key}`);
    });
    console.log();
  } else {
    console.log("✅ All translation keys are used!\n");
  }

  // Exit with error code if there are unused keys
  if (unusedKeys.length > 0) {
    process.exit(1);
  }
}

main();

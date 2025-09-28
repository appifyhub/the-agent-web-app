import { t } from "@/lib/translations";

export enum Platform {
  BACKGROUND = "background",
  GITHUB = "github",
  TELEGRAM = "telegram",
  UNKNOWN = "unknown",
}

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace Platform {

  export function fromString(value: string): Platform {
    const platformValues = Object.values(Platform) as string[];
    return platformValues.includes(value)
      ? (value as Platform)
      : Platform.UNKNOWN;
  }

  export function getName(platform: Platform): string {
    switch (platform) {
      case Platform.TELEGRAM:
        return t("platforms.telegram");
      default:
        return t("platforms.unknown");
    }
  }

}

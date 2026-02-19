import { ToolType } from "@/services/external-tools-service";
import { UserSettings } from "@/services/user-settings-service";

export type ToolPreset = "lowest_price" | "highest_price" | "agent_choice" | "custom";

const PRESET_CHOICES: Record<ToolPreset, Partial<Record<ToolType, string>>> = {
  lowest_price: {
    chat: "gpt-5-nano",
    copywriting: "gpt-5-nano",
    reasoning: "gpt-5-nano",
    vision: "gpt-4.1-nano",
    hearing: "whisper-1",
    images_gen: "bytedance/seedream-4",
    images_edit: "bytedance/seedream-4",
    search: "sonar",
    embedding: "text-embedding-3-small",
  },
  highest_price: {
    chat: "gemini-3-pro-preview",
    copywriting: "claude-sonnet-4-5",
    reasoning: "claude-sonnet-4-5",
    vision: "gpt-5.2",
    hearing: "gpt-4o-transcribe",
    images_gen: "google/nano-banana-pro",
    images_edit: "google/nano-banana-pro",
    search: "sonar-reasoning-pro",
    embedding: "text-embedding-3-large",
  },
  agent_choice: {
    chat: "gemini-3-pro-preview",
    copywriting: "gpt-5.2",
    reasoning: "claude-sonnet-4-5",
    vision: "gpt-5.2",
    hearing: "gpt-4o-mini-transcribe",
    images_gen: "black-forest-labs/flux-2-pro",
    images_edit: "black-forest-labs/flux-2-pro",
    search: "sonar-pro",
    embedding: "text-embedding-3-small",
  },
  custom: {},
};

export function computePresetChoices(
  preset: ToolPreset,
): Partial<Record<ToolType, string>> {
  return PRESET_CHOICES[preset];
}

export function detectCurrentPreset(currentSettings: UserSettings): ToolPreset {
  const presets: ToolPreset[] = ["lowest_price", "highest_price", "agent_choice"];

  for (const preset of presets) {
    const choices = PRESET_CHOICES[preset];
    const typesWithChoices = Object.keys(choices) as ToolType[];

    const matches = typesWithChoices.every((toolType) => {
      const fieldName = `tool_choice_${toolType}` as keyof UserSettings;
      return currentSettings[fieldName] === choices[toolType];
    });

    if (matches) return preset;
  }

  return "custom";
}

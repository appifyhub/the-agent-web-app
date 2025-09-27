import { request } from "@/services/networking";
import { maskSecret } from "@/lib/utils";

export interface UserSettings {
  id: string;
  full_name?: string;
  telegram_chat_id?: string;
  open_ai_key?: string;
  anthropic_key?: string;
  google_ai_key?: string;
  perplexity_key?: string;
  replicate_key?: string;
  rapid_api_key?: string;
  coinmarketcap_key?: string;
  tool_choice_chat?: string;
  tool_choice_reasoning?: string;
  tool_choice_copywriting?: string;
  tool_choice_vision?: string;
  tool_choice_hearing?: string;
  tool_choice_images_gen?: string;
  tool_choice_images_edit?: string;
  tool_choice_images_restoration?: string;
  tool_choice_images_inpainting?: string;
  tool_choice_images_background_removal?: string;
  tool_choice_search?: string;
  tool_choice_embedding?: string;
  tool_choice_api_fiat_exchange?: string;
  tool_choice_api_crypto_exchange?: string;
  tool_choice_api_twitter?: string;
  group?: string;
  created_at?: string;
}

export interface ChatInfo {
  chat_id: string;
  title: string;
  is_own: boolean;
}

const PROVIDER_ID_TO_SETTING: Record<string, keyof UserSettings> = {
  "open-ai": "open_ai_key",
  anthropic: "anthropic_key",
  "google-ai": "google_ai_key",
  perplexity: "perplexity_key",
  replicate: "replicate_key",
  "rapid-api": "rapid_api_key",
  "coinmarketcap-api": "coinmarketcap_key",
};

export function getSettingsFieldName(providerId: string): keyof UserSettings {
  return PROVIDER_ID_TO_SETTING[providerId];
}

export interface UserSettingsPayload {
  open_ai_key?: string;
  anthropic_key?: string;
  google_ai_key?: string;
  perplexity_key?: string;
  replicate_key?: string;
  rapid_api_key?: string;
  coinmarketcap_key?: string;
  tool_choice_chat?: string;
  tool_choice_reasoning?: string;
  tool_choice_copywriting?: string;
  tool_choice_vision?: string;
  tool_choice_hearing?: string;
  tool_choice_images_gen?: string;
  tool_choice_images_edit?: string;
  tool_choice_images_restoration?: string;
  tool_choice_images_inpainting?: string;
  tool_choice_images_background_removal?: string;
  tool_choice_search?: string;
  tool_choice_embedding?: string;
  tool_choice_api_fiat_exchange?: string;
  tool_choice_api_crypto_exchange?: string;
  tool_choice_api_twitter?: string;
}

const MASKED_FIELDS: (keyof UserSettingsPayload)[] = [
  "open_ai_key",
  "anthropic_key",
  "google_ai_key",
  "perplexity_key",
  "replicate_key",
  "rapid_api_key",
  "coinmarketcap_key",
];

const REGULAR_FIELDS: (keyof UserSettingsPayload)[] = [
  "tool_choice_chat",
  "tool_choice_reasoning",
  "tool_choice_copywriting",
  "tool_choice_vision",
  "tool_choice_hearing",
  "tool_choice_images_gen",
  "tool_choice_images_edit",
  "tool_choice_images_restoration",
  "tool_choice_images_inpainting",
  "tool_choice_images_background_removal",
  "tool_choice_search",
  "tool_choice_embedding",
  "tool_choice_api_fiat_exchange",
  "tool_choice_api_crypto_exchange",
  "tool_choice_api_twitter",
];

/**
 * Checks if a masked property (like an API key) has been changed.
 * Accounts for the fact that backend sends masked values like "sk-***abcd"
 */
function isMaskedPropertyChanged(
  localProperty: string | null | undefined,
  remoteProperty: string | null | undefined
): boolean {
  if (!!localProperty !== !!remoteProperty) return true;
  if (!localProperty || !remoteProperty) return false;
  if (localProperty === remoteProperty) return false;
  if (maskSecret(localProperty) === remoteProperty) return false;
  return true;
}

/**
 * Builds a payload containing only the fields that have actually changed.
 * Uses appropriate comparison logic for masked vs regular fields.
 */
export function buildChangedPayload(
  userSettings: UserSettings,
  remoteSettings: UserSettings
): UserSettingsPayload {
  const payload: UserSettingsPayload = {};
  MASKED_FIELDS.forEach((field) => {
    if (isMaskedPropertyChanged(userSettings[field], remoteSettings[field])) {
      payload[field] = userSettings[field] ?? "";
    }
  });
  REGULAR_FIELDS.forEach((field) => {
    if (userSettings[field] !== remoteSettings[field]) {
      payload[field] = userSettings[field] ?? "";
    }
  });
  return payload;
}

export function areSettingsChanged(
  userSettings: UserSettings,
  remoteSettings: UserSettings
): boolean {
  const maskedChanged = MASKED_FIELDS.some((field) =>
    isMaskedPropertyChanged(userSettings[field], remoteSettings[field])
  );
  if (maskedChanged) return true;
  const regularChanged = REGULAR_FIELDS.some(
    (field) => userSettings[field] !== remoteSettings[field]
  );
  return regularChanged;
}

export async function fetchUserChats({
  apiBaseUrl,
  user_id,
  rawToken,
}: {
  apiBaseUrl: string;
  user_id: string;
  rawToken: string;
}): Promise<ChatInfo[]> {
  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${rawToken}`,
  };
  const response = await request(`${apiBaseUrl}/user/${user_id}/chats`, {
    method: "GET",
    headers: headers,
  });
  if (!response.ok) {
    throw new Error(
      `Network error!\n\tStatus: ${response.status}\n\tError: ${response.statusText}`
    );
  }
  return response.json();
}

export async function fetchUserSettings({
  apiBaseUrl,
  user_id,
  rawToken,
}: {
  apiBaseUrl: string;
  user_id: string;
  rawToken: string;
}): Promise<UserSettings> {
  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${rawToken}`,
  };
  const response = await request(`${apiBaseUrl}/settings/user/${user_id}`, {
    method: "GET",
    headers: headers,
  });
  if (!response.ok) {
    throw new Error(
      `Network error!\n\tStatus: ${response.status}\n\tError: ${response.statusText}`
    );
  }
  return response.json();
}

export async function saveUserSettings({
  apiBaseUrl,
  user_id,
  rawToken,
  payload,
}: {
  apiBaseUrl: string;
  user_id: string;
  rawToken: string;
  payload: UserSettingsPayload;
}): Promise<void> {
  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${rawToken}`,
  };
  const response = await request(`${apiBaseUrl}/settings/user/${user_id}`, {
    method: "PATCH",
    headers: headers,
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    let reason = "";
    try {
      const data = await response.json();
      reason = data.reason || "";
    } catch (e) {
      console.error("Failed to parse response!", e);
    }
    throw new Error(`Failed to save settings. ${reason}`);
  }
}

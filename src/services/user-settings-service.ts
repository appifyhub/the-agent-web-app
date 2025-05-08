import { request } from "@/services/networking";

export interface UserSettings {
  id: string;
  full_name?: string;
  telegram_username?: string;
  telegram_chat_id?: string;
  telegram_user_id?: number;
  open_ai_key?: string;
  anthropic_key?: string;
  rapid_api_key?: string;
  coin_api_key?: string;
  group?: string;
  created_at?: string;
}

// Mapping of `SERVICE_PROVIDER.id` to `UserSettings` keys
export const PROVIDER_KEY_MAP: Record<string, keyof UserSettings> = {
  "open-ai": "open_ai_key",
  anthropic: "anthropic_key",
  "rapid-api": "rapid_api_key",
  "coin-api": "coin_api_key",
};

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
  open_ai_key,
  anthropic_key = undefined,
  rapid_api_key = undefined,
  coin_api_key = undefined,
}: {
  apiBaseUrl: string;
  user_id: string;
  rawToken: string;
  open_ai_key: string;
  anthropic_key?: string;
  rapid_api_key?: string;
  coin_api_key?: string;
}): Promise<void> {
  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${rawToken}`,
  };
  const payload = { open_ai_key, anthropic_key, rapid_api_key, coin_api_key };
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

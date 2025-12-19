import { request } from "@/services/networking";

export type ReleaseNotificationsSetting = "none" | "major" | "minor" | "all";
export type MediaModeSetting = "photo" | "file" | "all";

export interface ChatSettings {
  chat_id: string;
  title?: string;
  platform: string;
  is_own: boolean;
  is_private: boolean;
  language_name?: string;
  language_iso_code?: string;
  reply_chance_percent: number;
  release_notifications: ReleaseNotificationsSetting;
  media_mode: MediaModeSetting;
  use_about_me: boolean;
}

export async function fetchChatSettings({
  apiBaseUrl,
  chat_id,
  rawToken,
}: {
  apiBaseUrl: string;
  chat_id: string;
  rawToken: string;
}): Promise<ChatSettings> {
  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${rawToken}`,
  };
  const response = await request(`${apiBaseUrl}/settings/chat/${chat_id}`, {
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

export async function saveChatSettings({
  apiBaseUrl,
  chat_id,
  rawToken,
  chatSettings,
}: {
  apiBaseUrl: string;
  chat_id: string;
  rawToken: string;
  chatSettings: ChatSettings;
}): Promise<void> {
  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${rawToken}`,
  };
  const payload = {
    language_name: chatSettings.language_name,
    language_iso_code: chatSettings.language_iso_code,
    reply_chance_percent: chatSettings.reply_chance_percent,
    release_notifications: chatSettings.release_notifications,
    media_mode: chatSettings.media_mode,
    use_about_me: chatSettings.use_about_me,
  };
  const response = await request(`${apiBaseUrl}/settings/chat/${chat_id}`, {
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

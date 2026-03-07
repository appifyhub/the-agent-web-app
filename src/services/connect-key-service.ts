import { request } from "@/services/networking";
import { parseApiError } from "@/lib/api-error";

export interface ConnectKeyResponse {
  connect_key: string;
}

export interface SettingsLinkResponse {
  settings_link: string;
}

export async function getConnectKey({
  apiBaseUrl,
  user_id,
  rawToken,
}: {
  apiBaseUrl: string;
  user_id: string;
  rawToken: string;
}): Promise<ConnectKeyResponse> {
  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${rawToken}`,
  };
  const response = await request(`${apiBaseUrl}/user/${user_id}/connect-key`, {
    method: "GET",
    headers: headers,
  });
  if (!response.ok) {
    throw await parseApiError(response);
  }
  return response.json();
}

export async function regenerateConnectKey({
  apiBaseUrl,
  user_id,
  rawToken,
}: {
  apiBaseUrl: string;
  user_id: string;
  rawToken: string;
}): Promise<ConnectKeyResponse> {
  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${rawToken}`,
  };
  const response = await request(
    `${apiBaseUrl}/user/${user_id}/regenerate-connect-key`,
    {
      method: "POST",
      headers: headers,
    }
  );
  if (!response.ok) {
    throw await parseApiError(response);
  }
  return response.json();
}

export async function connectProfiles({
  apiBaseUrl,
  user_id,
  rawToken,
  connect_key,
}: {
  apiBaseUrl: string;
  user_id: string;
  rawToken: string;
  connect_key: string;
}): Promise<SettingsLinkResponse> {
  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${rawToken}`,
  };
  const response = await request(
    `${apiBaseUrl}/user/${user_id}/connect-key/${connect_key}/merge`,
    {
      method: "POST",
      headers: headers,
    }
  );
  if (!response.ok) {
    throw await parseApiError(response);
  }
  return response.json();
}

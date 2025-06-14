import { request } from "@/services/networking";

export interface SponsorshipResponse {
  full_name: string | null;
  telegram_username: string | null;
  sponsored_at: string;
  accepted_at: string | null;
}

export interface UserSponsorshipsResponse {
  sponsorships: SponsorshipResponse[];
  max_sponsorships: number;
}

export async function fetchUserSponsorships({
  apiBaseUrl,
  resource_id,
  rawToken,
}: {
  apiBaseUrl: string;
  resource_id: string;
  rawToken: string;
}): Promise<UserSponsorshipsResponse> {
  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${rawToken}`,
  };
  const response = await request(
    `${apiBaseUrl}/user/${resource_id}/sponsorships`,
    {
      method: "GET",
      headers: headers,
    }
  );
  if (!response.ok) {
    throw new Error(
      `Network error!\n\tStatus: ${response.status}\n\tError: ${response.statusText}`
    );
  }
  return response.json();
}

export async function createSponsorship({
  apiBaseUrl,
  resource_id,
  rawToken,
  receiver_telegram_username,
}: {
  apiBaseUrl: string;
  resource_id: string;
  rawToken: string;
  receiver_telegram_username: string;
}): Promise<void> {
  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${rawToken}`,
  };
  const payload = { receiver_telegram_username };
  const response = await request(
    `${apiBaseUrl}/user/${resource_id}/sponsorships`,
    {
      method: "POST",
      headers: headers,
      body: JSON.stringify(payload),
    }
  );
  if (!response.ok) {
    let reason = "";
    try {
      const data = await response.json();
      reason = data.reason || "";
    } catch (e) {
      console.error("Failed to parse response!", e);
    }
    throw new Error(`Failed to create sponsorship. ${reason}`);
  }
}

export async function removeSponsorship({
  apiBaseUrl,
  resource_id,
  receiver_telegram_username,
  rawToken,
}: {
  apiBaseUrl: string;
  resource_id: string;
  receiver_telegram_username: string;
  rawToken: string;
}): Promise<void> {
  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${rawToken}`,
  };
  const response = await request(
    `${apiBaseUrl}/user/${resource_id}/sponsorships/${receiver_telegram_username}`,
    {
      method: "DELETE",
      headers: headers,
    }
  );
  if (!response.ok) {
    let reason = "";
    try {
      const data = await response.json();
      reason = data.reason || "";
    } catch (e) {
      console.error("Failed to parse response!", e);
    }
    throw new Error(`Failed to remove sponsorship. ${reason}`);
  }
}

export async function removeSelfSponsorship({
  apiBaseUrl,
  resource_id,
  rawToken,
}: {
  apiBaseUrl: string;
  resource_id: string;
  rawToken: string;
}): Promise<{ settings_link: string }> {
  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${rawToken}`,
  };
  const response = await request(
    `${apiBaseUrl}/user/${resource_id}/sponsored`,
    {
      method: "DELETE",
      headers: headers,
    }
  );
  if (!response.ok) {
    let reason = "";
    try {
      const data = await response.json();
      reason = data.detail?.reason || "";
    } catch (e) {
      console.error("Failed to parse response!", e);
    }
    throw new Error(`Failed to remove self-sponsorship. ${reason}`);
  }
  return response.json();
}

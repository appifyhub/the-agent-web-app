import { request } from "@/services/networking";
import { Platform } from "@/lib/platform";

export interface SponsorshipResponse {
  full_name: string | null;
  platform_handle: string | null;
  platform: Platform;
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
  const rawData = await response.json() as Omit<UserSponsorshipsResponse, "sponsorships"> & {
    sponsorships: (Omit<SponsorshipResponse, "platform"> & { platform: string })[];
  };

  return {
    ...rawData,
    sponsorships: rawData.sponsorships.map(sponsorship => ({
      ...sponsorship,
      platform: Platform.fromString(sponsorship.platform),
    })),
  };
}

export async function createSponsorship({
  apiBaseUrl,
  resource_id,
  rawToken,
  platform_handle,
  platform,
}: {
  apiBaseUrl: string;
  resource_id: string;
  rawToken: string;
  platform_handle: string;
  platform: Platform;
}): Promise<void> {
  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${rawToken}`,
  };
  const payload = { platform_handle, platform };
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
  platform_handle,
  platform,
  rawToken,
}: {
  apiBaseUrl: string;
  resource_id: string;
  platform_handle: string;
  platform: Platform;
  rawToken: string;
}): Promise<void> {
  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${rawToken}`,
  };
  const response = await request(
    `${apiBaseUrl}/user/${resource_id}/sponsorships/${platform}/${platform_handle}`,
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

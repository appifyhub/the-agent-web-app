import { request } from "@/services/networking";
import { Platform } from "@/lib/platform";
import { cleanUsername } from "@/lib/utils";
import { parseApiError } from "@/lib/api-error";

export interface SponsorshipResponse {
  user_id_hex: string;
  full_name: string | null;
  platform_handle: string | null;
  platform: Platform | null;
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
    throw await parseApiError(response);
  }
  const rawData = await response.json() as Omit<UserSponsorshipsResponse, "sponsorships"> & {
    sponsorships: (Omit<SponsorshipResponse, "platform"> & { platform: string | null })[];
  };

  return {
    ...rawData,
    sponsorships: rawData.sponsorships.map(sponsorship => ({
      ...sponsorship,
      platform: sponsorship.platform ? Platform.fromString(sponsorship.platform) : null,
      platform_handle: sponsorship.platform_handle ? cleanUsername(sponsorship.platform_handle) : null, // Clean handle on fetch
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
    throw await parseApiError(response);
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
    throw await parseApiError(response);
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
}): Promise<void> {
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
    throw await parseApiError(response);
  }
}

import { request } from "@/services/networking";

// Tool types that correspond to the tool_choice_* fields in UserSettings
export type ToolType =
  | "chat"
  | "reasoning"
  | "copywriting"
  | "vision"
  | "hearing"
  | "images_gen"
  | "images_edit"
  | "images_restoration"
  | "images_inpainting"
  | "images_background_removal"
  | "search"
  | "embedding"
  | "api_fiat_exchange"
  | "api_crypto_exchange"
  | "api_twitter";

export interface ExternalTool {
  id: string;
  name: string;
  provider: ExternalToolProvider;
  types: ToolType[];
}

export interface ExternalToolProvider {
  id: string;
  name: string;
  token_management_url: string;
  token_format: string;
  tools: string[];
}

export interface ExternalToolResponse {
  definition: ExternalTool;
  is_configured: boolean;
}

export interface ExternalToolProviderResponse {
  definition: ExternalToolProvider;
  is_configured: boolean;
}

export interface ExternalToolsResponse {
  tools: ExternalToolResponse[];
  providers: ExternalToolProviderResponse[];
}

export async function fetchExternalTools({
  apiBaseUrl,
  user_id,
  rawToken,
}: {
  apiBaseUrl: string;
  user_id: string;
  rawToken: string;
}): Promise<ExternalToolsResponse> {
  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${rawToken}`,
  };
  const response = await request(
    `${apiBaseUrl}/settings/user/${user_id}/tools`,
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

export function formatToolsForDisplay(tools: string[]): string {
  return tools.join(" · ");
}

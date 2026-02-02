import { request } from "@/services/networking";
import { ExternalTool, ToolType } from "@/services/external-tools-service";

export interface UsageRecord {
  user_id: string;
  chat_id?: string;
  tool: ExternalTool;
  tool_purpose: ToolType;
  timestamp: string;
  runtime_seconds: number;
  remote_runtime_seconds?: number;
  model_cost_credits: number;
  remote_runtime_cost_credits: number;
  api_call_cost_credits: number;
  maintenance_fee_credits: number;
  total_cost_credits: number;
  input_tokens?: number;
  output_tokens?: number;
  search_tokens?: number;
  total_tokens?: number;
  output_image_sizes?: string[];
  input_image_sizes?: string[];
}

export interface AggregateStats {
  record_count: number;
  total_cost: number;
}

export interface ToolInfo {
  id: string;
  name: string;
}

export interface ProviderInfo {
  id: string;
  name: string;
}

export interface UsageAggregatesResponse {
  total_records: number;
  total_cost_credits: number;
  total_runtime_seconds: number;
  by_tool: Record<string, AggregateStats>;
  by_purpose: Record<string, AggregateStats>;
  by_provider: Record<string, AggregateStats>;
  all_tools_used: ToolInfo[];
  all_purposes_used: string[];
  all_providers_used: ProviderInfo[];
}

export interface UsageRecordsParams {
  apiBaseUrl: string;
  user_id: string;
  rawToken: string;
  skip?: number;
  limit?: number;
  start_date?: string;
  end_date?: string;
  exclude_self?: boolean;
  include_sponsored?: boolean;
  tool_id?: string;
  purpose?: string;
  provider_id?: string;
}

export interface UsageStatsParams {
  apiBaseUrl: string;
  user_id: string;
  rawToken: string;
  start_date?: string;
  end_date?: string;
  exclude_self?: boolean;
  include_sponsored?: boolean;
  tool_id?: string;
  purpose?: string;
  provider_id?: string;
}

function buildQueryString(params: Record<string, unknown>): string {
  const searchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null) {
      searchParams.append(key, String(value));
    }
  }
  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : "";
}

export async function fetchUsageRecords({
  apiBaseUrl,
  user_id,
  rawToken,
  skip,
  limit,
  start_date,
  end_date,
  exclude_self,
  include_sponsored,
  tool_id,
  purpose,
  provider_id,
}: UsageRecordsParams): Promise<UsageRecord[]> {
  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${rawToken}`,
  };
  const queryParams = buildQueryString({
    skip,
    limit,
    start_date,
    end_date,
    exclude_self,
    include_sponsored,
    tool_id,
    purpose,
    provider_id,
  });
  const response = await request(
    `${apiBaseUrl}/user/${user_id}/usage${queryParams}`,
    {
      method: "GET",
      headers: headers,
    }
  );
  if (!response.ok) {
    let reason = "";
    try {
      const data = await response.json();
      reason = data.reason || data.detail?.reason || "";
    } catch (e) {
      console.error("Failed to parse response!", e);
    }
    throw new Error(`Failed to fetch usage records. ${reason}`);
  }
  return response.json();
}

export async function fetchUsageStats({
  apiBaseUrl,
  user_id,
  rawToken,
  start_date,
  end_date,
  exclude_self,
  include_sponsored,
  tool_id,
  purpose,
  provider_id,
}: UsageStatsParams): Promise<UsageAggregatesResponse> {
  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${rawToken}`,
  };
  const queryParams = buildQueryString({
    start_date,
    end_date,
    exclude_self,
    include_sponsored,
    tool_id,
    purpose,
    provider_id,
  });
  const response = await request(
    `${apiBaseUrl}/user/${user_id}/usage/stats${queryParams}`,
    {
      method: "GET",
      headers: headers,
    }
  );
  if (!response.ok) {
    let reason = "";
    try {
      const data = await response.json();
      reason = data.reason || data.detail?.reason || "";
    } catch (e) {
      console.error("Failed to parse response!", e);
    }
    throw new Error(`Failed to fetch usage stats. ${reason}`);
  }
  return response.json();
}

export type TimeRange =
  | "all"
  | "10min"
  | "30min"
  | "1h"
  | "3h"
  | "6h"
  | "12h"
  | "today"
  | "yesterday"
  | "week"
  | "2weeks"
  | "month";

export function calculateDateRange(timeRange: TimeRange): {
  start_date?: string;
  end_date?: string;
} {
  if (timeRange === "all") {
    return {};
  }

  const now = new Date();
  let startDate: Date;
  let endDate: Date = now;

  switch (timeRange) {
    case "10min":
      startDate = new Date(now.getTime() - 10 * 60 * 1000);
      break;
    case "30min":
      startDate = new Date(now.getTime() - 30 * 60 * 1000);
      break;
    case "1h":
      startDate = new Date(now.getTime() - 60 * 60 * 1000);
      break;
    case "3h":
      startDate = new Date(now.getTime() - 3 * 60 * 60 * 1000);
      break;
    case "6h":
      startDate = new Date(now.getTime() - 6 * 60 * 60 * 1000);
      break;
    case "12h":
      startDate = new Date(now.getTime() - 12 * 60 * 60 * 1000);
      break;
    case "today":
      startDate = new Date(now);
      startDate.setHours(0, 0, 0, 0);
      break;
    case "yesterday":
      startDate = new Date(now);
      startDate.setDate(startDate.getDate() - 1);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(now);
      endDate.setHours(0, 0, 0, 0);
      break;
    case "week": {
      startDate = new Date(now);
      const dayOfWeek = startDate.getDay();
      const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      startDate.setDate(startDate.getDate() - daysToMonday);
      startDate.setHours(0, 0, 0, 0);
      break;
    }
    case "2weeks": {
      startDate = new Date(now);
      const dayOfWeek2w = startDate.getDay();
      const daysToMonday2w = dayOfWeek2w === 0 ? 6 : dayOfWeek2w - 1;
      startDate.setDate(startDate.getDate() - daysToMonday2w - 7);
      startDate.setHours(0, 0, 0, 0);
      break;
    }
    case "month":
      startDate = new Date(now);
      startDate.setMonth(startDate.getMonth() - 1);
      startDate.setDate(1);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(now);
      endDate.setDate(1);
      endDate.setHours(0, 0, 0, 0);
      break;
    default:
      return {};
  }

  return {
    start_date: startDate.toISOString(),
    end_date: endDate.toISOString(),
  };
}

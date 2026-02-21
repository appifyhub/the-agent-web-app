import { request } from "@/services/networking";

export interface Product {
  id: string;
  credits: number;
  name: string;
  url: string;
}

export interface ProductsResponse {
  products: Product[];
}

export async function fetchProducts({
  apiBaseUrl,
  user_id,
  rawToken,
}: {
  apiBaseUrl: string;
  user_id: string;
  rawToken: string;
}): Promise<ProductsResponse> {
  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${rawToken}`,
  };
  const response = await request(
    `${apiBaseUrl}/settings/user/${user_id}/products`,
    {
      method: "GET",
      headers: headers,
    },
  );
  if (!response.ok) {
    throw new Error(
      `Network error!\n\tStatus: ${response.status}\n\tError: ${response.statusText}`,
    );
  }
  return response.json();
}

export interface PurchaseRecord {
  id: string;
  user_id: string | null;
  seller_id: string;
  sale_id: string;
  sale_timestamp: string;
  price: number;
  product_id: string;
  product_name: string;
  product_permalink: string;
  short_product_id: string;
  license_key: string | null;
  quantity: number;
  gumroad_fee: number;
  affiliate_credit_amount_cents: number;
  discover_fee_charge: boolean;
  url_params: Record<string, unknown> | null;
  custom_fields: Record<string, unknown> | null;
  test: boolean;
  is_preorder_authorization: boolean;
  refunded: boolean;
}

export interface ProductAggregateStats {
  record_count: number;
  total_cost_cents: number;
  total_net_cost_cents: number;
}

export interface ProductInfo {
  id: string;
  name: string;
}

export interface PurchaseAggregates {
  total_purchase_count: number;
  total_cost_cents: number;
  total_net_cost_cents: number;
  by_product: Record<string, ProductAggregateStats>;
  all_products_used: ProductInfo[];
}

export interface PurchaseRecordsParams {
  apiBaseUrl: string;
  resource_id: string;
  rawToken: string;
  skip?: number;
  limit?: number;
  start_date?: string;
  end_date?: string;
  product_id?: string;
}

export interface PurchaseStatsParams {
  apiBaseUrl: string;
  resource_id: string;
  rawToken: string;
  start_date?: string;
  end_date?: string;
  product_id?: string;
}

export interface BindLicenseKeyParams {
  apiBaseUrl: string;
  resource_id: string;
  rawToken: string;
  license_key: string;
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

export async function fetchPurchaseRecords({
  apiBaseUrl,
  resource_id,
  rawToken,
  skip,
  limit,
  start_date,
  end_date,
  product_id,
}: PurchaseRecordsParams): Promise<PurchaseRecord[]> {
  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${rawToken}`,
  };
  const queryParams = buildQueryString({
    skip,
    limit,
    start_date,
    end_date,
    product_id,
  });
  const response = await request(
    `${apiBaseUrl}/user/${resource_id}/purchases${queryParams}`,
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
    throw new Error(`Failed to fetch purchase records. ${reason}`);
  }
  return response.json();
}

export async function fetchPurchaseStats({
  apiBaseUrl,
  resource_id,
  rawToken,
  start_date,
  end_date,
  product_id,
}: PurchaseStatsParams): Promise<PurchaseAggregates> {
  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${rawToken}`,
  };
  const queryParams = buildQueryString({
    start_date,
    end_date,
    product_id,
  });
  const response = await request(
    `${apiBaseUrl}/user/${resource_id}/purchases/stats${queryParams}`,
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
    throw new Error(`Failed to fetch purchase stats. ${reason}`);
  }
  return response.json();
}

export async function bindLicenseKey({
  apiBaseUrl,
  resource_id,
  rawToken,
  license_key,
}: BindLicenseKeyParams): Promise<PurchaseRecord> {
  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${rawToken}`,
  };
  const response = await request(
    `${apiBaseUrl}/user/${resource_id}/purchases`,
    {
      method: "POST",
      headers: headers,
      body: JSON.stringify({ license_key }),
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
    throw new Error(`Failed to bind license key. ${reason}`);
  }
  return response.json();
}

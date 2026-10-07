import { API_BASE_URL } from "../constants/app";
import type {
  FillRestockPayload,
  OverviewResponse,
  RestockHistoryItem,
  RestockListResponse,
} from "../types";

async function getJson<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: { Accept: "application/json" },
  });

  if (!response.ok) {
    throw new Error(`Request ${path} failed: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export async function fetchOverview(): Promise<OverviewResponse> {
  return getJson<OverviewResponse>("/overview");
}

export async function fetchRestockList(): Promise<RestockListResponse> {
  return getJson<RestockListResponse>("/restock-list");
}

export async function fetchRestockHistory(
  storeId: number,
  skuId: number,
): Promise<RestockHistoryItem[]> {
  const params = new URLSearchParams({
    storeId: String(storeId),
    skuId: String(skuId),
  });
  return getJson<RestockHistoryItem[]>(`/restock-records?${params.toString()}`);
}

export async function submitRestock(
  payload: FillRestockPayload,
): Promise<RestockListResponse> {
  const response = await fetch(`${API_BASE_URL}/restock-records`, {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    let message = `补货回填失败：${response.status}`;
    try {
      const body = (await response.json()) as { message?: string | string[] };
      if (body.message) {
        message = Array.isArray(body.message) ? body.message.join("；") : body.message;
      }
    } catch {
      // 忽略非 JSON 错误体
    }
    throw new Error(message);
  }

  return response.json() as Promise<RestockListResponse>;
}

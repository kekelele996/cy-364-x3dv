import { API_BASE_URL } from "../constants/app";
import type { CreateRestockPayload, OverviewResponse, RestockListResponse } from "../types";

export async function fetchOverview(): Promise<OverviewResponse> {
  const response = await fetch(`${API_BASE_URL}/overview`, {
    headers: { Accept: "application/json" },
  });

  if (!response.ok) {
    throw new Error(`Overview request failed: ${response.status}`);
  }

  return response.json() as Promise<OverviewResponse>;
}

export async function fetchRestocks(): Promise<RestockListResponse> {
  const response = await fetch(`${API_BASE_URL}/restocks`, {
    headers: { Accept: "application/json" },
  });

  if (!response.ok) {
    throw new Error(`Restock list request failed: ${response.status}`);
  }

  return response.json() as Promise<RestockListResponse>;
}

export async function createRestock(payload: CreateRestockPayload): Promise<RestockListResponse> {
  const response = await fetch(`${API_BASE_URL}/restocks`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Restock create failed: ${response.status}`);
  }

  return response.json() as Promise<RestockListResponse>;
}

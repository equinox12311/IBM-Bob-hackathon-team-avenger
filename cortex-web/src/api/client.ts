// Thin fetch wrapper for cortex-api. All non-health endpoints are
// authenticated via a bearer token stored in localStorage by useAuth().

import type { CreateEntryRequest, Entry } from "./types";

const BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080";

function authHeaders(token: string): HeadersInit {
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
}

async function handle<T>(res: Response): Promise<T> {
  if (!res.ok) {
    throw new Error(`${res.status} ${res.statusText}: ${await res.text()}`);
  }
  return res.json() as Promise<T>;
}

export async function listTimeline(
  token: string,
  limit = 20,
): Promise<{ entries: Entry[] }> {
  const res = await fetch(`${BASE}/api/v1/entries?limit=${limit}`, {
    headers: authHeaders(token),
  });
  return handle(res);
}

export async function searchEntries(
  token: string,
  query: string,
  k = 5,
): Promise<{ entries: Entry[] }> {
  const res = await fetch(
    `${BASE}/api/v1/search?q=${encodeURIComponent(query)}&k=${k}`,
    { headers: authHeaders(token) },
  );
  return handle(res);
}

export async function createEntry(
  token: string,
  body: CreateEntryRequest,
): Promise<{ id: number; created_at: number }> {
  const res = await fetch(`${BASE}/api/v1/entries`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(body),
  });
  return handle(res);
}

export async function sendFeedback(
  token: string,
  id: number,
  signal: "boost" | "flag",
): Promise<{ id: number; score: number }> {
  const res = await fetch(`${BASE}/api/v1/entries/${id}/feedback`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify({ signal }),
  });
  return handle(res);
}

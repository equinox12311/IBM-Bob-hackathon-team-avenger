// Thin fetch wrapper for cortex-api.
// Security: Input validation, HTTPS enforcement, error sanitization, CSRF (OWASP Phase 1, 2 & 3)

import type {
  Automation,
  CreateEntryRequest,
  DailyReport,
  Entry,
  EntryKind,
  GitHubActivity,
  IdentityGraph,
  SessionAnalytics,
  TodaySummary,
  UserProfile,
  WellnessStatus,
} from "./types";

import { validateSearchQuery, sanitizeErrorMessage } from "@/lib/validation";
import { addCsrfHeader } from "@/lib/csrf";

function baseURL(): string {
  const stored = localStorage.getItem("cortex.api_base_url");
  const env = import.meta.env.VITE_API_BASE_URL;
  const url = stored || env || "http://localhost:8080";
  
  // Enforce HTTPS in production (OWASP Phase 2)
  if (import.meta.env.PROD && !url.startsWith("https://")) {
    console.error("Production requires HTTPS API URL");
    throw new Error("Insecure API URL in production mode");
  }
  
  return url;
}

function authHeaders(token: string, includeCSRF = false): HeadersInit {
  const headers: HeadersInit = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
  
  // Add CSRF token for state-changing requests (OWASP Phase 3)
  if (includeCSRF) {
    return addCsrfHeader(headers);
  }
  
  return headers;
}

async function handle<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.text();
    
    // Sanitize error messages in production (OWASP Phase 2)
    const errorMessage = import.meta.env.PROD
      ? sanitizeErrorMessage(res.status, body)
      : `${res.status} ${res.statusText}: ${body}`;
    
    throw new Error(errorMessage);
  }
  return res.json() as Promise<T>;
}

// ---------- core entries ----------

export async function listTimeline(
  token: string,
  opts: { limit?: number; kind?: EntryKind } = {},
): Promise<{ entries: Entry[] }> {
  const p = new URLSearchParams();
  p.set("limit", String(opts.limit ?? 20));
  if (opts.kind) p.set("kind", opts.kind);
  const res = await fetch(`${baseURL()}/api/v1/entries?${p}`, {
    headers: authHeaders(token),
  });
  return handle(res);
}

export async function searchEntries(
  token: string,
  query: string,
  k = 5,
): Promise<{ entries: Entry[] }> {
  // Validate query before sending to API (OWASP Phase 1)
  const validQuery = validateSearchQuery(query);
  
  const res = await fetch(
    `${baseURL()}/api/v1/search?q=${encodeURIComponent(validQuery)}&k=${k}`,
    { headers: authHeaders(token) },
  );
  return handle(res);
}

export async function createEntry(
  token: string,
  body: CreateEntryRequest,
): Promise<{ id: number; created_at: number }> {
  const res = await fetch(`${baseURL()}/api/v1/entries`, {
    method: "POST",
    headers: authHeaders(token, true), // CSRF protection
    body: JSON.stringify(body),
  });
  return handle(res);
}

export async function getEntry(token: string, id: number): Promise<Entry> {
  const res = await fetch(`${baseURL()}/api/v1/entries/${id}`, {
    headers: authHeaders(token),
  });
  return handle(res);
}

export async function linkCode(
  token: string,
  id: number,
  body: { repo: string; file: string; line_start: number; line_end: number },
): Promise<{ id: number }> {
  const res = await fetch(`${baseURL()}/api/v1/entries/${id}/link`, {
    method: "PATCH",
    headers: authHeaders(token, true), // CSRF protection
    body: JSON.stringify(body),
  });
  return handle(res);
}

export async function sendFeedback(
  token: string,
  id: number,
  signal: "boost" | "flag",
): Promise<{ id: number; score: number }> {
  const res = await fetch(`${baseURL()}/api/v1/entries/${id}/feedback`, {
    method: "POST",
    headers: authHeaders(token, true), // CSRF protection
    body: JSON.stringify({ signal }),
  });
  return handle(res);
}

export async function checkHealth(): Promise<{ status: string; version?: string }> {
  const res = await fetch(`${baseURL()}/health`);
  return handle(res);
}

// ---------- v0.2 feature endpoints ----------

export async function getToday(token: string): Promise<TodaySummary> {
  const res = await fetch(`${baseURL()}/api/v1/today`, {
    headers: authHeaders(token),
  });
  return handle(res);
}

export async function getDailyReport(token: string, days = 1): Promise<DailyReport> {
  const res = await fetch(`${baseURL()}/api/v1/reports/daily?days=${days}`, {
    headers: authHeaders(token),
  });
  return handle(res);
}

export async function getSessionAnalytics(
  token: string,
  window = 90,
): Promise<SessionAnalytics> {
  const res = await fetch(
    `${baseURL()}/api/v1/analytics/session?window=${window}`,
    { headers: authHeaders(token) },
  );
  return handle(res);
}

export async function getIdentityGraph(token: string, topN = 12): Promise<IdentityGraph> {
  const res = await fetch(`${baseURL()}/api/v1/identity/graph?top_n=${topN}`, {
    headers: authHeaders(token),
  });
  return handle(res);
}

export async function getGitHubActivity(
  token: string,
  user = "demo",
  days = 30,
): Promise<GitHubActivity> {
  const res = await fetch(
    `${baseURL()}/api/v1/github/activity?user=${encodeURIComponent(user)}&days=${days}`,
    { headers: authHeaders(token) },
  );
  return handle(res);
}

export async function getWellness(token: string, interval = 90): Promise<WellnessStatus> {
  const res = await fetch(`${baseURL()}/api/v1/wellness/status?interval=${interval}`, {
    headers: authHeaders(token),
  });
  return handle(res);
}

export async function logWellnessBreak(token: string): Promise<WellnessStatus> {
  const res = await fetch(`${baseURL()}/api/v1/wellness/break`, {
    method: "POST",
    headers: authHeaders(token),
  });
  return handle(res);
}

export async function getProfile(token: string): Promise<UserProfile> {
  const res = await fetch(`${baseURL()}/api/v1/profile`, {
    headers: authHeaders(token),
  });
  return handle(res);
}

export async function updateProfile(
  token: string,
  update: Partial<UserProfile>,
): Promise<UserProfile> {
  const res = await fetch(`${baseURL()}/api/v1/profile`, {
    method: "PATCH",
    headers: authHeaders(token),
    body: JSON.stringify(update),
  });
  return handle(res);
}

export async function listAutomations(
  token: string,
): Promise<{ automations: Automation[] }> {
  const res = await fetch(`${baseURL()}/api/v1/automations`, {
    headers: authHeaders(token),
  });
  return handle(res);
}

export async function createAutomation(
  token: string,
  body: { name: string; trigger_kind: string; action: string },
): Promise<{ id: number }> {
  const res = await fetch(`${baseURL()}/api/v1/automations`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(body),
  });
  return handle(res);
}

export async function toggleAutomation(
  token: string,
  id: number,
  enabled: boolean,
): Promise<{ enabled: boolean }> {
  const res = await fetch(
    `${baseURL()}/api/v1/automations/${id}?enabled=${enabled}`,
    { method: "PATCH", headers: authHeaders(token) },
  );
  return handle(res);
}

export async function deleteAutomation(token: string, id: number): Promise<void> {
  await fetch(`${baseURL()}/api/v1/automations/${id}`, {
    method: "DELETE",
    headers: authHeaders(token),
  });
}

// ---------- LLM ----------

export interface ChatResponse {
  answer: string;
  citations: { id: number; text: string; score: number }[];
  model: string;
}

export async function llmInfo(
  token: string,
): Promise<{ provider: string; available: boolean }> {
  const res = await fetch(`${baseURL()}/api/v1/llm/info`, {
    headers: authHeaders(token),
  });
  return handle(res);
}

export async function chatLLM(
  token: string,
  query: string,
  k = 5,
): Promise<ChatResponse> {
  const res = await fetch(`${baseURL()}/api/v1/chat`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify({ query, k }),
  });
  return handle(res);
}

// ---------- New Features API ----------

export async function getProductivityMetrics(
  token: string,
  days = 7,
): Promise<any> {
  const res = await fetch(`${baseURL()}/api/v1/metrics/productivity?days=${days}`, {
    headers: authHeaders(token),
  });
  return handle(res);
}

export async function getBobSessions(
  token: string,
  limit = 50,
): Promise<any> {
  const res = await fetch(`${baseURL()}/api/v1/bob/sessions?limit=${limit}`, {
    headers: authHeaders(token),
  });
  return handle(res);
}

export async function getBobImpact(token: string): Promise<any> {
  const res = await fetch(`${baseURL()}/api/v1/bob/impact`, {
    headers: authHeaders(token),
  });
  return handle(res);
}

export async function getWorkflowTemplates(token: string): Promise<any> {
  const res = await fetch(`${baseURL()}/api/v1/workflows/templates`, {
    headers: authHeaders(token),
  });
  return handle(res);
}

export async function executeWorkflow(
  token: string,
  templateId: string,
  taskDescription: string,
): Promise<any> {
  const res = await fetch(
    `${baseURL()}/api/v1/workflows/execute?template_id=${encodeURIComponent(templateId)}&task_description=${encodeURIComponent(taskDescription)}`,
    {
      method: "POST",
      headers: authHeaders(token, true),
    },
  );
  return handle(res);
}

export async function getMCPExamples(token: string): Promise<any> {
  const res = await fetch(`${baseURL()}/api/v1/mcp/examples`, {
    headers: authHeaders(token),
  });
  return handle(res);
}

export async function generateMCPServer(
  token: string,
  spec: any,
): Promise<any> {
  const res = await fetch(`${baseURL()}/api/v1/mcp/generate`, {
    method: "POST",
    headers: authHeaders(token, true),
    body: JSON.stringify(spec),
  });
  return handle(res);
}

export async function analyzeLegacyRepo(
  token: string,
  repoUrl: string,
): Promise<any> {
  const res = await fetch(
    `${baseURL()}/api/v1/legacy/analyze?repo_url=${encodeURIComponent(repoUrl)}`,
    {
      method: "POST",
      headers: authHeaders(token, true),
    },
  );
  return handle(res);
}

export async function analyzeModernization(
  token: string,
  repoPath: string,
  modernizationType: string,
): Promise<any> {
  const res = await fetch(
    `${baseURL()}/api/v1/modernization/analyze?repo_path=${encodeURIComponent(repoPath)}&modernization_type=${modernizationType}`,
    {
      method: "POST",
      headers: authHeaders(token, true),
    },
  );
  return handle(res);
}

export async function generateSummary(
  token: string,
  entryId: number,
): Promise<{ summary: string }> {
  const res = await fetch(`${baseURL()}/api/v1/generate/summary/${entryId}`, {
    method: "POST",
    headers: authHeaders(token),
  });
  return handle(res);
}

export async function generateReportNarrative(
  token: string,
  days = 1,
): Promise<{ narrative: string; total_entries: number; model: string }> {
  const res = await fetch(`${baseURL()}/api/v1/generate/report?days=${days}`, {
    headers: authHeaders(token),
  });
  return handle(res);
}

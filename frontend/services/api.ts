import type { Announcement, AnnouncementStatus, Category, Summary } from "@/lib/types";
import { supabase } from "@/lib/supabase";
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "/api";

export class ApiError extends Error {
  constructor(message: string, public readonly status: number) {
    super(message);
    this.name = "ApiError";
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const session = supabase ? (await supabase.auth.getSession()).data.session : null;
  const headers = new Headers(options.headers);
  if (!(options.body instanceof FormData) && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  if (session?.access_token) headers.set("Authorization", `Bearer ${session.access_token}`);
  const response = await fetch(`${API_URL}${path}`, { ...options, credentials: "include", headers });
  if (!response.ok) { const data = await response.json().catch(() => null); throw new ApiError(data?.detail || "Não foi possível concluir esta ação.", response.status); }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}
export const api = {
  listPublic: (params: { search?: string; category?: Category | ""; neighborhood?: string } = {}) => request<Announcement[]>(`/announcements?${new URLSearchParams(Object.entries(params).filter(([, value]) => value) as [string, string][]).toString()}`),
  getPublic: (id: string) => request<Announcement>(`/announcements/${id}`),
  create: (data: FormData) => request<Announcement>("/announcements", { method: "POST", body: data }),
  login: (password: string) => request<void>("/admin/login", { method: "POST", body: JSON.stringify({ password }) }),
  logout: async () => { await request<void>("/admin/logout", { method: "POST" }); await supabase?.auth.signOut(); },
  session: () => request<{ authenticated: boolean }>("/admin/session"),
  summary: () => request<Summary>("/admin/summary"),
  listAdmin: (params: { status?: AnnouncementStatus | ""; neighborhood?: string } = {}) => request<Announcement[]>(`/admin/announcements?${new URLSearchParams(Object.entries(params).filter(([, value]) => value) as [string, string][]).toString()}`),
  getAdmin: (id: string) => request<Announcement>(`/admin/announcements/${id}`),
  update: (id: string, data: FormData) => request<Announcement>(`/admin/announcements/${id}`, { method: "PUT", body: data }),
  action: (id: string, action: "approve" | "reject" | "close") => request<Announcement>(`/admin/announcements/${id}/${action}`, { method: "PATCH" }),
  remove: (id: string) => request<void>(`/admin/announcements/${id}`, { method: "DELETE" })
};

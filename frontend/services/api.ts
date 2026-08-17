import type { AccountInfo, Announcement, AnnouncementStatus, Category, ProfileCompletionPayload, RegistrationPayload, RegistrationResult, Summary } from "@/lib/types";
import { supabase } from "@/lib/supabase";
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "/api";

export class ApiError extends Error {
  constructor(message: string, public readonly status: number) {
    super(message);
    this.name = "ApiError";
  }
}

const validationFieldLabels: Record<string, string> = {
  title: "O título",
  description: "A descrição",
  category: "A categoria",
  neighborhood: "O bairro",
  publication_consent: "A autorização de publicação",
  contact_name: "O nome para contato",
  contact_phone: "O WhatsApp",
  image: "A imagem",
  password: "A senha",
  full_name: "O nome",
  email: "O e-mail",
  cpf: "O CPF",
  phone: "O telefone",
  privacy_acknowledged: "A confirmação do aviso de privacidade",
};

function translatedText(message: string): string {
  const minimum = message.match(/string should have at least (\d+) characters/i);
  if (minimum) return `O campo deve ter pelo menos ${minimum[1]} caracteres.`;
  const maximum = message.match(/string should have at most (\d+) characters/i);
  if (maximum) return `O campo deve ter no máximo ${maximum[1]} caracteres.`;
  if (/^field required$/i.test(message)) return "Preencha o campo obrigatório.";
  return message;
}

function validationMessage(error: Record<string, unknown>): string | undefined {
  const errorType = typeof error.type === "string" ? error.type : "";
  if (!errorType) return undefined;
  const location = Array.isArray(error.loc) ? error.loc : [];
  const field = [...location].reverse().find((part): part is string => typeof part === "string" && !["body", "path", "query"].includes(part));
  const label = validationFieldLabels[field || ""] || "O campo informado";
  const context = error.ctx && typeof error.ctx === "object" ? error.ctx as Record<string, unknown> : {};

  if (errorType === "missing") return `${label} é um campo obrigatório.`;
  if (errorType === "string_too_short") {
    const minimum = typeof context.min_length === "number" ? context.min_length : null;
    return minimum ? `${label} deve ter pelo menos ${minimum} caracteres.` : `${label} está muito curto.`;
  }
  if (errorType === "string_too_long") {
    const maximum = typeof context.max_length === "number" ? context.max_length : null;
    return maximum ? `${label} deve ter no máximo ${maximum} caracteres.` : `${label} está muito longo.`;
  }
  if (["enum", "literal_error"].includes(errorType)) return field === "category" ? "Selecione uma categoria válida." : `${label} não é válido.`;
  if (["bool_parsing", "bool_type"].includes(errorType) && field === "publication_consent") return "Confirme a autorização para publicar os dados informados.";
  return field ? `Revise ${label.toLowerCase()}.` : "Revise os dados informados e tente novamente.";
}

function detailMessage(detail: unknown, depth = 0): string | undefined {
  if (depth > 3) return undefined;
  if (typeof detail === "string" && detail.trim() && detail !== "[object Object]") return translatedText(detail.trim());
  if (Array.isArray(detail)) {
    const messages = detail.map((item) => detailMessage(item, depth + 1)).filter((item): item is string => Boolean(item));
    return messages.length ? [...new Set(messages)].join(" ") : undefined;
  }
  if (detail && typeof detail === "object") {
    const validation = validationMessage(detail as Record<string, unknown>);
    if (validation) return validation;
    for (const key of ["detail", "message", "msg"] as const) {
      if (key in detail) {
        const message = detailMessage((detail as Record<string, unknown>)[key], depth + 1);
        if (message) return message;
      }
    }
  }
  return undefined;
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const session = supabase ? (await supabase.auth.getSession()).data.session : null;
  const headers = new Headers(options.headers);
  if (!(options.body instanceof FormData) && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  if (session?.access_token) headers.set("Authorization", `Bearer ${session.access_token}`);
  const response = await fetch(`${API_URL}${path}`, { ...options, credentials: "include", headers });
  if (!response.ok) { const data = await response.json().catch(() => null); throw new ApiError(detailMessage(data?.detail) || detailMessage(data) || "Não foi possível concluir esta ação.", response.status); }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}
export const api = {
  registerAccount: (data: RegistrationPayload) => request<RegistrationResult>("/auth/register", { method: "POST", body: JSON.stringify(data) }),
  account: () => request<AccountInfo>("/account/me"),
  completeAccount: (data: ProfileCompletionPayload) => request<AccountInfo>("/account/complete", { method: "POST", body: JSON.stringify(data) }),
  listPublic: (params: { search?: string; category?: Category | ""; neighborhood?: string } = {}) => request<Announcement[]>(`/announcements?${new URLSearchParams(Object.entries(params).filter(([, value]) => value) as [string, string][]).toString()}`),
  listMine: () => request<Announcement[]>("/announcements/mine"),
  getMine: (id: string) => request<Announcement>(`/announcements/mine/${id}`),
  getPublic: (id: string) => request<Announcement>(`/announcements/${id}`),
  create: (data: FormData) => request<Announcement>("/announcements", { method: "POST", body: data }),
  updateMine: (id: string, data: FormData) => request<Announcement>(`/announcements/${id}`, { method: "PUT", body: data }),
  removeMine: (id: string) => request<void>(`/announcements/${id}`, { method: "DELETE" }),
  login: (password: string) => request<void>("/admin/login", { method: "POST", body: JSON.stringify({ password }) }),
  logout: () => request<void>("/admin/logout", { method: "POST" }),
  session: () => request<{ authenticated: boolean }>("/admin/session"),
  summary: () => request<Summary>("/admin/summary"),
  listAdmin: (params: { status?: AnnouncementStatus | ""; neighborhood?: string } = {}) => request<Announcement[]>(`/admin/announcements?${new URLSearchParams(Object.entries(params).filter(([, value]) => value) as [string, string][]).toString()}`),
  getAdmin: (id: string) => request<Announcement>(`/admin/announcements/${id}`),
  closeAdmin: (id: string) => request<Announcement>(`/admin/announcements/${id}/close`, { method: "PATCH" }),
  remove: (id: string) => request<void>(`/admin/announcements/${id}`, { method: "DELETE" })
};

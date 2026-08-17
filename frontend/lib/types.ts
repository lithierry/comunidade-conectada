export type Category = "donation" | "event" | "opportunity" | "service";
export type AnnouncementStatus = "pending" | "published" | "closed" | "rejected";
export interface Announcement {
  id: number | string; title: string; description: string; category: Category; neighborhood: string;
  contact_name?: string | null; contact_phone?: string | null; image_url?: string | null;
  status: AnnouncementStatus; created_at: string; updated_at?: string;
}
export interface Summary { pending: number; published: number; closed: number; rejected?: number; }
export interface AccountInfo {
  registration_complete: boolean;
  full_name?: string | null;
  email?: string | null;
  cpf_last4?: string | null;
  phone_last4?: string | null;
  privacy_acknowledged_at?: string | null;
}
export interface RegistrationPayload { full_name: string; email: string; password: string; cpf: string; phone: string; privacy_acknowledged: boolean; }
export interface ProfileCompletionPayload { full_name: string; cpf: string; phone: string; privacy_acknowledged: boolean; }
export interface RegistrationResult { message: string; }
export const categories: { value: Category; label: string; symbol: string }[] = [
  { value: "donation", label: "Doações", symbol: "♧" }, { value: "event", label: "Eventos", symbol: "◌" },
  { value: "opportunity", label: "Oportunidades", symbol: "↗" }, { value: "service", label: "Serviços", symbol: "⌁" }
];
export const categoryLabel = (category: Category) => categories.find((item) => item.value === category)?.label ?? category;
export const statusLabel = (status: AnnouncementStatus) => ({ pending: "Pendente", published: "Publicado", closed: "Encerrado", rejected: "Rejeitado" })[status];

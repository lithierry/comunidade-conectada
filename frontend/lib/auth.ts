import type { User } from "@supabase/supabase-js";

export function userDisplayName(user: User | null): string {
  const metadata = user?.user_metadata ?? {};
  const configuredName = metadata.name ?? metadata.full_name;
  if (typeof configuredName === "string" && configuredName.trim()) {
    return configuredName.trim().split(/\s+/)[0];
  }
  return user?.email?.split("@")[0] || "Minha conta";
}

export function safeNextPath(value: string | null, fallback = "/minhas"): string {
  return value?.startsWith("/") && !value.startsWith("//") ? value : fallback;
}

export function authErrorMessage(error: unknown, fallback: string): string {
  const raw = error instanceof Error
    ? error.message
    : error && typeof error === "object" && "message" in error && typeof error.message === "string"
      ? error.message
      : "";

  if (!raw || raw === "[object Object]") return fallback;
  if (/invalid login credentials/i.test(raw)) return "E-mail ou senha incorretos.";
  if (/email not confirmed/i.test(raw)) return "Confirme seu e-mail antes de entrar.";
  if (/already registered|already been registered|user already exists/i.test(raw)) return "Este e-mail já está cadastrado.";
  if (/password should be at least|weak password/i.test(raw)) return "A senha deve ter pelo menos 6 caracteres.";
  if (/invalid email|unable to validate email/i.test(raw)) return "Informe um e-mail válido.";
  if (/rate limit|too many requests/i.test(raw)) return "Muitas tentativas. Aguarde alguns minutos e tente novamente.";
  if (/new password should be different/i.test(raw)) return "Escolha uma senha diferente da atual.";
  if (/session.*missing|auth session missing/i.test(raw)) return "Este link expirou. Solicite uma nova recuperação de senha.";
  return fallback;
}

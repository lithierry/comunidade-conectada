"use client";

import { useRouter } from "next/navigation";
import { AdminLogin, SupabaseLogin } from "@/components/AdminLogin";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const router = useRouter();
  const Login = supabase ? SupabaseLogin : AdminLogin;
  return <div className="page container"><Login eyebrow="Acesso da equipe" title="Entrar na comunidade" description="Entre para cuidar das publicações e manter o mural útil para todos." onSuccess={() => router.push("/admin")} /></div>;
}

"use client";

import { useRouter } from "next/navigation";
import { SupabaseLogin } from "@/components/AdminLogin";
import { Notice } from "@/components/States";
import { safeNextPath } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { api } from "@/services/api";
import { useCallback, useEffect, useState } from "react";

export default function LoginPage() {
  const router = useRouter();
  const [nextPath, setNextPath] = useState("/minhas");
  const [checking, setChecking] = useState(Boolean(supabase));
  const [error, setError] = useState("");

  const continueTo = useCallback(async (target: string) => {
    setError("");
    try {
      const account = await api.account();
      router.replace(account.registration_complete ? target : `/completar-cadastro?next=${encodeURIComponent(target)}`);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Não foi possível consultar seu cadastro.");
      setChecking(false);
    }
  }, [router]);

  useEffect(() => {
    const target = safeNextPath(new URLSearchParams(window.location.search).get("next"));
    setNextPath(target);
    if (!supabase) { setChecking(false); return; }
    supabase.auth.getSession().then(async ({ data }) => {
      if (data.session) await continueTo(target);
      else setChecking(false);
    });
  }, [continueTo]);

  if (!supabase) return <div className="page container"><Notice kind="error" title="Acesso indisponível">A autenticação da comunidade ainda não foi configurada.</Notice></div>;
  if (checking) return <div className="page container"><Notice title="Verificando sua sessão">Aguarde um instante.</Notice></div>;
  if (error) return <div className="page container"><Notice kind="error" title="Não foi possível verificar o cadastro">{error}</Notice><button className="button primary" onClick={() => window.location.reload()}>Tentar novamente</button></div>;

  return <div className="page container"><SupabaseLogin eyebrow="Acesso da comunidade" title="Entrar na comunidade" description="Entre para publicar e cuidar dos seus anúncios." onSuccess={() => continueTo(nextPath)} /></div>;
}

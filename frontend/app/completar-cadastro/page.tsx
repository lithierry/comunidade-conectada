"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ProfileCompletionForm } from "@/components/ProfileCompletionForm";
import { LoadingGrid, Notice } from "@/components/States";
import { safeNextPath } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { api } from "@/services/api";

export default function CompleteProfilePage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [initialName, setInitialName] = useState("");
  const [nextPath, setNextPath] = useState("/minhas");
  const [error, setError] = useState("");

  useEffect(() => {
    const target = safeNextPath(new URLSearchParams(window.location.search).get("next"));
    setNextPath(target);
    if (!supabase) { setReady(true); return; }
    supabase.auth.getSession().then(async ({ data }) => {
      const session = data.session;
      if (!session) { setReady(true); return; }
      setAuthenticated(true);
      const metadata = session.user.user_metadata ?? {};
      setInitialName(String(metadata.full_name || metadata.name || ""));
      try {
        const account = await api.account();
        if (account.registration_complete) { router.replace(target); return; }
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : "Não foi possível consultar sua conta.");
      }
      setReady(true);
    });
  }, [router]);

  if (!ready) return <div className="page container"><LoadingGrid /></div>;
  if (!authenticated) return <div className="page container"><Notice kind="error" title="Entre para concluir o cadastro">Acesse sua conta antes de vincular CPF e telefone.</Notice><Link className="button primary" href={`/login?next=${encodeURIComponent(`/completar-cadastro?next=${nextPath}`)}`}>Entrar</Link></div>;
  if (error) return <div className="page container"><Notice kind="error" title="Cadastro indisponível">{error}</Notice></div>;
  return <div className="page container"><ProfileCompletionForm initialName={initialName} onSuccess={async () => { await supabase?.auth.refreshSession(); router.replace(nextPath); router.refresh(); }} /></div>;
}

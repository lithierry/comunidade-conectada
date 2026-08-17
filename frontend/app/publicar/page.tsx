"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AnnouncementForm } from "@/components/AnnouncementForm";
import { LoadingGrid, Notice } from "@/components/States";
import { api } from "@/services/api";
import { supabase } from "@/lib/supabase";
import type { Announcement } from "@/lib/types";
import styles from "./publicar.module.css";

export default function PublishPage() {
  const [ready, setReady] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [profileComplete, setProfileComplete] = useState(false);
  const [created, setCreated] = useState<Announcement>();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!supabase) { setReady(true); return; }
    let active = true;
    async function check(sessionPresent: boolean) {
      if (!active) return;
      setAuthenticated(sessionPresent);
      setProfileComplete(false);
      if (sessionPresent) {
        try {
          const account = await api.account();
          if (active) setProfileComplete(account.registration_complete);
        } catch (caught) {
          if (active) setError(caught instanceof Error ? caught.message : "Não foi possível verificar seu cadastro.");
        }
      }
      if (active) setReady(true);
    }
    supabase.auth.getSession().then(({ data }) => check(Boolean(data.session)));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => { void check(Boolean(session)); });
    return () => { active = false; listener.subscription.unsubscribe(); };
  }, []);

  async function submit(form: FormData) {
    setSaving(true);
    try { setCreated(await api.create(form)); } finally { setSaving(false); }
  }

  if (!ready) return <div className="page container"><LoadingGrid /></div>;
  if (!authenticated) return <div className="page container"><Notice kind="error" title="Entre para publicar">Apenas pessoas autenticadas podem criar anúncios.</Notice><Link className="button primary" href="/login?next=/publicar">Entrar</Link></div>;
  if (error) return <div className="page container"><Notice kind="error" title="Não foi possível verificar o cadastro">{error}</Notice></div>;
  if (!profileComplete) return <div className="page container"><Notice title="Conclua seu cadastro">Vincule CPF e telefone à sua conta antes de publicar.</Notice><Link className="button primary" href="/completar-cadastro?next=/publicar">Concluir cadastro</Link></div>;

  return <div className="page container"><div className={styles.intro}><p className="eyebrow">Novo anúncio</p><h1>Compartilhe com a comunidade</h1><p>A publicação entra no mural assim que você salvar.</p></div>{created ? <div className={styles.success}><Notice kind="success" title="Publicação disponível">Seu anúncio já está visível no mural.</Notice><Link className="button primary" href={`/anuncio/${created.id}`}>Ver publicação</Link><Link className="button secondary" href="/minhas">Minhas publicações</Link></div> : <AnnouncementForm submitLabel="Publicar anúncio" onSubmit={submit} submitting={saving} />}</div>;
}

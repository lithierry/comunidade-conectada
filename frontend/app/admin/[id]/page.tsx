"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { CategoryArt } from "@/components/CategoryArt";
import { LoadingGrid, Notice } from "@/components/States";
import { StatusBadge } from "@/components/StatusBadge";
import { api, ApiError } from "@/services/api";
import { categoryLabel, type Announcement } from "@/lib/types";
import { formatDate } from "@/lib/format";
import styles from "./admin-detail.module.css";

export default function AdminDetail() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [item, setItem] = useState<Announcement>();
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    api.getAdmin(id).then(setItem).catch((caught) => {
      if (caught instanceof ApiError && caught.status === 401) {
        router.replace("/admin");
        return;
      }
      setError(caught instanceof Error ? caught.message : "Não foi possível carregar a publicação.");
    });
  }, [id, router]);

  async function close() {
    if (!confirm("Encerrar esta publicação? Ela deixará de aparecer no mural.")) return;
    setSaving(true);
    setError("");
    try {
      setItem(await api.closeAdmin(id));
      setNotice("Publicação encerrada com sucesso.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Não foi possível encerrar a publicação.");
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (!confirm("Excluir este anúncio permanentemente? Esta ação não pode ser desfeita.")) return;
    setSaving(true);
    setError("");
    try {
      await api.remove(id);
      router.push("/admin");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Não foi possível excluir.");
      setSaving(false);
    }
  }

  if (error && !item) return <div className="page container"><Notice kind="error" title="Não foi possível abrir a publicação">{error}</Notice></div>;
  if (!item) return <div className="page container"><LoadingGrid /></div>;

  return <div className="page container">
    <Link className={styles.back} href="/admin">← Voltar ao painel</Link>
    <div className={styles.heading}><div><p className="eyebrow">Gerenciar publicação</p><h1>{item.title}</h1></div><StatusBadge status={item.status} /></div>
    {error && <Notice kind="error" title="Não foi possível concluir a ação">{error}</Notice>}
    {notice && <Notice kind="success" title={notice} />}
    <div className={styles.actions}>
      {item.status === "published" && <button className="button secondary" disabled={saving} onClick={close}>Encerrar anúncio</button>}
      <button className="button danger" disabled={saving} onClick={remove}>Excluir</button>
    </div>
    <article className={styles.view}>
      <CategoryArt category={item.category} imageUrl={item.image_url} alt={item.title} />
      <div className={styles.content}>
        <span className={styles.category}>{categoryLabel(item.category)}</span>
        <p className={styles.meta}>{item.neighborhood} · Enviado em {formatDate(item.created_at)}</p>
        <div className={styles.description}>{item.description}</div>
        <dl><div><dt>Contato</dt><dd>{item.contact_name || "Não informado"}</dd></div><div><dt>WhatsApp</dt><dd>{item.contact_phone || "Não informado"}</dd></div></dl>
      </div>
    </article>
  </div>;
}

"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AnnouncementForm } from "@/components/AnnouncementForm";
import { LoadingGrid, Notice } from "@/components/States";
import { StatusBadge } from "@/components/StatusBadge";
import { api, ApiError } from "@/services/api";
import { type Announcement } from "@/lib/types";
import styles from "../minhas.module.css";

export default function MyAnnouncementDetail() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [item, setItem] = useState<Announcement>();
  const [editing, setEditing] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => { api.getMine(id).then(setItem).catch((e) => setError(e instanceof ApiError && e.status === 401 ? "auth" : e instanceof Error ? e.message : "Não foi possível abrir a publicação.")); }, [id]);
  async function remove() { if (!confirm("Excluir este anúncio permanentemente?")) return; setSaving(true); try { await api.removeMine(id); router.push("/minhas"); } catch (e) { setError(e instanceof Error ? e.message : "Não foi possível excluir."); } finally { setSaving(false); } }
  if (error === "auth") return <div className="page container"><Notice kind="error" title="Entre para continuar">Acesse sua conta para editar esta publicação.</Notice><Link className="button primary" href={`/login?next=/minhas/${id}`}>Entrar</Link></div>;
  if (error) return <div className="page container"><Notice kind="error" title="Publicação indisponível">{error}</Notice></div>;
  if (!item) return <div className="page container"><LoadingGrid /></div>;
  return <div className="page container"><Link href="/minhas" className="button secondary">← Minhas publicações</Link><div className={styles.item}><div><strong>{item.title}</strong><span><StatusBadge status={item.status} /></span></div><button className="button danger" disabled={saving} onClick={remove}>Excluir</button></div>{!editing && <Notice kind="success" title="Alterações publicadas">As informações atualizadas já estão visíveis no mural.</Notice>}{editing && <AnnouncementForm initial={item} submitLabel="Salvar alterações" submitting={saving} onSubmit={async (form) => { setSaving(true); try { setItem(await api.updateMine(id, form)); setEditing(false); } finally { setSaving(false); } }} />}</div>;
}

"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { LoadingGrid, Notice } from "@/components/States";
import { StatusBadge } from "@/components/StatusBadge";
import { api, ApiError } from "@/services/api";
import { categoryLabel, type Announcement } from "@/lib/types";
import { formatDate } from "@/lib/format";
import styles from "./minhas.module.css";

export default function MyAnnouncementsPage() {
  const [items, setItems] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => { api.listMine().then(setItems).catch((e) => setError(e instanceof ApiError && e.status === 401 ? "auth" : e instanceof Error ? e.message : "Não foi possível carregar suas publicações.")).finally(() => setLoading(false)); }, []);
  if (loading) return <div className="page container"><LoadingGrid /></div>;
  if (error === "auth") return <div className="page container"><Notice kind="error" title="Entre para continuar">Acesse sua conta para consultar suas publicações.</Notice><Link className="button primary" href="/login?next=/minhas">Entrar</Link></div>;
  if (error) return <div className="page container"><Notice kind="error" title="Não foi possível carregar">{error}</Notice></div>;
  return <div className="page container"><p className="eyebrow">Minha conta</p><h1>Minhas publicações</h1><p>Edite ou exclua seus anúncios a qualquer momento.</p>{items.length ? <div className={styles.list}>{items.map((item) => <Link className={styles.item} href={`/minhas/${item.id}`} key={item.id}><div><strong>{item.title}</strong><span>{categoryLabel(item.category)} · {item.neighborhood} · {formatDate(item.created_at)}</span></div><StatusBadge status={item.status} /></Link>)}</div> : <div className={styles.empty}><Notice title="Você ainda não publicou">Crie seu primeiro anúncio para aparecer aqui.</Notice><Link className="button primary" href="/publicar">Publicar anúncio</Link></div>}</div>;
}

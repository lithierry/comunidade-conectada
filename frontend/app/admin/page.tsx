"use client";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { AdminLogin } from "@/components/AdminLogin";
import { LoadingGrid, Notice } from "@/components/States";
import { StatusBadge } from "@/components/StatusBadge";
import { api } from "@/services/api";
import { formatDate } from "@/lib/format";
import { categoryLabel, type Announcement, type AnnouncementStatus, type Summary } from "@/lib/types";
import styles from "./admin.module.css";
const statuses: { value: AnnouncementStatus | ""; label: string }[] = [{ value: "", label: "Todos" }, { value: "pending", label: "Pendentes" }, { value: "published", label: "Publicados" }, { value: "closed", label: "Encerrados" }, { value: "rejected", label: "Rejeitados" }];

export default function AdminPage() {
  const [logged, setLogged] = useState(false); const [checking, setChecking] = useState(true); const [items, setItems] = useState<Announcement[]>([]); const [summary, setSummary] = useState<Summary>(); const [status, setStatus] = useState<AnnouncementStatus | "">(""); const [neighborhood, setNeighborhood] = useState(""); const [error, setError] = useState("");
  const load = useCallback(async () => { setError(""); try { const session = await api.session(); if (!session.authenticated) { setLogged(false); return; } const [nextItems, nextSummary] = await Promise.all([api.listAdmin({ status, neighborhood }), api.summary()]); setItems(nextItems); setSummary(nextSummary); setLogged(true); } catch (e) { setError(e instanceof Error ? e.message : "Não foi possível carregar o painel."); } finally { setChecking(false); } }, [status, neighborhood]);
  useEffect(() => { load(); }, [load]);
  if (checking) return <div className="page container"><LoadingGrid /></div>;
  if (!logged) return <div className="page container"><AdminLogin onSuccess={() => { setChecking(true); load(); }} /></div>;
  return <div className="page container"><div className={styles.head}><div><p className="eyebrow">Área administrativa</p><h1>Publicações</h1></div><button className="button secondary" onClick={async () => { await api.logout(); setLogged(false); }}>Sair</button></div>
    {summary && <section className={styles.metrics} aria-label="Resumo"><div><strong>{summary.pending}</strong><span>Pendentes</span></div><div><strong>{summary.published}</strong><span>Publicados</span></div><div><strong>{summary.closed}</strong><span>Encerrados</span></div></section>}
    <div className={styles.filterRow}><div className={styles.filters} role="group" aria-label="Filtrar por status">{statuses.map((item) => <button aria-pressed={status === item.value} className={status === item.value ? styles.active : ""} key={item.label} onClick={() => setStatus(item.value)}>{item.label}</button>)}</div><div className="form-field"><label htmlFor="admin-neighborhood">Filtrar por bairro</label><input id="admin-neighborhood" value={neighborhood} onChange={(event) => setNeighborhood(event.target.value)} placeholder="Ex.: Centro" /></div></div>
    {error ? <Notice kind="error" title="Não foi possível carregar a lista">{error}</Notice> : <><div className={styles.mobileList}>{items.map((item) => <Link key={item.id} href={`/admin/${item.id}`} className={styles.mobileItem}><div><strong>{item.title}</strong><span>{categoryLabel(item.category)} · {formatDate(item.created_at)}</span></div><StatusBadge status={item.status} /></Link>)}</div><div className={styles.tableWrap}><table><thead><tr><th>Título</th><th>Categoria</th><th>Data</th><th>Status</th><th><span className="sr-only">Ações</span></th></tr></thead><tbody>{items.map((item) => <tr key={item.id}><td>{item.title}</td><td>{categoryLabel(item.category)}</td><td>{formatDate(item.created_at)}</td><td><StatusBadge status={item.status} /></td><td><Link className="button secondary" href={`/admin/${item.id}`}>Gerenciar</Link></td></tr>)}</tbody></table></div>{!items.length && <Notice title="Nenhuma publicação neste filtro" />}</>}
  </div>;
}

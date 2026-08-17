"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/services/api";
import { categories, type Announcement, type Category } from "@/lib/types";
import { AnnouncementCard } from "@/components/AnnouncementCard";
import { LoadingGrid, Notice } from "@/components/States";
import styles from "./home.module.css";

export default function Home() {
  const [items, setItems] = useState<Announcement[]>([]);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<Category | "">("");
  const [neighborhood, setNeighborhood] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const timer = setTimeout(async () => {
      setLoading(true);
      setError("");
      try {
        setItems(await api.listPublic({ search: query, category, neighborhood }));
      } catch (e) {
        setError(e instanceof Error ? e.message : "Não foi possível carregar as publicações.");
      } finally {
        setLoading(false);
      }
    }, query || neighborhood ? 250 : 0);
    return () => clearTimeout(timer);
  }, [query, category, neighborhood]);

  return <div className="page">
    <section className={`${styles.hero} container`}>
      <p className="eyebrow">Mural da comunidade</p>
      <h1>Encontre o que está acontecendo perto de você.</h1>
      <p>Doações, eventos, oportunidades e serviços reunidos em um só lugar.</p>
      <Link className="button primary" href="/publicar">Publicar anúncio</Link>
    </section>
    <section className={`container ${styles.explore}`} aria-labelledby="recentes">
      <div className={styles.searchFields}>
        <div className={styles.searchWrap}>
          <label htmlFor="search">Buscar publicações</label>
          <input id="search" value={query} onChange={(e) => setQuery(e.target.value)} type="search" placeholder="Digite um termo" />
        </div>
        <div className={styles.searchWrap}>
          <label htmlFor="neighborhood">Filtrar por bairro</label>
          <input id="neighborhood" value={neighborhood} onChange={(e) => setNeighborhood(e.target.value)} type="search" placeholder="Digite o bairro" />
        </div>
      </div>
      <div className={styles.filters} role="group" aria-label="Filtrar por categoria">
        <button aria-pressed={!category} className={!category ? styles.active : ""} onClick={() => setCategory("")}>Todos</button>
        {categories.map((item) => <button aria-pressed={category === item.value} className={category === item.value ? styles.active : ""} onClick={() => setCategory(item.value)} key={item.value}>{item.label}</button>)}
      </div>
      <div className={styles.sectionHead}><div><p className="eyebrow">Explore</p><h2 id="recentes">Publicações recentes</h2></div><span>{!loading && `${items.length} encontradas`}</span></div>
      {loading ? <LoadingGrid /> : error ? <Notice kind="error" title="Não foi possível carregar as publicações">{error}</Notice> : items.length ? <div className={styles.grid}>{items.map((item) => <AnnouncementCard key={item.id} item={item} />)}</div> : <Notice title="Nenhuma publicação encontrada">Tente outro termo, bairro ou categoria.</Notice>}
    </section>
  </div>;
}

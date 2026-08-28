"use client";

import { useEffect, useRef, useState } from "react";
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
  const filtersRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

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

  useEffect(() => {
    const filters = filtersRef.current;

    if (!filters) return;

    function updateScrollIndicators() {
      const element = filtersRef.current;

      if (!element) return;

      const maxScrollLeft = element.scrollWidth - element.clientWidth;

      setCanScrollLeft(element.scrollLeft > 1);
      setCanScrollRight(element.scrollLeft < maxScrollLeft - 1);
    }

    updateScrollIndicators();

    filters.addEventListener("scroll", updateScrollIndicators, {
      passive: true,
    });

    const resizeObserver = new ResizeObserver(updateScrollIndicators);
    resizeObserver.observe(filters);

    return () => {
      filters.removeEventListener("scroll", updateScrollIndicators);
      resizeObserver.disconnect();
    }
  }, []);

  return (
    <div className="page">
      <section className={`${styles.hero} container`}>
        <div className={styles.heroContent}>
          <p className="eyebrow">Mural da comunidade</p>

          <h1>O que está acontencedo perto de você?</h1>

          <p className={styles.heroDescription}>
            Encontre doações, eventos, oportunidades e serviços da sua comunidade em um só lugar.
          </p>

          <div className={styles.heroActions}>
            <Link className="button primary" href="/publicar">
              Publicar anúncio
            </Link>

            <a className="button secondary" href="#publicacoes">
              Explorar publicações
            </a>
          </div>
        </div>
      </section>

      <section className={`container ${styles.explore}`} aria-labelledby="explore-title">
        <div className={styles.discovery}>
          <div className={styles.discoveryHeader}>
            <p className="eyebrow">Encontre na comunidade</p>

            <h2 id="explore-title">O que você está procurando?</h2>
          </div>

          <div className={styles.searchFields}>
            <div className={`${styles.searchWrap} ${styles.searchMain}`}>
              <label htmlFor="search">Buscar publicações</label>

              <div className={styles.searchInput}>
                <span aria-hidden="true">⌕</span>

                <input
                  id="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  type="search"
                  placeholder="Buscar na comunidade..."
                />
              </div>
            </div>

            <div className={styles.searchWrap}>
              <label htmlFor="neighborhood">Bairro</label>

              <input
                id="neighborhood"
                value={neighborhood}
                onChange={(e) => setNeighborhood(e.target.value)}
                type="search"
                placeholder="Digite o bairro"
              />
            </div>
          </div>

          <div 
            className={`${styles.filtersWrapper} ${
              canScrollLeft ? styles.canScrollLeft : ""
            } ${canScrollRight ? styles.canScrollRight : ""}`}
          >
            <div
              ref={filtersRef}
              className={styles.filters}
              role="group"
              aria-label="Filtrar por categoria"
            >
              <button
                type="button"
                aria-pressed={!category}
                className={!category ? styles.active : ""}
                onClick={() => setCategory("")}
              >
                Todos
              </button>

              {categories.map((item) => {
                const active = category === item.value;

                return (
                  <button
                    key={item.value}
                    type="button"
                    aria-pressed={active}
                    className={active ? styles.active : ""}
                    onClick={() => setCategory(item.value)}
                  >
                    <span aria-hidden="true">{item.symbol}</span>
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div
          className={styles.sectionHead}
          id="publicacoes"
        >
          <div>
            <p className="eyebrow">Explore</p>
            <h2>Publicações próximas</h2>
          </div>

          <span aria-live="polite">
            {!loading && `${items.length} encontradas`}
          </span>
        </div>

        {loading ? (
          <LoadingGrid />
        ) : error ? (
          <Notice
            kind="error"
            title="Não foi possível carregar as publicações"
          >
            {error}
          </Notice>
        ) : items.length ? (
          <div className={styles.grid}>
            {items.map((item) => (
              <AnnouncementCard key={item.id} item={item} />
            ))}
          </div>
        ) : (
          <Notice title="Nenhuma publicação encontrada">
            Tente outro termo, bairro ou categoria.
          </Notice>
        )}
      </section>
    </div>
  );
}

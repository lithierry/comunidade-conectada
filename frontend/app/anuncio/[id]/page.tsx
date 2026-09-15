"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

import { CategoryArt } from "@/components/CategoryArt";
import { LoadingGrid, Notice } from "@/components/States";
import { supabase } from "@/lib/supabase";
import { categoryLabel, statusLabel, type Announcement } from "@/lib/types";
import { formatDate, whatsappUrl } from "@/lib/format";
import { api } from "@/services/api";

import styles from "./detail.module.css";

export default function AnnouncementDetail() {
  const params = useParams<{ id: string }>();

  const [item, setItem] = useState<Announcement>();
  const [owner, setOwner] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    api.getPublic(params.id)
      .then(setItem)
      .catch((e) => {
        setError(
          e instanceof Error
            ? e.message
            : "Não foi possível carregar o anúncio.",
        );
      });
  }, [params.id]);

  useEffect(() => {
    if (!supabase || !item) return;

    let active = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) return;

      api.getMine(String(item.id))
        .then(() => {
          if (active) setOwner(true);
        })
        .catch(() => {
          if (active) setOwner(false);
        });
    });

    return () => {
      active = false;
    };
  }, [item]);

  if (error) {
    return (
      <div className="page container">
        <Notice kind="error" title="Anúncio indisponível">
          {error}
        </Notice>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="page container">
        <LoadingGrid />
      </div>
    );
  }

  const isClosed = item.status === "closed";

  return (
    <div className="page container">
      <Link className={styles.back} href="/">
        <span aria-hidden="true">←</span>
        Voltar às publicações
      </Link>

      <article
        className={styles.layout}
        aria-labelledby="announcement-title"
      >
        <div className={styles.media}>
          <CategoryArt
            category={item.category}
            imageUrl={item.image_url}
            alt={item.title}
          />
        </div>

        <div className={styles.info}>
          <div className={styles.header}>
            <div className={styles.headerMeta}>
              <span className={styles.category}>
                {categoryLabel(item.category)}
              </span>

              {isClosed && (
                <span
                  className="status closed"
                  aria-label="Anúncio encerrado"
                >
                  {statusLabel(item.status)}
                </span>
              )}
            </div>

            <h1 id="announcement-title">{item.title}</h1>

            <p className={styles.meta}>
              Publicado em {formatDate(item.created_at)}
            </p>
          </div>

          <section
            className={styles.contentSection}
            aria-labelledby="description-title"
          >
            <h2 id="description-title">Sobre esta publicação</h2>

            <div className={styles.copy}>
              {item.description}
            </div>
          </section>

          <section
            className={styles.location}
            aria-labelledby="location-title"
          >
            <h2 id="location-title">Localização</h2>

            <p>{item.neighborhood}</p>

            <span>
              Bairro informado na publicação.
            </span>
          </section>

          <section
            className={styles.contact}
            aria-labelledby="contact-title"
          >
            <div>
              <p className={styles.contactEyebrow}>
                Entre em contato
              </p>

              <h2 id="contact-title">
                Tem interesse nesta publicação?
              </h2>

              {item.contact_name && (
                <div className={styles.contactDetail}>
                  <span>Responsável</span>
                  <strong>{item.contact_name}</strong>
                </div>
              )}

              {item.contact_phone && (
                <div className={styles.contactDetail}>
                  <span>WhatsApp</span>
                  <strong>{item.contact_phone}</strong>
                </div>
              )}
            </div>

            {item.contact_phone ? (
              <a
                className="button whatsapp"
                target="_blank"
                rel="noreferrer"
                href={whatsappUrl(
                  item.contact_phone,
                  item.title,
                )}
                aria-label={`Entrar em contato pelo WhatsApp sobre ${item.title}`}
              >
                Entrar em contato pelo WhatsApp
              </a>
            ) : (
              <p className={styles.noContact}>
                Este anúncio não informou um canal de contato.
              </p>
            )}
          </section>

          {owner && (
            <div className={styles.ownerActions}>
              <Link
                className="button secondary"
                href={`/minhas/${item.id}`}
              >
                Editar ou excluir minha publicação
              </Link>
            </div>
          )}
        </div>
      </article>
    </div>
  );
}
import React from "react";
import Link from "next/link";

import type { Announcement } from "@/lib/types";
import { categoryLabel } from "@/lib/types";
import { formatRelativeDate } from "@/lib/format";

import { CategoryArt } from "./CategoryArt";
import styles from "./AnnouncementCard.module.css";

interface AnnouncementCardProps {
    item: Announcement;
}

export function AnnouncementCard({ item }: AnnouncementCardProps) {
    return (
        <Link
            href={`/anuncio/${item.id}`}
            className={styles.card}
            aria-label={`Ver detalhes de ${item.title}`}
        >
            <CategoryArt
                category={item.category}
                imageUrl={item.image_url}
                alt={item.title}
            />

            <div className={styles.body}>
                <span className={styles.category}>
                    {categoryLabel(item.category)}
                </span>

                <h3 className={styles.title}>{item.title}</h3>

                <div className={styles.meta}>
                    <span className={styles.metaItem}>
                        <svg
                            aria-hidden="true"
                            viewBox="0 0 24 24"
                            className={styles.icon}
                        >
                            <path
                                d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="1.8"
                            />
                            <circle
                                cx="12"
                                cy="10"
                                r="2.5"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="1.8"
                            />
                        </svg>

                        <span>{item.neighborhood}</span>
                    </span>

                    <span className={styles.metaItem}>
                        <svg
                            aria-hidden="true"
                            viewBox="0 0 24 24"
                            className={styles.icon}
                        >
                            <circle
                                cx="12"
                                cy="12"
                                r="8.5"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="1.8"
                            />
                            <path
                                d="M12 7v5l3 2"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="1.8"
                                strokeLinecap="round"
                            />
                        </svg>

                        <span>{formatRelativeDate(item.created_at)}</span>
                    </span>
                </div>

                <span className={styles.action}>
                    <span>Ver detalhes</span>

                    <span aria-hidden="true" className={styles.arrow}>
                        →
                    </span>
                </span>
            </div>
        </Link>
    );
}

import React from "react";
import Link from "next/link";
import type { Announcement } from "@/lib/types";
import { categoryLabel } from "@/lib/types";
import { formatDate } from "@/lib/format";
import { CategoryArt } from "./CategoryArt";
import styles from "./AnnouncementCard.module.css";
export function AnnouncementCard({ item }: { item: Announcement }) { return <Link href={`/anuncio/${item.id}`} className={styles.card}><CategoryArt category={item.category} imageUrl={item.image_url} alt={item.title} /><div className={styles.body}><span className={styles.category}>{categoryLabel(item.category)}</span><h3>{item.title}</h3><p className={styles.meta}>{item.neighborhood} · {formatDate(item.created_at)}</p><p className={styles.description}>{item.description}</p></div></Link>; }

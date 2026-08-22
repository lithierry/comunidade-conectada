/* eslint-disable @next/next/no-img-element */
import React from "react";
import type { Category } from "@/lib/types";
import { categories } from "@/lib/types";
import styles from "./CategoryArt.module.css";

export function CategoryArt({ category, imageUrl, alt = "" }: { category: Category; imageUrl?: string | null; alt?: string }) { const data = categories.find((item) => item.value === category)!; return <div className={styles.art}>{imageUrl ? <img src={imageUrl} alt={alt} /> : <span className={`${styles.symbol} ${styles[category]}`} aria-hidden="true">{data.symbol}</span>}</div>; }

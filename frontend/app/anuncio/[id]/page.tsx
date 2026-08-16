"use client";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect,useState } from "react";
import { CategoryArt } from "@/components/CategoryArt";
import { LoadingGrid, Notice } from "@/components/States";
import { api } from "@/services/api";
import { categoryLabel,type Announcement } from "@/lib/types";
import { formatDate,whatsappUrl } from "@/lib/format";
import styles from "./detail.module.css";
export default function AnnouncementDetail(){const params=useParams<{id:string}>();const[item,setItem]=useState<Announcement>();const[error,setError]=useState("");useEffect(()=>{api.getPublic(params.id).then(setItem).catch((e)=>setError(e instanceof Error?e.message:"Não foi possível carregar o anúncio."));},[params.id]);if(error)return <div className="page container"><Notice kind="error" title="Anúncio indisponível">{error}</Notice></div>;if(!item)return <div className="page container"><LoadingGrid/></div>;return <div className="page container"><Link className={styles.back} href="/">← Voltar às publicações</Link><article className={styles.layout}><CategoryArt category={item.category} imageUrl={item.image_url} alt={item.title}/><div className={styles.info}><span className={styles.category}>{categoryLabel(item.category)}</span><h1>{item.title}</h1><p className={styles.meta}>{item.neighborhood} · Publicado em {formatDate(item.created_at)}</p><div className={styles.copy}>{item.description}</div><dl><div><dt>Responsável</dt><dd>{item.contact_name || "Contato da comunidade"}</dd></div>{item.contact_phone&&<div><dt>WhatsApp</dt><dd>{item.contact_phone}</dd></div>}</dl>{item.contact_phone?<a className="button whatsapp" target="_blank" rel="noreferrer" href={whatsappUrl(item.contact_phone,item.title)}>Entrar em contato</a>:<p className={styles.noContact}>Este anúncio não informou um canal de contato.</p>}</div></article></div>}

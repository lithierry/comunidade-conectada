"use client";
import Link from "next/link";
import { useState } from "react";
import { AnnouncementForm } from "@/components/AnnouncementForm";
import { api } from "@/services/api";
import { Notice } from "@/components/States";
import styles from "./publicar.module.css";
export default function PublishPage(){const[success,setSuccess]=useState(false),[saving,setSaving]=useState(false);async function submit(form:FormData){setSaving(true);try{await api.create(form);setSuccess(true);}finally{setSaving(false);}}return <div className="page container"><div className={styles.intro}><p className="eyebrow">Novo anúncio</p><h1>Compartilhe com a comunidade</h1><p>Seu anúncio será analisado antes de aparecer no mural.</p></div>{success?<div className={styles.success}><Notice kind="success" title="Publicação enviada">Seu anúncio foi enviado para análise.</Notice><Link className="button primary" href="/">Voltar ao início</Link></div>:<AnnouncementForm submitLabel="Publicar anúncio" onSubmit={submit} submitting={saving}/>}</div>}

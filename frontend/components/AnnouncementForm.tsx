"use client";

/* eslint-disable @next/next/no-img-element -- previews can use local blob URLs */

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { AppAlert } from "@/components/AppAlert";
import { categories, type Announcement } from "@/lib/types";
import styles from "./AnnouncementForm.module.css";

const categoryOptionLabels: Record<(typeof categories)[number]["value"], string> = { donation: "Doação", event: "Evento", opportunity: "Oportunidade", service: "Serviço" };
const acceptedTypes = ["image/jpeg", "image/png", "image/webp"];

export function AnnouncementForm({ initial, submitLabel, onSubmit, submitting = false }: { initial?: Announcement; submitLabel: string; submitting?: boolean; onSubmit: (form: FormData) => Promise<void> }) {
  const [error, setError] = useState("");
  const [errorField, setErrorField] = useState("");
  const [fileName, setFileName] = useState("");
  const [preview, setPreview] = useState(initial?.image_url || "");

  useEffect(() => () => { if (preview.startsWith("blob:")) URL.revokeObjectURL(preview); }, [preview]);

  function showError(field: string, message: string) {
    setErrorField(field);
    setError(message);
    if (field) document.getElementById(field)?.focus();
  }

  function chooseImage(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!acceptedTypes.includes(file.type)) { showError("image", "Escolha uma imagem JPG, PNG ou WEBP."); event.target.value = ""; return; }
    if (file.size > 5 * 1024 * 1024) { showError("image", "A imagem deve ter no máximo 5 MB."); event.target.value = ""; return; }
    setError(""); setErrorField(""); setFileName(file.name); setPreview(URL.createObjectURL(file));
  }

  function clearSelectedImage(event: React.MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    const input = document.getElementById("image") as HTMLInputElement | null;
    if (input) input.value = "";
    if (errorField === "image") { setError(""); setErrorField(""); }
    setFileName(""); setPreview(initial?.image_url || "");
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(""); setErrorField("");
    const form = new FormData(event.currentTarget);
    const title = String(form.get("title") || "").trim();
    const description = String(form.get("description") || "").trim();
    const neighborhood = String(form.get("neighborhood") || "").trim();
    const contactName = String(form.get("contact_name") || "").trim();
    const phone = String(form.get("contact_phone") || "").trim();
    if (!title) { showError("title", "Informe um título para a publicação."); return; }
    if (title.length < 3) { showError("title", "O título deve ter pelo menos 3 caracteres."); return; }
    if (!neighborhood) { showError("neighborhood", "Informe o bairro onde a publicação acontece."); return; }
    if (neighborhood.length < 2) { showError("neighborhood", "O bairro deve ter pelo menos 2 caracteres."); return; }
    if (!description) { showError("description", "Explique na descrição o que está sendo publicado."); return; }
    if (description.length < 10) { showError("description", "A descrição deve ter pelo menos 10 caracteres."); return; }
    if (contactName && contactName.length < 2) { showError("contact_name", "O nome para contato deve ter pelo menos 2 caracteres ou ficar vazio."); return; }
    if (phone && phone.replace(/\D/g, "").length < 10) { showError("contact_phone", "Informe um WhatsApp com DDD e número, ou deixe o campo vazio."); return; }
    if (!initial && form.get("publication_consent") !== "true") { showError("publication_consent", "Confirme a autorização para publicar os dados informados."); return; }
    form.set("title", title);
    form.set("description", description);
    form.set("neighborhood", neighborhood);
    form.set("contact_name", contactName);
    form.set("contact_phone", phone);
    try { await onSubmit(form); } catch (e) { showError("", e instanceof Error ? e.message : "Não foi possível salvar o anúncio."); }
  }

  return <form className={styles.form} onSubmit={submit} noValidate>
    <div className="form-field">
      <label htmlFor="title">Título *</label>
      <input id="title" name="title" minLength={3} maxLength={120} required defaultValue={initial?.title} aria-invalid={errorField === "title"} />
    </div>
    <div className={styles.two}>
      <div className="form-field">
        <label htmlFor="category">Categoria *</label>
        <select id="category" name="category" defaultValue={initial?.category ?? "donation"}>{categories.map((category) => <option value={category.value} key={category.value}>{categoryOptionLabels[category.value]}</option>)}</select>
      </div>
      <div className="form-field">
        <label htmlFor="neighborhood">Bairro *</label>
        <input id="neighborhood" name="neighborhood" minLength={2} maxLength={100} required defaultValue={initial?.neighborhood} aria-invalid={errorField === "neighborhood"} />
      </div>
    </div>
    <div className="form-field">
      <label htmlFor="description">Descrição *</label>
      <textarea id="description" name="description" minLength={10} maxLength={3000} required defaultValue={initial?.description} aria-invalid={errorField === "description"} />
    </div>
    <div className={styles.two}>
      <div className="form-field">
        <label htmlFor="contact_name">Nome para contato (opcional)</label>
        <input id="contact_name" name="contact_name" minLength={2} maxLength={100} autoComplete="name" defaultValue={initial?.contact_name ?? ""} aria-invalid={errorField === "contact_name"} />
      </div>
      <div className="form-field">
        <label htmlFor="contact_phone">WhatsApp (opcional)</label>
        <input id="contact_phone" name="contact_phone" inputMode="tel" autoComplete="tel" maxLength={20} defaultValue={initial?.contact_phone ?? ""} aria-invalid={errorField === "contact_phone"} />
      </div>
    </div>
    <div className="form-field">
      <span className={styles.imageLabel}>Imagem (opcional)</span>
      <div className={styles.imagePicker}>
        <label className={styles.preview} htmlFor="image">{preview ? <img src={preview} alt="Prévia da imagem do anúncio" /> : <span><strong>Adicionar imagem</strong><small>JPG, PNG ou WEBP · 5 MB</small></span>}</label>
        <input className={styles.fileInput} id="image" name="image" type="file" accept="image/jpeg,image/png,image/webp" onChange={chooseImage} aria-invalid={errorField === "image"} aria-describedby="image-help" />
        <div className={styles.imageActions}><label className="button secondary" htmlFor="image">{preview ? "Trocar imagem" : "Escolher imagem"}</label>{(fileName || (initial?.image_url && preview)) && <button type="button" className="button secondary" onClick={clearSelectedImage}>Remover seleção</button>}</div>
        <small id="image-help" className={styles.fileName}>{fileName || (initial?.image_url ? "Imagem atual" : "Imagem opcional")}</small>
      </div>
      {initial?.image_url && <label className={styles.removeImage}><input type="checkbox" name="remove_image" /> Remover imagem atual ao salvar</label>}
    </div>
    {!initial && <label className="legal-check"><input id="publication_consent" type="checkbox" name="publication_consent" value="true" required aria-invalid={errorField === "publication_consent"} /><span>Autorizo a publicação dos dados informados e aceito o aviso de <Link href="/privacidade" target="_blank">privacidade</Link>.</span></label>}
    {error && <AppAlert kind="error" title="Revise a publicação" message={error} onClose={() => setError("")} />}
    <button className="button primary" disabled={submitting}>{submitting ? "Salvando…" : submitLabel}</button>
  </form>;
}

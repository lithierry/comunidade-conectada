"use client";

import { useState } from "react";
import Link from "next/link";
import { AccountIdentityFields } from "@/components/AccountIdentityFields";
import { AppAlert } from "@/components/AppAlert";
import { normalizeBrazilianPhone, normalizeCpf } from "@/lib/identity";
import { api } from "@/services/api";
import styles from "./AdminLogin.module.css";

export function ProfileCompletionForm({ initialName, onSuccess }: { initialName: string; onSuccess: () => void | Promise<void> }) {
  const [name, setName] = useState(initialName);
  const [cpf, setCpf] = useState("");
  const [phone, setPhone] = useState("");
  const [privacyAcknowledged, setPrivacyAcknowledged] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const fullName = name.trim().replace(/\s+/g, " ");
    const normalizedCpf = normalizeCpf(cpf);
    const normalizedPhone = normalizeBrazilianPhone(phone);
    if (fullName.length < 2) { setError("Informe seu nome completo."); return; }
    if (!normalizedCpf) { setError("Informe um CPF válido."); return; }
    if (!normalizedPhone) { setError("Informe um telefone brasileiro válido com DDD."); return; }
    if (!privacyAcknowledged) { setError("Confirme que você leu o aviso de privacidade."); return; }
    setSaving(true);
    try {
      await api.completeAccount({
        full_name: fullName,
        cpf: normalizedCpf,
        phone: normalizedPhone,
        privacy_acknowledged: true,
      });
      setCpf("");
      setPhone("");
      await onSuccess();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Não foi possível concluir o cadastro.");
    } finally {
      setSaving(false);
    }
  }

  return <form className={styles.form} onSubmit={submit} noValidate>
    <p className="eyebrow">Segurança da conta</p>
    <h1>Concluir cadastro</h1>
    <div className="form-field">
      <label htmlFor="complete-name">Nome completo</label>
      <input id="complete-name" type="text" autoComplete="name" minLength={2} maxLength={100} required value={name} onChange={(event) => setName(event.target.value)} />
    </div>
    <AccountIdentityFields cpf={cpf} phone={phone} onCpfChange={setCpf} onPhoneChange={setPhone} idPrefix="complete" />
    <label className="legal-check"><input type="checkbox" checked={privacyAcknowledged} onChange={(event) => setPrivacyAcknowledged(event.target.checked)} required /><span>Li e estou ciente do aviso de <Link href="/privacidade" target="_blank">privacidade e uso de dados</Link>.</span></label>
    {error && <AppAlert kind="error" title="Verifique os dados" message={error} onClose={() => setError("")} />}
    <button className="button primary" disabled={saving}>{saving ? "Salvando…" : "Concluir cadastro"}</button>
  </form>;
}

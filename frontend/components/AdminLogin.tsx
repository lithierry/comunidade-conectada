"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AccountIdentityFields } from "@/components/AccountIdentityFields";
import { AppAlert, showFlashAlert } from "@/components/AppAlert";
import { authErrorMessage } from "@/lib/auth";
import { normalizeBrazilianPhone, normalizeCpf } from "@/lib/identity";
import { api } from "@/services/api";
import { supabase } from "@/lib/supabase";
import styles from "./AdminLogin.module.css";

type LoginProps = {
  onSuccess: () => void | Promise<void>;
  title?: string;
  eyebrow?: string;
};

export function AdminLogin({ onSuccess, title = "Administração", eyebrow = "Área restrita" }: LoginProps) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setSaving(true);
    try {
      await api.login(password);
      await onSuccess();
    } catch (caught) {
      setError(authErrorMessage(caught, "Não foi possível entrar."));
    } finally {
      setSaving(false);
    }
  }

  return <form onSubmit={submit} className={styles.form}>
    <p className="eyebrow">{eyebrow}</p>
    <h1>{title}</h1>
    <div className="form-field">
      <label htmlFor="admin-password">Senha</label>
      <input id="admin-password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} required autoComplete="current-password" />
    </div>
    {error && <AppAlert kind="error" title="Não foi possível entrar" message={error} onClose={() => setError("")} />}
    <button className="button primary" disabled={saving}>{saving ? "Entrando…" : "Entrar"}</button>
  </form>;
}

type AuthMode = "signin" | "signup" | "recover";

export function SupabaseLogin({ onSuccess, title = "Entrar na comunidade", eyebrow = "Acesso da comunidade" }: LoginProps) {
  const [mode, setMode] = useState<AuthMode>("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [cpf, setCpf] = useState("");
  const [phone, setPhone] = useState("");
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  function changeMode(nextMode: AuthMode) {
    setMode(nextMode);
    setError("");
    setMessage("");
    setPassword("");
    setCpf("");
    setPhone("");
    setPrivacyAccepted(false);
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!supabase) return;
    setError("");
    setMessage("");

    const normalizedEmail = email.trim().toLowerCase();
    const normalizedName = name.trim();
    const normalizedCpf = normalizeCpf(cpf);
    const normalizedPhone = normalizeBrazilianPhone(phone);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      setError("Informe um e-mail válido.");
      return;
    }
    if (mode === "signup" && normalizedName.length < 2) {
      setError("Informe seu nome completo.");
      return;
    }
    if (mode === "signup" && !normalizedCpf) {
      setError("Informe um CPF válido.");
      return;
    }
    if (mode === "signup" && !normalizedPhone) {
      setError("Informe um telefone brasileiro válido com DDD.");
      return;
    }
    if (mode !== "recover" && !password) {
      setError("Informe sua senha.");
      return;
    }
    if (mode === "signup" && password.length < 6) {
      setError("A senha deve ter pelo menos 6 caracteres.");
      return;
    }
    if (mode === "signup" && !privacyAccepted) {
      setError("Confirme que você leu o aviso de privacidade.");
      return;
    }

    setSaving(true);
    try {
      if (mode === "signin") {
        const result = await supabase.auth.signInWithPassword({ email: normalizedEmail, password });
        if (result.error) throw result.error;
        await onSuccess();
      } else if (mode === "signup") {
        await api.registerAccount({
          full_name: normalizedName,
          email: normalizedEmail,
          password,
          cpf: normalizedCpf!,
          phone: normalizedPhone!,
          privacy_acknowledged: privacyAccepted,
        });
        const signedIn = await supabase.auth.signInWithPassword({ email: normalizedEmail, password });
        if (signedIn.error) throw signedIn.error;
        setPassword("");
        setCpf("");
        setPhone("");
        showFlashAlert({ kind: "success", title: "Conta criada", message: "Você já está conectado." });
        await onSuccess();
      } else {
        const result = await supabase.auth.resetPasswordForEmail(normalizedEmail, {
          redirectTo: `${window.location.origin}/redefinir-senha`,
        });
        if (result.error) throw result.error;
        setMessage("Se este e-mail estiver cadastrado, você receberá um link para criar uma nova senha.");
      }
    } catch (caught) {
      setError(authErrorMessage(caught, "Não foi possível concluir o acesso."));
    } finally {
      setSaving(false);
    }
  }

  const signingUp = mode === "signup";
  const recovering = mode === "recover";

  return <form onSubmit={submit} className={styles.form} noValidate>
    <p className="eyebrow">{eyebrow}</p>
    <h1>{signingUp ? "Criar conta" : recovering ? "Recuperar senha" : title}</h1>
    {signingUp && <div className="form-field">
      <label htmlFor="name">Nome completo</label>
      <input id="name" type="text" value={name} onChange={(event) => setName(event.target.value)} required minLength={2} maxLength={100} autoComplete="name" />
    </div>}
    <div className="form-field">
      <label htmlFor="email">E-mail</label>
      <input id="email" type="email" inputMode="email" value={email} onChange={(event) => setEmail(event.target.value)} required autoComplete="email" />
    </div>
    {signingUp && <AccountIdentityFields cpf={cpf} phone={phone} onCpfChange={setCpf} onPhoneChange={setPhone} idPrefix="signup" />}
    {!recovering && <div className="form-field">
      <label htmlFor="password">Senha</label>
      <input id="password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} required minLength={6} autoComplete={signingUp ? "new-password" : "current-password"} />
    </div>}
    {signingUp && <label className="legal-check"><input type="checkbox" checked={privacyAccepted} onChange={(event) => setPrivacyAccepted(event.target.checked)} required /><span>Li o aviso de <Link href="/privacidade" target="_blank">privacidade e uso de dados</Link>.</span></label>}
    {!signingUp && !recovering && <button type="button" className={styles.linkButton} onClick={() => changeMode("recover")}>Esqueci minha senha</button>}
    {error && <AppAlert kind="error" title="Verifique os dados" message={error} onClose={() => setError("")} />}
    {message && <AppAlert kind="success" title="Tudo certo" message={message} onClose={() => setMessage("")} />}
    <button className="button primary" disabled={saving}>{saving ? "Aguarde…" : signingUp ? "Criar conta" : recovering ? "Enviar link" : "Entrar"}</button>
    <div className={styles.alternatives}>
      {recovering ? <button type="button" className="button secondary" onClick={() => changeMode("signin")}>Voltar para entrar</button> : <button type="button" className="button secondary" onClick={() => changeMode(signingUp ? "signin" : "signup")}>{signingUp ? "Já tenho uma conta" : "Criar uma conta"}</button>}
    </div>
  </form>;
}

export function PasswordUpdateForm() {
  const [ready, setReady] = useState(false);
  const [hasSession, setHasSession] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!supabase) { setReady(true); return; }
    let active = true;
    async function establishSession() {
      const current = await supabase!.auth.getSession();
      if (current.data.session) {
        if (active) { setHasSession(true); setReady(true); }
        return;
      }
      const code = new URLSearchParams(window.location.search).get("code");
      if (code) {
        const exchanged = await supabase!.auth.exchangeCodeForSession(code);
        if (active) {
          setHasSession(Boolean(exchanged.data.session));
          if (exchanged.error) setError(authErrorMessage(exchanged.error, "Este link de recuperação não é válido."));
        }
      }
      if (active) setReady(true);
    }
    establishSession();
    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || session) setHasSession(Boolean(session));
    });
    return () => { active = false; listener.subscription.unsubscribe(); };
  }, []);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!supabase) return;
    setError("");
    if (password.length < 6) { setError("A senha deve ter pelo menos 6 caracteres."); return; }
    if (password !== confirmation) { setError("As senhas não coincidem."); return; }
    setSaving(true);
    const result = await supabase.auth.updateUser({ password });
    if (result.error) setError(authErrorMessage(result.error, "Não foi possível atualizar sua senha."));
    else setSuccess(true);
    setSaving(false);
  }

  if (!ready) return <div className={styles.form} aria-busy="true"><p className="eyebrow">Segurança</p><h1>Verificando o link…</h1></div>;
  if (!hasSession) return <div className={styles.form}><p className="eyebrow">Segurança</p><h1>Link indisponível</h1><p>{error || "Este link expirou ou já foi utilizado."}</p><Link className="button primary" href="/login">Solicitar novo link</Link></div>;
  if (success) return <div className={styles.form}><p className="eyebrow">Segurança</p><h1>Senha atualizada</h1><p>Sua nova senha já está ativa.</p><Link className="button primary" href="/minhas">Continuar para minha conta</Link></div>;

  return <form className={styles.form} onSubmit={submit}>
    <p className="eyebrow">Segurança</p>
    <h1>Criar nova senha</h1>
    <div className="form-field"><label htmlFor="new-password">Nova senha</label><input id="new-password" type="password" required minLength={6} autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} /></div>
    <div className="form-field"><label htmlFor="password-confirmation">Confirmar nova senha</label><input id="password-confirmation" type="password" required minLength={6} autoComplete="new-password" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} /></div>
    {error && <AppAlert kind="error" title="Não foi possível salvar" message={error} onClose={() => setError("")} />}
    <button className="button primary" disabled={saving}>{saving ? "Salvando…" : "Salvar nova senha"}</button>
  </form>;
}

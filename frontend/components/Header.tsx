"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useEffect, useRef, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { AppAlert } from "@/components/AppAlert";
import { authErrorMessage, userDisplayName } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import styles from "./Header.module.css";

export function Header() {
  const router = useRouter();
  const accountRef = useRef<HTMLDivElement>(null);
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(!supabase);
  const [menuOpen, setMenuOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [logoutError, setLogoutError] = useState("");

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => { setUser(data.session?.user ?? null); setAuthReady(true); });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setAuthReady(true);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    function closeOnOutsideClick(event: PointerEvent) {
      if (accountRef.current && !accountRef.current.contains(event.target as Node)) setAccountOpen(false);
    }
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") { setAccountOpen(false); setMenuOpen(false); }
    }
    document.addEventListener("pointerdown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, []);

  const closeMenus = () => { setMenuOpen(false); setAccountOpen(false); };

  async function signOut() {
    if (!supabase) return;
    setSigningOut(true);
    setLogoutError("");
    const { error } = await supabase.auth.signOut();
    if (error) {
      setLogoutError(authErrorMessage(error, "Não foi possível sair. Tente novamente."));
      setSigningOut(false);
      return;
    }
    setUser(null);
    setSigningOut(false);
    closeMenus();
    router.replace("/");
    router.refresh();
  }

  return <header className={styles.header}><div className={styles.inner}>
    <Link className={styles.brand} href="/" onClick={closeMenus}>Comunidade <span>Conectada</span></Link>
    <button className={styles.menuButton} type="button" aria-expanded={menuOpen} aria-controls="main-navigation" aria-label={menuOpen ? "Fechar menu" : "Abrir menu"} onClick={() => setMenuOpen((open) => !open)}><span /><span /><span /></button>
    <nav id="main-navigation" className={menuOpen ? styles.open : ""} aria-label="Navegação principal">
      <Link href="/" onClick={closeMenus}>Explorar</Link>
      {!authReady ? <span className={styles.authPlaceholder} aria-label="Verificando sessão" /> : user ? <div className={styles.accountMenu} ref={accountRef}>
        <button className={styles.accountTrigger} type="button" aria-expanded={accountOpen} aria-controls="account-options" onClick={() => { setAccountOpen((open) => !open); setLogoutError(""); }}>{userDisplayName(user)} <span aria-hidden="true">⌄</span></button>
        {accountOpen && <div className={styles.accountOptions} id="account-options">
          <Link href="/minhas" onClick={closeMenus}>Minhas publicações</Link>
          <button type="button" disabled={signingOut} onClick={signOut}>{signingOut ? "Saindo…" : "Sair"}</button>
          {logoutError && <AppAlert kind="error" title="Não foi possível sair" message={logoutError} onClose={() => setLogoutError("")} />}
        </div>}
      </div> : <Link href="/login" onClick={closeMenus}>Entrar</Link>}
      <Link className={styles.publish} href="/publicar" onClick={closeMenus}>Publicar anúncio</Link>
    </nav>
  </div></header>;
}

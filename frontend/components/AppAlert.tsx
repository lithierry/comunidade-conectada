"use client";

import React, { useEffect, useState } from "react";
import styles from "./AppAlert.module.css";

export type AlertKind = "error" | "success" | "info";

export type AlertPayload = {
  kind: AlertKind;
  title: string;
  message: string;
};

const flashEvent = "comunidade:alert";
const flashStorage = "comunidade:pending-alert";

export function showFlashAlert(payload: AlertPayload) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(flashStorage, JSON.stringify(payload));
  window.dispatchEvent(new CustomEvent<AlertPayload>(flashEvent, { detail: payload }));
}

export function AppAlert({ kind, title, message, onClose }: AlertPayload & { onClose?: () => void }) {
  const icon = kind === "error" ? "!" : kind === "success" ? "✓" : "i";
  return <aside className={`${styles.alert} ${styles[kind]}`} role={kind === "error" ? "alert" : "status"} aria-live={kind === "error" ? "assertive" : "polite"}>
    <span className={styles.icon} aria-hidden="true">{icon}</span>
    <div className={styles.content}><strong>{title}</strong><p>{message}</p></div>
    {onClose && <button className={styles.close} type="button" aria-label="Fechar alerta" onClick={onClose}>×</button>}
  </aside>;
}

export function FlashAlertHost() {
  const [alert, setAlert] = useState<AlertPayload | null>(null);

  useEffect(() => {
    const stored = sessionStorage.getItem(flashStorage);
    if (stored) {
      try { setAlert(JSON.parse(stored) as AlertPayload); } catch { /* armazenamento inválido é ignorado */ }
      sessionStorage.removeItem(flashStorage);
    }
    const receive = (event: Event) => {
      setAlert((event as CustomEvent<AlertPayload>).detail);
      sessionStorage.removeItem(flashStorage);
    };
    window.addEventListener(flashEvent, receive);
    return () => window.removeEventListener(flashEvent, receive);
  }, []);

  useEffect(() => {
    if (!alert) return;
    const timer = window.setTimeout(() => setAlert(null), 6000);
    return () => window.clearTimeout(timer);
  }, [alert]);

  return alert ? <AppAlert {...alert} onClose={() => setAlert(null)} /> : null;
}

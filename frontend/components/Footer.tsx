import Link from "next/link";
import styles from "./Footer.module.css";

export function Footer() {
  return <footer className={styles.footer}>
    <div className={styles.inner}>
      <span>Comunidade Conectada</span>
      <Link href="/privacidade">Privacidade e uso de dados</Link>
    </div>
  </footer>;
}

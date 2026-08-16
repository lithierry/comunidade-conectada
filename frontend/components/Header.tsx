import Link from "next/link";
import styles from "./Header.module.css";
export function Header() { return <header className={styles.header}><div className={styles.inner}><Link className={styles.brand} href="/">Comunidade <span>Conectada</span></Link><nav aria-label="Navegação principal"><Link href="/">Explorar</Link><Link href="/login">Entrar</Link><Link className={styles.publish} href="/publicar">Publicar anúncio</Link></nav></div></header>; }

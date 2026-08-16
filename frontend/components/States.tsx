import styles from "./States.module.css";
export function LoadingGrid() { return <div className={styles.grid} aria-label="Carregando publicações">{[1,2,3].map((item) => <div className={styles.skeleton} key={item} />)}</div>; }
export function Notice({ title, children, kind = "empty" }: { title: string; children?: React.ReactNode; kind?: "empty" | "error" | "success" }) { return <section className={`${styles.notice} ${styles[kind]}`} role={kind === "error" ? "alert" : "status"}><h2>{title}</h2>{children && <p>{children}</p>}</section>; }

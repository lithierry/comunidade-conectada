import type { Metadata } from "next";
import "./globals.css";
import { FlashAlertHost } from "@/components/AppAlert";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
export const metadata: Metadata = { title: "Comunidade Conectada", description: "Mural digital de iniciativas da comunidade" };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="pt-BR" data-scroll-behavior="smooth"><body><a href="#conteudo" className="skip">Pular para o conteúdo</a><Header /><FlashAlertHost /><main id="conteudo">{children}</main><Footer /></body></html>; }

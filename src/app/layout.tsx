import type { Metadata } from "next";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "iScout — Plataforma de Scouting",
    template: "%s | iScout",
  },
  description:
    "Plataforma web de scouting profissional focada em mercados emergentes.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pt-BR"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <header className="border-b border-zinc-200 dark:border-zinc-800">
          <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between px-4">
            <Link href="/" className="flex items-center gap-2 font-bold tracking-tight">
              <span className="flex h-7 w-7 items-center justify-center rounded-md bg-zinc-900 text-sm text-white dark:bg-zinc-100 dark:text-zinc-900">
                ⚽
              </span>
              iScout
            </Link>
            <nav className="flex items-center gap-4 text-sm">
              <Link
                href="/jogadores"
                className="text-zinc-600 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
              >
                Jogadores
              </Link>
              <Link
                href="/jogadores/novo"
                className="rounded-md bg-zinc-900 px-3 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
              >
                + Novo jogador
              </Link>
            </nav>
          </div>
        </header>
        <main className="flex-1">{children}</main>
      </body>
    </html>
  );
}
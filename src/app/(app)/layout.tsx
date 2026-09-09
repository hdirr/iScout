import Link from "next/link";
import { sair } from "@/app/(auth)/actions";
import { getCurrentUser } from "@/lib/dal";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-zinc-200 dark:border-zinc-800">
        <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between px-4">
          <Link
            href="/"
            className="flex items-center gap-2 font-bold tracking-tight"
          >
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
            {user ? (
              <>
                <Link
                  href="/jogadores/novo"
                  className="rounded-md bg-zinc-900 px-3 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
                >
                  + Novo jogador
                </Link>
                <form action={sair}>
                  <button
                    type="submit"
                    className="text-zinc-500 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
                  >
                    Sair ({user.email})
                  </button>
                </form>
              </>
            ) : (
              <Link
                href="/entrar"
                className="rounded-md bg-zinc-900 px-3 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
              >
                Entrar
              </Link>
            )}
          </nav>
        </div>
      </header>
      <main className="flex-1">{children}</main>
    </div>
  );
}
import Link from "next/link";

export default function Home() {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col justify-center px-4 py-16">
      <section className="max-w-2xl">
        <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
          Scouting profissional
        </p>
        <h1 className="mt-2 text-4xl font-bold tracking-tight sm:text-5xl">
          Encontre talentos nos mercados emergentes
        </h1>
        <p className="mt-4 text-lg text-zinc-600 dark:text-zinc-400">
          Plataforma de análise integrada de jogadores: performance, lesões,
          valor de mercado e compatibilidade tática com o seu clube.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/jogadores"
            className="rounded-md bg-zinc-900 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
          >
            Explorar jogadores
          </Link>
          <Link
            href="/jogadores/novo"
            className="rounded-md border border-zinc-300 px-5 py-2.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900"
          >
            Cadastrar jogador
          </Link>
        </div>
      </section>
    </div>
  );
}
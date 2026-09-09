import PlayerForm from "@/components/player-form";

export const metadata = { title: "Novo jogador" };

export default function NovoJogadorPage() {
  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-10">
      <h1 className="text-2xl font-bold tracking-tight">Novo jogador</h1>
      <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
        Cadastre as informações pessoais e contratuais do atleta.
      </p>
      <div className="mt-8">
        <PlayerForm />
      </div>
    </div>
  );
}
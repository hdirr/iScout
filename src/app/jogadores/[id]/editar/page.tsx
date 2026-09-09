import { notFound } from "next/navigation";
import PlayerForm from "@/components/player-form";
import { getPlayer } from "@/lib/data/players";

export const metadata = { title: "Editar jogador" };

export default async function EditarJogadorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const jogador = await getPlayer(id).catch(() => null);
  if (!jogador) notFound();

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-10">
      <h1 className="text-2xl font-bold tracking-tight">Editar jogador</h1>
      <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
        {jogador.nome_completo}
      </p>
      <div className="mt-8">
        <PlayerForm player={jogador} />
      </div>
    </div>
  );
}
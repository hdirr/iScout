"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

interface DeletePlayerButtonProps {
  playerId: string;
  playerName: string;
}

export default function DeletePlayerButton({
  playerId,
  playerName,
}: DeletePlayerButtonProps) {
  const router = useRouter();
  const [deletando, setDeletando] = useState(false);

  async function handleDelete() {
    if (!window.confirm(`Excluir ${playerName}? Essa ação não pode ser desfeita.`)) {
      return;
    }
    setDeletando(true);
    const res = await fetch(`/api/players/${playerId}`, { method: "DELETE" });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      window.alert(body.error ?? "Falha ao excluir jogador.");
      setDeletando(false);
      return;
    }
    router.push("/jogadores");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={deletando}
      className="rounded-md border border-red-300 px-3 py-1.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50"
    >
      {deletando ? "Excluindo..." : "Excluir"}
    </button>
  );
}
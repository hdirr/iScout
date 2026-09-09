import type { NextRequest } from "next/server";
import { createPlayer } from "@/lib/data/players";
import type { PlayerInput } from "@/lib/types";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as PlayerInput;
    if (!body.nome_completo?.trim()) {
      return Response.json({ error: "Nome do jogador é obrigatório." }, { status: 400 });
    }
    const player = await createPlayer(body);
    return Response.json(player, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro interno.";
    return Response.json({ error: message }, { status: 500 });
  }
}
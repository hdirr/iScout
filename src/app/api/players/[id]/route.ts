import type { NextRequest } from "next/server";
import {
  deletePlayer,
  getPlayer,
  updatePlayer,
} from "@/lib/data/players";
import type { PlayerInput } from "@/lib/types";

// MODO DEMONSTRAÇÃO: sem checagem de autenticação.
// Restaurar depois: `if (!(await isAuthed())) return 401` (commit 8ee2d68).

export async function PATCH(
  request: NextRequest,
  ctx: RouteContext<"/api/players/[id]">
) {
  try {
    const { id } = await ctx.params;
    const body = (await request.json()) as Partial<PlayerInput>;
    const player = await updatePlayer(id, body);
    return Response.json(player);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro interno.";
    return Response.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  ctx: RouteContext<"/api/players/[id]">
) {
  try {
    const { id } = await ctx.params;
    const existing = await getPlayer(id);
    if (!existing) {
      return Response.json({ error: "Jogador não encontrado." }, { status: 404 });
    }
    await deletePlayer(id);
    return new Response(null, { status: 204 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro interno.";
    return Response.json({ error: message }, { status: 500 });
  }
}
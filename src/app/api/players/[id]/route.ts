import type { NextRequest } from "next/server";
import {
  deletePlayer,
  getPlayer,
  updatePlayer,
} from "@/lib/data/players";
import { isAuthed } from "@/lib/dal";
import type { PlayerInput } from "@/lib/types";

export async function PATCH(
  request: NextRequest,
  ctx: RouteContext<"/api/players/[id]">
) {
  if (!(await isAuthed())) {
    return Response.json({ error: "Não autenticado." }, { status: 401 });
  }
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
  if (!(await isAuthed())) {
    return Response.json({ error: "Não autenticado." }, { status: 401 });
  }
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
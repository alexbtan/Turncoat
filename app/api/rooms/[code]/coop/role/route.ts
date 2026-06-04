import { findPlayer, toClientRoom } from "@/lib/game";
import { setCoopRole } from "@/lib/gameCoop";
import { error, json, loadRoom, readBody } from "@/lib/http";
import { store } from "@/lib/store";
import type { Role } from "@/lib/types";

export const dynamic = "force-dynamic";

// Set the caller's co-op role. Body: { playerId, role: 'spymaster'|'guesser' }.
export async function POST(
  req: Request,
  { params }: { params: Promise<{ code: string }> },
) {
  const { code } = await params;
  const room = await loadRoom(code);
  if (!room) return error("Room not found.", 404);

  const body = await readBody<{ playerId?: string; role?: Role }>(req);
  const player = body.playerId ? findPlayer(room, body.playerId) : null;
  if (!player) return error("You are not in this room.", 403);

  const result = setCoopRole(room, player, body.role as Role);
  if (!result.ok) return error(result.error ?? "Could not set role.");

  await store.save(room);
  return json({ room: toClientRoom(room, player.id) });
}

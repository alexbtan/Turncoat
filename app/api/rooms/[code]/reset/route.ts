import { startGame, toClientRoom } from "@/lib/game";
import { startCoopGame } from "@/lib/gameCoop";
import { error, json, loadRoom, readBody } from "@/lib/http";
import { store } from "@/lib/store";

export const dynamic = "force-dynamic";

// Rematch: generate a new board while keeping players and their roles.
// Body: { playerId }. Only the host can trigger a rematch.
export async function POST(
  req: Request,
  { params }: { params: Promise<{ code: string }> },
) {
  const { code } = await params;
  const room = await loadRoom(code);
  if (!room) return error("Room not found.", 404);

  const body = await readBody<{ playerId?: string }>(req);
  if (body.playerId !== room.hostId) {
    return error("Only the host can start a rematch.", 403);
  }

  const result =
    room.gameMode === "coop" ? startCoopGame(room) : startGame(room);
  if (!result.ok) return error(result.error ?? "Could not reset game.");

  await store.save(room);
  return json({ room: toClientRoom(room, body.playerId) });
}

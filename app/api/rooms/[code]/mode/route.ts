import { toClientRoom } from "@/lib/game";
import { setCoopSettings } from "@/lib/gameCoop";
import { error, json, loadRoom, readBody } from "@/lib/http";
import { store } from "@/lib/store";
import type { GameMode } from "@/lib/types";

export const dynamic = "force-dynamic";

// Host sets the game mode and (for co-op) max rounds. Lobby only.
// Body: { playerId, gameMode, maxRounds? }.
export async function POST(
  req: Request,
  { params }: { params: Promise<{ code: string }> },
) {
  const { code } = await params;
  const room = await loadRoom(code);
  if (!room) return error("Room not found.", 404);

  const body = await readBody<{
    playerId?: string;
    gameMode?: GameMode;
    maxRounds?: number;
  }>(req);

  if (body.playerId !== room.hostId) {
    return error("Only the host can change the game mode.", 403);
  }
  if (room.phase !== "lobby") {
    return error("Game mode can only change in the lobby.");
  }
  if (body.gameMode !== "classic" && body.gameMode !== "coop") {
    return error("Invalid game mode.");
  }

  const switching = room.gameMode !== body.gameMode;
  room.gameMode = body.gameMode;

  // Reset role assignments when switching modes (classic teams vs co-op roles).
  if (switching) {
    for (const p of room.players) {
      p.team = null;
      p.role = null;
    }
  }

  if (typeof body.maxRounds === "number") {
    const result = setCoopSettings(room, body.maxRounds);
    if (!result.ok) return error(result.error ?? "Invalid settings.");
  }

  await store.save(room);
  return json({ room: toClientRoom(room, body.playerId) });
}

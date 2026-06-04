import { startGame, toClientRoom } from "@/lib/game";
import { startCoopGame } from "@/lib/gameCoop";
import { error, json, loadRoom, readBody } from "@/lib/http";
import { store } from "@/lib/store";
import type { Team } from "@/lib/types";

export const dynamic = "force-dynamic";

// Start the game. Only the host can start. Body: { playerId }.
export async function POST(
  req: Request,
  { params }: { params: Promise<{ code: string }> },
) {
  const { code } = await params;
  const room = await loadRoom(code);
  if (!room) return error("Room not found.", 404);

  const body = await readBody<{ playerId?: string }>(req);
  if (body.playerId !== room.hostId) {
    return error("Only the host can start the game.", 403);
  }

  if (room.gameMode === "coop") {
    const result = startCoopGame(room);
    if (!result.ok) return error(result.error ?? "Could not start game.");
    await store.save(room);
    return json({ room: toClientRoom(room, body.playerId) });
  }

  // Require at least one spymaster and one operative per team.
  const issues: string[] = [];
  for (const team of ["red", "blue"] as Team[]) {
    const members = room.players.filter((p) => p.team === team);
    const spymasters = members.filter((p) => p.role === "spymaster");
    const operatives = members.filter((p) => p.role === "operative");
    if (spymasters.length < 1) issues.push(`${team} needs a spymaster`);
    if (operatives.length < 1) issues.push(`${team} needs an operative`);
  }
  if (issues.length > 0) {
    return error(`Cannot start: ${issues.join(", ")}.`);
  }

  const result = startGame(room);
  if (!result.ok) return error(result.error ?? "Could not start game.");

  await store.save(room);
  return json({ room: toClientRoom(room, body.playerId) });
}

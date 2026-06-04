import { findPlayer, toClientRoom } from "@/lib/game";
import { error, json, loadRoom, readBody } from "@/lib/http";
import { store } from "@/lib/store";
import type { Role, Team } from "@/lib/types";

export const dynamic = "force-dynamic";

// Set the caller's team/role in the lobby (or anytime).
// Body: { playerId, team: 'red'|'blue', role: 'spymaster'|'operative' }.
export async function POST(
  req: Request,
  { params }: { params: Promise<{ code: string }> },
) {
  const { code } = await params;
  const room = await loadRoom(code);
  if (!room) return error("Room not found.", 404);

  const body = await readBody<{
    playerId?: string;
    team?: Team;
    role?: Role;
  }>(req);

  const player = body.playerId ? findPlayer(room, body.playerId) : null;
  if (!player) return error("You are not in this room.", 403);

  if (body.team !== "red" && body.team !== "blue") {
    return error("Invalid team.");
  }
  if (body.role !== "spymaster" && body.role !== "operative") {
    return error("Invalid role.");
  }

  player.team = body.team;
  player.role = body.role;

  await store.save(room);
  return json({ room: toClientRoom(room, player.id) });
}

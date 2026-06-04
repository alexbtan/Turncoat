import { addTestPlayers, toClientRoom } from "@/lib/game";
import { error, json, loadRoom, readBody } from "@/lib/http";
import { store } from "@/lib/store";

export const dynamic = "force-dynamic";

// Host adds bot players so a solo dev can start a 4-player game.
export async function POST(
  req: Request,
  { params }: { params: Promise<{ code: string }> },
) {
  const { code } = await params;
  const room = await loadRoom(code);
  if (!room) return error("Room not found.", 404);

  const body = await readBody<{ playerId?: string }>(req);
  if (body.playerId !== room.hostId) {
    return error("Only the host can add test players.", 403);
  }

  const result = addTestPlayers(room);
  if (!result.ok) return error(result.error ?? "Could not add test players.");

  await store.save(room);
  return json({ room: toClientRoom(room, body.playerId) });
}

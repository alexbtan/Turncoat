import { returnToLobby, toClientRoom } from "@/lib/game";
import { error, json, loadRoom, readBody } from "@/lib/http";
import { store } from "@/lib/store";

export const dynamic = "force-dynamic";

// Return a finished game to the lobby. Body: { playerId }. Host only.
export async function POST(
  req: Request,
  { params }: { params: Promise<{ code: string }> },
) {
  const { code } = await params;
  const room = await loadRoom(code);
  if (!room) return error("Room not found.", 404);

  const body = await readBody<{ playerId?: string }>(req);
  if (body.playerId !== room.hostId) {
    return error("Only the host can return to the lobby.", 403);
  }

  const result = returnToLobby(room);
  if (!result.ok) return error(result.error ?? "Could not return to lobby.");

  await store.save(room);
  return json({ room: toClientRoom(room, body.playerId) });
}

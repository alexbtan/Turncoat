import { toClientRoom } from "@/lib/game";
import { setCoopSettings } from "@/lib/gameCoop";
import { error, json, loadRoom, readBody } from "@/lib/http";
import { store } from "@/lib/store";

export const dynamic = "force-dynamic";

// Host updates Turncoat mode options. Body: { playerId, maxRounds }.
export async function POST(
  req: Request,
  { params }: { params: Promise<{ code: string }> },
) {
  const { code } = await params;
  const room = await loadRoom(code);
  if (!room) return error("Room not found.", 404);

  const body = await readBody<{ playerId?: string; maxRounds?: number }>(req);

  if (body.playerId !== room.hostId) {
    return error("Only the host can change Turncoat settings.", 403);
  }
  if (room.gameMode !== "coop") {
    return error("Turncoat settings only apply in Turncoat mode.");
  }
  if (typeof body.maxRounds !== "number") {
    return error("maxRounds is required.");
  }

  const result = setCoopSettings(room, body.maxRounds);
  if (!result.ok) return error(result.error ?? "Invalid settings.");

  await store.save(room);
  return json({ room: toClientRoom(room, body.playerId) });
}

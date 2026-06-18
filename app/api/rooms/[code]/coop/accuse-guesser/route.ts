import { findPlayer, toClientRoom } from "@/lib/game";
import { coopAccuseGuesser } from "@/lib/gameCoop";
import { error, json, loadRoom, readBody } from "@/lib/http";
import { store } from "@/lib/store";

export const dynamic = "force-dynamic";

// Co-op guesser toggles accusing another guesser of being the mole.
// Body: { playerId, targetId }.
export async function POST(
  req: Request,
  { params }: { params: Promise<{ code: string }> },
) {
  const { code } = await params;
  const room = await loadRoom(code);
  if (!room) return error("Room not found.", 404);

  const body = await readBody<{ playerId?: string; targetId?: string }>(req);
  const player = body.playerId ? findPlayer(room, body.playerId) : null;
  if (!player) return error("You are not in this room.", 403);
  if (!body.targetId) return error("Target guesser is required.", 400);

  const result = coopAccuseGuesser(room, player, body.targetId);
  if (!result.ok) return error(result.error ?? "Could not accuse.");

  await store.save(room);
  return json({ room: toClientRoom(room, player.id) });
}

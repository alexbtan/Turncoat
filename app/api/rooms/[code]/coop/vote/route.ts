import { findPlayer, toClientRoom } from "@/lib/game";
import { coopVote } from "@/lib/gameCoop";
import { error, json, loadRoom, readBody } from "@/lib/http";
import { store } from "@/lib/store";

export const dynamic = "force-dynamic";

// Co-op guesser toggles a vote on a card. Body: { playerId, index }.
export async function POST(
  req: Request,
  { params }: { params: Promise<{ code: string }> },
) {
  const { code } = await params;
  const room = await loadRoom(code);
  if (!room) return error("Room not found.", 404);

  const body = await readBody<{ playerId?: string; index?: number }>(req);
  const player = body.playerId ? findPlayer(room, body.playerId) : null;
  if (!player) return error("You are not in this room.", 403);

  const result = coopVote(room, player, Number(body.index));
  if (!result.ok) return error(result.error ?? "Invalid vote.");

  await store.save(room);
  return json({ room: toClientRoom(room, player.id) });
}

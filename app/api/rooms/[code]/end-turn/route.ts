import { endTurn, findPlayer, toClientRoom } from "@/lib/game";
import { error, json, loadRoom, readBody } from "@/lib/http";
import { store } from "@/lib/store";

export const dynamic = "force-dynamic";

// End the current team's turn early. Body: { playerId }.
export async function POST(
  req: Request,
  { params }: { params: Promise<{ code: string }> },
) {
  const { code } = await params;
  const room = await loadRoom(code);
  if (!room) return error("Room not found.", 404);

  const body = await readBody<{ playerId?: string }>(req);

  const player = body.playerId ? findPlayer(room, body.playerId) : null;
  if (!player) return error("You are not in this room.", 403);

  const result = endTurn(room, player);
  if (!result.ok) return error(result.error ?? "Could not end turn.");

  await store.save(room);
  return json({ room: toClientRoom(room, player.id) });
}

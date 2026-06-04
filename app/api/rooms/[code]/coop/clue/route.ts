import { findPlayer, toClientRoom } from "@/lib/game";
import { submitCoopClue } from "@/lib/gameCoop";
import { error, json, loadRoom, readBody } from "@/lib/http";
import { store } from "@/lib/store";

export const dynamic = "force-dynamic";

// Co-op spymaster gives a clue. Body: { playerId, word, number }.
export async function POST(
  req: Request,
  { params }: { params: Promise<{ code: string }> },
) {
  const { code } = await params;
  const room = await loadRoom(code);
  if (!room) return error("Room not found.", 404);

  const body = await readBody<{
    playerId?: string;
    word?: string;
    number?: number;
  }>(req);
  const player = body.playerId ? findPlayer(room, body.playerId) : null;
  if (!player) return error("You are not in this room.", 403);

  const result = submitCoopClue(
    room,
    player,
    body.word ?? "",
    Number(body.number ?? 0),
  );
  if (!result.ok) return error(result.error ?? "Invalid clue.");

  await store.save(room);
  return json({ room: toClientRoom(room, player.id) });
}

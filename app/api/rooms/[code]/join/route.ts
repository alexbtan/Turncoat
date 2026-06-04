import { newPlayerId, toClientRoom } from "@/lib/game";
import { error, json, loadRoom, readBody } from "@/lib/http";
import { store } from "@/lib/store";
import type { Player } from "@/lib/types";

export const dynamic = "force-dynamic";

// Join an existing room. Body: { name, playerId? }.
// If a known playerId is supplied (rejoin), we keep their seat.
export async function POST(
  req: Request,
  { params }: { params: Promise<{ code: string }> },
) {
  const { code } = await params;
  const room = await loadRoom(code);
  if (!room) return error("Room not found.", 404);

  const body = await readBody<{ name?: string; playerId?: string }>(req);
  const name = (body.name ?? "").trim() || "Player";

  if (body.playerId) {
    const existing = room.players.find((p) => p.id === body.playerId);
    if (existing) {
      existing.name = name;
      await store.save(room);
      return json({
        code: room.code,
        playerId: existing.id,
        room: toClientRoom(room, existing.id),
      });
    }
  }

  const player: Player = {
    id: newPlayerId(),
    name,
    team: null,
    role: null,
  };
  room.players.push(player);
  await store.save(room);

  return json({
    code: room.code,
    playerId: player.id,
    room: toClientRoom(room, player.id),
  });
}

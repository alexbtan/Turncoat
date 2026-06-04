import { createRoom, newPlayerId, toClientRoom } from "@/lib/game";
import { json, readBody } from "@/lib/http";
import { store } from "@/lib/store";
import type { Player } from "@/lib/types";

export const dynamic = "force-dynamic";

// Create a new room. Body: { name }. The creator becomes the host and is
// added as the first player.
export async function POST(req: Request) {
  const body = await readBody<{ name?: string }>(req);
  const name = (body.name ?? "").trim() || "Player";

  const hostId = newPlayerId();
  const room = createRoom(hostId);

  const host: Player = { id: hostId, name, team: null, role: null };
  room.players.push(host);

  await store.save(room);

  return json({
    code: room.code,
    playerId: hostId,
    room: toClientRoom(room, hostId),
  });
}

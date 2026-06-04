import { randomizeTeams, toClientRoom } from "@/lib/game";
import { error, json, loadRoom, readBody } from "@/lib/http";
import { store } from "@/lib/store";

export const dynamic = "force-dynamic";

// Host shuffles everyone onto red/blue with one spymaster per team.
export async function POST(
  req: Request,
  { params }: { params: Promise<{ code: string }> },
) {
  const { code } = await params;
  const room = await loadRoom(code);
  if (!room) return error("Room not found.", 404);

  const body = await readBody<{ playerId?: string }>(req);
  if (body.playerId !== room.hostId) {
    return error("Only the host can randomize teams.", 403);
  }

  const result = randomizeTeams(room);
  if (!result.ok) return error(result.error ?? "Could not randomize teams.");

  await store.save(room);
  return json({ room: toClientRoom(room, body.playerId) });
}

import { toClientRoom } from "@/lib/game";
import { randomizeCoopRoles } from "@/lib/gameCoop";
import { error, json, loadRoom, readBody } from "@/lib/http";
import { store } from "@/lib/store";

export const dynamic = "force-dynamic";

// Host randomly assigns 1 spymaster + 3 guessers. Body: { playerId }.
export async function POST(
  req: Request,
  { params }: { params: Promise<{ code: string }> },
) {
  const { code } = await params;
  const room = await loadRoom(code);
  if (!room) return error("Room not found.", 404);

  const body = await readBody<{ playerId?: string }>(req);
  if (body.playerId !== room.hostId) {
    return error("Only the host can randomize roles.", 403);
  }

  const result = randomizeCoopRoles(room);
  if (!result.ok) return error(result.error ?? "Could not randomize roles.");

  await store.save(room);
  return json({ room: toClientRoom(room, body.playerId) });
}

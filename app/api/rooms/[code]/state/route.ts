import { toClientRoom } from "@/lib/game";
import { error, json, loadRoom } from "@/lib/http";

export const dynamic = "force-dynamic";

// Poll endpoint. Returns a role-filtered view of the room.
export async function GET(
  req: Request,
  { params }: { params: Promise<{ code: string }> },
) {
  const { code } = await params;
  const room = await loadRoom(code);
  if (!room) return error("Room not found.", 404);

  const playerId = new URL(req.url).searchParams.get("playerId");
  return json({ room: toClientRoom(room, playerId) });
}

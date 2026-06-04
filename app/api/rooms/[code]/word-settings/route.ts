import { setWordSettings, toClientRoom } from "@/lib/game";
import { error, json, loadRoom, readBody } from "@/lib/http";
import { store } from "@/lib/store";

export const dynamic = "force-dynamic";

// Host updates custom words and mix percentage. Body: { playerId, customWordsText, customWordPercent }.
export async function POST(
  req: Request,
  { params }: { params: Promise<{ code: string }> },
) {
  const { code } = await params;
  const room = await loadRoom(code);
  if (!room) return error("Room not found.", 404);

  const body = await readBody<{
    playerId?: string;
    customWordsText?: string;
    customWordPercent?: number;
  }>(req);

  if (body.playerId !== room.hostId) {
    return error("Only the host can change word settings.", 403);
  }

  const result = setWordSettings(
    room,
    body.customWordsText ?? "",
    Number(body.customWordPercent ?? 0),
  );
  if (!result.ok) return error(result.error ?? "Could not save word settings.");

  await store.save(room);
  return json({ room: toClientRoom(room, body.playerId) });
}

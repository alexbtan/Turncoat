import { NextResponse } from "next/server";
import { normalizeRoom } from "./game";
import { store } from "./store";
import type { Room } from "./types";

export function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status });
}

export function error(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

/** Load a room by (case-insensitive) code, or return null. */
export async function loadRoom(code: string): Promise<Room | null> {
  const room = await store.get(code.toUpperCase());
  if (room) normalizeRoom(room);
  return room;
}

export async function readBody<T = Record<string, unknown>>(
  req: Request,
): Promise<T> {
  try {
    return (await req.json()) as T;
  } catch {
    return {} as T;
  }
}

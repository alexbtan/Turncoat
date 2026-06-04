import type { Room } from "./types";

const globalForStore = globalThis as unknown as {
  __turncoatRooms?: Map<string, Room>;
};

const rooms: Map<string, Room> =
  globalForStore.__turncoatRooms ?? new Map<string, Room>();

if (!globalForStore.__turncoatRooms) {
  globalForStore.__turncoatRooms = rooms;
}

const ROOM_TTL_MS = 1000 * 60 * 60 * 6;

function cleanup() {
  const now = Date.now();
  for (const [code, room] of rooms) {
    if (now - room.updatedAt > ROOM_TTL_MS) {
      rooms.delete(code);
    }
  }
}

export const memoryStore = {
  async get(code: string): Promise<Room | null> {
    return rooms.get(code) ?? null;
  },

  async save(room: Room): Promise<void> {
    room.updatedAt = Date.now();
    rooms.set(room.code, room);
    cleanup();
  },

  async exists(code: string): Promise<boolean> {
    return rooms.has(code);
  },

  async delete(code: string): Promise<void> {
    rooms.delete(code);
  },
};

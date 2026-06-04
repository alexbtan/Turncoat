import type { Room } from "./types";

/**
 * In-memory room store.
 *
 * The store is intentionally tiny and async so it can be swapped for a
 * persistent backend (e.g. Netlify Blobs / Redis) without touching the
 * game logic or API routes. We hang the Map off `globalThis` so it
 * survives Next.js dev hot-reloads (which re-evaluate modules).
 */
const globalForStore = globalThis as unknown as {
  __turncoatRooms?: Map<string, Room>;
};

const rooms: Map<string, Room> =
  globalForStore.__turncoatRooms ?? new Map<string, Room>();

if (!globalForStore.__turncoatRooms) {
  globalForStore.__turncoatRooms = rooms;
}

// Rooms older than this (no updates) are eligible for cleanup.
const ROOM_TTL_MS = 1000 * 60 * 60 * 6; // 6 hours

function cleanup() {
  const now = Date.now();
  for (const [code, room] of rooms) {
    if (now - room.updatedAt > ROOM_TTL_MS) {
      rooms.delete(code);
    }
  }
}

export const store = {
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

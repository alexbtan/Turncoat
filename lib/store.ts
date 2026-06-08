import { memoryStore } from "./store-memory";
import type { Room } from "./types";

/**
 * Room persistence. Uses Netlify Blobs on Netlify (shared across serverless
 * invocations). Falls back to in-memory Map for local `next dev`.
 *
 * Netlify store is loaded dynamically so `@netlify/blobs` is not bundled into
 * local dev API routes (avoids missing vendor-chunk errors).
 */
function isNetlifyRuntime(): boolean {
  return (
    process.env.NETLIFY === "true" ||
    process.env.NETLIFY_DEV === "true" ||
    !!process.env.NETLIFY_BLOBS_CONTEXT
  );
}

type RoomStore = typeof memoryStore;

let cached: RoomStore | null = null;

async function resolveStore(): Promise<RoomStore> {
  if (cached) return cached;
  if (isNetlifyRuntime()) {
    const { netlifyStore } = await import("./store-netlify");
    cached = netlifyStore;
  } else {
    cached = memoryStore;
  }
  return cached;
}

export const store = {
  async get(code: string): Promise<Room | null> {
    return (await resolveStore()).get(code);
  },

  async save(room: Room): Promise<void> {
    return (await resolveStore()).save(room);
  },

  async exists(code: string): Promise<boolean> {
    return (await resolveStore()).exists(code);
  },

  async delete(code: string): Promise<void> {
    return (await resolveStore()).delete(code);
  },
};

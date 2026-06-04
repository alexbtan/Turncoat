import { getStore } from "@netlify/blobs";
import type { Room } from "./types";

const BLOB_STORE = "turncoat-rooms";
const ROOM_TTL_MS = 1000 * 60 * 60 * 6;

function blobStore() {
  const siteID = process.env.NETLIFY_SITE_ID ?? process.env.SITE_ID;
  const token =
    process.env.NETLIFY_BLOB_STORE_TOKEN ??
    process.env.NETLIFY_AUTH_TOKEN;

  if (siteID && token) {
    return getStore({ name: BLOB_STORE, siteID, token });
  }
  return getStore(BLOB_STORE);
}

async function cleanup() {
  const { blobs } = await blobStore().list();
  const now = Date.now();
  for (const entry of blobs) {
    const room = (await blobStore().get(entry.key, {
      type: "json",
    })) as Room | null;
    if (room && now - room.updatedAt > ROOM_TTL_MS) {
      await blobStore().delete(entry.key);
    }
  }
}

export const netlifyStore = {
  async get(code: string): Promise<Room | null> {
    const room = (await blobStore().get(code, { type: "json" })) as Room | null;
    return room ?? null;
  },

  async save(room: Room): Promise<void> {
    room.updatedAt = Date.now();
    await blobStore().setJSON(room.code, room);
    await cleanup();
  },

  async exists(code: string): Promise<boolean> {
    return (await blobStore().getMetadata(code)) !== null;
  },

  async delete(code: string): Promise<void> {
    await blobStore().delete(code);
  },
};

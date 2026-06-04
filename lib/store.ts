import { memoryStore } from "./store-memory";
import { netlifyStore } from "./store-netlify";

/**
 * Room persistence. Uses Netlify Blobs on Netlify (shared across serverless
 * invocations). Falls back to in-memory Map for local `next dev`.
 */
function isNetlifyRuntime(): boolean {
  return (
    process.env.NETLIFY === "true" ||
    process.env.NETLIFY_DEV === "true" ||
    !!process.env.NETLIFY_BLOBS_CONTEXT
  );
}

export const store = isNetlifyRuntime() ? netlifyStore : memoryStore;

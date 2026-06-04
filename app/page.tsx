"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  createRoom,
  getStoredName,
  setStoredName,
  setStoredPlayerId,
} from "@/lib/client";

export default function HomePage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    setName(getStoredName());
  }, []);

  const trimmedName = name.trim();

  async function handleCreate() {
    if (!trimmedName) {
      setErr("Enter a name first.");
      return;
    }
    setBusy(true);
    setErr(null);
    try {
      setStoredName(trimmedName);
      const res = await createRoom(trimmedName);
      setStoredPlayerId(res.code, res.playerId);
      router.push(`/room/${res.code}`);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not create room.");
      setBusy(false);
    }
  }

  function handleJoin() {
    const c = code.trim().toUpperCase();
    if (!trimmedName) {
      setErr("Enter a name first.");
      return;
    }
    if (c.length < 4) {
      setErr("Enter a valid 4-letter room code.");
      return;
    }
    setStoredName(trimmedName);
    router.push(`/room/${c}`);
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-12">
      <div className="mb-10 text-center">
        <h1 className="bg-gradient-to-r from-red-400 via-slate-100 to-blue-400 bg-clip-text text-5xl font-black tracking-tight text-transparent">
          CODENAMES
        </h1>
        <p className="mt-3 text-slate-400">
          Free multiplayer word game. Create a room and share the code.
        </p>
      </div>

      <div className="space-y-5 rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-xl backdrop-blur">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-300">
            Your name
          </label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Alex"
            maxLength={20}
            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 outline-none ring-blue-500/40 focus:ring-2"
          />
        </div>

        <button
          onClick={handleCreate}
          disabled={busy}
          className="w-full rounded-lg bg-gradient-to-r from-red-500 to-blue-500 px-4 py-3 font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
        >
          {busy ? "Creating..." : "Create a room"}
        </button>

        <div className="flex items-center gap-3 text-xs uppercase tracking-widest text-slate-600">
          <span className="h-px flex-1 bg-slate-800" />
          or join
          <span className="h-px flex-1 bg-slate-800" />
        </div>

        <div className="flex gap-2">
          <input
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="CODE"
            maxLength={6}
            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-center font-mono text-lg tracking-[0.3em] text-slate-100 outline-none ring-blue-500/40 focus:ring-2"
            onKeyDown={(e) => {
              if (e.key === "Enter") handleJoin();
            }}
          />
          <button
            onClick={handleJoin}
            className="shrink-0 rounded-lg border border-slate-700 bg-slate-800 px-5 py-3 font-semibold text-slate-100 transition hover:bg-slate-700"
          >
            Join
          </button>
        </div>

        {err && <p className="text-sm text-red-400">{err}</p>}
      </div>

      <p className="mt-6 text-center text-xs text-slate-600">
        Two teams race to contact their agents. Avoid the assassin.
      </p>
    </main>
  );
}

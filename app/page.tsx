"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import backgroundImage from "@/app/assets/background.jpg";
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
    <div className="relative min-h-screen">
      <Image
        src={backgroundImage}
        alt=""
        fill
        priority
        className="object-cover object-center"
        sizes="100vw"
      />
      <div
        className="absolute inset-0 bg-[#0a0e14]/60"
        aria-hidden
      />

      <main className="tc-page relative z-10 flex max-w-md flex-col justify-center py-16">
        <header className="mb-10 text-center">
          <h1 className="tc-display text-4xl font-bold tracking-tight text-[#e8e4dc] sm:text-5xl">
            Turncoat
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-[#b8b2a6]">
            Word game for four or more. Classic teams or Turncoat mode with a
            hidden traitor.
          </p>
        </header>

        <div className="tc-home-panel space-y-5">
        <div>
          <label htmlFor="name" className="tc-label">
            Your name
          </label>
          <input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Alex"
            maxLength={20}
            className="tc-input"
          />
        </div>

        <button
          type="button"
          onClick={handleCreate}
          disabled={busy}
          className="tc-btn-primary w-full"
        >
          {busy ? "Creating…" : "Create a room"}
        </button>

        <div className="tc-divider">or join</div>

        <div className="flex gap-2">
          <input
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="CODE"
            maxLength={6}
            className="tc-input-mono flex-1"
            onKeyDown={(e) => {
              if (e.key === "Enter") handleJoin();
            }}
          />
          <button type="button" onClick={handleJoin} className="tc-btn-secondary shrink-0">
            Join
          </button>
        </div>

        {err && <p className="tc-error">{err}</p>}
      </div>

        <p className="mt-8 text-center text-xs leading-relaxed text-[#9a9488]">
          Share the room code with everyone playing on their own device.
        </p>
      </main>
    </div>
  );
}

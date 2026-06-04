"use client";

import type { ClientRoom, GameMode } from "@/lib/types";

interface Props {
  room: ClientRoom;
  isHost: boolean;
  onSetMode: (mode: GameMode) => void;
  busy: boolean;
}

const MODES: { id: GameMode; label: string; blurb: string }[] = [
  {
    id: "classic",
    label: "Classic",
    blurb: "Red vs Blue. Two teams race to contact their agents.",
  },
  {
    id: "coop",
    label: "Co-op: Mole",
    blurb: "1 spymaster + 3 guessers vs the clock. One of you is a secret mole.",
  },
];

export function ModeSelector({ room, isHost, onSetMode, busy }: Props) {
  const active = room.gameMode;
  const current = MODES.find((m) => m.id === active) ?? MODES[0];

  if (!isHost) {
    return (
      <div className="mb-6 rounded-xl border border-slate-800 bg-slate-900/50 p-3 text-center text-sm text-slate-400">
        Mode: <span className="font-semibold text-slate-200">{current.label}</span>
      </div>
    );
  }

  return (
    <div className="mb-6 rounded-xl border border-slate-800 bg-slate-900/60 p-4">
      <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-300">
        Game mode
      </h3>
      <div className="grid grid-cols-2 gap-2">
        {MODES.map((m) => {
          const selected = m.id === active;
          return (
            <button
              key={m.id}
              onClick={() => !selected && onSetMode(m.id)}
              disabled={busy || selected}
              className={`rounded-lg border p-3 text-left transition ${
                selected
                  ? "border-violet-500/60 bg-violet-500/15 text-slate-100"
                  : "border-slate-700 bg-slate-950 text-slate-300 hover:border-slate-500 disabled:opacity-50"
              }`}
            >
              <div className="text-sm font-semibold">{m.label}</div>
              <div className="mt-1 text-xs text-slate-500">{m.blurb}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

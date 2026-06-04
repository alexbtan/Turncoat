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
    blurb: "Red vs blue. Two teams race to contact their agents.",
  },
  {
    id: "coop",
    label: "Turncoat mode",
    blurb: "One spymaster, three guessers, one hidden traitor.",
  },
];

export function ModeSelector({ room, isHost, onSetMode, busy }: Props) {
  const active = room.gameMode;
  const current = MODES.find((m) => m.id === active) ?? MODES[0];

  if (!isHost) {
    return (
      <div className="tc-panel-inset mb-6 text-center text-sm">
        <span className="tc-muted">Mode: </span>
        <span className="font-medium">{current.label}</span>
      </div>
    );
  }

  return (
    <div className="tc-panel mb-6">
      <h3 className="tc-section-title mb-3">Game mode</h3>
      <div className="grid grid-cols-2 gap-2">
        {MODES.map((m) => {
          const selected = m.id === active;
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => !selected && onSetMode(m.id)}
              disabled={busy || selected}
              className={`rounded border p-3 text-left transition disabled:opacity-50 ${
                selected
                  ? "tc-mode-selected"
                  : "border-[var(--tc-border)] bg-[var(--tc-surface-raised)] hover:border-[var(--tc-border-strong)]"
              }`}
            >
              <div className="text-sm font-semibold">{m.label}</div>
              <div className="tc-muted mt-1 text-xs leading-snug">{m.blurb}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

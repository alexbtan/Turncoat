"use client";

import { isBotPlayer } from "@/lib/game";
import type { ClientRoom, Player } from "@/lib/types";

interface Props {
  room: ClientRoom;
  hostPlayerId: string;
  activePlayerId: string;
  onActivePlayerChange: (id: string) => void;
}

function playerLabel(p: Player, hostPlayerId: string): string {
  const bot = isBotPlayer(p);
  const you = p.id === hostPlayerId ? " (you)" : "";
  let seat = " — unassigned";
  if (p.role) {
    seat = p.team ? ` — ${p.team} ${p.role}` : ` — ${p.role}`;
  }
  return `${p.name}${bot ? " [bot]" : ""}${you}${seat}`;
}

export function SoloTestBar({
  room,
  hostPlayerId,
  activePlayerId,
  onActivePlayerChange,
}: Props) {
  const hasBots = room.players.some(isBotPlayer);
  if (!hasBots) return null;

  return (
    <div className="tc-panel-inset mb-4 border-dashed">
      <p className="text-xs font-semibold uppercase tracking-wider text-[var(--tc-muted)]">
        Solo test
      </p>
      <p className="tc-muted mt-1 text-xs leading-relaxed">
        Switch which player you control to run every seat from one browser.
      </p>
      <label htmlFor="solo-player" className="tc-label mt-3">
        Playing as
      </label>
      <select
        id="solo-player"
        value={activePlayerId}
        onChange={(e) => onActivePlayerChange(e.target.value)}
        className="tc-input"
      >
        {room.players.map((p) => (
          <option key={p.id} value={p.id}>
            {playerLabel(p, hostPlayerId)}
          </option>
        ))}
      </select>
    </div>
  );
}

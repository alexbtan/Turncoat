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
  return `${p.name}${bot ? " 🤖" : ""}${you}${seat}`;
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
    <div className="mb-4 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-amber-200/90">
        Solo test mode
      </p>
      <p className="mb-2 text-xs text-amber-100/70">
        Switch which player you control to play every role from one browser.
      </p>
      <label className="block text-xs text-slate-400">Playing as</label>
      <select
        value={activePlayerId}
        onChange={(e) => onActivePlayerChange(e.target.value)}
        className="mt-1 w-full rounded-lg border border-amber-500/40 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:ring-2 focus:ring-amber-500/50"
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

"use client";

import { previousClues } from "@/lib/clueHistory";
import type { ClientRoom, Team } from "@/lib/types";

interface Props {
  room: ClientRoom;
}

function teamLabel(team: Team): string {
  return team === "red" ? "Red" : "Blue";
}

function teamClass(team: Team): string {
  return team === "red"
    ? "border-[var(--tc-red-border)] bg-[var(--tc-red-bg)] text-[var(--tc-red)]"
    : "border-[var(--tc-blue-border)] bg-[var(--tc-blue-bg)] text-[var(--tc-blue)]";
}

export function PreviousClues({ room }: Props) {
  const clues = previousClues(room.log, room.gameMode, room.clue);
  if (clues.length === 0) return null;

  return (
    <div className="tc-panel">
      <h4 className="tc-section-title mb-3">Previous clues</h4>
      <ol className="space-y-2">
        {clues.map((clue, index) => (
          <li
            key={`${clue.ts}-${clue.word}-${clue.number}`}
            className="flex items-center gap-3 rounded border border-[var(--tc-border)] bg-[var(--tc-surface)] px-3 py-2"
          >
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[var(--tc-border-strong)] bg-[var(--tc-surface-raised)] text-xs font-bold tabular-nums text-[var(--tc-muted)]">
              {index + 1}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-base font-bold leading-tight">
                &ldquo;{clue.word}&rdquo;
                <span className="mx-1.5 text-[var(--tc-muted)]">&middot;</span>
                <span className="tabular-nums">{clue.number}</span>
              </p>
              {clue.team && (
                <p className="mt-0.5 text-xs font-medium uppercase tracking-wide text-[var(--tc-muted)]">
                  {teamLabel(clue.team)} team
                </p>
              )}
            </div>
            {clue.team && (
              <span
                className={`shrink-0 rounded border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${teamClass(clue.team)}`}
              >
                {teamLabel(clue.team)}
              </span>
            )}
          </li>
        ))}
      </ol>
    </div>
  );
}

"use client";

import type { ClientRoom, Team } from "@/lib/types";
import { isClueLogMessage } from "@/lib/clueHistory";
import { ClueForm } from "./ClueForm";
import { PreviousClues } from "./PreviousClues";

interface Props {
  room: ClientRoom;
  busy: boolean;
  onClue: (word: string, number: number) => void;
  onEndTurn: () => void;
  onReset: () => void;
  playerId: string;
}

function cap(team: Team): string {
  return team.charAt(0).toUpperCase() + team.slice(1);
}

export function GamePanel({
  room,
  busy,
  onClue,
  onEndTurn,
  onReset,
  playerId,
}: Props) {
  const you = room.you;
  const isYourTurn = you?.team === room.turn && room.phase === "playing";
  const isActiveSpymaster =
    isYourTurn && you?.role === "spymaster" && !room.clue;
  const isActiveOperative =
    isYourTurn && you?.role === "operative" && !!room.clue;
  const isHost = room.hostId === playerId;

  return (
    <div className="space-y-4">
      <div className="flex gap-3">
        <ScoreBox team="red" count={room.remaining.red} active={room.turn === "red"} />
        <ScoreBox team="blue" count={room.remaining.blue} active={room.turn === "blue"} />
      </div>

      {room.phase === "playing" && (
        <div
          className={`tc-panel text-center ${
            room.turn === "red"
              ? "border-l-4 border-l-[var(--tc-red)] bg-[var(--tc-red-bg)]"
              : "border-l-4 border-l-[var(--tc-blue)] bg-[var(--tc-blue-bg)]"
          }`}
        >
          <p className="tc-section-title">{cap(room.turn)} team&apos;s turn</p>
          {room.clue ? (
            <>
              <p className="mt-2 text-xs font-bold uppercase tracking-[0.2em]">
                Current clue
              </p>
              <p className="mt-2 text-2xl font-bold leading-none">
                &ldquo;{room.clue.word}&rdquo;
              </p>
              <p className="mt-2 text-lg font-semibold tabular-nums">
                {room.clue.number}
                <span className="tc-muted ml-2 text-sm font-normal">
                  ({room.clue.guessesRemaining} guess
                  {room.clue.guessesRemaining === 1 ? "" : "es"} left)
                </span>
              </p>
            </>
          ) : (
            <p className="tc-muted mt-2 text-sm italic">
              Waiting for spymaster&apos;s clue…
            </p>
          )}
        </div>
      )}

      <PreviousClues room={room} />

      {room.phase === "finished" && room.winner && (
        <div
          className={`tc-panel text-center ${
            room.winner === "red"
              ? "border-l-4 border-l-[var(--tc-red)] bg-[var(--tc-red-bg)]"
              : "border-l-4 border-l-[var(--tc-blue)] bg-[var(--tc-blue-bg)]"
          }`}
        >
          <p className="tc-display text-2xl font-bold">
            {cap(room.winner)} team wins!
          </p>
          {isHost ? (
            <button
              type="button"
              onClick={onReset}
              disabled={busy}
              className="tc-btn-primary mt-3"
            >
              {busy ? "…" : "Rematch"}
            </button>
          ) : (
            <p className="tc-muted mt-2 text-sm">
              Waiting for host to start a rematch…
            </p>
          )}
        </div>
      )}

      {isActiveSpymaster && <ClueForm onSubmit={onClue} busy={busy} />}

      {isActiveOperative && (
        <button
          type="button"
          onClick={onEndTurn}
          disabled={busy}
          className="tc-btn-secondary w-full"
        >
          End turn (stop guessing)
        </button>
      )}

      {you && (
        <p className="tc-muted text-center text-xs">
          You are{" "}
          <span
            className={
              you.team === "red"
                ? "font-medium text-[var(--tc-red)]"
                : "font-medium text-[var(--tc-blue)]"
            }
          >
            {you.team} {you.role}
          </span>
        </p>
      )}

      <GameLog room={room} />
    </div>
  );
}

function ScoreBox({
  team,
  count,
  active,
}: {
  team: Team;
  count: number;
  active: boolean;
}) {
  const isRed = team === "red";
  const color = isRed ? "text-[var(--tc-red)]" : "text-[var(--tc-blue)]";
  const activeClass = active
    ? isRed
      ? "ring-2 ring-[var(--tc-red)]"
      : "ring-2 ring-[var(--tc-blue)]"
    : "";

  return (
    <div className={`tc-panel flex-1 text-center ${activeClass}`}>
      <div className={`text-3xl font-bold tabular-nums ${color}`}>{count}</div>
      <div className="tc-section-title mt-0.5">{cap(team)} left</div>
    </div>
  );
}

function GameLog({ room }: { room: ClientRoom }) {
  const entries = [...room.log]
    .reverse()
    .filter((e) => !isClueLogMessage(e.message, room.gameMode))
    .slice(0, 12);
  if (entries.length === 0) return null;
  return (
    <div className="tc-panel-inset">
      <h4 className="tc-section-title mb-2">Game log</h4>
      <ul className="tc-log">
        {entries.map((e) => (
          <li key={e.id}>{e.message}</li>
        ))}
      </ul>
    </div>
  );
}

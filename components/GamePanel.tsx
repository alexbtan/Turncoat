"use client";

import type { ClientRoom, Team } from "@/lib/types";
import { ClueForm } from "./ClueForm";

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
      {/* Score */}
      <div className="flex gap-3">
        <ScoreBox team="red" count={room.remaining.red} active={room.turn === "red"} />
        <ScoreBox team="blue" count={room.remaining.blue} active={room.turn === "blue"} />
      </div>

      {/* Turn / status banner */}
      {room.phase === "playing" && (
        <div
          className={`rounded-xl border p-4 text-center ${
            room.turn === "red"
              ? "border-red-500/40 bg-red-500/10"
              : "border-blue-500/40 bg-blue-500/10"
          }`}
        >
          <p className="text-sm uppercase tracking-wide text-slate-400">
            {cap(room.turn)} team&apos;s turn
          </p>
          {room.clue ? (
            <p className="mt-1 text-lg font-bold text-slate-100">
              &ldquo;{room.clue.word}&rdquo; &middot; {room.clue.number}
              <span className="ml-2 text-sm font-normal text-slate-400">
                ({room.clue.guessesRemaining} guess
                {room.clue.guessesRemaining === 1 ? "" : "es"} left)
              </span>
            </p>
          ) : (
            <p className="mt-1 text-sm italic text-slate-400">
              Waiting for spymaster&apos;s clue...
            </p>
          )}
        </div>
      )}

      {/* Winner banner */}
      {room.phase === "finished" && room.winner && (
        <div
          className={`rounded-xl border p-5 text-center ${
            room.winner === "red"
              ? "border-red-500 bg-red-500/20"
              : "border-blue-500 bg-blue-500/20"
          }`}
        >
          <p className="text-2xl font-black text-slate-100">
            {cap(room.winner)} team wins!
          </p>
          {isHost ? (
            <button
              onClick={onReset}
              disabled={busy}
              className="mt-3 rounded-lg bg-slate-100 px-6 py-2 font-semibold text-slate-900 transition hover:bg-white disabled:opacity-50"
            >
              {busy ? "..." : "Rematch"}
            </button>
          ) : (
            <p className="mt-2 text-sm text-slate-300">
              Waiting for host to start a rematch...
            </p>
          )}
        </div>
      )}

      {/* Spymaster clue form */}
      {isActiveSpymaster && <ClueForm onSubmit={onClue} busy={busy} />}

      {/* Operative actions */}
      {isActiveOperative && (
        <button
          onClick={onEndTurn}
          disabled={busy}
          className="w-full rounded-lg border border-slate-600 bg-slate-800 px-4 py-2 font-semibold text-slate-100 transition hover:bg-slate-700 disabled:opacity-50"
        >
          End turn (stop guessing)
        </button>
      )}

      {/* Your role reminder */}
      {you && (
        <p className="text-center text-xs text-slate-500">
          You are{" "}
          <span
            className={you.team === "red" ? "text-red-400" : "text-blue-400"}
          >
            {you.team} {you.role}
          </span>
        </p>
      )}

      {/* Log */}
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
  const color = team === "red" ? "text-red-400" : "text-blue-400";
  const ring =
    active && team === "red"
      ? "ring-2 ring-red-500"
      : active && team === "blue"
        ? "ring-2 ring-blue-500"
        : "";
  return (
    <div
      className={`flex-1 rounded-xl border border-slate-800 bg-slate-900/60 p-3 text-center ${ring}`}
    >
      <div className={`text-3xl font-black ${color}`}>{count}</div>
      <div className="text-xs uppercase tracking-wide text-slate-500">
        {cap(team)} left
      </div>
    </div>
  );
}

function GameLog({ room }: { room: ClientRoom }) {
  const entries = [...room.log].reverse().slice(0, 12);
  if (entries.length === 0) return null;
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-3">
      <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
        Game log
      </h4>
      <ul className="space-y-1 text-xs text-slate-400">
        {entries.map((e) => (
          <li key={e.id}>{e.message}</li>
        ))}
      </ul>
    </div>
  );
}

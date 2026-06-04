"use client";

import type { ClientRoom } from "@/lib/types";
import { ClueForm } from "./ClueForm";

interface Props {
  room: ClientRoom;
  busy: boolean;
  playerId: string;
  onClue: (word: string, number: number) => void;
  onPass: () => void;
  onAccuse: () => void;
  onReset: () => void;
}

export function GamePanelCoop({
  room,
  busy,
  playerId,
  onClue,
  onPass,
  onAccuse,
  onReset,
}: Props) {
  const you = room.you;
  const isHost = room.hostId === playerId;
  const isSpymaster = you?.role === "spymaster";
  const isGuesser = you?.role === "guesser";
  const playing = room.phase === "playing";
  const finished = room.phase === "finished";

  const roundsLeft = room.roundsRemaining ?? 0;
  const agentsLeft = room.agentsRemaining ?? 0;
  const passVotes = room.passVotes ?? [];
  const accusations = room.accusations ?? [];
  const youPassed = !!you && passVotes.includes(you.id);
  const youAccused = !!you && accusations.includes(you.id);

  const nameOf = (id: string) =>
    room.players.find((p) => p.id === id)?.name ?? "?";

  return (
    <div className="space-y-4">
      {/* Mission status */}
      <div className="flex gap-3">
        <StatBox label="Agents left" value={agentsLeft} tone="emerald" />
        <StatBox label="Rounds left" value={roundsLeft} tone="violet" />
      </div>

      {/* Turn / clue banner */}
      {playing && (
        <div className="rounded-xl border border-slate-700 bg-slate-900/70 p-4 text-center">
          {room.clue ? (
            <>
              <p className="text-sm uppercase tracking-wide text-slate-400">
                Clue in play
              </p>
              <p className="mt-1 text-lg font-bold text-slate-100">
                &ldquo;{room.clue.word}&rdquo; &middot; {room.clue.number}
                <span className="ml-2 text-sm font-normal text-slate-400">
                  ({room.clue.guessesRemaining} guess
                  {room.clue.guessesRemaining === 1 ? "" : "es"} left)
                </span>
              </p>
              <p className="mt-2 text-xs text-slate-500">
                A card is revealed when 2 of 3 guessers vote for it.
              </p>
            </>
          ) : (
            <p className="text-sm italic text-slate-400">
              Waiting for the spymaster&apos;s clue...
            </p>
          )}
        </div>
      )}

      {/* Mole briefing (only the mole sees this while playing) */}
      {playing && you?.isMole && (
        <div className="rounded-xl border border-red-500/50 bg-red-500/15 p-4">
          <p className="text-sm font-bold uppercase tracking-wide text-red-300">
            You are the MOLE
          </p>
          <p className="mt-1 text-xs text-red-100/80">
            You can see the full key. Make the team LOSE — get the assassin
            revealed or run out the round clock.
            {isSpymaster
              ? " As spymaster, give clues just bad enough to fail while looking helpful."
              : " As a guesser, swing votes onto bystanders/the assassin, or bait the others into wrongly accusing the spymaster."}
          </p>
        </div>
      )}

      {/* Finished banner */}
      {finished && room.coopOutcome && (
        <div
          className={`rounded-xl border p-5 text-center ${
            room.coopOutcome === "agents"
              ? "border-emerald-500 bg-emerald-500/20"
              : "border-red-500 bg-red-500/20"
          }`}
        >
          <p className="text-2xl font-black text-slate-100">
            {room.coopOutcome === "agents" ? "Mission success!" : "The mole wins!"}
          </p>
          {room.moleReveal && (
            <p className="mt-2 text-sm text-slate-200">
              The mole was{" "}
              <span className="font-bold">{nameOf(room.moleReveal.playerId)}</span>{" "}
              ({room.moleReveal.role}).
            </p>
          )}
          {isHost ? (
            <button
              onClick={onReset}
              disabled={busy}
              className="mt-3 rounded-lg bg-slate-100 px-6 py-2 font-semibold text-slate-900 transition hover:bg-white disabled:opacity-50"
            >
              {busy ? "..." : "Play again"}
            </button>
          ) : (
            <p className="mt-2 text-sm text-slate-300">
              Waiting for host to start a new mission...
            </p>
          )}
        </div>
      )}

      {/* Spymaster clue form */}
      {playing && isSpymaster && !room.clue && roundsLeft > 0 && (
        <ClueForm onSubmit={onClue} busy={busy} />
      )}

      {/* Guesser actions */}
      {playing && isGuesser && room.clue && (
        <button
          onClick={onPass}
          disabled={busy}
          className={`w-full rounded-lg border px-4 py-2 font-semibold transition disabled:opacity-50 ${
            youPassed
              ? "border-amber-500 bg-amber-500/20 text-amber-100"
              : "border-slate-600 bg-slate-800 text-slate-100 hover:bg-slate-700"
          }`}
        >
          {youPassed ? "Voted to end round" : "Vote to end round"} (
          {passVotes.length}/2)
        </button>
      )}

      {/* Accuse the spymaster (guessers only) */}
      {playing && isGuesser && (
        <button
          onClick={onAccuse}
          disabled={busy}
          className={`w-full rounded-lg border px-4 py-2 font-semibold transition disabled:opacity-50 ${
            youAccused
              ? "border-red-500 bg-red-500/25 text-red-100"
              : "border-red-500/40 bg-red-500/10 text-red-200 hover:bg-red-500/20"
          }`}
        >
          {youAccused
            ? "Accusing the spymaster"
            : "Accuse: spymaster is the mole"}{" "}
          ({accusations.length}/3)
        </button>
      )}

      {playing && accusations.length > 0 && (
        <p className="text-center text-xs text-amber-400/80">
          Accusing: {accusations.map(nameOf).join(", ")}
          {accusations.length < 3
            ? ` — all 3 guessers must agree to end the game.`
            : ""}
        </p>
      )}

      {/* Your role reminder */}
      {you && (
        <p className="text-center text-xs text-slate-500">
          You are{" "}
          <span
            className={
              isSpymaster ? "text-emerald-400" : "text-sky-400"
            }
          >
            the {you.role}
          </span>
          {you.isMole && (
            <span className="ml-1 font-bold text-red-400">(MOLE)</span>
          )}
        </p>
      )}

      <GameLog room={room} />
    </div>
  );
}

function StatBox({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "emerald" | "violet";
}) {
  const color = tone === "emerald" ? "text-emerald-400" : "text-violet-400";
  return (
    <div className="flex-1 rounded-xl border border-slate-800 bg-slate-900/60 p-3 text-center">
      <div className={`text-3xl font-black ${color}`}>{value}</div>
      <div className="text-xs uppercase tracking-wide text-slate-500">
        {label}
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
        Mission log
      </h4>
      <ul className="space-y-1 text-xs text-slate-400">
        {entries.map((e) => (
          <li key={e.id}>{e.message}</li>
        ))}
      </ul>
    </div>
  );
}

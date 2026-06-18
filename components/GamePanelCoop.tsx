"use client";

import type { ClientRoom } from "@/lib/types";
import { isClueLogMessage } from "@/lib/clueHistory";
import { ClueForm } from "./ClueForm";
import { PreviousClues } from "./PreviousClues";

interface Props {
  room: ClientRoom;
  busy: boolean;
  playerId: string;
  onClue: (word: string, number: number) => void;
  onPass: () => void;
  onAccuse: () => void;
  onAccuseGuesser: (targetId: string) => void;
  onReset: () => void;
}

export function GamePanelCoop({
  room,
  busy,
  playerId,
  onClue,
  onPass,
  onAccuse,
  onAccuseGuesser,
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
  const guesserAccusations = room.guesserAccusations ?? {};
  const youPassed = !!you && passVotes.includes(you.id);
  const youAccused = !!you && accusations.includes(you.id);

  const otherGuessers =
    you?.role === "guesser"
      ? room.players.filter((p) => p.role === "guesser" && p.id !== you.id)
      : [];
  const votesNeededForGuesserAccusation = otherGuessers.length;

  const nameOf = (id: string) =>
    room.players.find((p) => p.id === id)?.name ?? "?";

  return (
    <div className="space-y-4">
      <div className="flex gap-3">
        <StatBox label="Agents left" value={agentsLeft} variant="green" />
        <StatBox label="Rounds left" value={roundsLeft} variant="blue" />
      </div>

      {playing && (
        <div
          className={`tc-panel text-center ${
            room.clue
              ? "border-l-4 border-l-[var(--tc-green)] bg-[var(--tc-green-bg)]"
              : ""
          }`}
        >
          {room.clue ? (
            <>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--tc-green)]">
                Current clue
              </p>
              <p className="mt-2 text-2xl font-bold leading-none">
                &ldquo;{room.clue.word}&rdquo;
              </p>
              <p className="mt-2 text-lg font-semibold tabular-nums">
                {room.clue.number}
                <span className="tc-muted ml-2 text-sm font-normal">
                  {room.clue.unlimited
                    ? "(unlimited guesses)"
                    : `(${room.clue.guessesRemaining} guess${
                        room.clue.guessesRemaining === 1 ? "" : "es"
                      } left)`}
                </span>
              </p>
              {room.clue.unlimited ? (
                <p className="tc-muted mt-3 text-xs leading-relaxed">
                  Final clue — keep guessing.{" "}
                  {room.shieldUsed
                    ? "Shield spent: the next white card ends the game."
                    : "One white card is shielded; a second white card ends the game."}
                </p>
              ) : (
                <p className="tc-muted mt-3 text-xs leading-relaxed">
                  A card is revealed when 2 of 3 guessers vote for it.
                </p>
              )}
            </>
          ) : (
            <p className="tc-muted text-sm italic">
              Waiting for the spymaster&apos;s clue…
            </p>
          )}
        </div>
      )}

      <PreviousClues room={room} />

      {playing && you?.isMole && (
        <div className="tc-panel border-l-4 border-l-[var(--tc-red)] bg-[var(--tc-danger-bg)]">
          <p className="text-sm font-bold uppercase tracking-wide text-[var(--tc-danger)]">
            You are the turncoat
          </p>
          <p className="tc-muted mt-1 text-xs leading-relaxed">
            You can see the full key.{" "}
            {isSpymaster
              ? "There is no assassin this game. Make the team lose by giving clues just bad enough to waste rounds and run out the clock — while looking helpful."
              : "Make the team lose — swing votes onto bystanders or the assassin, or bait the others into wrongly accusing the spymaster."}
          </p>
        </div>
      )}

      {finished && room.coopOutcome && (
        <div
          className={`tc-panel text-center ${
            room.coopOutcome === "agents"
              ? "border-l-4 border-l-[var(--tc-green)] bg-[var(--tc-green-bg)]"
              : "border-l-4 border-l-[var(--tc-red)] bg-[var(--tc-red-bg)]"
          }`}
        >
          <p className="tc-display text-2xl font-bold">
            {room.coopOutcome === "agents"
              ? "Mission success!"
              : "The turncoat wins!"}
          </p>
          {room.moleReveal && (
            <p className="mt-2 text-sm">
              The turncoat was{" "}
              <span className="font-bold">{nameOf(room.moleReveal.playerId)}</span>{" "}
              ({room.moleReveal.role}).
            </p>
          )}
          {isHost ? (
            <button
              type="button"
              onClick={onReset}
              disabled={busy}
              className="tc-btn-primary mt-3"
            >
              {busy ? "…" : "Play again"}
            </button>
          ) : (
            <p className="tc-muted mt-2 text-sm">
              Waiting for host to start a new mission…
            </p>
          )}
        </div>
      )}

      {playing && isSpymaster && !room.clue && roundsLeft > 0 && (
        <ClueForm onSubmit={onClue} busy={busy} />
      )}

      {playing && isGuesser && room.clue && (
        <button
          type="button"
          onClick={onPass}
          disabled={busy}
          className={
            youPassed
              ? "tc-btn-secondary w-full font-semibold ring-2 ring-[var(--tc-warn-border)]"
              : "tc-btn-secondary w-full"
          }
        >
          {youPassed ? "Voted to end round" : "Vote to end round"} (
          {passVotes.length}/2)
        </button>
      )}

      {playing && isGuesser && (
        <button
          type="button"
          onClick={onAccuse}
          disabled={busy}
          className={
            youAccused ? "tc-btn-danger-active w-full" : "tc-btn-danger w-full"
          }
        >
          {youAccused
            ? "Accusing the spymaster"
            : "Accuse: spymaster is the turncoat"}{" "}
          ({accusations.length}/3)
        </button>
      )}

      {playing && isGuesser && otherGuessers.length > 0 && (
        <div className="space-y-2">
          <p className="tc-section-title text-center">
            Accuse a guesser as the turncoat
          </p>
          {otherGuessers.map((g) => {
            const voters = guesserAccusations[g.id] ?? [];
            const youVoted = !!you && voters.includes(you.id);
            return (
              <button
                key={g.id}
                type="button"
                onClick={() => onAccuseGuesser(g.id)}
                disabled={busy}
                className={
                  youVoted
                    ? "tc-btn-danger-active w-full text-sm"
                    : "tc-btn-danger w-full text-sm"
                }
              >
                {youVoted
                  ? `Voting ${g.name} is the turncoat`
                  : `Vote: ${g.name} is the turncoat`}{" "}
                ({voters.length}/{votesNeededForGuesserAccusation})
              </button>
            );
          })}
          <p className="tc-muted text-center text-xs">
            All other guessers must agree on the same suspect to end the game.
          </p>
        </div>
      )}

      {playing && accusations.length > 0 && (
        <p className="tc-muted text-center text-xs">
          Accusing: {accusations.map(nameOf).join(", ")}
          {accusations.length < 3
            ? " — all 3 guessers must agree to end the game."
            : ""}
        </p>
      )}

      {you && (
        <p className="tc-muted text-center text-xs">
          You are{" "}
          <span
            className={
              isSpymaster
                ? "font-medium text-[var(--tc-green)]"
                : "font-medium text-[var(--tc-blue)]"
            }
          >
            the {you.role}
          </span>
          {you.isMole && (
            <span className="ml-1 font-bold text-[var(--tc-danger)]">
              (turncoat)
            </span>
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
  variant,
}: {
  label: string;
  value: number;
  variant: "green" | "blue";
}) {
  const color =
    variant === "green"
      ? "text-[var(--tc-green)]"
      : "text-[var(--tc-blue)]";

  return (
    <div className="tc-panel flex-1 text-center">
      <div className={`text-3xl font-bold tabular-nums ${color}`}>{value}</div>
      <div className="tc-section-title mt-0.5">{label}</div>
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
      <h4 className="tc-section-title mb-2">Mission log</h4>
      <ul className="tc-log">
        {entries.map((e) => (
          <li key={e.id}>{e.message}</li>
        ))}
      </ul>
    </div>
  );
}

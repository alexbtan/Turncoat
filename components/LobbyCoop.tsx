"use client";

import { CustomWordsPanel } from "@/components/CustomWordsPanel";
import { isBotPlayer } from "@/lib/game";
import { MAX_COOP_ROUNDS, MIN_COOP_ROUNDS } from "@/lib/gameCoop";
import type { ClientRoom, Player, Role } from "@/lib/types";

interface Props {
  room: ClientRoom;
  hostPlayerId: string;
  onPickRole: (role: Role) => void;
  onRandomize: () => void;
  onSetMaxRounds: (rounds: number) => void;
  onSaveWordSettings: (text: string, percent: number) => void;
  onAddTestPlayers: () => void;
  onStart: () => void;
  busy: boolean;
}

function Seat({
  player,
  hostPlayerId,
}: {
  player: Player;
  hostPlayerId: string;
}) {
  return (
    <li className="text-sm text-slate-200">
      {player.name}
      {isBotPlayer(player) && (
        <span className="ml-1 text-xs text-amber-500/80">(bot)</span>
      )}
      {player.id === hostPlayerId && (
        <span className="ml-1 text-xs text-slate-500">(you)</span>
      )}
    </li>
  );
}

export function LobbyCoop({
  room,
  hostPlayerId,
  onPickRole,
  onRandomize,
  onSetMaxRounds,
  onSaveWordSettings,
  onAddTestPlayers,
  onStart,
  busy,
}: Props) {
  const isHost = room.hostId === hostPlayerId;
  const spymasters = room.players.filter((p) => p.role === "spymaster");
  const guessers = room.players.filter((p) => p.role === "guesser");
  const unassigned = room.players.filter((p) => !p.role);
  const canAddBots = room.players.length < 4;
  const maxRounds = room.maxRounds ?? 8;

  return (
    <div className="mx-auto max-w-3xl">
      <CustomWordsPanel
        room={room}
        isHost={isHost}
        onSave={onSaveWordSettings}
        busy={busy}
      />

      {/* Round settings */}
      <div className="mb-6 rounded-xl border border-slate-800 bg-slate-900/60 p-4">
        <div className="flex items-center justify-between text-sm">
          <span className="font-bold uppercase tracking-wide text-slate-300">
            Rounds to win
          </span>
          <span className="font-mono font-semibold text-violet-300">
            {maxRounds}
          </span>
        </div>
        {isHost ? (
          <input
            type="range"
            min={MIN_COOP_ROUNDS}
            max={MAX_COOP_ROUNDS}
            step={1}
            value={maxRounds}
            disabled={busy}
            onChange={(e) => onSetMaxRounds(Number(e.target.value))}
            className="mt-2 w-full accent-violet-500"
          />
        ) : (
          <p className="mt-1 text-xs text-slate-500">
            The team must find all 9 agents within {maxRounds} rounds.
          </p>
        )}
      </div>

      {/* Seats */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/5 p-4">
          <h3 className="mb-3 text-lg font-bold uppercase tracking-wide text-emerald-400">
            Spymaster
          </h3>
          {spymasters.length === 0 ? (
            <p className="text-sm italic text-slate-600">No spymaster yet</p>
          ) : (
            <ul className="space-y-1">
              {spymasters.map((p) => (
                <Seat key={p.id} player={p} hostPlayerId={hostPlayerId} />
              ))}
            </ul>
          )}
          <button
            onClick={() => onPickRole("spymaster")}
            className="mt-4 w-full rounded-lg border border-emerald-500/40 bg-emerald-500/20 px-3 py-2 text-sm font-medium text-emerald-100 transition hover:bg-emerald-500/30"
          >
            Be spymaster
          </button>
        </div>

        <div className="rounded-xl border border-sky-500/40 bg-sky-500/5 p-4">
          <h3 className="mb-3 text-lg font-bold uppercase tracking-wide text-sky-400">
            Guessers ({guessers.length}/3)
          </h3>
          {guessers.length === 0 ? (
            <p className="text-sm italic text-slate-600">No guessers yet</p>
          ) : (
            <ul className="space-y-1">
              {guessers.map((p) => (
                <Seat key={p.id} player={p} hostPlayerId={hostPlayerId} />
              ))}
            </ul>
          )}
          <button
            onClick={() => onPickRole("guesser")}
            className="mt-4 w-full rounded-lg border border-sky-500/40 bg-sky-500/20 px-3 py-2 text-sm font-medium text-sky-100 transition hover:bg-sky-500/30"
          >
            Be guesser
          </button>
        </div>
      </div>

      {unassigned.length > 0 && (
        <div className="mb-6 rounded-lg border border-slate-800 bg-slate-900/50 p-3 text-sm text-slate-400">
          No role yet: {unassigned.map((p) => p.name).join(", ")}
        </div>
      )}

      <div className="flex flex-col items-center gap-3">
        {isHost && (
          <div className="flex w-full max-w-md flex-col gap-2 sm:flex-row sm:justify-center">
            {canAddBots && (
              <button
                onClick={onAddTestPlayers}
                disabled={busy}
                className="rounded-lg border border-amber-500/40 bg-amber-500/15 px-5 py-2.5 text-sm font-semibold text-amber-100 transition hover:bg-amber-500/25 disabled:opacity-50"
              >
                Add test players
              </button>
            )}
            <button
              onClick={onRandomize}
              disabled={busy || room.players.length !== 4}
              className="rounded-lg border border-slate-600 bg-slate-800 px-5 py-2.5 text-sm font-semibold text-slate-100 transition hover:bg-slate-700 disabled:opacity-50"
            >
              Randomize roles
            </button>
          </div>
        )}

        {isHost ? (
          <button
            onClick={onStart}
            disabled={busy}
            className="rounded-lg bg-gradient-to-r from-emerald-500 to-sky-500 px-8 py-3 font-bold text-white transition hover:opacity-90 disabled:opacity-50"
          >
            {busy ? "Starting..." : "Start mission"}
          </button>
        ) : (
          <p className="text-sm text-slate-400">
            Waiting for the host to start the mission...
          </p>
        )}
        <p className="text-center text-xs text-slate-600">
          Co-op needs exactly 1 spymaster and 3 guessers. One of the four will
          secretly be the mole.
        </p>
      </div>
    </div>
  );
}

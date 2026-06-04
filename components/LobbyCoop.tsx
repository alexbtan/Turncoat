"use client";

import { useEffect, useRef, useState } from "react";
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
    <li className="text-sm">
      {player.name}
      {isBotPlayer(player) && (
        <span className="tc-muted ml-1 text-xs">[bot]</span>
      )}
      {player.id === hostPlayerId && (
        <span className="tc-muted ml-1 text-xs">(you)</span>
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
  const serverRounds = room.maxRounds ?? 8;
  const [localRounds, setLocalRounds] = useState(serverRounds);
  const dragging = useRef(false);

  useEffect(() => {
    if (!dragging.current) setLocalRounds(serverRounds);
  }, [serverRounds]);

  function commitRounds() {
    dragging.current = false;
    if (localRounds !== serverRounds) onSetMaxRounds(localRounds);
  }

  return (
    <div className="mx-auto max-w-3xl">
      <CustomWordsPanel
        room={room}
        isHost={isHost}
        onSave={onSaveWordSettings}
        busy={busy}
      />

      <div className="tc-panel mb-6">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium">Rounds to win</span>
          <span className="font-mono font-semibold">{localRounds}</span>
        </div>
        {isHost ? (
          <input
            type="range"
            min={MIN_COOP_ROUNDS}
            max={MAX_COOP_ROUNDS}
            step={1}
            value={localRounds}
            onChange={(e) => {
              dragging.current = true;
              setLocalRounds(Number(e.target.value));
            }}
            onPointerUp={commitRounds}
            onBlur={commitRounds}
            className="tc-range"
            aria-label="Maximum rounds"
          />
        ) : (
          <p className="tc-muted mt-2 text-xs">
            Find all 9 agents within {serverRounds} rounds.
          </p>
        )}
      </div>

      <div className="mb-6 grid gap-3 sm:grid-cols-2">
        <div className="tc-panel border-l-4 border-l-[var(--tc-green)] bg-[var(--tc-green-bg)]">
          <h3 className="mb-3 text-base font-bold text-[var(--tc-green)]">
            Spymaster
          </h3>
          {spymasters.length === 0 ? (
            <p className="tc-muted text-sm">—</p>
          ) : (
            <ul className="space-y-0.5">
              {spymasters.map((p) => (
                <Seat key={p.id} player={p} hostPlayerId={hostPlayerId} />
              ))}
            </ul>
          )}
          <button
            type="button"
            onClick={() => onPickRole("spymaster")}
            className="tc-btn-secondary mt-4 w-full text-xs"
          >
            Be spymaster
          </button>
        </div>

        <div className="tc-panel border-l-4 border-l-[var(--tc-blue)] bg-[var(--tc-blue-bg)]">
          <h3 className="mb-3 text-base font-bold text-[var(--tc-blue)]">
            Guessers ({guessers.length}/3)
          </h3>
          {guessers.length === 0 ? (
            <p className="tc-muted text-sm">—</p>
          ) : (
            <ul className="space-y-0.5">
              {guessers.map((p) => (
                <Seat key={p.id} player={p} hostPlayerId={hostPlayerId} />
              ))}
            </ul>
          )}
          <button
            type="button"
            onClick={() => onPickRole("guesser")}
            className="tc-btn-secondary mt-4 w-full text-xs"
          >
            Be guesser
          </button>
        </div>
      </div>

      {unassigned.length > 0 && (
        <div className="tc-panel-inset mb-6 text-sm">
          <span className="tc-muted">No role yet: </span>
          {unassigned.map((p) => p.name).join(", ")}
        </div>
      )}

      <div className="flex flex-col items-center gap-3">
        {isHost && (
          <div className="flex w-full max-w-md flex-col gap-2 sm:flex-row sm:justify-center">
            {canAddBots && (
              <button
                type="button"
                onClick={onAddTestPlayers}
                disabled={busy}
                className="tc-btn-ghost"
              >
                Add test players
              </button>
            )}
            <button
              type="button"
              onClick={onRandomize}
              disabled={busy || room.players.length !== 4}
              className="tc-btn-secondary"
            >
              Randomize roles
            </button>
          </div>
        )}

        {isHost ? (
          <button
            type="button"
            onClick={onStart}
            disabled={busy}
            className="tc-btn-primary px-10"
          >
            {busy ? "Starting…" : "Start mission"}
          </button>
        ) : (
          <p className="tc-muted text-sm">Waiting for the host to start…</p>
        )}
        <p className="tc-muted max-w-sm text-center text-xs leading-relaxed">
          Turncoat mode needs 1 spymaster and 3 guessers. One player is secretly
          the turncoat.
        </p>
      </div>
    </div>
  );
}

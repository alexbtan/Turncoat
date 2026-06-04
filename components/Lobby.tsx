"use client";

import { CustomWordsPanel } from "@/components/CustomWordsPanel";
import { isBotPlayer } from "@/lib/game";
import type { ClientRoom, Player, Role, Team } from "@/lib/types";

interface Props {
  room: ClientRoom;
  hostPlayerId: string;
  onPickTeam: (team: Team, role: Role) => void;
  onStart: () => void;
  onAddTestPlayers: () => void;
  onRandomizeTeams: () => void;
  onSaveWordSettings: (text: string, percent: number) => void;
  busy: boolean;
}

function TeamColumn({
  team,
  room,
  playerId,
  onPickTeam,
}: {
  team: Team;
  room: ClientRoom;
  playerId: string;
  onPickTeam: (team: Team, role: Role) => void;
}) {
  const isRed = team === "red";
  const panelClass = isRed
    ? "border-l-4 border-l-[var(--tc-red)] bg-[var(--tc-red-bg)]"
    : "border-l-4 border-l-[var(--tc-blue)] bg-[var(--tc-blue-bg)]";
  const headingClass = isRed ? "text-[var(--tc-red)]" : "text-[var(--tc-blue)]";
  const btnClass = isRed ? "tc-btn-secondary" : "tc-btn-secondary";

  const members = room.players.filter((p) => p.team === team);
  const spymasters = members.filter((p) => p.role === "spymaster");
  const operatives = members.filter((p) => p.role === "operative");

  return (
    <div className={`tc-panel flex-1 ${panelClass}`}>
      <h3 className={`mb-3 text-base font-bold capitalize ${headingClass}`}>
        {team} team
      </h3>

      <p className="tc-section-title mb-1">Spymaster</p>
      <PlayerList players={spymasters} playerId={playerId} empty="—" />

      <p className="tc-section-title mb-1 mt-4">Operatives</p>
      <PlayerList players={operatives} playerId={playerId} empty="—" />

      <div className="mt-4 flex gap-2">
        <button
          type="button"
          onClick={() => onPickTeam(team, "spymaster")}
          className={`${btnClass} flex-1 text-xs`}
        >
          Spymaster
        </button>
        <button
          type="button"
          onClick={() => onPickTeam(team, "operative")}
          className={`${btnClass} flex-1 text-xs`}
        >
          Operative
        </button>
      </div>
    </div>
  );
}

function PlayerList({
  players,
  playerId,
  empty,
}: {
  players: Player[];
  playerId: string;
  empty: string;
}) {
  if (players.length === 0) {
    return <p className="tc-muted text-sm">{empty}</p>;
  }
  return (
    <ul className="space-y-0.5">
      {players.map((p) => (
        <li key={p.id} className="text-sm">
          {p.name}
          {isBotPlayer(p) && (
            <span className="tc-muted ml-1 text-xs">[bot]</span>
          )}
          {p.id === playerId && (
            <span className="tc-muted ml-1 text-xs">(you)</span>
          )}
        </li>
      ))}
    </ul>
  );
}

export function Lobby({
  room,
  hostPlayerId,
  onPickTeam,
  onStart,
  onAddTestPlayers,
  onRandomizeTeams,
  onSaveWordSettings,
  busy,
}: Props) {
  const isHost = room.hostId === hostPlayerId;
  const unassigned = room.players.filter((p) => !p.team);
  const canAddBots = room.players.length < 4;
  const canRandomize = room.players.length >= 4;

  return (
    <div className="mx-auto max-w-3xl">
      <CustomWordsPanel
        room={room}
        isHost={isHost}
        onSave={onSaveWordSettings}
        busy={busy}
      />

      <div className="mb-6 flex flex-col gap-3 sm:flex-row">
        <TeamColumn
          team="red"
          room={room}
          playerId={hostPlayerId}
          onPickTeam={onPickTeam}
        />
        <TeamColumn
          team="blue"
          room={room}
          playerId={hostPlayerId}
          onPickTeam={onPickTeam}
        />
      </div>

      {unassigned.length > 0 && (
        <div className="tc-panel-inset mb-6 text-sm">
          <span className="tc-muted">No team yet: </span>
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
            {canRandomize && (
              <button
                type="button"
                onClick={onRandomizeTeams}
                disabled={busy}
                className="tc-btn-secondary"
              >
                Randomize teams
              </button>
            )}
          </div>
        )}

        {isHost ? (
          <button
            type="button"
            onClick={onStart}
            disabled={busy}
            className="tc-btn-primary px-10"
          >
            {busy ? "Starting…" : "Start game"}
          </button>
        ) : (
          <p className="tc-muted text-sm">Waiting for the host to start…</p>
        )}
        <p className="tc-muted max-w-sm text-center text-xs leading-relaxed">
          Each team needs at least one spymaster and one operative.
          {isHost && canAddBots && (
            <>
              {" "}
              For solo testing: add bots, randomize teams, then use the player
              switcher above.
            </>
          )}
        </p>
      </div>
    </div>
  );
}

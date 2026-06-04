"use client";

import { CustomWordsPanel } from "@/components/CustomWordsPanel";
import { isBotPlayer } from "@/lib/game";
import type { ClientRoom, Player, Role, Team } from "@/lib/types";

interface Props {
  room: ClientRoom;
  /** Real logged-in player (for host checks and “you” label). */
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
  const accent =
    team === "red"
      ? "border-red-500/40 bg-red-500/5"
      : "border-blue-500/40 bg-blue-500/5";
  const heading = team === "red" ? "text-red-400" : "text-blue-400";
  const members = room.players.filter((p) => p.team === team);
  const spymasters = members.filter((p) => p.role === "spymaster");
  const operatives = members.filter((p) => p.role === "operative");

  const btn =
    team === "red"
      ? "bg-red-500/20 hover:bg-red-500/30 border-red-500/40 text-red-200"
      : "bg-blue-500/20 hover:bg-blue-500/30 border-blue-500/40 text-blue-200";

  return (
    <div className={`flex-1 rounded-xl border p-4 ${accent}`}>
      <h3 className={`mb-3 text-lg font-bold uppercase tracking-wide ${heading}`}>
        {team} team
      </h3>

      <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
        Spymaster
      </div>
      <PlayerList players={spymasters} playerId={playerId} empty="No spymaster" />

      <div className="mb-2 mt-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
        Operatives
      </div>
      <PlayerList players={operatives} playerId={playerId} empty="No operatives" />

      <div className="mt-4 flex gap-2">
        <button
          onClick={() => onPickTeam(team, "spymaster")}
          className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition ${btn}`}
        >
          Spymaster
        </button>
        <button
          onClick={() => onPickTeam(team, "operative")}
          className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition ${btn}`}
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
    return <p className="text-sm italic text-slate-600">{empty}</p>;
  }
  return (
    <ul className="space-y-1">
      {players.map((p) => (
        <li key={p.id} className="text-sm text-slate-200">
          {p.name}
          {isBotPlayer(p) && (
            <span className="ml-1 text-xs text-amber-500/80">(bot)</span>
          )}
          {p.id === playerId && (
            <span className="ml-1 text-xs text-slate-500">(you)</span>
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

      <div className="mb-6 flex flex-col gap-4 sm:flex-row">
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
        <div className="mb-6 rounded-lg border border-slate-800 bg-slate-900/50 p-3 text-sm text-slate-400">
          Waiting to pick a team:{" "}
          {unassigned.map((p) => p.name).join(", ")}
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
            {canRandomize && (
              <button
                onClick={onRandomizeTeams}
                disabled={busy}
                className="rounded-lg border border-slate-600 bg-slate-800 px-5 py-2.5 text-sm font-semibold text-slate-100 transition hover:bg-slate-700 disabled:opacity-50"
              >
                Randomize teams
              </button>
            )}
          </div>
        )}

        {isHost ? (
          <button
            onClick={onStart}
            disabled={busy}
            className="rounded-lg bg-gradient-to-r from-red-500 to-blue-500 px-8 py-3 font-bold text-white transition hover:opacity-90 disabled:opacity-50"
          >
            {busy ? "Starting..." : "Start game"}
          </button>
        ) : (
          <p className="text-sm text-slate-400">
            Waiting for the host to start the game...
          </p>
        )}
        <p className="text-center text-xs text-slate-600">
          Each team needs at least one spymaster and one operative.
          {isHost && canAddBots && (
            <>
              {" "}
              Solo testing? Add test players, randomize teams, then use the
              player switcher to control each role.
            </>
          )}
        </p>
      </div>
    </div>
  );
}

"use client";

import { isBotPlayer } from "@/lib/game";
import type { ClientRoom, Player, Role, Team } from "@/lib/types";

interface Props {
  room: ClientRoom;
  playerId: string;
}

function roleLabel(role: Role | null): string {
  switch (role) {
    case "spymaster":
      return "Spymaster";
    case "operative":
      return "Operative";
    case "guesser":
      return "Guesser";
    default:
      return "Unassigned";
  }
}

function RoleBadge({
  role,
  variant,
}: {
  role: Role | null;
  variant: "red" | "blue" | "green" | "neutral";
}) {
  const colors = {
    red: "bg-[var(--tc-red-bg)] text-[var(--tc-red)] border-[var(--tc-red-border)]",
    blue: "bg-[var(--tc-blue-bg)] text-[var(--tc-blue)] border-[var(--tc-blue-border)]",
    green:
      "bg-[var(--tc-green-bg)] text-[var(--tc-green)] border-[var(--tc-green-border)]",
    neutral:
      "bg-[var(--tc-surface-raised)] text-[var(--tc-muted)] border-[var(--tc-border)]",
  };

  return (
    <span
      className={`shrink-0 rounded border px-1.5 py-px text-[10px] font-bold uppercase tracking-wide ${colors[variant]}`}
    >
      {roleLabel(role)}
    </span>
  );
}

function PlayerRow({
  player,
  viewerId,
  roleVariant,
  moleReveal,
}: {
  player: Player;
  viewerId: string;
  roleVariant: "red" | "blue" | "green" | "neutral";
  moleReveal?: boolean;
}) {
  const isYou = player.id === viewerId;

  return (
    <li
      className={`flex items-center justify-between gap-2 rounded px-1.5 py-1 ${
        isYou ? "bg-[var(--tc-surface-raised)] ring-1 ring-[var(--tc-border-strong)]" : ""
      }`}
    >
      <span className="min-w-0 truncate text-sm font-medium">
        {player.name}
        {isBotPlayer(player) && (
          <span className="tc-muted ml-1 text-xs font-normal">[bot]</span>
        )}
        {isYou && (
          <span className="tc-muted ml-1 text-xs font-normal">(you)</span>
        )}
      </span>
      <div className="flex shrink-0 items-center gap-1">
        {moleReveal && (
          <span className="rounded border border-[var(--tc-red-border)] bg-[var(--tc-danger-bg)] px-1.5 py-px text-[10px] font-bold uppercase tracking-wide text-[var(--tc-danger)]">
            Turncoat
          </span>
        )}
        <RoleBadge role={player.role} variant={roleVariant} />
      </div>
    </li>
  );
}

function ClassicRoster({ room, playerId }: Props) {
  const teams: Team[] = ["red", "blue"];

  return (
    <div className="tc-panel-inset">
      <h4 className="tc-section-title mb-2">Players</h4>
      <div className="space-y-3">
        {teams.map((team) => {
          const isRed = team === "red";
          const active = room.phase === "playing" && room.turn === team;
          const panelClass = isRed
            ? "border-l-[var(--tc-red)] bg-[var(--tc-red-bg)]"
            : "border-l-[var(--tc-blue)] bg-[var(--tc-blue-bg)]";
          const headingClass = isRed
            ? "text-[var(--tc-red)]"
            : "text-[var(--tc-blue)]";
          const members = room.players.filter((p) => p.team === team);
          const spymasters = members.filter((p) => p.role === "spymaster");
          const operatives = members.filter((p) => p.role === "operative");
          const roleVariant = isRed ? "red" : "blue";

          return (
            <div
              key={team}
              className={`rounded border border-[var(--tc-border)] border-l-4 p-2 ${panelClass} ${
                active ? "ring-2 ring-[var(--tc-border-strong)]" : ""
              }`}
            >
              <p
                className={`mb-2 text-xs font-bold uppercase tracking-wide ${headingClass}`}
              >
                {team} team
                {active && (
                  <span className="tc-muted ml-1.5 font-normal normal-case tracking-normal">
                    · active
                  </span>
                )}
              </p>
              <div className="space-y-2">
                <div>
                  <p className="tc-muted mb-0.5 text-[10px] font-bold uppercase tracking-wider">
                    Spymaster
                  </p>
                  {spymasters.length === 0 ? (
                    <p className="tc-muted text-xs">—</p>
                  ) : (
                    <ul className="space-y-0.5">
                      {spymasters.map((p) => (
                        <PlayerRow
                          key={p.id}
                          player={p}
                          viewerId={playerId}
                          roleVariant={roleVariant}
                        />
                      ))}
                    </ul>
                  )}
                </div>
                <div>
                  <p className="tc-muted mb-0.5 text-[10px] font-bold uppercase tracking-wider">
                    Operatives
                  </p>
                  {operatives.length === 0 ? (
                    <p className="tc-muted text-xs">—</p>
                  ) : (
                    <ul className="space-y-0.5">
                      {operatives.map((p) => (
                        <PlayerRow
                          key={p.id}
                          player={p}
                          viewerId={playerId}
                          roleVariant={roleVariant}
                        />
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      {room.players.some((p) => !p.team) && (
        <p className="tc-muted mt-2 text-xs">
          Unassigned:{" "}
          {room.players
            .filter((p) => !p.team)
            .map((p) => p.name)
            .join(", ")}
        </p>
      )}
    </div>
  );
}

function CoopRoster({ room, playerId }: Props) {
  const spymasters = room.players.filter((p) => p.role === "spymaster");
  const guessers = room.players.filter((p) => p.role === "guesser");
  const unassigned = room.players.filter((p) => !p.role);
  const moleId =
    room.phase === "finished" ? room.moleReveal?.playerId : undefined;

  return (
    <div className="tc-panel-inset">
      <h4 className="tc-section-title mb-2">Players</h4>
      <div className="space-y-3">
        <div className="rounded border border-[var(--tc-border)] border-l-4 border-l-[var(--tc-green)] bg-[var(--tc-green-bg)] p-2">
          <p className="mb-2 text-xs font-bold uppercase tracking-wide text-[var(--tc-green)]">
            Spymaster
          </p>
          {spymasters.length === 0 ? (
            <p className="tc-muted text-xs">—</p>
          ) : (
            <ul className="space-y-0.5">
              {spymasters.map((p) => (
                <PlayerRow
                  key={p.id}
                  player={p}
                  viewerId={playerId}
                  roleVariant="green"
                  moleReveal={p.id === moleId}
                />
              ))}
            </ul>
          )}
        </div>

        <div className="rounded border border-[var(--tc-border)] border-l-4 border-l-[var(--tc-blue)] bg-[var(--tc-blue-bg)] p-2">
          <p className="mb-2 text-xs font-bold uppercase tracking-wide text-[var(--tc-blue)]">
            Guessers ({guessers.length}/3)
          </p>
          {guessers.length === 0 ? (
            <p className="tc-muted text-xs">—</p>
          ) : (
            <ul className="space-y-0.5">
              {guessers.map((p) => (
                <PlayerRow
                  key={p.id}
                  player={p}
                  viewerId={playerId}
                  roleVariant="blue"
                  moleReveal={p.id === moleId}
                />
              ))}
            </ul>
          )}
        </div>
      </div>
      {unassigned.length > 0 && (
        <p className="tc-muted mt-2 text-xs">
          Unassigned: {unassigned.map((p) => p.name).join(", ")}
        </p>
      )}
    </div>
  );
}

export function PlayerRoster({ room, playerId }: Props) {
  if (room.gameMode === "coop") {
    return <CoopRoster room={room} playerId={playerId} />;
  }
  return <ClassicRoster room={room} playerId={playerId} />;
}

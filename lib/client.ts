import type { ClientRoom, GameMode, Role, Team } from "./types";

// ---- Local identity helpers (client only) ----

const NAME_KEY = "codenames:name";

export function getStoredName(): string {
  if (typeof window === "undefined") return "";
  return window.localStorage.getItem(NAME_KEY) ?? "";
}

export function setStoredName(name: string): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(NAME_KEY, name);
}

function playerKey(code: string): string {
  return `codenames:player:${code.toUpperCase()}`;
}

export function getStoredPlayerId(code: string): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(playerKey(code));
}

export function setStoredPlayerId(code: string, playerId: string): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(playerKey(code), playerId);
}

// ---- API helpers ----

async function post<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error((data as { error?: string }).error ?? "Request failed.");
  }
  return data as T;
}

interface RoomResponse {
  code: string;
  playerId: string;
  room: ClientRoom;
}

export function createRoom(name: string) {
  return post<RoomResponse>("/api/rooms", { name });
}

export function joinRoom(code: string, name: string, playerId?: string | null) {
  return post<RoomResponse>(`/api/rooms/${code}/join`, { name, playerId });
}

export function setTeam(
  code: string,
  playerId: string,
  team: Team,
  role: Role,
) {
  return post<{ room: ClientRoom }>(`/api/rooms/${code}/team`, {
    playerId,
    team,
    role,
  });
}

export function startGame(code: string, playerId: string) {
  return post<{ room: ClientRoom }>(`/api/rooms/${code}/start`, { playerId });
}

export function giveClue(
  code: string,
  playerId: string,
  word: string,
  number: number,
) {
  return post<{ room: ClientRoom }>(`/api/rooms/${code}/clue`, {
    playerId,
    word,
    number,
  });
}

export function guess(code: string, playerId: string, index: number) {
  return post<{ room: ClientRoom }>(`/api/rooms/${code}/guess`, {
    playerId,
    index,
  });
}

export function endTurn(code: string, playerId: string) {
  return post<{ room: ClientRoom }>(`/api/rooms/${code}/end-turn`, {
    playerId,
  });
}

export function resetGame(code: string, playerId: string) {
  return post<{ room: ClientRoom }>(`/api/rooms/${code}/reset`, { playerId });
}

export function addTestPlayers(code: string, playerId: string) {
  return post<{ room: ClientRoom }>(`/api/rooms/${code}/test-players`, {
    playerId,
  });
}

export function randomizeTeams(code: string, playerId: string) {
  return post<{ room: ClientRoom }>(`/api/rooms/${code}/randomize-teams`, {
    playerId,
  });
}

export function saveWordSettings(
  code: string,
  playerId: string,
  customWordsText: string,
  customWordPercent: number,
) {
  return post<{ room: ClientRoom }>(`/api/rooms/${code}/word-settings`, {
    playerId,
    customWordsText,
    customWordPercent,
  });
}

// ---- Co-op mole mode ----

export function setMode(
  code: string,
  playerId: string,
  gameMode: GameMode,
  maxRounds?: number,
) {
  return post<{ room: ClientRoom }>(`/api/rooms/${code}/mode`, {
    playerId,
    gameMode,
    maxRounds,
  });
}

export function setCoopRole(code: string, playerId: string, role: Role) {
  return post<{ room: ClientRoom }>(`/api/rooms/${code}/coop/role`, {
    playerId,
    role,
  });
}

export function randomizeCoopRoles(code: string, playerId: string) {
  return post<{ room: ClientRoom }>(`/api/rooms/${code}/coop/randomize`, {
    playerId,
  });
}

export function coopClue(
  code: string,
  playerId: string,
  word: string,
  number: number,
) {
  return post<{ room: ClientRoom }>(`/api/rooms/${code}/coop/clue`, {
    playerId,
    word,
    number,
  });
}

export function coopVote(code: string, playerId: string, index: number) {
  return post<{ room: ClientRoom }>(`/api/rooms/${code}/coop/vote`, {
    playerId,
    index,
  });
}

export function coopPass(code: string, playerId: string) {
  return post<{ room: ClientRoom }>(`/api/rooms/${code}/coop/pass`, {
    playerId,
  });
}

export function coopAccuse(code: string, playerId: string) {
  return post<{ room: ClientRoom }>(`/api/rooms/${code}/coop/accuse`, {
    playerId,
  });
}

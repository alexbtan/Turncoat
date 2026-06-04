import {
  DEFAULT_COOP_ROUNDS,
  addLog,
  findPlayer,
  normalizeRoom,
  pickBoardWords,
  shuffle,
} from "./game";
import type {
  Card,
  ClientCard,
  ClientRoom,
  Clue,
  Player,
  Role,
  Room,
} from "./types";

// Co-op board composition (25 cards total). Kept as a local literal so this
// module can be imported by game.ts without a circular-init dependency.
const COOP_BOARD_SIZE = 25;
export const COOP_AGENTS = 9;
export const COOP_ASSASSINS = 1;
export const COOP_NEUTRALS = COOP_BOARD_SIZE - COOP_AGENTS - COOP_ASSASSINS; // 15

export const MIN_COOP_ROUNDS = 3;
export const MAX_COOP_ROUNDS = 15;

type Result = { ok: boolean; error?: string };

function guessers(room: Room): Player[] {
  return room.players.filter((p) => p.role === "guesser");
}

/** Majority of the current guessers (2 of 3). */
function majorityThreshold(room: Room): number {
  return Math.floor(guessers(room).length / 2) + 1;
}

function agentsRemaining(room: Room): number {
  return room.board.filter((c) => !c.revealed && c.type === "agent").length;
}

function moleRoleOf(room: Room): Role | null {
  if (!room.molePlayerId) return null;
  return findPlayer(room, room.molePlayerId)?.role ?? null;
}

function clearVotes(room: Room): void {
  room.cardVotes = {};
  room.passVotes = [];
}

function generateCoopBoard(room: Room): Card[] {
  const words = pickBoardWords({
    customWords: room.customWords,
    customWordPercent: room.customWordPercent,
  });

  const types: Card["type"][] = [
    ...Array(COOP_AGENTS).fill("agent" as const),
    ...Array(COOP_NEUTRALS).fill("neutral" as const),
    ...Array(COOP_ASSASSINS).fill("assassin" as const),
  ];
  const shuffledTypes = shuffle(types);

  return words.map((word, i) => ({
    word,
    type: shuffledTypes[i],
    revealed: false,
  }));
}

/** Validate co-op lobby composition: exactly 1 spymaster + 3 guessers. */
export function validateCoopLobby(room: Room): Result {
  const spymasters = room.players.filter((p) => p.role === "spymaster");
  const gs = guessers(room);
  if (spymasters.length !== 1) {
    return { ok: false, error: "Co-op needs exactly 1 spymaster." };
  }
  if (gs.length !== 3) {
    return { ok: false, error: "Co-op needs exactly 3 guessers." };
  }
  return { ok: true };
}

/** Assign one spymaster and three guessers at random. */
export function randomizeCoopRoles(room: Room): Result {
  if (room.phase !== "lobby") {
    return { ok: false, error: "Can only assign roles in the lobby." };
  }
  if (room.players.length !== 4) {
    return {
      ok: false,
      error: "Co-op needs exactly 4 players. Use “Add test players”.",
    };
  }
  const players = shuffle([...room.players]);
  players.forEach((p, i) => {
    p.team = null;
    p.role = i === 0 ? "spymaster" : "guesser";
  });
  addLog(room, "Roles randomized: 1 spymaster, 3 guessers.");
  return { ok: true };
}

/** Set a single player's co-op role (spymaster or guesser). */
export function setCoopRole(
  room: Room,
  player: Player,
  role: Role,
): Result {
  if (room.phase !== "lobby") {
    return { ok: false, error: "Can only change roles in the lobby." };
  }
  if (role !== "spymaster" && role !== "guesser") {
    return { ok: false, error: "Invalid co-op role." };
  }
  player.team = null;
  player.role = role;
  return { ok: true };
}

/** Configure co-op options (max rounds). Host, lobby only. */
export function setCoopSettings(room: Room, maxRounds: number): Result {
  if (room.phase !== "lobby") {
    return { ok: false, error: "Settings can only change in the lobby." };
  }
  const n = Math.round(maxRounds);
  if (Number.isNaN(n) || n < MIN_COOP_ROUNDS || n > MAX_COOP_ROUNDS) {
    return {
      ok: false,
      error: `Rounds must be between ${MIN_COOP_ROUNDS} and ${MAX_COOP_ROUNDS}.`,
    };
  }
  room.maxRounds = n;
  return { ok: true };
}

/** Start a co-op game: board, secret mole, round clock. */
export function startCoopGame(room: Room): Result {
  const valid = validateCoopLobby(room);
  if (!valid.ok) return valid;

  room.board = generateCoopBoard(room);

  // Pick the mole at random among all four players.
  const mole = shuffle([...room.players])[0];
  room.molePlayerId = mole.id;

  room.maxRounds = room.maxRounds || DEFAULT_COOP_ROUNDS;
  room.roundsRemaining = room.maxRounds;
  room.clue = null;
  room.coopOutcome = null;
  room.winner = null;
  room.phase = "playing";
  room.log = [];
  clearVotes(room);
  room.accusations = [];

  addLog(
    room,
    `Mission started. Find all ${COOP_AGENTS} agents within ${room.maxRounds} rounds. One of you is the mole...`,
  );
  return { ok: true };
}

export function submitCoopClue(
  room: Room,
  player: Player,
  word: string,
  count: number,
): Result {
  if (room.phase !== "playing") {
    return { ok: false, error: "Mission is not in progress." };
  }
  if (player.role !== "spymaster") {
    return { ok: false, error: "Only the spymaster can give a clue." };
  }
  if (room.clue) {
    return { ok: false, error: "A clue is already in play this round." };
  }
  if (room.roundsRemaining <= 0) {
    return { ok: false, error: "No rounds remaining." };
  }
  const trimmed = word.trim();
  if (!trimmed) return { ok: false, error: "Clue word is required." };
  if (/\s/.test(trimmed)) {
    return { ok: false, error: "Clue must be a single word." };
  }
  const n = Math.floor(count);
  if (Number.isNaN(n) || n < 0 || n > 9) {
    return { ok: false, error: "Clue number must be between 0 and 9." };
  }

  const clue: Clue = {
    word: trimmed.toUpperCase(),
    number: n,
    guessesRemaining: n === 0 ? agentsRemaining(room) : n + 1,
  };
  room.clue = clue;
  clearVotes(room);
  addLog(room, `Spymaster: "${clue.word}" ${n}`);
  return { ok: true };
}

function endCoopRound(room: Room, reason: string): void {
  room.clue = null;
  clearVotes(room);
  room.roundsRemaining -= 1;
  addLog(room, `Round over (${reason}). Rounds left: ${room.roundsRemaining}.`);

  if (room.roundsRemaining <= 0 && agentsRemaining(room) > 0) {
    room.phase = "finished";
    room.coopOutcome = "mole";
    addLog(room, "Out of rounds! The mole wins.");
  }
}

function revealCoopCard(room: Room, index: number): void {
  const card = room.board[index];
  card.revealed = true;
  clearVotes(room);

  if (card.type === "assassin") {
    addLog(room, `Revealed "${card.word}" — the ASSASSIN! The mole wins.`);
    room.phase = "finished";
    room.coopOutcome = "mole";
    room.clue = null;
    return;
  }

  if (card.type === "agent") {
    addLog(room, `Revealed "${card.word}" — an agent!`);
    if (agentsRemaining(room) === 0) {
      room.phase = "finished";
      room.coopOutcome = "agents";
      room.clue = null;
      addLog(room, "All agents found! The team wins.");
      return;
    }
    if (room.clue) {
      room.clue.guessesRemaining -= 1;
      if (room.clue.guessesRemaining <= 0) {
        endCoopRound(room, "out of guesses");
      }
    }
    return;
  }

  // Neutral bystander: the round ends immediately.
  addLog(room, `Revealed "${card.word}" — a bystander.`);
  endCoopRound(room, "bystander revealed");
}

/** A guesser toggles their vote on a card; reveals when majority is reached. */
export function coopVote(room: Room, player: Player, index: number): Result {
  if (room.phase !== "playing") {
    return { ok: false, error: "Mission is not in progress." };
  }
  if (player.role !== "guesser") {
    return { ok: false, error: "Only guessers can vote on cards." };
  }
  if (!room.clue) {
    return { ok: false, error: "Wait for the spymaster's clue." };
  }
  if (index < 0 || index >= room.board.length) {
    return { ok: false, error: "Invalid card." };
  }
  if (room.board[index].revealed) {
    return { ok: false, error: "That card is already revealed." };
  }

  const already = (room.cardVotes[index] ?? []).includes(player.id);

  // Remove this guesser's vote from every card first (one vote each).
  for (const key of Object.keys(room.cardVotes)) {
    const i = Number(key);
    room.cardVotes[i] = room.cardVotes[i].filter((id) => id !== player.id);
    if (room.cardVotes[i].length === 0) delete room.cardVotes[i];
  }

  if (already) {
    // Toggling off — leave the vote cleared.
    return { ok: true };
  }

  room.cardVotes[index] = [...(room.cardVotes[index] ?? []), player.id];

  if (room.cardVotes[index].length >= majorityThreshold(room)) {
    revealCoopCard(room, index);
  }
  return { ok: true };
}

/** A guesser toggles a vote to end the round; ends on majority. */
export function coopPass(room: Room, player: Player): Result {
  if (room.phase !== "playing") {
    return { ok: false, error: "Mission is not in progress." };
  }
  if (player.role !== "guesser") {
    return { ok: false, error: "Only guessers can vote to end the round." };
  }
  if (!room.clue) {
    return { ok: false, error: "There is no active round to end." };
  }

  if (room.passVotes.includes(player.id)) {
    room.passVotes = room.passVotes.filter((id) => id !== player.id);
    return { ok: true };
  }

  room.passVotes = [...room.passVotes, player.id];
  if (room.passVotes.length >= majorityThreshold(room)) {
    endCoopRound(room, "team passed");
  }
  return { ok: true };
}

/** A guesser toggles their accusation that the spymaster is the mole. */
export function coopAccuse(room: Room, player: Player): Result {
  if (room.phase !== "playing") {
    return { ok: false, error: "Mission is not in progress." };
  }
  if (player.role !== "guesser") {
    return { ok: false, error: "Only guessers can accuse the spymaster." };
  }

  if (room.accusations.includes(player.id)) {
    room.accusations = room.accusations.filter((id) => id !== player.id);
    return { ok: true };
  }

  room.accusations = [...room.accusations, player.id];

  // When every guesser accuses, resolve the game.
  if (room.accusations.length >= guessers(room).length) {
    room.phase = "finished";
    room.clue = null;
    clearVotes(room);
    if (moleRoleOf(room) === "spymaster") {
      room.coopOutcome = "agents";
      addLog(room, "The guessers accused the spymaster — correct! The team wins.");
    } else {
      room.coopOutcome = "mole";
      addLog(
        room,
        "The guessers accused an innocent spymaster — the mole wins!",
      );
    }
  }
  return { ok: true };
}

/** Co-op view projection: hides the mole and the key from honest guessers. */
export function toClientRoomCoop(
  room: Room,
  playerId: string | null,
): ClientRoom {
  normalizeRoom(room);
  const self = playerId ? findPlayer(room, playerId) : null;
  const isMole = !!self && self.id === room.molePlayerId;
  const finished = room.phase === "finished";
  const reveal = finished || self?.role === "spymaster" || isMole;

  const board: ClientCard[] = room.board.map((card) => {
    if (reveal || card.revealed) {
      return { word: card.word, revealed: card.revealed, type: card.type };
    }
    return { word: card.word, revealed: card.revealed };
  });

  const moleReveal =
    finished && room.molePlayerId
      ? { playerId: room.molePlayerId, role: moleRoleOf(room) ?? "guesser" }
      : null;

  return {
    code: room.code,
    hostId: room.hostId,
    players: room.players,
    board,
    turn: room.turn,
    startingTeam: room.startingTeam,
    clue: room.clue,
    phase: room.phase,
    winner: room.winner,
    log: room.log,
    remaining: { red: 0, blue: 0 },
    customWords: room.customWords,
    customWordPercent: room.customWordPercent,
    gameMode: "coop",
    maxRounds: room.maxRounds,
    roundsRemaining: room.roundsRemaining,
    agentsRemaining: agentsRemaining(room),
    cardVotes: room.cardVotes,
    passVotes: room.passVotes,
    accusations: room.accusations,
    coopOutcome: room.coopOutcome,
    moleReveal,
    you: self ? { ...self, isMole } : null,
  };
}

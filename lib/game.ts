import { customSlotsForBoard, parseCustomWords } from "./customWords";
import { toClientRoomCoop } from "./gameCoop";
import { WORDS } from "./words";
import type {
  Card,
  ClientCard,
  ClientRoom,
  Clue,
  Player,
  Room,
  Team,
} from "./types";

export const BOARD_SIZE = 25;
export const DEFAULT_COOP_ROUNDS = 5;

function randomId(len = 8): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let out = "";
  for (let i = 0; i < len; i++) {
    out += chars[Math.floor(Math.random() * chars.length)];
  }
  return out;
}

export function newPlayerId(): string {
  return randomId(12);
}

export function newBotId(): string {
  return `bot_${randomId(10)}`;
}

export function isBotPlayer(player: Player): boolean {
  return player.id.startsWith("bot_");
}

const TEST_BOT_NAMES = ["Bot Anna", "Bot Blake", "Bot Casey", "Bot Drew"];

/** Fill the room with bot players until there are at least 4 (host + 3 bots). */
export function addTestPlayers(room: Room): { ok: boolean; error?: string } {
  if (room.phase !== "lobby") {
    return { ok: false, error: "Can only add test players in the lobby." };
  }
  const needed = Math.max(0, 4 - room.players.length);
  if (needed === 0) {
    return { ok: false, error: "Room already has 4 or more players." };
  }
  const usedNames = new Set(room.players.map((p) => p.name));
  for (let i = 0; i < needed; i++) {
    const name =
      TEST_BOT_NAMES.find((n) => !usedNames.has(n)) ?? `Bot ${room.players.length + 1}`;
    usedNames.add(name);
    room.players.push({
      id: newBotId(),
      name,
      team: null,
      role: null,
    });
  }
  addLog(room, `Added ${needed} test player${needed === 1 ? "" : "s"}.`);
  return { ok: true };
}

/** Randomly split players across red/blue with one spymaster per team. */
export function randomizeTeams(room: Room): { ok: boolean; error?: string } {
  if (room.phase !== "lobby") {
    return { ok: false, error: "Can only randomize teams in the lobby." };
  }
  if (room.players.length < 4) {
    return {
      ok: false,
      error: "Need at least 4 players. Use “Add test players” first.",
    };
  }

  const players = shuffle([...room.players]);
  const mid = Math.ceil(players.length / 2);
  const redTeam = players.slice(0, mid);
  const blueTeam = players.slice(mid);

  redTeam.forEach((p, i) => {
    p.team = "red";
    p.role = i === 0 ? "spymaster" : "operative";
  });
  blueTeam.forEach((p, i) => {
    p.team = "blue";
    p.role = i === 0 ? "spymaster" : "operative";
  });

  addLog(room, "Teams randomized.");
  return { ok: true };
}

export function newRoomCode(): string {
  // Unambiguous uppercase code (no O/0/I/1).
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < 4; i++) {
    out += chars[Math.floor(Math.random() * chars.length)];
  }
  return out;
}

export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export interface WordPoolOptions {
  customWords?: string[];
  customWordPercent?: number;
}

/** Pick 25 unique words, mixing custom and default lists by percentage. */
export function pickBoardWords(options: WordPoolOptions = {}): string[] {
  const custom = options.customWords ?? [];
  const percent = options.customWordPercent ?? 0;
  const customCount = customSlotsForBoard(BOARD_SIZE, custom.length, percent);
  const defaultCount = BOARD_SIZE - customCount;

  const pickedCustom = shuffle(custom).slice(0, customCount);
  const used = new Set(pickedCustom.map((w) => w.toUpperCase()));
  const defaultPool = WORDS.filter((w) => !used.has(w.toUpperCase()));
  const pickedDefault = shuffle(defaultPool).slice(0, defaultCount);

  return shuffle([...pickedCustom, ...pickedDefault]);
}

/**
 * Build a fresh 25-card board. The starting team gets 9 cards, the other
 * team 8, plus 7 neutral and 1 assassin.
 */
export function generateBoard(
  startingTeam: Team,
  wordOptions: WordPoolOptions = {},
): {
  board: Card[];
  startingTeam: Team;
} {
  const words = pickBoardWords(wordOptions);
  const otherTeam: Team = startingTeam === "red" ? "blue" : "red";

  const types: Card["type"][] = [
    ...Array(9).fill(startingTeam),
    ...Array(8).fill(otherTeam),
    ...Array(7).fill("neutral" as const),
    "assassin" as const,
  ];

  const shuffledTypes = shuffle(types);

  const board: Card[] = words.map((word, i) => ({
    word,
    type: shuffledTypes[i],
    revealed: false,
  }));

  return { board, startingTeam };
}

export function createRoom(hostId: string): Room {
  const startingTeam: Team = Math.random() < 0.5 ? "red" : "blue";
  const now = Date.now();
  return {
    code: newRoomCode(),
    hostId,
    players: [],
    board: [],
    turn: startingTeam,
    startingTeam,
    clue: null,
    phase: "lobby",
    winner: null,
    log: [],
    customWords: [],
    customWordPercent: 0,
    gameMode: "classic",
    maxRounds: DEFAULT_COOP_ROUNDS,
    roundsRemaining: 0,
    molePlayerId: null,
    cardVotes: {},
    passVotes: [],
    accusations: [],
    guesserAccusations: {},
    coopOutcome: null,
    shieldUsed: false,
    createdAt: now,
    updatedAt: now,
  };
}

/** Update custom word list and mix percentage (lobby only, host). */
export function setWordSettings(
  room: Room,
  customWordsText: string,
  customWordPercent: number,
): { ok: boolean; error?: string } {
  if (room.phase !== "lobby") {
    return { ok: false, error: "Word settings can only be changed in the lobby." };
  }
  const pct = Math.round(customWordPercent);
  if (Number.isNaN(pct) || pct < 0 || pct > 100) {
    return { ok: false, error: "Percentage must be between 0 and 100." };
  }
  room.customWords = parseCustomWords(customWordsText);
  room.customWordPercent = pct;
  return { ok: true };
}

export function addLog(room: Room, message: string, team?: Team): void {
  room.log.push({ id: randomId(6), ts: Date.now(), message, team });
  // Keep the log from growing without bound.
  if (room.log.length > 100) {
    room.log = room.log.slice(-100);
  }
}

export function countRemaining(room: Room): { red: number; blue: number } {
  let red = 0;
  let blue = 0;
  for (const card of room.board) {
    if (card.revealed) continue;
    if (card.type === "red") red++;
    if (card.type === "blue") blue++;
  }
  return { red, blue };
}

export function findPlayer(room: Room, playerId: string): Player | null {
  return room.players.find((p) => p.id === playerId) ?? null;
}

/** Backfill fields on rooms created before newer features existed. */
export function normalizeRoom(room: Room): void {
  if (!Array.isArray(room.customWords)) room.customWords = [];
  if (typeof room.customWordPercent !== "number") room.customWordPercent = 0;
  if (room.gameMode !== "coop") room.gameMode = "classic";
  if (typeof room.maxRounds !== "number") room.maxRounds = DEFAULT_COOP_ROUNDS;
  if (typeof room.roundsRemaining !== "number") room.roundsRemaining = 0;
  if (typeof room.molePlayerId === "undefined") room.molePlayerId = null;
  if (typeof room.cardVotes !== "object" || room.cardVotes === null) {
    room.cardVotes = {};
  }
  if (!Array.isArray(room.passVotes)) room.passVotes = [];
  if (!Array.isArray(room.accusations)) room.accusations = [];
  if (
    typeof room.guesserAccusations !== "object" ||
    room.guesserAccusations === null
  ) {
    room.guesserAccusations = {};
  }
  if (typeof room.coopOutcome === "undefined") room.coopOutcome = null;
  if (typeof room.shieldUsed !== "boolean") room.shieldUsed = false;
}

/** Begin a new game: assign a fresh board and reset turn/clue state. */
export function startGame(room: Room): { ok: boolean; error?: string } {
  const startingTeam: Team = Math.random() < 0.5 ? "red" : "blue";
  const { board } = generateBoard(startingTeam, {
    customWords: room.customWords,
    customWordPercent: room.customWordPercent,
  });
  room.board = board;
  room.startingTeam = startingTeam;
  room.turn = startingTeam;
  room.clue = null;
  room.winner = null;
  room.phase = "playing";
  room.log = [];
  addLog(room, `Game started. ${cap(startingTeam)} team goes first.`);
  return { ok: true };
}

/** Return a finished game to the lobby without starting a new one. */
export function returnToLobby(room: Room): { ok: boolean; error?: string } {
  if (room.phase !== "finished") {
    return { ok: false, error: "The game is not over yet." };
  }

  room.phase = "lobby";
  room.board = [];
  room.clue = null;
  room.winner = null;
  room.coopOutcome = null;
  room.molePlayerId = null;
  room.cardVotes = {};
  room.passVotes = [];
  room.accusations = [];
  room.guesserAccusations = {};
  room.shieldUsed = false;
  room.roundsRemaining = 0;
  addLog(room, "Returned to the lobby.");
  return { ok: true };
}

export function submitClue(
  room: Room,
  player: Player,
  word: string,
  count: number,
): { ok: boolean; error?: string } {
  if (room.phase !== "playing") {
    return { ok: false, error: "Game is not in progress." };
  }
  if (player.role !== "spymaster" || player.team !== room.turn) {
    return { ok: false, error: "Only the active team's spymaster can give a clue." };
  }
  if (room.clue) {
    return { ok: false, error: "A clue has already been given this turn." };
  }
  const trimmed = word.trim();
  if (!trimmed) {
    return { ok: false, error: "Clue word is required." };
  }
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
    // 0 means "unlimited"-ish: allow guessing until they choose to stop or
    // miss. We cap at remaining cards. Otherwise it's number + 1.
    guessesRemaining: n === 0 ? remainingForTeam(room, player.team) : n + 1,
  };
  room.clue = clue;
  addLog(room, `${cap(player.team)} spymaster: "${clue.word}" ${n}`, player.team);
  return { ok: true };
}

function remainingForTeam(room: Room, team: Team): number {
  return room.board.filter((c) => !c.revealed && c.type === team).length;
}

export function guessCard(
  room: Room,
  player: Player,
  index: number,
): { ok: boolean; error?: string } {
  if (room.phase !== "playing") {
    return { ok: false, error: "Game is not in progress." };
  }
  if (player.role !== "operative" || player.team !== room.turn) {
    return { ok: false, error: "Only the active team's operatives can guess." };
  }
  if (!room.clue) {
    return { ok: false, error: "Wait for your spymaster to give a clue." };
  }
  if (index < 0 || index >= room.board.length) {
    return { ok: false, error: "Invalid card." };
  }
  const card = room.board[index];
  if (card.revealed) {
    return { ok: false, error: "That card is already revealed." };
  }

  card.revealed = true;
  const guessingTeam = player.team;
  const otherTeam: Team = guessingTeam === "red" ? "blue" : "red";

  if (card.type === "assassin") {
    addLog(room, `${cap(guessingTeam)} hit the ASSASSIN on "${card.word}"!`, guessingTeam);
    room.winner = otherTeam;
    room.phase = "finished";
    room.clue = null;
    addLog(room, `${cap(otherTeam)} team wins!`, otherTeam);
    return { ok: true };
  }

  addLog(room, `${cap(guessingTeam)} revealed "${card.word}" (${labelType(card.type)}).`, guessingTeam);

  // Check for a win after this reveal.
  const remaining = countRemaining(room);
  if (remaining[guessingTeam] === 0) {
    room.winner = guessingTeam;
    room.phase = "finished";
    room.clue = null;
    addLog(room, `${cap(guessingTeam)} team wins!`, guessingTeam);
    return { ok: true };
  }
  if (remaining[otherTeam] === 0) {
    // The guessing team revealed the other team's last card.
    room.winner = otherTeam;
    room.phase = "finished";
    room.clue = null;
    addLog(room, `${cap(otherTeam)} team wins!`, otherTeam);
    return { ok: true };
  }

  if (card.type === guessingTeam) {
    // Correct guess: continue if guesses remain.
    room.clue.guessesRemaining -= 1;
    if (room.clue.guessesRemaining <= 0) {
      endTurnInternal(room, "out of guesses");
    }
  } else {
    // Neutral or opponent card: turn ends.
    endTurnInternal(room, card.type === otherTeam ? "wrong team" : "neutral");
  }
  return { ok: true };
}

function endTurnInternal(room: Room, _reason: string): void {
  const next: Team = room.turn === "red" ? "blue" : "red";
  room.turn = next;
  room.clue = null;
  addLog(room, `Turn passes to ${cap(next)} team.`, next);
}

export function endTurn(
  room: Room,
  player: Player,
): { ok: boolean; error?: string } {
  if (room.phase !== "playing") {
    return { ok: false, error: "Game is not in progress." };
  }
  if (player.team !== room.turn) {
    return { ok: false, error: "It's not your team's turn." };
  }
  // Operatives can pass; a spymaster who hasn't given a clue cannot skip.
  if (player.role === "spymaster" && !room.clue) {
    return { ok: false, error: "Give a clue before ending the turn." };
  }
  endTurnInternal(room, "manual");
  return { ok: true };
}

function cap(team: Team): string {
  return team.charAt(0).toUpperCase() + team.slice(1);
}

function labelType(type: Card["type"]): string {
  switch (type) {
    case "red":
      return "Red";
    case "blue":
      return "Blue";
    case "neutral":
      return "Bystander";
    case "assassin":
      return "Assassin";
    case "agent":
      return "Agent";
  }
}

/**
 * Project the full room into the view a given player is allowed to see.
 * Card types are hidden from operatives until revealed or game over.
 */
export function toClientRoom(room: Room, playerId: string | null): ClientRoom {
  normalizeRoom(room);
  if (room.gameMode === "coop") {
    return toClientRoomCoop(room, playerId);
  }

  const you = playerId ? findPlayer(room, playerId) : null;
  const reveal =
    room.phase === "finished" || you?.role === "spymaster";

  const board: ClientCard[] = room.board.map((card) => {
    if (reveal || card.revealed) {
      return { word: card.word, revealed: card.revealed, type: card.type };
    }
    return { word: card.word, revealed: card.revealed };
  });

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
    remaining: countRemaining(room),
    customWords: room.customWords,
    customWordPercent: room.customWordPercent,
    gameMode: "classic",
    you: you ?? null,
  };
}

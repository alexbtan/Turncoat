export type Team = "red" | "blue";

export type CardType = Team | "neutral" | "assassin" | "agent";

export type Role = "spymaster" | "operative" | "guesser";

export type Phase = "lobby" | "playing" | "finished";

export type GameMode = "classic" | "coop";

/** Who wins a co-op game once it finishes. */
export type CoopOutcome = "agents" | "mole";

export interface Card {
  word: string;
  type: CardType;
  revealed: boolean;
}

export interface Player {
  id: string;
  name: string;
  team: Team | null;
  role: Role | null;
}

export interface Clue {
  word: string;
  number: number;
  guessesRemaining: number;
}

export interface LogEntry {
  id: string;
  ts: number;
  message: string;
  team?: Team;
}

export interface Room {
  code: string;
  hostId: string;
  players: Player[];
  board: Card[];
  turn: Team;
  startingTeam: Team;
  clue: Clue | null;
  phase: Phase;
  winner: Team | null;
  log: LogEntry[];
  /** Host-defined word list (uppercase, deduped). */
  customWords: string[];
  /** 0–100: share of board words drawn from customWords. */
  customWordPercent: number;
  /** Which ruleset this room is playing. */
  gameMode: GameMode;

  // ---- Co-op mole mode (only meaningful when gameMode === "coop") ----
  /** Total rounds (clues) the team gets to find all agents. */
  maxRounds: number;
  /** Rounds left before the mission times out. */
  roundsRemaining: number;
  /** Hidden: which player is the mole (null until game starts). */
  molePlayerId: string | null;
  /** cardIndex -> guesser ids currently voting for that card. */
  cardVotes: Record<number, string[]>;
  /** Guesser ids currently voting to end the round. */
  passVotes: string[];
  /** Guesser ids currently accusing the spymaster of being the mole. */
  accusations: string[];
  /** Who won once a co-op game is finished. */
  coopOutcome: CoopOutcome | null;

  createdAt: number;
  updatedAt: number;
}

/**
 * A card as seen by a particular client. `type` is only present when the
 * viewer is allowed to know it (spymaster, or the card has been revealed,
 * or the game is over).
 */
export interface ClientCard {
  word: string;
  revealed: boolean;
  type?: CardType;
}

/** The viewer's own player record, with co-op secret info attached. */
export interface ClientSelf extends Player {
  /** True only for the mole, sent only to that player (or to all at game end). */
  isMole?: boolean;
}

/** Room shape sent to clients via the polling endpoint. */
export interface ClientRoom {
  code: string;
  hostId: string;
  players: Player[];
  board: ClientCard[];
  turn: Team;
  startingTeam: Team;
  clue: Clue | null;
  phase: Phase;
  winner: Team | null;
  log: LogEntry[];
  remaining: { red: number; blue: number };
  customWords: string[];
  customWordPercent: number;
  gameMode: GameMode;

  // ---- Co-op mole mode (present when gameMode === "coop") ----
  maxRounds?: number;
  roundsRemaining?: number;
  agentsRemaining?: number;
  cardVotes?: Record<number, string[]>;
  passVotes?: string[];
  accusations?: string[];
  coopOutcome?: CoopOutcome | null;
  /** Revealed to everyone only once the game is finished. */
  moleReveal?: { playerId: string; role: Role } | null;

  you: ClientSelf | null;
}

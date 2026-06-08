import type { Clue, GameMode, LogEntry, Team } from "./types";

export interface PastClue {
  word: string;
  number: number;
  team?: Team;
  ts: number;
}

const COOP_CLUE = /^Spymaster: "([^"]+)" (\d+)$/;
const CLASSIC_CLUE = /^(Red|Blue) spymaster: "([^"]+)" (\d+)$/i;

export function parseCluesFromLog(
  log: LogEntry[],
  gameMode: GameMode,
): PastClue[] {
  const out: PastClue[] = [];
  for (const entry of log) {
    if (gameMode === "coop") {
      const match = entry.message.match(COOP_CLUE);
      if (match) {
        out.push({
          word: match[1],
          number: Number(match[2]),
          ts: entry.ts,
        });
      }
      continue;
    }
    const match = entry.message.match(CLASSIC_CLUE);
    if (match) {
      out.push({
        team: match[1].toLowerCase() as Team,
        word: match[2],
        number: Number(match[3]),
        ts: entry.ts,
      });
    }
  }
  return out;
}

/** Clues from earlier rounds — excludes the clue currently in play. */
export function previousClues(
  log: LogEntry[],
  gameMode: GameMode,
  active: Clue | null,
): PastClue[] {
  const all = parseCluesFromLog(log, gameMode);
  if (!active || all.length === 0) return all;
  const last = all[all.length - 1];
  if (last.word === active.word && last.number === active.number) {
    return all.slice(0, -1);
  }
  return all;
}

export function isClueLogMessage(message: string, gameMode: GameMode): boolean {
  return gameMode === "coop"
    ? COOP_CLUE.test(message)
    : CLASSIC_CLUE.test(message);
}

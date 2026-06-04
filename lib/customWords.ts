export const MAX_CUSTOM_WORDS = 500;
export const MAX_WORD_LEN = 40;

/** Parse a textarea (one word per line, or comma/semicolon separated). */
export function parseCustomWords(input: string): string[] {
  const seen = new Set<string>();
  const out: string[] = [];

  for (const part of input.split(/[\n,;]+/)) {
    const word = part.trim().toUpperCase().replace(/\s+/g, " ");
    if (!word || word.length > MAX_WORD_LEN) continue;
    if (seen.has(word)) continue;
    seen.add(word);
    out.push(word);
    if (out.length >= MAX_CUSTOM_WORDS) break;
  }

  return out;
}

export function formatCustomWords(words: string[]): string {
  return words.join("\n");
}

/** How many of the 25 board slots will draw from the custom list. */
export function customSlotsForBoard(
  boardSize: number,
  customWordCount: number,
  customPercent: number,
): number {
  if (customWordCount === 0) return 0;
  const pct = Math.max(0, Math.min(100, Math.round(customPercent)));
  const target = Math.round((boardSize * pct) / 100);
  return Math.min(target, customWordCount, boardSize);
}

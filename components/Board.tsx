"use client";

import type { ClientCard, ClientRoom } from "@/lib/types";

interface Props {
  room: ClientRoom;
  canGuess: boolean;
  onGuess: (index: number) => void;
}

function tileClasses(card: ClientCard, keyView: boolean): string {
  if (card.revealed) {
    switch (card.type) {
      case "red":
        return "border-[var(--tc-red-border)] bg-[var(--tc-red)] text-[var(--tc-surface-raised)]";
      case "blue":
        return "border-[var(--tc-blue-border)] bg-[var(--tc-blue)] text-[var(--tc-surface-raised)]";
      case "agent":
        return "border-[var(--tc-green-border)] bg-[var(--tc-green)] text-[var(--tc-surface-raised)]";
      case "assassin":
        return "border-black bg-black text-[var(--tc-assassin-text)] ring-2 ring-[var(--tc-red-border)]";
      default:
        return "border-[var(--tc-neutral-revealed-border)] bg-[var(--tc-neutral-revealed-bg)] text-[var(--tc-text)] ring-2 ring-[var(--tc-neutral-revealed-border)] ring-offset-1 ring-offset-[var(--tc-bg)]";
    }
  }

  if (keyView && card.type) {
    switch (card.type) {
      case "red":
        return "border-[var(--tc-red-border)] bg-[var(--tc-red-bg)] text-[var(--tc-red)]";
      case "blue":
        return "border-[var(--tc-blue-border)] bg-[var(--tc-blue-bg)] text-[var(--tc-blue)]";
      case "agent":
        return "border-[var(--tc-green-border)] bg-[var(--tc-green-bg)] text-[var(--tc-green)]";
      case "assassin":
        return "border-black bg-black text-[var(--tc-assassin-text)] font-bold ring-2 ring-[var(--tc-red)] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.2)]";
      default:
        return "border-[var(--tc-neutral-border)] bg-[var(--tc-neutral-bg)] text-[var(--tc-muted)]";
    }
  }

  return "border-[var(--tc-border)] bg-[var(--tc-surface-raised)] text-[var(--tc-text)] hover:border-[var(--tc-border-strong)]";
}

function CardLabel({ card, keyView }: { card: ClientCard; keyView: boolean }) {
  if (card.type === "assassin" && (card.revealed || keyView)) {
    return (
      <>
        <span className="text-[7px] font-bold uppercase tracking-[0.2em] text-white/75 sm:text-[8px]">
          Assassin
        </span>
        <span
          className={`mt-0.5 max-w-full px-0.5 leading-tight ${
            card.revealed ? "text-[8px] line-through opacity-70 sm:text-[9px]" : ""
          }`}
        >
          {card.word}
        </span>
      </>
    );
  }

  if (card.revealed && card.type === "neutral") {
    return (
      <>
        <span className="text-[7px] font-bold uppercase tracking-[0.15em] text-[var(--tc-neutral-revealed-label)] sm:text-[8px]">
          Bystander
        </span>
        <span className="mt-0.5 max-w-full px-0.5 leading-tight line-through decoration-2 decoration-[var(--tc-neutral-revealed-label)] opacity-80">
          {card.word}
        </span>
      </>
    );
  }

  return <span className="max-w-full px-0.5">{card.word}</span>;
}

export function Board({ room, canGuess, onGuess }: Props) {
  const keyView = room.you?.role === "spymaster" || room.you?.isMole === true;
  const isCoop = room.gameMode === "coop";
  const youId = room.you?.id;
  const nameOf = (id: string) =>
    room.players.find((p) => p.id === id)?.name ?? "?";

  return (
    <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
      {room.board.map((card, i) => {
        const clickable = canGuess && !card.revealed;
        const voters = isCoop ? room.cardVotes?.[i] ?? [] : [];
        const hasVotes = voters.length > 0 && !card.revealed;

        return (
          <button
            key={i}
            type="button"
            disabled={!clickable}
            onClick={() => clickable && onGuess(i)}
            className={`relative flex aspect-[5/3] flex-col items-center justify-center rounded border px-0.5 text-center text-[9px] font-semibold uppercase leading-tight tracking-wide transition sm:text-xs ${tileClasses(
              card,
              keyView,
            )} ${clickable ? "cursor-pointer active:translate-y-px" : "cursor-default"} ${
              hasVotes ? "outline outline-2 outline-offset-1 outline-[var(--tc-border-strong)]" : ""
            }`}
          >
            <CardLabel card={card} keyView={keyView} />

            {hasVotes && (
              <span className="absolute -right-1 -top-1 flex gap-px">
                {voters.map((id) => (
                  <span
                    key={id}
                    title={nameOf(id)}
                    className={`flex h-4 w-4 items-center justify-center rounded-sm border border-[var(--tc-border-strong)] text-[8px] font-bold ${
                      id === youId
                        ? "bg-[var(--tc-accent)] text-[var(--tc-surface-raised)]"
                        : "bg-[var(--tc-warn-bg)] text-[var(--tc-text)]"
                    }`}
                  >
                    {nameOf(id).charAt(0).toUpperCase()}
                  </span>
                ))}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

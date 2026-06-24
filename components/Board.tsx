"use client";

import type { CardType, ClientCard, ClientRoom } from "@/lib/types";

interface Props {
  room: ClientRoom;
  canGuess: boolean;
  onGuess: (index: number) => void;
}

type TileKind = "red" | "blue" | "agent" | "neutral" | "assassin";

function tileKind(type: CardType | undefined): TileKind {
  switch (type) {
    case "red":
    case "blue":
    case "agent":
    case "assassin":
      return type;
    default:
      return "neutral";
  }
}

function tileClasses(card: ClientCard, keyView: boolean): string {
  const classes = ["tc-tile"];

  if (card.revealed && card.type) {
    classes.push(`tc-tile--${tileKind(card.type)}`, "tc-tile--revealed");
    return classes.join(" ");
  }

  if (keyView && card.type) {
    classes.push(`tc-tile--${tileKind(card.type)}`, "tc-tile--key");
    return classes.join(" ");
  }

  classes.push("tc-tile--hidden");
  return classes.join(" ");
}

const TYPE_BADGE: Record<
  TileKind,
  { symbol: string; label: string; badgeClass: string }
> = {
  red: { symbol: "—", label: "Red", badgeClass: "tc-type-badge--red" },
  blue: { symbol: "|", label: "Blue", badgeClass: "tc-type-badge--blue" },
  agent: { symbol: "+", label: "Agent", badgeClass: "tc-type-badge--agent" },
  neutral: { symbol: "○", label: "Bystander", badgeClass: "tc-type-badge--neutral" },
  assassin: { symbol: "×", label: "Assassin", badgeClass: "tc-type-badge--assassin" },
};

function TypeBadge({ type }: { type: TileKind }) {
  const { symbol, label, badgeClass } = TYPE_BADGE[type];
  return (
    <span
      className={`tc-type-badge ${badgeClass}`}
      title={label}
      aria-label={label}
    >
      {symbol}
    </span>
  );
}

function CardLabel({ card, keyView }: { card: ClientCard; keyView: boolean }) {
  if (card.type === "assassin" && (card.revealed || keyView)) {
    return (
      <>
        <span className="absolute left-0 right-0 top-0.5 text-center text-[6px] font-bold uppercase tracking-[0.15em] text-white/75 sm:text-[7px]">
          Assassin
        </span>
        <span
          className={`max-w-full truncate px-0.5 leading-tight ${
            card.revealed ? "text-[8px] line-through opacity-70 sm:text-[9px]" : ""
          }`}
        >
          {card.word}
        </span>
      </>
    );
  }

  if (card.revealed && card.type === "agent") {
    return (
      <>
        <span className="absolute left-0 right-0 top-0.5 text-center text-[6px] font-bold uppercase tracking-[0.1em] text-white/80 sm:text-[7px]">
          Agent
        </span>
        <span className="max-w-full truncate px-0.5 leading-tight">
          {card.word}
        </span>
      </>
    );
  }

  if (card.revealed && card.type === "neutral") {
    return (
      <>
        <span className="absolute left-0 right-0 top-0.5 text-center text-[6px] font-bold uppercase tracking-[0.1em] text-[var(--tc-neutral-revealed-label)] sm:text-[7px]">
          Bystander
        </span>
        <span className="max-w-full truncate px-0.5 leading-tight line-through decoration-2 decoration-[var(--tc-neutral-revealed-label)] opacity-80">
          {card.word}
        </span>
      </>
    );
  }

  if (card.revealed && (card.type === "red" || card.type === "blue")) {
    const team = card.type === "red" ? "Red" : "Blue";
    return (
      <>
        <span className="absolute left-0 right-0 top-0.5 text-center text-[6px] font-bold uppercase tracking-[0.1em] text-white/80 sm:text-[7px]">
          {team}
        </span>
        <span className="max-w-full truncate px-0.5 leading-tight">
          {card.word}
        </span>
      </>
    );
  }

  return <span className="max-w-full truncate px-0.5">{card.word}</span>;
}

export function Board({ room, canGuess, onGuess }: Props) {
  const keyView = room.you?.role === "spymaster" || room.you?.isMole === true;
  const isCoop = room.gameMode === "coop";
  const youId = room.you?.id;
  const nameOf = (id: string) =>
    room.players.find((p) => p.id === id)?.name ?? "?";

  return (
    <div className="grid aspect-[5/3] w-full grid-cols-5 grid-rows-5 gap-1.5 sm:gap-2">
      {room.board.map((card, i) => {
        const clickable = canGuess && !card.revealed;
        const voters = isCoop ? room.cardVotes?.[i] ?? [] : [];
        const hasVotes = voters.length > 0 && !card.revealed;
        const showTypeBadge =
          keyView && !!card.type && !card.revealed;

        return (
          <button
            key={i}
            type="button"
            disabled={!clickable}
            onClick={() => clickable && onGuess(i)}
            className={`relative flex h-full min-h-0 w-full flex-col items-center justify-center overflow-hidden rounded px-0.5 text-center text-[9px] font-semibold uppercase leading-tight tracking-wide transition sm:text-xs ${tileClasses(
              card,
              keyView,
            )} ${clickable ? "cursor-pointer active:translate-y-px" : "cursor-default"} ${
              hasVotes ? "outline outline-2 outline-[var(--tc-border-strong)]" : ""
            }`}
          >
            {showTypeBadge && card.type && (
              <TypeBadge type={tileKind(card.type)} />
            )}

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

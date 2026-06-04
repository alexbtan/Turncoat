"use client";

import type { ClientCard, ClientRoom } from "@/lib/types";

interface Props {
  room: ClientRoom;
  canGuess: boolean;
  onGuess: (index: number) => void;
}

function tileClasses(card: ClientCard, keyView: boolean): string {
  // Revealed cards always show their true color.
  if (card.revealed) {
    switch (card.type) {
      case "red":
        return "bg-red-600 text-white border-red-700";
      case "blue":
        return "bg-blue-600 text-white border-blue-700";
      case "agent":
        return "bg-emerald-600 text-white border-emerald-700";
      case "assassin":
        return "bg-slate-950 text-slate-500 border-black";
      default:
        return "bg-amber-200/80 text-amber-950 border-amber-300";
    }
  }

  // Spymaster/mole sees the key as a colored tint on unrevealed cards.
  if (keyView && card.type) {
    switch (card.type) {
      case "red":
        return "bg-red-500/20 text-red-100 border-red-500/50 ring-1 ring-red-500/30";
      case "blue":
        return "bg-blue-500/20 text-blue-100 border-blue-500/50 ring-1 ring-blue-500/30";
      case "agent":
        return "bg-emerald-500/20 text-emerald-100 border-emerald-500/50 ring-1 ring-emerald-500/30";
      case "assassin":
        return "bg-slate-800 text-slate-100 border-slate-500 ring-2 ring-slate-400";
      default:
        return "bg-amber-500/10 text-amber-100 border-amber-500/30";
    }
  }

  // Guesser / unknown view.
  return "bg-slate-800 text-slate-100 border-slate-700 hover:border-slate-500";
}

export function Board({ room, canGuess, onGuess }: Props) {
  const keyView = room.you?.role === "spymaster" || room.you?.isMole === true;
  const isCoop = room.gameMode === "coop";
  const youId = room.you?.id;
  const nameOf = (id: string) =>
    room.players.find((p) => p.id === id)?.name ?? "?";

  return (
    <div className="grid grid-cols-5 gap-2 sm:gap-3">
      {room.board.map((card, i) => {
        const clickable = canGuess && !card.revealed;
        const voters = isCoop ? room.cardVotes?.[i] ?? [] : [];
        return (
          <button
            key={i}
            disabled={!clickable}
            onClick={() => clickable && onGuess(i)}
            className={`relative flex aspect-[5/3] items-center justify-center rounded-lg border px-1 text-center text-[10px] font-bold uppercase leading-tight tracking-wide transition sm:text-sm ${tileClasses(
              card,
              keyView,
            )} ${clickable ? "cursor-pointer hover:scale-[1.03]" : "cursor-default"} ${
              card.revealed ? "opacity-90" : ""
            } ${voters.length > 0 && !card.revealed ? "ring-2 ring-yellow-400/70" : ""}`}
          >
            {card.type === "assassin" && card.revealed ? "ASSASSIN" : card.word}

            {/* Co-op vote chips */}
            {voters.length > 0 && !card.revealed && (
              <span className="absolute -right-1 -top-1 flex gap-0.5">
                {voters.map((id) => (
                  <span
                    key={id}
                    title={nameOf(id)}
                    className={`flex h-4 w-4 items-center justify-center rounded-full text-[8px] font-bold text-slate-900 ${
                      id === youId ? "bg-yellow-300" : "bg-yellow-400/90"
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

"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { customSlotsForBoard, formatCustomWords } from "@/lib/customWords";
import { BOARD_SIZE } from "@/lib/game";
import type { ClientRoom } from "@/lib/types";

interface Props {
  room: ClientRoom;
  isHost: boolean;
  onSave: (customWordsText: string, customWordPercent: number) => void;
  busy: boolean;
}

export function CustomWordsPanel({ room, isHost, onSave, busy }: Props) {
  const serverText = formatCustomWords(room.customWords);
  const serverPercent = room.customWordPercent;

  const [text, setText] = useState(serverText);
  const [percent, setPercent] = useState(serverPercent);
  const [dirty, setDirty] = useState(false);
  const wasBusy = useRef(false);

  // Sync from server only when the user is not mid-edit (polls every ~1.5s).
  useEffect(() => {
    if (dirty) return;
    setText(serverText);
    setPercent(serverPercent);
  }, [serverText, serverPercent, dirty]);

  // After a successful save, apply server state and clear dirty.
  useEffect(() => {
    if (wasBusy.current && !busy) {
      setText(serverText);
      setPercent(serverPercent);
      setDirty(false);
    }
    wasBusy.current = busy;
  }, [busy, serverText, serverPercent]);

  const preview = useMemo(() => {
    const lines = text
      .split(/[\n,;]+/)
      .map((s) => s.trim())
      .filter(Boolean);
    const unique = new Set(lines.map((w) => w.toUpperCase()));
    const count = unique.size;
    const slots = customSlotsForBoard(BOARD_SIZE, count, percent);
    const defaultSlots = BOARD_SIZE - slots;
    if (count === 0) {
      return `All ${BOARD_SIZE} words will come from the classic list.`;
    }
    if (percent === 0) {
      return `${count} custom word${count === 1 ? "" : "s"} saved — slider at 0%, so the classic list is used until you raise it.`;
    }
    return `About ${slots} of ${BOARD_SIZE} board words from your list (${count} available), ${defaultSlots} from the classic list.`;
  }, [text, percent]);

  if (!isHost) {
    if (room.customWords.length === 0 && room.customWordPercent === 0) {
      return null;
    }
    const slots = customSlotsForBoard(
      BOARD_SIZE,
      room.customWords.length,
      room.customWordPercent,
    );
    return (
      <div className="mb-6 rounded-xl border border-slate-800 bg-slate-900/50 p-4 text-sm text-slate-400">
        <p className="font-semibold text-slate-300">Custom words</p>
        <p className="mt-1">
          Host set {room.customWordPercent}% custom ({slots} of {BOARD_SIZE}{" "}
          slots) — {room.customWords.length} word
          {room.customWords.length === 1 ? "" : "s"} in list.
        </p>
      </div>
    );
  }

  return (
    <div className="mb-6 rounded-xl border border-slate-800 bg-slate-900/60 p-4">
      <h3 className="text-sm font-bold uppercase tracking-wide text-slate-300">
        Custom words
      </h3>
      <p className="mt-1 text-xs text-slate-500">
        One word per line (commas work too). Saved words are mixed into each new
        game based on the slider.
      </p>

      <textarea
        value={text}
        onChange={(e) => {
          setDirty(true);
          setText(e.target.value);
        }}
        placeholder={"PIZZA\nEINSTEIN\nSTAR WARS"}
        rows={6}
        className="mt-3 w-full resize-y rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 font-mono text-sm text-slate-100 outline-none ring-violet-500/40 focus:ring-2"
      />

      <div className="mt-4">
        <div className="flex items-center justify-between text-sm">
          <label htmlFor="custom-percent" className="text-slate-300">
            Custom word mix
          </label>
          <span className="font-mono font-semibold text-violet-300">
            {percent}%
          </span>
        </div>
        <input
          id="custom-percent"
          type="range"
          min={0}
          max={100}
          step={5}
          value={percent}
          onChange={(e) => {
            setDirty(true);
            setPercent(Number(e.target.value));
          }}
          className="mt-2 w-full accent-violet-500"
        />
        <div className="mt-1 flex justify-between text-xs text-slate-600">
          <span>0% classic only</span>
          <span>100% custom only</span>
        </div>
      </div>

      <p className="mt-3 text-xs text-slate-500">{preview}</p>
      {dirty && (
        <p className="mt-2 text-xs text-amber-400/90">Unsaved changes</p>
      )}

      <button
        type="button"
        onClick={() => onSave(text, percent)}
        disabled={busy}
        className="mt-4 w-full rounded-lg border border-violet-500/40 bg-violet-500/15 px-4 py-2 text-sm font-semibold text-violet-100 transition hover:bg-violet-500/25 disabled:opacity-50"
      >
        {busy ? "Saving..." : "Save word settings"}
      </button>
    </div>
  );
}

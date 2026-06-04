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

  useEffect(() => {
    if (dirty) return;
    setText(serverText);
    setPercent(serverPercent);
  }, [serverText, serverPercent, dirty]);

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
      return `All ${BOARD_SIZE} words will come from the default list.`;
    }
    if (percent === 0) {
      return `${count} custom word${count === 1 ? "" : "s"} saved — mix is 0%, so only the default list is used.`;
    }
    return `About ${slots} of ${BOARD_SIZE} from your list (${count} available), ${defaultSlots} from the default list.`;
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
      <div className="tc-panel-inset mb-6 text-sm">
        <p className="font-medium">Custom words</p>
        <p className="tc-muted mt-1">
          Host set {room.customWordPercent}% custom ({slots} of {BOARD_SIZE} slots)
          — {room.customWords.length} word
          {room.customWords.length === 1 ? "" : "s"} in list.
        </p>
      </div>
    );
  }

  return (
    <div className="tc-panel mb-6">
      <h3 className="tc-section-title">Custom words</h3>
      <p className="tc-muted mt-1 text-xs leading-relaxed">
        One word per line (commas work too). Applied when a new game starts.
      </p>

      <textarea
        value={text}
        onChange={(e) => {
          setDirty(true);
          setText(e.target.value);
        }}
        placeholder={"PIZZA\nEINSTEIN\nSTAR WARS"}
        rows={6}
        className="tc-input mt-3 resize-y font-mono text-sm"
      />

      <div className="mt-4">
        <div className="flex items-center justify-between text-sm">
          <label htmlFor="custom-percent" className="font-medium">
            Custom mix
          </label>
          <span className="font-mono text-sm font-semibold">{percent}%</span>
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
          className="tc-range"
        />
        <div className="tc-muted mt-1 flex justify-between text-xs">
          <span>Default list only</span>
          <span>Custom list only</span>
        </div>
      </div>

      <p className="tc-muted mt-3 text-xs leading-relaxed">{preview}</p>
      {dirty && (
        <p className="mt-2 text-xs font-medium text-[var(--tc-warn-border)]">
          Unsaved changes
        </p>
      )}

      <button
        type="button"
        onClick={() => onSave(text, percent)}
        disabled={busy}
        className="tc-btn-secondary mt-4 w-full"
      >
        {busy ? "Saving…" : "Save word settings"}
      </button>
    </div>
  );
}

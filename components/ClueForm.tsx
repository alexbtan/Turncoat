"use client";

import { useState } from "react";

interface Props {
  onSubmit: (word: string, number: number) => void;
  busy: boolean;
}

export function ClueForm({ onSubmit, busy }: Props) {
  const [word, setWord] = useState("");
  const [number, setNumber] = useState(1);

  function submit() {
    if (!word.trim()) return;
    onSubmit(word.trim(), number);
    setWord("");
    setNumber(1);
  }

  return (
    <div className="tc-panel">
      <h3 className="tc-section-title mb-3">Give a clue</h3>
      <div className="flex gap-2">
        <input
          value={word}
          onChange={(e) => setWord(e.target.value)}
          placeholder="One word"
          className="tc-input min-w-0 flex-1"
          onKeyDown={(e) => {
            if (e.key === "Enter") submit();
          }}
        />
        <select
          value={number}
          onChange={(e) => setNumber(Number(e.target.value))}
          className="tc-input w-auto shrink-0"
          aria-label="Clue number"
        >
          {Array.from({ length: 10 }, (_, i) => (
            <option key={i} value={i}>
              {i === 0 ? "0 (∞)" : i}
            </option>
          ))}
        </select>
      </div>
      <button
        type="button"
        onClick={submit}
        disabled={busy || !word.trim()}
        className="tc-btn-primary mt-3 w-full"
      >
        {busy ? "Sending…" : "Submit clue"}
      </button>
    </div>
  );
}

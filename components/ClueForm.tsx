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
    <div className="rounded-xl border border-slate-700 bg-slate-900/70 p-4">
      <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-300">
        Give a clue
      </h3>
      <div className="flex gap-2">
        <input
          value={word}
          onChange={(e) => setWord(e.target.value)}
          placeholder="One word"
          className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 outline-none ring-blue-500/40 focus:ring-2"
          onKeyDown={(e) => {
            if (e.key === "Enter") submit();
          }}
        />
        <select
          value={number}
          onChange={(e) => setNumber(Number(e.target.value))}
          className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 outline-none"
        >
          {Array.from({ length: 10 }, (_, i) => (
            <option key={i} value={i}>
              {i === 0 ? "0 (∞)" : i}
            </option>
          ))}
        </select>
      </div>
      <button
        onClick={submit}
        disabled={busy || !word.trim()}
        className="mt-3 w-full rounded-lg bg-emerald-600 px-4 py-2 font-semibold text-white transition hover:bg-emerald-500 disabled:opacity-50"
      >
        {busy ? "Sending..." : "Submit clue"}
      </button>
    </div>
  );
}

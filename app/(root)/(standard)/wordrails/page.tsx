"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const START_WORD = "cold";
const END_WORD = "warm";
const DICTIONARY = new Set(["cold", "cord", "card", "ward", "warm"]);
const MAX_RAILS = 6;

function isOneLetterDiff(a: string, b: string) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) diff++;
  }
  return diff === 1;
}

export default function Page() {
  const [rails, setRails] = useState<string[]>([START_WORD]);
  const [current, setCurrent] = useState("");

  const addRail = () => {
    const prev = rails[rails.length - 1];
    if (rails.length >= MAX_RAILS) return;
    if (!isOneLetterDiff(current, prev)) return;
    if (!DICTIONARY.has(current)) return;
    setRails([...rails, current]);
    setCurrent("");
  };

  const isComplete = rails[rails.length - 1] === END_WORD;

  return (
    <main className="p-4 space-y-4">
      <h1 className="text-2xl font-bold">Word Rails</h1>
      <p>
        Start: {START_WORD.toUpperCase()} → End: {END_WORD.toUpperCase()}
      </p>
      <ul className="space-y-1 font-mono">
        {rails.map((word, i) => (
          <li key={i}>{word}</li>
        ))}
      </ul>
      {!isComplete && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            addRail();
          }}
          className="space-y-2"
        >
          <Input
            value={current}
            onChange={(e) => setCurrent(e.target.value)}
            className="w-48"
          />
          <Button type="submit">Submit</Button>
        </form>
      )}
      {isComplete && (
        <p className="font-semibold">
          Puzzle complete in {rails.length - 1} rails!
        </p>
      )}
    </main>
  );
}

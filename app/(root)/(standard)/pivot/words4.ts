let WORDS4: string[] = [];

export async function loadWords4() {
  if (WORDS4.length) return WORDS4;          // already cached

  // Next.js: fetches from /public at runtime or build‑time (Edge / node).
  const res = await fetch('./4letter.txt');
  const text = await res.text();

  WORDS4 = Array.from(
    new Set(
      text
        .split(/\s+/)               // split on any whitespace
        .map(w => w.trim().toUpperCase())
        // keep *exactly* four letters, nothing else
        .filter(w => /^[A-Z]{4}$/.test(w))
    )
  );

  return WORDS4;
}


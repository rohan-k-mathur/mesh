// lib/bigintjson.ts
export function jsonSafe<T>(obj: T): T {
    return JSON.parse(
      JSON.stringify(obj, (_, v) => (typeof v === "bigint" ? Number(v) : v))
    );
  }

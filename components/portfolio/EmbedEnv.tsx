"use client";
import React, { createContext, useContext } from "react";

export type EmbedFit = "contain" | "cover";

type EmbedEnvValue = { inRepeater: boolean; fit: EmbedFit };
const EmbedEnv = createContext<EmbedEnvValue>({ inRepeater: false, fit: "contain" });

export function EmbedEnvProvider({
  value,
  children,
}: { value: Partial<EmbedEnvValue>; children: React.ReactNode }) {
  const merged = { inRepeater: false, fit: "contain" as EmbedFit, ...value };
  return <EmbedEnv.Provider value={merged}>{children}</EmbedEnv.Provider>;
}

export function useEmbedEnv() {
  return useContext(EmbedEnv);
}

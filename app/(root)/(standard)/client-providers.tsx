// app/(root)/(standard)/client-providers.tsx
"use client";
import { PrivateChatProvider } from "@/contexts/PrivateChatManager";

export default function ClientProviders({ children }: { children: React.ReactNode }) {
  return <PrivateChatProvider>{children}</PrivateChatProvider>;
}

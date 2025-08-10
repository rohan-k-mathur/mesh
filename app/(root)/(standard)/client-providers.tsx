"use client";
import { PrivateChatProvider } from "@/contexts/PrivateChatManager";
import PrivateChatDock from "@/components/chat/PrivateChatDock";
import MessagesRealtimeBootstrap from "@/components/chat/MessagesRealtimeBootstrap";
import { useAuth } from "@/lib/AuthContext";

export default function ClientProviders({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const me = user?.userId?.toString() ?? null;

  return (
    <PrivateChatProvider>
      {me && <MessagesRealtimeBootstrap me={me} />}  {/* one inbox listener */}
      <PrivateChatDock currentUserId={me ?? undefined} /> {/* one dock */}
      {children}
    </PrivateChatProvider>
  );
}

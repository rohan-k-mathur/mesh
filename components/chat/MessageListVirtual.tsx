"use client";
import * as React from "react";
import { Virtuoso, VirtuosoHandle } from "react-virtuoso";
import { Message } from "@/contexts/useChatStore";
/** Narrow item type: just your message DTO fields Virtuoso needs */
export type MessageItem = {
  id: string;
  createdAt: string; // ISO
  // ...your other message fields (senderId, attachments, etc.)
  currentUserId: string;
  conversationId: string;
  onOpen: (peerId: string, peerName: string, peerImage?: string | null) => void;
  onPrivateReply?: (m: Message) => void;
  onCreateOptions: (m: Message) => void;
  onCreateTemp: (m: Message) => void;
  onReplyInThread: (messageId: string) => void; // NEW onProposeAlternative: (rootMessageId: string) => void; onCompareProposals: (rootMessageId: string) => void; onMergeProposal: (rootMessageId: string) => void; onDelete: (id: string) => void;
};

type Props<T extends MessageItem> = {
  items: T[];
  renderItem: (m: T) => React.ReactNode;
  onReachTop?: () => void;
  /** Called when user leaves/returns to bottom; use it to toggle "scroll down" button */
  onBottomStateChange?: (atBottom: boolean) => void;
  follow?: boolean; // auto-follow when new items are appended
  ariaLabel?: string;
};

export function MessageListVirtual<T extends MessageItem>({
  items,
  renderItem,
  onReachTop,
  onBottomStateChange,
  follow = true,
  ariaLabel = "Room messages",
}: Props<T>) {
  const ref = React.useRef<VirtuosoHandle>(null);
  const initialIndexSet = React.useRef(false);

  // Roving focus index (kept stable across rerenders)
  const [focusIdx, setFocusIdx] = React.useState<number | null>(null);
  const clamp = React.useCallback(
    (n: number) => Math.max(0, Math.min(items.length - 1, n)),
    [items.length]
  );

  // Only set initial index once per mount
  const initialTopMostItemIndex =
    !initialIndexSet.current && items.length > 0
      ? ((initialIndexSet.current = true), items.length - 1)
      : undefined;

  return (
    <div role="region" aria-label={ariaLabel} className="h-full w-full">
      <Virtuoso
        ref={ref}
        data={items}
        className="h-full"
        computeItemKey={(_, item) => item.id}
        initialTopMostItemIndex={initialTopMostItemIndex}
        followOutput={follow ? "smooth" : false}
        atTopThreshold={120}
        startReached={() => onReachTop?.()}
        atBottomStateChange={(atBottom) => onBottomStateChange?.(atBottom)}
        increaseViewportBy={{ top: 400, bottom: 600 }}
        components={{
          List: React.forwardRef<
            HTMLDivElement,
            React.HTMLAttributes<HTMLDivElement>
          >(({ children, ...rest }, r) => (
            <div {...rest} role="list" ref={r} className="flex flex-col gap-2">
              {children}
            </div>
          )),
        }}
        itemContent={(index, item) => (
          <div
            role="listitem"
            data-id={item.id}
            tabIndex={focusIdx === index ? 0 : -1}
            aria-selected={focusIdx === index ? "true" : "false"}
            onKeyDown={(e) => {
              const key = e.key.toLowerCase();
              if (key === "arrowup") {
                e.preventDefault();
                setFocusIdx((p) => clamp((p ?? index) - 1));
              } else if (key === "arrowdown") {
                e.preventDefault();
                setFocusIdx((p) => clamp((p ?? index) + 1));
              } else if (key === "s") {
                window.dispatchEvent(
                  new CustomEvent("room:star", {
                    detail: { messageId: item.id },
                  })
                );
              } else if (key === "r") {
                window.dispatchEvent(
                  new CustomEvent("room:reply", {
                    detail: { messageId: item.id },
                  })
                );
              }
            }}
          >
            {renderItem(item)}
          </div>
        )}
      />
    </div>
  );
}

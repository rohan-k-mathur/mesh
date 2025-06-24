import { forwardRef, useImperativeHandle, useState } from "react";
import Cursor from "./Cursor";
import { COLORS } from "@/constants";
import { UserStatus } from "@/lib/definitions";
import { mergeArrays } from "@/lib/utils";
import { useReactFlow } from "@xyflow/react";

export type LiveCursorHandles = {
  triggerUserUpdate: (payload: UserStatus) => void;
  triggerUserJoin: (newUserStatuses: UserStatus[]) => void;
};

interface Props {
  offset: { top: number; left: number };
}

// display all other live cursors
const LiveCursors = forwardRef<LiveCursorHandles, Props>((props, ref) => {
  const [otherUsers, setOtherUsers] = useState<UserStatus[]>([]);
  const { flowToScreenPosition } = useReactFlow();
  // Expose methods to the parent using the ref
  useImperativeHandle(ref, () => ({
    triggerUserUpdate(payload: UserStatus) {
      // This function can be called from the parent component
      setOtherUsers(
        otherUsers.map((otherUser: UserStatus) =>
          otherUser.username === payload.username
            ? {
                ...otherUser,
                mousePosition: payload.mousePosition,
              }
            : otherUser
        )
      );
    },
    triggerUserJoin(newUserStatuses: UserStatus[]) {
      setOtherUsers(mergeArrays(otherUsers, newUserStatuses));
    },
  }));
  if (!otherUsers || otherUsers.length === 0) {
    return <></>;
  }
  return otherUsers.map((otherUser: UserStatus) => {
    if (!otherUser.mousePosition) {
      return <></>;
    }
    const positionOnScreen = flowToScreenPosition(otherUser.mousePosition);
    return (
      <Cursor
        key={otherUser.username}
        color={COLORS[Number(otherUser.username.charCodeAt(0)) % COLORS.length]}
        x={positionOnScreen.x - props.offset.left}
        y={positionOnScreen.y - props.offset.top}
        username={otherUser.username}
      />
    );
  });
});
LiveCursors.displayName = "LiveCursors";

export default LiveCursors;

import { Panel } from "@xyflow/react";
import LikeButton from "../buttons/LikeButton";
import LockButton from "../buttons/LockButton";
import GenerateButton from "../buttons/GenerateButton";
type Props = {
  lockOnClick: (lockState: boolean) => void;
  isOwned: boolean;
  isLocked: boolean;
  realtimePostId: string;
  generateOnClick?: (evt: React.MouseEvent<HTMLButtonElement>) => void;
};

const NodeButtons = ({
  lockOnClick,
  isLocked,
  isOwned,
  realtimePostId,
  generateOnClick,
}: Props) => {
  return (
    <>
      <Panel position="bottom-left">
        <LockButton
          isLocked={isLocked}
          isOwned={isOwned}
          lockOnClick={lockOnClick}
        />
      </Panel>
      {generateOnClick && (
        <Panel position="bottom-center">
          <GenerateButton generateOnClick={generateOnClick} />
        </Panel>
      )}
      <Panel position="bottom-right">
        <LikeButton
          realtimePostId={realtimePostId}
          likeCount={0}
          initialLikeState={null}
        />
      </Panel>
    </>
  );
};

export default NodeButtons;

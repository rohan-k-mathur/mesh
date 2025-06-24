import {
  deleteRealtimePost,
  lockRealtimePost,
} from "@/lib/actions/realtimepost.actions";
import useStore from "@/lib/reactflow/store";
import { AppNodeType, AppState, AuthorOrAuthorId } from "@/lib/reactflow/types";
import { Handle, Panel, Position } from "@xyflow/react";
import { usePathname } from "next/navigation";
import { useShallow } from "zustand/react/shallow";
import NodeDropdown from "../buttons/NodeDropdown";
import NodeAuthorDisplay from "../reactflow/NodeAuthorDisplay";
import NodeButtons from "../reactflow/NodeButtons";
import { useAuth } from "@/lib/AuthContext";

interface Props {
  modalContent?: React.ReactNode;
  isOwned: boolean;
  isLocked: boolean;
  id: string;
  author: AuthorOrAuthorId;
  type: AppNodeType;
  children: React.ReactNode;
  generateOnClick?: (evt: React.MouseEvent<HTMLButtonElement>) => void;
}

function BaseNode({
  modalContent,
  isOwned,
  isLocked,
  id,
  author,
  type,
  children,
  generateOnClick,
}: Props) {
  const store = useStore(
    useShallow((state: AppState) => ({
      openModal: state.openModal,
      removeNode: state.removeNode,
    }))
  );
  const user = useAuth().user;
  const pathname = usePathname();

  const deleteNode = () => {
    store.removeNode(id);
    deleteRealtimePost({
      id: id,
    });
  };

  const lockOnClick = async (newLockState: boolean) => {
    await lockRealtimePost({ id, lockState: newLockState, path: pathname });
  };

  const canDrag = user && !isLocked;

  return (
    <div className={canDrag ? "" : "nodrag"}>
      <div
        onClick={() =>
          !isOwned && modalContent ? store.openModal(modalContent) : null
        }
        className="bg-[#A7C7E7] rounded-md"
      >
        {children}
      </div>
      <NodeButtons
        lockOnClick={lockOnClick}
        generateOnClick={generateOnClick}
        isLocked={isLocked}
        isOwned={isOwned}
        realtimePostId={id}
      />
      <NodeAuthorDisplay author={author} />
      <Panel position="top-right">
        <NodeDropdown
          isOwned={isOwned}
          modalContent={modalContent}
          deleteOnClick={deleteNode}
        ></NodeDropdown>
      </Panel>
      <Handle
        type="target"
        position={Position.Top}
        className="w-16 h-2 rounded-sm"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        className="w-16 h-2 rounded-sm"
      />
    </div>
  );
}

export default BaseNode;

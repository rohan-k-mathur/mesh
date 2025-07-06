import { fetchUser } from "@/lib/actions/user.actions";
import { updateRealtimePost } from "@/lib/actions/realtimepost.actions";
import { useAuth } from "@/lib/AuthContext";
import useStore from "@/lib/reactflow/store";
import { AppState, AuthorOrAuthorId } from "@/lib/reactflow/types";
import { PluginDescriptor } from "@/lib/pluginLoader";
import { SplineViewerPostValidation } from "@/lib/validations/thread";
import BaseNode from "@/components/nodes/BaseNode";
import SplineViewerNodeModal from "@/components/modals/SplineViewerNodeModal";
import { NodeProps } from "@xyflow/react";
import { useEffect, useState, Suspense } from "react";
import { usePathname } from "next/navigation";
import { z } from "zod";
import { useShallow } from "zustand/react/shallow";
import Spline from "@splinetool/react-spline";

interface SplineViewerNodeData {
  sceneUrl?: string;
  author: AuthorOrAuthorId;
  locked: boolean;
}

function SplineViewerNode({ id, data }: NodeProps<SplineViewerNodeData>) {
  const path = usePathname();
  const currentUser = useAuth().user;
  const store = useStore(
    useShallow((state: AppState) => ({
      closeModal: state.closeModal,
    }))
  );
  const [author, setAuthor] = useState(data.author);
  const [url, setUrl] = useState(data.sceneUrl || "");

  useEffect(() => {
    if ("username" in author) return;
    fetchUser(data.author.id).then((user) => user && setAuthor(user));
  }, [author, data.author.id]);

  const isOwned = currentUser ? Number(currentUser.userId) === Number(data.author.id) : false;

  const onSubmit = (values: z.infer<typeof SplineViewerPostValidation>) => {
    setUrl(values.sceneUrl);
    updateRealtimePost({
      id,
      path,
      pluginType: "SPLINE_VIEWER",
      pluginData: { sceneUrl: values.sceneUrl },
    });
    store.closeModal();
  };

  return (
    <BaseNode
      modalContent={
        <SplineViewerNodeModal
          id={id}
          isOwned={isOwned}
          currentUrl={url}
          onSubmit={onSubmit}
        />
      }
      id={id}
      author={author}
      isOwned={isOwned}
      type="PLUGIN"
      isLocked={data.locked}
    >
      <div className="yt-container">
        <Suspense fallback={<div>Loading...</div>}>
          {url && <Spline scene={url} className="yt-frame nodrag w-[30vw] h-[30vw]" />}
        </Suspense>
      </div>
    </BaseNode>
  );
}

export const descriptor: PluginDescriptor = {
  type: "SPLINE_VIEWER",
  component: SplineViewerNode,
  config: { label: "Spline Viewer" },
};

export default SplineViewerNode;

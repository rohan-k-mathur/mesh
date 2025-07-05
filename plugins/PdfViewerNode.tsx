import { fetchUser } from "@/lib/actions/user.actions";
import { updateRealtimePost } from "@/lib/actions/realtimepost.actions";
import { useAuth } from "@/lib/AuthContext";
import useStore from "@/lib/reactflow/store";
import { AppState, AuthorOrAuthorId } from "@/lib/reactflow/types";
import { PluginDescriptor } from "@/lib/pluginLoader";
import { PdfViewerPostValidation } from "@/lib/validations/thread";
import BaseNode from "@/components/nodes/BaseNode";
import PdfViewerNodeModal from "@/components/modals/PdfViewerNodeModal";
import { NodeProps } from "@xyflow/react";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { z } from "zod";
import { useShallow } from "zustand/react/shallow";

interface PdfViewerNodeData {
  pdfUrl?: string;
  author: AuthorOrAuthorId;
  locked: boolean;
}

function PdfViewerNode({ id, data }: NodeProps<PdfViewerNodeData>) {
  const path = usePathname();
  const currentUser = useAuth().user;
  const store = useStore(
    useShallow((state: AppState) => ({
      closeModal: state.closeModal,
    }))
  );
  const [author, setAuthor] = useState(data.author);
  const [url, setUrl] = useState(data.pdfUrl || "");

  useEffect(() => {
    if ("username" in author) return;
    fetchUser(data.author.id).then((user) => user && setAuthor(user));
  }, [author, data.author.id]);

  const isOwned = currentUser
    ? Number(currentUser.userId) === Number(data.author.id)
    : false;

  const onSubmit = (values: z.infer<typeof PdfViewerPostValidation>) => {
    setUrl(values.pdfUrl);
    updateRealtimePost({
      id,
      path,
      pluginType: "PDF_VIEWER",
      pluginData: { pdfUrl: values.pdfUrl },
    });
    store.closeModal();
  };

  return (
    <BaseNode
      modalContent={
        <PdfViewerNodeModal
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
      <object
        data={url}
        type="application/pdf"
        width="100%"
        height="400"
      >
        <p>
          <a href={url}>Download PDF</a>
        </p>
      </object>
    </BaseNode>
  );
}

export const descriptor: PluginDescriptor = {
  type: "PDF_VIEWER",
  component: PdfViewerNode,
  config: { label: "PDF Viewer" },
};

export default PdfViewerNode;

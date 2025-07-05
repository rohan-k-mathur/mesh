
import { fetchUser } from "@/lib/actions/user.actions";
import { updateRealtimePost } from "@/lib/actions/realtimepost.actions";
import { useAuth } from "@/lib/AuthContext";
import { PluginDescriptor } from "@/lib/pluginLoader";
import { AuthorOrAuthorId, AudioNode as AudioNodeType } from "@/lib/reactflow/types";

import BaseNode from "@/components/nodes/BaseNode";
import { useEffect, useRef, useState } from "react";
import { Handle, NodeProps, Position, useReactFlow } from "@xyflow/react";
import { usePathname } from "next/navigation";
import * as Tone from "tone";
import Image from "next/image";


interface PDFNodeData {
  pdfurl: string;
  author: AuthorOrAuthorId;
  locked: boolean;
}

function PdfViewerNode({ id, data }: NodeProps<PDFNodeData>) {
  const path = usePathname();
  const currentUser = useAuth().user;
  const [author, setAuthor] = useState(data.author);
  const [token, setToken] = useState("");
  const [pdfurl, setpdfurl] = useState(data.pdfurl);
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if ("username" in author) return;
    fetchUser(data.author.id).then((user) => user && setAuthor(user));
  }, [author, data.author.id]);

  //const isOwned = Number(user!.userId) === Number(data.author.id);



  return (
    <BaseNode modalContent={null} id={id} author={author} isOwned={true} type="PLUGIN" isLocked={data.locked}>
      <div
        className=" img-frame h-full"
      >
         <object data="https://files.libcom.org/files/Franz%20Kafka-The%20Castle%20(Oxford%20World's%20Classics)%20(2009).pdf" type="application/pdf" width="100%" height="100%">
      <p>Alternative text - include a link <a href="https://files.libcom.org/files/Franz%20Kafka-The%20Castle%20(Oxford%20World's%20Classics)%20(2009).pdf">to the PDF!</a></p>
  </object>
  </div>
    </BaseNode>
  );
}

export const descriptor: PluginDescriptor = {
  type: "PDF_VIEWER",
  component: PdfViewerNode,
  config: { label: "PDF Viewer" },
};

export default PdfViewerNode;

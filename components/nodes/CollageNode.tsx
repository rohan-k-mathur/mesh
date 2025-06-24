"use client";

import { NodeProps, useReactFlow } from "@xyflow/react";
import { useEffect, useMemo, useState, CSSProperties } from "react";
import { usePathname } from "next/navigation";
import Image from "next/image";

import { useAuth } from "@/lib/AuthContext";
import useStore from "@/lib/reactflow/store";
import { CollageNodeData, AppState } from "@/lib/reactflow/types";
import { updateRealtimePost } from "@/lib/actions/realtimepost.actions";
import BaseNode from "./BaseNode";
import { useShallow } from "zustand/react/shallow";

interface CollageConfigType {
  layoutStyle: string;
  columns: number;
  gap: number;
}

function CollageNode({ id, data }: NodeProps<CollageNodeData>) {
  const path = usePathname();
  const currentActiveUser = useAuth().user;
  const store = useStore(
    useShallow((state: AppState) => ({
      closeModal: state.closeModal,
    }))
  );
  const reactFlowInstance = useReactFlow();

  const [layoutStyle, setLayoutStyle] = useState(data.layoutStyle || "grid");
  const [columns, setColumns] = useState(data.columns ?? 3);
  const [gap, setGap] = useState(data.gap ?? 8);

  useEffect(() => {
    setLayoutStyle(data.layoutStyle || "grid");
    setColumns(data.columns ?? 3);
    setGap(data.gap ?? 8);
  }, [data.layoutStyle, data.columns, data.gap]);

  const isOwned = currentActiveUser
    ? Number(currentActiveUser.userId) === Number(data.author.id)
    : false;

  const edgesToThisNode = useMemo(() => {
    return reactFlowInstance.getEdges().filter((e) => e.target === id);
  }, [reactFlowInstance, id]);

  const imageURLs = useMemo(() => {
    const urls: string[] = [];
    edgesToThisNode.forEach((edge) => {
      const sourceNode = reactFlowInstance.getNode(edge.source);
      if (sourceNode?.type === "IMAGE") {
        const url = (sourceNode.data as any).imageurl;
        if (typeof url === "string") {
          urls.push(url);
        }
      }
    });
    return urls;
  }, [edgesToThisNode, reactFlowInstance]);

  async function onCollageSubmit(values: CollageConfigType) {
    setLayoutStyle(values.layoutStyle);
    setColumns(values.columns);
    setGap(values.gap);

    await updateRealtimePost({
      id,
      path,
      collageLayoutStyle: values.layoutStyle,
      collageColumns: values.columns,
      collageGap: values.gap,
    });

    store.closeModal();
  }

  const containerStyle: CSSProperties = {};

  if (layoutStyle === "grid") {
    containerStyle.display = "flex";
    containerStyle.gap = `${gap}px`;
    containerStyle.paddingLeft = "12px";
    containerStyle.paddingRight = "12px";
    containerStyle.paddingTop = "48px";
    containerStyle.paddingBottom = "48px";
  } else if (layoutStyle === "bento") {
    containerStyle.display = "flex";
    containerStyle.flexWrap = "wrap";
    containerStyle.gap = `${gap}px`;
  } else if (layoutStyle === "scrapbook") {
  }

  return (
    <BaseNode
      
      id={id}
      author={data.author}
      isOwned={isOwned}
      type="COLLAGE"
      isLocked={data.locked}
    >
      <div style={containerStyle}>
        {imageURLs.map((url, idx) => (
          <div key={idx} style={{ position: "relative", minWidth: 300, minHeight: 300 }}>
            <Image src={url} alt={`img-${idx}`} fill style={{ objectFit: "cover" }} />
          </div>
        ))}
      </div>
    </BaseNode>
  );
}

export default CollageNode;

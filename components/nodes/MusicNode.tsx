"use client";

import { fetchUser } from "@/lib/actions/user.actions";
import { useAuth } from "@/lib/AuthContext";
import { AuthorOrAuthorId } from "@/lib/reactflow/types";
import BaseNode from "./BaseNode";
import { NodeProps } from "@xyflow/react";
import { useEffect, useRef, useState } from "react";
import WaveSurfer from "wavesurfer.js";
import MusicNodeModal from "../modals/MusicNodeModal";

interface MusicNodeData {
  audioUrl: string;
  title: string;
  author: AuthorOrAuthorId;
  locked: boolean;
}

function MusicNode({ id, data }: NodeProps<MusicNodeData>) {
  const currentUser = useAuth().user;
  const [author, setAuthor] = useState(data.author);
  const waveRef = useRef<WaveSurfer | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    if (!("username" in author)) {
      fetchUser(data.author.id).then((user) => user && setAuthor(user));
    }
  }, [author, data.author]);

  useEffect(() => {
    if (!containerRef.current) return;
    waveRef.current = WaveSurfer.create({
      container: containerRef.current,
      waveColor: "#94a3b8",
      progressColor: "#0ea5e9",
      height: 64,
      responsive: true,
    });
    if (data.audioUrl) {
      waveRef.current.load(data.audioUrl);
    }
    return () => {
      waveRef.current?.destroy();
    };
  }, [data.audioUrl]);

  const togglePlay = () => {
    if (!waveRef.current) return;
    waveRef.current.playPause();
    setIsPlaying(waveRef.current.isPlaying());
  };

  const isOwned = currentUser ? Number(currentUser.userId) === Number(data.author.id) : false;

  return (
    <BaseNode
      modalContent={<MusicNodeModal isOwned={isOwned} currentUrl={data.audioUrl} currentTitle={data.title} />}
      id={id}
      author={author}
      isOwned={isOwned}
      type={"MUSIC"}
      isLocked={data.locked}
    >
      <div className="flex items-center gap-2 w-full">
        <button onClick={togglePlay} className="likebutton text-[1.2rem] button p-2 rounded-full">
          {isPlaying ? "Pause" : "Play"}
        </button>
        <div className="flex flex-col w-full">
          <div className="font-semibold text-sm mb-1">{data.title}</div>
          <div ref={containerRef} className="w-full" />
        </div>
      </div>
    </BaseNode>
  );
}

export default MusicNode;

"use client";

import { fetchUser } from "@/lib/actions/user.actions";
import { updateRealtimePost } from "@/lib/actions/realtimepost.actions";
import { useAuth } from "@/lib/AuthContext";
import { AuthorOrAuthorId, AudioNode as AudioNodeType } from "@/lib/reactflow/types";
import BaseNode from "./BaseNode";
import { NodeProps } from "@xyflow/react";
import { useEffect, useRef, useState } from "react";
import { uploadAudioToSupabase } from "@/lib/utils";
import { LiveKitRoom, RoomAudioRenderer, useTracks } from "@livekit/components-react";
import { Track } from "livekit-client";
import { usePathname } from "next/navigation";
import * as Tone from "tone";
import Image from "next/image";
interface AudioNodeData {
  audioUrl: string;
  author: AuthorOrAuthorId;
  locked: boolean;
}

function AudioNode({ id, data }: NodeProps<AudioNodeData>) {
  const path = usePathname();
  const currentUser = useAuth().user;
  const [author, setAuthor] = useState(data.author);
  const [token, setToken] = useState("");
  const [audioUrl, setAudioUrl] = useState(data.audioUrl);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    if ("username" in author) return;
    fetchUser(data.author.id).then((user) => user && setAuthor(user));
  }, [author, data.author.id]);

  useEffect(() => {
    if (!currentUser) return;
    (async () => {
      try {
        const resp = await fetch(`/api/get-participant-token?room=audio-${id}`);
        const tok = (await resp.json()).token;
        setToken(tok);
      } catch (e) {
        console.error(e);
      }
    })();
  }, [currentUser, id]);

  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mediaRecorder = new MediaRecorder(stream);
    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };
    mediaRecorder.onstop = async () => {
      const blob = new Blob(chunksRef.current, { type: "audio/webm" });
      chunksRef.current = [];
      const file = new File([blob], `audio-${Date.now()}.webm`);
      const result = await uploadAudioToSupabase(file);
      if (!result.error) {
        setAudioUrl(result.fileURL);
        await updateRealtimePost({ id, path, content: result.fileURL });
      }
    };
    recorderRef.current = mediaRecorder;
    mediaRecorder.start();
  };

  const stopRecording = () => {
    recorderRef.current?.stop();
  };

  useEffect(() => {
    if (audioUrl) {
      const player = new Tone.Player(audioUrl).toDestination();
      return () => {
        player.dispose();
      };
    }
  }, [audioUrl]);

  const isOwned = currentUser ? Number(currentUser.userId) === Number(data.author.id) : false;

  return (
    <BaseNode modalContent={null} id={id} author={author} isOwned={isOwned} type={"AUDIO"} isLocked={data.locked}>
      <div className="flex flex-col text-updater-node gap-2 ">
        {token && (
          <LiveKitRoom audio token={token} serverUrl={process.env.NEXT_PUBLIC_LIVEKIT_URL} data-lk-theme="default" style={{ height: "0" }}>
            <RoomAudioRenderer />
          </LiveKitRoom>
        )}
        {audioUrl && <audio controls src={audioUrl} className="w-full " />}
        {isOwned && (
          <div className="flex  gap-2">
            <button onClick={startRecording} className="likebutton text-[1.2rem] button p-2 rounded-full">
            <Image
                src={"/assets/microphone.svg"}
               alt="record"
             width={24}
            height={24}
          />

            </button>
            <button onClick={stopRecording} className="likebutton text-[1.2rem] button p-2 rounded-full">
            <Image
                src={"/assets/stop.svg"}
               alt="stop"
             width={24}
            height={24}
          />
            </button>
          </div>
        )}
                  <div className="flex  gap-2">

         <button className="likebutton text-[1.2rem] button p-2 rounded-full">
            <Image
                src={"/assets/play--outline.svg"}
               alt="play"
             width={24}
            height={24}
          />
            </button>
            <button className="likebutton text-[1.2rem] button p-2 rounded-full">
            <Image
                src={"/assets/pause.svg"}
               alt="pause"
             width={24}
            height={24}
          />
            </button>
            </div>
      </div>
    </BaseNode>
  );
}

export default AudioNode;

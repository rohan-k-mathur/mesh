import { fetchUser } from "@/lib/actions/user.actions";
import { AuthorOrAuthorId, WebcamNode } from "@/lib/reactflow/types";
import {
  ControlBar,
  GridLayout,
  LiveKitRoom,
  ParticipantTile,
  RoomAudioRenderer,
  useTracks,
} from "@livekit/components-react";
import "@livekit/components-styles";
import { Handle, NodeProps, Position } from "@xyflow/react";
import { Track } from "livekit-client";
import { useEffect, useState } from "react";
import NodeAuthorDisplay from "../reactflow/NodeAuthorDisplay";
import BaseNode from "./BaseNode";
import { useAuth } from "@/lib/AuthContext";

function MyVideoConference({ author }: { author: AuthorOrAuthorId }) {
  // `useTracks` returns all camera and screen share tracks. If a user
  // joins without a published camera track, a placeholder track is returned.
  const tracks = useTracks(
    [
      { source: Track.Source.Camera, withPlaceholder: true },
      { source: Track.Source.ScreenShare, withPlaceholder: false },
    ],
    { onlySubscribed: false }
  );
  if (!("username" in author)) {
    return;
  }
  const ownerTrack = tracks.filter(
    (track) => track.participant.identity === author.username
  );

  return (
    <GridLayout
      tracks={ownerTrack}
      style={{ height: "calc(100vh - var(--lk-control-bar-height))" }}
    >
      {/* The GridLayout accepts zero or one child. The child is used
      as a template to render all passed in tracks. */}
      <ParticipantTile />
    </GridLayout>
  );
}

function LiveStreamNode({ id, data }: NodeProps<WebcamNode>) {
  const room = `room-${id}`;
  const [token, setToken] = useState("");
  const [author, setAuthor] = useState(data.author);
  const currentActiveUser = useAuth().user;
  useEffect(() => {
    if ("username" in author) {
      return;
    } else {
      fetchUser(data.author.id).then((user) => {
        setAuthor(user!);
      });
    }
  }, [data]);
  useEffect(() => {
    if (!currentActiveUser) {
      return;
    }
    (async () => {
      try {
        const resp = await fetch(`/api/get-participant-token?room=${room}`);
        const data = await resp.json();
        setToken(data.token);
      } catch (e) {
        console.error(e);
      }
    })();
  }, []);

  const isOwned = currentActiveUser
    ? Number(currentActiveUser!.userId) === Number(data.author.id)
    : false;

  return (
    <BaseNode
      modalContent={null}
      id={id}
      author={author}
      isOwned={isOwned}
      type={"LIVESTREAM"}
      isLocked={data.locked}
    >
      <div className="live-container">
        <LiveKitRoom
          video={false}
          audio={false}
          token={token}
          serverUrl={process.env.NEXT_PUBLIC_LIVEKIT_URL}
          // Use the default LiveKit theme for nice styles.
          data-lk-theme="default"
          style={{ height: "75dvh", width: "60dvh" }}
        >
          {/* Your custom component with basic video conferencing functionality. */}
          <MyVideoConference author={author} />
          {/* The RoomAudioRenderer takes care of room-wide audio for you. */}
          <RoomAudioRenderer />
          {/* Controls for the user to start/stop audio, video, and screen
      share tracks and to leave the room. */}
          {isOwned && <ControlBar variation={"minimal"} />}
        </LiveKitRoom>
      </div>
    </BaseNode>
  );
}

export default LiveStreamNode;

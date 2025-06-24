import { updateRealtimePost } from "@/lib/actions/realtimepost.actions";
import { fetchUser } from "@/lib/actions/user.actions";
import { useAuth } from "@/lib/AuthContext";
import useStore from "@/lib/reactflow/store";
import { AppState, YoutubeVidNode } from "@/lib/reactflow/types";
import { YoutubePostValidation } from "@/lib/validations/thread";
import { NodeProps } from "@xyflow/react";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { z } from "zod";
import { useShallow } from "zustand/react/shallow";
import YoutubeNodeModal from "../modals/YoutubeNodeModal";
import BaseNode from "./BaseNode";

function YoutubeNode({ id, data }: NodeProps<YoutubeVidNode>) {
  const path = usePathname();
  const currentActiveUser = useAuth().user;
  const store = useStore(
    useShallow((state: AppState) => ({
      closeModal: state.closeModal,
    }))
  );
  const [videoURL, setVideoURL] = useState(data.videoid);
  const [author, setAuthor] = useState(data.author);
  useEffect(() => {
    setVideoURL(data.videoid);
    if ("username" in author) {
      return;
    } else {
      fetchUser(data.author.id).then((user) => {
        setAuthor(user!);
      });
    }
  }, [data]);

  const isOwned = currentActiveUser
    ? Number(currentActiveUser!.userId) === Number(data.author.id)
    : false;

  const onSubmit = (values: z.infer<typeof YoutubePostValidation>) => {
    setVideoURL(values.videoURL);
    updateRealtimePost({
      id,
      videoUrl: values.videoURL,
      path,
    });
    store.closeModal();
  };
  return (
    <BaseNode
      modalContent={
        <YoutubeNodeModal
          isOwned={isOwned}
          onSubmit={onSubmit}
          currentVideoURL={videoURL}
        />
      }
      id={id}
      author={author}
      isOwned={isOwned}
      type={"TEXT"}
      isLocked={data.locked}
    >
      <div className="yt-container">
        <div className="yt-frame">
          <iframe
            title="youtube video"
            width={400}
            height={225}
            src={videoURL}
            allow="accelerometer; autoplay; showinfo=0; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          ></iframe>
        </div>
      </div>
    </BaseNode>
  );
}

export default YoutubeNode;

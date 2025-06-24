import Modal from "@/components/modals/Modal";
import Room from "@/components/reactflow/Room";
import { fetchRealtimeRoom } from "@/lib/actions/realtimeroom.actions";
import {
  convertPostToNode,
  convertRealtimeEdgeToEdge,
} from "@/lib/reactflow/reactflowutils";
import { getUserFromCookies } from "@/lib/serverutils";
import { ReactFlowProvider } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { notFound, redirect } from "next/navigation";

async function Page({ params }: { params: { id: string } }) {
  const roomId = params.id;
  const realtimeRoom = await fetchRealtimeRoom({ realtimeRoomId: params.id });
  if (!realtimeRoom) {
    notFound();
  }
  const user = await getUserFromCookies();
  if (params.id !== "global") {
    if (!user) redirect("/login");
    if (!user.userId!) redirect("/onboarding");
    if (
      !realtimeRoom.members.map((user) => user.user_id).includes(user.userId)
    ) {
      notFound();
    }
  }
  const initialNodes = realtimeRoom.realtimeposts.map((post) => {
    return convertPostToNode(post, post.author);
  });
  const initialEdges = realtimeRoom.realtimeedges.map((edge) =>
    convertRealtimeEdgeToEdge(edge)
  );
  return (
    <>
      <ReactFlowProvider
        initialEdges={initialEdges}
        initialNodes={initialNodes}
        initialHeight={50}
        initialWidth={50}
      >
        <Modal />
        <Room
          roomId={roomId}
          initialNodes={initialNodes}
          initialEdges={initialEdges}
        />
      </ReactFlowProvider>
    </>
  );
}

export default Page;

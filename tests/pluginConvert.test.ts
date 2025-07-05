import { convertPostToNode } from "@/lib/reactflow/reactflowutils";
import { realtime_post_type } from "@prisma/client";

test("convertPostToNode handles plugin", () => {
  const post: any = {
    id: BigInt(1),
    content: JSON.stringify({ foo: "bar" }),
    image_url: null,
    video_url: null,
    author_id: BigInt(2),
    x_coordinate: 10,
    y_coordinate: 20,
    type: "PLUGIN" as realtime_post_type,
    pluginType: "HELLO",
    pluginData: { foo: "bar" },
    realtime_room_id: "r",
    locked: false,
  };
  const node = convertPostToNode(post, { id: BigInt(2) } as any);
  expect(node.type).toBe("HELLO");
  expect((node as any).data.foo).toBe("bar");
});

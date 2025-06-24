import { Panel } from "@xyflow/react";
import Link from "next/link";
import Image from "next/image";
import { AuthorOrAuthorId } from "@/lib/reactflow/types";

type Props = {
  author: AuthorOrAuthorId;
};

const NodeAuthorDisplay = ({ author }: Props) => {
  return (
    // Keep the Panel if you need it positioned via React Flow
    <Panel position="top-left">
      <div className="pb-20">
        {/* This link wraps both the image and the username, so you have one unified hover area */}
        <Link href={`/profile/${author.id}`} className="node-author-wrapper">
          <Image
            src={"image" in author ? author.image || "" : ""}
            alt="Profile Image"
            width={24}
            height={24}
            className="node-profile-photo"
          />
          <p className="node-profile-name">
            {"@" + ("username" in author ? author.username : "")}
          </p>
        </Link>
      </div>
    </Panel>
  );
};

export default NodeAuthorDisplay;

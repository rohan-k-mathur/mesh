"use client";

import { NodeProps } from "@xyflow/react";
import { useAuth } from "@/lib/AuthContext";
import { fetchUser } from "@/lib/actions/user.actions";
import { useEffect, useState } from "react";
import BaseNode from "./BaseNode";
import { PortfolioNodeData } from "@/lib/reactflow/types";
import { generatePortfolioTemplates } from "@/lib/portfolio/export";
import Image from "next/image";

function PortfolioNode({ id, data }: NodeProps<PortfolioNodeData>) {
  const currentUser = useAuth().user;
  const [author, setAuthor] = useState(data.author);

  useEffect(() => {
    if ("username" in author) return;
    fetchUser(data.author.id).then((user) => user && setAuthor(user));
  }, [data.author, author]);

  const isOwned = currentUser
    ? Number(currentUser.userId) === Number(data.author.id)
    : false;

  const handleExport = () => {
    const { html, css } = generatePortfolioTemplates({
      text: data.text,
      images: data.images,
      links: data.links,
      layout: data.layout,
      color: data.color,
    });

    const htmlBlob = new Blob([html], { type: "text/html" });
    const htmlUrl = URL.createObjectURL(htmlBlob);
    const a = document.createElement("a");
    a.href = htmlUrl;
    a.download = "portfolio.html";
    a.click();
    URL.revokeObjectURL(htmlUrl);

    const cssBlob = new Blob([css], { type: "text/css" });
    const cssUrl = URL.createObjectURL(cssBlob);
    const cssA = document.createElement("a");
    cssA.href = cssUrl;
    cssA.download = "tailwind.css";
    cssA.click();
    URL.revokeObjectURL(cssUrl);
  };

  return (
    <BaseNode
      id={id}
      author={author}
      isOwned={isOwned}
      type={"PORTFOLIO"}
      isLocked={data.locked}
      generateOnClick={handleExport}
    >
      <div className="p-2">
        <p className="mb-1">{data.text}</p>
        {data.images[0] && (
          <Image
            src={data.images[0]}
            alt="img"
            width={80}
            height={80}
            className="object-cover"
          />
        )}
        {data.links[0] && (
          <a
            href={data.links[0]}
            className="text-blue-500 underline"
            target="_blank"
            rel="noreferrer"
          >
            {data.links[0]}
          </a>
        )}
      </div>
    </BaseNode>
  );
}

export default PortfolioNode;

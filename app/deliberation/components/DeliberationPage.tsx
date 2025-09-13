"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import ArticleReader from "@/components/article/ArticleReader";
import CommentModal from "@/components/article/CommentModal";
import type { Anchor, CommentThread } from "@/types/comments";
import Image from "next/image";
import DeepDivePanel from "@/components/deepdive/DeepDivePanel";
import { useRouter } from "next/navigation";
import HomeButton from "@/components/buttons/HomeButton";
import { RhetoricProvider } from "@/components/rhetoric/RhetoricContext";
import { DeepDiveBackdrop } from "@/components/article/DeepDiveBackground";
import { DialogueTargetProvider } from "@/components/dialogue/DialogueTargetContext";

type Props = {

    deliberationId?: string;
  };

export default function DeliberationReader({

  deliberationId,
}: Props) {
  

  return (
    <div className="relative flex flex-col mt-4 w-full">
      <hr className="w-full border-[.5px] border-slate-700/70 mt-4"></hr>

      {deliberationId && (
        <section className="relative mt-0">
          <DeepDiveBackdrop />
          <h2 className="text-4xl font-semibold tracking-wide text-center my-4">
            Discussion
          </h2>
          <div className=" justify-center items-center mx-auto border-b-[.5px] border-slate-700/70 mb-2" />
          <hr></hr>
          <RhetoricProvider>
            <DialogueTargetProvider>
              <DeepDivePanel deliberationId={deliberationId} />
            </DialogueTargetProvider>
          </RhetoricProvider>
        </section>
      )}
    </div>
  );
}

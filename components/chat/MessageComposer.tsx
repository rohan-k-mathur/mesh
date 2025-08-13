"use client";
import { useState, useEffect,useRef } from "react";
import Image from "next/image";
import { X, File as FileIcon, Paperclip } from "lucide-react";
import { useChatStore } from "@/contexts/useChatStore";
import { supabase } from "@/lib/supabaseclient";
import QuickPollModal from "@/components/chat/QuickPollModal";
import QuickTempModal from "@/components/chat/QuickTempModal";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";

interface Props {
  conversationId: string;
}

export default function MessageComposer({ conversationId }: Props) {
  const appendMessage = useChatStore((s) => s.appendMessage);
  const [text, setText] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [previews, setPreviews] = useState<string[]>([]);
 const [showPoll, setShowPoll] = useState(false);
  const [showTemp, setShowTemp] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  function onFilesSelected(list: FileList | null) {
    console.log("[files] selected", list?.length);
    if (!list) return;
    const filesArray = Array.from(list);
    const urls = filesArray.map((f) =>
      f.type.startsWith("image/") ? URL.createObjectURL(f) : ""
    );
    setFiles((prev) => [...prev, ...filesArray]);
    setPreviews((prev) => [...prev, ...urls]);
    // allow picking the same file twice
   if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function removeFile(idx: number) {
    setFiles((prev) => prev.filter((_, i) => i !== idx));
    setPreviews((prev) => {
      const [toRevoke] = prev.slice(idx, idx + 1);
      if (toRevoke) URL.revokeObjectURL(toRevoke);
      return prev.filter((_, i) => i !== idx);
    });
  }

  useEffect(() => {
    return () => {
      previews.forEach((url) => url && URL.revokeObjectURL(url));
    };
  }, [previews]);

  // function onFilesSelected(list: FileList | null) {
  //   if (!list) return;
  //   setFiles((prev) => [...prev, ...Array.from(list)]);
  // }

  // function removeFile(idx: number) {
  //   setFiles((prev) => prev.filter((_, i) => i !== idx));
  // }

  async function send() {
    if (uploading) return;
    if (!text.trim() && files.length === 0) return;
    const form = new FormData();
    if (text.trim()) form.append("text", text);
    files.forEach((f) => form.append("files", f));
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `/api/messages/${conversationId}`);
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) {
        setProgress((e.loaded / e.total) * 100);
      }
    };
    xhr.onload = () => {
      try {
        if (xhr.status < 200 || xhr.status >= 300)
          throw new Error("Upload failed");
        const msg = JSON.parse(xhr.responseText);
        console.log('[send] server returned attachments:', msg.attachments?.length, msg.attachments);
        appendMessage(conversationId, msg);
      } catch (e) {
        // TODO: surface error toast
      } finally {
        setText("");
        setFiles([]);
        setUploading(false);
        setProgress(0);
      }
    };
    xhr.onerror = () => {
      setUploading(false);
      setProgress(0);
      // TODO: toast
    };
    setUploading(true);
    xhr.send(form);
  }
  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (uploading) return;
    // reuse your existing send() logic
    send();
  }


    // helper: create a plain text message and return its id    normalized DTO for local append
    async function createQuestionMessage(question: string) {
      const fd = new FormData();
      fd.set("text", question);
      const res = await fetch(`/api/messages/${conversationId}`, { method: "POST", body: fd });
      if (!res.ok) throw new Error("Failed to create message");
      const msg = await res.json(); // matches useChatStore Message dto
      appendMessage(conversationId, msg);
      return msg;
    }
  
    async function createOptionsPoll(question: string, options: string[]) {
      const msg = await createQuestionMessage(question);
      const res = await fetch("/api/polls", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId,
          messageId: msg.id,
          kind: "OPTIONS",
          options,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data?.ok) throw new Error(data?.error || "Failed to create poll");
      // broadcast so everyone renders the chip under this message
      supabase.channel(`conversation-${conversationId}`).send({
        type: "broadcast",
        event: "poll_create",
        payload: { poll: data.poll, state: null, my: null },
      });
    }
  
    async function createTempCheck(question: string) {
      const msg = await createQuestionMessage(question);
      const res = await fetch("/api/polls", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId,
          messageId: msg.id,
          kind: "TEMP",
        }),
      });
      const data = await res.json();
      if (!res.ok || !data?.ok) throw new Error(data?.error || "Failed to create temperature check");
      supabase.channel(`conversation-${conversationId}`).send({
        type: "broadcast",
        event: "poll_create",
        payload: { poll: data.poll, state: null, my: null },
      });
    }
  
  return (
    <div
      className="relative"
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={(e) => {
        e.preventDefault();
        setDragOver(false);
      }}
      onDrop={(e) => {
        e.preventDefault();
        setDragOver(false);
        onFilesSelected(e.dataTransfer.files);
      }}
    >
      {dragOver && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/50 text-white border-2 border-dashed rounded-md">
          Drop files here
        </div>
      )}
      <div className="space-y-2">
        {files.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {files.map((file, i) => {
              const isImg = file.type.startsWith("image/");
              ///const url = isImg ? URL.createObjectURL(file) : undefined;
              const url = isImg ? previews[i] : undefined;
              return (
                <div
                  key={i}
                  className="relative w-20 h-20 border rounded-md overflow-hidden"
                >
                  {isImg ? (
                    <Image
                      src={url!}
                      alt={file.name}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex items-center justify-center w-full h-full bg-gray-100">
                      <FileIcon className="w-8 h-8" />
                    </div>
                  )}
                  <button
                    type="button"
                    className="absolute top-0 right-0 bg-black/50 text-white rounded-bl p-1"
                    onClick={() => removeFile(i)}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
        <form
          onSubmit={handleSubmit}
          className="relative"
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={(e) => {
            e.preventDefault();
            setDragOver(false);
          }}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            onFilesSelected(e.dataTransfer.files);
          }}
        >
          <div className="flex flex-1 w-full  align-center  gap-3">
          <div className="flex flex-1 w-full">
            <textarea
              className="flex flex-1 h-full w-full text-start align-center rounded-xl bg-white/70 px-4 py-3 text-[.9rem] tracking-wider  messagefield text-black"
              rows={1}
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  if (!uploading) send();
                }
              }}
              disabled={uploading}
            />
 </div>
 <button
              type="submit"
              className="flex bg-white/70 sendbutton h-fit w-fit text-black tracking-widest text-[1.1rem] rounded-xl px-5 py-2"
              disabled={uploading}
            >
              <Image
                src="/assets/send--alt.svg"
                alt="share"
                width={24}
                height={24}
                className="cursor-pointer object-contain"
              />
            </button>
            <>
       
            <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="flex bg-white/70 sendbutton h-fit w-fit text-black tracking-widest text-[1.1rem] rounded-xl px-2 py-2"
                title="Create"
              >
                +
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" sideOffset={6}>
              <DropdownMenuItem onClick={() => setShowPoll(true)}>📊 Create poll…</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setShowTemp(true)}>🌡 Temperature check…</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
  
  
        <QuickPollModal
          open={showPoll}
          onClose={() => setShowPoll(false)}
          onSubmit={async ({ question, options }) => {
            try {
              await createOptionsPoll(question, options);
            } catch (e: any) {
              alert(e?.message || "Failed to create poll");
            }
          }}
        />
  
        <QuickTempModal
          open={showTemp}
          onClose={() => setShowTemp(false)}
          onSubmit={async ({ question }) => {
            try {
              await createTempCheck(question);
            } catch (e: any) {
              alert(e?.message || "Failed to create temperature check");
            }
          }}
        />
      </>

            <button  
            type="button"
            onClick={() => fileInputRef.current?.click()}
            aria-label="Attach files"
             className="flex bg-white/70 sendbutton  h-fit w-fit text-black tracking-widest text-[1.1rem] rounded-xl px-3 py-2">
              <input
                type="file"
                multiple
                accept="image/*,application/pdf,application/zip"
                onChange={(e) => onFilesSelected(e.target.files)}
                className="hidden"
              />
              {/* <Paperclip className="w-[24px] h-[24px]  cursor-pointer" /> */}
              <Image
                src="/assets/attachment.svg"
                alt="share"
                width={24}
                height={24}
                className="cursor-pointer object-contain flex  justify-center items-center "
             />
             
            </button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,application/pdf,application/zip"
              onChange={(e) => onFilesSelected(e.target.files)}
              className="hidden"
            />
          </div>
          {uploading && (
            <div className="h-2 bg-gray-200 rounded-full mt-5">
              <div
                className="h-full bg-indigo-300 rounded-full transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}
        </form>
      </div>
    </div>
  );
}

// components/chat/MessageComposer.tsx (snippet for adding realtime presence ui)
// const { sendTyping } = useConversationRealtime(conversationId, {
//   id: currentUserId,
//   name: currentUserName,
//   image: currentUserImage,
// });

// <input
//   type="text"
//   value={text}
//   onChange={(e) => {
//     setText(e.target.value);
//     if (e.target.value.trim()) sendTyping();
//   }}
//   // …
// />

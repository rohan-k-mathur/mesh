"use client";
import { useState, useEffect } from "react";
import Image from "next/image";
import { X, File as FileIcon, Paperclip } from "lucide-react";
import { useChatStore } from "@/contexts/useChatStore";

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

function onFilesSelected(list: FileList | null) {
  if (!list) return;
  const filesArray = Array.from(list);
  const urls = filesArray.map((f) => f.type.startsWith("image/") ? URL.createObjectURL(f) : "");
  setFiles((prev) => [...prev, ...filesArray]);
  setPreviews((prev) => [...prev, ...urls]);
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
        if (xhr.status < 200 || xhr.status >= 300) throw new Error("Upload failed");
        const msg = JSON.parse(xhr.responseText);
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
              const url = isImg ? URL.createObjectURL(file) : undefined;
              return (
                <div key={i} className="relative w-20 h-20 border rounded-md overflow-hidden">
                  {isImg ? (
                    <Image src={url!} alt={file.name} fill className="object-cover" />
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
        <div className="flex gap-5">
        
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="flex-1 h-full bg-white bg-opacity-20 text-start align-center rounded-xl px-4 py-3 text-[.9rem] tracking-wider bg-white/50 messagefield text-black"
            disabled={uploading}
          />
          
          <button
            className="flex bg-white/30 sendbutton min-w-[4rem] h-fit w-fit text-black tracking-widest text-[1.1rem] rounded-xl px-5 py-2"
            onClick={send}
            disabled={uploading}
          >
             <Image
    src="/assets/send--alt.svg"
    alt="share"
    width={24}
    height={24}
    className="cursor-pointer object-contain flex flex-1 justify-center items-center w-fit h-fit"></Image>
            
          </button>
          <button             className="flex bg-white/30 sendbutton  h-fit w-fit text-black tracking-widest text-[1.1rem] rounded-xl px-3 py-2"
>
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
    className="cursor-pointer object-contain flex  justify-center items-center "></Image>
          </button>
        </div>
        {uploading && (
          <div className="h-1 bg-gray-200 rounded">
            <div
              className="h-full bg-indigo-500 transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
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
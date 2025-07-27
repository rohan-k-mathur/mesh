"use client";
import { useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface Props {
  onFile: (file: File) => void;
}

export default function ImageDropzone({ onFile }: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [drag, setDrag] = useState(false);

  const handleFile = (f: File | undefined) => {
    if (f) onFile(f);
  };

  return (
    <div
      className={cn(
        "border border-dashed p-4 text-center cursor-pointer",
        drag && "bg-gray-100"
      )}
      onDragOver={(e) => {
        e.preventDefault();
        setDrag(true);
      }}
      onDragLeave={() => setDrag(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDrag(false);
        const file = e.dataTransfer.files?.[0];
        handleFile(file);
      }}
      onClick={() => inputRef.current?.click()}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
      <p>Drop image or click to upload</p>
    </div>
  );
}

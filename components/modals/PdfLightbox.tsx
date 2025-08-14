// components/modals/PdfLightbox.tsx
"use client";
import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

type BaseProps = {
  title?: string;
  /** Optional page hint to start at (appended to #page=) */
  startPage?: number;
};

type TriggeredProps = BaseProps & {
  /** Self-managed dialog: render this as the click trigger */
  trigger: React.ReactNode;
  /** Provide either a direct fileUrl OR a postId */
  fileUrl?: string;
  postId?: string;
  /** Controlled props are not allowed in trigger mode */
  open?: never;
  onOpenChange?: never;
};

type ControlledProps = BaseProps & {
  /** Parent controls the dialog state */
  open: boolean;
  onOpenChange: (v: boolean) => void;
  /** Provide either a direct fileUrl OR a postId */
  fileUrl?: string;
  postId?: string;
  /** No trigger in controlled mode */
  trigger?: never;
};

type PdfLightboxProps = TriggeredProps | ControlledProps;

type PostInfo = {
  id: string;
  title: string | null;
  fileUrl: string;
  pageCount: number;
  thumbUrls: string[];
};

export default function PdfLightbox(props: PdfLightboxProps) {
  const isControlled = "open" in props && typeof props.open === "boolean";
  const [selfOpen, setSelfOpen] = React.useState(false);
  const open = isControlled ? props.open : selfOpen;
  const setOpen = isControlled ? props.onOpenChange : setSelfOpen;

  const [loading, setLoading] = React.useState(false);
  const [err, setErr] = React.useState<string | null>(null);
  const [info, setInfo] = React.useState<PostInfo | null>(null);

  const directFileUrl = props.fileUrl;
  const title = props.title ?? info?.title ?? "PDF";
  const startPage = props.startPage ?? 1;

  // When opened and a postId is provided (and no direct URL), fetch details.
  React.useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!open) return;
      if (!props.postId || directFileUrl) return; // nothing to fetch
      setLoading(true);
      setErr(null);
      try {
        const qs = new URLSearchParams({ id: props.postId! });
        const res = await fetch(`/api/library/post?${qs.toString()}`, {
          cache: "no-store",
          credentials: "include",
        });
        if (!res.ok) throw new Error(await res.text());
        const json = (await res.json()) as PostInfo;
        if (!cancelled) setInfo(json);
      } catch (e: any) {
        if (!cancelled) setErr(String(e?.message || e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [open, props.postId, directFileUrl]);

  const resolvedUrl =
    directFileUrl ?? info?.fileUrl ?? ""; // final URL we’ll embed

  const iframeSrc =
    resolvedUrl && startPage > 1
      ? `${resolvedUrl}#page=${startPage}&view=FitH`
      : resolvedUrl
      ? `${resolvedUrl}#view=FitH`
      : "";

  const Header = (
    <DialogHeader>
      <div className="flex  gap-3">
        <DialogTitle hidden className="truncate">{title}</DialogTitle>
        {resolvedUrl ? (
          <div className="flex items-end justify-end gap-2">
            <a
              href={resolvedUrl}
              target="_blank"
              rel="noreferrer"
              className="text-xs bg-white px-2 py-.5 rounded-xl lockbutton"
            >
              Open
            </a>
            <a
              href={`${resolvedUrl}${
                resolvedUrl.includes("?") ? "&" : "?"
              }download=1`}
              className="text-xs bg-white px-2 py-.5 rounded-xl lockbutton"
            >
              Download
            </a>
          </div>
        ) : null}
      </div>
    </DialogHeader>
  );

  const Body = (
    
    <div className="w-full  h-[82vh] rounded-xl shadow-lg relative bg-white">
      {loading && (
        <div className="absolute inset-0 grid place-items-center text-sm text-gray-500">
          Loading PDF…
        </div>
      )}
      {err && (
        <div className="p-3 text-sm text-red-600">
          Failed to load PDF: {err}
        </div>
      )}
      {!loading && !err && iframeSrc && (
        <iframe
          title={title}
          src={iframeSrc}
          className="w-full h-full rounded-xl"
          style={{ border: "none" }}
          referrerPolicy="no-referrer"
        />
      )}
    </div>
  );

  // Triggered (self-managed) flavor
  if (!isControlled) {
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <div onClick={() => setOpen(true)}>{(props as TriggeredProps).trigger}</div>
        </DialogTrigger>
        <DialogContent className="max-w-[50rem] w-full h-[93vh]  overflow-hidden bg-slate-400 border-2 border-slate-500">
          {Header}
          {Body}
        </DialogContent>
      </Dialog>
    );
  }

  // Controlled flavor
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-[50rem] w-full h-[93vh]  overflow-hidden bg-slate-400 border-2 border-slate-500">
        {Header}
        {Body}
      </DialogContent>
    </Dialog>
  );
}

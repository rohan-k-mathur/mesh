// components/modals/PdfLightbox.tsx
"use client";
import * as React from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import CitePickerInlinePro from "@/components/citations/CitePickerInlinePro";

type BaseProps = {
  title?: string;
  /** start at X (appended to #page=X) */
  startPage?: number;
  /** optional: attach directly if provided */
  citeTargetType?: "comment" | "claim" | "argument" | "card";
  citeTargetId?: string;
};

type TriggeredProps = BaseProps & {
  trigger: React.ReactNode;
  /** Provide either a direct fileUrl OR a postId */
  fileUrl?: string;
  postId?: string;
  open?: never;
  onOpenChange?: never;
};

type ControlledProps = BaseProps & {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  fileUrl?: string;
  postId?: string;
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
  const open = isControlled ? (props as ControlledProps).open : selfOpen;
  const setOpen = isControlled ? (props as ControlledProps).onOpenChange : setSelfOpen;

  const [loading, setLoading] = React.useState(false);
  const [err, setErr] = React.useState<string | null>(null);
  const [info, setInfo] = React.useState<PostInfo | null>(null);

  const directFileUrl = props.fileUrl;
  const title = props.title ?? info?.title ?? "PDF";
  const startPage = props.startPage ?? 1;

  // “Cite” overlay state
  const [citeOpen, setCiteOpen] = React.useState(false);
  const [locator, setLocator] = React.useState(startPage ? `p. ${startPage}` : "");
  const [quote, setQuote] = React.useState("");
  const [note, setNote] = React.useState("");

  // When opened and a postId is provided (and no direct URL), fetch details.
  React.useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!open) return;
      if (!("postId" in props) || !props.postId || directFileUrl) return;
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
    return () => { cancelled = true; };
  }, [open, directFileUrl, props]);

  const resolvedUrl = directFileUrl ?? info?.fileUrl ?? "";
  const iframeSrc =
    resolvedUrl && startPage > 1
      ? `${resolvedUrl}#page=${startPage}&view=FitH`
      : resolvedUrl ? `${resolvedUrl}#view=FitH` : "";

  const Header = (
    <DialogHeader>
      <div className="flex items-start justify-between gap-3">
        <DialogTitle className="truncate">{title}</DialogTitle>
        {resolvedUrl ? (
          <div className="flex items-center gap-2">
            <a href={resolvedUrl} target="_blank" rel="noreferrer" className="text-xs bg-white px-2 py-0.5 rounded-xl border">
              Open
            </a>
            <a href={`${resolvedUrl}${resolvedUrl.includes("?") ? "&" : "?"}download=1`} className="text-xs bg-white px-2 py-0.5 rounded-xl border">
              Download
            </a>
          </div>
        ) : null}
      </div>
    </DialogHeader>
  );

  const Body = (
    <div className="relative w-full h-[82vh] rounded-xl shadow-lg bg-white">
      {loading && (
        <div className="absolute inset-0 grid place-items-center text-sm text-gray-500">
          Loading PDF…
        </div>
      )}
      {err && <div className="p-3 text-sm text-red-600">Failed to load PDF: {err}</div>}
      {!loading && !err && iframeSrc && (
        <iframe
          title={title}
          src={iframeSrc}
          className="w-full h-full rounded-xl"
          style={{ border: "none" }}
          referrerPolicy="no-referrer"
        />
      )}

      {/* Cite overlay */}
      {(props.citeTargetType && props.citeTargetId) && (
        <div className="absolute bottom-2 right-2 flex flex-col items-end gap-2">
          {!citeOpen ? (
            <button
              className="px-3 py-1 text-[11px] rounded bg-white/90 border"
              onClick={() => setCiteOpen(true)}
              title="Copy a selection from the PDF, then click to attach it"
            >
              Cite…
            </button>
          ) : (
            <div className="w-[360px] rounded border bg-white p-2 shadow-xl">
              <div className="text-[11px] text-slate-600 mb-1">Paste selection and locator</div>
              <div className="grid grid-cols-2 gap-2 mb-2">
                <input
                  className="border rounded px-2 py-1 text-[12px]"
                  placeholder="Locator (e.g., p. 5)"
                  value={locator}
                  onChange={(e) => setLocator(e.target.value)}
                />
                <input
                  className="border rounded px-2 py-1 text-[12px]"
                  placeholder="Note (optional)"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />
              </div>
              <textarea
                className="w-full border rounded px-2 py-1 text-[12px]"
                rows={2}
                placeholder="Paste quote"
                value={quote}
                onChange={(e) => setQuote(e.target.value)}
              />
              <div className="mt-2 flex items-center gap-2">
                <CitePickerInlinePro
                  targetType={props.citeTargetType}
                  targetId={props.citeTargetId}
                  // Pre-seed: we can pass nothing; the picker will resolve a Source.
                  // We'll piggyback locator/quote by overriding its inputs (post-attach update).
                  onDone={() => {
                    setQuote("");
                    setNote("");
                    setCiteOpen(false);
                  }}
                />
                <button className="text-[11px] underline text-slate-600" onClick={() => setCiteOpen(false)}>
                  Cancel
                </button>
              </div>
              {/* If you want to attach *without* opening the picker, you can add a small custom attach flow here: resolve → attach with {locator, quote}. */}
            </div>
          )}
        </div>
      )}
    </div>
  );

  // Triggered (self-managed)
  if (!isControlled) {
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <div onClick={() => setOpen(true)}>{(props as TriggeredProps).trigger}</div>
        </DialogTrigger>
        <DialogContent className="max-w-[50rem] w-full h-[93vh] overflow-hidden bg-slate-100 border">
          {Header}
          {Body}
        </DialogContent>
      </Dialog>
    );
  }

  // Controlled
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-[50rem] w-full h-[93vh] overflow-hidden bg-slate-100 border">
        {Header}
        {Body}
      </DialogContent>
    </Dialog>
  );
}

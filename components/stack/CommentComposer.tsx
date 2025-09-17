   "use client";
   import * as React from "react";
   import { useRouter } from "next/navigation";
   import Image from "next/image";
   import { useFormStatus } from "react-dom";
   import { addStackComment } from "@/lib/actions/stack.actions";
   import CitePickerInlinePro from "@/components/citations/CitePickerInlinePro";
   
function SubmitBtn() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      className="w-fit px-4 items-center justify-center py-3 align-center bg-white/70 h-full mx-auto sendbutton rounded-full text-slate-700 disabled:opacity-20"
      disabled={pending}
    >
      <Image
        src="/assets/send (2).svg"
        alt="share"
        width={24}
        height={24}
        className="cursor-pointer object-contain ml-1"
      />
    </button>
  );
}

export default function CommentComposer({
  rootId,
}: {
  rootId: bigint | number | string;
}) {
  const router = useRouter();
  const [text, setText] = React.useState("");
  const [citeOpen, setCiteOpen] = React.useState(false);
  const [justPostedId, setJustPostedId] = React.useState<string | null>(null);

  async function onSubmit(formData: FormData) {
    const id = await addStackComment(formData); // 👈 returns comment id
    setText("");
    setJustPostedId(String(id));
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-2">
      <form action={onSubmit} className="flex items-start gap-3">
        <input type="hidden" name="rootId" value={String(rootId)} />
        <textarea
          name="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Add a comment…"
          className="commentfield flex w-full flex-1 py-3 px-3 max-h-[180px] border rounded-xl bg-white/70 text-sm"
          rows={2}
        />
        <div className="flex flex-col items-center gap-2">
          <SubmitBtn />
          <button
            type="button"
            className="text-[11px] px-2 py-[6px] rounded border bg-white/80"
            onClick={async () => {
              // 1) Post first if empty (or keep current text)
              if (text.trim()) {
                const fd = new FormData();
                fd.set("rootId", String(rootId));
                fd.set("text", text);
                const id = await addStackComment(fd);
                setJustPostedId(String(id));
                setText("");
                router.refresh();
              }
              // 2) Open picker to attach to last created
              setCiteOpen(true);
            }}
            title="Attach a citation to your newest comment"
          >
            Cite
          </button>
        </div>
      </form>

      {/* Multi-tab picker attaches to the most recent comment */}
      {citeOpen && justPostedId && (
        <div className="ml-[48px]">
          <CitePickerInlinePro
            targetType="comment"
            targetId={justPostedId}
            onDone={() => {
              setCiteOpen(false);
              setJustPostedId(null);
              router.refresh();
            }}
          />
        </div>
      )}
    </div>
  );
}

function QuickCiteForm({ busy, onAdd }: { busy: boolean; onAdd: (c: StagedCite) => void | Promise<void> }) {
  const [url, setUrl] = React.useState('');
  const [locator, setLocator] = React.useState('');
  const [quote, setQuote] = React.useState('');

  return (
    <div className="space-y-2">
      <input className="w-full border rounded px-2 py-1 text-sm" placeholder="Source URL" value={url} onChange={e=>setUrl(e.target.value)} />
      <input className="w-full border rounded px-2 py-1 text-sm" placeholder="Locator (p. 5, 08:14, fig. 2)" value={locator} onChange={e=>setLocator(e.target.value)} />
      <textarea className="w-full border rounded px-2 py-1 text-sm" rows={2} placeholder="Short quote (optional)" value={quote} onChange={e=>setQuote(e.target.value)} />
      <div className="flex justify-end gap-2">
        <button className="px-2 py-1 text-xs border rounded" onClick={(e)=>{e.preventDefault(); onAdd({ url: url.trim(), locator: locator.trim() || undefined, quote: quote.trim() || undefined });}} disabled={busy || !url.trim()}>
          {busy ? 'Adding…' : 'Add'}
        </button>
      </div>
    </div>
  );
}
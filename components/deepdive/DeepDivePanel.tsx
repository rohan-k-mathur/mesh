"use client";
import { useEffect, useState } from "react";
import DeliberationComposer from "./DeliberationComposer";
import { RepresentativeViewpoints } from "./RepresentativeViewpoints";
import ArgumentsList from "./ArgumentsList";
import CardComposerTab from "@/components/deepdive/CardComposerTab";
import StatusChip from "@/components/governance/StatusChip";
import { Tabs, TabsList, TabsContent, TabsTrigger } from "../ui/tabs";
import CegMiniMap from "./CegMiniMap";
import TopologyWidget from "./TopologyWidget";
import HelpModal from "@/components/help/HelpModal";
import DiscusHelpPage from "../help/HelpPage";
import ApprovalsHeatStrip from "@/components/deepdive/ApprovalsHeatStrip";
import CardList from "@/components/deepdive/CardList";
import { ViewControls } from "./RepresentativeViewpoints";
import GraphPanel from "@/components/graph/GraphPanel";
import { RhetoricProvider, useRhetoric } from '@/components/rhetoric/RhetoricContext';
import RhetoricControls from '@/components/rhetoric/RhetoricControls';

import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@/components/ui/collapsible";
import CardListVirtuoso from "@/components/deepdive/CardListVirtuoso";
import dynamic from "next/dynamic";
import { useAuth } from "@/lib/AuthContext";

const LazyGraphPanel = dynamic(() => import("@/components/graph/GraphPanel"), {
  ssr: false,
});

type Selection = {
  id: string;
  deliberationId: string; // ✅ selection now includes this
  rule: "utilitarian" | "harmonic" | "maxcov";
  k: number;
  coverageAvg: number;
  coverageMin: number;
  jrSatisfied: boolean;
  views: {
    index: number;
    arguments: { id: string; text: string; confidence?: number | null }[];
  }[];
};

// header toggle component
function RhetoricToggle() {
  const { mode, setMode } = useRhetoric();
  return (
    <label className="text-xs flex items-center gap-1">
      Lens:
      <select className="border rounded px-1 py-0.5" value={mode} onChange={e=>setMode(e.target.value as any)}>
        <option value="content">Content</option>
        <option value="style">Style</option>
      </select>
    </label>
  );
}

function usePersisted(key: string, def = true) {
  const [open, setOpen] = useState<boolean>(def);

  // Read from localStorage only on the client
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(key);
      if (saved != null) {
        setOpen(saved === "1");
      }
    } catch {
      // ignore if unavailable
    }
  }, [key]);

  // Write whenever it changes
  useEffect(() => {
    try {
      window.localStorage.setItem(key, open ? "1" : "0");
    } catch {
      // ignore if unavailable
    }
  }, [key, open]);

  return { open, setOpen };
}

export function SectionCard({
  title,
  action,
  children,
}: {
  title?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white/75  shadow-md">
      {(title || action) && (
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-100">
          <h3 className="text-sm font-semibold text-slate-700">{title}</h3>
          {action}
        </div>
      )}
      <div className="px-3 py-4">{children}</div>
    </section>
  );
}

export default function DeepDivePanel({
  deliberationId,
}: {
  deliberationId: string;
}) {
  const [sel, setSel] = useState<Selection | null>(null);
  const [pending, setPending] = useState(false);
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [rule, setRule] = useState<"utilitarian" | "harmonic" | "maxcov">(
    "utilitarian"
  );
  const { user } = useAuth();                // e.g., { userId?: string | number | bigint | null }
  const authorId = user?.userId != null ? String(user.userId) : undefined;
  const [rhetoricSample, setRhetoricSample] = useState<string>('');

  useEffect(() => {
    fetch(
      `/api/content-status?targetType=deliberation&targetId=${deliberationId}`
    )
      .then((r) => r.json())
      .then((d) => setStatus(d.status))
      .catch(() => {});
  }, [deliberationId]);

  const compute = async (
    forcedRule?: "utilitarian" | "harmonic" | "maxcov",
    forcedK?: number
  ) => {
    setPending(true);
    try {
      const res = await fetch(
        `/api/deliberations/${deliberationId}/viewpoints/select`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            rule: forcedRule ?? rule,
            k: forcedK ?? sel?.k ?? 3, // ✅ preserve current k unless overridden
          }),
          cache: "no-store",
        }
      );
      if (!res.ok) {
        console.error("Viewpoints select failed", res.status);
        return;
      }
      const data = await res.json().catch(() => null);
      if (data?.selection) setSel(data.selection);
    } finally {
      setPending(false);
    }
  };

  useEffect(() => {
    compute(); /* initial */
  }, []); // eslint-disable-line
  const graphState = usePersisted(`dd:graph:${deliberationId}`, false);

  return (

    <div className="space-y-5 py-3 px-6">
      {/* Header controls */}

      {/* Arguments + Composer */}
      <SectionCard>
        <div className="relative  flex items-center justify-between">
          <div className="flex items-center gap-2">
            {status && <StatusChip status={status} />}
            <label className="text-xs text-neutral-600 flex items-center gap-1">
              Rule:
              <select
                className="text-xs border rounded px-2 py-1"
                value={rule}
                onChange={(e) => {
                  setRule(e.target.value as any);
                  compute(e.target.value as any);
                }}
              >
                <option value="utilitarian">Utilitarian</option>
                <option value="harmonic">Harmonic</option>
                <option value="maxcov">MaxCov</option>
              </select>
            </label>
            {/* <HelpModal /> */}
            <DiscusHelpPage />
          </div>
          <div className="flex items-center gap-4">
          <RhetoricControls sample={rhetoricSample} />


              {pending && <div className="text-xs text-neutral-500">Computing…</div>}
            </div>
        </div>

        <ArgumentsList
          deliberationId={deliberationId}
          onVisibleTextsChanged={(texts)=>setRhetoricSample(texts.join(' '))}

          onReplyTo={(id) => setReplyTo(id)}
          onChanged={() => compute(sel?.rule)}
        />
      </SectionCard>
      <SectionCard>
        <DeliberationComposer
          deliberationId={deliberationId}
          onPosted={() => {
            setReplyTo(null);
            compute(sel?.rule);
          }}
          targetArgumentId={replyTo ?? undefined}
        />
      </SectionCard>

      {/*  Mode Tabs */}
      <Tabs defaultValue="arguments">
        <hr className="w-full border border-white"></hr>

        <TabsList>
          <TabsTrigger value="arguments">Arguments</TabsTrigger>
          <TabsTrigger value="card">Create Card</TabsTrigger>
          <TabsTrigger value="viewcard">View Cards</TabsTrigger>
        </TabsList>
        <TabsContent value="arguments">
          {/* (You already render arguments/composer above; keep this tab for future) */}
        </TabsContent>
        <TabsContent value="card">
          <SectionCard title="Create Card">
            <CardComposerTab deliberationId={deliberationId} />
          </SectionCard>
        </TabsContent>

        <TabsContent value="viewcard">
          <SectionCard title="View Cards">
            <div className="mt-4">
              {/* <CardList deliberationId={deliberationId} /> */}
              <CardListVirtuoso
  deliberationId={deliberationId}
  filters={{
    status: 'published',
    authorId,                         // now string | undefined
    since: '2025-08-01T00:00:00Z',
    sort: 'createdAt:desc',
  }}
/>

            </div>
          </SectionCard>
        </TabsContent>
      </Tabs>

      {/* Views + CEG widgets */}
      <SectionCard>
        <RepresentativeViewpoints
          selection={sel}
          onReselect={(nextRule, nextK) => compute(nextRule, nextK)}
        />
      </SectionCard>

      {/* <SectionCard >

      <CegMiniMap deliberationId={deliberationId} />
      </SectionCard> */}
      <SectionCard>
        <Collapsible open={graphState.open} onOpenChange={graphState.setOpen}>
          <div className="relative flex items-center justify-between px-1">
            <CollapsibleTrigger
              aria-expanded={graphState.open}
              className="text-sm font-semibold border-[.5px] border-black px-8 py-1 tracking-wider
               rounded-md bg-slate-100 hover:bg-slate-200"
            >
              {graphState.open ? "Collapse Graph" : "Expand Graph"}
            </CollapsibleTrigger>
          </div>
          <CollapsibleContent className="relative pt-2">
            {graphState.open && (
              <LazyGraphPanel deliberationId={deliberationId} />
            )}
          </CollapsibleContent>
        </Collapsible>
      </SectionCard>
      <SectionCard>
        <ApprovalsHeatStrip deliberationId={deliberationId} />
      </SectionCard>
      <SectionCard>
        <TopologyWidget deliberationId={deliberationId} />
      </SectionCard>
    </div>

  );
}

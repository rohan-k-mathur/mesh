'use client';
import { useEffect, useState } from 'react';
import DeliberationComposer from './DeliberationComposer';
import { RepresentativeViewpoints } from './RepresentativeViewpoints';
import ArgumentsList from './ArgumentsList';
import CardComposerTab from '@/components/deepdive/CardComposerTab';
import StatusChip from '@/components/governance/StatusChip';
import { Tabs, TabsList, TabsContent, TabsTrigger } from '../ui/tabs';
import CegMiniMap from './CegMiniMap';
import TopologyWidget from './TopologyWidget';
import HelpModal from '@/components/help/HelpModal';
import DiscusHelpPage from '../help/HelpPage';
import ApprovalsHeatStrip from '@/components/deepdive/ApprovalsHeatStrip';
import CardList from '@/components/deepdive/CardList';


type Selection = {
  id: string;
  deliberationId: string; // ✅ selection now includes this
  rule: 'utilitarian'|'harmonic'|'maxcov';
  k: number;
  coverageAvg: number; coverageMin: number; jrSatisfied: boolean;
  views: { index: number; arguments: { id: string; text: string; confidence?: number|null }[] }[];
};

export default function DeepDivePanel({ deliberationId }: { deliberationId: string }) {
  const [sel, setSel] = useState<Selection | null>(null);
  const [pending, setPending] = useState(false);
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [status, setStatus] = useState<string|null>(null);
  const [rule, setRule] = useState<'utilitarian'|'harmonic'|'maxcov'>('utilitarian');

  useEffect(() => {
    fetch(`/api/content-status?targetType=deliberation&targetId=${deliberationId}`)
      .then(r => r.json())
      .then(d => setStatus(d.status))
      .catch(()=>{});
  }, [deliberationId]);

  const compute = async (forcedRule?: 'utilitarian'|'harmonic'|'maxcov') => {
    setPending(true);
    try {
      const res = await fetch(`/api/deliberations/${deliberationId}/viewpoints/select`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ k: 3, rule: forcedRule ?? rule }),
        cache: 'no-store',
      });
      if (!res.ok) {
        console.error('Viewpoints select failed', res.status);
        return;
      }
      const data = await res.json().catch(() => null);
      if (data?.selection) setSel(data.selection);
    } finally {
      setPending(false);
    }
  };

  useEffect(() => { compute(); /* initial */ }, []); // eslint-disable-line

  return (
    <div className="space-y-5">
      {/* Header controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {status && <StatusChip status={status} />}
          <label className="text-xs text-neutral-600 flex items-center gap-1">
            Rule:
            <select
              className="text-xs border rounded px-2 py-1"
              value={rule}
              onChange={(e)=>{ setRule(e.target.value as any); compute(e.target.value as any); }}
            >
              <option value="utilitarian">Utilitarian</option>
              <option value="harmonic">Harmonic</option>
              <option value="maxcov">MaxCov</option>
            </select>
          </label>
          {/* <HelpModal /> */}
          <DiscusHelpPage/>
        </div>
        {pending && <div className="text-xs text-neutral-500">Computing…</div>}
      </div>

      {/* Arguments + Composer */}
      <ArgumentsList
        deliberationId={deliberationId}
        onReplyTo={(id) => setReplyTo(id)}
        onChanged={() => compute(sel?.rule)}
      />
      <DeliberationComposer
        deliberationId={deliberationId}
        onPosted={() => { setReplyTo(null); compute(sel?.rule); }}
        targetArgumentId={replyTo ?? undefined}
      />

      {/* Views + CEG widgets */}
      <RepresentativeViewpoints selection={sel} onReselect={compute} />
      <ApprovalsHeatStrip deliberationId={deliberationId} />

      <CegMiniMap deliberationId={deliberationId} />
      <TopologyWidget deliberationId={deliberationId} />

      {/* Card mode */}
      <Tabs defaultValue="arguments">
   

<hr className='w-full border border-white'></hr>

        <TabsList>
          <TabsTrigger value="arguments">Arguments</TabsTrigger>
          <TabsTrigger value="card">Create Card</TabsTrigger>
          <TabsTrigger value="viewcard">View Cards</TabsTrigger>

        </TabsList>
        <TabsContent value="arguments">
          {/* (You already render arguments/composer above; keep this tab for future) */}
        </TabsContent>
        <TabsContent value="card">
          <CardComposerTab deliberationId={deliberationId} />
          <div className="mt-4">
    <CardList deliberationId={deliberationId} />
  </div>
        </TabsContent>
        <TabsContent value="viewcard">
          
          <div className="mt-4">
    <CardList deliberationId={deliberationId} />
  </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

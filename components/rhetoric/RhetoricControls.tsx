// components/rhetoric/RhetoricControls.tsx
'use client';

import { useMemo } from 'react';
import { useRhetoric, RhetoricCategory, RhetoricMode } from './RhetoricContext';
import { analyzeText } from './detectors';
import { ModelLens } from './RhetoricContext';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';

export default function RhetoricControls({ sample }: { sample?: string }) {
  const {
    mode,
    setMode,
    modelLens, setModelLens,
    enabled,
    toggle,
    setAll,
    reset,
    settings,
    setSettings,
  } = useRhetoric();

  // derive counts for the visible sample (optional)
  const counts = useMemo(() => {
    if (!sample || !sample.trim()) return null;

    const a = analyzeText(sample);
    const exclaim = (sample.match(/!+/g) || []).length;

    // Core cues
    const core = {
      hedge: a.counts['hedge'] || 0,
      intensifier: a.counts['booster'] || 0, // internal "booster" name
      absolute: a.counts['absolute'] || 0,
      analogy: a.counts['analogy'] || 0,
      metaphor: a.counts['metaphor'] || 0,
      allcaps: a.counts['allcaps'] || 0,
      exclaim,
    };

    // Families
    const fam = {
      connectives:
        (a.counts['connective-support'] || 0) +
        (a.counts['connective-result'] || 0) +
        (a.counts['connective-contrast'] || 0) +
        (a.counts['connective-concession'] || 0) +
        (a.counts['connective-condition'] || 0),
      evidence: a.counts['evidence'] || 0,
      ethos: a.counts['ethos'] || 0,
      pathos: a.counts['pathos'] || 0,
      logos: a.counts['logos'] || 0,
    };

    const words = sample.trim().split(/\s+/).filter(Boolean).length || 1;
    const totalMarks =
      Object.values(core).reduce((s, n) => s + (n || 0), 0) +
      Object.values(fam).reduce((s, n) => s + (n || 0), 0);
    const per100w = Math.round((totalMarks / words) * 100);

    return { core, fam, per100w };
  }, [sample]);

  // “Core cues” + “Families” (2 sections)
  const coreItems: { key: RhetoricCategory; label: string; n?: number }[] = [
    { key: 'hedge',       label: 'Hedges',       n: counts?.core.hedge },
    { key: 'intensifier', label: 'Intensifiers', n: counts?.core.intensifier },
    { key: 'absolute',    label: 'Absolutes',    n: counts?.core.absolute },
    { key: 'analogy',     label: 'Analogies',    n: counts?.core.analogy },
    { key: 'metaphor',    label: 'Metaphors',    n: counts?.core.metaphor },
    { key: 'allcaps',     label: 'ALL-CAPS',     n: counts?.core.allcaps },
    { key: 'exclaim',     label: 'Exclamations', n: counts?.core.exclaim },
  ];

  const famItems: { key: RhetoricCategory; label: string; n?: number }[] = [
    { key: 'connectives', label: 'Connectives', n: counts?.fam.connectives },
    { key: 'evidence',    label: 'Evidence',    n: counts?.fam.evidence },
    { key: 'ethos',       label: 'Ethos',       n: counts?.fam.ethos },
    { key: 'pathos',      label: 'Pathos',      n: counts?.fam.pathos },
    { key: 'logos',       label: 'Logos',       n: counts?.fam.logos },
  ];

  return (
    <div className="flex flex-wrap items-center gap-2 text-xs ">
      {/* Lens mode */}
      <label className="flex items-center gap-1">
        Lens:
        <select
          className="border rounded px-1 py-0.5"
          value={mode}
          onChange={(e) => setMode(e.target.value as RhetoricMode)}
        >
          <option value="content">Content</option>
          <option value="style">Style</option>
        </select>
      </label>
    {/* Model lens: Monological/Dialogical/Rhetorical */}
    <label className="flex items-center gap-1" title="Choose analytic model: micro-structure, dialogue graph, or persuasive signals">
        Model:
        <select className="border rounded px-1 py-0.5" value={modelLens} onChange={(e) => setModelLens(e.target.value as ModelLens)} aria-label="Model lens">
          <option value="monological">Monological</option>
          <option value="dialogical">Dialogical</option>
          <option value="rhetorical">Rhetorical</option>
        </select>
      </label>
      {/* NLP toggle */}
      <label
        className="flex items-center gap-1"
        title="Imperatives, passive, modals, negation, etc. (local; falls back to regex if NLP is unavailable)"
      >
        <input
          type="checkbox"
          checked={!!settings.enableNlp}
          onChange={(e) => setSettings({ ...settings, enableNlp: e.target.checked })}
                    disabled={mode !== 'style'}
                    aria-disabled={mode !== 'style'}        />
        NLP cues
      </label>
            <label
        className="flex items-center gap-1"
        title="Highlight emotion/valence, policy frames, Logos/Ethos lexicons"
      >
        <input
          type="checkbox"
          checked={!!settings.highlightLexicon}
          onChange={e => setSettings({ ...settings, highlightLexicon: e.target.checked })}
          disabled={mode !== 'style'}
          aria-disabled={mode !== 'style'}
        />
        Lexicon highlights
      </label>

<div className="flex items-center gap-2">
        <input
          id="mini-ml-toggle"
          type="checkbox"
          checked={!!settings.enableMiniMl}
          onChange={e => setSettings({ ...settings, enableMiniMl: e.target.checked })}
          />
        <label htmlFor="mini-ml-toggle" className="text-xs" title="Tiny, transparent scorer for E/L/P mix (beta)">
          Mini-ML
        </label>
      </div>

      {/* Category dropdown */}
      <DropdownMenu >
        <DropdownMenuTrigger asChild>
          <button className='savebutton px-2 rounded-md'>Cues</button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-60 mt-1 max-h-[300px]  overflow-y-auto ">
          <DropdownMenuLabel>Core cues</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {coreItems.map(({ key, label, n }) => (
            <DropdownMenuCheckboxItem
              key={key}
              checked={enabled[key]}
              onCheckedChange={() => toggle(key)}
            >
              <div className="flex w-full justify-between">
                <span>{label}</span>
                {typeof n === 'number' && <span className="text-neutral-500">{n}</span>}
              </div>
            </DropdownMenuCheckboxItem>
          ))}

          <DropdownMenuSeparator />
          <DropdownMenuLabel>Families</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {famItems.map(({ key, label, n }) => (
            <DropdownMenuCheckboxItem
              key={key}
              checked={enabled[key]}
              onCheckedChange={() => toggle(key)}
            >
              <div className="flex w-full justify-between">
                <span>{label}</span>
                {typeof n === 'number' && <span className="text-neutral-500">{n}</span>}
              </div>
            </DropdownMenuCheckboxItem>
          ))}

          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setAll(true)}>Enable all</DropdownMenuItem>
          <DropdownMenuItem onClick={() => setAll(false)}>Disable all</DropdownMenuItem>
          <DropdownMenuItem onClick={() => reset()}>Reset</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Density */}
      {counts && (
        <span className="ml-1 text-neutral-600">
          Style density: <b>{counts.per100w}</b> / 100w
        </span>
      )}
    </div>
  );
}

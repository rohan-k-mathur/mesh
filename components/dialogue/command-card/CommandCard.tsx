// components/dialogue/command-card/CommandCard.tsx
'use client';

import * as React from 'react';
import { useState, useEffect, useCallback } from 'react';
import type { CommandCardProps, CommandCardAction } from './types';

function getActionStyles(action: CommandCardAction, isExecuting: boolean) {
  const base = 'h-10 rounded-lg text-[11px] px-2 border transition-all duration-200 transform relative overflow-hidden';
  
  if (action.disabled) {
    return `${base} opacity-40 cursor-not-allowed bg-slate-50 border-slate-200`;
  }

  if (isExecuting) {
    return `${base} scale-95 bg-blue-100 border-blue-300`;
  }

  switch (action.tone) {
    case 'danger':
      return `${base} border-rose-300 bg-rose-50 hover:bg-rose-100 hover:border-rose-400 hover:scale-105 active:scale-95`;
    case 'primary':
      return `${base} border-indigo-300 bg-indigo-50 hover:bg-indigo-100 hover:border-indigo-400 hover:scale-105 active:scale-95 font-semibold`;
    default:
      return `${base} border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 hover:scale-105 active:scale-95`;
  }
}

function getForceIndicator(force: CommandCardAction['force']) {
  switch (force) {
    case 'ATTACK':
      return <span className="text-rose-600 text-[9px]">⚔️</span>;
    case 'SURRENDER':
      return <span className="text-emerald-600 text-[9px]">🏳️</span>;
    default:
      return null;
  }
}

function getRelevanceIndicator(relevance: CommandCardAction['relevance']) {
  if (!relevance) return null;
  switch (relevance) {
    case 'likely':
      return <span className="text-emerald-500 text-[8px]">●</span>;
    case 'unlikely':
      return <span className="text-amber-500 text-[8px]">○</span>;
    default:
      return null;
  }
}

export function CommandCard({
  actions,
  onPerform,
  variant = 'full',
  showHotkeyHints = true,
}: CommandCardProps) {
  const [executingId, setExecutingId] = useState<string | null>(null);
  const [lastExecutedId, setLastExecutedId] = useState<string | null>(null);

  const handlePerform = useCallback(async (action: CommandCardAction) => {
    if (action.disabled || executingId) return;

    setExecutingId(action.id);
    try {
      await onPerform(action);
      setLastExecutedId(action.id);
      setTimeout(() => setLastExecutedId(null), 1000);
    } catch (error) {
      console.error('Command execution failed:', error);
    } finally {
      setExecutingId(null);
    }
  }, [executingId, onPerform]);

  // Hotkey handling
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        (e.target as HTMLElement).isContentEditable
      ) {
        return;
      }

      const key = e.key.toUpperCase();
      const action = actions.find(
        a => a.hotkey?.toUpperCase() === key && !a.disabled
      );

      if (action) {
        e.preventDefault();
        handlePerform(action);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [actions, handlePerform]);

  // Group actions by row
  const grid = [
    actions.filter(a => a.group === 'top'),
    actions.filter(a => a.group === 'mid'),
    actions.filter(a => a.group === 'bottom'),
  ];

  const width = variant === 'compact' ? 'w-[220px]' : 'w-[280px]';

  return (
    <div className={`${width} rounded-xl border border-slate-200 bg-white/95 backdrop-blur shadow-lg p-2`}>
      {/* Header */}
      <div className="mb-2 px-1">
        <h3 className="text-xs font-semibold text-slate-700">Actions</h3>
        {showHotkeyHints && (
          <p className="text-[9px] text-slate-500 mt-0.5">
            Press highlighted keys to execute
          </p>
        )}
      </div>

      {/* Action Grid */}
      <div className="space-y-1">
        {grid.map((row, rowIndex) => (
          <div key={rowIndex} className="grid grid-cols-3 gap-1">
            {row.slice(0, 3).map(action => {
              const isExecuting = executingId === action.id;
              const wasExecuted = lastExecutedId === action.id;

              return (
                <button
                  key={action.id}
                  title={action.reason || action.label}
                  disabled={action.disabled || !!executingId}
                  className={getActionStyles(action, isExecuting)}
                  onClick={() => handlePerform(action)}
                  aria-label={action.label}
                  aria-keyshortcuts={action.hotkey}
                >
                  {/* Success flash */}
                  {wasExecuted && (
                    <div className="absolute inset-0 bg-emerald-400/50 animate-ping" />
                  )}

                  {/* Loading spinner */}
                  {isExecuting && (
                    <div className="absolute inset-0 flex items-center justify-center bg-white/80">
                      <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                    </div>
                  )}

                  <div className="flex flex-col items-center justify-center leading-tight relative z-10">
                    {/* Label with indicators */}
                    <div className="flex items-center gap-0.5">
                      {getForceIndicator(action.force)}
                      <span className="truncate max-w-[80px]">{action.label}</span>
                      {getRelevanceIndicator(action.relevance)}
                    </div>

                    {/* Hotkey hint */}
                    {showHotkeyHints && action.hotkey && !action.disabled && (
                      <span className="opacity-60 text-[9px] mt-0.5 font-mono bg-slate-100 px-1 rounded">
                        {action.hotkey}
                      </span>
                    )}

                    {/* Disabled reason */}
                    {action.disabled && action.reason && (
                      <span className="text-[8px] text-slate-500 mt-0.5 italic truncate max-w-full">
                        {action.reason}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
            
            {/* Fill empty slots */}
            {row.length < 3 &&
              Array.from({ length: 3 - row.length }).map((_, j) => (
                <div key={`empty-${j}`} className="h-10" />
              ))}
          </div>
        ))}
      </div>

      {/* Stats footer */}
      <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[9px] text-slate-500 px-1">
        <span>{actions.filter(a => !a.disabled).length} available</span>
        {executingId && (
          <span className="text-blue-600 font-medium animate-pulse">Executing...</span>
        )}
      </div>
    </div>
  );
}

// Helper function to execute commands (used by parent components)
export async function performCommand(action: CommandCardAction): Promise<void> {
  if (action.scaffold?.template) {
    // Client-side: insert template into composer
    window.dispatchEvent(
      new CustomEvent('mesh:composer:insert', {
        detail: { template: action.scaffold.template },
      })
    );

    // Optional: track analytics
    if (action.scaffold.analyticsName) {
      // trackEvent(action.scaffold.analyticsName);
    }
    return;
  }

  if (action.move) {
    // Server-side: execute protocol move
    const { deliberationId, targetType, targetId, locusPath } = action.target;
    
    const response = await fetch('/api/dialogue/move', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        deliberationId,
        targetType,
        targetId,
        kind: action.move.kind,
        payload: {
          ...(action.move.payload || {}),
          ...(locusPath ? { locusPath } : {}),
        },
        postAs: action.move.postAs,
        autoCompile: true,
        autoStep: true,
      }),
    });

    if (!response.ok) {
      throw new Error(`Move failed: ${response.statusText}`);
    }

    // Trigger UI refresh
    window.dispatchEvent(new CustomEvent('mesh:dialogue:refresh'));
  }
}
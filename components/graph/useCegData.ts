// lib/client/ceg/useCegData.ts
'use client';

import { useEffect, useState, useCallback } from 'react';
import useSWR from 'swr';

export type CegNode = {
  id: string;
  type: 'claim';
  text: string;
  label?: 'IN' | 'OUT' | 'UNDEC';
  approvals: number;
  rejections?: number;
  confidence?: number;
  schemeIcon?: string | null;
  authorId?: string;
  createdAt?: string;
};

export type CegEdge = {
  id: string;
  source: string;
  target: string;
  type: 'supports' | 'rebuts';
  attackType?: 'SUPPORTS' | 'REBUTS' | 'UNDERCUTS' | 'UNDERMINES';
  targetScope?: 'premise' | 'inference' | 'conclusion' | null;
  confidence?: number;
};

export type CegStats = {
  supportWeighted: number;
  counterWeighted: number;
  supportPct: number;
  counterPct: number;
  totalClaims: number;
  inClaims: number;
  outClaims: number;
  undecClaims: number;
};

const fetcher = (url: string) => fetch(url, { cache: 'no-store' }).then(r => r.json());

export function useCegData(deliberationId: string) {
  const { data: graphData, error: graphError, mutate: mutateGraph } = useSWR(
    `/api/deliberations/${deliberationId}/graph`,
    fetcher,
    { 
      revalidateOnFocus: false,
      refreshInterval: 30000, // Refresh every 30s
    }
  );

  const { data: statsData, error: statsError, mutate: mutateStats } = useSWR(
    `/api/deliberations/${deliberationId}/ceg/mini`,
    fetcher,
    { 
      revalidateOnFocus: false,
      refreshInterval: 30000,
    }
  );

  const nodes: CegNode[] = graphData?.nodes ?? [];
  const edges: CegEdge[] = graphData?.edges ?? [];
  const stats: CegStats | null = statsData ? {
    ...statsData,
    totalClaims: nodes.length,
    inClaims: nodes.filter(n => n.label === 'IN').length,
    outClaims: nodes.filter(n => n.label === 'OUT').length,
    undecClaims: nodes.filter(n => n.label === 'UNDEC').length,
  } : null;

  const loading = !graphData && !graphError;
  const error = graphError || statsError;

  // Manual refresh function
  const refresh = useCallback(async () => {
    await Promise.all([mutateGraph(), mutateStats()]);
  }, [mutateGraph, mutateStats]);

  // Listen for refresh events
  useEffect(() => {
    const handleRefresh = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail?.deliberationId === deliberationId) {
        refresh();
      }
    };

    window.addEventListener('mesh:ceg:refresh', handleRefresh);
    window.addEventListener('mesh:dialogue:refresh', handleRefresh);
    
    return () => {
      window.removeEventListener('mesh:ceg:refresh', handleRefresh);
      window.removeEventListener('mesh:dialogue:refresh', handleRefresh);
    };
  }, [deliberationId, refresh]);

  return {
    nodes,
    edges,
    stats,
    loading,
    error,
    refresh,
  };
}

// Hook for focused subgraph around a specific node
export function useFocusedCegData(
  deliberationId: string,
  focusNodeId: string | null,
  radius: number = 2
) {
  const { nodes: allNodes, edges: allEdges, loading, error, refresh } = useCegData(deliberationId);

  const { focusedNodes, focusedEdges } = useCallback(() => {
    if (!focusNodeId || allNodes.length === 0) {
      return { focusedNodes: allNodes, focusedEdges: allEdges };
    }

    // BFS to find nodes within radius
    const visited = new Set<string>([focusNodeId]);
    const queue: Array<{ id: string; depth: number }> = [{ id: focusNodeId, depth: 0 }];
    
    const edgeMap = new Map<string, string[]>();
    allEdges.forEach(e => {
      if (!edgeMap.has(e.source)) edgeMap.set(e.source, []);
      if (!edgeMap.has(e.target)) edgeMap.set(e.target, []);
      edgeMap.get(e.source)!.push(e.target);
      edgeMap.get(e.target)!.push(e.source); // bidirectional for neighborhood
    });

    while (queue.length > 0) {
      const { id, depth } = queue.shift()!;
      if (depth >= radius) continue;

      const neighbors = edgeMap.get(id) ?? [];
      for (const neighborId of neighbors) {
        if (!visited.has(neighborId)) {
          visited.add(neighborId);
          queue.push({ id: neighborId, depth: depth + 1 });
        }
      }
    }

    const focusedNodes = allNodes.filter(n => visited.has(n.id));
    const focusedEdges = allEdges.filter(
      e => visited.has(e.source) && visited.has(e.target)
    );

    return { focusedNodes, focusedEdges };
  }, [focusNodeId, allNodes, allEdges, radius])();

  return {
    nodes: focusedNodes,
    edges: focusedEdges,
    loading,
    error,
    refresh,
  };
}
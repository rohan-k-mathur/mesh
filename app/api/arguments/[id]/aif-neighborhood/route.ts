// app/api/arguments/[id]/aif-neighborhood/route.ts
// API endpoint for fetching multi-argument neighborhoods

import { NextRequest, NextResponse } from 'next/server';
import { buildAifNeighborhood, getNeighborhoodSummary } from '@/lib/arguments/diagram-neighborhoods';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Get parameters
    const depth = Number(searchParams.get('depth') || '1');
    const includeSupporting = searchParams.get('includeSupporting') !== 'false';
    const includeOpposing = searchParams.get('includeOpposing') !== 'false';
    const includePreferences = searchParams.get('includePreferences') !== 'false';
    const maxNodes = Number(searchParams.get('maxNodes') || '200');
    const summaryOnly = searchParams.get('summaryOnly') === 'true';

    // Validate depth
    if (depth < 0 || depth > 5) {
      return NextResponse.json(
        { ok: false, error: 'Depth must be between 0 and 5' },
        { status: 400 }
      );
    }

    // If only summary is requested
    if (summaryOnly) {
      const summary = await getNeighborhoodSummary(params.id);
      
      if (!summary) {
        return NextResponse.json(
          { ok: false, error: 'Argument not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        ok: true,
        summary,
      });
    }

    // Build full neighborhood
    const aif = await buildAifNeighborhood(params.id, depth, {
      includeSupporting,
      includeOpposing,
      includePreferences,
      maxNodes,
    });

    if (!aif) {
      return NextResponse.json(
        { ok: false, error: 'Argument not found' },
        { status: 404 }
      );
    }

    // Also get summary for metadata
    const summary = await getNeighborhoodSummary(params.id);

    return NextResponse.json({
      ok: true,
      aif,
      summary,
      metadata: {
        depth,
        nodeCount: aif.nodes.length,
        edgeCount: aif.edges.length,
        byKind: {
          'I': aif.nodes.filter(n => n.kind === 'I').length,
          'RA': aif.nodes.filter(n => n.kind === 'RA').length,
          'CA': aif.nodes.filter(n => n.kind === 'CA').length,
          'PA': aif.nodes.filter(n => n.kind === 'PA').length,
        }
      }
    });

  } catch (error) {
    console.error('Error building AIF neighborhood:', error);
    return NextResponse.json(
      { 
        ok: false, 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * Example requests:
 * 
 * 1. Get immediate neighborhood (1-hop):
 *    GET /api/arguments/arg_123/aif-neighborhood?depth=1
 * 
 * 2. Get 2-hop neighborhood, max 100 nodes:
 *    GET /api/arguments/arg_123/aif-neighborhood?depth=2&maxNodes=100
 * 
 * 3. Get only conflicts (no support):
 *    GET /api/arguments/arg_123/aif-neighborhood?depth=1&includeSupporting=false
 * 
 * 4. Get just the summary (no graph):
 *    GET /api/arguments/arg_123/aif-neighborhood?summaryOnly=true
 * 
 * Response format:
 * {
 *   "ok": true,
 *   "aif": {
 *     "nodes": [...],
 *     "edges": [...]
 *   },
 *   "summary": {
 *     "supportCount": 2,
 *     "conflictCount": 1,
 *     "preferenceCount": 0,
 *     "totalConnections": 3
 *   },
 *   "metadata": {
 *     "depth": 1,
 *     "nodeCount": 15,
 *     "edgeCount": 12,
 *     "byKind": {
 *       "I": 8,
 *       "RA": 5,
 *       "CA": 2,
 *       "PA": 0
 *     }
 *   }
 * }
 */

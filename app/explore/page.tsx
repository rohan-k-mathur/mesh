/**
 * Phase 3.4.1: Explore Page
 * 
 * Knowledge graph exploration interface for discovering
 * connections between sources, topics, and deliberations.
 */

import { Metadata } from "next";
import { KnowledgeGraphExplorer } from "@/components/explore";

export const metadata: Metadata = {
  title: "Explore | Mesh",
  description: "Explore the knowledge graph of sources, topics, and deliberations",
};

interface ExplorePageProps {
  searchParams: Promise<{
    type?: string;
    id?: string;
  }>;
}

export default async function ExplorePage({ searchParams }: ExplorePageProps) {
  const params = await searchParams;
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-2xl font-bold text-gray-900">
            Explore Knowledge Graph
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Discover connections between sources, topics, and deliberations.
            Click nodes to navigate, double-click to center.
          </p>
        </div>
      </div>

      {/* Graph */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <KnowledgeGraphExplorer
          initialNodeType={params.type}
          initialNodeId={params.id}
          height={700}
          className="shadow-sm"
        />
      </div>

      {/* Tips */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        <div className="bg-white rounded-lg border p-4">
          <h2 className="text-sm font-medium text-gray-900 mb-2">Tips</h2>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• Use the search bar to find specific sources, topics, or deliberations</li>
            <li>• Filter by node type to focus on specific entity types</li>
            <li>• Adjust depth to explore more or fewer connections</li>
            <li>• Drag nodes to rearrange the layout</li>
            <li>• Scroll to zoom in/out, drag background to pan</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

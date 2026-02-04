"use client";

/**
 * Academic Features Demo Page
 * 
 * Interactive demonstration of all academic features implemented:
 * - Phase 1: Paper-to-Claim Pipeline, Claim Search
 * - Phase 2: Debate Releases & Versioning, Forks & Merges
 * - Phase 3: Provenance & Challenges, Export Formats, Argument Citations
 * 
 * Accessible at: /test/academic-features
 */

import * as React from "react";
import { useState } from "react";
import {
  FileText,
  Search,
  GitBranch,
  History,
  Download,
  Link2,
  BookOpen,
  Shield,
  Users,
  Sparkles,
  ChevronRight,
  Check,
  Copy,
  ExternalLink,
  ArrowRight,
  Quote,
  Scale,
  Network,
  MessageSquare,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import {
  ArgumentCitationBadge,
  CitationTypeSelector,
  PermalinkCopyButton,
  ArgumentCitationCard,
  CitationGraphStats,
} from "@/components/citations/argument";
import type { ArgCitationType, ArgumentCitationSummary, CitationGraph } from "@/lib/citations/argumentCitationTypes";

// ─────────────────────────────────────────────────────────────────────────────
// MOCK DATA
// ─────────────────────────────────────────────────────────────────────────────

const MOCK_CITATION_GRAPH: CitationGraph = {
  nodes: [
    { id: "arg-1", label: "Climate Change", type: "argument", citationCount: 5 },
    { id: "arg-2", label: "Policy Response", type: "argument", citationCount: 3 },
    { id: "arg-3", label: "Economic Impact", type: "argument", citationCount: 2 },
    { id: "arg-4", label: "Renewable Energy", type: "argument", citationCount: 4 },
    { id: "arg-5", label: "Carbon Tax", type: "argument", citationCount: 1 },
  ],
  edges: [
    { source: "arg-2", target: "arg-1", citationType: "SUPPORT", weight: 1 },
    { source: "arg-3", target: "arg-1", citationType: "EXTENSION", weight: 1 },
    { source: "arg-4", target: "arg-2", citationType: "APPLICATION", weight: 1 },
    { source: "arg-5", target: "arg-3", citationType: "CONTRAST", weight: 1 },
    { source: "arg-4", target: "arg-3", citationType: "REBUTTAL", weight: 1 },
  ],
  totalNodes: 5,
  totalEdges: 5,
};

const MOCK_CITATIONS: ArgumentCitationSummary[] = [
  {
    id: "cit-1",
    citingArgumentId: "arg-2",
    citedArgumentId: "arg-1",
    citationType: "SUPPORT",
    annotation: "This argument provides foundational evidence for the policy response.",
    createdById: "user-1",
    createdAt: new Date("2026-01-15"),
    citedArgument: {
      id: "arg-1",
      text: "Climate change is accelerating beyond predicted models, requiring immediate policy intervention.",
      authorId: "user-2",
      deliberationId: "delib-1",
      deliberationTitle: "Climate Policy Debate",
    },
  },
  {
    id: "cit-2",
    citingArgumentId: "arg-3",
    citedArgumentId: "arg-1",
    citationType: "EXTENSION",
    annotation: "Extending the analysis to include economic considerations.",
    createdById: "user-1",
    createdAt: new Date("2026-01-20"),
    citedArgument: {
      id: "arg-1",
      text: "Climate change is accelerating beyond predicted models, requiring immediate policy intervention.",
      authorId: "user-2",
      deliberationId: "delib-1",
      deliberationTitle: "Climate Policy Debate",
    },
  },
  {
    id: "cit-3",
    citingArgumentId: "arg-5",
    citedArgumentId: "arg-3",
    citationType: "REBUTTAL",
    annotation: "The economic analysis fails to account for transition costs.",
    createdById: "user-3",
    createdAt: new Date("2026-01-25"),
    citedArgument: {
      id: "arg-3",
      text: "Economic benefits of climate action outweigh short-term costs by a factor of 3:1.",
      authorId: "user-1",
      deliberationId: "delib-1",
      deliberationTitle: "Climate Policy Debate",
    },
  },
];

const MOCK_EXPORT_FORMATS = [
  { id: "bibtex", label: "BibTeX", icon: FileText, description: "LaTeX bibliography format" },
  { id: "ris", label: "RIS", icon: FileText, description: "Research Information Systems" },
  { id: "markdown", label: "Markdown", icon: FileText, description: "With TOC and frontmatter" },
  { id: "pdf", label: "PDF", icon: Download, description: "Print-ready document" },
];

const CITATION_FORMATS = [
  { format: "apa" as const, label: "APA (7th ed.)", sample: 'Smith, J. (2026). Climate change argument. In Climate Policy Debate. Mesh. Retrieved from https://mesh.app/a/xK3m9pQw' },
  { format: "mla" as const, label: "MLA (9th ed.)", sample: 'Smith, John. "Climate change argument." Climate Policy Debate, Mesh, 2026, mesh.app/a/xK3m9pQw.' },
  { format: "chicago" as const, label: "Chicago (17th ed.)", sample: 'Smith, John. "Climate change argument." In Climate Policy Debate. Mesh, 2026. https://mesh.app/a/xK3m9pQw.' },
  { format: "bibtex" as const, label: "BibTeX", sample: '@misc{mesh_xK3m9pQw,\n  author = {Smith, John},\n  title = {Climate change argument},\n  howpublished = {Mesh},\n  year = {2026},\n  url = {https://mesh.app/a/xK3m9pQw}\n}' },
];

// ─────────────────────────────────────────────────────────────────────────────
// FEATURE CARDS
// ─────────────────────────────────────────────────────────────────────────────

const PHASES = [
  {
    id: "phase1",
    title: "Phase 1: Core Academic Infrastructure",
    description: "Foundation for academic deliberation",
    features: [
      {
        id: "paper-pipeline",
        title: "Paper-to-Claim Pipeline",
        description: "Upload academic papers and extract claims with proper source attribution",
        icon: FileText,
        status: "complete" as const,
        items: ["PDF upload & text extraction", "AI-powered claim extraction", "Automatic source linking", "Academic claim classification"],
      },
      {
        id: "claim-search",
        title: "Claim-Based Search",
        description: "Discover related claims across deliberations",
        icon: Search,
        status: "complete" as const,
        items: ["PostgreSQL text search", "Keyword scoring", "Related claims discovery", "Challenge detection"],
      },
    ],
  },
  {
    id: "phase2",
    title: "Phase 2: Versioning & Memory",
    description: "Track evolution and enable collaboration",
    features: [
      {
        id: "releases",
        title: "Debate Releases & Versioning",
        description: "Create citable, versioned snapshots of deliberation state",
        icon: History,
        status: "complete" as const,
        items: ["Semantic versioning (major.minor.patch)", "Point-in-time snapshots", "Changelog generation", "BibTeX citations"],
      },
      {
        id: "forks",
        title: "Forks & Merges",
        description: "Branch deliberations and merge contributions",
        icon: GitBranch,
        status: "complete" as const,
        items: ["Fork deliberations", "Merge requests", "Conflict resolution", "Contribution tracking"],
      },
    ],
  },
  {
    id: "phase3",
    title: "Phase 3: Scholarly Infrastructure",
    description: "Full academic citation and export support",
    features: [
      {
        id: "provenance",
        title: "Provenance & Challenges",
        description: "Track claim history, attacks, and defenses",
        icon: Shield,
        status: "complete" as const,
        items: ["Version history", "Attack/defense tracking", "Consensus indicators", "Canonical claims"],
      },
      {
        id: "exports",
        title: "Export Formats",
        description: "Export deliberations in academic formats",
        icon: Download,
        status: "complete" as const,
        items: ["BibTeX export", "RIS export", "Markdown with TOC", "PDF generation"],
      },
      {
        id: "citations",
        title: "Argument Citations",
        description: "Cite specific arguments with stable permalinks",
        icon: Link2,
        status: "complete" as const,
        items: ["Stable permalinks", "8 citation types", "Citation graphs", "APA/MLA/Chicago/BibTeX"],
      },
      {
        id: "quotes",
        title: "Quotes & Interpretations",
        description: "Quote text with structured interpretations",
        icon: Quote,
        status: "complete" as const,
        items: ["Quote extraction", "Locator types", "Interpretations", "Voting on interpretations"],
      },
    ],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────

function FeatureCard({ feature }: { feature: typeof PHASES[0]["features"][0] }) {
  const Icon = feature.icon;
  
  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-100 text-blue-700">
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <CardTitle className="text-lg">{feature.title}</CardTitle>
              <CardDescription className="text-sm">{feature.description}</CardDescription>
            </div>
          </div>
          <Badge variant="default" className="bg-green-600">
            <Check className="w-3 h-3 mr-1" />
            Complete
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <ul className="space-y-1.5">
          {feature.items.map((item, i) => (
            <li key={i} className="flex items-center gap-2 text-sm text-slate-600">
              <ChevronRight className="w-3 h-3 text-slate-400" />
              {item}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

function CitationTypeDemo() {
  const [selectedType, setSelectedType] = useState<ArgCitationType>("SUPPORT");
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Link2 className="w-5 h-5" />
          Citation Types
        </CardTitle>
        <CardDescription>
          8 distinct citation types for precise scholarly references
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-sm font-medium text-slate-700 mb-2">Select a citation type:</p>
          <CitationTypeSelector
            value={selectedType}
            onChange={setSelectedType}
            size="sm"
          />
        </div>
        
        <div className="border-t pt-4">
          <p className="text-sm font-medium text-slate-700 mb-2">Badge variants:</p>
          <div className="flex flex-wrap gap-2">
            <ArgumentCitationBadge type={selectedType} size="xs" />
            <ArgumentCitationBadge type={selectedType} size="sm" />
            <ArgumentCitationBadge type={selectedType} size="md" />
            <ArgumentCitationBadge type={selectedType} size="md" showIcon={false} />
            <ArgumentCitationBadge type={selectedType} size="sm" showLabel={false} />
          </div>
        </div>
        
        <div className="border-t pt-4">
          <p className="text-sm font-medium text-slate-700 mb-2">All types:</p>
          <div className="flex flex-wrap gap-2">
            {(["SUPPORT", "EXTENSION", "APPLICATION", "CONTRAST", "REBUTTAL", "REFINEMENT", "METHODOLOGY", "CRITIQUE"] as ArgCitationType[]).map((type) => (
              <ArgumentCitationBadge key={type} type={type} size="xs" />
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function CitationListDemo() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BookOpen className="w-5 h-5" />
          Citation Cards
        </CardTitle>
        <CardDescription>
          View citations with type, direction, and context
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {MOCK_CITATIONS.map((citation) => (
          <ArgumentCitationCard
            key={citation.id}
            citation={citation}
            direction="made"
            onArgumentClick={(id) => alert(`Navigate to argument: ${id}`)}
          />
        ))}
      </CardContent>
    </Card>
  );
}

function CitationFormatsDemo() {
  const [copiedFormat, setCopiedFormat] = useState<string | null>(null);
  
  const handleCopy = async (format: string, text: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedFormat(format);
    setTimeout(() => setCopiedFormat(null), 2000);
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Citation Formats
        </CardTitle>
        <CardDescription>
          Generate citations in academic formats
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {CITATION_FORMATS.map((item) => (
          <div key={item.format} className="border rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium text-sm">{item.label}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleCopy(item.format, item.sample)}
              >
                {copiedFormat === item.format ? (
                  <Check className="w-4 h-4 text-green-500" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </Button>
            </div>
            <pre className="text-xs bg-slate-50 p-2 rounded overflow-x-auto whitespace-pre-wrap">
              {item.sample}
            </pre>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function GraphStatsDemo() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Network className="w-5 h-5" />
          Citation Graph Stats
        </CardTitle>
        <CardDescription>
          Analyze citation relationships within a deliberation
        </CardDescription>
      </CardHeader>
      <CardContent>
        <CitationGraphStats graph={MOCK_CITATION_GRAPH} />
        
        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
          <p className="text-xs text-blue-700">
            <strong>Note:</strong> The full interactive graph visualization uses SVG with zoom/pan controls.
            See the ArgumentCitationGraphViewer component for the complete implementation.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

function ExportFormatsDemo() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Download className="w-5 h-5" />
          Export Formats
        </CardTitle>
        <CardDescription>
          Export deliberations and arguments in various formats
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3">
          {MOCK_EXPORT_FORMATS.map((format) => {
            const Icon = format.icon;
            return (
              <button
                key={format.id}
                className="flex items-center gap-3 p-3 border rounded-lg hover:bg-slate-50 transition-colors text-left"
                onClick={() => alert(`Export as ${format.label}`)}
              >
                <div className="p-2 rounded bg-slate-100">
                  <Icon className="w-4 h-4 text-slate-600" />
                </div>
                <div>
                  <p className="font-medium text-sm">{format.label}</p>
                  <p className="text-xs text-slate-500">{format.description}</p>
                </div>
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

function ProvenanceDemo() {
  const [consensusStatus, setConsensusStatus] = useState<"contested" | "emerging" | "established">("emerging");
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="w-5 h-5" />
          Provenance & Consensus
        </CardTitle>
        <CardDescription>
          Track claim history and consensus status
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-sm font-medium text-slate-700 mb-2">Consensus Status:</p>
          <div className="flex gap-2">
            {(["contested", "emerging", "established"] as const).map((status) => (
              <button
                key={status}
                onClick={() => setConsensusStatus(status)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  consensusStatus === status
                    ? status === "contested"
                      ? "bg-red-100 text-red-700 ring-2 ring-red-300"
                      : status === "emerging"
                      ? "bg-amber-100 text-amber-700 ring-2 ring-amber-300"
                      : "bg-green-100 text-green-700 ring-2 ring-green-300"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>
        </div>
        
        <div className="border-t pt-4">
          <p className="text-sm font-medium text-slate-700 mb-2">Version Timeline:</p>
          <div className="space-y-2">
            {[
              { version: "1.2.0", date: "Feb 1, 2026", change: "Major revision" },
              { version: "1.1.0", date: "Jan 25, 2026", change: "Added evidence" },
              { version: "1.0.0", date: "Jan 15, 2026", change: "Initial version" },
            ].map((v, i) => (
              <div key={i} className="flex items-center gap-3 text-sm">
                <Badge variant="outline" className="font-mono">{v.version}</Badge>
                <span className="text-slate-500">{v.date}</span>
                <span className="text-slate-700">{v.change}</span>
              </div>
            ))}
          </div>
        </div>
        
        <div className="border-t pt-4">
          <p className="text-sm font-medium text-slate-700 mb-2">Challenge Status:</p>
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <span>2 Active Attacks</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-green-500" />
              <span>3 Defended</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-slate-300" />
              <span>1 Pending</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ReleasesDemo() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="w-5 h-5" />
          Debate Releases
        </CardTitle>
        <CardDescription>
          Versioned, citable snapshots of deliberation state
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="border rounded-lg overflow-hidden">
          <div className="bg-slate-50 px-4 py-2 border-b flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge className="font-mono">v2.1.0</Badge>
              <span className="text-sm font-medium">Climate Policy Consensus</span>
            </div>
            <Badge variant="outline" className="text-green-600 border-green-300">Latest</Badge>
          </div>
          <div className="p-4 space-y-3">
            <p className="text-sm text-slate-600">
              Major update including new economic analysis and policy recommendations.
            </p>
            <div className="flex items-center gap-4 text-xs text-slate-500">
              <span>📅 Feb 1, 2026</span>
              <span>👤 Dr. Jane Smith</span>
              <span>📝 42 claims • 18 arguments</span>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Download className="w-3 h-3 mr-1" />
                Export
              </Button>
              <Button variant="outline" size="sm">
                <Copy className="w-3 h-3 mr-1" />
                Cite
              </Button>
              <Button variant="outline" size="sm">
                <ExternalLink className="w-3 h-3 mr-1" />
                View
              </Button>
            </div>
          </div>
        </div>
        
        <div className="text-xs text-slate-500 space-y-1">
          <p><strong>Changelog:</strong></p>
          <ul className="list-disc pl-5 space-y-0.5">
            <li>Added 5 new claims from economic analysis</li>
            <li>Resolved 3 merge conflicts from community fork</li>
            <li>Updated consensus status on 2 contested claims</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────────────────────────────────────

export default function AcademicFeaturesDemo() {
  const [activeTab, setActiveTab] = useState("overview");
  
  return (
    <TooltipProvider>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Header */}
          <div className="text-center space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-100 text-blue-700 text-sm font-medium">
              <Sparkles className="w-4 h-4" />
              Academic Features Demo
            </div>
            <h1 className="text-4xl font-bold text-slate-900">
              Scholarly Deliberation Infrastructure
            </h1>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Complete academic features for citations, versioning, provenance tracking, 
              and scholarly exports. Enabling rigorous deliberation with proper attribution.
            </p>
          </div>
          
          {/* Stats Bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Phases Complete", value: "3/3", icon: Check },
              { label: "Features Built", value: "8", icon: Sparkles },
              { label: "Citation Types", value: "8", icon: Link2 },
              { label: "Export Formats", value: "4", icon: Download },
            ].map((stat, i) => {
              const Icon = stat.icon;
              return (
                <Card key={i} className="text-center p-4">
                  <Icon className="w-5 h-5 mx-auto mb-2 text-blue-600" />
                  <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
                  <p className="text-xs text-slate-500">{stat.label}</p>
                </Card>
              );
            })}
          </div>
          
          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid grid-cols-4 w-full max-w-2xl mx-auto">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="citations">Citations</TabsTrigger>
              <TabsTrigger value="versioning">Versioning</TabsTrigger>
              <TabsTrigger value="exports">Exports</TabsTrigger>
            </TabsList>
            
            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-8">
              {PHASES.map((phase) => (
                <div key={phase.id} className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="h-px flex-1 bg-slate-200" />
                    <h2 className="text-lg font-semibold text-slate-700">{phase.title}</h2>
                    <div className="h-px flex-1 bg-slate-200" />
                  </div>
                  <p className="text-center text-sm text-slate-500">{phase.description}</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {phase.features.map((feature) => (
                      <FeatureCard key={feature.id} feature={feature} />
                    ))}
                  </div>
                </div>
              ))}
            </TabsContent>
            
            {/* Citations Tab */}
            <TabsContent value="citations" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <CitationTypeDemo />
                <CitationFormatsDemo />
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <CitationListDemo />
                <GraphStatsDemo />
              </div>
            </TabsContent>
            
            {/* Versioning Tab */}
            <TabsContent value="versioning" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ReleasesDemo />
                <ProvenanceDemo />
              </div>
              
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <GitBranch className="w-5 h-5" />
                    Forks & Merges
                  </CardTitle>
                  <CardDescription>
                    Branch deliberations and merge contributions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      <div className="flex-1 border rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline">main</Badge>
                          <span className="text-sm font-medium">Climate Policy Debate</span>
                        </div>
                        <p className="text-xs text-slate-500">42 claims • 18 arguments</p>
                      </div>
                      <ArrowRight className="w-4 h-4 text-slate-400" />
                      <div className="flex-1 border rounded-lg p-3 border-purple-200 bg-purple-50">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge className="bg-purple-600">fork</Badge>
                          <span className="text-sm font-medium">Economic Analysis Branch</span>
                        </div>
                        <p className="text-xs text-slate-500">+8 claims • +3 arguments</p>
                      </div>
                    </div>
                    <div className="flex justify-center gap-2">
                      <Button variant="outline" size="sm">
                        <GitBranch className="w-3 h-3 mr-1" />
                        Create Fork
                      </Button>
                      <Button variant="outline" size="sm">
                        <MessageSquare className="w-3 h-3 mr-1" />
                        Open Merge Request
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Exports Tab */}
            <TabsContent value="exports" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ExportFormatsDemo />
                
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Quote className="w-5 h-5" />
                      Quotes & Interpretations
                    </CardTitle>
                    <CardDescription>
                      Extract and interpret quotes with structured metadata
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="border-l-4 border-blue-400 bg-blue-50 p-4 rounded-r-lg">
                      <p className="text-sm italic text-slate-700">
                        &ldquo;The evidence clearly demonstrates that immediate action is required 
                        to prevent irreversible damage to global ecosystems.&rdquo;
                      </p>
                      <div className="mt-2 flex items-center gap-2 text-xs text-slate-500">
                        <span>📄 IPCC Report 2025</span>
                        <span>•</span>
                        <span>Page 42, Para 3</span>
                      </div>
                    </div>
                    
                    <div>
                      <p className="text-sm font-medium text-slate-700 mb-2">Interpretations:</p>
                      <div className="space-y-2">
                        {[
                          { text: "Supports immediate policy intervention", votes: 12 },
                          { text: "Emphasizes ecosystem-focused approach", votes: 8 },
                          { text: "Implies urgency over economic concerns", votes: 5 },
                        ].map((interp, i) => (
                          <div key={i} className="flex items-center justify-between p-2 bg-slate-50 rounded">
                            <span className="text-sm">{interp.text}</span>
                            <Badge variant="secondary">{interp.votes} votes</Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
          
          {/* Implementation Notes */}
          <Card className="bg-slate-800 text-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="w-5 h-5" />
                Implementation Reference
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
                <div>
                  <p className="font-semibold mb-2 text-blue-300">Key Files</p>
                  <ul className="space-y-1 text-slate-300 font-mono text-xs">
                    <li>lib/citations/argumentCitationTypes.ts</li>
                    <li>lib/citations/permalinkService.ts</li>
                    <li>lib/citations/citationGraphService.ts</li>
                    <li>lib/releases/releaseService.ts</li>
                    <li>lib/provenance/provenanceService.ts</li>
                  </ul>
                </div>
                <div>
                  <p className="font-semibold mb-2 text-blue-300">API Routes</p>
                  <ul className="space-y-1 text-slate-300 font-mono text-xs">
                    <li>/api/arguments/[id]/arg-citations</li>
                    <li>/api/arguments/[id]/permalink</li>
                    <li>/api/deliberations/[id]/releases</li>
                    <li>/api/deliberations/[id]/export</li>
                    <li>/api/claims/[id]/provenance</li>
                  </ul>
                </div>
                <div>
                  <p className="font-semibold mb-2 text-blue-300">Components</p>
                  <ul className="space-y-1 text-slate-300 font-mono text-xs">
                    <li>components/citations/argument/</li>
                    <li>components/exports/</li>
                    <li>components/provenance/</li>
                    <li>components/forks/</li>
                    <li>components/quotes/</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Footer */}
          <div className="text-center text-sm text-slate-500 pb-8">
            <p>Academic Features Demo • Phase 1-3 Complete • Mesh Platform</p>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}

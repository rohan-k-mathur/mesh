"use client";

/**
 * Stacks Features Demo Page
 * 
 * Interactive demonstration of all Stacks/Library features:
 * 
 * FOUNDATIONAL FEATURES:
 * - Stack CRUD (create, edit, delete stacks)
 * - PDF Upload & Management
 * - Document Ordering (drag-and-drop)
 * - PDF Viewer with Annotations
 * - Stack Discussion Threads
 * - Collaborators & RBAC
 * - Subscriptions
 * 
 * PHASE 1 IMPROVEMENTS (Are.na Parity):
 * - 1.1 StackItem Join Table (multi-stack connections)
 * - 1.2 Block Types (PDF, Link, Text, Video)
 * - 1.3 Connect UI & Contexts Panel
 * - 1.4 Stack Embeds (stacks containing stacks)
 * - 1.5 Visibility Modes (public_open, public_closed, private, unlisted)
 * - 1.6 Export Functionality (ZIP, Markdown, BibTeX)
 * 
 * PHASE 2 IMPROVEMENTS (Evidence UX):
 * - 2.1 Citation Anchors (executable citations)
 * - 2.2 Lift Carries Citations
 * - 2.3 Citation Intent (supports/refutes/context)
 * 
 * Accessible at: /test/stacks-features
 */

import * as React from "react";
import { useState } from "react";
import { toast, Toaster } from "sonner";
import {
  FileText,
  Link2,
  Layers,
  FolderOpen,
  Download,
  Eye,
  Lock,
  Users,
  Globe,
  LinkIcon,
  MessageSquare,
  ArrowUp,
  Quote,
  FileTextIcon,
  VideoIcon,
  ImageIcon,
  PlusCircle,
  GripVertical,
  ExternalLink,
  Check,
  ChevronRight,
  BookOpen,
  Shield,
  ArrowUpRight,
  FolderIcon,
  Search,
  FileJsonIcon,
  Settings,
  UserPlus,
  Bell,
  Highlighter,
  Network,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// ─────────────────────────────────────────────────────────────────────────────
// MOCK DATA
// ─────────────────────────────────────────────────────────────────────────────

const MOCK_STACK = {
  id: "stack-demo-1",
  name: "Climate Research Collection",
  slug: "climate-research-collection",
  description: "A curated collection of climate science papers and resources",
  visibility: "public_closed" as const,
  owner: { id: "user-1", name: "Dr. Jane Smith", username: "jsmith" },
  collaborators: [
    { id: "user-2", name: "Alex Chen", role: "EDITOR" },
    { id: "user-3", name: "Maria Garcia", role: "VIEWER" },
  ],
  _count: { items: 12, subscribers: 45, comments: 23 },
  createdAt: new Date("2025-11-01"),
};

const MOCK_BLOCKS: MockBlock[] = [
  {
    id: "block-1",
    kind: "block",
    blockType: "pdf",
    title: "IPCC Climate Report 2025",
    file_url: "https://example.com/ipcc-2025.pdf",
    thumb_urls: ["/placeholder-thumb.png"],
    connectedStacksCount: 3,
    processingStatus: "done",
  },
  {
    id: "block-2",
    kind: "block",
    blockType: "link",
    title: "NASA Climate Data Portal",
    linkUrl: "https://climate.nasa.gov",
    linkDescription: "Official NASA climate data and research portal",
    linkImage: "https://climate.nasa.gov/og-image.jpg",
    linkSiteName: "NASA Climate",
    linkFavicon: "https://climate.nasa.gov/favicon.ico",
    processingStatus: "done",
    connectedStacksCount: 5,
  },
  {
    id: "block-3",
    kind: "block",
    blockType: "text",
    title: "Research Notes: Carbon Cycle",
    textContent: "# Key Findings\\n\\nThe carbon cycle is accelerating...",
    textFormat: "markdown",
    connectedStacksCount: 1,
    processingStatus: "done",
  },
  {
    id: "block-4",
    kind: "block",
    blockType: "video",
    title: "Climate 101: Documentary",
    videoUrl: "https://youtube.com/watch?v=example",
    videoProvider: "youtube",
    videoThumbnail: "/video-thumb.jpg",
    videoDuration: 3600,
    connectedStacksCount: 2,
    processingStatus: "done",
  },
  {
    id: "stack-embed-1",
    kind: "stack_embed",
    embedStack: {
      id: "stack-2",
      name: "Ocean Acidification Studies",
      slug: "ocean-acidification",
      description: "Related research on ocean pH changes",
      owner: { id: "user-2", name: "Alex Chen", username: "achen" },
      _count: { items: 8 },
    },
    note: "See this collection for related ocean research",
    addedBy: { id: "user-1", name: "Dr. Jane Smith" },
    addedAt: "2025-12-15",
  },
];

interface MockBlock {
  id: string;
  kind: "block" | "stack_embed";
  blockType?: "pdf" | "link" | "text" | "video" | "image" | "dataset";
  title?: string;
  file_url?: string;
  thumb_urls?: string[];
  linkUrl?: string;
  linkDescription?: string;
  linkImage?: string;
  linkSiteName?: string;
  linkFavicon?: string;
  textContent?: string;
  textFormat?: string;
  videoUrl?: string;
  videoProvider?: string;
  videoThumbnail?: string;
  videoDuration?: number;
  connectedStacksCount?: number;
  processingStatus?: string;
  embedStack?: {
    id: string;
    name: string;
    slug: string | null;
    description: string | null;
    owner: { id: string; name: string; username: string };
    _count: { items: number };
  };
  note?: string;
  addedBy?: { id: string; name: string };
  addedAt?: string;
}

const VISIBILITY_OPTIONS = [
  { value: "public_open", label: "Public Open", icon: Globe, description: "Anyone can view and add blocks" },
  { value: "public_closed", label: "Public", icon: Users, description: "Anyone can view; only collaborators can add" },
  { value: "unlisted", label: "Unlisted", icon: LinkIcon, description: "Only people with the link can view" },
  { value: "private", label: "Private", icon: Lock, description: "Only you and collaborators can access" },
];

const EXPORT_FORMATS = [
  { format: "json", label: "JSON", icon: FileJsonIcon, description: "Full data export for automation" },
  { format: "md", label: "Markdown", icon: FileTextIcon, description: "Readable document format" },
  { format: "bibtex", label: "BibTeX", icon: BookOpen, description: "Academic citation format" },
];

const CITATION_INTENTS = [
  { value: "supports", label: "Supports", color: "bg-green-100 text-green-700 border-green-300" },
  { value: "refutes", label: "Refutes", color: "bg-red-100 text-red-700 border-red-300" },
  { value: "context", label: "Context", color: "bg-blue-100 text-blue-700 border-blue-300" },
  { value: "example", label: "Example", color: "bg-purple-100 text-purple-700 border-purple-300" },
  { value: "methodology", label: "Methodology", color: "bg-amber-100 text-amber-700 border-amber-300" },
];

const MOCK_CITATIONS = [
  {
    id: "cit-1",
    locator: "p. 42",
    quote: "Global temperatures have risen by 1.5°C since pre-industrial levels...",
    anchorType: "page",
    intent: "supports",
    source: { title: "IPCC Climate Report 2025", type: "pdf" },
  },
  {
    id: "cit-2",
    locator: "Chapter 3",
    quote: "Ocean acidification poses significant risks to marine ecosystems...",
    anchorType: "annotation",
    intent: "context",
    source: { title: "Marine Biology Review", type: "pdf" },
  },
  {
    id: "cit-3",
    locator: "00:15:32",
    quote: null,
    anchorType: "timestamp",
    intent: "example",
    source: { title: "Climate 101 Documentary", type: "video" },
  },
];

const PHASES = [
  {
    id: "foundational",
    title: "Foundational Features",
    description: "Core stack functionality",
    features: [
      {
        id: "stack-crud",
        title: "Stack Management",
        description: "Create, edit, and organize document collections",
        icon: FolderOpen,
        status: "complete" as const,
        items: ["Create stacks with name & description", "Edit stack settings", "Delete stacks", "Hierarchical organization"],
      },
      {
        id: "pdf-upload",
        title: "PDF Upload & Viewer",
        description: "Upload PDFs with automatic thumbnail generation",
        icon: FileText,
        status: "complete" as const,
        items: ["Multi-file upload", "Automatic thumbnails", "Full-screen PDF viewer", "Page navigation"],
      },
      {
        id: "ordering",
        title: "Drag-and-Drop Ordering",
        description: "Reorder documents within stacks visually",
        icon: GripVertical,
        status: "complete" as const,
        items: ["dnd-kit integration", "Optimistic updates", "Persistent ordering", "Touch support"],
      },
      {
        id: "discussion",
        title: "Stack Discussions",
        description: "FeedPost-based comment threads on stacks",
        icon: MessageSquare,
        status: "complete" as const,
        items: ["Threaded comments", "Citation attachments", "Lift to deliberation", "Real-time updates"],
      },
      {
        id: "collaboration",
        title: "Collaborators & RBAC",
        description: "Role-based access control for team stacks",
        icon: UserPlus,
        status: "complete" as const,
        items: ["Owner/Editor/Viewer roles", "Add collaborators", "Remove access", "Role changes"],
      },
      {
        id: "subscriptions",
        title: "Stack Subscriptions",
        description: "Follow stacks for updates",
        icon: Bell,
        status: "complete" as const,
        items: ["Subscribe/unsubscribe", "Notification integration", "Subscriber counts", "Activity feeds"],
      },
    ],
  },
  {
    id: "phase1",
    title: "Phase 1: Are.na Parity",
    description: "Multi-stack connections and content diversity",
    features: [
      {
        id: "stack-item",
        title: "StackItem Join Table",
        description: "Blocks can appear in unlimited stacks",
        icon: Link2,
        status: "complete" as const,
        items: ["Many-to-many block↔stack", "Connection metadata", "Position-based ordering", "No array rewrites"],
      },
      {
        id: "block-types",
        title: "Block Types",
        description: "Support for multiple content types",
        icon: Layers,
        status: "complete" as const,
        items: ["PDF documents", "Link blocks with OG", "Text/Markdown notes", "Video embeds"],
      },
      {
        id: "connect-ui",
        title: "Connect UI & Contexts",
        description: "Add blocks to multiple stacks with context tracking",
        icon: Network,
        status: "complete" as const,
        items: ["Connect modal", "Contexts panel", "Connection count badges", "Cross-stack discovery"],
      },
      {
        id: "stack-embeds",
        title: "Stack Embeds",
        description: "Embed stacks within other stacks",
        icon: FolderIcon,
        status: "complete" as const,
        items: ["Embedded stack cards", "Notes on embeds", "Circular prevention", "Nested navigation"],
      },
      {
        id: "visibility",
        title: "Visibility Modes",
        description: "Granular access control",
        icon: Eye,
        status: "complete" as const,
        items: ["Public open", "Public closed", "Private", "Unlisted (link-only)"],
      },
      {
        id: "exports",
        title: "Export Functionality",
        description: "Export stacks in various formats",
        icon: Download,
        status: "complete" as const,
        items: ["JSON export", "Markdown export", "BibTeX bibliography", "ZIP archives"],
      },
    ],
  },
  {
    id: "phase2",
    title: "Phase 2: Evidence UX",
    description: "Executable citations and evidence workflows",
    features: [
      {
        id: "citation-anchors",
        title: "Citation Anchors",
        description: "Click citations to jump to exact locations",
        icon: Highlighter,
        status: "complete" as const,
        items: ["PDF page anchors", "Annotation anchors", "Video timestamps", "Text range anchors"],
      },
      {
        id: "lift-citations",
        title: "Lift Carries Citations",
        description: "Comments keep citations when lifted to deliberations",
        icon: ArrowUp,
        status: "complete" as const,
        items: ["Auto-copy citations", "Source preservation", "Evidence chain", "Citation count hint"],
      },
      {
        id: "citation-intent",
        title: "Citation Intent",
        description: "Semantic meaning for citations",
        icon: Quote,
        status: "complete" as const,
        items: ["Supports", "Refutes", "Context", "Example/Methodology"],
      },
    ],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENTS - PART 1
// ─────────────────────────────────────────────────────────────────────────────

function FeatureCard({ feature }: { feature: typeof PHASES[0]["features"][0] }) {
  const Icon = feature.icon;
  
  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-indigo-100 text-indigo-700">
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

function StackPreviewCard() {
  const [visibility, setVisibility] = useState<string>("public_closed");
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FolderOpen className="w-5 h-5" />
          Stack Preview
        </CardTitle>
        <CardDescription>
          Interactive stack header with visibility controls
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Stack Header */}
        <div className="border rounded-lg p-4 bg-gradient-to-br from-slate-50 to-slate-100">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-xl font-semibold">{MOCK_STACK.name}</h3>
              <p className="text-sm text-muted-foreground mt-1">{MOCK_STACK.description}</p>
              <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  {MOCK_STACK._count.items} items
                </span>
                <span className="flex items-center gap-1">
                  <Bell className="w-4 h-4" />
                  {MOCK_STACK._count.subscribers} subscribers
                </span>
                <span className="flex items-center gap-1">
                  <MessageSquare className="w-4 h-4" />
                  {MOCK_STACK._count.comments} comments
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                by {MOCK_STACK.owner.name}
              </Badge>
            </div>
          </div>
        </div>
        
        {/* Visibility Selector */}
        <div>
          <p className="text-sm font-medium mb-2">Visibility Mode:</p>
          <div className="grid grid-cols-2 gap-2">
            {VISIBILITY_OPTIONS.map((opt) => {
              const Icon = opt.icon;
              const isSelected = visibility === opt.value;
              return (
                <button
                  key={opt.value}
                  onClick={() => {
                    setVisibility(opt.value);
                    toast.success(`Visibility changed to ${opt.label}`);
                  }}
                  className={`flex items-start gap-3 p-3 rounded-lg border text-left transition-all ${
                    isSelected
                      ? "border-indigo-500 bg-indigo-50 ring-2 ring-indigo-200"
                      : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  <Icon className={`w-4 h-4 mt-0.5 ${isSelected ? "text-indigo-600" : "text-slate-500"}`} />
                  <div>
                    <p className={`text-sm font-medium ${isSelected ? "text-indigo-700" : ""}`}>{opt.label}</p>
                    <p className="text-xs text-muted-foreground">{opt.description}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
        
        {/* Collaborators */}
        <div>
          <p className="text-sm font-medium mb-2">Collaborators:</p>
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="bg-amber-50 border-amber-200 text-amber-700">
              {MOCK_STACK.owner.name} (Owner)
            </Badge>
            {MOCK_STACK.collaborators.map((c) => (
              <Badge key={c.id} variant="outline" className="bg-slate-50">
                {c.name} ({c.role})
              </Badge>
            ))}
            <Button variant="ghost" size="sm" className="h-6 text-xs">
              <UserPlus className="w-3 h-3 mr-1" />
              Add
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function BlockTypesDemo() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Layers className="w-5 h-5" />
          Block Types
          <Badge className="ml-2 bg-indigo-600 text-xs">Phase 1.2</Badge>
        </CardTitle>
        <CardDescription>
          Support for multiple content types beyond PDFs
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3">
          {/* PDF Block */}
          <div className="border rounded-lg overflow-hidden hover:border-indigo-300 transition-colors">
            <div className="aspect-[4/3] bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center">
              <FileText className="w-12 h-12 text-red-400" />
            </div>
            <div className="p-3">
              <Badge variant="outline" className="mb-2 text-xs bg-red-50 text-red-700 border-red-200">PDF</Badge>
              <p className="font-medium text-sm truncate">IPCC Climate Report 2025</p>
              <p className="text-xs text-muted-foreground">42 pages • 3.2 MB</p>
            </div>
          </div>
          
          {/* Link Block */}
          <div className="border rounded-lg overflow-hidden hover:border-indigo-300 transition-colors">
            <div className="aspect-[4/3] bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center">
              <ExternalLink className="w-12 h-12 text-blue-400" />
            </div>
            <div className="p-3">
              <Badge variant="outline" className="mb-2 text-xs bg-blue-50 text-blue-700 border-blue-200">Link</Badge>
              <p className="font-medium text-sm truncate">NASA Climate Portal</p>
              <p className="text-xs text-muted-foreground">climate.nasa.gov</p>
            </div>
          </div>
          
          {/* Text Block */}
          <div className="border rounded-lg overflow-hidden hover:border-indigo-300 transition-colors">
            <div className="aspect-[4/3] bg-gradient-to-br from-emerald-50 to-emerald-100 flex items-center justify-center p-3">
              <div className="text-xs text-emerald-600 font-mono line-clamp-4">
                # Research Notes<br/>
                The carbon cycle...<br/>
                - Key finding 1<br/>
                - Key finding 2
              </div>
            </div>
            <div className="p-3">
              <Badge variant="outline" className="mb-2 text-xs bg-emerald-50 text-emerald-700 border-emerald-200">Text</Badge>
              <p className="font-medium text-sm truncate">Research Notes</p>
              <p className="text-xs text-muted-foreground">Markdown • 245 words</p>
            </div>
          </div>
          
          {/* Video Block */}
          <div className="border rounded-lg overflow-hidden hover:border-indigo-300 transition-colors">
            <div className="aspect-[4/3] bg-gradient-to-br from-purple-50 to-purple-100 flex items-center justify-center relative">
              <VideoIcon className="w-12 h-12 text-purple-400" />
              <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-1.5 py-0.5 rounded">
                1:02:30
              </div>
            </div>
            <div className="p-3">
              <Badge variant="outline" className="mb-2 text-xs bg-purple-50 text-purple-700 border-purple-200">Video</Badge>
              <p className="font-medium text-sm truncate">Climate 101 Documentary</p>
              <p className="text-xs text-muted-foreground">YouTube • 1h 2m</p>
            </div>
          </div>
        </div>
        
        {/* Add Block Button Demo */}
        <div className="mt-4 border-t pt-4">
          <p className="text-sm font-medium mb-2">StackComposer Actions:</p>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => toast.info("Opening file picker...")}>
              <FileText className="w-3 h-3 mr-1" />
              Add PDF
            </Button>
            <Button variant="outline" size="sm" onClick={() => toast.info("Opening link dialog...")}>
              <LinkIcon className="w-3 h-3 mr-1" />
              Add Link
            </Button>
            <Button variant="outline" size="sm" onClick={() => toast.info("Opening note editor...")}>
              <FileTextIcon className="w-3 h-3 mr-1" />
              Add Note
            </Button>
            <Button variant="outline" size="sm" onClick={() => toast.info("Opening video dialog...")}>
              <VideoIcon className="w-3 h-3 mr-1" />
              Add Video
            </Button>
            <Button variant="outline" size="sm" onClick={() => toast.info("Opening embed picker...")}>
              <FolderIcon className="w-3 h-3 mr-1" />
              Embed Stack
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ConnectionsDemo() {
  const [selectedBlock, setSelectedBlock] = useState<string | null>(null);
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Link2 className="w-5 h-5" />
          Multi-Stack Connections
          <Badge className="ml-2 bg-indigo-600 text-xs">Phase 1.1 & 1.3</Badge>
        </CardTitle>
        <CardDescription>
          Blocks can appear in unlimited stacks with context tracking
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Connection Count Badges */}
        <div>
          <p className="text-sm font-medium mb-2">Connection Indicators:</p>
          <div className="flex flex-wrap gap-3">
            {MOCK_BLOCKS.filter(b => b.kind === "block").slice(0, 3).map((block) => (
              <div
                key={block.id}
                onClick={() => setSelectedBlock(block.id)}
                className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-colors ${
                  selectedBlock === block.id
                    ? "border-indigo-500 bg-indigo-50"
                    : "border-slate-200 hover:border-slate-300"
                }`}
              >
                <FileText className="w-4 h-4 text-slate-500" />
                <span className="text-sm font-medium truncate max-w-[120px]">{block.title}</span>
                <Badge variant="secondary" className="text-xs">
                  <Link2 className="w-3 h-3 mr-1" />
                  {block.connectedStacksCount}
                </Badge>
              </div>
            ))}
          </div>
        </div>
        
        {/* Contexts Panel Preview */}
        {selectedBlock && (
          <div className="border rounded-lg p-4 bg-slate-50">
            <div className="flex items-center gap-2 mb-3">
              <Link2 className="w-4 h-4 text-indigo-600" />
              <span className="font-medium text-sm">Connections for &ldquo;{MOCK_BLOCKS.find(b => b.id === selectedBlock)?.title}&rdquo;</span>
            </div>
            <div className="space-y-2">
              {["Climate Research Collection", "Policy Papers 2025", "Teaching Resources"].slice(0, MOCK_BLOCKS.find(b => b.id === selectedBlock)?.connectedStacksCount || 1).map((stackName, i) => (
                <div key={i} className="flex items-center justify-between p-2 bg-white rounded border">
                  <div>
                    <p className="text-sm font-medium">{stackName}</p>
                    <p className="text-xs text-muted-foreground">by Dr. Jane Smith • 12 items</p>
                  </div>
                  <ExternalLink className="w-4 h-4 text-muted-foreground" />
                </div>
              ))}
            </div>
            <Button variant="ghost" size="sm" className="mt-3 w-full" onClick={() => toast.info("Opening connect modal...")}>
              <PlusCircle className="w-3 h-3 mr-1" />
              Connect to Another Stack
            </Button>
          </div>
        )}
        
        {/* StackItem Benefits */}
        <div className="border-t pt-4">
          <p className="text-sm font-medium mb-2">StackItem Join Table Benefits:</p>
          <ul className="space-y-1.5 text-sm text-slate-600">
            <li className="flex items-center gap-2">
              <Check className="w-4 h-4 text-green-500" />
              One block can appear in unlimited stacks
            </li>
            <li className="flex items-center gap-2">
              <Check className="w-4 h-4 text-green-500" />
              Connection metadata (who added, when, notes)
            </li>
            <li className="flex items-center gap-2">
              <Check className="w-4 h-4 text-green-500" />
              No array rewrite on reorder (position field)
            </li>
            <li className="flex items-center gap-2">
              <Check className="w-4 h-4 text-green-500" />
              Concurrency-safe updates
            </li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}

function StackEmbedsDemo() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FolderIcon className="w-5 h-5" />
          Stack Embeds
          <Badge className="ml-2 bg-indigo-600 text-xs">Phase 1.4</Badge>
        </CardTitle>
        <CardDescription>
          Stacks can contain other stacks as embedded items
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Embedded Stack Card Preview */}
        <div className="border-2 border-dashed rounded-lg p-4 bg-gradient-to-br from-indigo-50/70 to-purple-50/70 hover:border-indigo-400 transition-colors cursor-pointer">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-lg bg-indigo-100 text-indigo-600">
              <FolderIcon className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold">Ocean Acidification Studies</h3>
                <ExternalLink className="w-3.5 h-3.5 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground">by Alex Chen • 8 items</p>
              <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                Related research on ocean pH changes and marine ecosystem impacts
              </p>
              <p className="mt-2 text-sm italic text-muted-foreground border-l-2 border-indigo-200 pl-2">
                &ldquo;See this collection for related ocean research&rdquo;
              </p>
            </div>
          </div>
        </div>
        
        {/* Embed Actions */}
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => toast.info("Opening stack picker...")}>
            <FolderIcon className="w-3 h-3 mr-1" />
            Embed Stack
          </Button>
          <Button variant="ghost" size="sm" onClick={() => toast.info("Stack embed cards show preview + item count")}>
            Learn More
          </Button>
        </div>
        
        {/* Circular Prevention */}
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="text-xs text-amber-700">
            <strong>⚠️ Circular Prevention:</strong> You cannot embed Stack A into Stack B if Stack B is already embedded in Stack A.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

function ExportDemo() {
  const [exporting, setExporting] = useState<string | null>(null);

  const handleExport = async (format: string) => {
    setExporting(format);
    await new Promise(resolve => setTimeout(resolve, 1000));
    toast.success(`Export Ready: ${format.toUpperCase()}`, {
      description: `API endpoint: /api/stacks/{id}/export?format=${format}`,
    });
    setExporting(null);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Download className="w-5 h-5" />
          Export Functionality
          <Badge className="ml-2 bg-indigo-600 text-xs">Phase 1.6</Badge>
        </CardTitle>
        <CardDescription>
          Export stacks in various formats for portability
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-3">
          {EXPORT_FORMATS.map((format) => {
            const Icon = format.icon;
            const isLoading = exporting === format.format;
            return (
              <button
                key={format.format}
                disabled={isLoading}
                onClick={() => handleExport(format.format)}
                className="flex flex-col items-center gap-2 p-4 border rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50"
              >
                <div className="p-3 rounded-full bg-slate-100">
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin" />
                  ) : (
                    <Icon className="w-5 h-5 text-slate-600" />
                  )}
                </div>
                <span className="font-medium text-sm">{format.label}</span>
                <span className="text-xs text-muted-foreground text-center">{format.description}</span>
              </button>
            );
          })}
        </div>
        
        <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-xs text-green-700">
            <strong>✅ Fully Implemented:</strong> Export services at{" "}
            <code className="bg-green-100 px-1 rounded">/api/stacks/[id]/export</code>
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENTS - PART 2: EVIDENCE UX (Phase 2)
// ─────────────────────────────────────────────────────────────────────────────

function CitationAnchorsDemo() {
  const [selectedCitation, setSelectedCitation] = useState<typeof MOCK_CITATIONS[0] | null>(null);
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Highlighter className="w-5 h-5" />
          Citation Anchors
          <Badge className="ml-2 bg-indigo-600 text-xs">Phase 2.1</Badge>
        </CardTitle>
        <CardDescription>
          Click citations to jump to exact locations in source documents
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Anchor Types */}
        <div>
          <p className="text-sm font-medium mb-3">Anchor Types:</p>
          <div className="grid grid-cols-2 gap-2">
            {[
              { type: "page", icon: FileText, label: "Page Anchor", desc: "Jump to specific page in PDF" },
              { type: "annotation", icon: Highlighter, label: "Annotation Anchor", desc: "Navigate to highlighted region" },
              { type: "timestamp", icon: VideoIcon, label: "Timestamp Anchor", desc: "Seek to video time" },
              { type: "text_range", icon: Quote, label: "Text Range", desc: "Select exact text passage" },
            ].map((anchor) => (
              <div
                key={anchor.type}
                className="flex items-start gap-2 p-3 border rounded-lg bg-slate-50"
              >
                <anchor.icon className="w-4 h-4 text-indigo-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium">{anchor.label}</p>
                  <p className="text-xs text-muted-foreground">{anchor.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Interactive Citation Cards */}
        <div className="border-t pt-4">
          <p className="text-sm font-medium mb-3">Click a citation to navigate:</p>
          <div className="space-y-2">
            {MOCK_CITATIONS.map((cit) => {
              const intentStyle = CITATION_INTENTS.find(i => i.value === cit.intent);
              return (
                <button
                  key={cit.id}
                  onClick={() => {
                    setSelectedCitation(cit);
                    toast.info(`Navigating to ${cit.source.title}`, {
                      description: cit.anchorType === "page" 
                        ? `Opening PDF at ${cit.locator}`
                        : cit.anchorType === "timestamp"
                        ? `Seeking video to ${cit.locator}`
                        : `Highlighting annotated region`,
                    });
                  }}
                  className={`w-full text-left p-3 rounded-lg border transition-all ${
                    selectedCitation?.id === cit.id
                      ? "border-indigo-500 bg-indigo-50 ring-2 ring-indigo-200"
                      : "hover:border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm">{cit.source.title}</span>
                        <Badge variant="outline" className="text-xs">
                          {cit.anchorType}
                        </Badge>
                        {intentStyle && (
                          <Badge className={`text-xs ${intentStyle.color}`}>
                            {intentStyle.label}
                          </Badge>
                        )}
                      </div>
                      {cit.quote && (
                        <p className="text-xs text-muted-foreground italic line-clamp-2">
                          &ldquo;{cit.quote}&rdquo;
                        </p>
                      )}
                      <p className="text-xs text-indigo-600 mt-1">
                        📍 {cit.locator}
                      </p>
                    </div>
                    <ArrowUpRight className="w-4 h-4 text-muted-foreground" />
                  </div>
                </button>
              );
            })}
          </div>
        </div>
        
        {/* Navigation Preview */}
        {selectedCitation && (
          <div className="p-4 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-lg border border-indigo-200">
            <p className="text-sm font-medium text-indigo-700 mb-2">Navigation Target:</p>
            <div className="bg-white rounded p-3 shadow-sm">
              <div className="flex items-center gap-2">
                {selectedCitation.source.type === "pdf" ? (
                  <FileText className="w-5 h-5 text-red-500" />
                ) : (
                  <VideoIcon className="w-5 h-5 text-purple-500" />
                )}
                <span className="font-medium">{selectedCitation.source.title}</span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {selectedCitation.anchorType === "page" && "→ PdfLightbox opens at page 42"}
                {selectedCitation.anchorType === "annotation" && "→ PDF opens with highlight overlay on annotation rect"}
                {selectedCitation.anchorType === "timestamp" && "→ Video player seeks to 00:15:32"}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function LiftWithCitationsDemo() {
  const [lifting, setLifting] = useState(false);
  const [liftResult, setLiftResult] = useState<{ success: boolean; citationsCopied: number } | null>(null);
  
  const simulateLift = async () => {
    setLifting(true);
    setLiftResult(null);
    await new Promise(resolve => setTimeout(resolve, 1500));
    setLiftResult({ success: true, citationsCopied: 3 });
    setLifting(false);
    toast.success("Comment lifted to deliberation!", {
      description: "3 citations were automatically copied to the new claim",
    });
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ArrowUp className="w-5 h-5" />
          Lift Carries Citations
          <Badge className="ml-2 bg-indigo-600 text-xs">Phase 2.2</Badge>
        </CardTitle>
        <CardDescription>
          When comments are lifted to deliberations, citations come along
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Comment with Citations */}
        <div className="border rounded-lg p-4 bg-slate-50">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-semibold text-sm">
              JS
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-medium text-sm">Dr. Jane Smith</span>
                <span className="text-xs text-muted-foreground">2 hours ago</span>
              </div>
              <p className="text-sm text-slate-700 mb-3">
                The evidence strongly suggests that immediate policy action is required. 
                The IPCC report clearly states that we&apos;re approaching critical thresholds.
              </p>
              
              {/* Attached Citations */}
              <div className="space-y-1 mb-3">
                <p className="text-xs font-medium text-muted-foreground">Attached Citations:</p>
                {MOCK_CITATIONS.slice(0, 2).map((cit) => (
                  <div key={cit.id} className="flex items-center gap-2 text-xs bg-white p-2 rounded border">
                    <FileText className="w-3 h-3 text-slate-500" />
                    <span>{cit.source.title}</span>
                    <Badge variant="outline" className="text-xs scale-90">{cit.locator}</Badge>
                  </div>
                ))}
              </div>
              
              {/* Lift Button */}
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant={liftResult?.success ? "outline" : "default"}
                  className={liftResult?.success ? "bg-green-50 text-green-700 border-green-300" : ""}
                  disabled={lifting || liftResult?.success}
                  onClick={simulateLift}
                >
                  {lifting ? (
                    <>
                      <div className="w-3 h-3 border-2 border-white/50 border-t-white rounded-full animate-spin mr-1" />
                      Lifting...
                    </>
                  ) : liftResult?.success ? (
                    <>
                      <Check className="w-3 h-3 mr-1" />
                      Lifted with {liftResult.citationsCopied} citations
                    </>
                  ) : (
                    <>
                      <ArrowUp className="w-3 h-3 mr-1" />
                      Deliberate
                      <span className="ml-1 flex items-center gap-0.5 opacity-70">
                        <FileText className="w-3 h-3" />2
                      </span>
                    </>
                  )}
                </Button>
                {!liftResult?.success && (
                  <span className="text-xs text-muted-foreground">
                    Citations will be copied to the new claim
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
        
        {/* Flow Diagram */}
        <div className="border-t pt-4">
          <p className="text-sm font-medium mb-3">Evidence Flow:</p>
          <div className="flex items-center gap-2">
            <div className="flex-1 p-3 border rounded-lg text-center">
              <MessageSquare className="w-5 h-5 mx-auto mb-1 text-slate-600" />
              <p className="text-xs font-medium">Stack Comment</p>
              <p className="text-xs text-muted-foreground">with citations</p>
            </div>
            <ArrowUpRight className="w-5 h-5 text-indigo-500" />
            <div className="flex-1 p-3 border rounded-lg text-center border-indigo-300 bg-indigo-50">
              <Quote className="w-5 h-5 mx-auto mb-1 text-indigo-600" />
              <p className="text-xs font-medium text-indigo-700">Deliberation Claim</p>
              <p className="text-xs text-indigo-600">citations preserved</p>
            </div>
          </div>
        </div>
        
        {/* Benefits */}
        <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-xs text-green-700">
            <strong>✅ Evidence Chain Preserved:</strong> The lift API at{" "}
            <code className="bg-green-100 px-1 rounded">/api/comments/lift</code>{" "}
            automatically copies all attached citations to the new claim, maintaining the evidence trail.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

function CitationIntentDemo() {
  const [selectedIntent, setSelectedIntent] = useState<string>("supports");
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Quote className="w-5 h-5" />
          Citation Intent
          <Badge className="ml-2 bg-indigo-600 text-xs">Phase 2.3</Badge>
        </CardTitle>
        <CardDescription>
          Semantic meaning for why a source is cited
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Intent Selector */}
        <div>
          <p className="text-sm font-medium mb-3">Select citation intent:</p>
          <div className="flex flex-wrap gap-2">
            {CITATION_INTENTS.map((intent) => (
              <button
                key={intent.value}
                onClick={() => {
                  setSelectedIntent(intent.value);
                  toast.info(`Intent: ${intent.label}`, {
                    description: getIntentDescription(intent.value),
                  });
                }}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                  selectedIntent === intent.value
                    ? `${intent.color} ring-2 ring-offset-1`
                    : "bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200"
                }`}
              >
                {intent.label}
              </button>
            ))}
          </div>
        </div>
        
        {/* Intent Visualization */}
        <div className="border rounded-lg p-4">
          <div className="flex items-start gap-4">
            <div className="flex-1">
              <p className="text-sm font-medium mb-2">Claim:</p>
              <div className="p-3 bg-slate-50 rounded border">
                <p className="text-sm">
                  &ldquo;Immediate climate action is economically beneficial in the long term.&rdquo;
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 pt-8">
              <Badge className={CITATION_INTENTS.find(i => i.value === selectedIntent)?.color}>
                {selectedIntent}
              </Badge>
              <ArrowUpRight className="w-4 h-4 text-slate-400" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium mb-2">Source:</p>
              <div className="p-3 bg-slate-50 rounded border">
                <div className="flex items-center gap-2 mb-1">
                  <FileText className="w-4 h-4 text-red-500" />
                  <span className="text-sm font-medium">Economic Impact Study 2025</span>
                </div>
                <p className="text-xs text-muted-foreground">p. 15-23</p>
              </div>
            </div>
          </div>
          
          <div className="mt-4 p-3 bg-slate-50 rounded">
            <p className="text-sm text-slate-700">
              <strong className="text-indigo-600">{selectedIntent.charAt(0).toUpperCase() + selectedIntent.slice(1)}:</strong>{" "}
              {getIntentDescription(selectedIntent)}
            </p>
          </div>
        </div>
        
        {/* Intent Usage Stats */}
        <div className="border-t pt-4">
          <p className="text-sm font-medium mb-2">Intent Distribution in Evidence:</p>
          <div className="space-y-2">
            {CITATION_INTENTS.map((intent, i) => {
              const percentage = [45, 25, 15, 10, 5][i];
              return (
                <div key={intent.value} className="flex items-center gap-3">
                  <Badge className={`text-xs w-24 justify-center ${intent.color}`}>
                    {intent.label}
                  </Badge>
                  <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-indigo-500 rounded-full transition-all"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground w-10">{percentage}%</span>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function getIntentDescription(intent: string): string {
  switch (intent) {
    case "supports":
      return "This source provides evidence that strengthens or validates the claim.";
    case "refutes":
      return "This source provides counter-evidence or challenges the claim.";
    case "context":
      return "This source provides background information or broader context.";
    case "example":
      return "This source provides a concrete example or case study.";
    case "methodology":
      return "This source describes the methods or approach used.";
    default:
      return "";
  }
}

function DiscussionDemo() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5" />
          Stack Discussions
          <Badge variant="outline" className="ml-2 text-xs">Foundational</Badge>
        </CardTitle>
        <CardDescription>
          FeedPost-based comment threads with citation support
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Thread Preview */}
        <div className="border rounded-lg divide-y">
          {[
            {
              author: "Dr. Jane Smith",
              initials: "JS",
              time: "2 hours ago",
              text: "The methodology section in Chapter 3 raises important questions about sample size.",
              citations: 1,
            },
            {
              author: "Alex Chen",
              initials: "AC",
              time: "1 hour ago",
              text: "I agree. The follow-up study addresses some of these concerns.",
              citations: 2,
              isReply: true,
            },
            {
              author: "Maria Garcia",
              initials: "MG",
              time: "30 min ago",
              text: "Should we lift this to the main deliberation?",
              citations: 0,
              isReply: true,
            },
          ].map((comment, i) => (
            <div key={i} className={`p-3 ${comment.isReply ? "pl-8 bg-slate-50" : ""}`}>
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-semibold text-xs">
                  {comment.initials}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-medium text-sm">{comment.author}</span>
                    <span className="text-xs text-muted-foreground">{comment.time}</span>
                  </div>
                  <p className="text-sm text-slate-700">{comment.text}</p>
                  <div className="flex items-center gap-2 mt-2">
                    {comment.citations > 0 && (
                      <Badge variant="secondary" className="text-xs">
                        <FileText className="w-3 h-3 mr-1" />
                        {comment.citations} citation{comment.citations > 1 ? "s" : ""}
                      </Badge>
                    )}
                    <Button variant="ghost" size="sm" className="h-6 text-xs">
                      Reply
                    </Button>
                    <Button variant="ghost" size="sm" className="h-6 text-xs">
                      <ArrowUp className="w-3 h-3 mr-1" />
                      Deliberate
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {/* Composer Preview */}
        <div className="border rounded-lg p-3 bg-slate-50">
          <div className="flex items-center gap-2 mb-2">
            <MessageSquare className="w-4 h-4 text-slate-500" />
            <span className="text-sm font-medium">Add to discussion</span>
          </div>
          <div className="bg-white border rounded p-2 text-sm text-muted-foreground">
            Write your comment... (supports markdown, citations, @mentions)
          </div>
          <div className="flex items-center gap-2 mt-2">
            <Button variant="outline" size="sm" className="text-xs">
              <Quote className="w-3 h-3 mr-1" />
              Add Citation
            </Button>
            <Button variant="outline" size="sm" className="text-xs">
              <FileText className="w-3 h-3 mr-1" />
              Cite from Stack
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function DragDropDemo() {
  const [items, setItems] = useState(["IPCC Report 2025", "NASA Climate Portal", "Research Notes"]);
  
  const moveItem = (from: number, to: number) => {
    const newItems = [...items];
    const [removed] = newItems.splice(from, 1);
    newItems.splice(to, 0, removed);
    setItems(newItems);
    toast.info("Order updated", { description: "Changes saved automatically" });
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <GripVertical className="w-5 h-5" />
          Drag-and-Drop Ordering
          <Badge variant="outline" className="ml-2 text-xs">Foundational</Badge>
        </CardTitle>
        <CardDescription>
          Reorder documents within stacks visually (using @dnd-kit)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          {items.map((item, i) => (
            <div
              key={item}
              className="flex items-center gap-3 p-3 border rounded-lg bg-white hover:border-indigo-300 transition-colors"
            >
              <GripVertical className="w-4 h-4 text-slate-400 cursor-grab" />
              <span className="flex-1 text-sm font-medium">{item}</span>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  disabled={i === 0}
                  onClick={() => moveItem(i, i - 1)}
                >
                  ↑
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  disabled={i === items.length - 1}
                  onClick={() => moveItem(i, i + 1)}
                >
                  ↓
                </Button>
              </div>
            </div>
          ))}
        </div>
        
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-xs text-blue-700">
            <strong>⚡ Optimistic Updates:</strong> Drag operations update locally first, 
            then sync with server via <code className="bg-blue-100 px-1 rounded">setStackOrder</code> action.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
// ─────────────────────────────────────────────────────────────────────────────
// MAIN PAGE COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export default function StacksFeaturesPage() {
  return (
    <TooltipProvider>
      <Toaster position="top-right" />
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
        {/* Header */}
        <div className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-indigo-100 text-indigo-700">
                  <Layers className="w-6 h-6" />
                </div>
                <div>
                  <h1 className="text-xl font-bold">Stacks Features Demo</h1>
                  <p className="text-sm text-muted-foreground">
                    Foundational + Phase 1-2 Improvements
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  <Check className="w-3 h-3 mr-1" />
                  All Features Complete
                </Badge>
              </div>
            </div>
          </div>
        </div>
        
        {/* Content */}
        <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
          {/* Introduction */}
          <Card className="bg-gradient-to-br from-indigo-50 to-purple-50 border-indigo-100">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-xl bg-white shadow-sm">
                  <Layers className="w-8 h-8 text-indigo-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-indigo-900">Stacks/Library System</h2>
                  <p className="text-indigo-700 mt-1">
                    Document management and knowledge organization infrastructure with deep deliberation integration.
                    Curate collections of PDFs, links, notes, and videos. Connect blocks across multiple stacks.
                    Cite sources with executable references. Export for portability.
                  </p>
                  <div className="flex gap-4 mt-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-indigo-600">15+</p>
                      <p className="text-xs text-indigo-600">Features</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-indigo-600">3</p>
                      <p className="text-xs text-indigo-600">Phases</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-indigo-600">6</p>
                      <p className="text-xs text-indigo-600">Block Types</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Tabs */}
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="w-full justify-start bg-white border p-1 h-auto flex-wrap">
              <TabsTrigger value="overview" className="text-sm">Overview</TabsTrigger>
              <TabsTrigger value="blocks" className="text-sm">Block Types</TabsTrigger>
              <TabsTrigger value="connections" className="text-sm">Connections</TabsTrigger>
              <TabsTrigger value="evidence" className="text-sm">Evidence UX</TabsTrigger>
              <TabsTrigger value="exports" className="text-sm">Exports</TabsTrigger>
            </TabsList>
            
            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              {PHASES.map((phase) => (
                <div key={phase.id}>
                  <div className="flex items-center gap-3 mb-4">
                    <h3 className="text-lg font-semibold">{phase.title}</h3>
                    <Badge variant="outline">{phase.description}</Badge>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {phase.features.map((feature) => (
                      <FeatureCard key={feature.id} feature={feature} />
                    ))}
                  </div>
                </div>
              ))}
            </TabsContent>
            
            {/* Block Types Tab */}
            <TabsContent value="blocks" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <BlockTypesDemo />
                <StackEmbedsDemo />
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <StackPreviewCard />
                <DragDropDemo />
              </div>
            </TabsContent>
            
            {/* Connections Tab */}
            <TabsContent value="connections" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ConnectionsDemo />
                <StackEmbedsDemo />
              </div>
            </TabsContent>
            
            {/* Evidence UX Tab */}
            <TabsContent value="evidence" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <CitationAnchorsDemo />
                <LiftWithCitationsDemo />
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <CitationIntentDemo />
                <DiscussionDemo />
              </div>
            </TabsContent>
            
            {/* Exports Tab */}
            <TabsContent value="exports" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ExportDemo />
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Settings className="w-5 h-5" />
                      Implementation Reference
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4 text-sm">
                      <div>
                        <p className="font-semibold text-indigo-600 mb-2">Core Stack Components</p>
                        <ul className="space-y-1 font-mono text-xs text-slate-600">
                          <li className="flex items-center gap-1"><Check className="w-3 h-3 text-green-500" /> components/stack/SortablePdfGrid.tsx</li>
                          <li className="flex items-center gap-1"><Check className="w-3 h-3 text-green-500" /> components/stack/StackComposer.tsx</li>
                          <li className="flex items-center gap-1"><Check className="w-3 h-3 text-green-500" /> components/stack/StackDiscussion.tsx</li>
                          <li className="flex items-center gap-1"><Check className="w-3 h-3 text-green-500" /> components/stack/LiftToDebateButton.tsx</li>
                          <li className="flex items-center gap-1"><Check className="w-3 h-3 text-green-500" /> components/stack/CommentComposer.tsx</li>
                        </ul>
                      </div>
                      <div>
                        <p className="font-semibold text-indigo-600 mb-2">Phase 1 Components</p>
                        <ul className="space-y-1 font-mono text-xs text-slate-600">
                          <li className="flex items-center gap-1"><Check className="w-3 h-3 text-green-500" /> components/stack/ConnectButton.tsx</li>
                          <li className="flex items-center gap-1"><Check className="w-3 h-3 text-green-500" /> components/stack/ContextsPanel.tsx</li>
                          <li className="flex items-center gap-1"><Check className="w-3 h-3 text-green-500" /> components/stack/VisibilitySelector.tsx</li>
                          <li className="flex items-center gap-1"><Check className="w-3 h-3 text-green-500" /> components/stack/ExportButton.tsx</li>
                          <li className="flex items-center gap-1"><Check className="w-3 h-3 text-green-500" /> components/stack/blocks/StackEmbedCard.tsx</li>
                          <li className="flex items-center gap-1"><Check className="w-3 h-3 text-green-500" /> components/blocks/LinkBlockCard.tsx</li>
                          <li className="flex items-center gap-1"><Check className="w-3 h-3 text-green-500" /> components/blocks/TextBlockCard.tsx</li>
                        </ul>
                      </div>
                      <div>
                        <p className="font-semibold text-indigo-600 mb-2">API Routes</p>
                        <ul className="space-y-1 font-mono text-xs text-slate-600">
                          <li className="flex items-center gap-1"><Check className="w-3 h-3 text-green-500" /> /api/stacks/[id]/export</li>
                          <li className="flex items-center gap-1"><Check className="w-3 h-3 text-green-500" /> /api/blocks/[id]/contexts</li>
                          <li className="flex items-center gap-1"><Check className="w-3 h-3 text-green-500" /> /api/library/upload</li>
                          <li className="flex items-center gap-1"><Check className="w-3 h-3 text-green-500" /> /api/comments/lift</li>
                          <li className="flex items-center gap-1"><Check className="w-3 h-3 text-green-500" /> /api/citations/resolve</li>
                        </ul>
                      </div>
                      <div>
                        <p className="font-semibold text-indigo-600 mb-2">Server Actions</p>
                        <ul className="space-y-1 font-mono text-xs text-slate-600">
                          <li className="flex items-center gap-1"><Check className="w-3 h-3 text-green-500" /> lib/actions/stack.actions.ts</li>
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              {/* Full Implementation Reference Card */}
              <Card className="bg-slate-800 text-white">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="w-5 h-5" />
                    Complete Implementation Reference
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
                    <div>
                      <p className="font-semibold mb-2 text-indigo-300">Data Models</p>
                      <ul className="space-y-1 text-slate-300 font-mono text-xs">
                        <li className="flex items-center gap-1"><Check className="w-3 h-3 text-green-400" /> Stack</li>
                        <li className="flex items-center gap-1"><Check className="w-3 h-3 text-green-400" /> StackItem (join table)</li>
                        <li className="flex items-center gap-1"><Check className="w-3 h-3 text-green-400" /> LibraryPost</li>
                        <li className="flex items-center gap-1"><Check className="w-3 h-3 text-green-400" /> StackCollaborator</li>
                        <li className="flex items-center gap-1"><Check className="w-3 h-3 text-green-400" /> StackSubscription</li>
                        <li className="flex items-center gap-1"><Check className="w-3 h-3 text-green-400" /> Source</li>
                        <li className="flex items-center gap-1"><Check className="w-3 h-3 text-green-400" /> Citation</li>
                        <li className="flex items-center gap-1"><Check className="w-3 h-3 text-green-400" /> Annotation</li>
                      </ul>
                    </div>
                    <div>
                      <p className="font-semibold mb-2 text-indigo-300">Citation Infrastructure</p>
                      <ul className="space-y-1 text-slate-300 font-mono text-xs">
                        <li className="flex items-center gap-1"><Check className="w-3 h-3 text-green-400" /> lib/citations/navigation.ts</li>
                        <li className="flex items-center gap-1"><Check className="w-3 h-3 text-green-400" /> lib/citations/anchorTypes.ts</li>
                        <li className="flex items-center gap-1"><Check className="w-3 h-3 text-green-400" /> components/citations/CitationCard.tsx</li>
                        <li className="flex items-center gap-1"><Check className="w-3 h-3 text-green-400" /> components/citations/PdfNavigationListener.tsx</li>
                        <li className="flex items-center gap-1"><Check className="w-3 h-3 text-green-400" /> components/modals/PdfLightbox.tsx</li>
                      </ul>
                    </div>
                    <div>
                      <p className="font-semibold mb-2 text-indigo-300">Architecture Docs</p>
                      <ul className="space-y-1 text-slate-300 font-mono text-xs">
                        <li className="flex items-center gap-1"><Check className="w-3 h-3 text-green-400" /> STACKS_LIBRARY_SYSTEM_ARCHITECTURE.md</li>
                        <li className="flex items-center gap-1"><Check className="w-3 h-3 text-green-400" /> STACKS_IMPROVEMENT_PHASE_1.md</li>
                        <li className="flex items-center gap-1"><Check className="w-3 h-3 text-green-400" /> STACKS_IMPROVEMENT_PHASE_2.md</li>
                        <li className="flex items-center gap-1"><Check className="w-3 h-3 text-green-400" /> STACKS_IMPROVEMENT_PHASE_3.md</li>
                      </ul>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-slate-700">
                    <p className="text-xs text-slate-400">
                      <strong className="text-slate-300">Key Integration Points:</strong>{" "}
                      Stacks host deliberations via <code className="bg-slate-700 px-1 rounded">library_stack</code> host type •
                      Citations flow from stacks to arguments via Source model •
                      Evidence aggregation tracks source usage across deliberations
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
          
          {/* Footer */}
          <div className="text-center text-sm text-slate-500 pb-8">
            <p>Stacks Features Demo • Foundational + Phase 1-2 Complete • Mesh Platform</p>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
